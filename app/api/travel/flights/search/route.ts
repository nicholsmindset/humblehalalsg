import { NextResponse } from "next/server";
import { liteapiConfigured, searchFlights } from "@/lib/liteapi";
import { normalizeJourneys } from "@/lib/flights";

/* Flight search (one-way, Phase 1) → LiteAPI /flights/rates, normalized to
   journey cards. Discovery only — no booking yet. Graceful without a key. */
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const origin = String(body.origin || "").trim().toUpperCase();
  const destination = String(body.destination || "").trim().toUpperCase();
  const date = String(body.date || "").trim();
  if (origin.length < 3 || destination.length < 3 || !DATE.test(date)) {
    return NextResponse.json({ ok: false, error: "Pick origin, destination and a date" }, { status: 422 });
  }
  if (origin === destination) return NextResponse.json({ ok: false, error: "Origin and destination must differ" }, { status: 422 });

  if (!liteapiConfigured()) return NextResponse.json({ ok: true, simulated: true, journeys: [] });

  try {
    const data = await searchFlights({
      legs: [{ origin, destination, date }],
      adults: Math.min(9, Math.max(1, Number(body.adults) || 1)),
      children: Math.min(8, Math.max(0, Number(body.children) || 0)),
      currency: String(body.currency || "USD").toUpperCase().slice(0, 3),
    });
    return NextResponse.json({ ok: true, journeys: normalizeJourneys(data).slice(0, 40) });
  } catch {
    return NextResponse.json({ ok: false, error: "Could not search flights right now" }, { status: 502 });
  }
}
