/* Humble Halal — Stripe server singleton.
   Returns null when STRIPE_SECRET_KEY is unset (free-only launch / no keys yet),
   so callers can degrade gracefully instead of crashing. */
import Stripe from "stripe";

let cached: Stripe | null | undefined;

export function getStripe(): Stripe | null {
  if (cached !== undefined) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  // maxNetworkRetries: SDK-level retries are idempotency-key-safe, so transient
  // 429/5xx during a busy sale surface as latency, not failed checkouts.
  cached = key ? new Stripe(key, { maxNetworkRetries: 2 }) : null;
  return cached;
}

/* Card-statement branding: the Stripe account is shared with another product,
   so every one-off charge must carry our suffix or buyers see the other
   brand's descriptor → "unknown charge" → disputes. Statement rule: account
   shortened prefix + '* ' + suffix ≤ 22 chars, so keep this short. Subscriptions
   can't set a per-PI suffix — their Products carry statement_descriptor
   instead (set in Stripe). PayNow ignores descriptors entirely (buyers see
   Stripe Payments Singapore + a reference). */
export const STATEMENT_SUFFIX = "HUMBLEHALAL";

export function stripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}
