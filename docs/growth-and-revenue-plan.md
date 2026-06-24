# Humble Halal — Growth & Revenue Plan

**Last updated:** 2026-06-19 · **Status:** pre-launch (monetization flags default OFF)
**Currency:** SGD unless noted. Travel commission is earned in the booking currency (often USD).

> Every unit-economics figure here traces to code already in the repo — `lib/plans.ts`,
> `lib/fees.ts`, `components/screens/advertise.tsx`. The only estimated input is **audience**,
> because the platform is pre-launch with no live traffic yet. Treat the dollar figures as
> illustrative ranges driven by traffic, not forecasts.

---

## 1. Executive summary

Humble Halal has five built revenue streams (directory subscriptions, ads, events, travel,
newsletter). On the **consumer platform alone**, the business scales to roughly **$600k ARR**
at ~250k visits/mo. The ceiling is set by audience size and small ticket values.

The step-change is **onnifyworks** (your agency). The directory is a continuous feed of
qualified B2B leads — halal SMBs that need websites, SEO, social, and ads management. Agency
ACV is 50–100× a directory subscription, so even a 2–3% lead-to-retainer conversion **roughly
doubles the ceiling to ~$1M+ ARR** at scale, at far higher margin.

**The one lever that moves everything is traffic.** All five consumer lines and the agency
funnel are downstream of audience. The monetization surface is already built; the work is growth.

---

## 2. Unit economics (per the code)

| Stream | Mechanism | Price / take-rate | Source file | Flag |
|---|---|---|---|---|
| Directory — Verified | Subscription | $19/mo · $190/yr | `lib/plans.ts` | `PAID_PLANS_ENABLED` |
| Directory — Featured | Subscription | $49/mo · $490/yr | `lib/plans.ts` | `PAID_PLANS_ENABLED` |
| Directory — Premium | Subscription | $99/mo · $990/yr | `lib/plans.ts` | `PAID_PLANS_ENABLED` |
| Ad — Homepage Spotlight | Placement | $450/mo | `advertise.tsx` | `PAID_ADS_ENABLED` |
| Ad — Category Sponsorship | Placement | $300/mo | `advertise.tsx` | `PAID_ADS_ENABLED` |
| Ad — Newsletter Sponsorship | Per send | $250/send | `advertise.tsx` | `PAID_ADS_ENABLED` |
| Ad — Event Promotion | Per event | $120/event | `advertise.tsx` | `PAID_ADS_ENABLED` |
| Ad — Featured Listing (ad) | Placement | $89/mo | `advertise.tsx` | `PAID_ADS_ENABLED` |
| Events — ticketing | Booking fee | **5% + $0.50/ticket** | `lib/fees.ts` | `PAID_TICKETS_ENABLED` |
| Travel — hotels | LiteAPI commission | ~8% typical (LiteAPI sets) | `app/api/travel/book` | `PAID_HOTELS_ENABLED` |
| Travel — flights | LiteAPI commission | thin | `app/api/travel/flights/book` | `PAID_FLIGHTS_ENABLED` |
| Newsletter | Audience asset | monetized via $250/send sponsorship | `app/api/subscribe` | — |

**Notes:**
- Ads are your **own direct-sold** sponsorship system, not AdSense — 100% margin.
- Events: you hold buyer funds and pay the organiser the face value 24h post-event via Stripe
  Connect; you keep the booking fee as commission.
- Travel: **LiteAPI is merchant of record**, so commission is clean income with no payment risk.
- Cert Vault is bundled into Verified ($19), not sold separately — it's a trust play.

---

## 3. Revenue at three audience milestones (consumer platform)

Assumptions: blended directory ARPU ~$36–40/mo (mix 60% Verified / 30% Featured / 10% Premium);
hotel commission ~$48/booking ($600 avg × ~8%); event fee ~$160–250/event.

| Stream | A — Early (~5k visits/mo) | B — Growth (~50k/mo) | C — Scale (~250k/mo) |
|---|---|---|---|
| Directory | $1,800 | $7,600 | $24,000 |
| Ads | ~$700 | ~$4,000 | ~$12,000 |
| Events | $320 | $1,600 | $5,000 |
| Travel | $384 | $2,000 | $10,400 |
| **Monthly** | **~$3.2k** | **~$15.2k** | **~$51.4k** |
| **ARR** | **~$38k** | **~$182k** | **~$617k** |

Rough audience proxies for each milestone: ~1k / ~10k / ~40k newsletter subscribers and
~50 / ~200 / ~600 paid listings.

---

## 4. The agency layer — onnifyworks (the ceiling-changer)

The four consumer streams top out near $600k ARR. As the **top-of-funnel for onnifyworks**,
the economics flip:

- Every halal business in the directory is an SMB that needs what the agency sells — websites,
  SEO, social, ads management, branding.
- A claimed / Verified listing is a **warm, qualified B2B lead** with contact info, category,
  location, and engagement signals already captured.
- Agency ACV is **50–100×** a directory sub: a web build is $2k–5k one-time; a retainer is
  $500–2k/mo.

**Illustrative agency revenue at each milestone** (2–3% of engaged businesses → retainer,
plus one-off project work):

| | A — Early | B — Growth | C — Scale |
|---|---|---|---|
| Agency retainers | 2–3 clients | 5–10 clients | 25–40 clients |
| Agency monthly | ~$2.5k–4k | ~$7.5k–12.5k | ~$30k–50k |
| **Agency ARR** | **~$30k–48k** | **~$90k–150k** | **~$360k–600k** |

### Combined ceiling (consumer + agency)

| | A — Early | B — Growth | C — Scale |
|---|---|---|---|
| Consumer ARR | ~$38k | ~$182k | ~$617k |
| Agency ARR | ~$30k–48k | ~$90k–150k | ~$360k–600k |
| **Combined ARR** | **~$70k–90k** | **~$280k–330k** | **~$1.0M–1.2M** |

**Strategic framing:**
- **Consumer platform** = the moat, the audience, the data, the credibility. Largely self-funding.
- **onnifyworks agency** = where the real margin lives, fed qualified leads at near-zero CAC.

**Natural product addition — a lead-routing layer:** when a business claims/upgrades a listing,
or shows high engagement (many profile views, no website on file), flag it into onnifyworks as a
lead. `onnifyworks@gmail.com` is already slated for admin access, so the connection exists.

---

## 5. The growth engine (the only lever that matters)

Revenue is downstream of audience. The three engines already built:

1. **SEO programmatic pages** — malls / cuisines / districts, seasonal hubs (`/ramadan`,
   `/hari-raya`). See `docs/seo/keyword-research.md`. This is the compounding organic flywheel.
2. **`/tools` hub** — ~19 Deen tools + 114 Quran surah pages. High-intent, repeat-visit, shareable
   — top-of-funnel that also builds newsletter subs.
3. **Newsletter (MailerLite)** — the audience asset. Directly monetized via $250/send
   sponsorships, but its real job is to convert one-time SEO/tool traffic into a returning,
   addressable audience that lifts every other line.

**Priority:** invest in traffic, not more monetization surface. You already have plenty of surface.

---

## 6. Staged paid-flag rollout

Every paid flag defaults OFF. Enable in this order — easiest → hardest operational risk. Full
runbook: `docs/runbooks/paid-flag-rollout.md`.

| Stage | Stream | Env var | Why this order |
|---|---|---|---|
| 1 | Directory | `PAID_PLANS_ENABLED` | Pure Stripe subs, no payouts, lowest risk; the trust layer. |
| 2 | Ads | `PAID_ADS_ENABLED` | Direct-sold, 100% kept — but needs traffic first. |
| 3 | Events | `PAID_TICKETS_ENABLED` | Holds buyer funds + Connect payouts; more moving parts. |
| 4 | Travel | `PAID_HOTELS_ENABLED` → `PAID_FLIGHTS_ENABLED` | Highest ceiling, most deps; flights need Vercel Pro. |

---

## 7. Example scenario — "20k subs + Ramadan season"

A scenario model points the same machinery at a concrete situation so you can plan cash and
inventory. Inputs: 20k newsletter subs, Ramadan/Hari Raya peak.

- **Newsletter** → multiple sponsors per send at $250–500 each.
- **Events** → seasonal spike to 20–40 events/mo (bazaars, classes, iftars) vs. ~6 baseline.
- **Travel** → Umrah / holiday hotel-booking surge.
- **Directory** → businesses upgrade to Featured to catch seasonal traffic.

Provide the exact inputs (subs, traffic, season length) and the live dashboard (§8) turns this
into a month-by-month P&L with the cash concentration points.

---

## 8. Execution status & roadmap

**Already shipped (this build):**
- ✅ **Live revenue dashboard** — admin **Revenue (P&L)** tab unifying subscriptions (MRR),
  event fees, ad orders, and travel commission into one SGD view, with a 6-month trend.
  Route: `app/api/admin/revenue/route.ts`. Live at `/admin`.
- ✅ **Staged rollout view** — admin **Rollout plan** tab showing the stage order, prerequisites,
  and live/off status, backed by `docs/runbooks/paid-flag-rollout.md`.

**Next, in order of leverage:**
1. **Grow traffic** — double down on SEO programmatic pages, the tools hub, and newsletter capture.
   Everything else is downstream.
2. **Stage 1 go-live** — set `PAID_PLANS_ENABLED=1`, wire Stripe price IDs; directory MRR begins.
3. **Lead-routing to onnifyworks** — flag high-intent/claimed listings as agency leads
   (the highest-margin expansion).
4. **Ads, then Events, then Travel** — per the staged rollout as audience and trust grow.

---

## 9. Assumptions & caveats

- **Pre-launch:** no live traffic; audience figures are illustrative milestones, not forecasts.
- **FX:** travel commission is earned in the booking currency (often USD); the dashboard shows an
  *approximate* SGD conversion (fixed table in `app/api/admin/revenue/route.ts`) — not for accounting.
- **Sources of truth:** Stripe (subscriptions, ad/ticket charges, payouts) and LiteAPI (travel
  payouts) are authoritative; the in-app P&L is a reconciliation / at-a-glance view.
- **Agency figures** are directional — they depend on sales execution, not just listing volume.
