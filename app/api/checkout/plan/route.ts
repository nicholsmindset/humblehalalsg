import { NextResponse } from "next/server";
import { getServerFlags } from "@/lib/flags";
import { getStripe } from "@/lib/stripe";
import { SITE } from "@/lib/seo";

/* Listing-plan subscription checkout (Humble Halal is the seller — no Connect).
   Price IDs come from env so they can be swapped per environment. */
const PRICE_ENV: Record<string, { monthly?: string; yearly?: string }> = {
  verified: { monthly: process.env.STRIPE_PRICE_VERIFIED_M, yearly: process.env.STRIPE_PRICE_VERIFIED_Y },
  featured: { monthly: process.env.STRIPE_PRICE_FEATURED_M, yearly: process.env.STRIPE_PRICE_FEATURED_Y },
  premium: { monthly: process.env.STRIPE_PRICE_PREMIUM_M, yearly: process.env.STRIPE_PRICE_PREMIUM_Y },
};

export async function POST(req: Request) {
  if (!getServerFlags().paidPlans) {
    return NextResponse.json({ ok: false, reason: "paid_plans_disabled" }, { status: 403 });
  }
  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ ok: false, reason: "stripe_not_configured" });

  const { plan, yearly } = (await req.json().catch(() => ({}))) as { plan?: string; yearly?: boolean };
  const price = plan ? PRICE_ENV[plan]?.[yearly ? "yearly" : "monthly"] : undefined;
  if (!price) return NextResponse.json({ ok: false, reason: "price_not_configured" });

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price, quantity: 1 }],
    metadata: { plan: plan! },
    success_url: `${SITE.url}/owner?billing=done&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${SITE.url}/pricing`,
  });
  return NextResponse.json({ ok: true, url: session.url });
}
