import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase/server";

/* Admin placement control — the owner's on/off + fill-mode surface (0040).
   GET   → every placement with its serving config + a live booked count.
   PATCH → toggle a placement live/off, set its fill mode, or set its AdSense slot id.
   Admin-only; writes with the service role (ad_placements has no public write policy). */

const FILL_MODES = ["off", "direct_only", "adsense_only", "direct_then_adsense"] as const;

async function audit(
  db: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
  actor: string, action: string, target: string, meta: Record<string, unknown>,
) {
  try { await db.from("audit_log").insert({ actor, action, target, meta }); } catch { /* best-effort */ }
}

export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ ok: false, error: "service_not_configured" }, { status: 503 });

  const [{ data: placements }, { data: campaigns }] = await Promise.all([
    sb.from("ad_placements").select("*").order("sort"),
    sb.from("ad_campaigns").select("*"),
  ]);

  // Count campaigns actively serving per placement (approved + active). Pre-migration
  // review_status is absent (undefined) → grandfathered as approved.
  const booked: Record<string, number> = {};
  for (const c of campaigns || []) {
    const approved = c.review_status === undefined || c.review_status === "approved";
    if (c.status === "active" && approved) {
      booked[c.placement_key] = (booked[c.placement_key] || 0) + 1;
    }
  }
  const rows = (placements || []).map((p) => ({ ...p, booked: booked[p.key] || 0 }));
  return NextResponse.json({ ok: true, placements: rows });
}

export async function PATCH(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ ok: false, error: "service_not_configured" }, { status: 503 });

  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 }); }
  const key = String(b.key || "").trim();
  if (!key) return NextResponse.json({ ok: false, error: "key required" }, { status: 422 });

  const patch: Record<string, unknown> = {};
  if (typeof b.active === "boolean") patch.active = b.active;
  if (FILL_MODES.includes(String(b.fillMode) as (typeof FILL_MODES)[number])) patch.fill_mode = b.fillMode;
  if (b.adsenseSlot !== undefined) patch.adsense_slot = b.adsenseSlot ? String(b.adsenseSlot).slice(0, 60) : null;
  if (!Object.keys(patch).length) return NextResponse.json({ ok: false, error: "nothing_to_update" }, { status: 422 });

  const { error } = await sb.from("ad_placements").update(patch).eq("key", key);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  await audit(sb, gate.userId, "Update placement", key, patch);
  return NextResponse.json({ ok: true });
}
