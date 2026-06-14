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

  const FEATURED_PLANS = new Set(["featured", "premium"]);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        // Subscription checkout (listing plans). Ticket checkout (mode=payment for
        // events) is fulfilled in the Connect events flow — see PAID_TICKETS build.
        if (s.mode === "subscription" && supa) {
          const businessId = s.metadata?.business_id || undefined;
          const plan = s.metadata?.plan || undefined;
          const customer = typeof s.customer === "string" ? s.customer : undefined;
          const subscription = typeof s.subscription === "string" ? s.subscription : undefined;
          if (businessId && plan) {
            await supa.from("businesses").update({ plan, featured: FEATURED_PLANS.has(plan), ...(customer ? { stripe_customer_id: customer } : {}) }).eq("id", businessId);
            if (subscription) {
              await supa.from("subscriptions").upsert({ business_id: businessId, stripe_subscription_id: subscription, plan, status: "active" }, { onConflict: "stripe_subscription_id" });
            }
          }
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const businessId = sub.metadata?.business_id || undefined;
        const plan = sub.metadata?.plan || null;
        const active = sub.status === "active" || sub.status === "trialing";
        const cpe = (sub as unknown as { current_period_end?: number }).current_period_end;
        if (supa && businessId) {
          await supa.from("subscriptions").upsert({
            business_id: businessId,
            stripe_subscription_id: sub.id,
            plan,
            status: sub.status,
            current_period_end: cpe ? new Date(cpe * 1000).toISOString() : null,
          }, { onConflict: "stripe_subscription_id" });
          await supa.from("businesses").update({
            plan: active && plan ? plan : "free",
            featured: active && FEATURED_PLANS.has(plan || ""),
          }).eq("id", businessId);
        }
        break;
      }
      case "account.updated": {
        const acct = event.data.object as Stripe.Account;
        if (supa) {
          await supa.from("stripe_accounts").update({
            charges_enabled: acct.charges_enabled,
            payouts_enabled: acct.payouts_enabled,
            details_submitted: acct.details_submitted,
            updated_at: new Date().toISOString(),
          }).eq("stripe_account_id", acct.id);
        }
        break;
      }
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const pi = typeof charge.payment_intent === "string" ? charge.payment_intent : undefined;
        if (supa && pi) {
          await supa.from("orders").update({ status: "refunded" }).eq("stripe_payment_intent", pi);
          const { data: ord } = await supa.from("orders").select("id").eq("stripe_payment_intent", pi).maybeSingle();
          if (ord?.id) await supa.from("tickets").update({ status: "refunded" }).eq("order_id", ord.id);
        }
        break;
      }
      case "payment_intent.succeeded":
        // Event-ticket fulfillment (create order + tickets, decrement capacity,
        // email ticket) lands with the Connect Express events build.
        break;
      case "invoice.payment_succeeded":
        // Subscription state is authoritative via customer.subscription.* above.
        break;
      default:
        break;
    }
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 }); // Stripe will retry
  }

  return NextResponse.json({ ok: true });
}
