# Mozio Airport Transfers — Standalone MVP (API integration)

- **Date:** 2026-06-17
- **Status:** Approved design → spec under review
- **Branch context:** travel vertical on `feat/travel-ota-upgrade`
- **Origin:** First net-new build from the 2026-06-17 LiteAPI OTA deep-dive review (Section B, ancillaries). Transfers are "pure commission, low operational risk" with a strong Umrah hook.

## Context & goal
Humble Halal's travel vertical has hotels + flights fully built on LiteAPI but **zero ancillaries**. This spec adds the first ancillary: **airport transfers via the Mozio v2 API**, as a standalone search→book vertical that mirrors the existing flights implementation. It must be buildable now and wire to a real Mozio account later (Mozio credentials are issued at onboarding), so it ships **scaffold-first with graceful simulate-without-keys**, gated OFF by default.

## Locked decisions
1. **Integration mode: API client** (not widget, not affiliate). Our routes, our UX, our branding.
2. **Surface: standalone flow** — `/travel/transfers` search→quote→book + a hub entry. Cross-sell and bundling deferred.
3. **Payment: Mozio-collects** — Mozio generates the payment page; we redirect and poll. We never touch the card, consistent with LiteAPI being merchant-of-record for travel (see memory `travel-vertical-posture`).
4. **Scaffold-first** — `mozioConfigured()===false` returns simulated results so the UI renders with no key, exactly like `lib/liteapi.ts`. Booking gated by `PAID_TRANSFERS_ENABLED` (default OFF, re-checked server-side).

## Non-goals (YAGNI — deferred to later slices)
- Confirmation-page cross-sell module ("Add a transfer?") prefilled from a hotel/flight booking.
- Umrah/Ramadan hotel+transfer bundles.
- Halal overlay for transfers (e.g. female-driver-on-request) — only add once Mozio confirms the field; MVP makes **no halal claims** (golden rule).
- Loyalty, vouchers, retry cron, partner-collects payment model.

## Architecture & module layout
Mirror the LiteAPI travel stack so the patterns are familiar and reviewable.

- **`lib/mozio.ts`** (server-only) — v2 client, `fetch`-based, one-retry-on-5xx + `AbortController` timeout, mirroring `lib/liteapi.ts`. **This file isolates every uncertain Mozio detail** (host, auth header name, exact paths, field names) behind env config + a clearly-commented mapping layer, because those are not public and are confirmed only at onboarding. Exports:
  - `mozioConfigured(): boolean`
  - `createSearch(input): { searchId, moreComing, results }`
  - `pollSearch(searchId): { status, moreComing, results }`
  - `createReservation(input): { reservationId, status, paymentUrl? }`
  - `pollReservation(idOrSearchId): { status, confirmationNumber?, ... }`
  - `cancelReservation(reservationId): { status, refundAmount?, currency? }`
- **`lib/mozio-types.ts`** — request/response + normalized types (`TransferQuote`, `TransferSearchInput`, `TransferReservationInput`).
- **`lib/transfers.ts`** — `normalizeQuotes(raw)` → clean `TransferQuote[]` (vehicle class, capacity, price breakdown, provider name/logo, cancellation terms) mirroring `lib/flights.ts:normalizeItineraries`; plus `simulatedQuotes(input)` for no-key mode.
- **`lib/flags.ts`** — add `paidTransfers` to the `Flags` interface, `getServerFlags()` (`PAID_TRANSFERS_ENABLED`), and `DEFAULT_FLAGS`.

## Mozio v2 contract (assumed; confirm at onboarding)
The flow is documented; exact strings are not public. Assumptions, all encapsulated in `lib/mozio.ts`:
- **Base URL:** `MOZIO_API_BASE` env (sandbox vs prod URL issued by Mozio). **Auth header:** name from `MOZIO_API_KEY_HEADER` (default `API-Key`), value from `MOZIO_SAND_KEY`/`MOZIO_PROD_KEY` selected by `MOZIO_ENV`.
- **Search:** `POST` create → `{ search_id, more_coming, results[] }`; `GET` poll by `search_id` until `more_coming=false`/`status` terminal. Each result has a `result_id`, vehicle, price.
- **Reservation:** `POST` create with `search_id` + `result_id` + passenger {first_name,last_name,email,phone} → Mozio-collects returns a `payment_url`; status is async. After payment redirect (carries `search_id`), poll reservation by `search_id`/reservation id → `confirmation_number` when `confirmed`.
- **Cancel:** by reservation id → `status: cancelled` (+ refund fields).
- **Currency/language:** `currency` (ISO 4217) + `language` on search.

## Routes — `app/api/travel/transfers/*` (mirror `flights/*`)
- **`search/route.ts` (POST)** — validate pickup/dropoff (address or IATA) + date+time + pax; `rateLimit(req,"transfer-search",40,60)` + `tooMany`; if `!mozioConfigured()` return `{ ok:true, simulated:true, quotes: simulatedQuotes(input) }`; else `createSearch` → bounded server-side poll (~1–3s interval, ~45s cap) → `normalizeQuotes`. Discovery only (no flag gate).
- **`book/route.ts` (POST)** — **re-check `getServerFlags().paidTransfers`; 403 if off.** `createReservation` → insert `transfer_bookings` row `status='pending'` (service-role) → return `{ ok:true, paymentUrl }` for redirect.
- **`status/route.ts` (GET)** — confirmation page polls after redirect with `searchId`; `pollReservation` → reconcile ledger `pending→confirming→confirmed` (or `failed`); return status + confirmation number when ready. No retry cron for MVP (user is present and polling).
- **`cancel/route.ts` (POST)** — owner/admin-gated; `cancelReservation` → update ledger.

## Data flow
1. User searches → `search` route polls Mozio until quotes settle → cards render. (`simulated:true` in no-key/dev.)
2. User picks a quote → contact form → `book` route creates reservation → returns `paymentUrl`.
3. Client redirects to Mozio's payment page → user pays → Mozio redirects back to `/travel/transfers/confirmation?searchId=...`.
4. Confirmation page polls `status` → ledger reconciled → confirmation number + voucher shown.

## Data model — `supabase/migrations/0027_transfers.sql`
`transfer_bookings` mirroring `flight_bookings` (0007): `id`, `user_id` (→ profiles, set null), `mozio_search_id`, `mozio_reservation_id`, `confirmation_number`, `pickup`, `dropoff`, `pickup_datetime`, `passengers int` (pax count; lead contact is `contact_email`), `vehicle_class`, `contact_email`, `currency`, `total numeric`, `commission_amount numeric`, `status text check (status in ('pending','confirming','confirmed','cancelled','refunded','failed')) default 'pending'`, `payment_status`, `created_at`, `updated_at`. Partial index on `status='confirming'`. **RLS:** owner-read + admin-read; writes via service-role only (same as `flight_bookings`). Single table, `commission_amount` inline — no separate commissions table (matches flights; YAGNI).

## UX surface (reuse `components/ota.tsx`)
- **`app/travel/transfers/page.tsx`** (search + results), **`booking/`** (contact form + redirect), **`confirmation/`** (status poll + voucher).
- **`components/screens/transfers/`** folder with a barrel `index.ts`, reusing OTA primitives (DateField, pax/OccupancyField, Popover, Carousel, Skeletons, RatingBadge, Skeletons). `TransferQuote` cards styled to the emerald OTA standard.
- **Hub entry:** add a "Transfers" tab/link on `app/travel/page.tsx`.
- **Address autocomplete:** reuse `/api/travel/places` where it fits (landmark/hotel side); airport side accepts IATA. Exact Mozio address/coords handling confirmed at onboarding (behind `lib/mozio.ts`).

## Payment, markup, halal posture
- **Payment:** Mozio-collects only. No Stripe keys of ours involved; we record the outcome.
- **Markup:** Mozio returns agreed/net rates; markup is commercial config, **not** an API param. MVP displays Mozio's price as-is and records `commission_amount` from the response (else 0). LiteAPI's SSP/login-wall rule does not apply.
- **Halal:** no halal claims in MVP. The "golden rule" (never assert certification we can't verify) holds.

## Error handling & invariants
- **Graceful simulated mode** when unconfigured (search returns `simulated:true` + sample quotes; book/status no-op safely).
- **Bounded async poll** (interval + max-duration cap); partial results acceptable with a "still loading" affordance.
- **Server flag re-check** in `book` (a client toggle can never enable charges — same posture as `lib/flags.ts`).
- **We never touch the card** (Mozio-collects).
- All Mozio uncertainty quarantined in `lib/mozio.ts` so routes/UI are stable when the real contract is confirmed.

## Environment variables (add to `.env.example`)
`MOZIO_ENV` (sandbox|prod), `MOZIO_SAND_KEY`, `MOZIO_PROD_KEY`, `MOZIO_API_BASE` (or per-env base), `MOZIO_API_KEY_HEADER` (default `API-Key`), `PAID_TRANSFERS_ENABLED` (default OFF).

## Testing
- **Unit (Vitest):** `lib/transfers` — `normalizeQuotes` shape + `simulatedQuotes` generator.
- **E2E (extend `e2e/travel.spec.ts`):** transfers landing renders (search form + simulated result cards) asserting **structure, not live data** (holds in no-key/no-AI env); assert no unverifiable halal claims appear.
- Gate: `tsc --noEmit` clean, `npm run lint` 0 errors, `npm test` green before done.

## Implementation notes
- **Next.js 16 conventions:** this repo warns "This is NOT the Next.js you know" — before writing route handlers / pages, check `node_modules/next/dist/docs/` for the current App Router conventions (route handler signatures, params, metadata).
- **Reuse, don't reinvent:** `lib/ratelimit.ts` (`rateLimit`/`tooMany`), `lib/cache.ts` (`withCache` — only for any cacheable static Mozio lookups, never quotes/reservations), `components/ota.tsx` primitives, the `flights/*` routes + `flight_bookings` migration as the structural template, `lib/flags.ts` gating pattern.

## Open items to confirm at Mozio onboarding (tracked, not blocking the scaffold)
- Exact base URLs (sandbox/prod), auth header name, and endpoint paths/field names.
- Address vs lat/lng vs IATA handling for pickup/dropoff.
- Commission/markup commercial terms (net-rate vs commission).
- Whether reservation poll keys on `search_id` or reservation id in our account's flow.
