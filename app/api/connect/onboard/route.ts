import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabase/server";
import { SITE } from "@/lib/seo";

/* Start/continue Stripe Connect (Express) onboarding for the signed-in business.
   Returns a hosted onboarding URL. Needs Stripe + Supabase auth configured. */
export async function POST() {
  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ ok: false, reason: "stripe_not_configured" });

  const supa = await getSupabaseServer();
  const admin = getSupabaseAdmin();
  if (!supa || !admin) return NextResponse.json({ ok: false, reason: "db_not_configured" });

  const { data: { user } } = await supa.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, reason: "unauthenticated" }, { status: 401 });

  const { data: biz } = await admin.from("businesses").select("id").eq("owner_id", user.id).maybeSingle();
  if (!biz) return NextResponse.json({ ok: false, reason: "no_business" }, { status: 404 });

  let { data: acct } = await admin
    .from("stripe_accounts")
    .select("stripe_account_id")
    .eq("business_id", biz.id)
    .maybeSingle();

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
}
