import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

/* LiteAPI booking-status webhook receiver. Graceful no-op when unconfigured.
   Updates a stored booking's status (cancelled/refunded) when LiteAPI notifies
   us. NOTE: confirm LiteAPI's signature scheme and verify it here before trusting
   payloads in production (LITEAPI_WEBHOOK_SECRET). */
export async function POST(req: Request) {
  // LiteAPI signs webhooks with a shared-secret `authorization` header (not HMAC).
  // When LITEAPI_WEBHOOK_SECRET is set, reject anything that doesn't match.
  const secret = process.env.LITEAPI_WEBHOOK_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization") || "";
    if (auth !== secret && auth !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
  }

  const raw = await req.text();

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
  const mapped = status.includes("cancel") ? "cancelled"
    : status.includes("refund") ? "refunded"
    : status.includes("ticket") ? "ticketed"
    : status.includes("confirm") ? "confirmed"
    : null;
  if (bookingId && mapped) {
    // sync both verticals — the same LiteAPI booking id may live in either table
    try { await db.from("hotel_bookings").update({ status: mapped }).eq("liteapi_booking_id", bookingId); } catch { /* best-effort */ }
    try { await db.from("flight_bookings").update({ status: mapped, updated_at: new Date().toISOString() }).eq("liteapi_booking_id", bookingId); } catch { /* best-effort */ }
  }
  return NextResponse.json({ ok: true });
}
