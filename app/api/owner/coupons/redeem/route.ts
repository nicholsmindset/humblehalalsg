import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { rateLimit, tooMany } from "@/lib/ratelimit";
import { POINTS } from "@/lib/passport";
import { emailForUser } from "@/lib/emails/recipient";
import { sendEmail } from "@/lib/email";
import { couponRedeemedEmail } from "@/lib/emails/templates";

export async function POST(req: Request) {
  const rl = await rateLimit(req, "coupon-redeem", 60, 3600); if (!rl.ok) return tooMany(rl.retryAfter);
  const { userId } = await auth(); if (!userId) return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  const db = getSupabaseAdmin(); if (!db) return NextResponse.json({ ok: false, error: "service_not_configured" }, { status: 503 });
  const body = (await req.json().catch(() => ({}))) as { code?: string };
  const code = String(body.code || "").trim();
  if (!/^[a-f0-9]{36}$|^[A-Z0-9]{8}$/i.test(code)) return NextResponse.json({ ok: false, error: "bad_code" }, { status: 422 });
  const { data, error } = await db.rpc("redeem_business_coupon", { p_lookup: code, p_owner_id: userId });
  if (error || !Array.isArray(data) || !data[0]) {
    const msg = String(error?.message || "");
    const reason = /not_found/i.test(msg) ? "not_found" : /expired/i.test(msg) ? "expired" : /wrong_day|wrong_time/i.test(msg) ? "outside_hours" : "redeem_failed";
    return NextResponse.json({ ok: false, error: reason }, { status: reason === "redeem_failed" ? 500 : 409 });
  }
  const row = data[0] as { redemption_id: string; promotion_id: string; business_id: string; user_id: string; newly_redeemed: boolean };
  let pointsAwarded = false;
  if (row.newly_redeemed) {
    try {
      const { award, loadStats, emitProgress } = await import("@/lib/passport-server");
      const before = await loadStats(db, row.user_id);
      pointsAwarded = await award(db, { userId: row.user_id, source: "coupon", sourceId: row.promotion_id, points: POINTS.coupon, reason: "Redeemed a local deal", dedupeKey: `coupon:${row.redemption_id}` });
      if (pointsAwarded) await emitProgress(db, row.user_id, before, await loadStats(db, row.user_id));
    } catch { /* rewards never block redemption */ }
    try {
      const { data: p } = await db.from("business_promotions").select("title,businesses(name,slug)").eq("id", row.promotion_id).maybeSingle();
      const joined = p?.businesses as unknown;
      const b = Array.isArray(joined) ? joined[0] as { name?: string; slug?: string } | undefined : joined as { name?: string; slug?: string } | null;
      await db.from("analytics_events").insert({ event_type: "coupon_redeem", listing_slug: b?.slug || null, placement: "owner_scanner", plan_at_event: "premium" });
      const recipient = await emailForUser(db, row.user_id);
      if (recipient.email) {
        const mail = couponRedeemedEmail({ name: recipient.name, title: String(p?.title || "Coupon"), business: String(b?.name || "the business"), points: pointsAwarded ? POINTS.coupon : undefined });
        await sendEmail({ to: recipient.email, ...mail, template: "coupon-redeemed", businessId: row.business_id });
      }
    } catch { /* analytics/email best-effort */ }
  }
  return NextResponse.json({ ok: true, redemption: row, pointsAwarded });
}
