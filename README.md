# Humble Halal

**Singapore's most trusted halal & Muslim-owned discovery platform.** A directory, travel OTA, events marketplace and Islamic-tools hub in one — built on facts and human verification, never AI guesswork.

🌙 Live at **[www.humblehalal.com](https://www.humblehalal.com)**

Humble Halal helps Muslims in Singapore discover MUIS-certified kitchens, Muslim-owned cafés, shops and services — and plan Muslim-friendly travel (hotels, flights, Umrah) worldwide. It is a **discovery platform, not a certifier**: MUIS HalalSG remains the authority; we make the facts easy to find, with clear badges separating what's officially certified from what's self-declared.

---

## Table of contents

- [What's inside](#whats-inside)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Feature areas](#feature-areas)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Environment & feature flags](#environment--feature-flags)
- [Database & migrations](#database--migrations)
- [Deployment](#deployment)
- [Compliance posture](#compliance-posture)

---

## What's inside

| Area | What it does | Status |
|------|--------------|--------|
| **Directory** | 298+ real businesses with halal-confidence scores, MUIS/Muslim-owned/halal-friendly badges, reviews, map, claim & owner dashboard | Live |
| **Travel OTA** | Muslim-friendly hotels + flights (LiteAPI), Umrah guides, prayer-aware search, Ask-AI concierge | Built; live booking flag-gated |
| **Events marketplace** | Eventbrite-class ticketing — promo codes, fee modes, PayNow, QR check-in, payouts, attribution | Live |
| **Islamic tools** | 19 tools + 114 Quran surah pages: prayer times, qibla, zakat, faraid, tasbih, hifz tracker, ingredient checker & more | Live |
| **Ads** | Admin-controlled direct sponsors + AdSense fill, self-serve campaign builder, brand-safety blocklist | Live (paid via flag) |
| **Business analytics** | Monetization dashboard — lead actions, area/category demand, outreach hit-list, configurable lead-value model | Live |
| **Lead marketplace** | Shared-lead routing + Stripe lead subscriptions + quota enforcement | Deployed (dormant behind flag) |
| **Halal Passport** | Loyalty (points/tiers/badges/streaks) + consumer referral program | Deployed (ships dark) |
| **Halal Verdicts** | AI-drafts → human-approves verdict system for `/is-halal` brand/ingredient pages | Deployed (ships dark) |
| **Programmatic SEO** | 600+ area/category/cuisine/venue landing pages with real-data indexation gating | Live |
| **Email growth** | beehiiv newsletter + multi-surface capture (popup, hero, tool CTA, directory, blog, seasonal) | Live |

---

## Tech stack

- **Framework:** Next.js 16 (App Router, React 19, Server Components) — ⚠️ this is a newer Next with breaking changes from older docs; read `node_modules/next/dist/docs/` before writing Next-specific code.
- **Auth:** Clerk (`@clerk/nextjs`) — passwordless (Google + email code). The database stays Supabase; Postgres trusts Clerk JWTs via Third-Party Auth (`auth.jwt()->>'sub'`).
- **Database:** Supabase Postgres with Row-Level Security. A SECURITY-DEFINER write path means the anon key can only insert through vetted RPCs, never read protected tables.
- **Payments:** Stripe (Connect for event payouts, subscriptions for plans/leads, one-time for tickets). LiteAPI is merchant-of-record for travel.
- **AI:** Vercel AI Gateway (`ai` SDK) — Ask-AI search & concierge, verdict drafting. Degrades to deterministic fallback without a key.
- **Maps:** Leaflet + OpenStreetMap tiles, OneMap geocoding (no paid Maps API).
- **Charts:** Recharts (code-split, admin-only).
- **Email:** Resend (transactional) + beehiiv (newsletter).
- **Analytics:** First-party event log + GTM dataLayer bridge (GA4 / Meta CAPI / TikTok Events API).
- **Hosting:** Vercel (Fluid Compute), auto-deploy from `master`.

---

## Architecture

**Feature-flagged, ship-dark by default.** Every monetization surface is gated by a server-side env flag (see [feature flags](#environment--feature-flags)), all defaulting OFF so the site launches free. Client toggles only control what paid affordances are *shown* — real money routes always re-check the server flag, so a client toggle can never enable charges on its own.

**Graceful degradation ("Supabase last").** Every route works without a backend configured: data routes simulate in mock mode and persist once keys are wired. The site never crashes on a missing key — it degrades.

**Privacy-conscious analytics.** No PII in the event log; business owners only ever see aggregates about their own listings (RPC-scoped); session-level journeys stay admin-only; AI query text stays first-party. Cookie consent (Consent Mode v2) gates marketing tags.

**Human verification over AI guesswork.** Halal status, certificates and verdicts are human-reviewed. Nothing auto-publishes a "halal" claim without a cited source, and the MUIS HalalSG register is never scraped — we deep-link and record our own assertion.

---

## Feature areas

### Directory (`/explore`, `/business/[slug]`, `/halal/*`)
Browse by category, area, cuisine and prayer needs. Each listing carries a **halal-confidence score** and clear badges: `MUIS Certified` (links to the HalalSG record), `Admin Verified`, `Muslim-Owned`, `Halal-Friendly`. Real photo galleries, reviews, map with directions, and community "confirm it's halal" signals. Unclaimed listings can be **claimed** by owners.

### Owner dashboard (`/owner`)
Deep-linkable tabbed dashboard: sectioned listing editor (basics, hours with overnight/24h support, photos, amenities), photo manager with plan caps, billing/plan ladder, halal-certificate vault, insights (views, WhatsApp taps, calls, directions + "what people searched before finding you"), sponsored-ads self-serve, payouts, reviews, and pending-submission visibility.

### Travel OTA (`/travel`)
Muslim-friendly **hotels** and **flights** via LiteAPI, with a halal overlay (prayer rooms, halal dining nearby, alcohol-free stays, Muslim-meal flags, qibla, prayer-aware layovers) that is human-verified — never AI-scraped. Umrah guides, distance-to-Haram scoring, saved trips, and an **Ask-AI concierge**. Live booking is gated by `PAID_HOTELS_ENABLED` / `PAID_FLIGHTS_ENABLED`.

### Events marketplace (`/events`, `/host-event`)
Eventbrite-class ticketing built halal-first: promo codes, flexible fee modes, PayNow at checkout, QR ready-to-scan check-in, CSV export, Stripe Connect payouts, halal badges, and order attribution. SEO event pages included.

### Islamic tools (`/tools`)
19 local-first tools + 114 Quran surah pages: prayer times, qibla compass, zakat & **faraid (inheritance)** calculators, tasbih, hifz & khatam trackers, salah tracker, duas, hadith, Islamic calendar & date converter, sadaqah, baby/99 names, Ramadan hub, halal-stock screener, and an **"Is this ingredient halal?" E-number checker** (~90 additives, origin-classified, mushbooh by default). Quran via AlQuran.cloud.

### Ads (`/advertise`, admin + owner)
Admin-controlled dual-source serving: **direct sponsors** first, **AdSense** fill. Self-serve campaign builder for owners (placement picker → dates → creative with live preview → pay & submit), Stripe checkout with idempotent webhooks, and a strict halal **brand-safety blocklist** (alcohol, gambling, riba, etc.). Paid activation via `PAID_ADS_ENABLED`.

### Business analytics (`/admin/analytics`)
A directory-monetization dashboard (not a GA4 clone): 7 tabs — Overview (KPIs with period-over-period deltas + estimated lead value), Listings, Search (with zero-result demand gaps), Areas, Categories, **Opportunities** (who to pitch Verified/Featured/Premium next), and Journeys. A **configurable lead-value model** (S$ per action) powers the sales story. Per-vendor shareable scorecard links (login-free).

### Lead marketplace
Shared-lead routing to businesses, with Stripe lead subscriptions and quota enforcement. Ships dark behind `LEAD_ROUTING_ENABLED` (free beta) → `PAID_LEADS_ENABLED` (monetize).

### Halal Passport
Loyalty + consumer referral moat: points, tiers, badges, streaks, and invite-a-friend (both earn). Points summed from an append-only ledger; referral qualifies on first action. Ships dark behind `PASSPORT_ENABLED`.

### Halal Verdicts
AI-drafts → **human-approves** verdict system that scales `/is-halal` brand and ingredient pages compliantly. Never auto-publishes; a "halal" verdict is blocked without a cited source. Ships dark behind `HALAL_VERDICTS_ENABLED` (needs `AI_GATEWAY_API_KEY`).

### Programmatic SEO (`/halal/*`)
600+ generated landing pages across area × category, malls/venues, cuisines and districts. Hand-written unique local content for priority areas (real MRT stations, malls, hawker centres, mosques), legacy-slug 301s, and a **real-data indexation gate**: a place page is indexed only with ≥3 real listings — thin pages render but carry `robots:noindex`.

---

## Project structure

```
app/                    Next.js App Router — routes, API handlers, metadata
  admin/                Admin console + analytics dashboard
  api/                  Route handlers (owner, admin, webhooks, cron, checkout, track)
  business/[slug]/      Public listing detail
  halal/[slug]/         Programmatic SEO landing pages
  owner/                Business owner dashboard
  tools/                Islamic tools + Quran
  travel/               Hotels, flights, Umrah, trips
  events/ · host-event/ Events marketplace
components/             UI — screens, owner/*, ads/*, seo/*, tools/*, chrome
lib/                    Domain logic — flags, plans, analytics, directory, seo-pages,
                        area-content, ad-safety, hours, geo, sg-locations, tools/*
supabase/migrations/    48 SQL migrations (RLS, RPCs, views)
supabase/functions/     Edge Functions (notifications, review triage)
docs/                   engineering/ · runbooks/ · roadmap/ · seo/ · gtm/ · audit/
scripts/                Seed, geocode, image enrichment, SEO counts, mobile audit
e2e/ · tests/           Playwright E2E (incl. mobile matrix) + Vitest units
```

---

## Getting started

**Prerequisites:** Node.js 20+, npm.

```bash
npm install
cp .env.example .env.local   # fill in keys (see below)
npm run dev                  # http://localhost:3000
```

The app runs in **mock mode** without a backend, so you can explore the UI before wiring any keys.

**Scripts:**

```bash
npm run dev          # dev server
npm run build        # production build
npm run start        # production server
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
npm run test         # Vitest unit tests
npm run test:e2e     # Playwright E2E
npm run audit:mobile # device-matrix mobile audit
npm run seo:counts   # regenerate real-listing counts for SEO gating
```

---

## Environment & feature flags

Copy `.env.example` to `.env.local`. Core services: **Clerk** (auth), **Supabase** (DB), **Stripe** (payments), **LiteAPI** (travel), **Resend** + **beehiiv** (email), **AI Gateway** (AI), **OneMap** (geocoding), **Upstash** (rate limiting).

Every paid/pilot surface is a server-side kill-switch (unset = OFF):

| Flag | Enables |
|------|---------|
| `PAID_TICKETS_ENABLED` | Paid event tickets (Stripe Connect) |
| `PAID_PLANS_ENABLED` | Paid listing plans |
| `PAID_ADS_ENABLED` | Paid sponsored ads (else request-mode) |
| `PAID_HOTELS_ENABLED` / `PAID_FLIGHTS_ENABLED` | Live travel booking |
| `PAYNOW_ENABLED` | PayNow at ticket checkout |
| `CERT_VAULT_ENABLED` | Halal-certificate vault uploads |
| `SEMANTIC_SEARCH_ENABLED` / `AI_CONCIERGE_ENABLED` | Travel AI search & concierge |
| `LEAD_ROUTING_ENABLED` / `PAID_LEADS_ENABLED` | Lead marketplace (free beta → paid) |
| `PASSPORT_ENABLED` | Halal Passport loyalty + referrals |
| `HALAL_VERDICTS_ENABLED` | AI-drafted halal verdicts (admin-approved) |

---

## Database & migrations

48 SQL migrations under `supabase/migrations/` define tables, RLS policies, reporting views and SECURITY-DEFINER RPCs. Apply new migrations in the Supabase SQL editor in order; they're written idempotently (`if not exists`). Recent additions:

- `0043` ads (direct + AdSense) · `0044` UX overhaul + self-serve ads · `0045` business analytics v2 · `0046` lead marketplace · `0047` halal verdicts · `0048` halal passport.

**Security model:** the public anon key can only `INSERT` through vetted `track_event()`-style RPCs; all reads of protected tables require an authenticated admin (enforced at both RLS and RPC layers).

---

## Deployment

Hosted on **Vercel**, auto-deploying from `master`. Rule of thumb: **promote to production only from merged `master`, one session at a time** — use a git worktree per concurrent branch to avoid clobbering deploys. Migrations and feature flags are applied out-of-band (Supabase SQL editor + Vercel env) so a deploy never depends on a migration that hasn't run, and vice versa.

---

## Compliance posture

- **MUIS is the authority.** We never scrape the HalalSG register — we deep-link to it and record our own, clearly-labelled assertion. Bulk data only via a future MOU.
- **Badges are honest.** `MUIS Certified` means an on-file certificate; everything else is labelled self-declared or Muslim-owned.
- **No AI halal rulings.** Verdicts are human-approved; a "halal" claim is blocked without a cited source. The halal overlay on travel is human-verified, never AI-generated.
- **Privacy first (PDPA-conscious).** Minimal personal data, aggregated owner analytics, admin-only journeys, respected cookie consent.

---

*Built for the Singapore Muslim community — and Muslims travelling the world.*
