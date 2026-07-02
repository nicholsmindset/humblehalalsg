/* Humble Halal — ticketing fee model (single source of truth).
   Our commission = 5% of the ticket subtotal + S$0.50 per ticket. Who pays it
   depends on the event's fee mode:
     * "pass" (default): the buyer pays the booking fee ON TOP of face value;
       the organiser keeps the full (discounted) face value.
     * "absorb": the buyer pays face value only; the fee comes out of the
       organiser's share (Eventbrite-style "absorb fees" option).
   Promo discounts are applied to the face subtotal BEFORE the fee is computed,
   so the commission is always a share of money actually collected.

   Money flow (see app/api/checkout/ticket): we take a SEPARATE charge on the
   platform for the buyer total (funds held by Humble Halal), then a cron
   transfers the organiser's net to their Connect account 24h after the event
   ends. We keep the booking fee as commission (out of which we pay Stripe's
   processing fee). */

export const FEE_PCT = 0.05; // 5% of subtotal
export const FEE_PER_TICKET_CENTS = 50; // + S$0.50 per ticket
export const CURRENCY = "sgd";

export type FeeMode = "pass" | "absorb";

/** Booking fee (our commission) in cents for a subtotal + ticket quantity. */
export function bookingFeeCents(subtotalCents: number, qty: number): number {
  if (subtotalCents <= 0) return 0;
  return Math.round(subtotalCents * FEE_PCT) + FEE_PER_TICKET_CENTS * Math.max(1, qty);
}

export interface OrderMath {
  subtotalCents: number; // face × qty, before any discount
  discountCents: number; // promo discount actually applied (≤ subtotal)
  feeCents: number; // booking fee — our commission, kept on the platform
  totalCents: number; // what the buyer pays
  netCents: number; // transferred to the organiser after the event
  feeMode: FeeMode;
}

export interface OrderOpts {
  feeMode?: FeeMode;
  discountCents?: number;
}

export function computeOrder(faceCents: number, qty: number, opts: OrderOpts = {}): OrderMath {
  const feeMode: FeeMode = opts.feeMode === "absorb" ? "absorb" : "pass";
  const q = Math.max(1, qty);
  const subtotalCents = Math.max(0, Math.round(faceCents) * q);
  const discountCents = Math.min(subtotalCents, Math.max(0, Math.round(opts.discountCents ?? 0)));
  const discounted = subtotalCents - discountCents; // money actually collected for tickets

  if (feeMode === "absorb") {
    // Buyer pays the discounted face; our fee comes out of the organiser's
    // share, clamped so the organiser never goes negative on cheap tickets.
    const feeCents = Math.min(bookingFeeCents(discounted, q), discounted);
    return { subtotalCents, discountCents, feeCents, totalCents: discounted, netCents: discounted - feeCents, feeMode };
  }

  const feeCents = bookingFeeCents(discounted, q);
  return { subtotalCents, discountCents, feeCents, totalCents: discounted + feeCents, netCents: discounted, feeMode };
}

export const toCents = (dollars: number) => Math.round(dollars * 100);
export const fromCents = (cents: number) => cents / 100;
export const fmtSGD = (cents: number) =>
  new Intl.NumberFormat("en-SG", { style: "currency", currency: "SGD" }).format(cents / 100);
