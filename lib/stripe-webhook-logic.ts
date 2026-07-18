/* Pure decision + money math lifted out of the Stripe webhook handler
   (app/api/webhooks/stripe/route.ts) so the high-stakes branches are unit-
   testable in isolation. NOTHING here touches Stripe or Supabase at runtime —
   it takes plain values and returns plain values, so the route stays the only
   place with side effects. Isomorphic (no "server-only"), same as lib/fees.ts. */

/** Listing plans that light up the "featured" flag. Single source shared by the
 *  subscription-checkout and subscription.* branches. */
export const FEATURED_PLANS = new Set(["featured", "premium"]);

/** YYYY-MM-DD `days` after `base` (UTC). Used for the +24h organiser payout date. */
export function addDaysISO(base: Date, days: number): string {
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Donation refund reconciliation math (audit streams-P2-7). Stripe fires
 *  charge.refunded for partial refunds too, and re-delivers events, so the
 *  public "raised" figure must drop by the NEWLY-refunded delta exactly once —
 *  correct across a partial, a later partial, a full refund, and any replay.
 *  Clamped to the donation's own amount so a weird payload can't over-decrement. */
export function donationRefundDelta(args: {
  amountRefundedCents: number | null | undefined;
  alreadyRefundedCents: number | null | undefined;
  donatedCents: number | null | undefined;
  chargeFullyRefunded: boolean;
}): { newRefundedCents: number; deltaCents: number; shouldApply: boolean; markRefunded: boolean } {
  const amountRefunded = Number(args.amountRefundedCents) || 0;
  const already = Number(args.alreadyRefundedCents) || 0;
  const donated = Number(args.donatedCents) || 0;
  // Clamp to the recorded donation (fall back to the raw amount when we don't
  // know the donation size) so the public total can't go negative beyond this
  // donation's own contribution.
  const newRefundedCents = Math.min(amountRefunded, donated || amountRefunded);
  const deltaCents = newRefundedCents - already;
  return { newRefundedCents, deltaCents, shouldApply: deltaCents > 0, markRefunded: args.chargeFullyRefunded };
}

export interface TicketOrderMoney {
  qty: number;
  subtotalCents: number;
  feeCents: number;
  /** What the organiser is owed. netCents metadata is authoritative (fee-mode +
   *  promo aware); legacy sessions carry only subtotalCents (whose old meaning
   *  WAS the organiser net), so it's the fallback. */
  netCents: number;
  totalCents: number;
  discountCents: number;
  feeMode: "pass" | "absorb";
}

/** Derive the order's money split from Checkout Session metadata + amount_total.
 *  Mirrors the ticket branch exactly so the recorded order matches what the
 *  buyer was charged (a bug here mis-pays the organiser or mis-records revenue). */
export function resolveTicketOrderMoney(
  m: Record<string, string | undefined>,
  amountTotalCents: number | null | undefined,
): TicketOrderMoney {
  const qty = Math.max(1, parseInt(m.qty || "1", 10));
  const subtotalCents = parseInt(m.subtotalCents || "0", 10);
  const feeCents = parseInt(m.feeCents || "0", 10);
  const netCents = m.netCents != null && m.netCents !== "" ? parseInt(m.netCents, 10) : subtotalCents;
  const totalCents = amountTotalCents ?? subtotalCents + feeCents;
  const discountCents = parseInt(m.discountCents || "0", 10) || 0;
  const feeMode = m.feeMode === "absorb" ? "absorb" : "pass";
  return { qty, subtotalCents, feeCents, netCents, totalCents, discountCents, feeMode };
}

/** Whether the organiser is due a payout for this order. Only when the money is
 *  routed to a connected account AND there's a positive net to send. */
export function ticketPayoutStatus(connectedAccount: string | null | undefined, netCents: number): "pending" | "none" {
  return connectedAccount && netCents > 0 ? "pending" : "none";
}

/** How a subscription.* status maps to the listing plan. Encodes the dunning
 *  grace: 'past_due' means one renewal charge failed and Stripe Smart Retries
 *  are still running, so DON'T downgrade the paying listing yet — leave the
 *  business row untouched. Downgrade only on terminal/non-paying states. */
export function subscriptionListingUpdate(
  status: string,
  plan: string | null,
): { effectivePlan: string; featured: boolean; shouldUpdateBusiness: boolean } {
  const active = status === "active" || status === "trialing";
  return {
    effectivePlan: active && plan ? plan : "free",
    featured: active && FEATURED_PLANS.has(plan || ""),
    shouldUpdateBusiness: status !== "past_due",
  };
}
