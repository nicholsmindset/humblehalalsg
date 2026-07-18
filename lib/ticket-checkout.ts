/* Pure decisions lifted out of the paid-ticket checkout route
   (app/api/checkout/ticket/route.ts) so the correctness-critical bits — the
   double-sell gate, the quantity clamp, and the Stripe line-item money split —
   are unit-testable without Stripe/Supabase. Isomorphic, no side effects. */

export type CapacityGate =
  | { ok: true }
  | { ok: false; reason: "insufficient_capacity" | "sold_out"; left: number };

/** Don't sell past capacity (security audit M2). capacity === 0 means unlimited.
 *  Distinguishes "some left, but not enough for this qty" (insufficient_capacity)
 *  from "none left" (sold_out) so the client can show the right message. The
 *  webhook's atomic increment is the final oversell-on-race backstop. */
export function capacityGate(args: { capacity: number; taken: number | null | undefined; qty: number }): CapacityGate {
  const { capacity, qty } = args;
  const taken = args.taken ?? 0;
  if (capacity > 0 && taken + qty > capacity) {
    const left = Math.max(0, capacity - taken);
    return { ok: false, reason: left > 0 ? "insufficient_capacity" : "sold_out", left };
  }
  return { ok: true };
}

/** Clamp a requested ticket quantity to 1–20 (garbage → 1). */
export function clampTicketQty(raw: unknown): number {
  return Math.max(1, Math.min(20, Number(raw) || 1));
}

export interface StripeLineItem {
  quantity: number;
  price_data: { currency: string; unit_amount: number; product_data: { name: string } };
}

/** Build the Stripe Checkout line items for a ticket order.
 *
 *  The classic presentation (face × qty + a separate booking-fee line) only adds
 *  up when the order is undiscounted AND in pass mode. With a discount or an
 *  absorbed fee the per-unit price no longer matches the total, so we collapse to
 *  a single exact-total ticket line. A bug here charges the buyer the wrong
 *  amount, so the totals must always reconcile with computeOrder. */
export function buildTicketLineItems(args: {
  order: { subtotalCents: number; discountCents: number; feeCents: number };
  faceCents: number;
  qty: number;
  feeMode: "pass" | "absorb";
  ticketName: string;
  promoCode?: string | null;
  currency: string;
}): StripeLineItem[] {
  const { order, faceCents, qty, feeMode, ticketName, promoCode, currency } = args;
  const ticketLine: StripeLineItem =
    order.discountCents > 0
      ? {
          quantity: 1,
          price_data: {
            currency,
            unit_amount: order.subtotalCents - order.discountCents,
            product_data: { name: `${ticketName} × ${qty} (${promoCode})` },
          },
        }
      : { quantity: qty, price_data: { currency, unit_amount: faceCents, product_data: { name: ticketName } } };
  return feeMode === "pass" && order.feeCents > 0
    ? [ticketLine, { quantity: 1, price_data: { currency, unit_amount: order.feeCents, product_data: { name: "Booking fee" } } }]
    : [ticketLine];
}
