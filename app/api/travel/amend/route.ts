import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getServerFlags } from "@/lib/flags";
import { amendBooking, liteapiConfigured } from "@/lib/liteapi";
import { getSupabaseAdmin } from "@/lib/supabase/server";

/* Amend the lead guest name on the signed-in traveller's own hotel booking.
   Verifies ownership before calling LiteAPI. Gated by PAID_HOTELS_ENABLED. */
export async function POST(req: Request) {
  if (!getServerFlags().paidHotels) return NextResponse.json({ ok: false, reason: "hotel_booking_disabled" }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as { id?: string; firstName?: string; lastName?: string };
  const id = String(body.id || "").trim();
  const firstName = String(body.firstName || "").trim();
  const lastName = String(body.lastName || "").trim();
  if (!id || !firstName || !lastName) return NextResponse.json({ ok: false, error: "Enter the corrected name" }, { status: 422 });

  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, error: "Please log in" }, { status: 401 });

  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ ok: false, reason: "not_configured" });

  const { data: bk } = await admin.from("hotel_bookings").select("id, liteapi_booking_id, user_id, status").eq("id", id).maybeSingle();
  if (!bk || bk.user_id !== userId) return NextResponse.json({ ok: false, error: "Booking not found" }, { status: 404 });

  // LiteAPI is the source of truth for the guest name; we don't mirror it locally
  // (hotel_bookings has no guest_name column).
  if (!liteapiConfigured() || !bk.liteapi_booking_id) return NextResponse.json({ ok: true, simulated: true });

  try {
    await amendBooking(String(bk.liteapi_booking_id), { firstName, lastName });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Could not update the name on this booking." }, { status: 502 });
  }
}
