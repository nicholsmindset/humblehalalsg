import { NextResponse } from "next/server";
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

/* Organiser/admin-initiated refund for a paid ticket order. Issues the Stripe
   refund (the charge.refunded webhook then reverses the order + tickets); we
   also flip them here for immediate UI feedback. Free RSVP orders just cancel. */
export async function POST(req: Request) {
  const server = await getSupabaseServer();
  const admin = getSupabaseAdmin();
  if (!server || !admin) return NextResponse.json({ ok: false, reason: "not_configured" }, { status: 503 });

  const { data: { user } } = await server.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, reason: "unauthenticated" }, { status: 401 });

  let b: { orderId?: string };
  try { b = await req.json(); } catch { return NextResponse.json({ ok: false, reason: "bad_request" }, { status: 400 }); }
  const orderId = String(b.orderId || "");
  if (!orderId) return NextResponse.json({ ok: false, reason: "no_order" }, { status: 422 });

  const { data: order } = await admin
    .from("orders").select("id, event_id, business_id, status, amount_cents, stripe_payment_intent").eq("id", orderId).maybeSingle();
  if (!order) return NextResponse.json({ ok: false, reason: "not_found" }, { status: 404 });
  if (order.status === "refunded") return NextResponse.json({ ok: true, already: true });

  // Authorise: admin or the owner of the order's business.
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).maybeSingle();
  let ok = profile?.role === "admin";
  if (!ok && order.business_id) {
    const { data: biz } = await admin.from("businesses").select("id").eq("id", order.business_id)
      .or(`owner_id.eq.${user.id},claimed_by.eq.${user.id}`).maybeSingle();
    ok = !!biz;
  }
  if (!ok) return NextResponse.json({ ok: false, reason: "forbidden" }, { status: 403 });

  // Paid order → issue the Stripe refund. Free RSVP → just cancel.
  if (order.amount_cents && order.stripe_payment_intent) {
    const stripe = getStripe();
    if (!stripe) return NextResponse.json({ ok: false, reason: "stripe_not_configured" }, { status: 503 });
    try {
      await stripe.refunds.create({ payment_intent: order.stripe_payment_intent });
    } catch {
      return NextResponse.json({ ok: false, reason: "refund_failed" }, { status: 502 });
    }
  }

  await admin.from("orders").update({ status: "refunded", payout_status: "none" }).eq("id", orderId);
  await admin.from("tickets").update({ status: "refunded" }).eq("order_id", orderId).neq("status", "used");
  return NextResponse.json({ ok: true });
}
