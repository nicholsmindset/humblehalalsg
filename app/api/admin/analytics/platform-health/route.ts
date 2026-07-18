import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { avgCompleteness, deriveAlerts, type CompletenessInput } from "@/lib/analytics-overview";

/* Platform-health panel + recent alerts for the admin analytics overview.
   Admin-gated (requireAdmin); reads go through the service-role client AFTER the
   gate (same posture as /api/admin/queue and the analytics fallback route) so
   RLS can't hide rows from an admin. Everything is a count/aggregate — no PII.

   ?from&to (ISO) optional: when given, a search-demand spike vs the equal-length
   previous window feeds the alerts. */

type BizHealthRow = {
  photos: unknown;
  opening_hours: unknown;
  description: string | null;
  phone: string | null;
  whatsapp: string | null;
  website: string | null;
  cat_id: string | null;
  area: string | null;
  halal_tier: string | null;
};

const nonEmptyArray = (v: unknown) => Array.isArray(v) && v.length > 0;

function toCompleteness(b: BizHealthRow): CompletenessInput {
  return {
    hasPhoto: nonEmptyArray(b.photos),
    hasHours: nonEmptyArray(b.opening_hours),
    hasDescription: !!(b.description && b.description.trim()),
    hasContact: !!(b.phone || b.whatsapp || b.website),
    hasCategory: !!b.cat_id,
    hasArea: !!b.area,
    verified: b.halal_tier === "muis" || b.halal_tier === "admin",
  };
}

export async function GET(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });

  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ ok: false, error: "service_not_configured" }, { status: 503 });

  const url = new URL(req.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  const todayIso = new Date().toISOString().slice(0, 10);
  const in30Iso = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);

  try {
    // Search-demand spike vs the previous equal-length window (optional).
    let demandSpikePct = 0;
    if (from && to && !Number.isNaN(Date.parse(from)) && !Number.isNaN(Date.parse(to))) {
      const span = Date.parse(to) - Date.parse(from);
      const prevFrom = new Date(Date.parse(from) - span).toISOString();
      const searchCount = (a: string, b: string) =>
        admin.from("analytics_events").select("*", { count: "exact", head: true })
          .eq("event_type", "search").gte("created_at", a).lt("created_at", b);
      const [cur, prev] = await Promise.all([searchCount(from, to), searchCount(prevFrom, from)]);
      const c = cur.count ?? 0, p = prev.count ?? 0;
      demandSpikePct = p > 0 ? Math.round((100 * (c - p)) / p) : 0;
    }

    const [activeRes, verifiedRes, expiringRes, reviewsRes, claimsRes, stagingRes, bizRes] = await Promise.all([
      admin.from("businesses").select("*", { count: "exact", head: true }).eq("status", "published"),
      admin.from("businesses").select("*", { count: "exact", head: true }).eq("status", "published").in("halal_tier", ["muis", "admin"]),
      admin.from("businesses").select("*", { count: "exact", head: true }).eq("status", "published").not("muis_expiry", "is", null).gte("muis_expiry", todayIso).lte("muis_expiry", in30Iso),
      admin.from("reviews").select("*", { count: "exact", head: true }).eq("status", "pending"),
      admin.from("claims").select("*", { count: "exact", head: true }).eq("status", "pending"),
      admin.from("staging_businesses").select("*", { count: "exact", head: true }).in("review_status", ["new", "reviewing"]),
      admin.from("businesses").select("photos,opening_hours,description,phone,whatsapp,website,cat_id,area,halal_tier").eq("status", "published").limit(2000),
    ]);

    const activeListings = activeRes.count ?? 0;
    const verifiedProfiles = verifiedRes.count ?? 0;
    const expiringCerts = expiringRes.count ?? 0;
    const moderationPending = (reviewsRes.count ?? 0) + (claimsRes.count ?? 0) + (stagingRes.count ?? 0);
    const listingsCompletePct = avgCompleteness(((bizRes.data as BizHealthRow[] | null) ?? []).map(toCompleteness));

    const alerts = deriveAlerts({ expiringCerts, demandSpikePct, moderationPending });

    return NextResponse.json({
      ok: true,
      health: { activeListings, verifiedProfiles, expiringCerts, moderationPending, listingsCompletePct },
      alerts,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "platform_health_failed" },
      { status: 500 },
    );
  }
}
