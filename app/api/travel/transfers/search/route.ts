import { NextResponse } from "next/server";
import { mozioConfigured, createSearch, pollSearch } from "@/lib/mozio";
import { normalizeQuotes, simulatedQuotes } from "@/lib/transfers";
import { rateLimit, tooMany } from "@/lib/ratelimit";

/* Transfer search → Mozio v2 async search+poll, normalized to quote cards.
   Discovery only (no flag gate). Graceful: returns simulated quotes without a key. */
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

export async function POST(req: Request) {
  const rl = await rateLimit(req, "transfer-search", 40, 60); if (!rl.ok) return tooMany(rl.retryAfter);
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const pickup = String(body.pickup || "").trim();
  const dropoff = String(body.dropoff || "").trim();
  const pickupDateTime = String(body.pickupDateTime || "").trim();
  const passengers = Math.min(16, Math.max(1, Number(body.passengers) || 1));
  const currency = String(body.currency || "USD").toUpperCase().slice(0, 3);
  if (!pickup || !dropoff || !ISO.test(pickupDateTime)) {
    return NextResponse.json({ ok: false, error: "Pick a pickup, drop-off and date/time" }, { status: 422 });
  }
  if (pickup.toLowerCase() === dropoff.toLowerCase()) {
    return NextResponse.json({ ok: false, error: "Pickup and drop-off must differ" }, { status: 422 });
  }

  const input = { pickup, dropoff, pickupDateTime, passengers, currency };
  if (!mozioConfigured()) return NextResponse.json({ ok: true, simulated: true, quotes: simulatedQuotes(input) });

  try {
    const { searchId } = await createSearch(input);
    const raw = await pollSearch(searchId);
    return NextResponse.json({ ok: true, searchId, quotes: normalizeQuotes(searchId, raw).slice(0, 40) });
  } catch {
    return NextResponse.json({ ok: false, error: "Could not search transfers right now" }, { status: 502 });
  }
}
