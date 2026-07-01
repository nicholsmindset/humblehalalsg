import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getServerFlags } from "@/lib/flags";
import { liteapiConfigured, book } from "@/lib/liteapi";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { rateLimit, tooMany } from "@/lib/ratelimit";
import { sendEmail } from "@/lib/email";
import { hotelBookingEmail } from "@/lib/emails/templates";

/* Sanitize client-reported ledger money (security audit M3). These figures come
   from the client's prebook state and are reconciled against LiteAPI's weekly
   payout report — but we must reject tampered values (negatives, absurd amounts,
   injected currencies, commission > retail) before they pollute the ledger. */
const MONEY_MAX = 1_000_000; // sane per-booking ceiling
const toMoney = (v: unknown): number | null => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 && n <= MONEY_MAX ? n : null;
};
const toCurrency = (v: unknown): string => {
  const c = String(v ?? "").toUpperCase();
  return /^[A-Z]{3}$/.test(c) ? c : "USD";
};
const toPct = (v: unknown): number | null => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 && n <= 100 ? n : null;
};

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
  const rl = await rateLimit(req, "hotel-book", 10, 600); if (!rl.ok) return tooMany(rl.retryAfter);
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
      guests: (Array.isArray(body.guests) ? body.guests.slice(0, 9) : [holder]), // L3 cap

      payment: { method: "TRANSACTION_ID", transactionId },
      ...(body.clientReference ? { clientReference: String(body.clientReference) } : {}),
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Booking failed" }, { status: 502 });
  }

  // Link the booking to the signed-in traveller (for My Trips), if any.
  const { userId } = await auth();

  // Persist outcome + commission (best-effort; never fail the booking on a DB hiccup).
  const db = getSupabaseAdmin();
  if (db) {
    try {
      const currency = toCurrency(body.currency);
      const retailTotal = toMoney(body.retailTotal);
      let commission = toMoney(body.commissionAmount);
      // Commission can never exceed the retail total — drop tampered values.
      if (commission != null && retailTotal != null && commission > retailTotal) commission = null;
      const marginPct = toPct(body.marginPct);
      // Promo voucher applied at prebook (sanitized like the validate route).
      const voucherCode = String(body.voucherCode || "").trim().toUpperCase().slice(0, 32) || null;
      const discountAmount = voucherCode ? toMoney(body.discountAmount) : null;
      const { data: bk } = await db
        .from("hotel_bookings")
        .insert({
          user_id: userId,
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
          retail_total: retailTotal,
          commission_amount: commission,
          refundable_tag: body.refundableTag ?? null,
          voucher_code: voucherCode,
          discount_amount: discountAmount,
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
          margin_pct: marginPct,
          payout_status: "upcoming",
        });
      }
    } catch {
      /* ledger write is best-effort */
    }
  }

  // Confirmation email to the guest (best-effort — never affects the booking response).
  try {
    const holderName = [holder.firstName, holder.lastName].filter(Boolean).join(" ").trim() || null;
    const t = hotelBookingEmail({
      name: holderName,
      hotelName: String(body.hotelName || "your hotel"),
      checkIn: String(body.checkin || "") || undefined,
      checkOut: String(body.checkout || "") || undefined,
      ref: result.hotelConfirmationCode ?? result.bookingId ?? undefined,
    });
    await sendEmail({ to: holder.email, subject: t.subject, html: t.html, template: "hotel-booking" });
  } catch {
    /* email best-effort */
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
