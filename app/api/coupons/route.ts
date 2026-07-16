import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: true, coupons: [] });
  const url = new URL(req.url);
  const businessId = String(url.searchParams.get("business") || "");
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit")) || 30));
  const now = new Date().toISOString();
  let q = db
    .from("business_promotions")
    .select("id,business_id,title,details,discount_type,discount_value,reward_text,min_spend_cents,starts_at,ends_at,valid_days,redeem_start,redeem_end,total_limit,claimed_count,terms,businesses!inner(name,slug,status,plan)")
    .eq("kind", "coupon").eq("status", "active")
    .eq("businesses.status", "published").eq("businesses.plan", "premium")
    .lte("starts_at", now).or(`ends_at.is.null,ends_at.gt.${now}`)
    .order("created_at", { ascending: false }).limit(limit);
  if (businessId) q = q.eq("business_id", businessId);
  const { data, error } = await q;
  if (error) {
    // Migration-safe deployment: the public site remains healthy until the DB
    // migration lands, but never fabricates a deal.
    return NextResponse.json({ ok: true, coupons: [] });
  }
  const coupons = (data || []).map((row: Record<string, unknown>) => {
    const b = (Array.isArray(row.businesses) ? row.businesses[0] : row.businesses) as Record<string, unknown> | null;
    const { businesses: _businesses, ...coupon } = row;
    return { ...coupon, business_name: b?.name || "", business_slug: b?.slug || "" };
  });
  return NextResponse.json({ ok: true, coupons }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
}
