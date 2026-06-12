/* Humble Halal — ticketing fee model (single source of truth).
   Buyer pays a booking fee ON TOP of face value (business keeps full price).
   The booking fee == Stripe `application_fee_amount` (our commission).

   As merchant of record we pay Stripe's processing fee (~3.4% + S$0.50) out of
   this commission, so the buyer fee is set above that to net a margin. */

export const FEE_PCT = 0.065; // 6.5%
export const FEE_FIXED_CENTS = 79; // S$0.79
export const CURRENCY = "sgd";

/** Booking fee (our commission), in cents, for a given pre-fee subtotal in cents. */
export function bookingFeeCents(subtotalCents: number): number {
  if (subtotalCents <= 0) return 0;
  return Math.round(subtotalCents * FEE_PCT) + FEE_FIXED_CENTS;
}

export interface OrderMath {
  subtotalCents: number; // face × qty, goes to the business
  feeCents: number; // booking fee, our commission
  totalCents: number; // what the buyer pays
}

export function computeOrder(faceCents: number, qty: number): OrderMath {
  const subtotalCents = Math.max(0, Math.round(faceCents) * Math.max(1, qty));
  const feeCents = bookingFeeCents(subtotalCents);
  return { subtotalCents, feeCents, totalCents: subtotalCents + feeCents };
}

export const toCents = (dollars: number) => Math.round(dollars * 100);
export const fromCents = (cents: number) => cents / 100;
export const fmtSGD = (cents: number) =>
  new Intl.NumberFormat("en-SG", { style: "currency", currency: "SGD" }).format(cents / 100);
