import { NextResponse } from "next/server";
import { liteapiConfigured, searchFlights } from "@/lib/liteapi";
import { normalizeItineraries } from "@/lib/flights";
import { rateLimit, tooMany } from "@/lib/ratelimit";

/* Flexible-date price calendar — cheapest fare per day across a ±3-day window
   around the chosen date, so travellers can shift dates to save. Probes a few
   one-way searches in parallel (cached in-memory). Graceful without a key. */
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const WINDOW = 3; // days each side
const cache = new Map<string, { at: number; days: { date: string; price: number | null }[] }>();
const TTL = 10 * 60_000;

function shift(iso: string, days: number): string {
  const t = Date.parse(iso + "T00:00:00Z");
  return new Date(t + days * 86400000).toISOString().slice(0, 10);
}

export async function POST(req: Request) {
  const rl = await rateLimit(req, "flight-calendar", 12, 60); if (!rl.ok) return tooMany(rl.retryAfter);
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const origin = String(body.origin || "").trim().toUpperCase();
  const destination = String(body.destination || "").trim().toUpperCase();
  const date = String(body.date || "").trim();
  const currency = String(body.currency || "SGD").toUpperCase().slice(0, 3);
  if (origin.length < 3 || destination.length < 3 || !DATE.test(date)) {
    return NextResponse.json({ ok: false, error: "bad params" }, { status: 422 });
  }

  const today = date; // window centred on the chosen date
  const dates = Array.from({ length: WINDOW * 2 + 1 }, (_, i) => shift(today, i - WINDOW)).filter((d) => d >= shift(new Date().toISOString().slice(0, 10), -1));

  if (!liteapiConfigured()) {
    return NextResponse.json({ ok: true, simulated: true, days: dates.map((d) => ({ date: d, price: null })) });
  }

  const key = `${origin}-${destination}-${date}-${currency}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return NextResponse.json({ ok: true, days: hit.days, cached: true });

  const days = await Promise.all(
    dates.map(async (d) => {
      try {
        const data = await searchFlights({ legs: [{ origin, destination, date: d, direction: "OUTBOUND" }], adults: 1, currency });
        const items = normalizeItineraries(data);
        const min = items.reduce((m, it) => (it.price != null && it.price < m ? it.price : m), Infinity);
        return { date: d, price: Number.isFinite(min) ? Math.round(min) : null };
      } catch {
        return { date: d, price: null };
      }
    }),
  );

  cache.set(key, { at: Date.now(), days });
  return NextResponse.json({ ok: true, days });
}
