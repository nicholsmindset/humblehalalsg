import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { resolveBusinessFlag } from "@/lib/feature-flags";
import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { CURRENCY } from "@/lib/fees";
import { SITE } from "@/lib/seo";
import { rateLimit, tooMany } from "@/lib/ratelimit";
import { sendEmail } from "@/lib/email";

/* Owner self-serve campaign purchase — DRAFT-FIRST flow:

     1. validate placement/dates/creative server-side
     2. insert ad_campaigns row as status='draft', review_status='pending',
        created_via='self_serve' (nothing can serve yet)
     3. paidAds ON  → Stripe Checkout with only {kind:"ad_selfserve",
        campaignId, businessId} in metadata; the webhook flips draft→scheduled
        on payment (idempotent via the unique stripe_payment_intent)
        paidAds OFF → record as a request + alert the admin inbox to invoice
        manually — the owner sees "request received", never a dead end

   Serving needs BOTH the admin review approval AND the date window —
   /api/ads/active enforces both, so a paid campaign goes live at starts_on
   with no activation cron. Price is placement.monthly_rate_cents × months,
   always read from the DB — the client never supplies an amount. */

const MAX_MONTHS = 3;

export async function POST(req: Request) {
  const rl = await rateLimit(req, "owner-ad-checkout", 10, 3600); if (!rl.ok) return tooMany(rl.retryAfter);

  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, reason: "unauthenticated" }, { status: 401 });
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ ok: false, reason: "not_configured" }, { status: 503 });

  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const businessId = String(b.businessId || "").trim();
  const placementKey = String(b.placementKey || "").trim();
  const startsOn = String(b.startsOn || "").trim();
  const months = Math.round(Number(b.months) || 0);
  const title = String(b.title || "").trim().slice(0, 80);
  const body = String(b.body || "").trim().slice(0, 280);
  const targetUrl = String(b.targetUrl || "").trim().slice(0, 500);
  const imageUrl = String(b.imageUrl || "").trim().slice(0, 500);

  if (!businessId || !placementKey || !title) {
    return NextResponse.json({ ok: false, reason: "missing_fields" }, { status: 422 });
  }
  if (months < 1 || months > MAX_MONTHS) {
    return NextResponse.json({ ok: false, reason: "bad_duration" }, { status: 422 });
  }
  const todaySG = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Singapore", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startsOn) || startsOn < todaySG) {
    return NextResponse.json({ ok: false, reason: "bad_start_date" }, { status: 422 });
  }
  for (const u of [targetUrl, imageUrl]) {
    if (u && !/^https:\/\//.test(u)) return NextResponse.json({ ok: false, reason: "bad_url" }, { status: 422 });
  }

  // Ownership — campaigns are only bookable for a business the caller owns.
  const { data: biz } = await sb.from("businesses").select("id, name, owner_id, claimed_by").eq("id", businessId).maybeSingle();
  if (!biz) return NextResponse.json({ ok: false, reason: "business_not_found" }, { status: 404 });
  if (biz.owner_id !== userId && biz.claimed_by !== userId) {
    return NextResponse.json({ ok: false, reason: "forbidden" }, { status: 403 });
  }

  // Placement must exist, be active, and take direct campaigns.
  const { data: placement } = await sb.from("ad_placements").select("*").eq("key", placementKey).maybeSingle();
  if (!placement || placement.active === false || placement.fill_mode === "off" || placement.fill_mode === "adsense_only") {
    return NextResponse.json({ ok: false, reason: "placement_unavailable" }, { status: 422 });
  }
  const monthlyRate = Number(placement.monthly_rate_cents) || 0;
  if (monthlyRate <= 0) return NextResponse.json({ ok: false, reason: "placement_unavailable" }, { status: 422 });
  const rateCents = monthlyRate * months;

  // ends_on = starts_on + months (calendar), exclusive-ish: last served day.
  const start = new Date(`${startsOn}T00:00:00Z`);
  const end = new Date(start);
  end.setUTCMonth(end.getUTCMonth() + months);
  end.setUTCDate(end.getUTCDate() - 1);
  const endsOn = end.toISOString().slice(0, 10);

  // Owner-scoped — businessId already validated above, so resolve per-business
  // (business override ?? global ?? env) rather than the global-only gate.
  const paidAds = await resolveBusinessFlag("paidAds", businessId);

  const { data: campaign, error } = await sb
    .from("ad_campaigns")
    .insert({
      title,
      placement_key: placementKey,
      business_id: businessId,
      advertiser_name: String(biz.name || "").slice(0, 120) || null,
      body: body || null,
      image_url: imageUrl || null,
      target_url: targetUrl || null,
      status: "draft", // stays draft until the webhook confirms payment
      review_status: "pending", // brand-safety review gate — always
      created_via: "self_serve",
      starts_on: startsOn,
      ends_on: endsOn,
      rate_cents: rateCents,
      notes: paidAds ? null : "self-serve request while paidAds off — invoice manually",
      created_by: userId,
    })
    .select("id")
    .single();
  if (error || !campaign) return NextResponse.json({ ok: false, reason: "db_error" }, { status: 500 });

  // Flag off → request mode: no charge, admin follows up with an invoice.
  if (!paidAds) {
    try {
      const inbox = process.env.CONTACT_INBOX || "hello@humblehalal.com";
      await sendEmail({
        to: inbox,
        subject: `Self-serve ad request: ${title} (${placementKey})`,
        template: "ad-selfserve-request",
        html: `<p>New self-serve campaign request (paid ads are OFF — invoice manually).</p>
<p><strong>${title}</strong> · ${placementKey} · ${startsOn} → ${endsOn} · S$${(rateCents / 100).toFixed(0)}<br>
Business: ${String(biz.name || businessId)}<br>Campaign id: ${campaign.id}</p>`,
      });
    } catch { /* alert best-effort — the campaign row is the queue of record */ }
    return NextResponse.json({ ok: true, mode: "request", campaignId: campaign.id });
  }

  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ ok: false, reason: "stripe_not_configured" }, { status: 503 });

  // Metadata carries ONLY identifiers — the campaign row already holds the
  // creative + dates (draft-first avoids Stripe's 500-char metadata limits).
  const meta = { kind: "ad_selfserve", campaignId: String(campaign.id), businessId };
  // Guarded: a misconfigured live key throws — return a clean, logged reason
  // instead of an unhandled 500 that also strands the draft campaign row.
  let session: Awaited<ReturnType<typeof stripe.checkout.sessions.create>>;
  try {
    session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: CURRENCY,
            unit_amount: rateCents,
            product_data: { name: `${String(placement.label || placementKey)} — ${months} month${months > 1 ? "s" : ""} (from ${startsOn})` },
          },
        },
      ],
      metadata: meta,
      payment_intent_data: { metadata: meta },
      success_url: `${SITE.url}/owner?tab=ads&purchase=done&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE.url}/owner?tab=ads`,
    });
  } catch (e) {
    console.error(`[ads/checkout] stripe session create failed (campaign=${campaign.id}):`, e instanceof Error ? e.message : e);
    return NextResponse.json({ ok: false, reason: "stripe_error" }, { status: 502 });
  }
  return NextResponse.json({ ok: true, mode: "checkout", url: session.url, campaignId: campaign.id });
}
