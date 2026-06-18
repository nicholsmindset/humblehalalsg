import "server-only";
import { cityPriceIndex, getHotel, getHotelReviews, getHotelsByCity, liteapiConfigured, minRates, searchRates, semanticSearch } from "./liteapi";
import { getSupabaseAdmin } from "./supabase/server";
import {
  activeFlagLabels,
  groupRooms,
  hotelFromContent,
  hotelFromRates,
  offersFromRatesHotel,
  type Hotel,
  type HotelFlags,
  type HotelReview,
  type HotelSentiment,
  type OverlayRow,
  type RateOffer,
  type RoomGroup,
} from "./halal-hotels";
import { nearbyPlaces, type NearbyPlace } from "./mosques-nearby";
import { getPrayerTimes, type PrayerTimesResult } from "./prayer";
import type { LiteApiHotelContent, LiteApiRatesHotel, RatesSearchBody } from "./liteapi-types";
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

export interface CityPriceTip {
  city: string;
  avgUsd: number;
  minUsd: number;
  maxUsd: number;
  cheapestDay?: string;
}

/** City price trend for "price-saver" nudges (cached at the page level). */
export async function cityPriceTip(countryCode: string, cityName: string): Promise<CityPriceTip | null> {
  try {
    const today = new Date();
    const from = today.toISOString().slice(0, 10);
    const to = new Date(today.getTime() + 30 * 864e5).toISOString().slice(0, 10);
    const prices = await cityPriceIndex(countryCode.toUpperCase(), cityName, from, to);
    const valid = prices.filter((p) => p.avgPriceUsd > 0);
    if (!valid.length) return null;
    const vals = valid.map((p) => p.avgPriceUsd);
    const avg = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
    const cheapest = [...valid].sort((a, b) => a.avgPriceUsd - b.avgPriceUsd)[0];
    return { city: cityName, avgUsd: avg, minUsd: Math.min(...vals), maxUsd: Math.max(...vals), cheapestDay: cheapest?.day };
  } catch {
    return null;
  }
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

/* ── Shared hotel search (used by /api/travel/search AND /api/travel/ai-search) ──
   Single source of truth so the two routes can never drift: LiteAPI /hotels/rates
   → overlay-join via halal-hotels → sort by halalScore (price tiebreak). Graceful:
   no LiteAPI key → { simulated:true, hotels:[] }. Never throws. */

/** Sensible future stay window (check-in +30d, 2-night stay) for when a caller
 *  (e.g. the AI parser) doesn't supply dates. */
export function defaultStayDates(nights = 2): { checkin: string; checkout: string } {
  const inDate = new Date(Date.now() + 30 * 864e5);
  const outDate = new Date(inDate.getTime() + Math.max(1, nights) * 864e5);
  return { checkin: inDate.toISOString().slice(0, 10), checkout: outDate.toISOString().slice(0, 10) };
}

export interface RunHotelSearchParams {
  destination?: string; // free text (unused by LiteAPI directly; resolve to placeId/cityName upstream)
  placeId?: string;
  cityName?: string;
  countryCode?: string;
  checkin: string;
  checkout: string;
  currency?: string;
  guestNationality?: string;
  adults?: number;
  children?: number;
  rooms?: number;
  hotelIds?: string[];
  limit?: number;
  /** Stable per-session id for search→prebook price consistency. */
  sessionId?: string;
  /** Native LiteAPI rate filters (passed through to /hotels/rates). */
  filters?: Pick<RatesSearchBody, "refundableRatesOnly" | "starRating" | "minRating" | "boardType" | "facilities" | "hotelTypeIds" | "chainIds">;
  /** Exact LiteAPI occupancies passthrough (preserves child ages / per-room blocks).
   *  When provided it wins over adults/children/rooms (used by the search route to
   *  keep its request byte-identical). */
  occupancies?: { adults: number; children?: number[] }[];
  /** Muslim-friendly post-filter: only keep hotels whose overlay flags satisfy ALL. */
  constraints?: (keyof HotelFlags)[];
}

/** Parse + sanitize native LiteAPI rate filters from a request body. Shared by the
 *  search and ai-search routes so both narrow the rate query identically. Returns
 *  undefined when nothing valid is present (so the request stays clean). */
export function parseRateFilters(body: Record<string, unknown>): RunHotelSearchParams["filters"] {
  const toIntArray = (v: unknown): number[] =>
    (Array.isArray(v) ? v : []).map((x) => Math.round(Number(x))).filter((n) => Number.isInteger(n) && n > 0).slice(0, 30);
  const f: NonNullable<RunHotelSearchParams["filters"]> = {};
  if (body.refundableRatesOnly === true || body.refundableRatesOnly === "true") f.refundableRatesOnly = true;
  const star = Number(body.starRating);
  if (Number.isFinite(star) && star >= 1 && star <= 5) f.starRating = Math.round(star);
  const minR = Number(body.minRating);
  if (Number.isFinite(minR) && minR >= 0 && minR <= 10) f.minRating = minR;
  const board = String(body.boardType || "").trim().toUpperCase();
  if (/^[A-Z_]{2,20}$/.test(board)) f.boardType = board;
  const facilities = toIntArray(body.facilities);
  if (facilities.length) f.facilities = facilities;
  const hotelTypeIds = toIntArray(body.hotelTypeIds);
  if (hotelTypeIds.length) f.hotelTypeIds = hotelTypeIds;
  const chainIds = toIntArray(body.chainIds);
  if (chainIds.length) f.chainIds = chainIds;
  return Object.keys(f).length ? f : undefined;
}

/** Run the canonical hotel search. Mirrors app/api/travel/search/route.ts exactly
 *  (rates → overlay join → sort), with an optional constraints post-filter. */
export async function runHotelSearch(
  params: RunHotelSearchParams,
): Promise<{ simulated: boolean; hotels: Hotel[] }> {
  const adults = Math.min(9, Math.max(1, Math.round(params.adults || 2)));
  const children = Math.min(8, Math.max(0, Math.round(params.children || 0)));
  const roomCount = Math.min(8, Math.max(1, Math.round(params.rooms || 1)));
  // Exact passthrough when given (search route), else derive: one occupancy entry
  // per room with the same adults/children block (matches the UI's request shape).
  const occupancies: { adults: number; children?: number[] }[] =
    params.occupancies && params.occupancies.length
      ? params.occupancies
      : Array.from({ length: roomCount }, () => ({
          adults,
          ...(children > 0 ? { children: Array.from({ length: children }, () => 8) } : {}),
        }));

  const placeId = (params.placeId || "").trim();
  const cityName = (params.cityName || "").trim();
  const countryCode = (params.countryCode || "").trim();
  const hotelIds = params.hotelIds && params.hotelIds.length ? params.hotelIds.slice(0, 200) : undefined;
  if (!placeId && !cityName && !countryCode && !(hotelIds && hotelIds.length)) {
    return { simulated: true, hotels: [] };
  }

  if (!liteapiConfigured()) return { simulated: true, hotels: [] };

  const search: RatesSearchBody = {
    checkin: params.checkin,
    checkout: params.checkout,
    currency: String(params.currency || "USD").toUpperCase().slice(0, 3),
    guestNationality: String(params.guestNationality || "SG").toUpperCase().slice(0, 2),
    occupancies,
    ...(placeId ? { placeId } : cityName ? { cityName } : {}),
    ...(!placeId && countryCode ? { countryCode } : {}),
    ...(hotelIds ? { hotelIds } : {}),
    limit: Math.min(50, Math.max(1, params.limit || 30)),
    ...(params.sessionId ? { sessionId: params.sessionId } : {}),
    ...(params.filters || {}),
  };

  let hits: LiteApiRatesHotel[];
  try {
    hits = await searchRates(search);
  } catch {
    return { simulated: false, hotels: [] };
  }

  const overlay = await overlayFor(hits.map((h) => h.id));
  let hotels: Hotel[] = hits
    .map((h) => hotelFromRates(h, overlay.get(h.id)))
    .sort((a, b) => b.halalScore - a.halalScore || (a.priceFrom?.amount ?? 1e9) - (b.priceFrom?.amount ?? 1e9));

  const constraints = (params.constraints || []).filter(Boolean) as (keyof HotelFlags)[];
  if (constraints.length) hotels = hotels.filter((h) => constraints.every((c) => h.flags[c]));

  return { simulated: false, hotels };
}

/* ── Semantic discovery (LiteAPI beta) ──────────────────────────────────────
   Natural-language "describe your ideal stay" search. The semantic endpoint returns
   content + relevance but NO price, so we overlay-join our halal flags, add a "from $X"
   via min-rates for a default future stay window, and rank by halalScore. Graceful. */
export async function runSemanticDiscovery(
  query: string,
  opts: { limit?: number; minRating?: number; currency?: string; guestNationality?: string } = {},
): Promise<{ simulated: boolean; hotels: Hotel[] }> {
  if (!query.trim()) return { simulated: true, hotels: [] };
  if (!liteapiConfigured()) return { simulated: true, hotels: [] };

  let raw;
  try {
    raw = await semanticSearch(query, Math.min(24, Math.max(1, opts.limit || 12)), opts.minRating);
  } catch {
    return { simulated: false, hotels: [] };
  }
  if (!raw.length) return { simulated: false, hotels: [] };

  const ids = raw.map((h) => h.id);
  const overlay = await overlayFor(ids);
  let hotels = raw.map((h) =>
    hotelFromRates(
      { id: h.id, name: h.name, main_photo: h.main_photo, thumbnail: h.thumbnail, address: h.address, city_name: h.city, country_code: h.country, rating: h.rating, stars: h.stars, review_count: h.reviewCount },
      overlay.get(h.id),
    ),
  );

  // "from $X" labels (best-effort) for a default future window — semantic search is dateless.
  try {
    const { checkin, checkout } = defaultStayDates(2);
    const currency = String(opts.currency || "USD").toUpperCase().slice(0, 3);
    const nat = String(opts.guestNationality || "SG").toUpperCase().slice(0, 2);
    const mins = await minRates(ids, checkin, checkout, nat, currency);
    hotels = hotels.map((h) => (mins[h.id]?.price != null ? { ...h, priceFrom: { amount: mins[h.id].price, currency } } : h));
  } catch {
    /* price is best-effort */
  }

  hotels.sort((a, b) => b.halalScore - a.halalScore || (a.priceFrom?.amount ?? 1e9) - (b.priceFrom?.amount ?? 1e9));
  return { simulated: false, hotels };
}

/* ── Grounded facts for the AI highlights generator ─────────────────────────── */

export interface HotelHighlightFacts {
  id: string;
  name: string;
  city?: string;
  country?: string;
  stars?: number;
  guestRating?: number;
  reviewCount?: number;
  flags: HotelFlags;
  flagLabels: string[];
  amenities: string[];
  pros: string[];
  mosqueCount: number;
  nearestMosqueM?: number;
  halalFoodCount: number;
}

/** Gather ONLY grounded facts (no invention) for the highlights generator. Reuses
 *  hotelDetail so flags/amenities/sentiment/nearby counts stay consistent with the
 *  hotel page. Returns null when the hotel can't be loaded. */
export async function hotelHighlightFacts(hotelId: string): Promise<HotelHighlightFacts | null> {
  const detail = await hotelDetail(hotelId);
  if (!detail) return null;
  const { hotel, mosques, halalFood, sentiment } = detail;
  const nearest = mosques.length ? Math.min(...mosques.map((m) => m.distanceM)) : undefined;
  return {
    id: hotel.id,
    name: hotel.name,
    city: hotel.city,
    country: hotel.country,
    stars: hotel.stars,
    guestRating: hotel.guestRating,
    reviewCount: hotel.reviewCount,
    flags: hotel.flags,
    flagLabels: activeFlagLabels(hotel.flags),
    amenities: (hotel.amenities || []).slice(0, 12),
    pros: (sentiment?.pros || []).slice(0, 6),
    mosqueCount: mosques.length,
    nearestMosqueM: nearest,
    halalFoodCount: halalFood.length,
  };
}

export interface HotelDetail {
  hotel: Hotel;
  images: string[];
  offers: RateOffer[];
  roomGroups: RoomGroup[];
  reviews: HotelReview[];
  mosques: NearbyPlace[];
  halalFood: NearbyPlace[];
  prayer: PrayerTimesResult | null;
  sentiment: HotelSentiment | null;
}

function parseSentiment(content: LiteApiHotelContent): HotelSentiment | null {
  const sa = (content.sentiment_analysis || content.sentimentAnalysis) as
    | { pros?: unknown; cons?: unknown; categories?: unknown }
    | undefined;
  if (!sa) return null;
  const strArr = (v: unknown) => (Array.isArray(v) ? v.map(String) : []);
  const cats = Array.isArray(sa.categories)
    ? (sa.categories as Record<string, unknown>[])
        .map((c) => ({ name: String(c.name || ""), rating: Number(c.rating) || 0, description: c.description ? String(c.description) : undefined }))
        .filter((c) => c.name && c.rating)
    : [];
  const pros = strArr(sa.pros);
  if (!cats.length && !pros.length) return null;
  return { pros, cons: strArr(sa.cons), categories: cats };
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
  const sentiment = parseSentiment(content);

  // Fire the independent network calls in parallel — keeps the page fast.
  const ratesP: Promise<LiteApiRatesHotel | null> = dates
    ? searchRates({ checkin: dates.checkin, checkout: dates.checkout, currency: dates.currency, guestNationality: "SG", occupancies: [{ adults: 2 }], hotelIds: [id], limit: 1 })
        .then((hits) => hits.find((h) => h.id === id) || hits[0] || null)
        .catch(() => null)
    : Promise.resolve(null);
  const reviewsP = getHotelReviews(id, 18).then(normalizeReviews).catch(() => [] as HotelReview[]);
  const placesP = hotel.coords ? nearbyPlaces(hotel.coords.lat, hotel.coords.lng) : Promise.resolve({ mosques: [], halalFood: [] });
  const prayerP = hotel.coords ? getPrayerTimes(hotel.coords.lat, hotel.coords.lng, hotel.country) : Promise.resolve(null);

  const [hit, reviews, places, prayer] = await Promise.all([ratesP, reviewsP, placesP, prayerP]);
  const offers = hit ? offersFromRatesHotel(hit) : [];
  const roomGroups = hit ? groupRooms(hit, content.rooms || []) : [];

  // Build the gallery: hotel images, and when those are sparse, fold in unique
  // room photos so a thin hotel still has a rich gallery (rooms always show their
  // own full photo set in the Rooms tab + lightbox).
  let gallery = images;
  if (gallery.length < 6) {
    const seen = new Set(gallery);
    for (const rg of roomGroups) for (const p of rg.photos) if (!seen.has(p)) { gallery.push(p); seen.add(p); }
  }
  if (!gallery.length && hotel.image) gallery = [hotel.image];

  return {
    hotel,
    images: gallery,
    offers,
    roomGroups,
    reviews,
    mosques: places.mosques,
    halalFood: places.halalFood,
    prayer,
    sentiment,
  };
}
