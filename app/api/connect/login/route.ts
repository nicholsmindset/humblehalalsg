import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase/server";

/* Express dashboard login link for the signed-in owner's onboarded Connect
   account — powers the "Stripe dashboard" button on the payouts panel (which was
   permanently disabled). loginLinks require an Express account that has completed
   onboarding, so this 409s cleanly until then. */
export async function POST() {
  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ ok: false, reason: "stripe_not_configured" });

  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, reason: "unauthenticated" }, { status: 401 });

  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ ok: false, reason: "db_not_configured" });

  const { data: bizRows } = await admin
    .from("businesses")
    .select("id")
    .or(`owner_id.eq.${userId},claimed_by.eq.${userId}`)
    .limit(1);
  const biz = bizRows?.[0];
  if (!biz) return NextResponse.json({ ok: false, reason: "no_business" }, { status: 404 });

  const { data: acct } = await admin
    .from("stripe_accounts")
    .select("stripe_account_id")
    .eq("business_id", biz.id)
    .maybeSingle();
  if (!acct?.stripe_account_id) return NextResponse.json({ ok: false, reason: "not_onboarded" }, { status: 409 });

  try {
    const link = await stripe.accounts.createLoginLink(acct.stripe_account_id as string);
    return NextResponse.json({ ok: true, url: link.url });
  } catch (e) {
    // e.g. account not fully onboarded yet — clean reason, not a raw 500.
    console.error(`[connect/login] loginLink failed (business=${biz.id}):`, e instanceof Error ? e.message : e);
    return NextResponse.json({ ok: false, reason: "stripe_error" }, { status: 502 });
  }
}
