import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase/server";

/* Admin lead-funnel stats (leads growth loop measurement).
   Everything is derived from the DB — no new analytics_events types (avoids
   widening the 0045 CHECK). ?days=30|90 window. Buckets captures by which
   surface produced them (parsed from source_path), and reports the
   route→accept funnel, cascade expiry, and the free-taste→claim conversion. */
export const dynamic = "force-dynamic";

type Bucket = "blog" | "guide" | "listing" | "popup" | "quotes" | "other";
function surfaceOf(sourcePath: string | null): Bucket {
  const p = (sourcePath || "").toLowerCase();
  if (p.includes("#popup")) return "popup";
  if (p.startsWith("/blog/")) return "blog";
  if (p.startsWith("/business/")) return "listing";
  if (p === "/quotes" || p.startsWith("/quotes")) return "quotes";
  if (p.startsWith("/")) return "guide"; // pSEO vertical pages
  return "other";
}

export async function GET(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: false, error: "service_not_configured" }, { status: 503 });

  const days = Math.min(365, Math.max(1, Number(new URL(req.url).searchParams.get("days")) || 30));
  const since = new Date(Date.now() - days * 86_400_000).toISOString();

  // Captures by surface.
  const { data: leads } = await db.from("leads").select("source_path, consent_contact").gte("created_at", since).limit(5000);
  const bySurface: Record<Bucket, number> = { blog: 0, guide: 0, listing: 0, popup: 0, quotes: 0, other: 0 };
  let consented = 0;
  for (const l of leads || []) {
    bySurface[surfaceOf(l.source_path as string | null)]++;
    if (l.consent_contact) consented++;
  }
  const totalLeads = (leads || []).length;

  // Route funnel (delivery/mode/expired are 0066 — retry without pre-paste).
  let routes: { status: string; delivery?: string; mode?: string }[] | null;
  {
    const r = await db.from("lead_routes").select("status, delivery, mode").gte("sent_at", since).limit(10000);
    if (r.error && /column|schema cache/i.test(r.error.message || "")) {
      routes = (await db.from("lead_routes").select("status").gte("sent_at", since).limit(10000)).data as typeof routes;
    } else {
      routes = r.data as typeof routes;
    }
  }
  const routeStats = { sent: 0, accepted: 0, expired: 0, exclusive: 0, freeSent: 0 };
  for (const r of routes || []) {
    routeStats.sent++;
    if (["accepted", "contacted", "won", "lost"].includes(r.status)) routeStats.accepted++;
    if (r.status === "expired") routeStats.expired++;
    if (r.mode === "exclusive") routeStats.exclusive++;
    if (r.delivery === "full") routeStats.freeSent++;
  }

  // Free-taste → claim conversion: businesses that received a full lead AND
  // are now claimed (owner_id/claimed_by set). All-time (conversion is slow).
  let freeTasteClaims: number | null = null;
  {
    const r = await db.from("lead_routes").select("business_id").eq("delivery", "full").limit(5000);
    if (!r.error) {
      const ids = [...new Set((r.data || []).map((x) => String(x.business_id)))];
      if (ids.length) {
        const { count } = await db.from("businesses").select("id", { count: "exact", head: true })
          .in("id", ids).or("owner_id.not.is.null,claimed_by.not.is.null");
        freeTasteClaims = count ?? 0;
      } else {
        freeTasteClaims = 0;
      }
    }
  }

  return NextResponse.json({
    ok: true,
    windowDays: days,
    leads: { total: totalLeads, consented, bySurface },
    routes: routeStats,
    acceptRate: routeStats.sent ? Math.round((routeStats.accepted / routeStats.sent) * 100) : 0,
    freeTaste: { sent: routeStats.freeSent, claimed: freeTasteClaims },
  });
}
