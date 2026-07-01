import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { emailForUser } from "@/lib/emails/recipient";
import { bookingRefundedEmail, bookingFailedEmail } from "@/lib/emails/templates";
import { sendEmail } from "@/lib/email";

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

  // Fire a transactional email ONLY on a genuine status transition. Best-effort:
  // resolve the recipient from the booking's stored contact email, wrapped so a
  // send failure never changes the webhook's ack.
  async function notify(
    kind: "hotel" | "flight",
    row: { user_id?: string | null; email: string | null; ref?: string | null } | null,
    kindOfEmail: "refunded" | "failed",
  ) {
    try {
      if (!row) return;
      let to = row.email || null;
      let name: string | null = null;
      if (row.user_id) {
        const r = await emailForUser(db!, row.user_id);
        name = r.name;
        if (!to) to = r.email;
      }
      if (!to) return;
      const t = kindOfEmail === "refunded"
        ? bookingRefundedEmail({ name, kind, ref: row.ref || undefined })
        : bookingFailedEmail({ name, kind });
      await sendEmail({ to, subject: t.subject, html: t.html, template: `booking-${kindOfEmail}` });
    } catch { /* email best-effort */ }
  }

  if (hotelStatus) {
    try {
      // Read prior status so we only email on a real transition into the new state.
      const { data: prev } = await db
        .from("hotel_bookings")
        .select("status, guest_email, user_id, hotel_confirmation_code, liteapi_booking_id")
        .eq("liteapi_booking_id", bookingId)
        .maybeSingle();
      await db.from("hotel_bookings").update({ status: hotelStatus }).eq("liteapi_booking_id", bookingId);
      const changed = prev && prev.status !== hotelStatus;
      const ref = (prev?.hotel_confirmation_code as string) || (prev?.liteapi_booking_id as string) || bookingId;
      const rec = prev ? { user_id: prev.user_id as string | null, email: (prev.guest_email as string) || null, ref } : null;
      if (changed && hotelStatus === "refunded") await notify("hotel", rec, "refunded");
      // A booking that reaches cancelled without having been confirmed = failed/incomplete.
      else if (changed && hotelStatus === "cancelled" && prev?.status !== "confirmed") await notify("hotel", rec, "failed");
    } catch { /* best-effort */ }
  }

  if (flightStatus) {
    try {
      const { data: prev } = await db
        .from("flight_bookings")
        .select("status, contact_email, user_id, booking_ref, liteapi_booking_id")
        .eq("liteapi_booking_id", bookingId)
        .maybeSingle();
      await db.from("flight_bookings").update({ status: flightStatus, updated_at: new Date().toISOString() }).eq("liteapi_booking_id", bookingId);
      const changed = prev && prev.status !== flightStatus;
      const ref = (prev?.booking_ref as string) || (prev?.liteapi_booking_id as string) || bookingId;
      const rec = prev ? { user_id: prev.user_id as string | null, email: (prev.contact_email as string) || null, ref } : null;
      if (changed && flightStatus === "refunded") await notify("flight", rec, "refunded");
      // cancelled without ever completing (confirmed/ticketed) = booking failed.
      else if (changed && flightStatus === "cancelled" &&
               prev?.status !== "confirmed" && prev?.status !== "ticketed") await notify("flight", rec, "failed");
    } catch { /* best-effort */ }
  }
  return NextResponse.json({ ok: true });
}
