import { NextResponse } from "next/server";
import { authorizeCron } from "@/lib/cron";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { bookFlight, liteapiConfigured } from "@/lib/liteapi";

/* Resolve flight bookings stuck in 'confirming' (payment captured, provider not
   yet confirmed) by re-calling the IDEMPOTENT book endpoint. This is the safety
   net for the payment-captured-booking-failed scenario. CRON_SECRET-guarded. */
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!authorizeCron(req)) return NextResponse.json({ ok: false }, { status: 401 });

  const db = getSupabaseAdmin();
  if (!db || !liteapiConfigured()) return NextResponse.json({ ok: true, simulated: true });

  const { data: rows } = await db
    .from("flight_bookings")
    .select("id, prebook_id, transaction_id, retry_count")
    .eq("status", "confirming")
    .lt("retry_count", 30)
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

  try { await db.from("cron_runs").insert({ job: "flight-retry", ok: true, notes: `retried ${retried}, resolved ${resolved}` }); } catch { /* best-effort */ }
  return NextResponse.json({ ok: true, retried, resolved });
}
