import "server-only";
import { getHotel, getHotelReviews, getHotelsByCity, searchRates } from "./liteapi";
import { getSupabaseAdmin } from "./supabase/server";
import {
  hotelFromContent,
  offersFromRatesHotel,
  type Hotel,
  type HotelReview,
  type OverlayRow,
  type RateOffer,
} from "./halal-hotels";
import { nearbyPlaces, type NearbyPlace } from "./mosques-nearby";
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
  reviews: HotelReview[];
  mosques: NearbyPlace[];
  halalFood: NearbyPlace[];
}

function normalizeReviews(raw: unknown[]): HotelReview[] {
  return raw
    .map((r) => {
      const o = (r || {}) as Record<string, unknown>;
      const score = Number(o.averageScore);
      return {
        name: String(o.name || "Guest"),
        country: o.country ? String(o.country) : undefined,
        type: o.type ? String(o.type) : undefined,
        date: o.date ? String(o.date) : undefined,
        score: Number.isFinite(score) ? score : undefined,
        headline: o.headline ? String(o.headline) : undefined,
        pros: o.pros ? String(o.pros) : undefined,
        cons: o.cons ? String(o.cons) : undefined,
      } as HotelReview;
    })
    .filter((r) => r.headline || r.pros || r.cons);
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

  let reviews: HotelReview[] = [];
  try {
    reviews = normalizeReviews(await getHotelReviews(id, 12));
  } catch {
    /* reviews best-effort */
  }

  const places = hotel.coords ? await nearbyPlaces(hotel.coords.lat, hotel.coords.lng) : { mosques: [], halalFood: [] };

  return {
    hotel,
    images: images.length ? images : hotel.image ? [hotel.image] : [],
    offers,
    reviews,
    mosques: places.mosques,
    halalFood: places.halalFood,
  };
}
