import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

/* Organiser/admin-initiated refund for a paid ticket order. Issues the Stripe
   refund (the charge.refunded webhook then reverses the order + tickets); we
   also flip them here for immediate UI feedback. Free RSVP orders just cancel. */
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, reason: "unauthenticated" }, { status: 401 });

  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ ok: false, reason: "not_configured" }, { status: 503 });

  let b: { orderId?: string };
  try { b = await req.json(); } catch { return NextResponse.json({ ok: false, reason: "bad_request" }, { status: 400 }); }
  const orderId = String(b.orderId || "");
  if (!orderId) return NextResponse.json({ ok: false, reason: "no_order" }, { status: 422 });

  const { data: order } = await admin
    .from("orders").select("id, event_id, business_id, status, amount_cents, stripe_payment_intent").eq("id", orderId).maybeSingle();
  if (!order) return NextResponse.json({ ok: false, reason: "not_found" }, { status: 404 });
  if (order.status === "refunded") return NextResponse.json({ ok: true, already: true });

  // Authorise: admin or the owner of the order's business.
  const { data: profile } = await admin.from("profiles").select("role").eq("id", userId).maybeSingle();
  let ok = profile?.role === "admin";
  if (!ok && order.business_id) {
    const { data: biz } = await admin.from("businesses").select("id").eq("id", order.business_id)
      .or(`owner_id.eq.${userId},claimed_by.eq.${userId}`).maybeSingle();
    ok = !!biz;
  }
  if (!ok) return NextResponse.json({ ok: false, reason: "forbidden" }, { status: 403 });

  // Claim the refund atomically: only the request that flips confirmed→refunded
  // proceeds, so two concurrent clicks can't both fire a Stripe refund.
  const { data: claimed } = await admin
    .from("orders").update({ status: "refunded" })
    .eq("id", orderId).neq("status", "refunded")
    .select("id");
  if (!claimed?.length) return NextResponse.json({ ok: true, already: true });

  // Paid order → issue the Stripe refund. Free RSVP → just cancel. The
  // idempotency key dedupes at Stripe even if this runs twice for one order.
  if (order.amount_cents && order.stripe_payment_intent) {
    const stripe = getStripe();
    if (!stripe) {
      await admin.from("orders").update({ status: order.status }).eq("id", orderId);
      return NextResponse.json({ ok: false, reason: "stripe_not_configured" }, { status: 503 });
    }
    try {
      await stripe.refunds.create(
        { payment_intent: order.stripe_payment_intent },
        { idempotencyKey: `refund_order_${orderId}` },
      );
    } catch {
      // Roll the claim back so the refund can be retried instead of being
      // silently stuck as "refunded" with the money still held.
      await admin.from("orders").update({ status: order.status }).eq("id", orderId);
      return NextResponse.json({ ok: false, reason: "refund_failed" }, { status: 502 });
    }
  }

  await admin.from("orders").update({ payout_status: "none" }).eq("id", orderId);
  await admin.from("tickets").update({ status: "refunded" }).eq("order_id", orderId).eq("status", "valid");
  return NextResponse.json({ ok: true });
}
