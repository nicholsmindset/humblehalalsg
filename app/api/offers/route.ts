import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { canUse } from "@/lib/plans";

/* Public: the active offer for one business (renders in the listing's
   Offers & promotions block). Only returns the offer while the business's
   plan still includes offers_block — a downgraded business's stale offer
   never leaks. Cacheable per business (revalidated on owner save). */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const businessId = String(url.searchParams.get("business") || "");
  if (!/^[0-9a-f-]{36}$/i.test(businessId)) {
    return NextResponse.json({ ok: false, error: "bad_business" }, { status: 422 });
  }
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: true, offer: null });

  const { data: biz } = await db.from("businesses").select("plan, status").eq("id", businessId).maybeSingle();
  if (!biz || biz.status !== "published" || !canUse(biz, "offers_block")) {
    return NextResponse.json({ ok: true, offer: null });
  }

  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Singapore" }).format(new Date());
  const { data } = await db
    .from("offers")
    .select("title, details, ends_at")
    .eq("business_id", businessId)
    .eq("active", true)
    .or(`ends_at.is.null,ends_at.gte.${today}`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return NextResponse.json(
    { ok: true, offer: data ?? null },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } },
  );
}
