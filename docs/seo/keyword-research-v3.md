# Humble Halal — Keyword Research v3 (Full Ahrefs Matching-Terms Harvest)

*Singapore market. Source: full Ahrefs **Matching terms** export for the `halal`
seed — **1,921 keywords, 298,740 total monthly SV** (`country=sg`, pulled 2026-07-18).
Raw file: [`docs/seo/keywords/v3-master-clustered.csv`](./keywords/v3-master-clustered.csv)
(every keyword with volume, KD, CPC, traffic potential, intent, SERP features,
12-mo growth, opportunity score and its cluster).*

This supersedes the earlier passes as the **master dataset**:
- [keyword-research.md](./keyword-research.md) — original directory/pSEO plan.
- [keyword-research-v2.md](./keyword-research-v2.md) — blog-cluster expansion (215 rows).
- **v3 (this doc)** — the complete 1,921-keyword universe, clustered end-to-end,
  cross-checked against **live page coverage** to separate "optimise what we have"
  from "genuine gap". Feeds guides, pSEO tuning and the blog calendar.

Monetary values in the CSV are USD (CPC). Units convention lives in the Ahrefs MCP
server instructions, not here.

---

## 1. Executive summary

The Singapore "halal" universe is **298,740 SV across 1,921 keywords** — and it is
astonishingly **low-difficulty**: ~78% of all search volume sits at **KD ≤ 10**.
This is a market you win with *coverage and structure*, not with domain authority.

Rolled into seven addressable themes:

| Theme | # kw | Total SV | SV at KD ≤ 10 | Primary surface |
|-------|-----:|---------:|--------------:|-----------------|
| **A. Local food discovery** (area / mall / near-me) | 392 | **90,900** | 75,920 | pSEO location factory + blog roundups |
| **B. Brand & product halal-status checks** | 397 | **50,640** | 47,810 | `/is-halal/[brand]` pSEO |
| **C. Cuisine & dish demand** | 340 | **59,370** | 30,710 | pSEO cuisine pages + blog |
| **D. Catering / events / weddings** | 194 | **31,890** | 10,770 | Landing hubs + guides |
| **E. Muslim travel** (JB / destinations) | 68 | 8,290 | 6,370 | `/travel/*` + guides |
| **F. Certification / trust** | 53 | 7,210 | 5,080 | Cert hubs + FAQ/GEO |
| **G. Food delivery** | 18 | 2,190 | 1,910 | Delivery hub / blog |

*(Themes overlap the 25 raw clusters in §3; ~48k of residual head/long-tail SV — e.g.
bare `halal food` 3.7k, `halal` 2.7k — sits outside these rollups.)*

**The three highest-leverage moves:**

1. **Scale the two pSEO factories that are already winning.** `/halal-food/[location]`
   and `/is-halal/[brand]` between them address **~141k SV at near-zero KD**, and we
   already rank because the templates exist. The data reveals **~20 malls/areas and
   ~150 brands with real demand and no page yet** (§4.1, §4.2). This is the single
   biggest, cheapest win — pure template fan-out, no new writing model.

2. **Own the "is X halal" answer box for GEO/AIO.** 108 keywords (incl. nearly the
   entire brand-check set) trigger **AI Overviews / PAA**. These are KD-0 and
   citation-hungry — the fastest route to being *the* cited halal source in Singapore.

3. **Build the evergreen guides that convert dish/occasion demand.** Cuisine, dessert,
   catering and travel demand is large but partly uncovered by *guide-shaped* content
   (roundups, "best", occasion). These become the lead-magnet + internal-link engine
   feeding the transactional pSEO/landing pages.

---

## 2. Method & dataset

- **Seed:** `halal` → Ahrefs Keywords Explorer *Matching terms*, `country=sg`.
- **Rows:** 1,921 (full export, no volume floor — SG is a small market so the tail matters).
- **Clustering:** rule-based, 25 clusters → 7 themes. First-match-wins regex over the
  keyword string, with a Singapore place/mall gazetteer for local routing and the live
  brand list for status-check routing. Script + rules are reproducible; the clustered
  output is committed as the CSV above.
- **Scoring:** `opportunity = log10(max(vol, tp·0.5)+10)·100 · (1 − min(KD,80)/110)`.
  Rewards reachable volume, penalises difficulty. Sort the CSV by `opportunity` for a
  ready-made build queue.
- **Coverage cross-check:** clusters matched against the **live** route inventory —
  42 area/venue pSEO pages (`lib/seo-pages.ts`), 56 `/is-halal` brands
  (`lib/halal-status.ts`), 22 cuisine pages, the catering/wedding/seasonal landing
  hubs, and 19 blog posts — to label each opportunity **Covered / Optimise / Gap**.

---

## 3. Cluster map (25 clusters, whole universe)

| Cluster | # kw | Total SV | Avg KD | SV @ KD≤10 | Status vs. site |
|---------|-----:|---------:|-------:|-----------:|-----------------|
| Location / mall / area local (pSEO) | 301 | 53,480 | 0.6 | 53,430 | **Optimise + fan out** |
| General head + misc long-tail | 452 | 46,970 | 3.8 | 37,790 | Head terms → hubs |
| Brand "is X halal" checks | 351 | 46,120 | 1.5 | 44,270 | **Optimise + fan out** |
| Halal food near me / general local | 91 | 37,420 | 9.8 | 22,490 | Covered (hub) |
| Catering / buffet / event food | 184 | 30,820 | 16.6 | 10,100 | Covered — deepen |
| Dessert / cake / bakery / café | 174 | 29,690 | 13.4 | 12,540 | **Gap (guides)** |
| Cuisine — Western / steak / burger | 62 | 9,870 | 11.0 | 5,580 | Covered — optimise |
| Cuisine — Chinese / dim sum / steamboat | 43 | 8,970 | 5.7 | 4,730 | Covered — optimise |
| Muslim travel — destinations | 49 | 6,290 | 3.9 | 4,870 | Partial — guides |
| Halal certification / MUIS | 48 | 5,910 | 7.4 | 4,980 | Covered — GEO |
| Cuisine — Japanese / sushi / ramen | 24 | 4,830 | 7.6 | 3,730 | Covered — optimise |
| Groceries / snacks / products / meat | 28 | 2,970 | 13.4 | 1,990 | **Gap** |
| Cuisine — Thai / mookata | 10 | 2,280 | 4.7 | 1,770 | Covered |
| Food delivery / online order | 18 | 2,190 | 7.1 | 1,910 | **Gap** |
| Muslim travel — JB / Malaysia | 19 | 2,000 | 4.6 | 1,500 | Partial |
| Ingredients / additives / haram check | 18 | 1,550 | 0.2 | 1,550 | **Gap (guide/tool)** |
| Definitions / concepts | 5 | 1,300 | 18.4 | 100 | Covered — GEO |
| Buffet / hi-tea / all-you-can-eat | 5 | 1,210 | 0.0 | 1,210 | Covered — deepen |
| Cuisine — Seafood | 6 | 1,200 | 8.2 | 350 | Covered |
| Malay wedding / nikah / bridal | 10 | 1,070 | 10.8 | 670 | Covered (deep) |
| Umrah / Hajj / ziarah | 4 | 1,060 | 0.2 | 1,060 | Partial |
| Cuisine — Middle Eastern / Mediterranean | 8 | 620 | 8.6 | 360 | **Gap** |
| Cuisine — Indian / prata / biryani | 5 | 490 | 6.4 | 230 | Covered |
| Hari Raya / Aidilfitri / Aidiladha | 3 | 220 | 0.0 | 220 | Covered (seasonal) |
| Cuisine — Korean | 3 | 210 | 2.0 | 210 | Covered — optimise |

> Note: destination/cuisine tokens overlap (e.g. `halal korean food singapore` routed to
> *travel* on the "korea" token). Treat Korean/Japanese demand as **cuisine** — it is large
> (Korean ~1.6k across forms, Japanese ~1.4k) and near-zero KD; see §5.3.

---

## 4. Gap analysis — the concrete build queue

### 4.1 Location pSEO gaps (`/halal-food/[location]`) — **~4,500 SV, KD 0–1, uncovered**

The factory has 42 area/venue pages. These **high-demand places have no page** (all KD 0–1,
strong local intent). Each is a template clone — add to `areas`/`venues` in `lib/seo-pages.ts`:

| Place | SV (summed forms) | Type |
|-------|------------------:|------|
| ION Orchard | 440 | Mall |
| Marina Bay Sands (MBS) | 430 | Landmark/mall |
| Parkway Parade | 390 | Mall |
| Downtown East | 350 | Lifestyle hub |
| Raffles City | 340 | Mall |
| Star Vista | 300 | Mall |
| City Hall | 300 | MRT/district |
| Chinatown | 250 | District |
| Tanjong Pagar | 200 | District |
| Maxwell Food Centre | 200 | Hawker |
| HarbourFront | 200 | MRT/mall |
| Somerset | 240 | MRT/district |
| Great World City | ~140 | Mall |
| Hillion Mall | 150 | Mall |
| Junction 8 | 150 | Mall |
| Tiong Bahru Plaza | 150 | Mall |
| Toa Payoh | 100 | District |
| Wisma Geylang Serai | 100 | Cultural hub |
| Esplanade | 80 | Landmark |
| Raffles Place | 150 | District |

Plus a **hawker-centre sub-factory** signal: `maxwell food centre halal`,
`wisma geylang serai halal food`, `halal food` + hawker terms — the `/hawker/[centre]`
route already exists; ensure Maxwell, Geylang Serai, and top hawker centres are seeded.

### 4.2 Brand-check gaps (`/is-halal/[brand]`) — **~20,000 SV across ~150 brands, ~all KD 0–2**

56 brands are covered. The export contains **~150 more brands/products with live
`is X halal` / `X halal` demand and no page**. Top gaps (summed forms):

| Brand / product | SV | | Brand / product | SV |
|-----------------|---:|-|-----------------|---:|
| Potato Corner | 700 | | Luckin Coffee | 200 |
| Monster Curry | 600 | | Haagen-Dazs | 200 |
| Chick-fil-A | 510 | | Lindt (chocolate) | 200 |
| Namu Bulgogi | 400 | | White Rabbit candy | 200 |
| Oriental Kopi | 290 | | Josh Grill | 200 |
| Each-a-Cup | 290 | | Mixue | 180 |
| Royce Chocolate | 250+ | | IKEA (menu) | 370 |
| Butter & Cream bakery | 250 | | Lotteria | 170 |
| PlayMade | 240 | | Sushi Tei / Sushi Express | 240 |
| iTea | 210 | | Pastamania | 150 |
| Hi-Chew | 200 | | Poulet / Soup Spoon / Grain | 450 |
| TWG (tea) | 200 | | Heavenly Wang, Toast Box, Paul | 430 |
| Bob the Baker Boy | 200 | | Astons | 120 |

**Ingredient/concept checks** ride the same template with an *ingredient* variant:
`halal pork` 400, `halal gelatin`/`gelatin halal` 140, `emulsifier 471/322 halal`,
`e322/e330/e471/e621 halal`, `halal wine`, `halal mirin`, `plain vanilla halal` — these
are KD-0 GEO magnets and feed an **ingredient checker** (a `/tools/ingredient-checker`
route already exists — wire these E-numbers into it and interlink).

> **Trending brands to ship first** (12-mo growth): `is chagee halal` +57% (600),
> `namu bulgogi halal` +72% (400), and the **Kintamani (halal-certified)** entity cluster
> (`kintamani restaurant (halal-certified)` 500 +98%, `…menu` 450 +122%, `…reviews` 350 +102%)
> — a certified restaurant with a surging branded SERP we should capture with a directory
> listing + FAQ.

### 4.3 Cuisine gaps & optimisations

Mostly covered by the 22 cuisine pages, but the data shows **guide-shaped demand** the
transactional pages don't serve, plus a few missing cuisines:

- **Missing cuisine pages:** Middle Eastern / Turkish / Mediterranean (`halal mediterranean
  food singapore`, `halal turkish restaurant singapore`, `halal turkey singapore` 150),
  Vietnamese (`halal vietnamese food`, `eminami halal vietnam`), Peranakan
  (`halal peranakan food singapore` 150), Italian (`halal italian restaurant singapore` 200),
  Tacos/Mexican (`halal tacos singapore` 150).
- **Korean/Japanese under-monetised:** `halal korean food` 600, `halal korean bbq` 400,
  `halal japanese food` 400, `halal japanese restaurant singapore` 350 — pages exist;
  strengthen titles/H1s to the exact `halal {cuisine} food/restaurant singapore` head and
  add a "near me" + roundup blog above them.

### 4.4 Dessert / café — **Gap (biggest un-guided cluster: 29,690 SV)**

Huge, low-KD, and **not owned by guide content**: `halal cafe near me` 800,
`halal mooncake` 450, `halal dessert near me` 450, `halal cookies singapore` 400,
`halal chocolate singapore` 400, `halal cake delivery singapore` 400, `halal ice cream
singapore` 200, `halal cheesecake`, `halal brownies singapore`, `halal bubble tea`.
The `dessert`/`cakes` cuisine pages exist but the **café, mooncake, chocolate, ice-cream,
cookies and cake-delivery** sub-demand needs dedicated guides/roundups (§5).

### 4.5 Other gaps

- **Food delivery** (`/halal-food-delivery-singapore` hub): 2,190 SV, no dedicated hub.
- **Groceries / snacks / meat supplier**: 2,970 SV (`halal meat singapore`, `halal snacks`,
  frozen, butcher) — a directory category + guide.
- **Seasonal / occasion food**: `halal christmas food/catering` (~450), `halal cny
  cookies/goodies` (~350), `halal yusheng` 250, `halal mooncake` — occasion guides timed
  to the calendar.

---

## 5. What to build — deliverables

### 5.1 pSEO factory expansion (highest ROI, do first)
1. **Add ~20 locations** to `lib/seo-pages.ts` (§4.1). Respect the `AREA_INDEX_MIN=3`
   gate — seed real listings first so they index.
2. **Add ~40–60 top brands** to `lib/halal-status.ts` (§4.2), prioritising trending +
   KD-0 highest-SV. Each needs a verified status + `lastChecked` source.
3. **Wire E-number/ingredient checks** into `/tools/ingredient-checker` and interlink from
   brand pages.

### 5.2 New guides (evergreen, lead-magnet + internal-link hubs)
| Guide | Target head term(s) | SV | KD |
|-------|--------------------|---:|---:|
| Best Halal Cafés in Singapore | `halal cafe near me`, `halal cafes singapore` | 1,200 | 0–11 |
| Halal Dessert Guide (ice cream, cakes, chocolate) | `halal dessert singapore`, `halal chocolate singapore` | 1,600 | 0–8 |
| Halal Mooncake Guide (seasonal) | `halal mooncake`, `halal mooncake singapore` | 700 | 0–3 |
| Halal Cake Delivery & Birthday Cakes | `halal cake delivery singapore`, `halal birthday cake` | 900 | 0–41 |
| Halal Korean / Korean BBQ Guide | `halal korean food`, `halal korean bbq` | 1,600 | 0–26 |
| Halal Japanese Food Guide | `halal japanese food/restaurant` | 1,400 | 0–29 |
| Halal Buffet 1-for-1 & Hi-Tea Guide | `best halal buffet`, `1-for-1 halal buffet` | 1,500 | 0–37 |
| Halal Mini-Buffet & Small-Party Catering | `halal mini buffet`, `catering for 20/30 pax` | 1,500 | 0–15 |
| Is It Halal? Ingredient & E-Number Guide | E-numbers, gelatin, mirin, alcohol | 1,500 | 0 |
| Muslim-Friendly [JB / Bangkok / Bali / Seoul] | destination + JB transport | 2,000+ | 0–5 |

### 5.3 Blog topics (roundups & questions — link *down* to pSEO/landing, never duplicate)
- **Brand roundups (GEO/AIO):** "Is Paris Baguette / Genki / MOS Burger / Chagee Halal?"
  explainers + "50 Halal Fast-Food & Café Brands in Singapore (2026)" hub feeding
  `/is-halal/[brand]`.
- **Occasion/seasonal:** Halal Christmas catering, Halal CNY cookies & yusheng, mooncake.
- **"Best halal {cuisine}" roundups** for each cuisine page (distinct angle from the
  transactional page): western/steak, chinese/dim sum, seafood, thai/mookata, mediterranean.
- **Local roundups** for the new location pages ("Halal Food at ION Orchard / MBS / Parkway
  Parade").
- **Definitions/GEO FAQ:** `halal meaning` 600, `what is halal`, `halal logo` 650,
  `halal certified` — one authoritative explainer + FAQ schema.

### 5.4 Tools
- Extend `/tools/ingredient-checker` with the E-number set (§4.2).
- Surface `halal logo` / `halal certified` demand on the certification hubs with schema.

---

## 6. Priority tiers

- **T1 — build now (KD ≤ 5, high SV, template or guide):** all location gaps (§4.1),
  trending + top-SV brand gaps (§4.2), ingredient/E-number checks, café/dessert/mooncake
  guides, Korean/Japanese cuisine optimisation, brand-check GEO roundups.
- **T2 — next (KD ≤ 20):** mini-buffet/catering guides, Middle-Eastern/Vietnamese/Peranakan
  cuisine pages, delivery hub, groceries/meat category, destination travel guides.
- **T3 — head/authority long-game (KD > 20):** `halal catering singapore` (52),
  `best halal buffet in singapore` (37), `halal birthday cake` (41), `halal meaning` (15) —
  win on the hub/landing pages with internal-link support and freshness, not fresh thin pages.

---

## 7. Cannibalisation guard (unchanged from v2 — still binding)

- **pSEO/landing owns transactional heads:** `/halal-food/{area|mall}`,
  `/is-halal/[brand]`, `/halal/halal-{cuisine}-singapore`, `/halal-catering-singapore`,
  `/travel/[city]`, `/ramadan`, `/hari-raya`. Blog/guides **link to** these — never target
  the same head.
- **Blog/guides own** informational long-tail, "best/roundup", "is X halal", occasion and
  question queries.
- Where a dish already has a pSEO cuisine page, the guide takes a **distinct angle**
  (roundup / "where to eat" / occasion / "near me").
- One primary head term per URL; map every new page to its head in the CSV before building.

---

## 8. Reproducing / extending this dataset

Master CSV: [`docs/seo/keywords/v3-master-clustered.csv`](./keywords/v3-master-clustered.csv).
Sort by `opportunity` for a build queue; filter `cluster` for a theme; filter
`serp_features` contains "AI Overview" for GEO targets; filter `growth_12mo` for
trend-led picks. To refresh, re-export Ahrefs *Matching terms* for `halal` (`country=sg`)
and re-run the clustering rules; add net-new places to the gazetteer and net-new brands to
the covered-brand list so the Covered/Gap split stays accurate.
