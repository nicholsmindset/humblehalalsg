import { NextResponse } from "next/server";
import { getWeather, liteapiConfigured } from "@/lib/liteapi";
import { rateLimit, tooMany } from "@/lib/ratelimit";
import { parseWeatherQuery } from "@/lib/weather-query";

/* Destination weather forecast for trip planning (factual). LiteAPI /data/weather.
   Defaults to the next 6 days from today. Graceful without a key. */
export async function GET(req: Request) {
  const rl = await rateLimit(req, "travel-weather", 20, 60); if (!rl.ok) return tooMany(rl.retryAfter);
  const sp = new URL(req.url).searchParams;
  const query = parseWeatherQuery(sp);
  if (!query.ok) return NextResponse.json({ ok: false, error: query.error }, { status: 422 });
  if (!liteapiConfigured()) return NextResponse.json({ ok: true, simulated: true, days: [] });

  try {
    const days = await getWeather(query.lat, query.lng, query.start, query.end);
    return NextResponse.json({ ok: true, days });
  } catch {
    return NextResponse.json({ ok: false, error: "weather unavailable" }, { status: 502 });
  }
}
