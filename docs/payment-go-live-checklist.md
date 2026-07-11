# Payment go-live hardening checklist

From the monetization deep-audit (Phase B). All money features ship **dark** with
Stripe in **TEST** mode; these are the fixes to apply — and test against real
Stripe/LiteAPI events — **before flipping each paid flag live**. Two safe webhook
guards already landed (see "Already fixed"); the rest are staged here because they
either need a coordinated migration + code change or must be tested with real
async-payment events that can't be exercised while dark.

## Already fixed (merged)
- **paidTickets-02** — the ticket-order INSERT error is now checked; a DB failure
  throws so the idempotency claim releases and Stripe retries (no more "paid but
  no tickets, no retry"). `app/api/webhooks/stripe/route.ts`.
- **payNow-01 (safety half)** — ticket fulfillment now guards on
  `payment_status === "paid"`, so an async PayNow session can never issue tickets
  before the money settles. The *functional* half (below) is still owed.

## Before enabling PAID_TICKETS_ENABLED
- [ ] **paidTickets-01 — ticket-order idempotency index.** Ads (0044) and
  hotel/flight bookings (0040) have a unique `stripe_payment_intent` index so a
  retried webhook can't double-insert; ticket `orders` do not. Apply together
  (needs the webhook to treat the conflict as "already fulfilled", not an error):
  ```sql
  -- migration (assign next free number from docs/migration-ledger.md):
  create unique index if not exists orders_stripe_payment_intent_uniq
    on public.orders (stripe_payment_intent) where stripe_payment_intent is not null;
  ```
  Then change the order INSERT in `app/api/webhooks/stripe/route.ts` to upsert on
  `stripe_payment_intent` (or catch 23505 → look up the existing order id and
  continue) so a claim-release retry is idempotent rather than throwing forever.
  Verify: replay the same `checkout.session.completed` event twice (Stripe CLI) →
  exactly one order, one set of tickets.
- [ ] **paidTickets-03 — capacity TOCTOU.** Capacity is a read-then-check in
  `checkout/ticket` + `rsvp`; concurrent buyers at the last seats can oversell.
  Enforce atomically (a conditional `increment_event_taken` that fails when it
  would exceed capacity, or a capacity CHECK). Test with concurrent requests.

## Before enabling PAYNOW_ENABLED
- [ ] **payNow-01 (functional half).** Wire a
  `checkout.session.async_payment_succeeded` handler that runs the SAME ticket
  fulfillment as `checkout.session.completed` (refactor the ticket block into a
  shared function). Until then PayNow is safe but inert — a settled PayNow order
  issues no tickets. Also handle `async_payment_failed` (mark order failed).
  Activate PayNow in the Stripe dashboard first. Test with a real PayNow test
  payment end-to-end.
- [ ] **payNow-02 (copy).** Checkout copy promises "card or PayNow" whenever
  `flags.payNow` is on, but the route silently falls back to card-only if PayNow
  isn't active in Stripe. Make the copy conditional on actual availability.

## Before enabling PAID_ADS_ENABLED
- [ ] **ads-oversell-02.** Inventory cap is enforced only in the builder UI
  (disabled sold-out radios); neither `/api/owner/ads/checkout` nor
  `/api/ads/active` re-checks the cap server-side, so a crafted request can
  overbook a placement. Re-check `inventory_cap` vs live count in the checkout
  route before creating the campaign/Stripe session.
- [ ] **ads-track-fraud-04.** `/api/ads/track` accepts arbitrary anonymous
  impression/click POSTs for any campaign id → advertiser metrics can be inflated
  or drained. Add basic validation (campaign is live, rate-limit per IP, ignore
  obviously bot traffic) before ad billing/reporting is trusted.
- [ ] **ads-pricing-01 (decision).** "Featured Listing" is advertised "from
  $49/mo" but the anonymous promo checkout (`lib/ad-products.ts`) charges a
  different amount — reconcile the marketing price with the charged price.

## Before enabling PAID_PLANS_ENABLED
- [ ] **paidPlans-01 — founding-member cap not enforced.** `FOUNDING.cap = 200`
  is advertised but never checked server-side in `app/api/checkout/plan`, so the
  discounted founding rate can be sold indefinitely. Count active founding
  subscriptions and refuse the founding price once the cap is hit (mirror the
  leads founding-limit pattern in `checkout/leads`). CONFIRMED by the verifier.

## Before enabling PAID_HOTELS_ENABLED / PAID_FLIGHTS_ENABLED
- [ ] **paidHotels-01 / paidHotels-02.** Confirm the 0040 booking-idempotency
  unique indexes are applied in prod, and set `LITEAPI_ENV=prod` (currently a
  key-shaped value in `.env.local`, not `sandbox`|`prod`) with `LITEAPI_PROD_KEY`.
- [ ] **flightConfirmingTerminal-02 / flightRetryEmail-01.** A booking whose
  provider never confirms sits in `confirming` forever after 30 retries with no
  terminal state and no traveller email — add a terminal `failed` state + notify.
- [ ] **flightDupLeak-03.** The `/flights/book` 23505 path returns an existing
  booking's ref to a *different* caller — scope the lookup to the caller.

## Cross-cutting
- [ ] **Stripe TEST-mode assertion (ads-stripe-testmode-03).** Nothing warns if a
  paid flag is enabled while `STRIPE_SECRET_KEY` is `sk_test_`. Add a boot/health
  check that logs loudly when any paid flag resolves true with a test key.
