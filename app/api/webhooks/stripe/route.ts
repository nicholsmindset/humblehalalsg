import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase/server";

/* Stripe webhook — single signed endpoint, idempotent fulfillment.
   No-ops cleanly when keys/DB aren't configured. */
export async function POST(req: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) return NextResponse.json({ ok: true, skipped: "not_configured" });

  const sig = req.headers.get("stripe-signature");
  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig || "", secret);
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_signature" }, { status: 400 });
  }

  // idempotency: process each event id once
  const supa = getSupabaseAdmin();
  if (supa) {
    const { error } = await supa.from("webhook_events").insert({ stripe_event_id: event.id });
    if (error) return NextResponse.json({ ok: true, duplicate: true }); // already processed
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "payment_intent.succeeded":
        // TODO: create order + tickets, decrement capacity, email ticket
        break;
      case "account.updated":
        // TODO: sync stripe_accounts.charges_enabled / payouts_enabled
        break;
      case "charge.refunded":
        // TODO: mark order/tickets refunded
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
      case "invoice.payment_succeeded":
        // TODO: set business plan / featured / badge flags
        break;
      default:
        break;
    }
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 }); // Stripe will retry
  }

  return NextResponse.json({ ok: true });
}
