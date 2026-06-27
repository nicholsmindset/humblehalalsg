# Travel payments — go-live runbook (hotels + flights)

How to take real card payments for hotels + flights. LiteAPI is the **merchant of
record** (its Payment SDK + Stripe) — there is no Stripe Connect for travel. The
card-capture code is wired (the LiteAPI Payment SDK renders a hosted card form, charges
the card, redirects back, then we finalise the booking). This runbook is the config to
flip it from sandbox → live.

## How a payment flows (so the config makes sense)

1. `prebook` (server) opens a payment intent → returns `prebookId`, `transactionId`, `secretKey`.
2. Client loads `payment-wrapper.liteapi.travel` SDK, mounts the card form with
   `publicKey: 'sandbox'|'live'` (from `LITEAPI_ENV`) + the prebook `secretKey`.
3. SDK charges the card → redirects to `…/booking?tid=…&pid=…&paid=1`.
4. On return, the screen calls `/api/travel/book` (or `/flights/book`) with the
   `transactionId` (`method: TRANSACTION_ID`) → booking confirmed → row in `hotel_bookings` / `flight_bookings`.

## Step 1 — LiteAPI account (one-time)

- Complete LiteAPI's **payment onboarding** so live card payments are enabled on the
  account (they are merchant of record). Obtain the **production API key**.
- In the LiteAPI dashboard, register the **webhook**: `https://www.humblehalal.com/api/travel/webhook`
  (booking status → confirmed/cancelled/refunded/ticketed). Note the shared secret.

## Step 2 — Environment (Vercel, Production scope)

| Var | Value | Why |
|---|---|---|
| `LITEAPI_ENV` | `prod` | selects the live key + sets the SDK to `'live'` |
| `LITEAPI_PROD_KEY` | `<live key>` | live API key |
| `LITEAPI_WEBHOOK_SECRET` | `<shared secret>` | webhook **fails closed** in prod without it |
| `PAID_HOTELS_ENABLED` | `1` | enables hotel prebook/book routes |
| `PAID_FLIGHTS_ENABLED` | `1` | enables flight verify/prebook/book routes |
| `CRON_SECRET` | `<random>` | guards `/api/cron/flight-retry` |
| `SUPABASE_SERVICE_ROLE_KEY` | (already set) | writes the booking ledger |

Set with the dashboard or `vercel env add <NAME> production`, then **redeploy** (env
changes don't apply to existing deployments). `NEXT_PUBLIC_LITEAPI_PUBLIC_KEY` is **not
needed** — the SDK only needs the `'sandbox'`/`'live'` mode string, derived server-side.

## Step 3 — Database

Ensure these migrations are applied in prod: `0006_travel.sql` (hotel_bookings +
hotel_commissions), `0007_flights.sql` (flight_bookings), `0027_hotel_booking_voucher.sql`.

## Step 4 — Flights: Vercel Pro

The `flight-retry` cron resolves payment-captured-but-`confirming` flights. On **Hobby it
runs daily**; on **Pro** it can run sub-daily (~10 min) so a stuck ticket clears in
minutes. Recommended before enabling flights at volume. (Hotels have no equivalent cron —
a rare post-payment `/book` failure shows the guest "payment received, we're confirming"
and is reconciled manually via the webhook + LiteAPI dashboard.)

## Step 5 — Verify in sandbox FIRST

With `LITEAPI_ENV=sandbox` + a real `LITEAPI_SAND_KEY` + both flags on:
1. **Hotel**: `/travel` → search → pick a rate → guest details → **Continue to secure
   payment** → the LiteAPI card form renders → pay with **`4242 4242 4242 4242`**, any
   future expiry, any CVV → redirects back → confirmation page → row in `hotel_bookings`.
2. **Flight**: passenger → seats → Review & Pay → card form → test card → redirect →
   confirmation (or "confirming", then the retry cron resolves) → row in `flight_bookings`.
3. **Voucher**: apply a promo on the details step → re-prebook → the card form mounts with
   the discounted amount.
4. **Admin → Travel revenue** shows the booking; LiteAPI weekly sales reconciles.

## Step 6 — Flip to live

Set `LITEAPI_ENV=prod` + `LITEAPI_PROD_KEY`, redeploy, do **one small real booking** with
a personal card, confirm it in Admin → Travel revenue and the LiteAPI dashboard, then
**cancel/refund** it. Watch the first day's bookings.

## Rollback

Set `PAID_HOTELS_ENABLED` / `PAID_FLIGHTS_ENABLED` to empty (or `0`) and redeploy — both
flows instantly revert to the **"Enquire"** inquiry path. No code change needed.
