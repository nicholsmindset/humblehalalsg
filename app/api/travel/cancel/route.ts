import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getServerFlags } from "@/lib/flags";
import { cancelBooking, liteapiConfigured } from "@/lib/liteapi";
import { getSupabaseAdmin } from "@/lib/supabase/server";

/* Cancel one of the signed-in traveller's own hotel bookings. Verifies ownership
   (hotel_bookings.user_id) before calling LiteAPI; LiteAPI enforces the
   cancellation policy. Gated by PAID_HOTELS_ENABLED. */
export async function POST(req: Request) {
  if (!getServerFlags().paidHotels) return NextResponse.json({ ok: false, reason: "hotel_booking_disabled" }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as { id?: string };
  const id = String(body.id || "").trim();
  if (!id) return NextResponse.json({ ok: false, error: "Missing booking" }, { status: 422 });

  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, error: "Please log in" }, { status: 401 });

  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ ok: false, reason: "not_configured" });

  const { data: bk } = await admin.from("hotel_bookings").select("id, liteapi_booking_id, user_id, status").eq("id", id).maybeSingle();
  if (!bk || bk.user_id !== userId) return NextResponse.json({ ok: false, error: "Booking not found" }, { status: 404 });
  if (bk.status !== "confirmed") return NextResponse.json({ ok: true, status: bk.status });

  if (!liteapiConfigured() || !bk.liteapi_booking_id) {
    await admin.from("hotel_bookings").update({ status: "cancelled" }).eq("id", id);
    return NextResponse.json({ ok: true, status: "cancelled", simulated: true });
  }

  try {
    await cancelBooking(String(bk.liteapi_booking_id));
    await admin.from("hotel_bookings").update({ status: "cancelled" }).eq("id", id);
    return NextResponse.json({ ok: true, status: "cancelled" });
  } catch {
    return NextResponse.json({ ok: false, error: "Could not cancel — this rate may be non-refundable." }, { status: 502 });
  }
}
