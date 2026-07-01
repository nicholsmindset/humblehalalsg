import { NextResponse } from "next/server";
import { getServerFlags } from "@/lib/flags";
import { getStripe } from "@/lib/stripe";
import { CURRENCY } from "@/lib/fees";
import { SITE } from "@/lib/seo";
import { AD_PRODUCTS } from "@/lib/ad-products";
import { rateLimit, tooMany } from "@/lib/ratelimit";

/* One-time advertising purchase (Event Promotion, Newsletter Sponsorship, etc.).
   Humble Halal is the seller. Amount in cents passed from a server-trusted map. */

export async function POST(req: Request) {
  if (!getServerFlags().paidAds) {
    return NextResponse.json({ ok: false, reason: "paid_ads_disabled" }, { status: 403 });
  }
  // Unauthenticated Stripe-session factory — rate-limit like /api/donate.
  const rl = await rateLimit(req, "checkout-promo", 12, 3600); if (!rl.ok) return tooMany(rl.retryAfter);
  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ ok: false, reason: "stripe_not_configured" });

  const { product } = (await req.json().catch(() => ({}))) as { product?: string };
  const item = product ? AD_PRODUCTS[product] : undefined;
  if (!item) return NextResponse.json({ ok: false, reason: "unknown_product" }, { status: 404 });

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      { quantity: 1, price_data: { currency: CURRENCY, unit_amount: item.cents, product_data: { name: item.name } } },
    ],
    metadata: { kind: "ad", product: product! },
    payment_intent_data: { metadata: { kind: "ad", product: product! } },
    success_url: `${SITE.url}/advertise?purchase=done&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${SITE.url}/advertise`,
  });
  return NextResponse.json({ ok: true, url: session.url });
}
