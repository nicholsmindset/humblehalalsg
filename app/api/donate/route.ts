import { NextResponse } from "next/server";
import { getStripe, STATEMENT_SUFFIX } from "@/lib/stripe";
import { CURRENCY } from "@/lib/fees";
import { getEvent } from "@/lib/data";
import { rowToEvent } from "@/lib/events-source";
import { SITE } from "@/lib/seo";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { rateLimit, tooMany } from "@/lib/ratelimit";
import { isSafeEventRef } from "@/lib/event-ref";

/* Zakat / sadaqah donation for a charity event. Creates a Stripe Checkout
   session (charged on the platform); the webhook records the donation and
   mirrors the running total into events.display. Donations are intentionally
   SEPARATE from ticket entry and not behind the paid-tickets flag, but they
   only run when Stripe is configured — otherwise we degrade gracefully so the
   UI can show a friendly "not open yet" message. Honest: no fabricated totals. */
const MIN_CENTS = 100; // S$1 floor
const MAX_CENTS = 5_000_00; // S$5,000 ceiling (sanity / fraud guard)

export async function POST(req: Request) {
  const rl = await rateLimit(req, "donate", 12, 3600);
  if (!rl.ok) return tooMany(rl.retryAfter);

  let body: { eventId?: string; amountCents?: number; name?: string; anonymous?: boolean };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, reason: "bad_request" }, { status: 400 }); }

  const amountCents = Math.round(Number(body.amountCents) || 0);
  if (!(amountCents >= MIN_CENTS && amountCents <= MAX_CENTS)) {
    return NextResponse.json({ ok: false, reason: "bad_amount" }, { status: 422 });
  }

  // Resolve the event (mock seed first, then published DB row) and require that
  // the organiser opted into donations for a charity event.
  const supa = getSupabaseAdmin();
  const eventId = String(body.eventId || "");
  let ev = getEvent(eventId);
  if (!ev && supa && isSafeEventRef(eventId)) {
    const { data: row } = await supa
      .from("events").select("*")
      .or(`id.eq.${eventId},slug.eq.${eventId}`)
      .eq("status", "published").maybeSingle();
    if (row) ev = rowToEvent(row);
  }
  if (!ev) return NextResponse.json({ ok: false, reason: "event_not_found" }, { status: 404 });
  if (!ev.donationEnabled) return NextResponse.json({ ok: false, reason: "donations_disabled" }, { status: 403 });

  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ ok: true, simulated: true }); // graceful pre-launch

  const meta: Record<string, string> = { kind: "donation", eventId: ev.id, amountCents: String(amountCents) };
  // Guarded: a misconfigured live key throws — return a clean, logged reason
  // instead of an unhandled 500 (mirrors checkout/plan).
  let session: Awaited<ReturnType<typeof stripe.checkout.sessions.create>>;
  try {
    session = await stripe.checkout.sessions.create({
      mode: "payment",
      submit_type: "donate",
      line_items: [{
        quantity: 1,
        price_data: {
          currency: CURRENCY,
          unit_amount: amountCents,
          product_data: { name: `Donation — ${ev.title}` },
        },
      }],
      // Shared Stripe account → carry our brand onto the card statement.
      payment_intent_data: { metadata: meta, statement_descriptor_suffix: STATEMENT_SUFFIX },
      metadata: meta,
      success_url: `${SITE.url}/success?type=donation&eventId=${ev.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE.url}/events/${ev.slug}`,
    });
  } catch (e) {
    console.error(`[donate] stripe session create failed (event=${ev.id}):`, e instanceof Error ? e.message : e);
    return NextResponse.json({ ok: false, reason: "stripe_error" }, { status: 502 });
  }

  return NextResponse.json({ ok: true, url: session.url });
}
