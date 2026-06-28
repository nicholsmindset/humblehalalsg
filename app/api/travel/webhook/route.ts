import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase/server";

/* LiteAPI booking-status webhook receiver.
   Auth (in order): HMAC-SHA256 signature over the RAW body (LiteAPI's "Webhooks"
   app signs requests) — with a legacy shared-secret `authorization` bearer as a
   fallback during transition. FAILS CLOSED in production when no secret is set —
   a status-mutating webhook must never be open to anonymous callers. Maps statuses
   per-vertical so we never write a value that violates a table's CHECK constraint. */

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  try { return timingSafeEqual(ab, bb); } catch { return false; }
}

// LiteAPI's exact signature header name is shown on the Webhooks app "Configure"
// page; set LITEAPI_WEBHOOK_SIGNATURE_HEADER to override. We also probe the common
// names so verification works out of the box.
const SIG_HEADERS = [
  process.env.LITEAPI_WEBHOOK_SIGNATURE_HEADER,
  "x-liteapi-signature",
  "x-webhook-signature",
  "x-signature",
  "webhook-signature",
].filter(Boolean) as string[];

/** True if any signature header matches HMAC-SHA256(rawBody, secret) (hex,
 *  with optional `sha256=` prefix or comma-separated svix-style values). */
function hmacValid(req: Request, raw: string, secret: string): boolean {
  const digest = createHmac("sha256", secret).update(raw).digest("hex");
  for (const name of SIG_HEADERS) {
    const header = req.headers.get(name);
    if (!header) continue;
    for (const partRaw of header.split(",")) {
      const part = partRaw.trim();
      const value = part.includes("=") ? part.slice(part.indexOf("=") + 1) : part;
      if (safeEqual(value.toLowerCase(), digest)) return true;
    }
  }
  return false;
}

export async function POST(req: Request) {
  const secret = process.env.LITEAPI_WEBHOOK_SECRET;
  const raw = await req.text();

  if (!secret) {
    // open path is only acceptable in non-production (local/dev); reject in prod
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ ok: false, error: "webhook_not_configured" }, { status: 503 });
    }
  } else {
    const auth = req.headers.get("authorization") || "";
    const ok = hmacValid(req, raw, secret) || safeEqual(auth, secret) || safeEqual(auth, `Bearer ${secret}`);
    if (!ok) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

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
