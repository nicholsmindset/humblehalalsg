/* Client-safe order values for analytics (begin_checkout / purchase).
 *
 * Source of truth chain:
 *   1. lib/stripe-prices.json — real Stripe amounts written by
 *      `npm run sync:prices` (scripts/sync-stripe-prices.mjs, Stripe CLI/REST).
 *   2. lib/plans.ts display prices — fallback when the JSON hasn't been synced
 *      (fresh clone / CI), so begin_checkout always carries a value.
 *
 * Isomorphic + dependency-free; amounts are public (shown on /pricing). */

import stripePrices from "./stripe-prices.json";
import { PLANS, type PlanKey } from "./plans";

type PriceInfo = { amount: number | null; currency: string | null };

const byLabel = (stripePrices as { byLabel: Record<string, PriceInfo & { missing?: boolean }> }).byLabel || {};

function fromStripe(label: string): number | undefined {
  const p = byLabel[label];
  return p && typeof p.amount === "number" ? p.amount : undefined;
}

/** SGD value for a listing-plan checkout (verified/featured/premium × m/y). */
export function planCheckoutValue(plan: string, yearly: boolean, founding = false): number | undefined {
  if (founding) return fromStripe("VERIFIED_FOUNDING_Y");
  const label = `${plan.toUpperCase()}_${yearly ? "Y" : "M"}`;
  const stripe = fromStripe(label);
  if (stripe !== undefined) return stripe;
  const p = PLANS[plan as PlanKey];
  if (!p) return undefined;
  return yearly ? p.yearly : p.monthly;
}

/** SGD value for a lead-inbox subscription checkout. */
export function leadsCheckoutValue(founding = false): number | undefined {
  return fromStripe(founding ? "LEADS_FOUNDING_M" : "LEADS_M");
}
