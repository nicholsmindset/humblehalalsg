import { NextResponse } from "next/server";
import { getServerFlags } from "@/lib/flags";
import { liteapiConfigured, verifyFlight } from "@/lib/liteapi";

/* Step 1 of flight booking — re-price/validate the offer right before payment.
   Surfaces `changes` so the UI can ask the user to accept a price move. Gated by
   PAID_FLIGHTS_ENABLED; graceful without a key. */
export async function POST(req: Request) {
  if (!getServerFlags().paidFlights) return NextResponse.json({ ok: false, reason: "flight_booking_disabled" }, { status: 403 });
  if (!liteapiConfigured()) return NextResponse.json({ ok: false, reason: "liteapi_not_configured" });

  const body = (await req.json().catch(() => ({}))) as { offerId?: string };
  const offerId = String(body.offerId || "").trim();
  if (!offerId) return NextResponse.json({ ok: false, error: "Missing offer" }, { status: 422 });

  try {
    const v = await verifyFlight(offerId);
    if (!v) return NextResponse.json({ ok: false, error: "Offer no longer available — please search again" }, { status: 409 });
    return NextResponse.json({ ok: true, total: v.total ?? null, currency: v.currency ?? null, changed: !!v.changes, fare: v.fare ?? null, baggage: v.baggage ?? null, terms: v.terms ?? null });
  } catch {
    return NextResponse.json({ ok: false, error: "Could not verify the fare" }, { status: 502 });
  }
}
