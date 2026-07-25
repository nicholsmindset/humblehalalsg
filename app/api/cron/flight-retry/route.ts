import { NextResponse } from "next/server";
import { authorizeCron } from "@/lib/cron";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { bookFlight, liteapiConfigured } from "@/lib/liteapi";
import { sendEmail } from "@/lib/email";
import { bookingChargedNotConfirmedEmail } from "@/lib/emails/templates";

/* Resolve flight bookings stuck in 'confirming' (payment captured, provider not
   yet confirmed) by re-calling the IDEMPOTENT book endpoint. This is the safety
   net for the payment-captured-booking-failed scenario. CRON_SECRET-guarded.

   Terminal state (audit flightConfirmingTerminal-02): a booking that exhausts
   MAX_RETRIES attempts would otherwise sit in 'confirming' FOREVER — payment
   captured, no ticket, no traveller email, no admin alert. The sweep below
   flips it to 'failed' (state already allowed by the 0007 CHECK), emails the
   traveller that a full refund is coming, and alerts the ops inbox so a human
   actually processes that refund with LiteAPI. */
export const dynamic = "force-dynamic";

const MAX_RETRIES = 30;

/* passengers is a jsonb array of { firstName, lastName } — greet the lead. */
function leadPassengerName(passengers: unknown): string | null {
  if (!Array.isArray(passengers) || !passengers.length) return null;
  const p0 = passengers[0] as Record<string, unknown> | null;
  const name = [p0?.firstName, p0?.lastName].filter(Boolean).join(" ").trim();
  return name || null;
}

export async function GET(req: Request) {
  if (!authorizeCron(req)) return NextResponse.json({ ok: false }, { status: 401 });

  const db = getSupabaseAdmin();
  if (!db || !liteapiConfigured()) return NextResponse.json({ ok: true, simulated: true });

  const { data: rows } = await db
    .from("flight_bookings")
    .select("id, prebook_id, transaction_id, retry_count")
    .eq("status", "confirming")
    .lt("retry_count", MAX_RETRIES)
    .limit(50);

  let retried = 0;
  let resolved = 0;
  for (const r of rows || []) {
    if (!r.prebook_id || !r.transaction_id) continue;
    retried++;
    const out = await bookFlight(String(r.prebook_id), String(r.transaction_id));
    const st = out.booking?.status || "";
    if (out.booking && (st === "CONFIRMED" || st === "TICKETED")) {
      await db.from("flight_bookings").update({
        status: st === "TICKETED" ? "ticketed" : "confirmed",
        liteapi_booking_id: out.booking.bookingId ?? null,
        booking_ref: out.booking.bookingRef ?? null,
        pnr: out.booking.pnr ?? null,
        payment_status: out.booking.paymentStatus ?? null,
        updated_at: new Date().toISOString(),
      }).eq("id", r.id);
      resolved++;
    } else {
      await db.from("flight_bookings").update({
        retry_count: (Number(r.retry_count) || 0) + 1,
        last_error: out.errorCode ? `${out.errorCode}: ${out.errorMessage || ""}` : null,
        updated_at: new Date().toISOString(),
      }).eq("id", r.id);
    }
  }

  // Terminal sweep — bookings that exhausted retries (see header note).
  const { data: exhausted } = await db
    .from("flight_bookings")
    .select("id, contact_email, booking_ref, passengers")
    .eq("status", "confirming")
    .gte("retry_count", MAX_RETRIES)
    .limit(50);

  let failed = 0;
  for (const r of exhausted || []) {
    // Claim the transition atomically: only the run that actually flips the row
    // notifies, so concurrent or repeated cron runs can't double-email.
    const { data: flipped } = await db
      .from("flight_bookings")
      .update({
        status: "failed",
        last_error: "exhausted_confirmation_retries",
        updated_at: new Date().toISOString(),
      })
      .eq("id", r.id)
      .eq("status", "confirming")
      .select("id");
    if (!flipped?.length) continue;
    failed++;

    const name = leadPassengerName(r.passengers);
    const email = typeof r.contact_email === "string" ? r.contact_email.trim() : "";
    if (email) {
      try {
        const t = bookingChargedNotConfirmedEmail({ name, kind: "flight", ref: r.booking_ref ? String(r.booking_ref) : undefined });
        await sendEmail({ to: email, subject: t.subject, html: t.html, template: "booking_charged_not_confirmed" });
      } catch { /* best-effort — the state flip is the critical part */ }
    }
    const opsInbox = process.env.CONTACT_INBOX;
    if (opsInbox) {
      try {
        await sendEmail({
          to: opsInbox,
          subject: `[action needed] Flight booking ${r.id} failed after ${MAX_RETRIES} retries — refund required`,
          html: `<p>Flight booking <strong>${r.id}</strong> could not be confirmed after ${MAX_RETRIES} retries and has been marked <code>failed</code>.</p><p>Payment was captured — please process a full refund with LiteAPI and reconcile the ledger.${email ? ` Traveller (${email}) has been emailed.` : " No contact email on file."}</p>`,
          template: "admin_flight_failed",
        });
      } catch { /* best-effort */ }
    }
  }

  try { await db.from("cron_runs").insert({ job: "flight-retry", ok: true, notes: `retried ${retried}, resolved ${resolved}, failed ${failed}` }); } catch { /* best-effort */ }
  return NextResponse.json({ ok: true, retried, resolved, failed });
}
