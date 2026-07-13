import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { SITE } from "@/lib/seo";

/* Stripe Customer Portal for self-serve billing management. */
export async function POST(req: Request) {
  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ ok: false, reason: "stripe_not_configured" });

  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, reason: "unauthenticated" }, { status: 401 });

  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ ok: false, reason: "db_not_configured" });

  const { businessId } = (await req.json().catch(() => ({}))) as { businessId?: string };

  // Resolve the Stripe customer to manage. A multi-business owner previously hit
  // .maybeSingle()'s "more than one row" error → biz=null → "no_customer", so a
  // paying owner was told "no active subscription" and couldn't cancel/update
  // their card. Use limit(1) over the businesses that actually have a customer;
  // when the dashboard sends a specific businessId, scope to it (still
  // ownership-checked via the owner_id/claimed_by filter).
  let q = admin
    .from("businesses")
    .select("stripe_customer_id")
    .or(`owner_id.eq.${userId},claimed_by.eq.${userId}`)
    .not("stripe_customer_id", "is", null);
  if (businessId) q = q.eq("id", businessId);
  const { data: rows } = await q.limit(1);
  const customerId = (rows?.[0]?.stripe_customer_id as string | undefined) || undefined;
  if (!customerId) return NextResponse.json({ ok: false, reason: "no_customer" });

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${SITE.url}/owner`,
    });
    return NextResponse.json({ ok: true, url: session.url });
  } catch (e) {
    // e.g. no live Customer Portal configuration saved yet — surface a clean
    // reason instead of an unhandled 500 the client can't explain.
    console.error("[portal] billingPortal.sessions.create failed:", e instanceof Error ? e.message : e);
    return NextResponse.json({ ok: false, reason: "portal_unavailable" }, { status: 502 });
  }
}
