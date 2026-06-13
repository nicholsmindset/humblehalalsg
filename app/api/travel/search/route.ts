import { NextResponse } from "next/server";
import { liteapiConfigured, searchRates } from "@/lib/liteapi";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { hotelFromRates, type OverlayRow, type Hotel } from "@/lib/halal-hotels";
import type { RatesSearchBody } from "@/lib/liteapi-types";

/* Hotel search → LiteAPI POST /hotels/rates, then left-join our Muslim-friendly
   overlay and re-rank by halal_score. Graceful: without a LiteAPI key it returns
   {ok,simulated,hotels:[]} so the UI still renders. Discovery only — no payment,
   so this is NOT behind the PAID_HOTELS_ENABLED switch. */

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function POST(req: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }
  if (body.website) return NextResponse.json({ ok: true, simulated: true, hotels: [] }); // honeypot

  const checkin = String(body.checkin || "");
  const checkout = String(body.checkout || "");
  if (!DATE_RE.test(checkin) || !DATE_RE.test(checkout) || checkout <= checkin) {
    return NextResponse.json({ ok: false, error: "Pick valid check-in and check-out dates" }, { status: 422 });
  }
  const cityName = String(body.cityName || "").trim();
  const countryCode = String(body.countryCode || "").trim();
  const hotelIds = Array.isArray(body.hotelIds) ? (body.hotelIds as string[]).slice(0, 200) : undefined;
  if (!cityName && !countryCode && !(hotelIds && hotelIds.length)) {
    return NextResponse.json({ ok: false, error: "Tell us where to search" }, { status: 422 });
  }

  const search: RatesSearchBody = {
    checkin,
    checkout,
    currency: String(body.currency || "USD").toUpperCase().slice(0, 3),
    guestNationality: String(body.guestNationality || "SG").toUpperCase().slice(0, 2),
    occupancies: Array.isArray(body.occupancies) && body.occupancies.length
      ? (body.occupancies as { adults: number; children?: number[] }[])
      : [{ adults: 2 }],
    ...(cityName ? { cityName } : {}),
    ...(countryCode ? { countryCode } : {}),
    ...(hotelIds ? { hotelIds } : {}),
    limit: Math.min(50, Math.max(1, Number(body.limit) || 30)),
  };

  if (!liteapiConfigured()) {
    return NextResponse.json({ ok: true, simulated: true, hotels: [] });
  }

  let hits;
  try {
    hits = await searchRates(search);
  } catch {
    return NextResponse.json({ ok: false, error: "Could not fetch hotels right now" }, { status: 502 });
  }

  // Overlay join (best-effort): public-read table, but use admin to avoid RLS noise.
  const overlay = new Map<string, OverlayRow>();
  const db = getSupabaseAdmin();
  if (db && hits.length) {
    try {
      const ids = hits.map((h) => h.id);
      const { data } = await db.from("muslim_friendly_hotels").select("*").in("liteapi_hotel_id", ids);
      for (const row of (data as OverlayRow[]) || []) overlay.set(row.liteapi_hotel_id, row);
    } catch {
      /* overlay is best-effort */
    }
  }

  const hotels: Hotel[] = hits
    .map((h) => hotelFromRates(h, overlay.get(h.id)))
    .sort((a, b) => b.halalScore - a.halalScore || (a.priceFrom?.amount ?? 1e9) - (b.priceFrom?.amount ?? 1e9));

  return NextResponse.json({ ok: true, simulated: false, hotels });
}
