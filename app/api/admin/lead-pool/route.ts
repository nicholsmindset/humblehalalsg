import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { LEAD_VERTICAL_IDS } from "@/lib/lead-verticals";
import { HHData } from "@/lib/data";

/* Admin rotation-pool management (owner's "add company" control).
   GET    → every business in the lead rotation (lead_preferences × businesses)
            with claimed state, last-routed, free-taste-used, contact_email.
   POST   → add/edit a business's rotation entry: verticals + areas (validated
            like the owner prefs route), active flag, and — for UNCLAIMED
            businesses — an admin-entered outreach contact_email (0066; never
            rendered publicly).
   DELETE → remove a business from rotation entirely.
   requireAdmin + audit-logged. */
export const dynamic = "force-dynamic";

const AREA_NAMES = new Set(HHData.areas.map((a) => a.name));

export async function GET(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: false, error: "service_not_configured" }, { status: 503 });

  // ?search= → business picker for "Add company" (name/slug contains).
  const search = (new URL(req.url).searchParams.get("search") || "").trim();
  if (search) {
    const safe = search.replace(/[%_,]/g, "").slice(0, 60);
    const { data } = await db
      .from("businesses")
      .select("id, name, slug, owner_id, claimed_by, area")
      .or(`name.ilike.%${safe}%,slug.ilike.%${safe}%`)
      .eq("status", "published")
      .limit(10);
    return NextResponse.json({
      ok: true,
      results: (data || []).map((b) => ({
        id: b.id, name: b.name, slug: b.slug, area: b.area,
        claimed: !!(b.owner_id || b.claimed_by),
      })),
    });
  }

  const { data: prefs } = await db
    .from("lead_preferences")
    .select("business_id, verticals, areas, active, updated_at")
    .order("updated_at", { ascending: false })
    .limit(300);
  const ids = (prefs || []).map((p) => p.business_id);
  if (ids.length === 0) return NextResponse.json({ ok: true, pool: [] });

  // contact_email is 0066 — retry without it pre-paste.
  let bizRows: Record<string, unknown>[] | null;
  {
    const r = await db.from("businesses").select("id, name, slug, owner_id, claimed_by, phone, contact_email, status").in("id", ids);
    if (r.error && /column|schema cache/i.test(r.error.message || "")) {
      bizRows = (await db.from("businesses").select("id, name, slug, owner_id, claimed_by, phone, status").in("id", ids)).data;
    } else {
      bizRows = r.data;
    }
  }
  const bizById = new Map((bizRows || []).map((b) => [String(b.id), b]));

  // Rotation context: last routed + free-taste consumed (delivery col is 0066).
  const { data: routeRows } = await db
    .from("lead_routes")
    .select("business_id, sent_at, delivery")
    .in("business_id", ids)
    .order("sent_at", { ascending: false })
    .limit(1000);
  const lastRouted = new Map<string, string>();
  const freeUsed = new Set<string>();
  for (const r of routeRows || []) {
    const b = String(r.business_id);
    if (!lastRouted.has(b) && r.sent_at) lastRouted.set(b, String(r.sent_at));
    if ((r as { delivery?: string }).delivery === "full") freeUsed.add(b);
  }

  const pool = (prefs || []).flatMap((p) => {
    const b = bizById.get(String(p.business_id));
    if (!b) return [];
    return [{
      businessId: String(p.business_id),
      name: String(b.name || ""),
      slug: String(b.slug || ""),
      claimed: !!(b.owner_id || b.claimed_by),
      published: b.status === "published",
      phone: (b.phone as string) ?? null,
      contactEmail: (b.contact_email as string) ?? null,
      verticals: Array.isArray(p.verticals) ? p.verticals : [],
      areas: Array.isArray(p.areas) ? p.areas : [],
      active: p.active !== false,
      lastRoutedAt: lastRouted.get(String(p.business_id)) ?? null,
      freeLeadUsed: freeUsed.has(String(p.business_id)),
    }];
  });

  return NextResponse.json({ ok: true, pool, options: { verticals: LEAD_VERTICAL_IDS, areas: [...AREA_NAMES] } });
}

export async function POST(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: false, error: "service_not_configured" }, { status: 503 });

  let body: { businessId?: string; verticals?: unknown; areas?: unknown; active?: unknown; contactEmail?: string } = {};
  try { body = (await req.json()) as typeof body; } catch { return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 }); }
  const businessId = String(body.businessId || "").trim();
  if (!businessId) return NextResponse.json({ ok: false, error: "missing_business" }, { status: 422 });

  const { data: biz } = await db.from("businesses").select("id, name").eq("id", businessId).maybeSingle();
  if (!biz) return NextResponse.json({ ok: false, error: "business_not_found" }, { status: 404 });

  // Same validation as the owner prefs route: fixed vertical ids + real areas.
  const verticals = Array.isArray(body.verticals) ? [...new Set(body.verticals.map(String).filter((v) => LEAD_VERTICAL_IDS.includes(v)))] : [];
  const areas = Array.isArray(body.areas) ? [...new Set(body.areas.map(String).filter((a) => AREA_NAMES.has(a)))] : [];
  if (verticals.length === 0) return NextResponse.json({ ok: false, error: "no_verticals" }, { status: 422 });
  const active = body.active !== false;

  const { error } = await db.from("lead_preferences").upsert({
    business_id: businessId, verticals, areas, active, updated_at: new Date().toISOString(),
  }, { onConflict: "business_id" });
  if (error) return NextResponse.json({ ok: false, error: "could_not_save" }, { status: 502 });

  // Optional outreach email for unclaimed businesses (0066; internal-only).
  if (typeof body.contactEmail === "string") {
    const email = body.contactEmail.trim().slice(0, 200);
    if (email === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      const { error: e2 } = await db.from("businesses").update({ contact_email: email || null }).eq("id", businessId);
      if (e2 && !/column|schema cache/i.test(e2.message || "")) {
        return NextResponse.json({ ok: false, error: "could_not_save_email" }, { status: 502 });
      }
    } else {
      return NextResponse.json({ ok: false, error: "bad_email" }, { status: 422 });
    }
  }

  await logAudit(db, { actor: gate.userId, action: "Lead pool upsert", target: businessId, meta: { verticals, areas, active } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: false, error: "service_not_configured" }, { status: 503 });

  const businessId = new URL(req.url).searchParams.get("businessId") || "";
  if (!businessId) return NextResponse.json({ ok: false, error: "missing_business" }, { status: 422 });
  const { error } = await db.from("lead_preferences").delete().eq("business_id", businessId);
  if (error) return NextResponse.json({ ok: false, error: "could_not_delete" }, { status: 502 });
  await logAudit(db, { actor: gate.userId, action: "Lead pool remove", target: businessId });
  return NextResponse.json({ ok: true });
}
