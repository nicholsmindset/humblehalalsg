import { NextResponse } from "next/server";
import { getServerFlags } from "@/lib/flags";
import { liteapiConfigured, book } from "@/lib/liteapi";
import { getSupabaseAdmin } from "@/lib/supabase/server";

/* Step 3 of booking — confirm the booking with LiteAPI (merchant of record via
   its Payment SDK; method TRANSACTION_ID), then record the outcome + commission
   for our ledger. Gated by PAID_HOTELS_ENABLED; graceful without a key.
   Booking context (hotel/dates/totals) is passed from the client search/prebook
   state since the book response doesn't echo all of it. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  if (!getServerFlags().paidHotels) {
    return NextResponse.json({ ok: false, reason: "hotel_booking_disabled" }, { status: 403 });
  }
  if (!liteapiConfigured()) return NextResponse.json({ ok: false, reason: "liteapi_not_configured" });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const prebookId = String(body.prebookId || "").trim();
  const transactionId = String(body.transactionId || "").trim();
  const holder = (body.holder || {}) as { firstName?: string; lastName?: string; email?: string; phone?: string };
  if (!prebookId || !transactionId) {
    return NextResponse.json({ ok: false, error: "Missing prebook or payment reference" }, { status: 422 });
  }
  if (!holder.email || !EMAIL_RE.test(holder.email)) {
    return NextResponse.json({ ok: false, error: "A valid guest email is required" }, { status: 422 });
  }

  let result;
  try {
    result = await book({
      prebookId,
      holder,
      guests: body.guests || [holder],
      payment: { method: "TRANSACTION_ID", transactionId },
      ...(body.clientReference ? { clientReference: String(body.clientReference) } : {}),
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Booking failed" }, { status: 502 });
  }

  // Persist outcome + commission (best-effort; never fail the booking on a DB hiccup).
  const db = getSupabaseAdmin();
  if (db) {
    try {
      const currency = String(body.currency || "USD");
      const commission = body.commissionAmount != null ? Number(body.commissionAmount) : null;
      const { data: bk } = await db
        .from("hotel_bookings")
        .insert({
          liteapi_booking_id: result.bookingId ?? null,
          hotel_confirmation_code: result.hotelConfirmationCode ?? null,
          liteapi_hotel_id: body.liteapiHotelId ?? null,
          hotel_name: body.hotelName ?? null,
          city: body.city ?? null,
          country: body.country ?? null,
          checkin: body.checkin ?? null,
          checkout: body.checkout ?? null,
          occupancies: body.occupancies ?? [],
          guest_email: holder.email,
          currency,
          retail_total: body.retailTotal != null ? Number(body.retailTotal) : null,
          commission_amount: commission,
          refundable_tag: body.refundableTag ?? null,
          muslim_friendly_tags: Array.isArray(body.tags) ? body.tags : [],
          status: "confirmed",
        })
        .select("id")
        .single();
      if (bk?.id && commission != null) {
        await db.from("hotel_commissions").insert({
          booking_id: bk.id,
          commission_amount: commission,
          currency,
          margin_pct: body.marginPct != null ? Number(body.marginPct) : null,
          payout_status: "upcoming",
        });
      }
    } catch {
      /* ledger write is best-effort */
    }
  }

  // Optional outbound CRM/automation webhook (best-effort, like MailerLite).
  const hook = process.env.BOOKING_WEBHOOK_URL;
  if (hook) {
    try {
      await fetch(hook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "hotel_booking",
          bookingId: result.bookingId,
          confirmationCode: result.hotelConfirmationCode,
          holder,
          hotel: body.hotelName,
          city: body.city,
          checkin: body.checkin,
          checkout: body.checkout,
        }),
      });
    } catch {
      /* best-effort */
    }
  }

  return NextResponse.json({ ok: true, bookingId: result.bookingId, confirmationCode: result.hotelConfirmationCode });
}
