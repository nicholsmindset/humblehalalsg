import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { SITE } from "@/lib/seo";

/* Stripe Customer Portal for self-serve billing management. */
export async function POST() {
  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ ok: false, reason: "stripe_not_configured" });

  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, reason: "unauthenticated" }, { status: 401 });

  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ ok: false, reason: "db_not_configured" });

  const { data: biz } = await admin
    .from("businesses")
    .select("stripe_customer_id")
    .or(`owner_id.eq.${userId},claimed_by.eq.${userId}`)
    .maybeSingle();
  if (!biz?.stripe_customer_id) return NextResponse.json({ ok: false, reason: "no_customer" });

  const session = await stripe.billingPortal.sessions.create({
    customer: biz.stripe_customer_id,
    return_url: `${SITE.url}/owner`,
  });
  return NextResponse.json({ ok: true, url: session.url });
}
