import { NextResponse } from "next/server";
import { getServerFlags } from "@/lib/flags";
import { mozioConfigured, createReservation } from "@/lib/mozio";
import { getSupabaseAdmin, getSupabaseServer } from "@/lib/supabase/server";
import { rateLimit, tooMany } from "@/lib/ratelimit";

/* Create a Mozio reservation (Mozio-collects). Returns a paymentUrl for redirect —
   we never touch the card. Records a 'pending' ledger row. Gated + graceful. */
export async function POST(req: Request) {
  const rl = await rateLimit(req, "transfer-book", 12, 60); if (!rl.ok) return tooMany(rl.retryAfter);
  if (!getServerFlags().paidTransfers) return NextResponse.json({ ok: false, reason: "transfer_booking_disabled" }, { status: 403 });
  if (!mozioConfigured()) return NextResponse.json({ ok: false, reason: "mozio_not_configured" });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const searchId = String(body.searchId || "").trim();
  const resultId = String(body.resultId || "").trim();
  const c = (body.contact || {}) as Record<string, unknown>;
  const contact = {
    firstName: String(c.firstName || "").trim(), lastName: String(c.lastName || "").trim(),
    email: String(c.email || "").trim(), phone: String(c.phone || "").trim(),
  };
  const passengers = Math.min(16, Math.max(1, Number(body.passengers) || 1));
  const currency = String(body.currency || "USD").toUpperCase().slice(0, 3);
  if (!searchId || !resultId || !contact.firstName || !contact.email) {
    return NextResponse.json({ ok: false, error: "Missing booking details" }, { status: 422 });
  }

  let userId: string | null = null;
  try { const server = await getSupabaseServer(); if (server) userId = (await server.auth.getUser()).data.user?.id ?? null; } catch { /* anonymous ok */ }

  const reservation = await createReservation({ searchId, resultId, contact, passengers, currency });

  const db = getSupabaseAdmin();
  let rowId: string | null = null;
  if (db) {
    try {
      const { data } = await db.from("transfer_bookings").insert({
        user_id: userId,
        mozio_search_id: searchId,
        mozio_reservation_id: reservation.reservationId,
        pickup: body.pickup ?? null,
        dropoff: body.dropoff ?? null,
        pickup_datetime: body.pickupDateTime ?? null,
        passengers,
        vehicle_class: body.vehicleClass ?? null,
        contact_email: contact.email,
        currency,
        total: body.total != null ? Number(body.total) : null,
        commission_amount: body.commissionAmount != null ? Number(body.commissionAmount) : null,
        status: "pending",
      }).select("id").single();
      rowId = data?.id ?? null;
    } catch { /* ledger best-effort */ }
  }

  return NextResponse.json({ ok: true, paymentUrl: reservation.paymentUrl, id: rowId });
}
