# Humble Halal — Final Dated Content Calendar (starts 26 Jul 2026)

*Reconciles the 90-day calendar (`docs/content-calendar-90day.md`) with everything already
published, turns it into a **dated, one-post-per-day** schedule, and wires it to auto-publishing.
Machine-readable source of truth: **`lib/content-calendar.ts` → `postSchedule`** (61 posts,
2026-07-26 → 2026-09-24). Keyword provenance: `docs/seo/keyword-research-v2.md` + `keywords/*.csv`
and the 90-day doc's Ahrefs pulls.*

## How scheduling works (see the PR / plan for build detail)
1. **Authoring:** each scheduled post is a **Keystatic entry** (`content/posts/<slug>.yaml`) with
   `status: scheduled` and `datePublished` = its slot date. Visible/editable in the Keystatic admin
   (`/keystatic`) the whole time — reschedule by changing the date, or flip to `published`/`draft`.
2. **Go-live:** `lib/cms-blog.ts` date-gates the CMS feed — a `scheduled` post appears on the site
   only once `datePublished <= today` (Asia/Singapore). Future posts stay hidden (and out of the
   sitemap) but remain in the CMS.
3. **Auto-publish:** `.github/workflows/blog-publish.yml` (daily cron) checks whether a post is due
   today and, if so, redeploys production so the SSG blog rebuilds and the due post appears.
4. **Pipeline fill:** `.github/workflows/claude-schedule.yml` (weekly) drafts upcoming `queued` slots
   as scheduled Keystatic entries via PR for owner approval (extends the existing `claude-blog.yml`).

## Reconciliation against what's already live
The 90-day list had 90 topics. After de-duplication:

| Bucket | Count | Action |
|---|---|---|
| **Already published** (pre-existing 21 + my 10) | ~17 topics | Dropped from the schedule (e.g. Jewel, Bugis, dim sum, high tea, breakfast, fine-dining, best-restaurants hub, cafés hub, hotpot, Korean food, MUIS-cert hub, catering, malay-wedding-cost, muslim-owned, mala, mookata, korean BBQ, western, JB food, JB transport, umrah, aqiqah, 2 "is it halal" roundups) |
| **Merged** into an existing post | 2 | "Best Nasi Padang" → nasi-padang guide; "Halal Birthday Cakes" → published cakes/bakeries post |
| **Routed to `/is-halal` pSEO** (not blog) | ~10 | Every `is [brand] halal` topic — Paris Baguette, Genki, MOS, Saizeriya, BreadTalk, KOI, Starbucks, Yoshinoya, Ferrero, Texas Chicken. Expand the `brands` collection / `lib/halal-status.ts`; my 2 blog roundups link down to them |
| **Net-new scheduled posts** | **61** | The dated schedule below / `postSchedule` |

> **Ingredient explainers kept as blog** (not pSEO brand pages): *is kombucha halal*, *is gelatin
> halal*, *is mirin halal*, *no pork no lard vs halal* → category `halal-questions`.

## New category
Added **`prayers-deen`** ("Prayers & Deen") to host the large doa / prayer-times / zakat / qibla /
tasbih / Islamic-calendar cluster (Ahrefs shows these are the richest KD-0 veins: `waktu solat
singapore` 9,000, `doa selepas solat` 5,700, `doa qunut`/`doa dhuha` 3,400 each, `doa buka puasa`
3,100, `doa naik kenderaan` 2,100). Other verticals map to existing hubs (areas-malls, cuisines,
muslim-travel, muslim-services, halal-questions, seasonal-events).

## The schedule (61 posts · 1/day · 2026-07-26 → 2026-09-24)
Full dated list with volume/KD/template/category lives in `lib/content-calendar.ts` (`postSchedule`)
— that is the source the automations read. First fortnight (launch run):

| Date | Post | Primary kw (vol/KD) | Category | Status |
|---|---|---|---|---|
| 26 Jul | Waktu Solat Singapore | waktu solat singapore (9,000/0) | prayers-deen | **seeded** |
| 27 Jul | Doa Selepas Solat | doa selepas solat (5,700/1) | prayers-deen | **seeded** |
| 28 Jul | Halal Food in Orchard Road | orchard halal food (1,000/0) | areas-malls | **seeded** |
| 29 Jul | Mediterranean (Halal-Friendly) | mediterranean food singapore (1,200/1) | cuisines | **seeded** |
| 30 Jul | Halal Food at Suntec & Marina Sq | suntec halal food (1,300/0) | areas-malls | **seeded** |
| 31 Jul | Halal Food Near Me (hub) | halal food near me (15,000/19) | areas-malls | queued |
| 1 Aug | Doa Buka Puasa & Niat Puasa | doa buka puasa (3,100/0) | prayers-deen | queued |
| 2 Aug | Halal Food at VivoCity | vivocity halal food (1,400/4) | areas-malls | queued |
| 3 Aug | Nasi Padang guide | nasi padang singapore (700/3) | cuisines | queued |
| 4 Aug | Malay Wedding: customs & checklist | malay wedding (450/0) | muslim-services | queued |
| … | *(51 more through 24 Sep — see `postSchedule`)* | | | queued |

The **5 seeded** posts (26–30 Jul) exist as Keystatic entries now so the launch run is covered before
the weekly drafter's first PR. Every post carries the 90-day doc's GEO checklist (answer-first TL;DR,
PAA→FAQ H3s, tables where relevant, `Article`+`FAQPage` schema — already emitted by
`app/blog/[slug]/page.tsx`, author + `datePublished`/`dateModified`) and links into the directory /
pSEO pages via `BlogSection.links` (never re-targeting a linked page's transactional head).

## Owner setup for full automation
- Repo **secrets/vars**: `VERCEL_TOKEN` (daily redeploy), `ANTHROPIC_API_KEY` + `CLAUDE_JOBS_ENABLED=1`
  (weekly drafter). The date-gate, the seeded posts and the calendar work without these; only the two
  automations need them.
- Re-verify a sample of volumes in Ahrefs before launch if go-live slips materially (the 90-day data
  is 18 Jun 2026; the v2 clusters were re-pulled 18 Jul 2026).
