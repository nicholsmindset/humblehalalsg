import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";

const addDaysISO = (base: Date, days: number) => {
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

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

  // idempotency: process each event id once. ONLY a unique-violation (23505)
  // means "already processed" → ack. Any other insert error is transient (DB
  // hiccup) and must 500 so Stripe retries, otherwise a paid event could be
  // dropped without fulfillment (security audit M4).
  const supa = getSupabaseAdmin();
  if (supa) {
    const { error } = await supa.from("webhook_events").insert({ stripe_event_id: event.id });
    if (error) {
      if (error.code === "23505") return NextResponse.json({ ok: true, duplicate: true });
      return NextResponse.json({ ok: false, error: "idempotency_store_unavailable" }, { status: 500 });
    }
  }

  const FEATURED_PLANS = new Set(["featured", "premium"]);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        // Subscription checkout (listing plans).
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
        // Event-ticket checkout (separate charges). Record the order + tickets and
        // schedule the organiser payout for 24h after the event (cron transfers it).
        else if (s.mode === "payment" && s.metadata?.kind === "ticket" && supa) {
          const m = s.metadata;
          const qty = Math.max(1, parseInt(m.qty || "1", 10));
          const subtotal = parseInt(m.subtotalCents || "0", 10);
          const fee = parseInt(m.feeCents || "0", 10);
          const total = s.amount_total ?? subtotal + fee;
          const pi = typeof s.payment_intent === "string" ? s.payment_intent : null;
          const buyerEmail = s.customer_details?.email || null;
          const connected = m.connectedAccount || null;

          // Resolve the DB event (for the FK + payout date). Mock-only events have
          // no row yet → store a null event_id and a +1d fallback payout date.
          const { data: dbEvent } = await supa.from("events").select("id, date_iso, taken").eq("id", m.eventId || "").maybeSingle();
          const payoutDue = dbEvent?.date_iso ? addDaysISO(new Date(dbEvent.date_iso), 1) : addDaysISO(new Date(), 1);

          const { data: ord } = await supa.from("orders").insert({
            event_id: dbEvent?.id ?? null,
            business_id: m.businessId || null,
            buyer_email: buyerEmail,
            buyer_name: m.buyer || null,
            amount_cents: total,
            fee_cents: fee,
            net_cents: subtotal,
            currency: s.currency || "sgd",
            qty,
            stripe_payment_intent: pi,
            status: "confirmed",
            connected_account_id: connected,
            payout_status: connected && subtotal > 0 ? "pending" : "none",
            payout_due: payoutDue,
          }).select("id").single();

          if (ord?.id) {
            const tix = Array.from({ length: qty }, () => ({ order_id: ord.id, event_id: dbEvent?.id ?? null, tier: m.tier || null, qr_ref: randomUUID() }));
            await supa.from("tickets").insert(tix);
            // Atomic increment (security audit M2) so concurrent settlements don't
            // lose updates; fall back to read+write if the RPC isn't deployed yet.
            if (dbEvent?.id) {
              const { error: incErr } = await supa.rpc("increment_event_taken", { p_event_id: dbEvent.id, p_qty: qty });
              if (incErr) await supa.from("events").update({ taken: (dbEvent.taken || 0) + qty }).eq("id", dbEvent.id);
            }
            if (buyerEmail) {
              try {
                await sendEmail({
                  to: buyerEmail,
                  subject: `Your ticket${qty > 1 ? "s" : ""} — ${m.tier || "Event"}`,
                  template: "ticket-confirmation",
                  html: `<h2>You're going! 🎟️</h2><p>Your ${qty} ticket${qty > 1 ? "s are" : " is"} confirmed (${m.tier || "Standard"}). Show this email at the door — your reference is <strong>${String(ord.id).slice(0, 8).toUpperCase()}</strong>.</p>`,
                });
              } catch { /* email best-effort */ }
            }
          }
        }
        // Zakat / sadaqah donation for a charity event. Record it + mirror the
        // running total into events.display so the public page shows a real figure.
        else if (s.mode === "payment" && s.metadata?.kind === "donation" && supa) {
          const m = s.metadata;
          const amount = s.amount_total ?? parseInt(m.amountCents || "0", 10);
          const pi = typeof s.payment_intent === "string" ? s.payment_intent : null;
          const { error: dErr } = await supa.from("donations").insert({
            event_id: m.eventId || null,
            amount_cents: amount,
            currency: s.currency || "sgd",
            donor_email: s.customer_details?.email || null,
            stripe_payment_intent: pi,
            status: "paid",
          });
          // Mirror the honest running total into the event's display jsonb.
          // Atomic increment so concurrent donations don't lose updates; fall
          // back to read+write only if the RPC isn't deployed yet.
          if (!dErr && m.eventId) {
            const { error: incErr } = await supa.rpc("increment_donation_raised", { p_event_id: m.eventId, p_amount: amount });
            if (incErr) {
              const { data: evRow } = await supa.from("events").select("display").eq("id", m.eventId).maybeSingle();
              const disp = (evRow?.display && typeof evRow.display === "object" ? evRow.display : {}) as Record<string, unknown>;
              const prev = Number(disp.donationRaisedCents) || 0;
              await supa.from("events").update({ display: { ...disp, donationRaisedCents: prev + amount } }).eq("id", m.eventId);
            }
          }
        }
        // Sponsored-ad / promo purchase → record the ad order (revenue ledger).
        else if (s.mode === "payment" && s.metadata?.kind === "ad" && supa) {
          const m = s.metadata;
          const pi = typeof s.payment_intent === "string" ? s.payment_intent : null;
          await supa.from("ad_orders").insert({
            business_id: m.businessId || null,
            product: m.product || "ad",
            amount_cents: s.amount_total ?? 0,
            stripe_payment_intent: pi,
            status: "paid",
          });
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
          // Read first so we only reverse once (avoids double-decrementing the
          // event's taken counter if charge.refunded fires for the same order).
          const { data: ord } = await supa.from("orders").select("id, status, event_id, qty").eq("stripe_payment_intent", pi).maybeSingle();
          if (ord?.id && ord.status !== "refunded") {
            await supa.from("orders").update({ status: "refunded" }).eq("id", ord.id);
            await supa.from("tickets").update({ status: "refunded" }).eq("order_id", ord.id).neq("status", "used");
            // Free the refunded capacity back to the event (atomic, clamped ≥0).
            if (ord.event_id && ord.qty) {
              await supa.rpc("decrement_event_taken", { p_event_id: ord.event_id, p_qty: ord.qty });
            }
          } else if (!ord) {
            // No order matched → it may be a donation refund (e.g. issued from the
            // Stripe dashboard). Reverse it so the public total stays honest.
            const { data: don } = await supa.from("donations").select("id, status, event_id, amount_cents").eq("stripe_payment_intent", pi).maybeSingle();
            if (don?.id && don.status !== "refunded") {
              await supa.from("donations").update({ status: "refunded" }).eq("id", don.id);
              if (don.event_id && don.amount_cents) {
                await supa.rpc("increment_donation_raised", { p_event_id: don.event_id, p_amount: -don.amount_cents });
              }
            }
          }
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
