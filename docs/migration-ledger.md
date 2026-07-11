# Migration ledger — repo files vs prod database

Probe-verified against the production Supabase on **2026-07-11** (representative
object per migration; `node --env-file=.env.local` service-role probes).
Migrations are applied by **pasting SQL into the Supabase SQL editor** — there is
no automated tracking table, so this ledger is the source of truth. Update it
whenever a migration is applied or added.

## Numbering policy

- **Next new migration number: `0066`.** Numbers 0049–0052 are claimed (see below),
  0054 is a known duplicate, 0061–0065 are the 11-Jul payments batch — never reuse any number below 0066.
- One migration number = one file. If two branches need migrations concurrently,
  reserve numbers here first (the 0049–0052 note in `0054_listing_enrichment.sql`
  is the precedent).

## State table (0032+)

| Migration file (repo) | On master? | Applied in prod? | Notes |
|---|---|---|---|
| 0032_pg_cron_flight_retry | yes | yes (pg_cron job) | one of THREE flight-retry schedulers (GH Action */10 + Vercel daily) — candidate dedup |
| 0040_booking_idempotency | yes | yes | unique stripe_payment_intent on orders |
| 0041_promo_codes | yes | yes | |
| 0042_order_attribution | yes | yes | event_ref_codes + orders fee_mode/utm |
| 0043_ads_adsense | yes | yes | ad_placements.fill_mode |
| 0044_ux_overhaul | yes | yes | ad_campaigns unique stripe_payment_intent |
| 0045_analytics_v2 | yes | yes | analytics_lead_values |
| 0046_lead_marketplace | yes | yes | lead_routes, lead_preferences, leads marketplace cols |
| 0047_halal_verdicts | yes | yes | |
| 0048_halal_passport | yes | yes | passport_points, referral_codes, referrals, passport_settings + RPCs |
| 0049_passport_v2 | **NO — lives on PR #145** | **YES** | ⚠️ prod schema is AHEAD of master code (passport_quests exists) |
| 0050_passport_perks | **NO — PR #145** | **YES (assumed with 0049)** | ⚠️ same |
| 0051_passport_integrity | **NO — PR #145** | **YES (assumed with 0049)** | ⚠️ same — integrity schema present, master code unaware |
| 0052_verdict_lead_hardening | yes (merged via PR #146) | **NO — PASTE PENDING** | ⚠️ verdict admin approval + lead accept now call RPCs (`approve_verdict`, `accept_lead_route`) that DON'T EXIST until pasted |
| 0053_feature_flags | yes | yes | platform_settings flag columns + business_feature_overrides |
| 0054_fix_admin_analytics_rpcs | yes | yes | **duplicate number** with next row — FROZEN as-is, do not rename (prod applied both by paste) |
| 0054_listing_enrichment | yes | yes | listing_enrichments + businesses.seo_title/seo_description |
| 0055_hawker_finder | yes | yes | hawker_centres + businesses.hawker_centre_id/stall_no |
| 0056_tiktok_ugc | yes | yes | tiktok_submissions |
| 0057–0059 seed_wedding_vendors | yes | yes | data seeds (31 vendors), probe-verified counts |
| 0060_tiktok_submissions_close_leak | yes | yes (pasted + probe-verified 11 Jul) | drops the anon-read policy leaking reviewed_by/raw/submitter_email on approved tiktok rows (audit tiktokUgc-01) |
| 0061_reserve_event_capacity | yes | **NO — PASTE PENDING** | atomic capacity-aware seat reservation (`reserve_event_capacity`) for flash-sale ticket holds. Code falls back to the unconditional counter until pasted, so deploy order doesn't matter — but paste BEFORE any big paid event. |
| 0062_payout_status_states | yes | **NO — PASTE PENDING** | extends the orders.payout_status check with 'held'/'reversed'/'reverse_failed' (dispute + refund-after-payout clawback). Code degrades to 'skipped' (also cron-safe) until pasted. |
| 0063_orders_pi_unique | yes | **NO — PASTE PENDING** | partial unique index on orders.stripe_payment_intent — a duplicated Stripe event can't double-insert an order / double-issue tickets (paidTickets-01). Webhook treats the 23505 as already-fulfilled. |
| 0064_track_scheduled_ads | yes | **NO — PASTE PENDING** | track_ad_event now records for status in (active,scheduled)+approved — self-serve ads were served but showed 0 impressions/clicks (streams-P1-2). |
| 0065_ads_price_align_donation_refunds | yes | **NO — PASTE PENDING** | directory_inline $89→$49 (matches marketed price, streams-P1-1) + donations.refunded_cents for partial-refund honesty (streams-P2-7). |

## Open items

1. ~~PASTE `0052_verdict_lead_hardening.sql`~~ — pasted + verified 11 Jul.
2. **PASTE — `0061_reserve_event_capacity.sql` + `0062_payout_status_states.sql`
   + `0063_orders_pi_unique.sql` + `0064_track_scheduled_ads.sql` + `0065_ads_price_align_donation_refunds.sql`** before enabling paid tickets/ads for any
   high-demand event (flash-sale oversell protection + dispute/reversal payout
   states + duplicate-event order dedupe).
3. **Master is BEHIND prod for passport v2 schema** (0049–0051 applied, code on
   PR #145 unmerged). Harmless while the new tables sit unused, but the
   integrity/review-hardening subset of #145 should be cherry-picked (program
   item A8) so prod code matches the integrity schema it already has.
4. **Dual 0054**: frozen and documented; both applied. Do not renumber (renaming
   applied migrations creates worse drift). Next free number: **0066**.
