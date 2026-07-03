# Humble Halal — Business Analytics (v2)

First-party analytics for the directory business model: which listings get demand,
which areas/categories are hot, which businesses receive real leads, and who to
pitch Verified/Featured/Premium to next. Not a GA4 clone — GA4/Meta/TikTok still
get their copies via the GTM dataLayer bridge in `lib/analytics.ts`.

## Architecture

```
UI (track.*) ──► track_event() RPC (SECURITY DEFINER, only write path for anon key)
                └► analytics_events (RLS: admin-only SELECT)
                       ├► admin RPCs (is_admin() re-checked in SQL)  ──► /admin/analytics
                       └► owner RPCs (scoped to auth.jwt()->>'sub')  ──► owner dashboard Insights
```

- Migrations: `0010` (foundation), `0011` (admin summary/journeys), `0012` (vendor
  share tokens), `0013` (owner analytics), `0042` (checkout/newsletter events),
  **`0045` (this build: taxonomy v2, lead values, area/category/opportunity RPCs)**.
- Client: `lib/analytics.ts` — fire-and-forget, silent no-op in mock mode, and a
  legacy-args retry so events survive the deploy-before-migration window.

## Event taxonomy

`event_type` (checked in DB):

| type | meaning | key fields |
|---|---|---|
| `page_view` | any page render | path, referrer |
| `impression` | listing card seen in a list | listing_slug, category, area |
| `listing_view` | listing detail opened | listing_slug, category, area |
| `search` | search executed | query, **results_count** (0 ⇒ demand gap) |
| `search_result_click` | a result card opened from search | listing_slug, query |
| `filter_use` | commercial-intent filter tapped | query = filter key (`near_me`, `open_now`, `prayer_space`, `muis_certified`, `muslim_owned`, `halal_friendly`, `family_friendly`, `hotels`, `mosques`) |
| `map_open` | map view opened | — |
| `ai_query` | Ask-AI question submitted | query (≤300 chars, never sent to 3rd parties) |
| `ai_result_click` | AI-recommended listing opened | listing_slug |
| `lead_action` | high-intent action on a business | lead_action_type ↓ |
| `checkout_start` / `newsletter_signup` | funnel events (0042) | |

`lead_action_type`: `enquiry_form`, `whatsapp`, `call`, `website`, `directions`,
`shortlist` (save), `share`, `claim`, `booking`, `menu`, `cert_view`.

Dimensions on every event: `session_id` (anonymous, sessionStorage), `device`
(mobile/desktop), `path`, `referrer`; listing events add `area`.

**Privacy:** no PII in analytics_events; owners only ever see aggregates about
their own listings (RPC-scoped); journeys (session-level) are admin-only; AI query
text stays first-party.

## Lead-value model

`analytics_lead_values` — admin-configurable cents per action (seeded: call S$15,
WhatsApp S$12, enquiry S$25, claim S$30, booking S$30, directions S$8, …).
Edited from the dashboard's Opportunities tab (rpc `admin_set_lead_value`), never
hardcoded. `est_value_cents` in vendor/opportunity RPCs = Σ(action × value).
This powers the sales pitch: *"you received S$X of leads free — Featured puts you
higher in category, area, map and homepage."*

## Dashboard (`/admin/analytics`)

Tabs: **Overview** (KPIs + Δ% vs previous period + est. lead value, trends) ·
**Listings** (per-vendor performance, plan badges, view→lead %, est. value, CSV) ·
**Search** (terms, zero-result demand gaps, search→click/lead) · **Areas** ·
**Categories** · **Opportunities** (outreach hit-list with suggested offer +
lead-value settings) · **Journeys** (converting sessions). Every RPC is
date-ranged — the range buttons now govern **all** tabs (pre-0045, Vendors/Search
were all-time). Partial fetch failures name the failed sections and offer Retry.

Owner side (`/owner` → Overview): totals + daily trend sparkline + "what people
searched before finding you" + plain-English explanations.

## Prod rollout

1. Apply `supabase/migrations/0045_analytics_v2.sql` (idempotent; run after 0044).
2. Deploy. (Order-safe both ways: the client retries with legacy args if the DB
   is old; the new track_event accepts old calls via defaults.)
3. Optional: tune lead values in the dashboard → Opportunities → Lead value settings.

## Testing

- Unauthed reads must fail: `curl -s $SUPABASE_URL/rest/v1/analytics_events -H "apikey: $ANON"` → RLS block; RPCs raise `admin only` without an admin JWT.
- Emit smoke: open the site, run a search, open a listing, click share/claim —
  rows appear in analytics_events with device/area/results_count populated.
- Dashboard: `/admin/analytics` as admin — all 7 tabs load, range buttons change
  every tab, Δ chips render, CSV downloads, lead-value edit persists.
- Owner: an account owning a listing with events sees trend + search terms.

## Deferred (next iterations)

Traffic-source attribution (needs UTM capture), before/after-upgrade comparisons
and renewal-risk scoring (needs plan-change history), weekly digest email,
category-median benchmarking in owner insights, `listing_id` uuid backfill
(events remain slug-keyed).
