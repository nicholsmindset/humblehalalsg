import "server-only";
import { withCache, hashKey } from "./cache";
import type {
  LiteApiHotelContent,
  LiteApiRatesHotel,
  LiteApiPlace,
  LiteApiSemanticHotel,
  LiteApiRoomHit,
  LiteApiAirport,
  FlightSearchBody,
  FlightContactInput,
  FlightPassengerInput,
  RatesSearchBody,
  PrebookResult,
  BookResult,
} from "./liteapi-types";

/* Humble Halal — LiteAPI v3.0 client.
   fetch-based (no SDK lock-in). Auth is the `X-API-Key` header (NOT Bearer).
   Returns null/empty + degrades gracefully when no key is set, mirroring
   lib/stripe.ts, so /api/travel/* can run in "simulated" mode in dev. */

const BASE = "https://api.liteapi.travel/v3.0";
/* The dashboard/analytics host. LiteAPI routes vouchers + analytics through
   da.liteapi.travel (no /v3.0 prefix), separate from the search/booking host. */
const DA_BASE = "https://da.liteapi.travel";
const TIMEOUT_MS = 10_000;

/** Active key: prod when LITEAPI_ENV=prod, else sandbox; falls back either way. */
function apiKey(): string | null {
  const prod = process.env.LITEAPI_ENV === "prod";
  const k = prod ? process.env.LITEAPI_PROD_KEY : process.env.LITEAPI_SAND_KEY;
  return k || process.env.LITEAPI_SAND_KEY || process.env.LITEAPI_PROD_KEY || null;
}

export function liteapiConfigured(): boolean {
  return !!apiKey();
}

class LiteApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function once(url: string, init: RequestInit, key: string): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, {
      ...init,
      signal: ctrl.signal,
      headers: { "X-API-Key": key, accept: "application/json", ...(init.headers || {}) },
    });
  } finally {
    clearTimeout(t);
  }
}

/** Core request with one retry on 5xx for IDEMPOTENT GETs only. Throws
 *  LiteApiError on non-2xx. `base` defaults to the search/booking host; pass
 *  DA_BASE for analytics/voucher CRUD. */
async function request<T>(path: string, init: RequestInit = {}, base: string = BASE): Promise<T> {
  const key = apiKey();
  if (!key) throw new LiteApiError(0, "liteapi_not_configured");
  const url = `${base}${path}`;
  const method = (init.method || "GET").toUpperCase();
  let res = await once(url, init, key);
  // Retry 5xx ONLY for idempotent GETs. Non-idempotent POSTs (esp. /rates/book
  // and /rates/prebook) must NEVER be auto-retried — a retried booking can
  // double-book / double-charge (CP1 audit). Failures surface as LiteApiError.
  if (res.status >= 500 && method === "GET") res = await once(url, init, key);
  if (!res.ok) throw new LiteApiError(res.status, `liteapi_${res.status}`);
  return (await res.json()) as T;
}

function qs(params: Record<string, string | number | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "") sp.set(k, String(v));
  const s = sp.toString();
  return s ? `?${s}` : "";
}

/* ── Static content ─────────────────────────────────────────────────────── */

export async function getHotel(hotelId: string): Promise<LiteApiHotelContent | null> {
  // Static content (descriptions/images/facilities) — safe to cache 24h. Never
  // affects the price the guest pays (that comes from the live rates/prebook path).
  return withCache(`liteapi:hotel:${hotelId}`, 86_400, async () => {
    const r = await request<{ data?: LiteApiHotelContent }>(`/data/hotel${qs({ hotelId, timeout: 4 })}`);
    return r.data ?? null;
  });
}

export async function getHotelsByCity(
  countryCode: string,
  cityName: string,
  limit = 30,
): Promise<LiteApiHotelContent[]> {
  const r = await request<{ data?: LiteApiHotelContent[] }>(
    `/data/hotels${qs({ countryCode, cityName, limit, timeout: 6 })}`,
  );
  return Array.isArray(r.data) ? r.data : [];
}

export async function getHotelReviews(hotelId: string, limit = 50): Promise<unknown[]> {
  // Reviews are static content (never affect the live price) — cache 7d like /data/hotel.
  return withCache(`liteapi:reviews:${hotelId}:${limit}`, 604_800, async () => {
    const r = await request<{ data?: unknown[] }>(`/data/reviews${qs({ hotelId, limit, timeout: 4 })}`);
    return Array.isArray(r.data) ? r.data : [];
  });
}

export async function getCountries(): Promise<{ code: string; name: string }[]> {
  const r = await request<{ data?: { code: string; name: string }[] }>(`/data/countries`);
  return Array.isArray(r.data) ? r.data : [];
}

/** Hotel-type classifications (resort, boutique, business…) with ids used to filter
 *  /hotels/rates. Stable reference data — cache 24h. */
export async function getHotelTypes(): Promise<{ id: number; name: string }[]> {
  return withCache(`liteapi:hoteltypes`, 86_400, async () => {
    const r = await request<{ data?: { hotelTypeId?: number | string; id?: number | string; name?: string }[] }>(`/data/hotelTypes`);
    return (Array.isArray(r.data) ? r.data : [])
      .map((t) => ({ id: Number(t.hotelTypeId ?? t.id), name: String(t.name || "") }))
      .filter((t) => Number.isFinite(t.id) && t.name);
  });
}

/** Hotel chains/brands with ids used to filter /hotels/rates. Cache 24h. */
export async function getChains(): Promise<{ id: number; name: string }[]> {
  return withCache(`liteapi:chains`, 86_400, async () => {
    const r = await request<{ data?: { chainId?: number | string; id?: number | string; name?: string }[] }>(`/data/chains`);
    return (Array.isArray(r.data) ? r.data : [])
      .map((c) => ({ id: Number(c.chainId ?? c.id), name: String(c.name || "") }))
      .filter((c) => Number.isFinite(c.id) && c.name);
  });
}

/** Global destination autocomplete (cities, landmarks, areas). */
export async function searchPlaces(textQuery: string): Promise<LiteApiPlace[]> {
  const q = textQuery.trim();
  if (!q) return [];
  // /data/places is a paid premium endpoint ($0.01/req); the place list is stable,
  // so cache by normalized query for 24h (debounce + rate limit guard the rest).
  return withCache(`liteapi:places:${q.toLowerCase()}`, 86_400, async () => {
    const r = await request<{ data?: LiteApiPlace[] }>(`/data/places${qs({ textQuery: q })}`);
    return Array.isArray(r.data) ? r.data : [];
  });
}

/** Natural-language ("semantic") hotel discovery (LiteAPI beta). Returns content +
 *  relevance, NO pricing — callers add "from $X" via minRates. */
export async function semanticSearch(query: string, limit = 12, minRating?: number): Promise<LiteApiSemanticHotel[]> {
  const q = query.trim();
  if (!q) return [];
  const r = await request<{ data?: Record<string, unknown>[] }>(
    `/data/hotels/semantic-search${qs({ query: q, limit, min_rating: minRating })}`,
  );
  const num = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : undefined);
  return (Array.isArray(r.data) ? r.data : [])
    .map((h) => ({
      id: String(h.id ?? h.hotelId ?? ""),
      name: h.name ? String(h.name) : undefined,
      main_photo: (h.main_photo as string) || (h.thumbnail as string) || undefined,
      thumbnail: h.thumbnail ? String(h.thumbnail) : undefined,
      address: h.address ? String(h.address) : undefined,
      city: (h.city as string) || (h.city_name as string) || undefined,
      country: (h.country as string) || (h.country_code as string) || undefined,
      rating: num(h.rating),
      stars: num(h.stars ?? h.starRating),
      reviewCount: num(h.reviewCount ?? h.review_count),
      score: num(h.relevance ?? h.score),
      tags: Array.isArray(h.tags) ? (h.tags as unknown[]).map(String) : undefined,
    }))
    .filter((h) => h.id);
}

/** Room-level visual/text search (LiteAPI beta). Rooms matched by image, grouped
 *  under their hotel. Geo is optional (placeId | lat/lng+radius | city/country). */
export async function roomSearch(
  query: string,
  geo: { placeId?: string; latitude?: number; longitude?: number; radius?: number; city?: string; country?: string } = {},
  limit = 12,
): Promise<LiteApiRoomHit[]> {
  const q = query.trim();
  if (!q) return [];
  const r = await request<{ data?: Record<string, unknown>[] }>(
    `/data/hotels/room-search${qs({ query: q, limit, placeId: geo.placeId, latitude: geo.latitude, longitude: geo.longitude, radius: geo.radius, city: geo.city, country: geo.country })}`,
  );
  const num = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : undefined);
  return (Array.isArray(r.data) ? r.data : [])
    .map((h) => {
      const rooms = Array.isArray(h.rooms) ? (h.rooms as Record<string, unknown>[]) : [];
      return {
        hotelId: String(h.hotelId ?? h.id ?? ""),
        hotelName: h.name ? String(h.name) : h.hotelName ? String(h.hotelName) : undefined,
        city: (h.city as string) || (h.city_name as string) || undefined,
        country: (h.country as string) || (h.country_code as string) || undefined,
        rating: num(h.rating),
        rooms: rooms.map((rm) => ({ name: rm.name ? String(rm.name) : undefined, image: (rm.image as string) || (rm.url as string) || undefined, score: num(rm.score ?? rm.similarity) })),
      };
    })
    .filter((h) => h.hotelId);
}

/* ── Rates / booking ────────────────────────────────────────────────────── */

export async function searchRates(body: RatesSearchBody): Promise<LiteApiRatesHotel[]> {
  const r = await request<{ hotels?: LiteApiRatesHotel[]; data?: LiteApiRatesHotel[] }>(`/hotels/rates`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return r.hotels ?? r.data ?? [];
}

/** Extra prebook inputs LiteAPI accepts alongside the offer: a discount voucher,
 *  paid add-ons, and preferred bed-type ids. Applying a voucher here is what makes
 *  the discount real — LiteAPI returns a fresh transactionId/price reflecting it. */
export interface PrebookOptions {
  voucherCode?: string;
  addons?: unknown[];
  bedTypeIds?: (string | number)[];
}

export async function prebook(offerId: string, usePaymentSdk = true, opts: PrebookOptions = {}): Promise<PrebookResult> {
  const payload: Record<string, unknown> = { offerId, usePaymentSdk };
  if (opts.voucherCode) payload.voucherCode = opts.voucherCode;
  if (Array.isArray(opts.addons) && opts.addons.length) payload.addons = opts.addons;
  if (Array.isArray(opts.bedTypeIds) && opts.bedTypeIds.length) payload.bedTypeIds = opts.bedTypeIds;
  const r = await request<{ data?: PrebookResult } & PrebookResult>(`/rates/prebook?timeout=30`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return r.data ?? r;
}

export async function book(payload: Record<string, unknown>): Promise<BookResult> {
  const r = await request<{ data?: BookResult } & BookResult>(`/rates/book`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return r.data ?? r;
}

export async function getBooking(bookingId: string): Promise<BookResult | null> {
  const r = await request<{ data?: BookResult }>(`/bookings/${encodeURIComponent(bookingId)}${qs({ timeout: 4 })}`);
  return r.data ?? null;
}

/** Cancel a hotel booking — LiteAPI enforces the cancellation policy. */
export async function cancelBooking(bookingId: string): Promise<{ status?: string; refund?: unknown } | null> {
  const r = await request<{ data?: { status?: string; refund?: unknown } }>(`/bookings/${encodeURIComponent(bookingId)}`, { method: "PUT" });
  return r.data ?? null;
}

/** Amend the lead guest's name/email on a hotel booking. LiteAPI /bookings/{id}/amend. */
export async function amendBooking(bookingId: string, fields: { firstName?: string; lastName?: string; email?: string }): Promise<{ status?: string } | null> {
  const r = await request<{ data?: { status?: string } }>(`/bookings/${encodeURIComponent(bookingId)}/amend`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(fields),
  });
  return r.data ?? null;
}

/* ── AI + pricing ───────────────────────────────────────────────────────── */

/** "Ask AI about this hotel" — natural-language Q&A over the hotel's own info. */
export async function askHotel(hotelId: string, query: string, allowWebSearch = false): Promise<{ answer: string; citations: string[]; searchUsed: boolean } | null> {
  const r = await request<{ data?: { answer?: string; citations?: string[]; search_used?: boolean } }>(
    `/data/hotel/ask${qs({ hotelId, query, allowWebSearch: allowWebSearch ? "true" : "false" })}`,
  );
  const d = r.data;
  if (!d) return null;
  return { answer: String(d.answer || ""), citations: Array.isArray(d.citations) ? d.citations.map(String) : [], searchUsed: !!d.search_used };
}

/** Average nightly price per day across a city (for price-saver tips). */
export async function cityPriceIndex(countryCode: string, cityName: string, fromDate?: string, toDate?: string): Promise<{ day: string; avgPriceUsd: number }[]> {
  const r = await request<{ prices?: { day: string; avgPriceUsd: number }[] }>(`/prices/city${qs({ countryCode, cityName, fromDate, toDate })}`);
  return Array.isArray(r.prices) ? r.prices : [];
}

/** Loyalty programme settings (cashback rate) — "Humble Halal Rewards". */
export async function getLoyalty(): Promise<{ cashbackRate: number; currency: string; status: string } | null> {
  const r = await request<{ data?: { cashbackRate?: number; cashbackCurrency?: string; status?: string }[] }>(`/loyalties/`);
  const d = Array.isArray(r.data) ? r.data[0] : undefined;
  if (!d) return null;
  return { cashbackRate: Number(d.cashbackRate) || 0, currency: String(d.cashbackCurrency || "USD"), status: String(d.status || "") };
}

/** Validate a discount voucher/promo code. Returns null when vouchers aren't
 *  enabled on the account (graceful). */
export async function getVoucher(code: string): Promise<{ code: string; discountType: string; discountValue: number; currency?: string; active: boolean } | null> {
  const r = await request<{ data?: { voucherCode?: string; discountType?: string; discountValue?: number; currency?: string; status?: string } }>(`/vouchers/${encodeURIComponent(code)}`);
  const d = r.data;
  if (!d || !d.voucherCode) return null;
  return { code: String(d.voucherCode), discountType: String(d.discountType || "fixed"), discountValue: Number(d.discountValue) || 0, currency: d.currency ? String(d.currency) : undefined, active: String(d.status || "") === "active" };
}

export interface WeeklyAnalyticsRow { week: string; bookings: number; revenue: number; currency: string }

/** Weekly sales/booking totals from LiteAPI's analytics (da.liteapi.travel) — the
 *  payout source of truth, complementing our own ledger. Admin-only callers. */
export async function analyticsWeekly(from: string, to: string): Promise<WeeklyAnalyticsRow[]> {
  const r = await request<{ data?: Record<string, unknown>[]; weeks?: Record<string, unknown>[] }>(
    `/analytics/weekly`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ from, to }) },
    DA_BASE,
  );
  const rows = Array.isArray(r.data) ? r.data : Array.isArray(r.weeks) ? r.weeks : [];
  const num = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);
  return rows.map((w) => ({
    week: String(w.week ?? w.weekStart ?? w.label ?? ""),
    bookings: num(w.bookings ?? w.count ?? w.totalBookings),
    revenue: num(w.revenue ?? w.sales ?? w.totalSales ?? w.amount),
    currency: String(w.currency ?? "USD"),
  })).filter((w) => w.week);
}

/** Create a discount voucher/promo for marketing campaigns (da.liteapi.travel).
 *  Admin-only. Returns the created voucher object, or null on a soft failure. */
export async function createVoucher(payload: Record<string, unknown>): Promise<Record<string, unknown> | null> {
  const r = await request<{ data?: Record<string, unknown> } & Record<string, unknown>>(
    `/vouchers`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) },
    DA_BASE,
  );
  return (r.data as Record<string, unknown>) ?? r ?? null;
}

export interface DailyWeather { date: string; tempMin?: number; tempMax?: number; humidity?: number; precipitation?: number; units: string }

/** Daily weather forecast for a location (trip planning). LiteAPI /data/weather. */
export async function getWeather(lat: number, lng: number, startDate: string, endDate: string): Promise<DailyWeather[]> {
  const r = await request<{ weatherData?: { dailyWeather?: Record<string, unknown> }[] }>(`/data/weather${qs({ latitude: lat, longitude: lng, startDate, endDate })}`);
  const list = Array.isArray(r.weatherData) ? r.weatherData : [];
  return list.map((w) => {
    const d = (w.dailyWeather || {}) as Record<string, unknown>;
    const t = (d.temperature || {}) as Record<string, unknown>;
    const h = (d.humidity || {}) as Record<string, unknown>;
    const p = (d.precipitation || {}) as Record<string, unknown>;
    const n = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : undefined);
    return { date: String(d.date || ""), tempMin: n(t.min), tempMax: n(t.max), humidity: n(h.afternoon), precipitation: n(p.total), units: String(d.units || "metric") };
  }).filter((x) => x.date);
}

/** Cheapest available rate per hotel (for "from $X" labels). LiteAPI /hotels/min-rates. */
export async function minRates(hotelIds: string[], checkin: string, checkout: string, guestNationality: string, currency = "USD", adults = 2): Promise<Record<string, { price: number; offerId?: string }>> {
  if (!hotelIds.length) return {};
  const ids = hotelIds.slice(0, 200);
  // Indicative "from $X" labels (not booking-binding) — cache 30m. Key is hashed
  // over the SORTED id set so card order never fragments the cache. Booking always
  // re-prices live via /hotels/rates → prebook, so short staleness here is harmless.
  const key = `liteapi:minrates:${checkin}:${checkout}:${guestNationality}:${currency}:${adults}:${hashKey([...ids].sort().join(","))}`;
  return withCache(key, 1_800, async () => {
    const r = await request<{ data?: { hotelId: string; price: number; offerId?: string }[] }>(`/hotels/min-rates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hotelIds: ids, checkin, checkout, occupancies: [{ adults }], guestNationality, currency }),
    });
    const out: Record<string, { price: number; offerId?: string }> = {};
    for (const x of r.data || []) if (x.hotelId && Number.isFinite(Number(x.price))) out[x.hotelId] = { price: Number(x.price), offerId: x.offerId };
    return out;
  });
}

/* ── flights ────────────────────────────────────────────────────────────── */

export async function searchAirports(q: string): Promise<LiteApiAirport[]> {
  if (q.trim().length < 2) return [];
  const r = await request<{ airports?: LiteApiAirport[] }>(`/data/flights/airports/${qs({ q })}`);
  return Array.isArray(r.airports) ? r.airports : [];
}

/** Flight search → raw journey groups (normalize with lib/flights). */
export async function searchFlights(body: FlightSearchBody): Promise<unknown[]> {
  const r = await request<{ data?: unknown[] }>(`/flights/rates`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return Array.isArray(r.data) ? r.data : [];
}

/** Re-price/validate a flight offer before booking. Surfaces `changes` (price moves),
 *  fare family, baggage policy and cancellation/change terms. */
export async function verifyFlight(offerId: string): Promise<{ total?: number; currency?: string; changes?: unknown; fare?: unknown; baggage?: unknown; terms?: unknown } | null> {
  const r = await request<{ data?: { journey?: { pricing?: { display?: { total?: number; currency?: string } }; fare?: unknown; baggage?: unknown; terms?: unknown }; changes?: unknown }[] }>(`/flights/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ offerId }),
  });
  const item = r.data?.[0];
  if (!item) return null;
  const d = item.journey?.pricing?.display;
  return { total: d?.total, currency: d?.currency, changes: item.changes, fare: item.journey?.fare, baggage: item.journey?.baggage, terms: item.journey?.terms };
}

/** Flight prebook → opens the Stripe payment intent. Returns prebookId, payment
 *  handles AND `servicesAttachable` (seats/bags available to add in step 2). */
export async function prebookFlight(offerId: string, contact: FlightContactInput, passengers: FlightPassengerInput[]): Promise<Record<string, unknown> | null> {
  const r = await request<{ data?: Record<string, unknown>[] }>(`/flights/prebooks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ offerId, usePaymentSdk: true, contact, passengers }),
  });
  return r.data?.[0] ?? null;
}

/** Attach seats/bags to a prebook. Returns a NEW payment intent (transactionId)
 *  reflecting the updated total — callers MUST use the latest transactionId. */
export async function attachFlightServices(prebookId: string, selectedServices: unknown[], voucherCode?: string): Promise<Record<string, unknown> | null> {
  const body: Record<string, unknown> = { selectedServices };
  if (voucherCode) body.voucherCode = voucherCode;
  const r = await request<{ data?: Record<string, unknown>[] }>(`/flights/prebooks/${encodeURIComponent(prebookId)}/services`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return r.data?.[0] ?? null;
}

export interface FlightBookOutcome {
  booking: { bookingId?: string; bookingRef?: string; status?: string; paymentStatus?: string; pnr?: string } | null;
  httpStatus: number;
  errorCode?: number;
  errorMessage?: string;
}

/** Complete a flight booking. Does NOT throw — returns the error code so the
 *  route can apply the payment-captured-safe policy (idempotent retry on
 *  55004/55029/45035, never surface a payment error after capture). */
export async function bookFlight(prebookId: string, transactionId: string): Promise<FlightBookOutcome> {
  const key = apiKey();
  if (!key) return { booking: null, httpStatus: 0 };
  let res: Response;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    res = await fetch(`${BASE}/flights/bookings`, {
      method: "POST",
      headers: { "X-API-Key": key, "Content-Type": "application/json", accept: "application/json" },
      body: JSON.stringify({ prebookId, payment: { method: "TRANSACTION_ID", transactionId } }),
      signal: ctrl.signal,
    });
    clearTimeout(t);
  } catch {
    return { booking: null, httpStatus: 0 };
  }
  const body = (await res.json().catch(() => ({}))) as { data?: { booking?: Record<string, unknown> }[]; error?: { code?: number; description?: string; message?: string } };
  if (res.ok) {
    const b = (body.data?.[0]?.booking || {}) as Record<string, unknown>;
    const order = (b.order as Record<string, unknown> | undefined)?.reference as Record<string, unknown> | undefined;
    const provider = order?.provider as Record<string, unknown> | undefined;
    return {
      booking: { bookingId: b.bookingId as string, bookingRef: b.bookingRef as string, status: b.status as string, paymentStatus: b.paymentStatus as string, pnr: provider?.pnr as string },
      httpStatus: res.status,
    };
  }
  return { booking: null, httpStatus: res.status, errorCode: body.error?.code, errorMessage: body.error?.description || body.error?.message };
}

export { LiteApiError };
