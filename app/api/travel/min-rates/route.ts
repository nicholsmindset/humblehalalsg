import { NextResponse } from "next/server";
import { minRates, liteapiConfigured } from "@/lib/liteapi";

/* Cheapest "from $X" rate per hotel for a date range — used to label city/hub
   cards. POST { hotelIds[], checkin, checkout, nationality, currency, adults }.
   Graceful without a key. */
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const hotelIds = Array.isArray(body.hotelIds) ? (body.hotelIds as unknown[]).map(String).filter(Boolean) : [];
  const checkin = String(body.checkin || "").trim();
  const checkout = String(body.checkout || "").trim();
  if (!hotelIds.length || !DATE.test(checkin) || !DATE.test(checkout)) return NextResponse.json({ ok: false, error: "bad params" }, { status: 422 });
  if (!liteapiConfigured()) return NextResponse.json({ ok: true, simulated: true, rates: {} });

  try {
    const rates = await minRates(hotelIds, checkin, checkout, String(body.nationality || "SG").toUpperCase().slice(0, 2), String(body.currency || "USD").toUpperCase().slice(0, 3), Math.min(8, Math.max(1, Number(body.adults) || 2)));
    return NextResponse.json({ ok: true, rates });
  } catch {
    return NextResponse.json({ ok: false, error: "rates unavailable" }, { status: 502 });
  }
}
