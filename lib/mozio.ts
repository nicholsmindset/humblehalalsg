import "server-only";
import type { TransferSearchInput, TransferReservationInput, MozioRawResult } from "./mozio-types";

/* Humble Halal — Mozio v2 ground-transport client.
   fetch-based. EVERY uncertain Mozio detail (host, auth header name, exact paths,
   field names) is isolated HERE and confirmed at onboarding — see
   docs/superpowers/specs/2026-06-17-mozio-transfers-design.md "Open items".
   Degrades gracefully: mozioConfigured()===false → routes return simulated data,
   so the UI works with no key (mirrors lib/liteapi.ts). Mozio is merchant of
   record (Mozio-collects) — we never handle raw card data. */

const TIMEOUT_MS = 10_000;
const POLL_INTERVAL_MS = 1_500;
const POLL_MAX_MS = 45_000;

function apiKey(): string | null {
  const prod = process.env.MOZIO_ENV === "prod";
  const k = prod ? process.env.MOZIO_PROD_KEY : process.env.MOZIO_SAND_KEY;
  return k || process.env.MOZIO_SAND_KEY || process.env.MOZIO_PROD_KEY || null;
}
function base(): string { return process.env.MOZIO_API_BASE || ""; }
function keyHeader(): string { return process.env.MOZIO_API_KEY_HEADER || "API-Key"; }

/** Configured only when BOTH a key and a base URL are set — until onboarding
 *  gives us the real host, routes stay in simulated mode. */
export function mozioConfigured(): boolean { return !!apiKey() && !!base(); }

class MozioError extends Error { constructor(public status: number, message: string) { super(message); } }

/** One attempt with its own AbortController timeout (mirrors lib/liteapi.ts:once). */
async function once(url: string, init: RequestInit, headers: HeadersInit): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, headers, signal: ctrl.signal });
  } finally { clearTimeout(t); }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const key = apiKey();
  if (!key || !base()) throw new MozioError(0, "mozio_not_configured");
  const headers = { [keyHeader()]: key, accept: "application/json", ...(init.headers || {}) };
  const url = `${base()}${path}`;
  let res = await once(url, init, headers);
  if (res.status >= 500) res = await once(url, init, headers); // retry once (fresh timeout)
  if (!res.ok) throw new MozioError(res.status, `mozio_${res.status}`);
  return (await res.json()) as T;
}

// NOTE: the paths and field names below are the ASSUMED v2 contract. Confirm
// each against the private Mozio v2 reference at onboarding; only this file changes.

export async function createSearch(input: TransferSearchInput): Promise<{ searchId: string }> {
  const r = await request<{ search_id?: string }>(`/searches`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      start_address: input.pickup, end_address: input.dropoff,
      pickup_datetime: input.pickupDateTime, num_passengers: input.passengers,
      currency: input.currency || "USD", language: input.language || "en",
    }),
  });
  if (!r.search_id) throw new MozioError(502, "mozio_no_search_id");
  return { searchId: r.search_id };
}

export async function pollSearch(searchId: string): Promise<MozioRawResult[]> {
  const deadline = Date.now() + POLL_MAX_MS;
  const acc: MozioRawResult[] = [];
  for (;;) {
    const r = await request<{ more_coming?: boolean; results?: MozioRawResult[] }>(
      `/searches/${encodeURIComponent(searchId)}/poll`,
    );
    if (Array.isArray(r.results)) acc.push(...r.results);
    if (!r.more_coming || Date.now() > deadline) break;
    await new Promise((res) => setTimeout(res, POLL_INTERVAL_MS));
  }
  const seen = new Set<string>();
  const out: MozioRawResult[] = [];
  for (const x of acc) { const id = String(x.result_id || ""); if (id && !seen.has(id)) { seen.add(id); out.push(x); } }
  return out;
}

export async function createReservation(input: TransferReservationInput): Promise<{ reservationId: string | null; paymentUrl: string | null }> {
  const r = await request<{ reservation_id?: string; payment_url?: string }>(`/reservations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      search_id: input.searchId, result_id: input.resultId,
      passenger: { first_name: input.contact.firstName, last_name: input.contact.lastName, email: input.contact.email, phone_number: input.contact.phone },
      currency: input.currency,
    }),
  });
  return { reservationId: r.reservation_id ?? null, paymentUrl: r.payment_url ?? null };
}

export async function pollReservation(searchId: string): Promise<{ status: string; reservationId: string | null; confirmationNumber: string | null }> {
  const r = await request<{ status?: string; reservation_id?: string; confirmation_number?: string }>(
    `/reservations?search_id=${encodeURIComponent(searchId)}`,
  );
  return { status: String(r.status || "pending"), reservationId: r.reservation_id ?? null, confirmationNumber: r.confirmation_number ?? null };
}

export async function cancelReservation(reservationId: string): Promise<{ status: string }> {
  const r = await request<{ status?: string }>(`/reservations/${encodeURIComponent(reservationId)}`, { method: "DELETE" });
  return { status: String(r.status || "cancelled") };
}

export { MozioError };
