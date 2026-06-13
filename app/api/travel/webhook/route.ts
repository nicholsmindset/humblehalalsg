import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase/server";

/* LiteAPI booking-status webhook receiver. Verifies the shared-secret
   `authorization` header (LITEAPI_WEBHOOK_SECRET) in constant time and FAILS
   CLOSED in production when the secret is unset — a status-mutating webhook must
   never be open to anonymous callers. Maps statuses per-vertical so we never write
   a value that violates a table's CHECK constraint. */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  try { return timingSafeEqual(ab, bb); } catch { return false; }
}

export async function POST(req: Request) {
  const secret = process.env.LITEAPI_WEBHOOK_SECRET;
  if (!secret) {
    // open path is only acceptable in non-production (local/dev); reject in prod
    if (process.env.NODE_ENV === "production") return NextResponse.json({ ok: false, error: "webhook_not_configured" }, { status: 503 });
  } else {
    const auth = req.headers.get("authorization") || "";
    if (!safeEqual(auth, secret) && !safeEqual(auth, `Bearer ${secret}`)) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
  }

  const raw = await req.text();
  let event: { bookingId?: string; status?: string; [k: string]: unknown };
  try { event = JSON.parse(raw); } catch { return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 }); }

  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: true, simulated: true });

  const bookingId = String(event.bookingId || "");
  const status = String(event.status || "").toLowerCase();
  if (!bookingId) return NextResponse.json({ ok: true });

  // hotel_bookings CHECK allows only confirmed/cancelled/refunded
  const hotelStatus = status.includes("cancel") ? "cancelled" : status.includes("refund") ? "refunded" : status.includes("confirm") ? "confirmed" : null;
  // flight_bookings CHECK additionally allows ticketed
  const flightStatus = status.includes("cancel") ? "cancelled" : status.includes("refund") ? "refunded" : status.includes("ticket") ? "ticketed" : status.includes("confirm") ? "confirmed" : null;

  if (hotelStatus) { try { await db.from("hotel_bookings").update({ status: hotelStatus }).eq("liteapi_booking_id", bookingId); } catch { /* best-effort */ } }
  if (flightStatus) { try { await db.from("flight_bookings").update({ status: flightStatus, updated_at: new Date().toISOString() }).eq("liteapi_booking_id", bookingId); } catch { /* best-effort */ } }
  return NextResponse.json({ ok: true });
}
