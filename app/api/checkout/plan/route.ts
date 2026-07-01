import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getServerFlags } from "@/lib/flags";
import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { SITE } from "@/lib/seo";
import { rateLimit, tooMany } from "@/lib/ratelimit";

/* Listing-plan subscription checkout (Humble Halal is the seller — no Connect).
   Price IDs come from env so they can be swapped per environment. Links the
   Stripe customer + business so the webhook can set the plan and the billing
   portal can find the customer. */
const PRICE_ENV: Record<string, { monthly?: string; yearly?: string }> = {
  verified: { monthly: process.env.STRIPE_PRICE_VERIFIED_M, yearly: process.env.STRIPE_PRICE_VERIFIED_Y },
  featured: { monthly: process.env.STRIPE_PRICE_FEATURED_M, yearly: process.env.STRIPE_PRICE_FEATURED_Y },
  premium: { monthly: process.env.STRIPE_PRICE_PREMIUM_M, yearly: process.env.STRIPE_PRICE_PREMIUM_Y },
};

export async function POST(req: Request) {
  if (!getServerFlags().paidPlans) {
    return NextResponse.json({ ok: false, reason: "paid_plans_disabled" }, { status: 403 });
  }
  // Stripe-session factory — rate-limit like /api/donate.
  const rl = await rateLimit(req, "checkout-plan", 12, 3600); if (!rl.ok) return tooMany(rl.retryAfter);
  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ ok: false, reason: "stripe_not_configured" });

  const { plan, yearly } = (await req.json().catch(() => ({}))) as { plan?: string; yearly?: boolean };
  const price = plan ? PRICE_ENV[plan]?.[yearly ? "yearly" : "monthly"] : undefined;
  if (!price) return NextResponse.json({ ok: false, reason: "price_not_configured" });

  // Link the signed-in owner's business + Stripe customer so fulfillment + the
  // billing portal work. Falls back to an anonymous checkout if unauthenticated.
  let customer: string | undefined;
  let businessId: string | undefined;
  try {
    const { userId } = await auth();
    const admin = getSupabaseAdmin();
    if (userId && admin) {
      const { data: biz } = await admin.from("businesses").select("id, name, stripe_customer_id").eq("owner_id", userId).maybeSingle();
      if (biz) {
        businessId = biz.id as string;
        customer = (biz.stripe_customer_id as string) || undefined;
        if (!customer) {
          const cu = await currentUser();
          const email = cu?.primaryEmailAddress?.emailAddress ?? cu?.emailAddresses?.[0]?.emailAddress ?? "";
          const created = await stripe.customers.create({ email: email || undefined, name: (biz.name as string) || undefined, metadata: { business_id: businessId } });
          customer = created.id;
          await admin.from("businesses").update({ stripe_customer_id: customer }).eq("id", businessId);
        }
      }
    }
  } catch { /* fall through to anonymous checkout */ }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price, quantity: 1 }],
    ...(customer ? { customer } : {}),
    metadata: { plan: plan!, business_id: businessId || "" },
    subscription_data: { metadata: { plan: plan!, business_id: businessId || "" } },
    success_url: `${SITE.url}/owner?billing=done&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${SITE.url}/pricing`,
  });
  return NextResponse.json({ ok: true, url: session.url });
}
