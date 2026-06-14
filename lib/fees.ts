/* Humble Halal — ticketing fee model (single source of truth).
   Buyer pays a booking fee ON TOP of face value (the organiser keeps the full
   face value). Our commission = 5% of the ticket subtotal + S$0.50 per ticket.

   Money flow (see app/api/checkout/ticket): we take a SEPARATE charge on the
   platform for face + fee (funds held by Humble Halal), then a cron transfers
   the face value (subtotal) to the organiser's Connect account 24h after the
   event ends. We keep the booking fee as commission (out of which we pay
   Stripe's processing fee). */

export const FEE_PCT = 0.05; // 5% of subtotal
export const FEE_PER_TICKET_CENTS = 50; // + S$0.50 per ticket
export const CURRENCY = "sgd";

/** Booking fee (our commission) in cents for a subtotal + ticket quantity. */
export function bookingFeeCents(subtotalCents: number, qty: number): number {
  if (subtotalCents <= 0) return 0;
  return Math.round(subtotalCents * FEE_PCT) + FEE_PER_TICKET_CENTS * Math.max(1, qty);
}

export interface OrderMath {
  subtotalCents: number; // face × qty — transferred to the organiser after the event
  feeCents: number; // booking fee — our commission, kept on the platform
  totalCents: number; // what the buyer pays (subtotal + fee)
}

export function computeOrder(faceCents: number, qty: number): OrderMath {
  const q = Math.max(1, qty);
  const subtotalCents = Math.max(0, Math.round(faceCents) * q);
  const feeCents = bookingFeeCents(subtotalCents, q);
  return { subtotalCents, feeCents, totalCents: subtotalCents + feeCents };
}

export const toCents = (dollars: number) => Math.round(dollars * 100);
export const fromCents = (cents: number) => cents / 100;
export const fmtSGD = (cents: number) =>
  new Intl.NumberFormat("en-SG", { style: "currency", currency: "SGD" }).format(cents / 100);
