import { NextResponse } from "next/server";
import { getServerFlags } from "@/lib/flags";
import { getStripe } from "@/lib/stripe";
import { CURRENCY } from "@/lib/fees";
import { SITE } from "@/lib/seo";

/* One-time advertising purchase (Event Promotion, Newsletter Sponsorship, etc.).
   Humble Halal is the seller. Amount in cents passed from a server-trusted map. */
const AD_PRODUCTS: Record<string, { name: string; cents: number }> = {
  "featured-listing": { name: "Featured Listing (1 month)", cents: 8900 },
  "homepage-spotlight": { name: "Homepage Spotlight (1 month)", cents: 45000 },
  "category-sponsorship": { name: "Category Sponsorship (1 month)", cents: 30000 },
  "newsletter-sponsorship": { name: "Newsletter Sponsorship", cents: 25000 },
  "event-promotion": { name: "Event Promotion", cents: 12000 },
};

export async function POST(req: Request) {
  if (!getServerFlags().paidAds) {
    return NextResponse.json({ ok: false, reason: "paid_ads_disabled" }, { status: 403 });
  }
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
    metadata: { product: product! },
    success_url: `${SITE.url}/advertise?purchase=done&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${SITE.url}/advertise`,
  });
  return NextResponse.json({ ok: true, url: session.url });
}
