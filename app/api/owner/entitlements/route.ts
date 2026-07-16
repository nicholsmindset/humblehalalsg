import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { benefitsForPlan, expectedFeatured } from "@/lib/plan-entitlements";
import { planKey } from "@/lib/plans";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type OwnedBusiness = {
  id: string; name: string; slug: string; plan: string | null;
  featured: boolean | null; owner_id: string | null; claimed_by: string | null;
};

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });

  const requested = new URL(req.url).searchParams.get("business");
  let query = db.from("businesses")
    .select("id,name,slug,plan,featured,owner_id,claimed_by")
    .or(`owner_id.eq.${userId},claimed_by.eq.${userId}`);
  if (requested) query = query.eq("id", requested);
  const { data: rows, error } = await query.limit(1);
  if (error) return NextResponse.json({ ok: false, error: "load_failed" }, { status: 500 });
  const business = (rows?.[0] as OwnedBusiness | undefined) ?? null;
  if (!business) return NextResponse.json({ ok: false, error: "no_business" }, { status: 404 });

  const { data: subscriptions } = await db.from("subscriptions")
    .select("stripe_subscription_id,plan,status,current_period_end,created_at")
    .eq("business_id", business.id)
    .or("kind.eq.plan,kind.is.null")
    .order("created_at", { ascending: false })
    .limit(1);
  const subscription = subscriptions?.[0] ?? null;
  const plan = planKey(business);
  const placementConsistent = expectedFeatured(plan) === !!business.featured;
  const paid = plan !== "free";
  const payableStatus = new Set(["active", "trialing", "past_due"]);
  const billingConsistent = !paid || (!!subscription && payableStatus.has(String(subscription.status)) && planKey(subscription.plan) === plan);
  const activationStatus = placementConsistent && billingConsistent
    ? "active"
    : paid && !subscription ? "activating" : "needs_review";

  return NextResponse.json({
    ok: true,
    business: { id: business.id, name: business.name, slug: business.slug },
    plan,
    activationStatus,
    automaticBenefitsActive: placementConsistent,
    billing: subscription ? {
      status: subscription.status,
      currentPeriodEnd: subscription.current_period_end,
    } : null,
    benefits: benefitsForPlan(plan).map((benefit) => ({
      ...benefit,
      status: benefit.delivery === "earned" ? "review_available"
        : benefit.delivery === "capacity" ? "included"
          : benefit.delivery === "available" ? "unlocked" : "active",
    })),
  });
}
