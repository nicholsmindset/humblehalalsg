import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getServerFlags } from "@/lib/feature-flags";
import { getStripe } from "@/lib/stripe";
import { FOUNDING } from "@/lib/plans";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { beehiivSubscribe } from "@/lib/beehiiv";
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
// Founding-member rate (lib/plans FOUNDING): Verified billed yearly at the
// locked launch price. Only claimable when this dedicated Stripe price is
// configured — otherwise the API refuses rather than silently charging the
// standard rate the banner didn't promise.
const PRICE_FOUNDING_Y = process.env.STRIPE_PRICE_VERIFIED_FOUNDING_Y;

export async function POST(req: Request) {
  if (!(await getServerFlags()).paidPlans) {
    return NextResponse.json({ ok: false, reason: "paid_plans_disabled" }, { status: 403 });
  }
  // Stripe-session factory — rate-limit like /api/donate.
  const rl = await rateLimit(req, "checkout-plan", 12, 3600); if (!rl.ok) return tooMany(rl.retryAfter);
  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ ok: false, reason: "stripe_not_configured" });

  const { plan, yearly, founding } = (await req.json().catch(() => ({}))) as { plan?: string; yearly?: boolean; founding?: boolean };
  let price = plan ? PRICE_ENV[plan]?.[yearly ? "yearly" : "monthly"] : undefined;
  if (founding) {
    if (plan !== "verified" || !PRICE_FOUNDING_Y) {
      return NextResponse.json({ ok: false, reason: "founding_not_available" }, { status: 409 });
    }
    // Enforce the advertised founding cap SERVER-SIDE (audit paidPlans-01) — the
    // banner promises the locked rate to only the first FOUNDING.cap businesses,
    // but nothing stopped it being sold forever. The dedicated founding price ID
    // is the natural marker: any active subscription on it is a founding member.
    // Count up to the cap; fail CLOSED (deny the discount, NOT the sale — the
    // buyer can still take the standard rate) so we can never oversell it.
    try {
      let active = 0;
      let startingAfter: string | undefined;
      for (let page = 0; page < 5 && active < FOUNDING.cap; page++) {
        const list = await stripe.subscriptions.list({
          price: PRICE_FOUNDING_Y, status: "active", limit: 100,
          ...(startingAfter ? { starting_after: startingAfter } : {}),
        });
        active += list.data.length;
        if (!list.has_more || list.data.length === 0) break;
        startingAfter = list.data[list.data.length - 1]?.id;
      }
      if (active >= FOUNDING.cap) {
        return NextResponse.json({ ok: false, reason: "founding_sold_out", cap: FOUNDING.cap }, { status: 409 });
      }
    } catch {
      // Couldn't verify the count → don't risk overselling the discount.
      return NextResponse.json({ ok: false, reason: "founding_sold_out", cap: FOUNDING.cap }, { status: 409 });
    }
    price = PRICE_FOUNDING_Y;
  }
  if (!price) return NextResponse.json({ ok: false, reason: "price_not_configured" });

  // Link the signed-in owner's business + Stripe customer so fulfillment + the
  // billing portal work. A checkout WITHOUT a resolved business must never be
  // created: the webhook skips fulfillment on an empty business_id and the
  // billing portal can't find the customer, so the buyer would pay a recurring
  // subscription for nothing with no way to self-cancel. Fail closed instead.
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, reason: "not_signed_in" }, { status: 401 });
  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ ok: false, reason: "unavailable" }, { status: 503 });

  let customer: string | undefined;
  let businessId: string;
  let ownerEmail = "";
  try {
    const { data: biz, error } = await admin.from("businesses").select("id, name, stripe_customer_id").eq("owner_id", userId).maybeSingle();
    if (error) return NextResponse.json({ ok: false, reason: "unavailable" }, { status: 503 });
    if (!biz) return NextResponse.json({ ok: false, reason: "no_business" }, { status: 404 });
    businessId = biz.id as string;
    customer = (biz.stripe_customer_id as string) || undefined;
    const cu = await currentUser();
    ownerEmail = cu?.primaryEmailAddress?.emailAddress ?? cu?.emailAddresses?.[0]?.emailAddress ?? "";
    if (!customer) {
      const created = await stripe.customers.create({ email: ownerEmail || undefined, name: (biz.name as string) || undefined, metadata: { business_id: businessId } });
      customer = created.id;
      await admin.from("businesses").update({ stripe_customer_id: customer }).eq("id", businessId);
    }
  } catch {
    // Transient Clerk/Supabase/Stripe error — refuse rather than risk an
    // anonymous, unfulfillable subscription charge.
    return NextResponse.json({ ok: false, reason: "unavailable" }, { status: 503 });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price, quantity: 1 }],
    customer,
    metadata: { plan: plan!, business_id: businessId },
    subscription_data: { metadata: { plan: plan!, business_id: businessId } },
    success_url: `${SITE.url}/owner?billing=done&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${SITE.url}/pricing`,
  });

  // Abandoned-checkout signal (best-effort, non-blocking): tag the owner as
  // checkout_started so a beehiiv recovery automation can follow up. Transactional
  // (no welcome email); the webhook flips stage → subscribed on success to suppress
  // recovery. Only fires when we resolved the owner's email.
  if (ownerEmail) {
    await beehiivSubscribe({
      email: ownerEmail,
      source: "checkout",
      stage: "checkout_started",
      sendWelcome: false,
      extraFields: [{ name: "checkout_plan", value: plan! }],
    });
  }

  return NextResponse.json({ ok: true, url: session.url });
}
