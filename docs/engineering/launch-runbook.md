# Launch runbook — migrations, seed, flags & E2E verification

Everything built in the recent work (events platform, donations, check-in, follows/ratings,
Ramadan mode, sponsored ads) **degrades gracefully** until its migration is applied — the
site never breaks, features just stay dormant/`simulated`. This runbook turns them on and
verifies them end-to-end.

> Order matters: **1) migrations → 2) admin grant → 3) seed → 4) flags/Stripe → 5) verify.**

---

## 1. Apply database migrations

Apply every migration through `0024` to the connected Supabase project. New since the last
deploy:

| File | Adds | Powers |
|---|---|---|
| `0019_donations.sql` | `donations` table + RLS | Zakat/sadaqah on charity events |
| `0020_ticket_checkin.sql` | `tickets.checked_in_at/by` | QR door check-in |
| `0021_follows_event_reviews.sql` | `organizer_follows`, `event_reviews`, `v_event_*` views, `follower_count()` | Follow organisers + event ratings |
| `0022_ramadan_mode.sql` | `platform_settings.ramadan_mode_enabled` | Admin-controlled Ramadan mode |
| `0023_ads.sql` | `ad_placements`, `ad_campaigns`, `ad_events`, `v_campaign_performance`, `track_ad_event()` | Sponsored-ad sales + tracking |
| `0024_owner_campaign_perf.sql` | `owner_campaign_performance()` RPC | Advertiser report in `/owner` |
| `0025_premerge_review_fixes.sql` | `events` `cancelled` status, `ad_orders` unique PI, `increment_donation_raised()` + `decrement_event_taken()` RPCs, `security_invoker` views | Pre-merge review fixes: event cancellation, atomic donation total, refund capacity, RLS-safe views |

**How** (any one):
- **Supabase CLI:** `supabase db push` (or `supabase migration up`) from the repo root.
- **Dashboard:** SQL Editor → paste each new file in order → Run.

Idempotent: all use `if not exists` / `create or replace`, safe to re-run.

---

## 2. Grant yourself admin

Admin powers the console, campaign manager, verification queue, and the `seed-demo` fallback.
In the Supabase SQL Editor:

```sql
update profiles set role = 'admin'
where id = (select id from auth.users where email = 'YOUR_ADMIN_EMAIL');
```

(Per project notes the launch admin is `onnifyworks@gmail.com`.) Sign out/in so the role
takes effect.

---

## 3. Seed demo data (directory + events)

Without seeded `businesses`/`events`, directory/map render from the mock seed and write paths
return `simulated`. Seed both with the `CRON_SECRET`-guarded endpoint (no admin login needed):

```bash
curl -X POST https://YOUR_HOST/api/admin/seed-demo \
  -H "Authorization: Bearer $CRON_SECRET"
# → {"ok":true,"businesses":73,"events":8}
```

After this: directory/map/events are DB-backed, RSVP returns a real ref, review-submit persists
(`pending`), and the Ramadan-flagged demo events (`e3` segregated, `e5` charity+donations) show
the Islamic layer.

---

## 4. Flags, Stripe & Connect

**Feature flags** (env — all default OFF so launch is free):
- `PAID_TICKETS_ENABLED`, `PAID_ADS_ENABLED`, `PAID_PLANS_ENABLED`, `PAID_HOTELS_ENABLED`, `PAID_FLIGHTS_ENABLED`
- `RAMADAN_MODE_ENABLED` — env fallback; the **admin toggle** (Admin → Monetization → "Ramadan mode") is the live, DB-persisted control and is preferred.

**Stripe** (test first): set `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`,
`STRIPE_WEBHOOK_SECRET`. Point a Stripe webhook at `https://YOUR_HOST/api/webhooks/stripe`
(events: `checkout.session.completed`, `charge.refunded`, `customer.subscription.*`).

**Organizer payouts (Connect):** a paid-event organiser must complete onboarding —
`/owner` → Stripe Connect → `/api/connect/onboard` — until `payouts_enabled` is true, paid
ticket checkout is blocked server-side (by design).

---

## 5. End-to-end verification

**Events — free RSVP**
1. `/events` → an event → RSVP → expect a confirmation ref; `My tickets` shows a scannable QR.

**Events — paid ticket loop** (set `PAID_TICKETS_ENABLED=true`, organiser Connect-onboarded, Stripe test card `4242 4242 4242 4242`):
1. Buy a ticket → Stripe Checkout → success.
2. Webhook records the `order` + `tickets`, decrements capacity atomically, emails the ticket.
3. Organiser opens `/events/<slug>/checkin` → scan/enter the ticket ref → flips `valid→used` (re-scan rejected).
4. Refund from the owner dashboard (or cancel the event) → `charge.refunded` reverses order + tickets.
5. `event-payouts` cron transfers the organiser's net 24h after the event.

> **Policy — refunds after payout:** a refund issued *after* the organiser payout has
> been transferred does **not** reverse the Stripe transfer; the platform absorbs it.
> (The webhook flips the order/tickets to refunded but never claws back a payout.)
> Refund within the 24h window when possible.

**Donations (charity event):** open `e5` (Iftar) → "Give zakat/sadaqah" → Stripe Checkout → webhook records the donation + bumps the honest running total.

**Sponsored ads:** Admin → Monetization → "Featured & ads" → create a campaign on `homepage_hero`, set **Active** → it renders as a "Sponsored" card on the home page → impressions/clicks accrue in the admin table and in the advertiser's `/owner` → "Sponsored ads" tab.

**Ramadan mode:** Admin → Monetization → toggle **Ramadan mode** on → reload → the Ramadan toggle/banner appears for visitors (hidden when off).

**Discovery & trust:** event detail → **Follow** an organiser (auth), submit an **event rating** (moderated → admin approves → appears + average shows).

---

## 6. Crons (Vercel)

Scheduled in `vercel.json`, all `CRON_SECRET`-guarded:
`event-payouts` (daily 6:30), `event-reminders` (daily 1:00 — day-before emails), `refresh-stats`,
`owner-alerts`, `index-health`, `recheck-certs`, `freshness-audit`, `weekly-digest`, `review-triage`,
`fare-alerts`, `flight-retry`. On Hobby, crons run daily only (see project notes re: Vercel Pro for
sub-daily flight retries).

---

## Honesty guardrails (don't regress)
- MUIS status is deep-linked to HalalSG, never scraped; admins record their own dated assertions.
- Ratings/donation totals/ad metrics are computed from **real** rows only — never fabricated.
- Paid money routes always re-check the **server** flag; a client toggle can't enable charges.
