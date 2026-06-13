import { NextResponse } from "next/server";
import { liteapiConfigured, searchAirports } from "@/lib/liteapi";

/* Airport autocomplete → LiteAPI /data/flights/airports. Graceful without a key. */
export async function GET(req: Request) {
  const q = (new URL(req.url).searchParams.get("q") || "").trim();
  if (q.length < 2) return NextResponse.json({ ok: true, airports: [] });
  if (!liteapiConfigured()) return NextResponse.json({ ok: true, simulated: true, airports: [] });
  try {
    const a = await searchAirports(q);
    const airports = a
      .filter((x) => x.iata)
      .slice(0, 7)
      .map((x) => ({ iata: x.iata, name: x.name || "", city: x.city || "", country: x.country || "" }));
    return NextResponse.json({ ok: true, airports });
  } catch {
    return NextResponse.json({ ok: false, airports: [] }, { status: 502 });
  }
}
