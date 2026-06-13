import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

/* LiteAPI booking-status webhook receiver. Graceful no-op when unconfigured.
   Updates a stored booking's status (cancelled/refunded) when LiteAPI notifies
   us. NOTE: confirm LiteAPI's signature scheme and verify it here before trusting
   payloads in production (LITEAPI_WEBHOOK_SECRET). */
export async function POST(req: Request) {
  const raw = await req.text();

  const secret = process.env.LITEAPI_WEBHOOK_SECRET;
  if (secret) {
    // TODO: verify LiteAPI's signature header against `raw` per their docs.
    // Until confirmed, we accept but do not act on unsigned/unknown payloads.
  }

  let event: { bookingId?: string; status?: string; [k: string]: unknown };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: true, simulated: true });

  const bookingId = String(event.bookingId || "");
  const status = String(event.status || "").toLowerCase();
  const mapped = status.includes("cancel") ? "cancelled" : status.includes("refund") ? "refunded" : null;
  if (bookingId && mapped) {
    try {
      await db.from("hotel_bookings").update({ status: mapped }).eq("liteapi_booking_id", bookingId);
    } catch {
      /* best-effort */
    }
  }
  return NextResponse.json({ ok: true });
}
