import { CouponCard } from "@/components/coupon-card";
import type { PublicCoupon } from "@/lib/coupons";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { pageMeta } from "@/lib/seo";
import { MyCoupons } from "@/components/my-coupons";

export const metadata = pageMeta({ title: "Muslim-Friendly Deals & Coupons in Singapore", description: "Claim verified deals from Muslim-friendly businesses in Singapore and redeem them securely in-store.", path: "/deals" });
export const dynamic = "force-dynamic";

async function coupons(): Promise<PublicCoupon[]> {
  const db = getSupabaseAdmin(); if (!db) return [];
  const now = new Date().toISOString();
  const { data, error } = await db.from("business_promotions")
    .select("id,business_id,title,details,discount_type,discount_value,reward_text,min_spend_cents,starts_at,ends_at,valid_days,redeem_start,redeem_end,total_limit,claimed_count,terms,businesses!inner(name,slug,status,plan)")
    .eq("kind", "coupon").eq("status", "active").eq("businesses.status", "published").eq("businesses.plan", "premium")
    .lte("starts_at", now).or(`ends_at.is.null,ends_at.gt.${now}`).order("created_at", { ascending: false }).limit(100);
  if (error) return [];
  return (data || []).map((row: Record<string, unknown>) => {
    const b = (Array.isArray(row.businesses) ? row.businesses[0] : row.businesses) as Record<string, unknown> | null;
    const { businesses: _businesses, ...rest } = row;
    return { ...rest, business_name: String(b?.name || ""), business_slug: String(b?.slug || "") } as unknown as PublicCoupon;
  });
}

export default async function DealsPage() {
  const rows = await coupons();
  return <main className="hh-page deals-page">
    <header className="deals-hero"><div className="hh-wrap"><span className="eyebrow">Humble Halal Deals</span><h1>Local deals worth showing up for</h1><p>Claim a coupon, show your code in-store, and let the business confirm it securely. No mystery codes and no duplicate redemption.</p></div></header>
    <div className="hh-wrap" style={{ paddingTop: 32, paddingBottom: 64 }}>
      <MyCoupons />
      <div className="flex between center wrap g10" style={{ marginBottom: 18 }}><div><h2>Available now</h2><p className="faint">Only active promotions from published Premium businesses appear here.</p></div><a className="btn btn-outline btn-sm" href="/owner?tab=promotions">Offer a deal</a></div>
      {rows.length ? <div className="deals-grid">{rows.map((c) => <CouponCard key={c.id} coupon={c} />)}</div> : <div className="card" style={{ padding: 40, textAlign: "center" }}><h2>New deals are coming soon</h2><p className="muted">Businesses are preparing their first Humble Halal coupons. Check back shortly.</p><a className="btn btn-primary mt12" href="/explore">Explore businesses</a></div>}
    </div>
  </main>;
}
