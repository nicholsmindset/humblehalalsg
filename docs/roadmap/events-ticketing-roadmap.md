# Events & Ticketing Roadmap — "Like or better than Eventbrite"

**Goal:** make Humble Halal's events + ticketing experience match Eventbrite on the fundamentals and **beat it** on the things that matter to Singapore's Muslim community — fees, payout speed, halal/gender-aware workflows, mobile/WhatsApp-first UX, and trust.

**Status:** drafted 2026-06-27. Benchmarked via competitive research (Eventbrite organizer + attendee feature set, 2025–2026). Quick wins marked **[QW]**, bigger builds **[BB]**.

> **2026-07-02 update:** this roadmap is now extended by the implementation-ready
> **[Events Marketplace Blueprint](events-marketplace-blueprint.md)** — full IA/sitemap,
> schema DDL (promo codes, attribution, add-ons, questions, waitlists, verified reviews),
> fee-mode + PayNow money flows, organizer analytics design, marketing prompt templates,
> and the phased build plan. Phase 1 (promo codes, pass/absorb fees, PayNow flag, event
> SEO pages, similar events, attribution + Marketing tab) is being built on branch
> `feat/events-marketplace`.

---

## 1. Where we stand today (current state)

Already built and live (or in this sprint):

**Attendee**
- Event discovery (`/events`): category / area / price / gender filters, featured rail, event cards
- Event detail: tiers, qty, attendee name, venue + Leaflet map, organiser, **prayer notes**, **gender arrangement**, RSVP (free) / buy (paid)
- Checkout → Stripe (`/api/checkout/ticket`); free RSVP path
- **QR tickets** (client-generated, offline-capable, no network), **My tickets** list
- **Ticket-detail page** (in this sprint): full-screen scannable QR, copy code, status, add-to-calendar (ICS), share
- Refund handling via Stripe webhook (`charge.refunded` → capacity release)

**Organiser**
- Host-event wizard: multi-tier tickets, capacity, **refund policy**, **gender arrangement** (mixed / segregated / sisters / brothers), **prayer notes**, address autocomplete (OneMap)
- **Stripe Connect** payouts: separate charges + delayed transfer 24h post-event; payout cron; transparent fee math (`computeOrder`)
- **Door check-in scanner**: camera barcode scan + manual code entry; marks ticket used; organiser/admin auth; re-scan guard; shows attendee name + tier; live counter
- Webhook fulfillment (order → tickets → capacity); attendees view

**Our unfair advantages (already differentiating vs Eventbrite)**
- Halal-only, community-first audience + discovery
- Gender arrangement + prayer notes as **first-class** fields
- MUIS/halal trust layer, Cert Vault, Muslim-owned signals
- Transparent Stripe fee math; community/charity-friendly framing
- Mobile-first, WhatsApp-first SG audience

---

## 2. Gap analysis vs Eventbrite

| Capability | Eventbrite | Us today | Action |
|---|---|---|---|
| Digital QR ticket | ✅ | ✅ | keep |
| **Apple/Google Wallet pass** | ✅ | ❌ | **[BB]** Phase 3 |
| Offline ticket / PWA | ✅ | partial (QR client-gen) | **[BB]** Phase 3 |
| "Ready to scan" full-screen + max brightness | ✅ | ❌ | **[QW]** Phase 1 |
| Per-attendee named tickets (group orders) | ✅ | partial | **[BB]** Phase 2 |
| **Ticket transfer** | ✅ | ❌ | **[BB]** Phase 4 |
| Self-service refund/cancel request | ✅ | organiser/webhook only | **[BB]** Phase 4 |
| Resend tickets / find-my-tickets by email | ✅ | ❌ | **[QW]/[BB]** Phase 1–2 |
| **Promo / discount codes** | ✅ | ❌ | **[QW]** Phase 1 |
| Custom order questions | ✅ | partial | **[QW]** Phase 1–2 |
| Reserved seating / zones (sisters/brothers/family) | ✅ | ❌ | **[BB]** Phase 3 |
| Waitlists | ✅ | ❌ | **[QW]/[BB]** Phase 2 |
| Timed entry / recurring events | ✅ | ❌ | **[BB]** Phase 3 |
| Scheduled reminders (7d/24h/3h) | ✅ | partial | **[QW]** Phase 1 |
| Attendee search + CSV export | ✅ | partial | **[QW]** Phase 1 |
| Real-time sales analytics | ✅ | partial | **[BB]** Phase 2 |
| Offline + multi-scanner check-in | ✅ | single online scanner | **[BB]** Phase 2–3 |
| Organiser profiles | ✅ | partial | **[QW]** Phase 1 |
| Door sales / Tap-to-Pay | ✅ | ❌ | **[BB]** Phase 3 |
| PayNow / local payments | ❌ (cards/BNPL) | ❌ | **[BB]** Phase 2 — **a beat-Eventbrite move** |

---

## 3. Maps / location decision (settled)

**No paid Maps API needed to launch.** Current free stack covers Singapore fully:
- Map display: **Leaflet + OpenStreetMap** • Directions: **deep-link** to native Google/Apple Maps • SG geocoding: **OneMap** • Travel places: **LiteAPI**
- Revisit a paid Places API (Google/Mapbox/Nominatim) **only for international halal discovery** — and even then only for coordinates/discovery, never halal status (which stays human-verified per compliance posture).

---

## 4. Prioritized roadmap

### Phase 1 — Quick wins (this sprint + next)
*High impact, low build. Several are already in flight.*

**Attendee**
- ✅ Ticket-detail page with big QR + copy code + status + ICS + share *(in this sprint)*
- "**Ready to scan**" full-screen view + auto **max brightness** while open **[QW]**
- Color-coded status (valid=green / checked-in=blue+time / refunded=red) + microcopy "Show this at the entrance" **[QW]**
- **Mobile-first My tickets** (tappable rows, Upcoming/Past/Cancelled grouping) *(in this sprint)* **[QW]**
- One-click **resend tickets to email** **[QW]**
- Enhanced calendar (ICS attachment in email + "Add to Google Calendar") **[QW]**
- **Halal/Muslim badges on the ticket** (halal-certified catering, prayer room, sisters-only, family) **[QW]**

**Organiser**
- **Promo / discount codes** (public/private, %, fixed, usage limits, expiry) **[QW]**
- Attendee **search** (name/email/phone) + **CSV export** **[QW]**
- Duplicate-scan protection + clearer invalid/used messaging in check-in **[QW]**
- **Event templates** (iftar / Eid prayer / lecture / youth camp) pre-filling gender + prayer fields **[QW]**
- Organiser profile pages (branding, social, upcoming events) **[QW]**
- Transparent fee display + **community/charity fee discount** **[QW]**
- Basic automated emails: confirmation, **reminders (24h/3h)**, post-event thank-you **[QW]**

### Phase 2 — Identity, access & analytics
- Per-attendee **named ticket cards** for group orders + switch-ticket carousel in scan view **[BB]**
- **Find-my-tickets by email** (magic-link, no account) **[BB]**
- **Waitlists** with auto-issue **[QW/BB]**
- Improved **organiser analytics** (sales by tier, check-in %) **[BB]**
- **PayNow** + choice to pass/absorb fees *(beat Eventbrite for SG)* **[BB]**
- More flexible **order forms** (per-ticket-type custom questions) **[BB]**

### Phase 3 — Wallet, offline & seating
- **Apple Wallet / Google Wallet** passes (auto-updating status) **[BB]**
- Offline-capable ticket + **PWA install** **[BB]**
- **Offline + multi-scanner** check-in (shared state across doors) **[BB]**
- **Reserved seating / gender zones** (sisters/brothers/family) **[BB]**
- **Timed entry** (iftar slots, bazaars) + **recurring events** (weekly halaqah/Jummah) **[BB]**
- On-site **Tap-to-Pay** door sales + upgrades **[BB]**

### Phase 4 — Transfers, refunds & trust
- Secure **ticket transfer** flow (claim-link, reissue QR, transfer log, non-transferable lock) **[BB]**
- **Self-service refund/cancel** requests honoring organiser rules + status in My tickets **[BB]**
- **Configurable payouts** (instant for low-risk community events; partial pre-event) *(beat Eventbrite)* **[BB]**
- WhatsApp/Telegram reminders + organiser support channel **[BB]**
- Optional: route a share of platform fees to sadaqah projects *(Humanitix-style differentiator)* **[BB]**

---

## 5. The "beat Eventbrite" thesis (differentiators to lean on)
1. **Lower, transparent fees** + charity/mosque discounts (Eventbrite's #1 complaint is fees)
2. **Faster, configurable payouts** (Eventbrite holds funds; we can pay community events fast)
3. **Halal/gender-aware by default** (prayer space, salah timing vs event start, sisters-only, halal cert level) — Eventbrite can't match relevance
4. **Mobile/WhatsApp-first, no-login ticket access**
5. **Local payments (PayNow)** + culturally literate support during Ramadan/Eid

---

## 6. Immediate next steps (in flight now)
- Ship the **ticket-detail screen** + **mobile-first My tickets rows** (Phase 1)
- **Expand the area filter** to the full SG town/district list
- **Mobile-readiness pass** on the user + owner dashboards
- Then pick the next Phase-1 quick wins (promo codes, ready-to-scan + brightness, halal badges on tickets)

---

## 7. Competitor takeaways — Eventsize (Malaysia, "most affordable RSVP")

Reviewed 2026-06-27 (Perplexity, eventsize.com). Eventsize is a low-fee, WhatsApp-first, local-payments RSVP/ticketing platform for SEA. What's worth taking — and how it maps to our plan:

| Eventsize strength | Take for Humble Halal | Effort |
|---|---|---|
| **All-in single fee** (~4.9% + small fixed, *includes* gateway + WhatsApp/SMS/email); **free events = free** | One transparent all-in fee (e.g. ~4–5% + S$0.20, PayNow + comms included); free community/masjid events 100% free; NGO/masjid discount toggle | QW (pricing/copy) |
| **PayNow** as a first-class SG payment method (they already do it) | **PayNow-first checkout** alongside Stripe cards — the clearest SEA edge vs Eventbrite | BB (PSP integration) |
| **WhatsApp-first** confirmations + automated reminders included in the fee; 1-tap share | WhatsApp share buttons + strong OG previews (QW); WhatsApp Business confirmations/reminders (BB) — SG Muslim communities run on WhatsApp groups | QW → BB |
| **"Request to Join"** approval flow | Approval mode for **sisters-only / limited halaqahs / invite-only circles** — pairs with our gender + prayer fields | QW–medium |
| Organizer **source attribution** (WhatsApp/IG/direct) + CSV broadcast | UTM-style source tags in the organizer dashboard (QW); contact upload + broadcast (BB) | QW → BB |
| QR check-in + **badge printing** + live attendance for big events | "Event Pro" tier: multi-device check-in sync + optional badge printing for Islamic conferences/bazaars | BB |

**Net:** Eventsize validates our differentiators (PayNow, WhatsApp, transparent all-in fees, community simplicity) and surfaces two near-term wins worth pulling forward into Phase 1–2 — **PayNow checkout** and **WhatsApp share + OG previews** — plus **Request-to-Join** for gender-sensitive events.
