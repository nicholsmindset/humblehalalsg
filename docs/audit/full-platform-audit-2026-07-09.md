# Full platform audit — Humble Halal (2026-07-09)

User-perspective + admin audit driven with **agent-browser** against production `www.humblehalal.com`, logged in as an **admin** (onnifyworks). Covered business listings, events, sponsors/ads, halal certification, travel/hotels/flights, AI concierge, loyalty/passport, plus stress tests. Feature flags were toggled **ON to audit, then restored to OFF** — prod is unchanged. Screenshots in `reports/agent-browser/audit-listings/` (gitignored).

## Headline

The platform is **well-built, honest, and secure** — polished UI, MUIS-compliant cert workflow, graceful degradation, XSS-safe, a11y-clean. The gaps are **content depth** (thin directory data, ~1 real event) and a few **launch/setup items**, not code quality. This directly motivates the [AI listing-enrichment plan](ai-listing-enrichment-plan.md).

## What works well (verified)

- **Business listings** — `/explore` search (`?q=`), autocomplete, sort, MUIS-certified toggle, list/map, Save/Claim. Business pages (e.g. The Quarters): hero photo, breadcrumb, **honest badges** ("Muslim-Owned", "Self-declared — not certified"), Leaflet map, reviews, Open-now + address, Google-Maps link, sticky CTA.
- **Halal certification (admin)** — *exemplary, MUIS-compliant*: cert vault ("open each file to verify before approving") + a 51-row verification table showing MUIS-Certified vs Pending, each with a **"Look up on HalalSG"** deep-link (not scraped) and MUIS/Verify actions to record the assertion. Matches best-practice compliance.
- **Travel / hotels** — `/travel/mecca`: "Hotels near Masjid al-Haram", **53 hotels**, halal overlay (distance to Holy Mosque, prayer, Umrah/Hajj). Browse-only with payments OFF (correct). Flights search works.
- **AI concierge** (toggled ON) — asked *"halal nasi padang in Tampines with a prayer room"* → returned **12 grounded business results, no error**. Functional in prod.
- **Halal verdicts** (ON) — `/is-halal/breadtalk` renders the rich verdict template (verdict + last-checked + MUIS mention).
- **Cert Vault / Semantic search** (ON) — upload UI + travel semantic UI present.
- **Owner dashboard** — manages a real business ("Atrium Restaurant"): My listings, Halal certificate, Reviews, Sponsored ads.
- **Admin** — 20 well-organized sections, all load with **zero console errors**.

## Findings (ranked)

### High
1. **Content thinness** — the events directory has **1 event** ("Humble Halal Event", a placeholder); directory **search coverage is thin** (satay→1, chicken→6, nasi→13, rice→3 results). The build is ready; the *data* isn't. Biggest lever on perceived quality. → [enrichment plan](ai-listing-enrichment-plan.md).
2. **Soft-404s** — invalid `/business/<bad>` and `/events/<bad>` render a friendly "This page wandered off" page but return **HTTP 200**, not 404. SEO risk (search engines index non-existent pages). Should 404 or `noindex` via middleware (a known pattern in this repo — see `redirects-and-soft-404`).
3. **Halal Passport flag ON but dashboard tab didn't surface** — after enabling the `passport` flag, `/dashboard` still showed no Passport tab (points/tier). Possible extra dependency (env `PASSPORT_ENABLED`?) or cache lag beyond 30s. **Investigate before enabling for real.**

### Medium
4. **AdSense placeholder slot IDs** — every ad placement in *Featured & ads* has AdSense slot `1234567890` (placeholder). Live slots set to "Direct → AdSense" won't serve real AdSense until real slot IDs are entered (expected pre-AdSense-approval; flagging as a setup gap).
5. **Admin Businesses table slow load** — ~5-6s behind a bare "Loading…" before 200 rows appear. Functional but the loading state is unhelpful; consider a skeleton + pagination/perf.

### Low / positive
- Payment flags have a **"This enables a LIVE payment/charging flow. Continue?" confirm guard** — good safety.
- **XSS-safe** (`?q=<script>` sanitized, not reflected), **a11y-clean** (0 links without accessible names), empty-search shows a proper empty state.
- Honest halal labeling throughout (self-declared vs certified).

## Monetization readiness (all flags currently OFF)

The admin *Monetization* tab is self-documenting and splits into **FEATURES** (no Stripe) and **PAYMENTS** (need Stripe live + payout onboarding). Assessed by toggling ON:

| Flag | Type | State when ON | Ready to turn on? | Blocker / note |
|---|---|---|---|---|
| **AI concierge** | Feature | ✅ grounded results, no error | **Yes** | Confirm `AI_GATEWAY_API_KEY` cost/limits |
| **Semantic search** | Feature | ✅ travel UI | **Yes** | AI-key dependent |
| **Halal verdicts** | Feature | ✅ rich template | **Yes, but** | Needs verdicts drafted+approved per brand (content) |
| **Cert Vault** | Feature | ✅ upload UI | **Yes** | Needs businesses to upload certs (currently 0) |
| **Lead routing** | Feature | functional (admin) | **Yes (free beta)** | Dormant by choice; flip when ready |
| **Halal Passport** | Feature | ⚠️ tab didn't surface | **Not yet** | Investigate finding #3 first |
| Paid event tickets | Payment | LIVE-charge guard | No | Stripe live + Connect payout onboarding |
| Paid advertising | Payment | — | No | Stripe live; also enter real AdSense IDs |
| Paid listing plans | Payment | — | No | Stripe live + subscription prices |
| Paid hotel bookings | Payment | — | No | Stripe/LiteAPI live |
| Paid flight bookings | Payment | — | No | Stripe/LiteAPI live **+ Vercel Pro** (retry cron) |
| PayNow | Payment | — | No | Stripe live + PayNow enablement |
| Paid lead marketplace | Payment | — | No | Stripe live + lead prices |

**Recommendation:** the **FEATURE** flags (AI concierge, semantic search, cert vault, lead routing — and verdicts/passport once content/finding #3 are sorted) are safe, no-Stripe wins you can turn on to enrich UX. The **PAYMENT** flags are uniformly gated on **Stripe live mode + per-business payout onboarding** — a deliberate go-live step, not a feature-quality question.

## Reproduce
Logged-in admin session via agent-browser; screenshots `01`–`18` in `reports/agent-browser/audit-listings/`. Flag toggles done through admin *Monetization* (MCP click), restored OFF.
