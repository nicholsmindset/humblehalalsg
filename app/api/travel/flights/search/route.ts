import { NextResponse } from "next/server";
import { liteapiConfigured, searchFlights } from "@/lib/liteapi";
import { normalizeItineraries } from "@/lib/flights";

/* Flight search → LiteAPI /flights/rates, normalized to rich itinerary cards.
   Supports one-way and round-trip (legs[] with directions) + cabin class.
   Discovery only. Graceful without a key. */
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const CABINS = ["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"];

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const origin = String(body.origin || "").trim().toUpperCase();
  const destination = String(body.destination || "").trim().toUpperCase();
  const date = String(body.date || "").trim();
  const returnDate = String(body.returnDate || "").trim();
  const roundTrip = body.tripType === "round" || !!returnDate;
  if (origin.length < 3 || destination.length < 3 || !DATE.test(date)) {
    return NextResponse.json({ ok: false, error: "Pick origin, destination and a date" }, { status: 422 });
  }
  if (origin === destination) return NextResponse.json({ ok: false, error: "Origin and destination must differ" }, { status: 422 });
  if (roundTrip && !DATE.test(returnDate)) {
    return NextResponse.json({ ok: false, error: "Pick a return date" }, { status: 422 });
  }

  if (!liteapiConfigured()) return NextResponse.json({ ok: true, simulated: true, itineraries: [], roundTrip });

  const legs = [{ origin, destination, date, direction: "OUTBOUND" }];
  if (roundTrip) legs.push({ origin: destination, destination: origin, date: returnDate, direction: "INBOUND" });
  const cabin = CABINS.includes(String(body.cabin || "").toUpperCase()) ? String(body.cabin).toUpperCase() : undefined;

  try {
    const data = await searchFlights({
      legs,
      adults: Math.min(9, Math.max(1, Number(body.adults) || 1)),
      children: Math.min(8, Math.max(0, Number(body.children) || 0)),
      cabin,
      currency: String(body.currency || "USD").toUpperCase().slice(0, 3),
    });
    return NextResponse.json({ ok: true, roundTrip, itineraries: normalizeItineraries(data).slice(0, 60) });
  } catch {
    return NextResponse.json({ ok: false, error: "Could not search flights right now" }, { status: 502 });
  }
}
