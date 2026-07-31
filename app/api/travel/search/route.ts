import { NextResponse } from "next/server";
import { runHotelSearch, parseRateFilters, sanitizeOccupancies } from "@/lib/travel-data";
import { rateLimit, tooMany } from "@/lib/ratelimit";
import { isValidHotelStay } from "@/lib/hotel-dates";

/* Hotel search → LiteAPI POST /hotels/rates, then left-join our Muslim-friendly
   overlay and re-rank by halal_score. Graceful: without a LiteAPI key it returns
   {ok,simulated,hotels:[]} so the UI still renders. Discovery only — no payment,
   so this is NOT behind the PAID_HOTELS_ENABLED switch. The actual search logic
   lives in lib/travel-data:runHotelSearch (shared with /api/travel/ai-search). */

export async function POST(req: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }
  if (body.website) return NextResponse.json({ ok: true, simulated: true, hotels: [] }); // honeypot
  // Throttle the paid LiteAPI /hotels/rates fan-out per IP (mirrors min-rates).
  const rl = await rateLimit(req, "hotel-search", 30, 60); if (!rl.ok) return tooMany(rl.retryAfter);

  const checkin = String(body.checkin || "");
  const checkout = String(body.checkout || "");
  if (!isValidHotelStay(checkin, checkout)) {
    return NextResponse.json({ ok: false, error: "Pick valid check-in and check-out dates" }, { status: 422 });
  }
  const cityName = String(body.cityName || "").trim();
  const countryCode = String(body.countryCode || "").trim();
  const placeId = String(body.placeId || "").trim();
  const hotelIds = Array.isArray(body.hotelIds) ? (body.hotelIds as string[]).slice(0, 200) : undefined;
  if (!cityName && !countryCode && !placeId && !(hotelIds && hotelIds.length)) {
    return NextResponse.json({ ok: false, error: "Tell us where to search" }, { status: 422 });
  }

  const occupancies = sanitizeOccupancies(body.occupancies);

  // Stable per-session id (client-generated) keeps search→prebook prices consistent.
  const sessionId = String(body.sessionId || "").trim().slice(0, 64) || undefined;

  const { simulated, hotels } = await runHotelSearch({
    placeId: placeId || undefined,
    cityName: cityName || undefined,
    countryCode: countryCode || undefined,
    hotelIds,
    checkin,
    checkout,
    currency: String(body.currency || "USD"),
    guestNationality: String(body.guestNationality || "SG"),
    occupancies,
    limit: Number(body.limit) || 30,
    sessionId,
    filters: parseRateFilters(body),
  });

  return NextResponse.json({ ok: true, simulated, hotels, sessionId });
}
