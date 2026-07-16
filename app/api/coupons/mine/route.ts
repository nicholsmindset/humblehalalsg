import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: true, redemptions: [] });
  const { data } = await db.from("coupon_redemptions")
    .select("id,token,short_code,status,claimed_at,expires_at,redeemed_at,business_promotions(title,discount_type,discount_value,reward_text),businesses(name,slug)")
    .eq("user_id", userId).order("claimed_at", { ascending: false }).limit(100);
  return NextResponse.json({ ok: true, redemptions: data || [] });
}
