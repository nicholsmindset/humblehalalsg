import "server-only";
import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";

/* Organiser-payout clawback (separate-charges model).
   Refunds and chargebacks debit the PLATFORM balance; Stripe never touches the
   transfer we already sent the organiser — reconciling is on us
   (docs.stripe.com/connect/separate-charges-and-transfers). Reversal only
   succeeds while the organiser's Stripe balance still covers it, so callers
   reverse IN THE SAME REQUEST as the refund/dispute — never a later cron. */

/** Set orders.payout_status, degrading to 'skipped' (also cron-safe) while the
 *  0062 check-constraint extension isn't pasted yet. */
export async function setPayoutStatus(db: SupabaseClient, orderId: string | number, status: string): Promise<void> {
  const { error } = await db.from("orders").update({ payout_status: status }).eq("id", orderId);
  if (error) await db.from("orders").update({ payout_status: "skipped" }).eq("id", orderId);
}

/** Claw back the organiser transfer for an order whose buyer money is being
 *  returned (refund) or contested (dispute) AFTER the payout ran. Idempotent
 *  per order. Returns what happened so callers can pick the right status. */
export async function reverseOrderTransferIfPaid(
  stripe: Stripe,
  db: SupabaseClient,
  order: { id: string | number; payout_status?: string | null; stripe_transfer_id?: string | null },
): Promise<"reversed" | "not_needed" | "failed"> {
  if (order.payout_status !== "paid" || !order.stripe_transfer_id) return "not_needed";
  try {
    await stripe.transfers.createReversal(order.stripe_transfer_id, {}, { idempotencyKey: `reverse_order_${order.id}` });
    await setPayoutStatus(db, order.id, "reversed");
    return "reversed";
  } catch (e) {
    // Most likely: the organiser's balance no longer covers it. Flag for manual
    // follow-up — the money has to come back some other way.
    console.error(`[payout-reversal] reversal failed (order=${order.id}, transfer=${order.stripe_transfer_id}):`, e instanceof Error ? e.message : e);
    await setPayoutStatus(db, order.id, "reverse_failed");
    return "failed";
  }
}
