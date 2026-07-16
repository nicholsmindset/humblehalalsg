import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { rateLimit, tooMany } from "@/lib/ratelimit";
import { emailForUser } from "@/lib/emails/recipient";
import { sendEmail } from "@/lib/email";
import { couponClaimedEmail } from "@/lib/emails/templates";

export async function POST(req: Request) {
  const rl = await rateLimit(req, "coupon-claim", 20, 3600); if (!rl.ok) return tooMany(rl.retryAfter);
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: false, error: "service_not_configured" }, { status: 503 });
  const body = (await req.json().catch(() => ({}))) as { promotionId?: string };
  if (!/^[0-9a-f-]{36}$/i.test(String(body.promotionId || ""))) return NextResponse.json({ ok: false, error: "bad_coupon" }, { status: 422 });
  const { data, error } = await db.rpc("claim_business_coupon", { p_promotion_id: body.promotionId, p_user_id: userId });
  if (error || !Array.isArray(data) || !data[0]) {
    const msg = String(error?.message || "");
    const code = /sold_out/i.test(msg) ? "sold_out" : /inactive|unavailable/i.test(msg) ? "unavailable" : "claim_failed";
    return NextResponse.json({ ok: false, error: code }, { status: code === "claim_failed" ? 500 : 409 });
  }
  const redemption = data[0] as { redemption_id: string; token: string; short_code: string; expires_at: string | null };
  try {
    const { data: p } = await db.from("business_promotions").select("title,businesses(name)").eq("id", body.promotionId).maybeSingle();
    const joined = p?.businesses as unknown;
    const business = Array.isArray(joined) ? (joined[0] as { name?: string } | undefined)?.name : (joined as { name?: string } | null)?.name;
    const recipient = await emailForUser(db, userId);
    if (recipient.email) {
      const mail = couponClaimedEmail({ name: recipient.name, title: String(p?.title || "Your coupon"), business: String(business || "the business"), code: redemption.short_code, token: redemption.token });
      await sendEmail({ to: recipient.email, ...mail, template: "coupon-claimed" });
    }
  } catch { /* transactional email is best-effort */ }
  return NextResponse.json({ ok: true, redemption });
}
