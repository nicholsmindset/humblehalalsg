import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getServerFlags } from "@/lib/flags";

/* Placement catalogue for the owner self-serve campaign builder: every active,
   direct-capable placement with its rate card + live booking count so the UI
   can flag limited availability. Rates come from ad_placements — the DB is the
   single source of truth for self-serve pricing. */
export const dynamic = "force-dynamic";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ ok: false, error: "service_not_configured" }, { status: 503 });

  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Singapore", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const [{ data: placements }, { data: campaigns }] = await Promise.all([
    sb.from("ad_placements").select("*").eq("active", true).order("sort"),
    sb
      .from("ad_campaigns")
      .select("placement_key, status, review_status, starts_on, ends_on")
      .in("status", ["active", "scheduled"]),
  ]);

  // Live = approved + inside (or before end of) its window right now.
  const liveCount = new Map<string, number>();
  for (const c of campaigns || []) {
    if (c.review_status && c.review_status !== "approved") continue;
    if (c.ends_on && c.ends_on < today) continue;
    liveCount.set(c.placement_key, (liveCount.get(c.placement_key) || 0) + 1);
  }

  const options = (placements || [])
    .filter((p) => p.fill_mode !== "adsense_only" && p.fill_mode !== "off")
    .map((p) => ({
      key: String(p.key),
      label: String(p.label || p.key),
      pageType: String(p.page_type || ""),
      positionLabel: String(p.position_label || ""),
      sizeFormat: String(p.size_format || "in_feed"),
      monthlyRateCents: Number(p.monthly_rate_cents) || 0,
      inventoryCap: Math.max(1, Number(p.inventory_cap) || 1),
      booked: liveCount.get(String(p.key)) || 0,
    }));

  return NextResponse.json({ ok: true, options, paidAds: getServerFlags().paidAds });
}
