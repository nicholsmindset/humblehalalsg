import { NextResponse } from "next/server";
import { getServerFlags } from "@/lib/flags";
import { getStripe } from "@/lib/stripe";
import { computeOrder, CURRENCY } from "@/lib/fees";
import { getEvent } from "@/lib/data";
import { rowToEvent } from "@/lib/events-source";
import { SITE } from "@/lib/seo";
import { getSupabaseAdmin } from "@/lib/supabase/server";

/* Paid event-ticket checkout — SEPARATE CHARGES + delayed transfer model.

   The buyer pays face value + booking fee on the PLATFORM (no transfer_data), so
   Humble Halal holds the funds. The webhook records the order; a cron
   (api/cron/event-payouts) transfers the organiser's net (face value) to their
   Connect account 24h after the event ends, and we keep the booking fee.

   Hard guards: only runs when PAID_TICKETS_ENABLED + Stripe configured + the
   organiser has a Connect account that can RECEIVE PAYOUTS. Otherwise returns a
   non-fatal signal so the client can fall back to the free/RSVP flow. */
export async function POST(req: Request) {
  // 1) server-side kill-switch (never trust the client toggle)
  if (!getServerFlags().paidTickets) {
    return NextResponse.json({ ok: false, reason: "paid_tickets_disabled" }, { status: 403 });
  }

  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ ok: false, reason: "stripe_not_configured" });

  let body: { eventId?: string; tier?: string; qty?: number; name?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "bad_request" }, { status: 400 });
  }

  // Resolve the event: mock seed first (fast), then the Supabase `events` table
  // (published) so DB-only paid events work too.
  const supa = getSupabaseAdmin();
  const eventId = String(body.eventId || "");
  let ev = getEvent(eventId);
  if (!ev && supa) {
    const { data: row } = await supa
      .from("events")
      .select("*")
      .or(`id.eq.${eventId},slug.eq.${eventId}`)
      .eq("status", "published")
      .maybeSingle();
    if (row) ev = rowToEvent(row);
  }
  if (!ev || ev.free) return NextResponse.json({ ok: false, reason: "not_a_paid_event" }, { status: 404 });

  const qty = Math.max(1, Math.min(20, Number(body.qty) || 1));
  const tier = ev.tiers?.find((t) => t.name === body.tier) ?? ev.tiers?.[0];
  const faceCents = Math.round((tier ? tier.price : ev.priceFrom) * 100);
  const order = computeOrder(faceCents, qty); // subtotal (→organiser), fee (→us), total (buyer pays)

  // 2) resolve the organiser's connected account. For separate charges we don't
  //    need charges_enabled, but we MUST be able to pay them out later, so we
  //    require payouts_enabled before selling.
  if (!supa) return NextResponse.json({ ok: false, reason: "db_not_configured" });
  const { data: acct } = await supa
    .from("stripe_accounts")
    .select("stripe_account_id, payouts_enabled")
    .eq("business_id", ev.organiserId)
    .maybeSingle();
  if (!acct?.stripe_account_id || !acct.payouts_enabled) {
    return NextResponse.json({ ok: false, reason: "business_not_onboarded" });
  }

  // Metadata the webhook uses to record the order + schedule the post-event payout.
  const meta: Record<string, string> = {
    kind: "ticket",
    eventId: ev.id,
    businessId: String(ev.organiserId),
    tier: tier?.name ?? "Standard",
    qty: String(qty),
    subtotalCents: String(order.subtotalCents), // organiser's net (transferred after event)
    feeCents: String(order.feeCents), // our commission (kept)
    connectedAccount: acct.stripe_account_id,
    buyer: body.name ?? "",
  };

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: qty,
        price_data: {
          currency: CURRENCY,
          unit_amount: faceCents,
          product_data: { name: `${ev.title} — ${tier?.name ?? "Ticket"}` },
        },
      },
      {
        quantity: 1,
        price_data: {
          currency: CURRENCY,
          unit_amount: order.feeCents,
          product_data: { name: "Booking fee" },
        },
      },
    ],
    // NO transfer_data / application_fee → the full charge stays on the platform
    // balance until the cron transfers the organiser's net after the event.
    payment_intent_data: { metadata: meta },
    metadata: meta,
    success_url: `${SITE.url}/success?type=payment-event&eventId=${ev.id}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${SITE.url}/events/${ev.slug}`,
  });

  return NextResponse.json({ ok: true, url: session.url });
}
