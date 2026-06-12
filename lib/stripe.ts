/* Humble Halal — Stripe server singleton.
   Returns null when STRIPE_SECRET_KEY is unset (free-only launch / no keys yet),
   so callers can degrade gracefully instead of crashing. */
import Stripe from "stripe";

let cached: Stripe | null | undefined;

export function getStripe(): Stripe | null {
  if (cached !== undefined) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  cached = key ? new Stripe(key) : null;
  return cached;
}

export function stripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}
