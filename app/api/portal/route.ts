import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabase/server";
import { SITE } from "@/lib/seo";

/* Stripe Customer Portal for self-serve billing management. */
export async function POST() {
  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ ok: false, reason: "stripe_not_configured" });

  const supa = await getSupabaseServer();
  const admin = getSupabaseAdmin();
  if (!supa || !admin) return NextResponse.json({ ok: false, reason: "db_not_configured" });

  const { data: { user } } = await supa.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, reason: "unauthenticated" }, { status: 401 });

  const { data: biz } = await admin
    .from("businesses")
    .select("stripe_customer_id")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!biz?.stripe_customer_id) return NextResponse.json({ ok: false, reason: "no_customer" });

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: biz.stripe_customer_id,
      return_url: `${SITE.url}/owner`,
    });
    return NextResponse.json({ ok: true, url: session.url });
  } catch {
    return NextResponse.json({ ok: false, reason: "stripe_error" }, { status: 502 });
  }
}
