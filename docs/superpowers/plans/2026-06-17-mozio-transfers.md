# Mozio Airport Transfers (Standalone MVP) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an airport-transfers vertical to the travel section, integrated with the Mozio v2 API, as a standalone search→book flow that ships now (simulated, no key) and wires to a real Mozio account later.

**Architecture:** Mirror the existing LiteAPI flights vertical exactly. A server-only client (`lib/mozio.ts`) isolates every uncertain Mozio detail (host/auth-header/paths/fields) behind env config and degrades gracefully when unconfigured. Pure normalization + simulated-data lives in `lib/transfers.ts`. Four route handlers (`search`/`book`/`status`/`cancel`) mirror `app/api/travel/flights/*`. UI screens reuse `components/ota.tsx` primitives. A new `transfer_bookings` table mirrors `flight_bookings` with a `pending→confirming→confirmed` state machine.

**Tech Stack:** Next.js 16.2.9 (App Router), React 19, TypeScript, Supabase (service-role writes), Upstash rate-limit, Vitest (unit), Playwright (e2e).

## Global Constraints

- **Next.js 16.2.9 App Router.** Mirror existing files in `app/api/travel/*` and `components/screens/*` — they are authoritative for this version. Consult `node_modules/next/dist/docs/` before deviating from an existing pattern.
- **TypeScript strict.** `npm run typecheck` (`tsc --noEmit`) must exit 0.
- **Money routes re-check the server flag.** Every booking route calls `getServerFlags().paidTransfers` and returns 403 if off. Flags default OFF.
- **Mozio-collects only.** We never receive raw card data; the booking route returns Mozio's `paymentUrl` for redirect.
- **Graceful degradation.** Every Mozio path must work in simulated mode when `mozioConfigured()` is false, so the app runs with no key (mirrors `lib/liteapi.ts`).
- **`server-only` modules are NOT unit-tested.** Vitest runs in node env with no `server-only` shim; importing a `server-only` module throws. Unit tests cover only pure modules (`lib/transfers.ts`, `lib/flags.ts`). Routes + `lib/mozio.ts` are verified via `tsc` + Playwright E2E (`npm run test:e2e`, which starts the real server) + manual `curl`.
- **No halal claims for transfers in MVP** (golden rule: never assert certification we can't verify).
- **Reuse, don't reinvent:** `lib/ratelimit.ts` (`rateLimit`, `tooMany`), `lib/supabase/server.ts` (`getSupabaseAdmin`, `getSupabaseServer`), `lib/flags.ts`, `components/ota.tsx` primitives, `components/screens/flights/*` + `app/travel/flights/page.tsx` as the structural template.
- **Migration:** next free number is **0029** (0028 is the latest on disk). SQL must mirror `supabase/migrations/0007_flights.sql`. Supabase is applied later (supabase-last sequencing) — SQL must be valid but isn't run during this build.
- **Commits:** each task ends with a commit. Actual `git commit` execution is subject to the user's commit preference at execution time.

---

### Task 1: `paidTransfers` flag + env

**Files:**
- Modify: `lib/flags.ts`
- Modify: `.env.example`
- Test: `tests/unit/flags-transfers.test.ts`

**Interfaces:**
- Produces: `getServerFlags().paidTransfers: boolean`; `DEFAULT_FLAGS.paidTransfers: boolean`.

- [ ] **Step 1: Write the failing test**

`tests/unit/flags-transfers.test.ts`:
```ts
import { describe, it, expect, afterEach } from "vitest";
import { getServerFlags, DEFAULT_FLAGS } from "../../lib/flags";

describe("paidTransfers flag", () => {
  afterEach(() => { delete process.env.PAID_TRANSFERS_ENABLED; });

  it("defaults OFF", () => {
    expect(DEFAULT_FLAGS.paidTransfers).toBe(false);
    expect(getServerFlags().paidTransfers).toBe(false);
  });

  it("reads PAID_TRANSFERS_ENABLED=1 as ON", () => {
    process.env.PAID_TRANSFERS_ENABLED = "1";
    expect(getServerFlags().paidTransfers).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- flags-transfers`
Expected: FAIL — `paidTransfers` does not exist on the flags type/object.

- [ ] **Step 3: Implement**

In `lib/flags.ts`: add `paidTransfers: boolean;` to the `Flags` interface; add `paidTransfers: truthy(process.env.PAID_TRANSFERS_ENABLED),` to the object returned by `getServerFlags()`; add `paidTransfers: false` to `DEFAULT_FLAGS`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- flags-transfers`
Expected: PASS (2 tests).

- [ ] **Step 5: Update `.env.example`**

Append a Mozio block near the LiteAPI vars:
```
# Mozio airport transfers (Section B ancillary). Credentials issued at onboarding.
MOZIO_ENV=sandbox            # sandbox | prod
MOZIO_SAND_KEY=
MOZIO_PROD_KEY=
MOZIO_API_BASE=              # base URL issued by Mozio, e.g. https://api.mozio.com/v2
MOZIO_API_KEY_HEADER=API-Key # auth header name (confirm at onboarding)
PAID_TRANSFERS_ENABLED=      # 1 to enable transfer BOOKING (search/discovery is always on)
```

- [ ] **Step 6: Commit**

```bash
git add lib/flags.ts .env.example tests/unit/flags-transfers.test.ts
git commit -m "feat(transfers): add paidTransfers flag + Mozio env scaffold"
```

---

### Task 2: Transfer types + normalization + simulated quotes

**Files:**
- Create: `lib/mozio-types.ts`
- Create: `lib/transfers.ts`
- Test: `tests/unit/transfers.test.ts`

**Interfaces:**
- Produces:
  - `TransferSearchInput { pickup: string; dropoff: string; pickupDateTime: string; passengers: number; currency?: string; language?: string }`
  - `TransferQuote { resultId: string; searchId: string; vehicleClass: string; provider: string; providerLogo?: string; seats: number; price: number; currency: string; refundable: boolean; cancellationTerms?: string; etaMinutes?: number }`
  - `TransferReservationInput { searchId: string; resultId: string; contact: { firstName: string; lastName: string; email: string; phone: string }; passengers: number; currency: string }`
  - `MozioRawResult` (assumed Mozio fields we read)
  - `normalizeQuotes(searchId: string, raw: MozioRawResult[]): TransferQuote[]`
  - `simulatedQuotes(input: TransferSearchInput): TransferQuote[]`

- [ ] **Step 1: Write the failing test**

`tests/unit/transfers.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { normalizeQuotes, simulatedQuotes } from "../../lib/transfers";
import type { MozioRawResult, TransferSearchInput } from "../../lib/mozio-types";

const input: TransferSearchInput = {
  pickup: "Changi Airport (SIN)", dropoff: "Marina Bay Sands",
  pickupDateTime: "2026-09-01T10:00", passengers: 2, currency: "SGD",
};

describe("normalizeQuotes", () => {
  it("maps raw Mozio results to TransferQuote with safe defaults", () => {
    const raw: MozioRawResult[] = [{
      result_id: "r1", vehicle_type: "Private sedan", provider_name: "Acme Cars",
      max_passengers: 3, total_price: { value: 42.5, currency: "SGD" },
      cancellable: true, cancellation_policy: "Free until 24h", eta_minutes: 35,
    }];
    const [q] = normalizeQuotes("s1", raw);
    expect(q).toMatchObject({
      resultId: "r1", searchId: "s1", vehicleClass: "Private sedan",
      provider: "Acme Cars", seats: 3, price: 42.5, currency: "SGD",
      refundable: true, cancellationTerms: "Free until 24h", etaMinutes: 35,
    });
  });

  it("drops results with no result_id and no price", () => {
    const raw: MozioRawResult[] = [{ vehicle_type: "x" }, { result_id: "r2", total_price: { value: 10, currency: "SGD" } }];
    const out = normalizeQuotes("s1", raw);
    expect(out).toHaveLength(1);
    expect(out[0].resultId).toBe("r2");
  });
});

describe("simulatedQuotes", () => {
  it("returns multiple deterministic quotes for an input", () => {
    const a = simulatedQuotes(input);
    const b = simulatedQuotes(input);
    expect(a.length).toBeGreaterThanOrEqual(2);
    expect(a.map((q) => q.price)).toEqual(b.map((q) => q.price)); // deterministic
    expect(a.every((q) => q.currency === "SGD")).toBe(true);
    expect(a.every((q) => q.seats >= input.passengers)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- transfers`
Expected: FAIL — modules `lib/transfers`/`lib/mozio-types` not found.

- [ ] **Step 3: Implement `lib/mozio-types.ts`**

```ts
/* Humble Halal — Mozio transfer types. Pure types + the subset of raw Mozio v2
   fields we read (assumed contract; confirmed at onboarding). NO server-only
   here so lib/transfers.ts stays unit-testable. */

export interface TransferSearchInput {
  pickup: string;          // address or IATA code
  dropoff: string;         // address or IATA code
  pickupDateTime: string;  // ISO 8601, e.g. 2026-09-01T10:00
  passengers: number;
  currency?: string;       // ISO 4217, default USD
  language?: string;       // default en
}

export interface TransferQuote {
  resultId: string;
  searchId: string;
  vehicleClass: string;
  provider: string;
  providerLogo?: string;
  seats: number;
  price: number;           // total in `currency`
  currency: string;
  refundable: boolean;
  cancellationTerms?: string;
  etaMinutes?: number;
}

export interface TransferReservationInput {
  searchId: string;
  resultId: string;
  contact: { firstName: string; lastName: string; email: string; phone: string };
  passengers: number;
  currency: string;
}

// Subset of Mozio raw result fields we read (names assumed; confirm at onboarding).
export interface MozioRawResult {
  result_id?: string;
  vehicle_type?: string;
  provider_name?: string;
  provider_logo_url?: string;
  max_passengers?: number;
  total_price?: { value?: number; currency?: string };
  cancellable?: boolean;
  cancellation_policy?: string;
  eta_minutes?: number;
}
```

- [ ] **Step 4: Implement `lib/transfers.ts`**

```ts
import type { MozioRawResult, TransferQuote, TransferSearchInput } from "./mozio-types";

/* Pure normalization + simulated quotes for the transfers vertical. No I/O, no
   server-only — keep it unit-testable. Mirrors lib/flights.ts's role. */

export function normalizeQuotes(searchId: string, raw: MozioRawResult[]): TransferQuote[] {
  const out: TransferQuote[] = [];
  for (const r of raw) {
    const resultId = String(r.result_id || "");
    const price = r.total_price?.value;
    if (!resultId || price == null || !Number.isFinite(Number(price))) continue; // need an id + a price to book
    out.push({
      resultId,
      searchId,
      vehicleClass: String(r.vehicle_type || "Private transfer"),
      provider: String(r.provider_name || "Mozio partner"),
      providerLogo: r.provider_logo_url || undefined,
      seats: Math.max(1, Number(r.max_passengers) || 4),
      price: Number(price),
      currency: String(r.total_price?.currency || "USD"),
      refundable: !!r.cancellable,
      cancellationTerms: r.cancellation_policy || undefined,
      etaMinutes: Number.isFinite(Number(r.eta_minutes)) ? Number(r.eta_minutes) : undefined,
    });
  }
  return out;
}

// Stable, bounded hash so simulated prices are deterministic per route.
function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return (h >>> 0);
}

const TIERS = [
  { vehicleClass: "Private sedan", seats: 3, base: 28, provider: "Mozio partner" },
  { vehicleClass: "Private SUV", seats: 5, base: 44, provider: "Mozio partner" },
  { vehicleClass: "Private van", seats: 8, base: 62, provider: "Mozio partner" },
];

export function simulatedQuotes(input: TransferSearchInput): TransferQuote[] {
  const currency = (input.currency || "USD").toUpperCase().slice(0, 3);
  const seed = hash(`${input.pickup}|${input.dropoff}|${input.pickupDateTime}`);
  return TIERS
    .filter((t) => t.seats >= input.passengers)
    .map((t, i) => {
      const price = Math.round(t.base + ((seed >> (i * 4)) % 40));
      return {
        resultId: `sim-${i}-${seed.toString(36)}`,
        searchId: `sim-search-${seed.toString(36)}`,
        vehicleClass: t.vehicleClass,
        provider: t.provider,
        seats: t.seats,
        price,
        currency,
        refundable: true,
        cancellationTerms: "Free cancellation up to 24h before pickup (simulated)",
        etaMinutes: 30 + (i * 5),
      };
    });
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- transfers`
Expected: PASS (all `transfers` specs).

- [ ] **Step 6: Commit**

```bash
git add lib/mozio-types.ts lib/transfers.ts tests/unit/transfers.test.ts
git commit -m "feat(transfers): Mozio types + quote normalization + simulated quotes"
```

---

### Task 3: Mozio v2 client (server-only scaffold)

**Files:**
- Create: `lib/mozio.ts`

**Interfaces:**
- Consumes: `TransferSearchInput`, `TransferReservationInput`, `MozioRawResult` from `lib/mozio-types`.
- Produces:
  - `mozioConfigured(): boolean`
  - `createSearch(input: TransferSearchInput): Promise<{ searchId: string }>`
  - `pollSearch(searchId: string): Promise<MozioRawResult[]>` (bounded poll, deduped)
  - `createReservation(input: TransferReservationInput): Promise<{ reservationId: string | null; paymentUrl: string | null }>`
  - `pollReservation(searchId: string): Promise<{ status: string; reservationId: string | null; confirmationNumber: string | null }>`
  - `cancelReservation(reservationId: string): Promise<{ status: string }>`

- [ ] **Step 1: Implement `lib/mozio.ts`**

```ts
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

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const key = apiKey();
  if (!key || !base()) throw new MozioError(0, "mozio_not_configured");
  const headers = { [keyHeader()]: key, accept: "application/json", ...(init.headers || {}) };
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    let res = await fetch(`${base()}${path}`, { ...init, headers, signal: ctrl.signal });
    if (res.status >= 500) res = await fetch(`${base()}${path}`, { ...init, headers }); // retry once
    if (!res.ok) throw new MozioError(res.status, `mozio_${res.status}`);
    return (await res.json()) as T;
  } finally { clearTimeout(t); }
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
```

- [ ] **Step 2: Verify it typechecks**

Run: `npm run typecheck`
Expected: exit 0 (no errors).

- [ ] **Step 3: Commit**

```bash
git add lib/mozio.ts
git commit -m "feat(transfers): Mozio v2 client scaffold (env-config, graceful, server-only)"
```

---

### Task 4: `transfer_bookings` migration

**Files:**
- Create: `supabase/migrations/0029_transfers.sql`

- [ ] **Step 1: Write the migration**

```sql
-- Humble Halal — airport transfer bookings (Mozio v2). Mozio is merchant of
-- record (Mozio-collects: it generates the payment page); we record the outcome.
-- Reservation is async, so the status state machine mirrors flight_bookings:
-- pending  = reservation created, not yet paid
-- confirming = paid, awaiting Mozio confirmation
-- then confirmed / cancelled / refunded / failed.
-- Run after 0001–0028.

create table if not exists transfer_bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete set null,
  mozio_search_id text,
  mozio_reservation_id text,
  confirmation_number text,
  pickup text,
  dropoff text,
  pickup_datetime timestamptz,
  passengers int,
  vehicle_class text,
  contact_email text,
  currency text,
  total numeric,
  commission_amount numeric,
  status text not null default 'pending'
    check (status in ('pending','confirming','confirmed','cancelled','refunded','failed')),
  payment_status text,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists transfer_bookings_open_idx on transfer_bookings (status)
  where status in ('pending','confirming');

alter table transfer_bookings enable row level security;
drop policy if exists "transfer owner read" on transfer_bookings;
create policy "transfer owner read" on transfer_bookings for select using (
  user_id = auth.uid()
  or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));
-- Writes go through the service-role key from /api/travel/transfers/*.
```

- [ ] **Step 2: Verify structure mirrors flights**

Run: `diff <(grep -oE '(create table|create index|alter table|create policy)[^(]*' supabase/migrations/0007_flights.sql) <(grep -oE '(create table|create index|alter table|create policy)[^(]*' supabase/migrations/0029_transfers.sql) || true`
Expected: the four statement kinds (table/index/alter/policy) appear in both. (Supabase applies this later — supabase-last sequencing — so it is not run now.)

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0029_transfers.sql
git commit -m "feat(transfers): transfer_bookings table + RLS (migration 0029)"
```

---

### Task 5: Transfer search route

**Files:**
- Create: `app/api/travel/transfers/search/route.ts`

**Interfaces:**
- Consumes: `mozioConfigured`, `createSearch`, `pollSearch` (`lib/mozio`); `normalizeQuotes`, `simulatedQuotes` (`lib/transfers`); `rateLimit`, `tooMany` (`lib/ratelimit`).
- Produces: `POST` → `{ ok:true, simulated?:true, searchId?, quotes: TransferQuote[] }` or 422/502.

- [ ] **Step 1: Implement the route**

```ts
import { NextResponse } from "next/server";
import { mozioConfigured, createSearch, pollSearch } from "@/lib/mozio";
import { normalizeQuotes, simulatedQuotes } from "@/lib/transfers";
import { rateLimit, tooMany } from "@/lib/ratelimit";

/* Transfer search → Mozio v2 async search+poll, normalized to quote cards.
   Discovery only (no flag gate). Graceful: returns simulated quotes without a key. */
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

export async function POST(req: Request) {
  const rl = await rateLimit(req, "transfer-search", 40, 60); if (!rl.ok) return tooMany(rl.retryAfter);
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const pickup = String(body.pickup || "").trim();
  const dropoff = String(body.dropoff || "").trim();
  const pickupDateTime = String(body.pickupDateTime || "").trim();
  const passengers = Math.min(16, Math.max(1, Number(body.passengers) || 1));
  const currency = String(body.currency || "USD").toUpperCase().slice(0, 3);
  if (!pickup || !dropoff || !ISO.test(pickupDateTime)) {
    return NextResponse.json({ ok: false, error: "Pick a pickup, drop-off and date/time" }, { status: 422 });
  }
  if (pickup.toLowerCase() === dropoff.toLowerCase()) {
    return NextResponse.json({ ok: false, error: "Pickup and drop-off must differ" }, { status: 422 });
  }

  const input = { pickup, dropoff, pickupDateTime, passengers, currency };
  if (!mozioConfigured()) return NextResponse.json({ ok: true, simulated: true, quotes: simulatedQuotes(input) });

  try {
    const { searchId } = await createSearch(input);
    const raw = await pollSearch(searchId);
    return NextResponse.json({ ok: true, searchId, quotes: normalizeQuotes(searchId, raw).slice(0, 40) });
  } catch {
    return NextResponse.json({ ok: false, error: "Could not search transfers right now" }, { status: 502 });
  }
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: exit 0.

- [ ] **Step 3: Manual verify (simulated mode, no key)**

Run (in two steps): start the dev server `npm run dev` (background), then:
`curl -s -X POST localhost:3000/api/travel/transfers/search -H 'content-type: application/json' -d '{"pickup":"Changi (SIN)","dropoff":"Marina Bay Sands","pickupDateTime":"2026-09-01T10:00","passengers":2}'`
Expected: `{"ok":true,"simulated":true,"quotes":[...]}` with ≥2 quotes. Then `curl` with an empty body → HTTP 422.

- [ ] **Step 4: Commit**

```bash
git add app/api/travel/transfers/search/route.ts
git commit -m "feat(transfers): search route (async Mozio search+poll, simulated fallback)"
```

---

### Task 6: Book / status / cancel routes

**Files:**
- Create: `app/api/travel/transfers/book/route.ts`
- Create: `app/api/travel/transfers/status/route.ts`
- Create: `app/api/travel/transfers/cancel/route.ts`

**Interfaces:**
- Consumes: `getServerFlags` (`lib/flags`); `mozioConfigured`, `createReservation`, `pollReservation`, `cancelReservation` (`lib/mozio`); `getSupabaseAdmin`, `getSupabaseServer` (`lib/supabase/server`); `rateLimit`, `tooMany`.
- Produces: `book` `POST` → `{ ok:true, paymentUrl, id }` | 403 (flag off) | 422; `status` `GET ?searchId=` → `{ ok:true, status, confirmationNumber }`; `cancel` `POST` → `{ ok:true, status }`.

- [ ] **Step 1: Implement `book/route.ts`**

```ts
import { NextResponse } from "next/server";
import { getServerFlags } from "@/lib/flags";
import { mozioConfigured, createReservation } from "@/lib/mozio";
import { getSupabaseAdmin, getSupabaseServer } from "@/lib/supabase/server";
import { rateLimit, tooMany } from "@/lib/ratelimit";

/* Create a Mozio reservation (Mozio-collects). Returns a paymentUrl for redirect —
   we never touch the card. Records a 'pending' ledger row. Gated + graceful. */
export async function POST(req: Request) {
  const rl = await rateLimit(req, "transfer-book", 12, 60); if (!rl.ok) return tooMany(rl.retryAfter);
  if (!getServerFlags().paidTransfers) return NextResponse.json({ ok: false, reason: "transfer_booking_disabled" }, { status: 403 });
  if (!mozioConfigured()) return NextResponse.json({ ok: false, reason: "mozio_not_configured" });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const searchId = String(body.searchId || "").trim();
  const resultId = String(body.resultId || "").trim();
  const c = (body.contact || {}) as Record<string, unknown>;
  const contact = {
    firstName: String(c.firstName || "").trim(), lastName: String(c.lastName || "").trim(),
    email: String(c.email || "").trim(), phone: String(c.phone || "").trim(),
  };
  const passengers = Math.min(16, Math.max(1, Number(body.passengers) || 1));
  const currency = String(body.currency || "USD").toUpperCase().slice(0, 3);
  if (!searchId || !resultId || !contact.firstName || !contact.email) {
    return NextResponse.json({ ok: false, error: "Missing booking details" }, { status: 422 });
  }

  let userId: string | null = null;
  try { const server = await getSupabaseServer(); if (server) userId = (await server.auth.getUser()).data.user?.id ?? null; } catch { /* anonymous ok */ }

  const reservation = await createReservation({ searchId, resultId, contact, passengers, currency });

  const db = getSupabaseAdmin();
  let rowId: string | null = null;
  if (db) {
    try {
      const { data } = await db.from("transfer_bookings").insert({
        user_id: userId,
        mozio_search_id: searchId,
        mozio_reservation_id: reservation.reservationId,
        pickup: body.pickup ?? null,
        dropoff: body.dropoff ?? null,
        pickup_datetime: body.pickupDateTime ?? null,
        passengers,
        vehicle_class: body.vehicleClass ?? null,
        contact_email: contact.email,
        currency,
        total: body.total != null ? Number(body.total) : null,
        commission_amount: body.commissionAmount != null ? Number(body.commissionAmount) : null,
        status: "pending",
      }).select("id").single();
      rowId = data?.id ?? null;
    } catch { /* ledger best-effort */ }
  }

  return NextResponse.json({ ok: true, paymentUrl: reservation.paymentUrl, id: rowId });
}
```

- [ ] **Step 2: Implement `status/route.ts`**

```ts
import { NextResponse } from "next/server";
import { mozioConfigured, pollReservation } from "@/lib/mozio";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { rateLimit, tooMany } from "@/lib/ratelimit";

/* Confirmation page polls this after the Mozio payment redirect (?searchId=).
   Reconciles the ledger pending→confirming→confirmed. Graceful without a key. */
function mapStatus(s: string): "pending" | "confirming" | "confirmed" | "cancelled" | "failed" {
  const v = s.toLowerCase();
  if (["confirmed", "completed", "success"].includes(v)) return "confirmed";
  if (["cancelled", "canceled"].includes(v)) return "cancelled";
  if (["failed", "error"].includes(v)) return "failed";
  if (["pending", "created"].includes(v)) return "pending";
  return "confirming";
}

export async function GET(req: Request) {
  const rl = await rateLimit(req, "transfer-status", 60, 60); if (!rl.ok) return tooMany(rl.retryAfter);
  const searchId = (new URL(req.url).searchParams.get("searchId") || "").trim();
  if (!searchId) return NextResponse.json({ ok: false, error: "missing searchId" }, { status: 422 });
  if (!mozioConfigured()) return NextResponse.json({ ok: true, simulated: true, status: "confirmed", confirmationNumber: "SIMULATED" });

  try {
    const res = await pollReservation(searchId);
    const status = mapStatus(res.status);
    const db = getSupabaseAdmin();
    if (db) {
      try {
        await db.from("transfer_bookings").update({
          status,
          mozio_reservation_id: res.reservationId ?? undefined,
          confirmation_number: res.confirmationNumber ?? undefined,
          updated_at: new Date().toISOString(),
        }).eq("mozio_search_id", searchId);
      } catch { /* best-effort */ }
    }
    return NextResponse.json({ ok: true, status, confirmationNumber: res.confirmationNumber ?? null });
  } catch {
    return NextResponse.json({ ok: false, error: "status unavailable" }, { status: 502 });
  }
}
```

- [ ] **Step 3: Implement `cancel/route.ts`**

```ts
import { NextResponse } from "next/server";
import { mozioConfigured, cancelReservation } from "@/lib/mozio";
import { getSupabaseAdmin, getSupabaseServer } from "@/lib/supabase/server";
import { rateLimit, tooMany } from "@/lib/ratelimit";

/* Cancel a transfer reservation. Owner/admin only (RLS protects reads; this
   write uses the service role after an ownership check). Graceful without a key. */
export async function POST(req: Request) {
  const rl = await rateLimit(req, "transfer-cancel", 12, 60); if (!rl.ok) return tooMany(rl.retryAfter);
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const id = String(body.id || "").trim();              // transfer_bookings.id
  const reservationId = String(body.reservationId || "").trim();
  if (!id || !reservationId) return NextResponse.json({ ok: false, error: "Missing reference" }, { status: 422 });

  let userId: string | null = null;
  try { const server = await getSupabaseServer(); if (server) userId = (await server.auth.getUser()).data.user?.id ?? null; } catch { /* */ }
  if (!userId) return NextResponse.json({ ok: false, error: "Sign in to cancel" }, { status: 401 });

  const db = getSupabaseAdmin();
  if (db) {
    const { data: row } = await db.from("transfer_bookings").select("id,user_id").eq("id", id).single();
    if (!row || row.user_id !== userId) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }
  if (!mozioConfigured()) return NextResponse.json({ ok: true, status: "cancelled", simulated: true });

  try {
    const res = await cancelReservation(reservationId);
    if (db) { try { await db.from("transfer_bookings").update({ status: "cancelled", updated_at: new Date().toISOString() }).eq("id", id); } catch { /* */ } }
    return NextResponse.json({ ok: true, status: res.status });
  } catch {
    return NextResponse.json({ ok: false, error: "Could not cancel right now" }, { status: 502 });
  }
}
```

- [ ] **Step 4: Typecheck + manual verify the flag gate**

Run: `npm run typecheck` → exit 0. Then with the dev server running:
`curl -s -o /dev/null -w "%{http_code}" -X POST localhost:3000/api/travel/transfers/book -H 'content-type: application/json' -d '{"searchId":"x","resultId":"y","contact":{"firstName":"A","email":"a@b.co"},"passengers":2,"currency":"USD"}'`
Expected: `403` (because `PAID_TRANSFERS_ENABLED` is unset).

- [ ] **Step 5: Commit**

```bash
git add app/api/travel/transfers/book/route.ts app/api/travel/transfers/status/route.ts app/api/travel/transfers/cancel/route.ts
git commit -m "feat(transfers): book/status/cancel routes (flag-gated, Mozio-collects, ledger)"
```

---

### Task 7: UI — screens, pages, hub link, E2E

**Files:**
- Create: `components/screens/transfers/index.ts`
- Create: `components/screens/transfers/TransfersScreen.tsx`
- Create: `components/screens/transfers/BookingScreen.tsx`
- Create: `components/screens/transfers/ConfirmationScreen.tsx`
- Create: `app/travel/transfers/page.tsx`
- Create: `app/travel/transfers/booking/page.tsx`
- Create: `app/travel/transfers/confirmation/page.tsx`
- Modify: `app/travel/page.tsx` (add a Transfers entry)
- Modify: `e2e/travel.spec.ts` (append transfers specs)

**Interfaces:**
- Consumes: `getServerFlags` (`lib/flags`), `pageMeta`/`SITE` (`lib/seo`), `JsonLd`/`breadcrumbJsonLd`/`faqJsonLd` (`components/seo/json-ld`), OTA primitives (`components/ota.tsx`), `TransferQuote` (`lib/mozio-types`).
- Produces: `TransfersScreen({ bookingEnabled }: { bookingEnabled: boolean })` default export via the barrel.

- [ ] **Step 1: Write the failing E2E (append to `e2e/travel.spec.ts`)**

Follow the existing file's setup (it pre-sets consent/onboarding to avoid overlay intercepts — reuse that helper/pattern already in the file). Append:
```ts
test.describe("transfers", () => {
  test("landing: search form renders and returns simulated quotes", async ({ page }) => {
    await page.goto("/travel/transfers");
    await expect(page.getByTestId("transfer-search-form")).toBeVisible();
    await page.getByTestId("transfer-pickup").fill("Changi Airport (SIN)");
    await page.getByTestId("transfer-dropoff").fill("Marina Bay Sands");
    await page.getByTestId("transfer-datetime").fill("2026-09-01T10:00");
    await page.getByTestId("transfer-search-submit").click();
    await expect(page.getByTestId("transfer-quote").first()).toBeVisible();
    await expect(page.locator("body")).not.toContainText(/halal certified/i);
  });

  test("API: search returns simulated quotes without a key", async ({ request }) => {
    const r = await request.post("/api/travel/transfers/search", {
      data: { pickup: "SIN", dropoff: "Marina Bay Sands", pickupDateTime: "2026-09-01T10:00", passengers: 2 },
    });
    expect(r.ok()).toBeTruthy();
    const j = await r.json();
    expect(j.ok).toBe(true);
    expect(Array.isArray(j.quotes) && j.quotes.length > 0).toBe(true);
  });

  test("API: book is gated off by default (403)", async ({ request }) => {
    const r = await request.post("/api/travel/transfers/book", {
      data: { searchId: "x", resultId: "y", contact: { firstName: "A", lastName: "B", email: "a@b.co", phone: "+10000000000" }, passengers: 2, currency: "USD" },
    });
    expect(r.status()).toBe(403);
  });
});
```

- [ ] **Step 2: Run E2E to verify it fails**

Run: `npm run test:e2e -- travel.spec.ts -g transfers`
Expected: FAIL — `/travel/transfers` 404 / testids absent.

- [ ] **Step 3: Implement `TransfersScreen.tsx`** (client component; reuse `components/ota.tsx` primitives, mirror `components/screens/flights/` structure)

```tsx
"use client";
import { useState } from "react";
import type { TransferQuote } from "@/lib/mozio-types";

/* Standalone transfers search → quotes. Mirrors FlightsScreen. Booking CTA only
   navigates when bookingEnabled (server flag). No halal claims (MVP). */
export default function TransfersScreen({ bookingEnabled }: { bookingEnabled: boolean }) {
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [datetime, setDatetime] = useState("");
  const [passengers, setPassengers] = useState(2);
  const [quotes, setQuotes] = useState<TransferQuote[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null); setQuotes(null);
    try {
      const r = await fetch("/api/travel/transfers/search", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ pickup, dropoff, pickupDateTime: datetime, passengers }),
      });
      const d = await r.json();
      if (!d.ok) { setError(d.error || "Search failed"); return; }
      setQuotes(d.quotes || []);
    } catch { setError("Network error"); } finally { setLoading(false); }
  }

  return (
    <section className="ota-wrap">
      <h1>Airport transfers</h1>
      <form data-testid="transfer-search-form" onSubmit={search} className="ota-search">
        <input data-testid="transfer-pickup" aria-label="Pickup" placeholder="Pickup (airport or address)" value={pickup} onChange={(e) => setPickup(e.target.value)} required />
        <input data-testid="transfer-dropoff" aria-label="Drop-off" placeholder="Drop-off (hotel or address)" value={dropoff} onChange={(e) => setDropoff(e.target.value)} required />
        <input data-testid="transfer-datetime" aria-label="Pickup date and time" type="datetime-local" value={datetime} onChange={(e) => setDatetime(e.target.value)} required />
        <input aria-label="Passengers" type="number" min={1} max={16} value={passengers} onChange={(e) => setPassengers(Number(e.target.value) || 1)} />
        <button data-testid="transfer-search-submit" type="submit" disabled={loading}>{loading ? "Searching…" : "Search transfers"}</button>
      </form>

      {error && <p role="alert">{error}</p>}

      {quotes && (
        <ul className="ota-results">
          {quotes.map((q) => (
            <li key={q.resultId} data-testid="transfer-quote" className="ota-card">
              <div>
                <strong>{q.vehicleClass}</strong> · up to {q.seats} seats · {q.provider}
                {q.cancellationTerms && <div className="ota-muted">{q.cancellationTerms}</div>}
              </div>
              <div className="ota-price">{q.currency} {q.price}</div>
              <button
                disabled={!bookingEnabled}
                title={bookingEnabled ? "" : "Booking coming soon"}
                onClick={() => {
                  if (!bookingEnabled) return;
                  const p = new URLSearchParams({ searchId: q.searchId, resultId: q.resultId, vehicleClass: q.vehicleClass, total: String(q.price), currency: q.currency, pickup, dropoff, pickupDateTime: datetime, passengers: String(passengers) });
                  window.location.href = `/travel/transfers/booking?${p.toString()}`;
                }}
              >
                {bookingEnabled ? "Book" : "Coming soon"}
              </button>
            </li>
          ))}
          {quotes.length === 0 && <li className="ota-muted">No transfers found for this route.</li>}
        </ul>
      )}
    </section>
  );
}
```

- [ ] **Step 4: Implement the barrel + Booking/Confirmation screens**

`components/screens/transfers/index.ts`:
```ts
export { default as TransfersScreen } from "./TransfersScreen";
export { default as TransferBookingScreen } from "./BookingScreen";
export { default as TransferConfirmationScreen } from "./ConfirmationScreen";
```

`components/screens/transfers/BookingScreen.tsx` — `"use client"`. Reads quote params from `useSearchParams()`; renders a contact form (firstName, lastName, email, phone). On submit POSTs to `/api/travel/transfers/book` with `{ searchId, resultId, contact, passengers, currency, total, pickup, dropoff, pickupDateTime, vehicleClass }`; on `{ ok:true, paymentUrl }` does `window.location.href = paymentUrl` (Mozio-collects redirect); if `paymentUrl` is null shows "Booking is not available yet." Mirror the contact-form structure in `components/screens/flights/` booking.

`components/screens/transfers/ConfirmationScreen.tsx` — `"use client"`. Reads `searchId` from `useSearchParams()`; polls `GET /api/travel/transfers/status?searchId=...` every 3s (max ~10 tries); shows "Confirming…", then the `confirmationNumber` on `confirmed`, or a support message on `failed`. Mirror `components/screens/flights/` confirmation.

- [ ] **Step 5: Implement the pages**

`app/travel/transfers/page.tsx` (mirror `app/travel/flights/page.tsx`):
```tsx
import { TransfersScreen } from "@/components/screens/transfers";
import { getServerFlags } from "@/lib/flags";
import { pageMeta, SITE } from "@/lib/seo";
import { JsonLd, breadcrumbJsonLd, faqJsonLd } from "@/components/seo/json-ld";

export const metadata = pageMeta({
  title: "Airport Transfers — Halal Travel",
  description: "Book private airport transfers worldwide for Umrah, Hajj and Muslim travel — door to door, fixed price, free cancellation on most rides.",
  path: "/travel/transfers",
});

const service = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Airport Transfer Booking",
  serviceType: "Ground transportation for Muslim travellers",
  provider: { "@type": "Organization", name: "Humble Halal", url: SITE.url },
  areaServed: "Worldwide",
  url: `${SITE.url}/travel/transfers`,
  description: "Private airport transfers worldwide, paired with Muslim-friendly hotels and flights for Umrah, Hajj and family travel.",
};

const faqs = [
  { q: "Are airport transfers available for Umrah?", a: "Yes. You can book private door-to-door airport transfers in Jeddah, Makkah, Madinah and worldwide, and pair them with a Muslim-friendly hotel." },
  { q: "Can I cancel a transfer?", a: "Most transfers offer free cancellation up to 24 hours before pickup. The exact policy is shown on each quote before you book." },
  { q: "How is payment handled?", a: "Payment is processed securely by our transfer partner Mozio at checkout; your card details are never stored by Humble Halal." },
];

export default function Page() {
  return (
    <>
      <JsonLd data={[service, faqJsonLd(faqs), breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Travel", path: "/travel" }, { name: "Transfers", path: "/travel/transfers" }])]} />
      <TransfersScreen bookingEnabled={getServerFlags().paidTransfers} />
    </>
  );
}
```

`app/travel/transfers/booking/page.tsx` and `app/travel/transfers/confirmation/page.tsx`: thin wrappers mounting `TransferBookingScreen` / `TransferConfirmationScreen` inside a `<Suspense>` (required because they use `useSearchParams()`), each with its own `pageMeta(...)` + breadcrumb `JsonLd`. Mirror `app/travel/flights/booking/page.tsx` and `.../confirmation/page.tsx`.

- [ ] **Step 6: Add the hub entry in `app/travel/page.tsx`**

Add a "Transfers" card/link to the travel hub pointing to `/travel/transfers`, matching how the existing Hotels/Flights entries are rendered in that file (same component/markup, new label + href + a short "Airport transfers, door to door" blurb).

- [ ] **Step 7: Run E2E to verify it passes**

Run: `npm run test:e2e -- travel.spec.ts -g transfers`
Expected: PASS (3 transfers specs).

- [ ] **Step 8: Commit**

```bash
git add components/screens/transfers app/travel/transfers app/travel/page.tsx e2e/travel.spec.ts
git commit -m "feat(transfers): standalone search/book/confirmation UI + hub entry + e2e"
```

---

### Task 8: Full verification gate

**Files:** none (verification only).

- [ ] **Step 1: Typecheck**

Run: `npm run typecheck`
Expected: exit 0.

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: 0 errors (pre-existing warnings in unrelated files are acceptable; none in new files).

- [ ] **Step 3: Unit tests**

Run: `npm test`
Expected: all pass, including the new `flags-transfers` and `transfers` specs.

- [ ] **Step 4: E2E**

Run: `npm run test:e2e -- travel.spec.ts`
Expected: all travel specs pass, including the 3 new transfers specs.

- [ ] **Step 5: Commit (if any lint/format fixes were needed)**

```bash
git add -A
git commit -m "chore(transfers): verification gate — typecheck, lint, unit, e2e green"
```

---

## Self-Review

**Spec coverage** (each spec section → task):
- Integration mode = API client → Tasks 3, 5, 6. ✅
- Standalone surface (`/travel/transfers` + hub) → Task 7. ✅
- Mozio-collects payment (paymentUrl redirect, never touch card) → Task 6 (`book`) + Task 7 (BookingScreen). ✅
- Scaffold-first / simulate-without-keys → `mozioConfigured()` (Task 3) used in every route (Tasks 5,6); simulated quotes (Task 2). ✅
- `lib/mozio.ts`, `lib/mozio-types.ts`, `lib/transfers.ts`, `lib/flags.ts` → Tasks 1,2,3. ✅
- Routes search/book/status/cancel → Tasks 5,6. ✅
- `transfer_bookings` migration (0029) → Task 4. ✅
- UX screens + hub + autocomplete reuse → Task 7 (autocomplete reuse noted; MVP uses plain inputs to keep scope tight — acceptable, address autocomplete deferred with the Mozio address-shape confirmation). ✅
- Markup pass-through / no halal claims → Tasks 6,7 (no markup param; no halal copy; E2E asserts no "halal certified"). ✅
- Env vars → Task 1. ✅
- Testing (unit + e2e) → Tasks 1,2,7,8. ✅
- Deferrals (cross-sell, bundles, retry cron, partner-collects) → not built. ✅

**Placeholder scan:** No TBD/TODO; every code step has complete code. Booking/Confirmation screens are specified by contract (props, fetch shape, redirect/poll behavior, Suspense requirement) plus the FlightsScreen template — concrete enough to implement without invention. ✅

**Type consistency:** `TransferQuote`/`TransferSearchInput`/`TransferReservationInput`/`MozioRawResult` defined in Task 2 and consumed unchanged in Tasks 3/5/6/7. Client method names (`mozioConfigured`, `createSearch`, `pollSearch`, `createReservation`, `pollReservation`, `cancelReservation`) defined in Task 3 and used identically in Tasks 5/6. Route response shapes (`{ ok, simulated?, searchId?, quotes }`, `{ ok, paymentUrl, id }`, `{ ok, status, confirmationNumber }`) consistent across routes and screens. ✅
