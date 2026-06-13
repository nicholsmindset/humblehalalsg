import "server-only";
import { getHotel, getHotelsByCity, searchRates } from "./liteapi";
import { getSupabaseAdmin } from "./supabase/server";
import {
  hotelFromContent,
  offersFromRatesHotel,
  type Hotel,
  type OverlayRow,
  type RateOffer,
} from "./halal-hotels";
import type { TravelCity } from "./travel-locations";

/* Server-side travel data: LiteAPI content/rates merged with our Supabase
   Muslim-friendly overlay. All best-effort — never throws, returns empty so the
   travel pages render (graceful, like the rest of the site). */

async function overlayFor(ids: string[]): Promise<Map<string, OverlayRow>> {
  const m = new Map<string, OverlayRow>();
  const db = getSupabaseAdmin();
  if (!db || !ids.length) return m;
  try {
    const { data } = await db.from("muslim_friendly_hotels").select("*").in("liteapi_hotel_id", ids);
    for (const r of (data as OverlayRow[]) || []) m.set(r.liteapi_hotel_id, r);
  } catch {
    /* overlay best-effort */
  }
  return m;
}

export async function cityHotels(c: TravelCity, limit = 18): Promise<Hotel[]> {
  let content;
  try {
    content = await getHotelsByCity(c.countryCode, c.cityName, limit);
  } catch {
    return [];
  }
  const ov = await overlayFor(content.map((h) => h.id));
  return content
    .map((h) => hotelFromContent(h, ov.get(h.id)))
    .sort((a, b) => b.halalScore - a.halalScore);
}

export interface HotelDetail {
  hotel: Hotel;
  images: string[];
  offers: RateOffer[];
}

export async function hotelDetail(
  id: string,
  dates?: { checkin: string; checkout: string; currency: string },
): Promise<HotelDetail | null> {
  let content;
  try {
    content = await getHotel(id);
  } catch {
    return null;
  }
  if (!content) return null;

  const ov = await overlayFor([id]);
  const hotel = hotelFromContent(content, ov.get(id));
  const images = ((content.hotelImages || []).map((im) => im?.url).filter(Boolean) as string[]);

  let offers: RateOffer[] = [];
  if (dates) {
    try {
      const hits = await searchRates({
        checkin: dates.checkin,
        checkout: dates.checkout,
        currency: dates.currency,
        guestNationality: "SG",
        occupancies: [{ adults: 2 }],
        hotelIds: [id],
        limit: 1,
      });
      const hit = hits.find((h) => h.id === id) || hits[0];
      if (hit) offers = offersFromRatesHotel(hit);
    } catch {
      /* rates best-effort */
    }
  }

  return { hotel, images: images.length ? images : hotel.image ? [hotel.image] : [], offers };
}
