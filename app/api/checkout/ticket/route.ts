import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getServerFlags } from "@/lib/flags";
import { getStripe } from "@/lib/stripe";
import { computeOrder, CURRENCY, type FeeMode } from "@/lib/fees";
import { getEvent } from "@/lib/data";
import { rowToEvent } from "@/lib/events-source";
import { SITE } from "@/lib/seo";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isSafeEventRef } from "@/lib/event-ref";
import { validatePromoCode, normalizePromoCode, type PromoCheck } from "@/lib/promo";
import { parseAttributionCookie } from "@/lib/attribution";
import { sendEmail } from "@/lib/email";
import { ticketConfirmationEmail } from "@/lib/emails/templates";

/* Paid event-ticket checkout — SEPARATE CHARGES + delayed transfer model.

   The buyer pays on the PLATFORM (no transfer_data), so Humble Halal holds the
   funds. The webhook records the order; a cron (api/cron/event-payouts)
   transfers the organiser's net to their Connect account 24h after the event
   ends, and we keep the booking fee.

   What the buyer pays depends on the event's fee mode (lib/fees):
     pass (default)  face − discount + booking fee   (organiser nets face − discount)
     absorb          face − discount                 (fee comes out of the organiser's net)

   Promo codes are re-validated HERE (never trusting the client's preview from
   /api/checkout/validate-promo) and applied to our own line items — not Stripe
   coupons, which are session-wide and would corrupt the fee/payout split.

   Hard guards: only runs when PAID_TICKETS_ENABLED + Stripe configured + the
   organiser has a Connect account that can RECEIVE PAYOUTS. Otherwise returns a
   non-fatal signal so the client can fall back to the free/RSVP flow. */

const STRIPE_MIN_CHARGE_CENTS = 50; // Stripe's minimum chargeable amount in SGD

export async function POST(req: Request) {
  // 1) server-side kill-switch (never trust the client toggle)
  const flags = getServerFlags();
  if (!flags.paidTickets) {
    return NextResponse.json({ ok: false, reason: "paid_tickets_disabled" }, { status: 403 });
  }

  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ ok: false, reason: "stripe_not_configured" });

  let body: { eventId?: string; tier?: string; qty?: number; name?: string; email?: string; promo?: string; sessionId?: string };
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
  if (!ev && supa && isSafeEventRef(eventId)) {
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

  // Capacity gate (security audit M2): don't sell past capacity. capacity===0
  // means unlimited. Final oversell-on-race is also bounded by the atomic
  // increment in the webhook (increment_event_taken).
  if (ev.capacity > 0 && (ev.taken ?? 0) + qty > ev.capacity) {
    const left = Math.max(0, ev.capacity - (ev.taken ?? 0));
    return NextResponse.json({ ok: false, reason: left > 0 ? "insufficient_capacity" : "sold_out", left }, { status: 409 });
  }
  const tier = ev.tiers?.find((t) => t.name === body.tier) ?? ev.tiers?.[0];
  const faceCents = Math.round((tier ? tier.price : ev.priceFrom) * 100);
  const feeMode: FeeMode = ev.feeMode === "absorb" ? "absorb" : "pass";

  if (!supa) return NextResponse.json({ ok: false, reason: "db_not_configured" });

  // 2) promo code — validated server-side against the organiser's codes. An
  //    invalid code is a hard 422 (the buyer typed it expecting a discount;
  //    silently charging full price would be worse than asking them to fix it).
  let promo: (PromoCheck & { ok: true }) | null = null;
  if (normalizePromoCode(body.promo)) {
    const check = await validatePromoCode(supa, {
      code: String(body.promo),
      eventId: ev.id,
      businessId: ev.organiserId,
      subtotalCents: faceCents * qty,
      qty,
    });
    if (!check.ok) {
      return NextResponse.json({ ok: false, reason: `promo_${check.reason}`, minQty: check.minQty }, { status: 422 });
    }
    promo = check;
  }

  const order = computeOrder(faceCents, qty, { feeMode, discountCents: promo?.discountCents ?? 0 });

  // Channel attribution — snapshot of how this buyer arrived (PDPA-safe: no PII).
  const attr = parseAttributionCookie(req.headers.get("cookie"));
  const sessionId = typeof body.sessionId === "string" ? body.sessionId.slice(0, 64) : null;

  // 3) fully-comped order (100%-off code, or discounted under Stripe's minimum
  //    charge): nothing chargeable, so record it directly — mirroring /api/rsvp —
  //    instead of creating a Stripe session. Requires the event row in the DB
  //    (orders.event_id FK); mock-only events degrade to simulated like RSVP.
  if (order.totalCents < STRIPE_MIN_CHARGE_CENTS) {
    const { data: dbEvent } = await supa.from("events").select("id, taken").eq("id", ev.id).maybeSingle();
    if (!dbEvent) return NextResponse.json({ ok: true, simulated: true, comp: true });
    const { data: ord, error } = await supa
      .from("orders")
      .insert({
        event_id: dbEvent.id,
        business_id: ev.organiserId,
        buyer_email: body.email ?? null,
        buyer_name: body.name ?? null,
        amount_cents: order.totalCents,
        fee_cents: 0,
        net_cents: 0,
        qty,
        status: "confirmed",
        payout_status: "none",
        fee_mode: feeMode,
        promo_code_id: promo?.promoId ?? null,
        discount_cents: order.discountCents,
        utm: attr ?? null,
        ref_code: attr?.ref ?? null,
        session_id: sessionId,
      })
      .select("id")
      .single();
    if (error || !ord) return NextResponse.json({ ok: false, reason: "db_error" }, { status: 500 });

    const tix = Array.from({ length: qty }, () => ({ order_id: ord.id, event_id: dbEvent.id, tier: tier?.name ?? "Standard", qr_ref: randomUUID() }));
    await supa.from("tickets").insert(tix);
    const { error: incErr } = await supa.rpc("increment_event_taken", { p_event_id: dbEvent.id, p_qty: qty });
    if (incErr) await supa.from("events").update({ taken: (Number(dbEvent.taken) || 0) + qty }).eq("id", dbEvent.id);
    if (promo) await supa.rpc("redeem_promo", { p_id: promo.promoId });
    if (body.email) {
      try {
        const t = ticketConfirmationEmail({ eventTitle: ev.title, qty, ref: String(ord.id).slice(0, 8).toUpperCase() });
        await sendEmail({ to: body.email, subject: t.subject, html: t.html, template: "ticket-confirmation" });
      } catch { /* email best-effort */ }
    }
    return NextResponse.json({ ok: true, comp: true, redirect: `/success?type=payment-event&eventId=${ev.id}` });
  }

  // 4) resolve the organiser's connected account. For separate charges we don't
  //    need charges_enabled, but we MUST be able to pay them out later, so we
  //    require payouts_enabled before selling.
  const { data: acct } = await supa
    .from("stripe_accounts")
    .select("stripe_account_id, payouts_enabled")
    .eq("business_id", ev.organiserId)
    .maybeSingle();
  if (!acct?.stripe_account_id || !acct.payouts_enabled) {
    return NextResponse.json({ ok: false, reason: "business_not_onboarded" });
  }

  // Metadata the webhook uses to record the order + schedule the post-event
  // payout. netCents is authoritative for the transfer; subtotalCents kept for
  // in-flight sessions created before the fee-mode/promo upgrade.
  const meta: Record<string, string> = {
    kind: "ticket",
    eventId: ev.id,
    eventTitle: String(ev.title || "").slice(0, 200), // for the confirmation email
    businessId: String(ev.organiserId),
    tier: tier?.name ?? "Standard",
    qty: String(qty),
    subtotalCents: String(order.subtotalCents),
    feeCents: String(order.feeCents), // our commission (kept)
    netCents: String(order.netCents), // organiser's net (transferred after event)
    feeMode,
    discountCents: String(order.discountCents),
    promoCodeId: promo?.promoId ?? "",
    promoCode: promo?.code ?? "",
    refCode: attr?.ref ?? "",
    utm: attr ? JSON.stringify(attr).slice(0, 450) : "",
    sessionId: sessionId ?? "",
    connectedAccount: acct.stripe_account_id,
    buyer: body.name ?? "",
  };

  // Line items. The classic presentation (face × qty + booking fee) only works
  // undiscounted in pass mode; with a discount or absorbed fee the per-unit
  // price no longer matches, so we collapse to one exact-total ticket line.
  const ticketName = `${ev.title} — ${tier?.name ?? "Ticket"}`;
  const ticketLine =
    order.discountCents > 0
      ? {
          quantity: 1,
          price_data: {
            currency: CURRENCY,
            unit_amount: order.subtotalCents - order.discountCents,
            product_data: { name: `${ticketName} × ${qty} (${promo?.code})` },
          },
        }
      : { quantity: qty, price_data: { currency: CURRENCY, unit_amount: faceCents, product_data: { name: ticketName } } };
  const lineItems =
    feeMode === "pass" && order.feeCents > 0
      ? [ticketLine, { quantity: 1, price_data: { currency: CURRENCY, unit_amount: order.feeCents, product_data: { name: "Booking fee" } } }]
      : [ticketLine];

  const sessionParams = {
    mode: "payment" as const,
    line_items: lineItems,
    // NO transfer_data / application_fee → the full charge stays on the platform
    // balance until the cron transfers the organiser's net after the event.
    payment_intent_data: { metadata: meta },
    metadata: meta,
    success_url: `${SITE.url}/success?type=payment-event&eventId=${ev.id}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${SITE.url}/events/${ev.slug}`,
  };

  // PayNow (SG-local, one-time payments only) when enabled — if the Stripe
  // account doesn't have PayNow activated yet, retry card-only so flipping the
  // flag early never breaks checkout.
  if (flags.payNow) {
    try {
      const session = await stripe.checkout.sessions.create({ ...sessionParams, payment_method_types: ["card", "paynow"] });
      return NextResponse.json({ ok: true, url: session.url });
    } catch {
      /* fall through to card-only */
    }
  }
  const session = await stripe.checkout.sessions.create(sessionParams);
  return NextResponse.json({ ok: true, url: session.url });
}
