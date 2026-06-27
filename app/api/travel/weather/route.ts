import { NextResponse } from "next/server";
import { getWeather, liteapiConfigured } from "@/lib/liteapi";
import { rateLimit, tooMany } from "@/lib/ratelimit";

/* Destination weather forecast for trip planning (factual). LiteAPI /data/weather.
   Defaults to the next 6 days from today. Graceful without a key. */
export async function GET(req: Request) {
  const rl = await rateLimit(req, "travel-weather", 20, 60); if (!rl.ok) return tooMany(rl.retryAfter);
  const sp = new URL(req.url).searchParams;
  const lat = Number(sp.get("lat"));
  const lng = Number(sp.get("lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return NextResponse.json({ ok: false, error: "bad coords" }, { status: 422 });
  if (!liteapiConfigured()) return NextResponse.json({ ok: true, simulated: true, days: [] });

  const today = new Date();
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const start = sp.get("checkin") || iso(today);
  const end = sp.get("checkout") || iso(new Date(today.getTime() + 6 * 86400000));

  try {
    const days = await getWeather(lat, lng, start, end);
    return NextResponse.json({ ok: true, days });
  } catch {
    return NextResponse.json({ ok: false, error: "weather unavailable" }, { status: 502 });
  }
}
