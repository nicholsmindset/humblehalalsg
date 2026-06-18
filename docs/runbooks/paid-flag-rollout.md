# Runbook — Staged paid-flag rollout

How to take Humble Halal's revenue streams live, in order, safely.

## Why staged

Every monetization flag (`lib/flags.ts`) defaults **OFF** so the site launches free.
Turning them all on at once means debugging subscriptions, payouts, and travel
reconciliation simultaneously. The order below is **easiest → hardest operational
risk**, and each stage builds the trust/audience the next one needs.

**Real enablement is via Vercel env vars** (`PAID_*_ENABLED`). The toggles on the
admin **Monetization** tab are client-side demo only and never enable charges —
money routes always re-check `getServerFlags()` server-side. Watch live state on
the admin **Rollout plan** tab.

| Stage | Stream | Env var | Take rate / price (in code) |
|---|---|---|---|
| 1 | Directory plans | `PAID_PLANS_ENABLED` | $19 / $49 / $99 per mo (`lib/plans.ts`) |
| 2 | Sponsored ads | `PAID_ADS_ENABLED` | Direct-sold placements (`advertise.tsx`) |
| 3 | Event tickets | `PAID_TICKETS_ENABLED` | 5% + $0.50/ticket (`lib/fees.ts`) |
| 4 | Travel hotels → flights | `PAID_HOTELS_ENABLED` → `PAID_FLIGHTS_ENABLED` | LiteAPI commission |

---

## Stage 1 — Directory plans

**Why first:** pure Stripe subscriptions, no payouts to third parties, lowest risk;
it's the trust layer (Verified badge + Cert Vault).

**Prerequisites**
- [ ] Stripe live keys set (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`)
- [ ] `STRIPE_PRICE_VERIFIED_M/Y`, `STRIPE_PRICE_FEATURED_M/Y`, `STRIPE_PRICE_PREMIUM_M/Y` set
- [ ] DB migrations applied (`subscriptions`, `businesses.plan`)
- [ ] Stripe webhook endpoint receiving `customer.subscription.*`

**Go live:** set `PAID_PLANS_ENABLED=1` in Vercel → redeploy.

**Verify:** purchase a Verified plan in test → `subscriptions` row appears,
`businesses.plan` updates, admin **Revenue (P&L)** shows the MRR.

**Rollback:** unset `PAID_PLANS_ENABLED` → redeploy. Existing subs unaffected
(managed in Stripe); pricing UI reverts to enquiry CTAs.

## Stage 2 — Sponsored ads

**Why second:** direct-sold, you keep 100%, no payout logic — but only worth
selling once there's traffic, so it follows Directory.

**Prerequisites**
- [ ] Meaningful audience / traffic to sell against
- [ ] `ad_placements` seeded (rate card)
- [ ] Stripe keys (shared with Stage 1)

**Go live:** set `PAID_ADS_ENABLED=1` → redeploy.

**Verify:** book a campaign in admin **Featured & ads** → impressions/clicks track;
a promo purchase writes an `ad_orders` row → shows in **Revenue (P&L)**.

**Rollback:** unset `PAID_ADS_ENABLED`. Ad CTAs revert to enquiry invites.

## Stage 3 — Event tickets

**Why third:** now holding buyers' money and paying organisers out via Stripe
Connect 24h post-event — more moving parts than Stages 1–2.

**Prerequisites**
- [ ] Stripe Connect enabled on the platform account
- [ ] Organiser onboarding flow working (`stripe_accounts.payouts_enabled`)
- [ ] `event-payouts` cron deployed and scheduled
- [ ] Refund path tested (`charge.refunded` → ticket + capacity reversal)

**Go live:** set `PAID_TICKETS_ENABLED=1` → redeploy.

**Verify:** test ticket purchase → `orders` row with `fee_cents` (our cut) +
`payout_status=pending`; **Revenue (P&L)** shows the event fee + GMV; confirm the
cron transfers face value after the event.

**Rollback:** unset `PAID_TICKETS_ENABLED` → every event reverts to free RSVP and
the paid checkout API is blocked server-side. Settle any in-flight payouts first.

## Stage 4 — Travel (hotels, then flights)

**Why last:** highest ceiling, most dependencies (LiteAPI volume, reconciliation,
and **Vercel Pro** for the live-flight retry cron).

**Prerequisites**
- [ ] LiteAPI key configured + booking volume
- [ ] Hotels enabled and reconciling before touching flights
- [ ] **Vercel Pro** (10-min flight-retry cron needs sub-daily schedules)

**Go live:** set `PAID_HOTELS_ENABLED=1` → redeploy → verify → then
`PAID_FLIGHTS_ENABLED=1`.

**Verify:** test hotel booking → `hotel_bookings` + `hotel_commissions` rows;
**Revenue (P&L)** shows travel commission (approx SGD) and the by-currency table;
cross-check against LiteAPI's weekly analytics (admin **Travel revenue**).

**Rollback:** unset the travel flag(s) → booking routes blocked; discovery stays
browsable. LiteAPI remains merchant of record for anything already booked.

---

## General notes

- **One stage at a time.** Let a stage run clean for a few days before the next.
- **Source of truth:** Stripe (subscriptions, ad/ticket charges, payouts) and
  LiteAPI (travel payouts) are authoritative. The in-app P&L is a reconciliation
  / at-a-glance view from our own ledger tables.
- **FX:** travel commission is shown in native currency plus an *approximate* SGD
  conversion (fixed table in `app/api/admin/revenue/route.ts`) — not for accounting.
