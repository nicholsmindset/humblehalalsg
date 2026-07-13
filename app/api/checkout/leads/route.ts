import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getServerFlags } from "@/lib/feature-flags";
import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { SITE } from "@/lib/seo";
import { rateLimit, tooMany } from "@/lib/ratelimit";
import { leadPlan, leadPriceId, FOUNDING_LEAD_MONTHLY, LEAD_PLANS } from "@/lib/lead-plans";

/* Lead-subscription checkout (Humble Halal is the seller — no Connect).
   Clones checkout/plan/route.ts: resolves the owner's business + Stripe
   customer and creates a subscription session tagged kind=leads so the webhook
   fulfils it WITHOUT touching businesses.plan. Fail-closed: never create a
   subscription we can't attribute to a business (webhook would skip it and the
   buyer couldn't self-cancel). */

const FOUNDING_LIMIT = 25; // first N Lead Inbox subscribers platform-wide get the founding rate
// NOTE: the Lead Inbox subscription is a single per-business product — it has no
// vertical dimension (verticals live on individual leads + lead_preferences, for
// routing). So this cap is counted platform-wide, which is correct; earlier
// "per vertical" comments were inaccurate.

export async function POST(req: Request) {
  if (!(await getServerFlags()).paidLeads) {
    return NextResponse.json({ ok: false, error: "paid_leads_disabled" }, { status: 403 });
  }
  const rl = await rateLimit(req, "checkout-leads", 12, 3600); if (!rl.ok) return tooMany(rl.retryAfter);
  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ ok: false, error: "stripe_not_configured" });

  const { plan: planKeyRaw } = (await req.json().catch(() => ({}))) as { plan?: string };
  const plan = leadPlan(planKeyRaw || "inbox15") || LEAD_PLANS.inbox15;

  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, error: "not_signed_in" }, { status: 401 });
  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ ok: false, error: "unavailable" }, { status: 503 });

  let customer: string | undefined;
  let businessId: string;
  try {
    const { data: biz, error } = await admin
      .from("businesses").select("id, name, stripe_customer_id")
      .or(`owner_id.eq.${userId},claimed_by.eq.${userId}`)
      .order("created_at", { ascending: true }).limit(1).maybeSingle();
    if (error) return NextResponse.json({ ok: false, error: "unavailable" }, { status: 503 });
    if (!biz) return NextResponse.json({ ok: false, error: "no_business" }, { status: 404 });
    businessId = biz.id as string;
    customer = (biz.stripe_customer_id as string) || undefined;
    if (!customer) {
      const cu = await currentUser();
      const email = cu?.primaryEmailAddress?.emailAddress ?? cu?.emailAddresses?.[0]?.emailAddress ?? "";
      const created = await stripe.customers.create({ email: email || undefined, name: (biz.name as string) || undefined, metadata: { business_id: businessId } });
      customer = created.id;
      await admin.from("businesses").update({ stripe_customer_id: customer }).eq("id", businessId);
    }
  } catch {
    return NextResponse.json({ ok: false, error: "unavailable" }, { status: 503 });
  }

  // Never create a SECOND leads subscription (audit streams-P1-6): the UI hides
  // the CTA when one is active, but a double-click / webhook-lag race would
  // bill twice. Mirrors checkout/plan's already_subscribed guard.
  try {
    const { data: subs } = await admin
      .from("subscriptions").select("id")
      .eq("business_id", businessId).eq("kind", "leads").in("status", ["active", "trialing", "past_due"]).limit(1);
    let hasLeadsSub = !!subs?.length;
    if (!hasLeadsSub && customer) {
      const live = await stripe.subscriptions.list({ customer, status: "active", limit: 10 });
      hasLeadsSub = live.data.some((s) => s.metadata?.kind === "leads");
    }
    if (hasLeadsSub) return NextResponse.json({ ok: false, error: "already_subscribed" }, { status: 409 });
  } catch { /* transient — proceed */ }

  // Founding rate while under the platform-wide founding cap AND the price is configured.
  let founding = false;
  if (process.env.STRIPE_PRICE_LEADS_FOUNDING_M) {
    const { count } = await admin
      .from("subscriptions").select("id", { count: "exact", head: true })
      .eq("kind", "leads").in("status", ["active", "trialing"]);
    founding = (count || 0) < FOUNDING_LIMIT;
  }
  const price = leadPriceId(plan.key, founding);
  if (!price) return NextResponse.json({ ok: false, error: "price_not_configured" }, { status: 409 });

  const meta = { kind: "leads", lead_plan: plan.key, business_id: businessId, monthly_quota: String(plan.quota) };
  // Guarded: a bad key or test-mode/archived price throws — return a clean,
  // logged reason instead of an unhandled 500 (mirrors checkout/plan).
  let session: Awaited<ReturnType<typeof stripe.checkout.sessions.create>>;
  try {
    session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price, quantity: 1 }],
      customer,
      metadata: meta,
      subscription_data: { metadata: meta },
      success_url: `${SITE.url}/owner?tab=leads&billing=done&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE.url}/owner?tab=leads`,
    });
  } catch (e) {
    console.error(`[checkout/leads] stripe session create failed (price=${price}):`, e instanceof Error ? e.message : e);
    return NextResponse.json({ ok: false, error: "stripe_error" }, { status: 502 });
  }

  return NextResponse.json({ ok: true, url: session.url, founding, rate: founding ? FOUNDING_LEAD_MONTHLY : plan.monthly });
}
