# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary — the halal-food seeker.** A Muslim in Singapore deciding where and what to eat or
which local business to trust, usually on a phone, often near a meal decision or while out. Their
job: quickly find halal / Muslim-owned food, cafés, shops, and services near them, and know *how
trustworthy* the halal claim is (officially MUIS-certified vs. Muslim-owned vs. self-declared)
before acting. Success = a confident decision, fast, without second-guessing.

Other confirmed audiences (secondary to the food seeker):
- **Business owners** who list, claim, verify, and (optionally) promote their business.
- **Muslim travellers** planning Muslim-friendly trips (hotels, flights, Umrah) worldwide.
- **Event-goers and organizers** using the ticketing marketplace.
- **Muslims doing daily religious tasks** (prayer times, qibla, zakat, Quran, ingredient checks).

## Product Purpose

Humble Halal is Singapore's halal & Muslim-owned **discovery platform** — a business directory,
Muslim-friendly travel OTA, events marketplace, and Islamic-tools hub in one. It exists to make
the *facts* about halal status easy to find, built on human verification rather than AI guesswork,
so Muslims can decide and act with confidence. Success is measured by trusted discovery: a user
finds the right place, understands exactly how certain the halal claim is, and trusts the answer.

## Positioning

**A discovery platform, not a certifier.** MUIS HalalSG remains the halal authority; Humble Halal
surfaces and links to the facts and layers its own clearly-labelled, human-verified assertions on
top. The defensible mechanism a neighbouring product cannot honestly copy: an **honest,
graduated trust signal** — a halal-confidence score plus badges that visibly separate
`MUIS Certified` (on-file certificate, deep-linked to the HalalSG record) from `Admin Verified`,
`Muslim-Owned`, and `Halal-Friendly` (self-declared) — backed by a standing rule that no "halal"
claim publishes without a cited source and the MUIS register is never scraped.

## Operating Context

- Primarily **mobile**, in-the-moment usage (deciding on food, out and about, prayer-time aware).
- Bilingual **English / Bahasa Melayu** audience; some surfaces are BM-first
  (`/ms/*`, `waktu-solat-singapore`).
- **Organic search is the front door** for much of the audience: 600+ programmatic
  area × category × cuisine landing pages, plus tools and blog, are primary entry points — not
  just the home page.
- Prayer-time / qibla / Ramadan rhythms are part of the usage context, not decoration.
- The product runs in **mock mode without a backend** and degrades gracefully rather than crashing
  when a service key is missing ("Supabase last").

## Capabilities and Constraints

Live capability areas (per README status table):
- **Directory** (live): 298+ real businesses, halal-confidence score, badges, reviews, map,
  claim + owner dashboard.
- **Programmatic SEO** (live): 600+ landing pages with a **real-data indexation gate** — a place
  page is indexed only with ≥3 real listings; thin pages render but carry `robots:noindex`.
- **Islamic tools** (live): 19 tools + 114 Quran surah pages.
- **Events marketplace** (live): ticketing, promo codes, PayNow, QR check-in, Stripe payouts.
- **Travel OTA** (built; **live booking flag-gated** behind `PAID_HOTELS_ENABLED` /
  `PAID_FLIGHTS_ENABLED`): Muslim-friendly hotels/flights (LiteAPI), Umrah, human-verified halal
  overlay, Ask-AI concierge.
- **Ads / analytics / email growth** (live).
- **Ship-dark behind flags:** Lead marketplace, Halal Passport (loyalty), Halal Verdicts
  (AI-drafted → human-approved). Present in the codebase but dormant.

Durable constraints:
- **Feature-flagged, ship-dark by default.** Every paid/pilot surface is a server-side
  kill-switch, default OFF; real-money routes always re-check the server flag. Design must not
  imply a paid affordance is active when its flag is off.
- **No AI halal rulings.** Halal status, certificates, verdicts, and the travel halal overlay are
  human-reviewed; a "halal" claim is blocked without a cited source.
- **Privacy / PDPA-conscious.** No PII in the event log; owners see only aggregates about their own
  listings; cookie consent (Consent Mode v2) gates marketing tags.
- **Tech constraints that touch UI work:** Next.js 16 (App Router, React 19, Server Components) —
  a newer Next with breaking changes; read `node_modules/next/dist/docs/` before writing
  Next-specific code. Maps are Leaflet + OpenStreetMap / OneMap (no paid Maps API).

Terminology to preserve exactly: **MUIS Certified**, **Admin Verified**, **Muslim-Owned**,
**Halal-Friendly**, **halal-confidence score**, **mushbooh** (doubtful), **halal overlay**,
**Halal Passport**, **Halal Verdicts**.

## Brand Commitments

- Name: **Humble Halal** (a.k.a. Humble Halal SG), live at humblehalal.com.
- **English / Bahasa Melayu** parity is a product commitment, not an afterthought.
- Existing brand mark: teardrop/leaf logo at `app/icon.svg`.
- Voice implied by name and copy: **humble, trustworthy, community-first, fact-based** — never
  overclaiming ("built on facts and human verification, never AI guesswork"; "all in one humble
  place"). [Inferred from existing copy — confirm if a formal voice guide exists.]
- Halal integrity is a brand promise: honest, labelled badges and cited sources are identity, not
  just policy.

## Evidence on Hand

- **Real data:** 298+ real businesses; hand-written unique local content for priority SG areas
  (real MRT stations, malls, hawker centres, mosques).
- **Real, location-matched photography** (auditable — `docs/image-sources.md`); editorial blog
  imagery in `public/blog/*`; neighbourhood illustrations in `public/area-images/*`.
- **Lead magnets / templates:** `public/guides/*.pdf`, `public/templates/*.csv`.
- **Deep-links** to the official MUIS HalalSG record for certified listings.
- **Absences future work must not fabricate:** no invented certifications, testimonials,
  benchmarks, or "halal" verdicts without a cited source; do not assert MUIS certification for a
  listing that only carries a self-declared/Muslim-owned badge.

## Product Principles

1. **Honest trust over flattering claims.** Always show *how* certain a halal claim is; never blur
   MUIS-certified into self-declared. The graduated badge system is the product.
2. **Facts and human verification, never AI guesswork** — for any halal-status-bearing content.
3. **Decide fast, on a phone.** The primary user is mid-decision; scanability and speed to a
   confident answer outrank expression.
4. **Search-first front door.** Many users land on a deep SEO/tool page, not the home page; every
   entry surface must stand on its own and orient a first-time visitor.
5. **Community-first and humble.** Tone and design should feel trustworthy and grounded, not
   loud or salesy — and must serve EN and BM audiences equally.

## Accessibility & Inclusion

- Bilingual **EN / BM** support is a first-class requirement.
- Accessibility is actively tested: axe-core in Playwright, a dedicated mobile-a11y stylesheet
  (`styles/mobile-a11y.css`), a mobile device-matrix audit (`npm run audit:mobile`), and a public
  `/accessibility` statement. Refinement work must keep these green (contrast, tap targets,
  focus states, reduced-motion).
