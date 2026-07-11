import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { SITE } from "@/lib/seo";

/* Start/continue Stripe Connect (Express) onboarding for the signed-in business.
   Returns a hosted onboarding URL. Needs Stripe + Supabase auth configured. */
export async function POST() {
  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ ok: false, reason: "stripe_not_configured" });

  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, reason: "unauthenticated" }, { status: 401 });

  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ ok: false, reason: "db_not_configured" });

  const { data: biz } = await admin.from("businesses").select("id").or(`owner_id.eq.${userId},claimed_by.eq.${userId}`).maybeSingle();
  if (!biz) return NextResponse.json({ ok: false, reason: "no_business" }, { status: 404 });

  const { data: acct } = await admin
    .from("stripe_accounts")
    .select("stripe_account_id")
    .eq("business_id", biz.id)
    .maybeSingle();

  // Guarded: in live mode these throw until Stripe Connect is activated on the
  // platform account (Connect → platform profile) — surface a clean, logged
  // reason instead of an unhandled 500 the owner can't act on.
  try {
    let accountId = acct?.stripe_account_id as string | undefined;
    if (!accountId) {
      const created = await stripe.accounts.create({
        type: "express",
        country: "SG",
        capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
        business_type: "company",
      });
      accountId = created.id;
      await admin.from("stripe_accounts").upsert({ business_id: biz.id, stripe_account_id: accountId });
    }

    const link = await stripe.accountLinks.create({
      account: accountId,
      type: "account_onboarding",
      refresh_url: `${SITE.url}/owner?payouts=refresh`,
      return_url: `${SITE.url}/owner?payouts=done`,
    });
    return NextResponse.json({ ok: true, url: link.url });
  } catch (e) {
    console.error(`[connect/onboard] stripe onboarding failed (business=${biz.id}):`, e instanceof Error ? e.message : e);
    return NextResponse.json({ ok: false, reason: "stripe_error" }, { status: 502 });
  }
}
