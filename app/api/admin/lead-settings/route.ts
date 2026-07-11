import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { bustLeadCaptureCache, type LeadCaptureSurface } from "@/lib/lead-capture";
import { logAudit } from "@/lib/audit";

/* Admin per-surface lead-capture toggles (platform_settings.lead_capture_surfaces).
   The MASTER switch is the leadCapture flag on the Monetization tab; this route
   only writes the jsonb granularity {blog,hub,listing,popup}. Write-verified
   like app/api/settings (0-row update self-heals by inserting the singleton). */

const SURFACES: LeadCaptureSurface[] = ["blog", "hub", "listing", "popup"];

export async function POST(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });
  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ ok: false, error: "db_not_configured" }, { status: 503 });

  const body = (await req.json().catch(() => ({}))) as { surfaces?: Record<string, unknown> };
  if (!body.surfaces || typeof body.surfaces !== "object") {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  // Merge onto the current value so a partial patch never wipes other keys.
  const { data: row } = await admin.from("platform_settings").select("lead_capture_surfaces").eq("id", 1).maybeSingle();
  const current = ((row as { lead_capture_surfaces?: Record<string, boolean> } | null)?.lead_capture_surfaces) || {};
  const next: Record<string, boolean> = { blog: true, hub: true, listing: true, popup: true, ...current };
  for (const k of SURFACES) if (k in body.surfaces) next[k] = !!body.surfaces[k];

  const { data: updated, error } = await admin
    .from("platform_settings").update({ lead_capture_surfaces: next }).eq("id", 1).select("id");
  if (error) return NextResponse.json({ ok: false, error: "db_error", detail: error.message }, { status: 500 });
  if (!updated || updated.length === 0) {
    const { error: insErr } = await admin.from("platform_settings").insert({ id: 1, lead_capture_surfaces: next });
    if (insErr) return NextResponse.json({ ok: false, error: "not_persisted", detail: insErr.message }, { status: 500 });
  }
  bustLeadCaptureCache();
  await logAudit(admin, { actor: gate.userId, action: "Lead capture surfaces updated", target: "platform_settings", meta: next });
  return NextResponse.json({ ok: true, surfaces: next });
}
