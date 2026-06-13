import "server-only";
import type {
  LiteApiHotelContent,
  LiteApiRatesHotel,
  LiteApiPlace,
  LiteApiAirport,
  FlightSearchBody,
  RatesSearchBody,
  PrebookResult,
  BookResult,
} from "./liteapi-types";

/* Humble Halal — LiteAPI v3.0 client.
   fetch-based (no SDK lock-in). Auth is the `X-API-Key` header (NOT Bearer).
   Returns null/empty + degrades gracefully when no key is set, mirroring
   lib/stripe.ts, so /api/travel/* can run in "simulated" mode in dev. */

const BASE = "https://api.liteapi.travel/v3.0";
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

/** Core request with one retry on 5xx. Throws LiteApiError on non-2xx. */
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const key = apiKey();
  if (!key) throw new LiteApiError(0, "liteapi_not_configured");
  const url = `${BASE}${path}`;
  let res = await once(url, init, key);
  if (res.status >= 500) res = await once(url, init, key); // retry once
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
  const r = await request<{ data?: LiteApiHotelContent }>(`/data/hotel${qs({ hotelId, timeout: 4 })}`);
  return r.data ?? null;
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
  const r = await request<{ data?: unknown[] }>(`/data/reviews${qs({ hotelId, limit, timeout: 4 })}`);
  return Array.isArray(r.data) ? r.data : [];
}

export async function getCountries(): Promise<{ code: string; name: string }[]> {
  const r = await request<{ data?: { code: string; name: string }[] }>(`/data/countries`);
  return Array.isArray(r.data) ? r.data : [];
}

/** Global destination autocomplete (cities, landmarks, areas). */
export async function searchPlaces(textQuery: string): Promise<LiteApiPlace[]> {
  if (!textQuery.trim()) return [];
  const r = await request<{ data?: LiteApiPlace[] }>(`/data/places${qs({ textQuery })}`);
  return Array.isArray(r.data) ? r.data : [];
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

export async function prebook(offerId: string, usePaymentSdk = true): Promise<PrebookResult> {
  const r = await request<{ data?: PrebookResult } & PrebookResult>(`/rates/prebook?timeout=30`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ offerId, usePaymentSdk }),
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

export { LiteApiError };
