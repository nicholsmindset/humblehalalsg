# Humble Halal — Keyword Research v2 (Blog Cluster Expansion)

> **Superseded as the master dataset by [keyword-research-v3.md](./keyword-research-v3.md)**
> (full 1,921-keyword Ahrefs harvest, clustered + coverage-gap-checked, July 2026). v2
> remains valid for its blog-cluster architecture and cannibalisation rules.

*Fresh Ahrefs harvest — Singapore market, July 2026. Supplements the directory-page-focused
[keyword-research.md](./keyword-research.md). This round is **blog-led**: it maps demand into
new editorial clusters, protects existing landing/pSEO pages from cannibalization, and feeds the
content calendar ([content-calendar-v2.md](./content-calendar-v2.md)).*

Raw data: [`docs/seo/keywords/*.csv`](./keywords/) — one file per cluster, 215 keyword rows.
Method: `keywords-explorer-matching-terms` + `site-explorer-organic-keywords` (Ahrefs MCP),
`country=sg`, `volume ≥ 30–100` (SG is a small market so the volume floor is deliberately low),
`order_by volume:desc`. Monetary/units notes live in the MCP server instructions, not here.

---

## 1. Executive summary

Eight demand clusters surfaced. The three biggest **new** editorial opportunities:

1. **Brand "is X halal" checks** — dozens of KD-0 queries at 150–900/mo (`is paris baguette halal`
   900, `is genki sushi halal` 700, `is mos burger halal` 700). Nearly all carry **AI Overview +
   People-Also-Ask** SERP features → prime GEO/AIO targets. Feeds the existing `/is-halal/[brand]`
   pSEO family **and** two blog roundups.
2. **Outbound travel, JB-weighted** — `jb food` 1,000, plus a massive KD-low **JB border/transport**
   layer a competitor (HHWT) ranks page-2 for: `woodlands checkpoint` 44k (KD5), `ets jb to kl` 32k
   (KD3), `tuas checkpoint` 12k, `train from jb to kl` 4.5k. Umrah is the other travel pillar
   (`umrah` 1,500, `umrah package singapore` 200, `umrah vaccination singapore` 200).
3. **Seasonal (Ramadan / Hari Raya / Zakat / Korban)** — enormous, predictable annual demand:
   `hari raya 2026` 36,000, `hari raya haji` 8,800, `iftar` 1,900, `zakat` 1,600, `zakat fitrah 2026`
   3,000, `korban 2026` 300. Must be published ~6 weeks ahead of each peak.

Plus dish-level food gaps (mala, mookata, western, thai, korean bbq, seafood, pizza), a
Muslim-owned **services** cluster (aqiqah, qurban, catering, Malay-wedding vendors, tahlil), and a
long tail of question/definition queries.

## 2. Funnel map

| Stage | Intent | Query shape | Primary surface |
|-------|--------|-------------|-----------------|
| ToFu | informational | `is X halal`, `what is umrah`, `when is hari raya 2026`, `zakat calculator` | **Blog + FAQ + tools** |
| MoFu | commercial | `halal mala singapore`, `muslim friendly bangkok`, `jb halal food`, `aqiqah singapore` | **Blog roundups → directory** |
| BoFu | transactional/local | `halal catering singapore`, `umrah package singapore`, `halal food {area/mall}` | **Landing + pSEO** (not blog) |

## 3. Cluster architecture → target surfaces

| # | Cluster | CSV | Best surface | New blog category |
|---|---------|-----|--------------|-------------------|
| 1 | Brand "is X halal" checks | `01-questions-brand-halal.csv` | `/is-halal/[brand]` pSEO + 2 roundups | `halal-questions` |
| 2 | Definitions / Muslim-life Qs | `01` | Blog FAQ posts | `halal-questions` |
| 3 | Dish-level food | `02-food-dishes.csv` | pSEO cuisine pages (optimize) + new roundups | `cuisines` (existing) |
| 4 | Outbound travel (JB/umrah/cities) | `03-travel-outbound.csv`, `06` | New blog hub + `/travel/*` | `muslim-travel` |
| 5 | Services / catering / wedding | `04-services-catering-wedding.csv` | Landing pages + blog | `muslim-services` |
| 6 | Seasonal (Ramadan/Raya/Zakat/Korban) | `05-seasonal.csv` | `/ramadan` `/hari-raya` (optimize) + blog | `seasonal-events` (existing) |
| 7 | Hawker & markets | `05`, `06` | Fold into area pages + 1–2 posts | `areas-malls` (existing) |
| 8 | Competitor gap (HHWT) | `06-competitor-gap-hhwt.csv` | JB transport post + validate pSEO | `muslim-travel` |

**Four new blog categories** are warranted: `muslim-travel`, `halal-questions`, `muslim-services`,
and `hawker-markets` (the last is optional — hawker demand largely lives inside area terms; ship it
only if we commit ≥3 hawker posts). See §5.

## 4. Priority tiers

- **T1 — build now:** KD ≤ 10 **and** volume ≥ 150. Almost the entire brand-check set, `halal mala`
  600, `halal mookata` 500, `jb food` 1,000, `umrah package singapore` 200, `aqiqah singapore` 200,
  `hari raya haji` 8,800, `zakat fitrah 2026` 3,000, JB transport terms.
- **T2 — next:** KD ≤ 20, volume ≥ 80 (`halal thai food singapore` 450/16, `halal seafood singapore`
  300/11, `muslim friendly honeymoon`).
- **T3 — head/brand, long-game:** KD > 20 (`halal catering singapore` 1,200/52, `hari raya` 7,900/33,
  `what is halal` 250/31) — pursue on landing/hub pages with internal-link support, not fresh blog.

## 5. Cannibalization guard (critical)

Every keyword row in the CSVs carries a `note`/`target` telling whether the blog **creates** or an
existing page gets **optimized**. Rules:

- **Blog owns** informational long-tail, roundups ("best halal X", "is X halal"), and guides.
- **pSEO/landing owns** transactional heads: `/halal-food/{area|mall}`, `/is-halal/[brand]`,
  `/halal/halal-{cuisine}-singapore`, `/halal/halal-catering-singapore`, `/travel/[city]`,
  `/ramadan`, `/hari-raya`. Blog posts **link to** these, never duplicate their target keyword.
- Where a dish already has a pSEO cuisine page (ramen, seafood, thai, dim sum, desserts, mookata,
  bbq, indian, nasi padang), the blog takes a **distinct angle** (roundup / "where to eat" / occasion)
  and points the transactional head at the pSEO page. New dishes with **no** pSEO page (mala,
  korean bbq, western, pizza) can take the head directly on a blog roundup until a pSEO page exists.

## 6. Copy & compliance rules (carried from brand guidelines)

- **Food** may use "halal". **Non-food services** are "Muslim-owned" / "Muslim-friendly", never
  "halal salon/barber/tailor" — MUIS certification is F&B only. The existing
  `muslim-owned-businesses-singapore` post already states this; new services posts must too.
- Every ToFu post leads with the answer-first `answer` TL;DR (AIO unit) and a `faq[]` built from the
  real People-Also-Ask questions captured in cluster 1/2.
- No alcohol/nightlife content anywhere.

## 7. New-page opportunity shortlist (→ content calendar)

| Post | Primary kw | Vol | KD | Category |
|------|-----------|-----|----|----------|
| JB halal food & day-trip guide | jb food / jb halal food | 1,000 | 0 | muslim-travel |
| Crossing to JB: checkpoints & transport | woodlands checkpoint | 44,000 | 5 | muslim-travel |
| Umrah from Singapore: packages, visa, vaccination | umrah package singapore | 200 | 1 | muslim-travel |
| Halal mala guide Singapore | halal mala | 600 | 0 | cuisines |
| Halal mookata guide Singapore | halal mookata | 500 | 0 | cuisines |
| Halal Korean BBQ Singapore | halal korean bbq | 400 | 10 | cuisines |
| Halal Western food Singapore | halal western food singapore | 450 | 4 | cuisines |
| Is [popular chain] halal? (2 roundups) | is paris baguette halal | 900 | 0 | halal-questions |
| Aqiqah in Singapore: full guide | aqiqah singapore | 200 | 0 | muslim-services |
| Qurban / Korban in Singapore 2026 | korban 2026 | 300 | 3 | muslim-services |
| Hari Raya Haji 2026 guide | hari raya haji | 8,800 | 3 | seasonal-events |
| Zakat fitrah 2026: how much & where | zakat fitrah 2026 | 3,000 | 0 | seasonal-events |

## 8. Method notes / limits

- Generic "halal hawker" seeds are thin; hawker volume lives in individual centre names + area
  terms already tracked in `rank-tracker-keywords.csv` — hence hawker folds into `areas-malls`.
- Outbound halal-food-by-city volumes are modest in the SG market (50–100, KD-0). Aggregate them
  into destination guides rather than one-post-per-city.
- Follow-ups not yet harvested (future rounds): full `is * halal` brand mining for pSEO expansion,
  organic-keywords pull on misistr.com / thehalalfoodblog, `volume-by-country` weighting for the
  outbound cities.
