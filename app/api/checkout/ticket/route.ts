import { NextResponse } from "next/server";
import { getServerFlags } from "@/lib/flags";
import { getStripe } from "@/lib/stripe";
import { computeOrder, CURRENCY } from "@/lib/fees";
import { getEvent } from "@/lib/data";
import { SITE } from "@/lib/seo";
import { getSupabaseAdmin } from "@/lib/supabase/server";

/* Paid event ticket checkout (Stripe Connect destination charge).
   Hard guards: only runs when PAID_TICKETS_ENABLED + Stripe configured + the
   business has a Connect account with charges enabled. Otherwise returns a
   non-fatal signal so the client can fall back to the free/mock flow. */
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

  const ev = getEvent(String(body.eventId || ""));
  if (!ev || ev.free) return NextResponse.json({ ok: false, reason: "not_a_paid_event" }, { status: 404 });

  const qty = Math.max(1, Math.min(20, Number(body.qty) || 1));
  const tier = ev.tiers?.find((t) => t.name === body.tier) ?? ev.tiers?.[0];
  const faceCents = Math.round((tier ? tier.price : ev.priceFrom) * 100);
  const order = computeOrder(faceCents, qty);

  // 2) resolve the seller's connected account (requires DB). Without it we can't
  //    route funds to the business, so degrade gracefully.
  const supa = getSupabaseAdmin();
  if (!supa) return NextResponse.json({ ok: false, reason: "db_not_configured" });
  const { data: acct } = await supa
    .from("stripe_accounts")
    .select("stripe_account_id, charges_enabled")
    .eq("business_id", ev.organiserId)
    .maybeSingle();
  if (!acct?.stripe_account_id || !acct.charges_enabled) {
    return NextResponse.json({ ok: false, reason: "business_not_onboarded" });
  }

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
    payment_intent_data: {
      application_fee_amount: order.feeCents, // Humble Halal's commission
      transfer_data: { destination: acct.stripe_account_id }, // rest → the business
    },
    metadata: { eventId: ev.id, tier: tier?.name ?? "Standard", qty: String(qty), buyer: body.name ?? "" },
    success_url: `${SITE.url}/success?type=payment-event&eventId=${ev.id}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${SITE.url}/events/${ev.slug}`,
  });

  return NextResponse.json({ ok: true, url: session.url });
}
