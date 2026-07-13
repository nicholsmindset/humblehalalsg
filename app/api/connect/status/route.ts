import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

/* Real Stripe Connect status for the signed-in owner's business, so the payouts
   panel shows Connected / Pending / Restricted instead of a hardcoded "Not set
   up". Reads the mirrored stripe_accounts row (kept fresh by the account.updated
   webhook) — no Stripe API call, cheap enough for a dashboard mount. */
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, reason: "unauthenticated" }, { status: 401 });

  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ ok: false, reason: "db_not_configured" });

  // limit(1), never .maybeSingle() — a multi-business owner must not error here.
  const { data: bizRows } = await admin
    .from("businesses")
    .select("id")
    .or(`owner_id.eq.${userId},claimed_by.eq.${userId}`)
    .limit(1);
  const biz = bizRows?.[0];
  if (!biz) return NextResponse.json({ ok: true, status: "none" });

  const { data: acct } = await admin
    .from("stripe_accounts")
    .select("stripe_account_id, charges_enabled, payouts_enabled, details_submitted")
    .eq("business_id", biz.id)
    .maybeSingle();

  if (!acct?.stripe_account_id) return NextResponse.json({ ok: true, status: "none" });

  const chargesEnabled = !!acct.charges_enabled;
  const payoutsEnabled = !!acct.payouts_enabled;
  const detailsSubmitted = !!acct.details_submitted;
  // enabled: can accept charges + receive payouts. pending: details submitted,
  // Stripe still verifying. restricted: account exists but onboarding incomplete.
  const status = payoutsEnabled && chargesEnabled ? "enabled" : detailsSubmitted ? "pending" : "restricted";

  return NextResponse.json({ ok: true, status, chargesEnabled, payoutsEnabled, detailsSubmitted });
}
