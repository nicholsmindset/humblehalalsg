import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getServerFlags, resolveBusinessFlag } from "@/lib/feature-flags";

/* Placement catalogue for the owner self-serve campaign builder: every active,
   direct-capable placement with its rate card + live booking count so the UI
   can flag limited availability. Rates come from ad_placements — the DB is the
   single source of truth for self-serve pricing. */
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ ok: false, error: "service_not_configured" }, { status: 503 });

  // Optional ?business=<id>: resolve paidAds PER-BUSINESS (what checkout will
  // actually enforce) instead of the global flag, so the builder UI can never
  // contradict the purchase gate (audit R5). Ownership-checked like checkout.
  let bizForFlag = "";
  const businessId = new URL(req.url).searchParams.get("business") || "";
  if (businessId) {
    const { data: biz } = await sb.from("businesses").select("id, owner_id, claimed_by").eq("id", businessId).maybeSingle();
    if (biz && (biz.owner_id === userId || biz.claimed_by === userId)) bizForFlag = String(biz.id);
  }

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

  const paidAds = bizForFlag ? await resolveBusinessFlag("paidAds", bizForFlag) : (await getServerFlags()).paidAds;
  return NextResponse.json({ ok: true, options, paidAds });
}
