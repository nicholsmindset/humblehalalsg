import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getServerFlags } from "@/lib/feature-flags";
import { liteapiConfigured, bookFlight } from "@/lib/liteapi";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { rateLimit, tooMany } from "@/lib/ratelimit";
import { sendEmail } from "@/lib/email";
import { flightBookingEmail } from "@/lib/emails/templates";

/* Step 3 of flight booking — confirm with LiteAPI AFTER the card is charged.
   CRITICAL invariant: once payment is captured (Stripe SDK), a failed booking is
   NEVER returned to the user as a payment error. We persist it as 'confirming'
   and a retry job re-calls the idempotent book endpoint. Gated + graceful. */
const CONFIRMED = new Set(["CONFIRMED", "TICKETED"]);

/* Sanitize client-reported ledger money (same guards as the hotel book route,
   security audit M3): reject negatives, absurd amounts and injected currencies
   before they pollute the flight_bookings ledger. */
const MONEY_MAX = 1_000_000; // sane per-booking ceiling
const toMoney = (v: unknown): number | null => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 && n <= MONEY_MAX ? n : null;
};
const toCurrency = (v: unknown): string | null => {
  const c = String(v ?? "").toUpperCase();
  return /^[A-Z]{3}$/.test(c) ? c : null;
};

/* Inline fast-path retry. bookFlight is idempotent, so re-calling it resolves the
   common transient case (provider not yet confirmed) WITHIN the request — the
   customer almost never lands in 'confirming'. This keeps flights safe on Vercel
   Hobby (daily cron) since the cron/external scheduler becomes a rare backstop,
   not the primary path. We only retry plausibly-transient outcomes so a hard
   validation error fails fast to 'confirming' (the retry job will keep trying). */
const RETRYABLE = new Set([55004, 55029, 45035]); // idempotent-retry codes (see lib/liteapi)
const TRANSIENT_STATUS = new Set(["PENDING", "PROCESSING", "PENDING_CONFIRMATION"]);
type BookOutcome = Awaited<ReturnType<typeof bookFlight>>;
function isTransient(o: BookOutcome): boolean {
  if (o.booking && CONFIRMED.has(o.booking.status || "")) return false; // already done
  if (o.httpStatus === 0 || o.httpStatus >= 500) return true;            // network / server
  if (o.errorCode && RETRYABLE.has(o.errorCode)) return true;            // known retryable
  return TRANSIENT_STATUS.has(o.booking?.status || "");
}
async function bookWithRetry(prebookId: string, transactionId: string): Promise<BookOutcome> {
  let outcome = await bookFlight(prebookId, transactionId);
  for (let attempt = 1; attempt < 3 && isTransient(outcome); attempt++) {
    await new Promise((r) => setTimeout(r, 2000));
    outcome = await bookFlight(prebookId, transactionId);
  }
  return outcome;
}

export async function POST(req: Request) {
  const rl = await rateLimit(req, "flight-book", 12, 60); if (!rl.ok) return tooMany(rl.retryAfter);
  if (!(await getServerFlags()).paidFlights) return NextResponse.json({ ok: false, reason: "flight_booking_disabled" }, { status: 403 });
  if (!liteapiConfigured()) return NextResponse.json({ ok: false, reason: "liteapi_not_configured" });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const prebookId = String(body.prebookId || "").trim();
  const transactionId = String(body.transactionId || "").trim();
  if (!prebookId || !transactionId) return NextResponse.json({ ok: false, error: "Missing booking reference" }, { status: 422 });

  const { userId } = await auth();

  const outcome = await bookWithRetry(prebookId, transactionId);

  // Map to our state machine. Any non-confirmed result after payment is 'confirming'
  // (retry-safe), never a payment failure shown to the user.
  const apiStatus = outcome.booking?.status || "";
  let status: "confirmed" | "ticketed" | "confirming";
  if (outcome.booking && apiStatus === "TICKETED") status = "ticketed";
  else if (outcome.booking && CONFIRMED.has(apiStatus)) status = "confirmed";
  else status = "confirming"; // PENDING_CONFIRMATION or any error post-capture

  const db = getSupabaseAdmin();
  let rowId: string | null = null;
  if (db) {
    try {
      const total = toMoney(body.total);
      const commission = toMoney(body.commissionAmount);
      const { data, error: insErr } = await db
        .from("flight_bookings")
        .insert({
          user_id: userId,
          prebook_id: prebookId,
          transaction_id: transactionId,
          liteapi_booking_id: outcome.booking?.bookingId ?? null,
          booking_ref: outcome.booking?.bookingRef ?? null,
          pnr: outcome.booking?.pnr ?? null,
          origin: body.origin ?? null,
          destination: body.destination ?? null,
          depart_date: body.date ?? null,
          passengers: Array.isArray(body.passengers) ? body.passengers.slice(0, 9) : [], // L3 cap

          contact_email: body.contactEmail ?? null,
          currency: toCurrency(body.currency),
          total,
          // Commission can never exceed the total — drop tampered values.
          commission_amount: commission != null && total != null && commission > total ? null : commission,
          status,
          payment_status: outcome.booking?.paymentStatus ?? null,
          last_error: status === "confirming" && outcome.errorCode ? `${outcome.errorCode}: ${outcome.errorMessage || ""}` : null,
        })
        .select("id")
        .single();
      // Unique violation (23505) = this prebook is already recorded — a double
      // submit / replay (bookFlight is idempotent upstream). Return the existing
      // booking and skip the duplicate confirmation email.
      if (insErr?.code === "23505") {
        const { data: existing } = await db
          .from("flight_bookings")
          .select("id, status, booking_ref, pnr")
          .eq("prebook_id", prebookId)
          .maybeSingle();
        return NextResponse.json({
          ok: true,
          status: existing?.status ?? status,
          id: existing?.id ?? null,
          bookingRef: existing?.booking_ref ?? outcome.booking?.bookingRef ?? null,
          pnr: existing?.pnr ?? outcome.booking?.pnr ?? null,
          duplicate: true,
        });
      }
      rowId = data?.id ?? null;
    } catch { /* ledger best-effort */ }
  }

  if (status === "confirming") {
    // Payment is (or may be) captured; provider not yet confirmed → reassure, retry async.
    // The retry job emails the ticket once confirmed, so we don't send here.
    return NextResponse.json({ ok: true, status: "confirming", id: rowId, message: "Payment received — we're confirming your flight and will email your ticket shortly." });
  }

  // Confirmed/ticketed → email the traveller their booking (best-effort).
  const contactEmail = String(body.contactEmail || "").trim();
  if (contactEmail) {
    try {
      const origin = String(body.origin || "").trim();
      const destination = String(body.destination || "").trim();
      const route = origin && destination ? `${origin} → ${destination}` : (origin || destination || "your flight");
      const t = flightBookingEmail({
        route,
        dateLabel: String(body.date || "") || undefined,
        ref: outcome.booking?.bookingRef ?? outcome.booking?.pnr ?? undefined,
      });
      await sendEmail({ to: contactEmail, subject: t.subject, html: t.html, template: "flight-booking" });
    } catch { /* email best-effort */ }
  }

  return NextResponse.json({ ok: true, status, id: rowId, bookingRef: outcome.booking?.bookingRef ?? null, pnr: outcome.booking?.pnr ?? null });
}
