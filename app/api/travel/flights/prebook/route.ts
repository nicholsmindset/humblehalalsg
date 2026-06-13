import { NextResponse } from "next/server";
import { getServerFlags } from "@/lib/flags";
import { liteapiConfigured, prebookFlight } from "@/lib/liteapi";
import type { FlightContactInput, FlightPassengerInput } from "@/lib/liteapi-types";

/* Step 2 of flight booking — create the prebook (opens the Stripe payment
   intent) with contact + passenger details. Returns the SDK handles
   (transactionId/secretKey/publishableKey) + price. Gated + graceful. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  if (!getServerFlags().paidFlights) return NextResponse.json({ ok: false, reason: "flight_booking_disabled" }, { status: 403 });
  if (!liteapiConfigured()) return NextResponse.json({ ok: false, reason: "liteapi_not_configured" });

  const body = (await req.json().catch(() => ({}))) as { offerId?: string; contact?: FlightContactInput; passengers?: FlightPassengerInput[] };
  const offerId = String(body.offerId || "").trim();
  const contact = body.contact;
  const passengers = Array.isArray(body.passengers) ? body.passengers : [];
  if (!offerId) return NextResponse.json({ ok: false, error: "Missing offer" }, { status: 422 });
  if (!contact?.firstName || !contact?.lastName || !contact?.email || !EMAIL_RE.test(contact.email)) {
    return NextResponse.json({ ok: false, error: "Valid contact details are required" }, { status: 422 });
  }
  if (!passengers.length || passengers.some((p) => !p.firstName || !p.lastName || !p.birthday || !p.documentNumber)) {
    return NextResponse.json({ ok: false, error: "Complete passenger details (incl. passport) are required" }, { status: 422 });
  }

  try {
    const r = await prebookFlight(offerId, contact, passengers);
    if (!r || !r.prebookId) return NextResponse.json({ ok: false, error: "Fare no longer available — please search again" }, { status: 409 });
    return NextResponse.json({
      ok: true,
      prebookId: r.prebookId,
      transactionId: r.transactionId ?? null,
      secretKey: r.secretKey ?? null,
      publishableKey: r.publishableKey ?? null,
      price: r.price != null ? Number(r.price) : null,
      currency: r.currency ?? "USD",
      paymentTypes: r.paymentTypes ?? [],
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Could not start the booking" }, { status: 502 });
  }
}
