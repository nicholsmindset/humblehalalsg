# Humble Halal — 90-Day Blog Content Calendar (Keyword-Mapped, GEO-Optimized)

| | |
|---|---|
| **Status** | Ready to execute — **hold until site build is complete**, then start Day 1 |
| **Window** | 90 days, one post/day (template dates: Fri 19 Jun → Wed 16 Sep 2026 — shift to your actual go-live; the day order stays the same) |
| **Post length** | 1,500–2,000 words each |
| **Keyword data** | 100% real Ahrefs returns (Keywords Explorer, country = `sg`), pulled 18 Jun 2026 |
| **Market** | Singapore · Muslim / halal-conscious audience |
| **Optimized for** | Google organic + **AI Overviews / AI Mode** citations (GEO) |

> **Note on timing:** This calendar will not roll out until the site is completed. When you go live, keep the **Day 1 → Day 90 order** exactly as below (it front-loads the easiest, highest-volume wins) and simply re-date Day 1 to your launch date. Re-verify a sample of keyword volumes/KD in Ahrefs before launch if the go-live slips more than ~3 months, since search volumes drift.

## Table of Contents

1. [Strategy Summary](#1-strategy-summary)
2. [Header-Tag Keyword Templates](#2-header-tag-keyword-templates-the-each-h-tag--a-keyword-system)
3. [Pillar / Internal-Linking Map](#3-pillar--internal-linking-map)
4. [The 90-Day Calendar](#4-the-90-day-calendar-one-postday--evergreen)
5. [Deferred Seasonal Schedule](#5-deferred-seasonal-schedule-publish-6-weeks-pre-peak--not-in-this-window)
6. [Feature-Image Prompts (OpenAI)](#6-feature-image-prompts-openai-gpt-image-1--dalle)
7. [How to Use This Calendar](#7-how-to-use-this-calendar)
8. [Verification](#8-verification)

---

## Context

humblehalal.com is a Singapore halal & Muslim-owned directory with a live blog (24 posts in [lib/blog.ts](lib/blog.ts)), a templated editorial calendar ([lib/content-calendar.ts](lib/content-calendar.ts)), and programmatic SEO pages ([lib/seo-pages.ts](lib/seo-pages.ts)). The goal: a 90-day, one-post-per-day push (1,500–2,000 words each) to drive organic traffic, with every topic backed by **real Ahrefs keyword data** (not guesses) and structured to win **Google AI Overviews / AI Mode** citations.

**The single most important fact (verified live via Ahrefs Site Explorer, 18 Jun 2026):**
> humblehalal.com currently has **0 organic keywords and 0 organic traffic** in Ahrefs' SG index. It is a **zero-authority domain**.

This dictates the entire strategy: **flood the calendar with KD 0–6 long-tail wins** to build topical authority from scratch. A handful of higher-KD "pillar/hub" pages are woven in to anchor internal linking, but the bulk must be near-zero difficulty so a new domain can actually rank without backlinks.

**Scope notes:** (1) The window is **evergreen-only** — the template dates sit *after* Ramadan/Hari Raya/Hari Raya Haji 2026, so seasonal cornerstone pieces are listed in a separate pre-season schedule (§5) to publish ~6 weeks before their 2027 peaks. (2) Because rollout waits on site completion, treat the dates as relative (Day 1 = launch day).

**Data provenance:** Keyword research was run by 8 parallel sub-agents (one per vertical) each querying the Ahrefs MCP (`keywords-explorer-*`, country=`sg`) — cuisine, food-format, location, certification/"is-X-halal", Deen tools, lifestyle/services, travel, seasonal. All volume/KD/intent values below are actual Ahrefs returns.

---

## 1. Strategy Summary

- **Attainability first.** ~80% of the 90 posts target **KD 0–6** with real SG volume. Pillars (KD 14–24) are spaced ~one per 1.5 weeks to scaffold internal links.
- **Vertical balance across 90 days:** Location/mall food (~16) · "Is X halal" + cert (~16) · Food format/occasion (~14) · Cuisine (~14) · Deen tools (~12) · Lifestyle/services (~12) · Travel (~9), pillars interleaved.
- **Front-load the biggest KD-0 wins** (Weeks 1–4) for early momentum + two hub pages early so later posts have authoritative internal-link targets.
- **Singapore-language nuance:** the **Malay "doa" cluster** (doa selepas solat 5,700/KD1, doa buka puasa 3,100/KD0, doa qunut 3,400/KD1) and **mall-name food queries** (Jewel, VivoCity, Suntec, Jurong Point/JEM/Westgate/IMM) are the richest low-KD veins — leaned into heavily.
- **MUIS compliance:** "Is X halal" posts state Humble Halal's own verified assertion + **deep-link to the MUIS register** — never scrape it (per project posture).

### GEO / AI-Overview tactics (applied to every post)
Per the GEO checklist, each post must include:
1. **Question-based H1** where natural (matches AI query phrasing).
2. **40–60 word extractable TL;DR answer** directly under H1 (the "answer box" AI Overviews lift).
3. **FAQ section** using the post's real People-Also-Ask questions as **H3 questions**, each with a 2–3 sentence direct answer.
4. **Comparison tables / lists** for any "best of" or multi-option content (structured, easily extracted).
5. **"Last updated [date]" + named author with credentials** (e.g., "Reviewed by the Humble Halal halal-verification team").
6. **Schema:** `Article` + `FAQPage` (+ `ItemList` for roundups, `DefinedTerm` for explainers, `HowTo` for tools) — extends the existing JSON-LD pattern in [lib/blog.ts](lib/blog.ts).
7. **Cite authorities** (MUIS, brand official statements) with outbound links — authority signal for RAG retrieval.

---

## 2. Header-Tag Keyword Templates (the "each H-tag → a keyword" system)

Rather than repeat an H-map for all 90 posts, every topic maps to **one of 7 reusable templates**. Each template fixes which keyword each header tag targets, so AI engines see a clean entity/keyword hierarchy. In the calendar (§4) each post lists its template number + its specific primary/cluster/PAA keywords that slot into these slots.

**T1 — "Is X Halal?" check** (informational; AI-overview prime)
- `H1`: *Is [Brand] Halal in Singapore? (2026)* → **is [brand] halal**
- `TL;DR`: one-line verdict (Yes/No/Partially + MUIS status)
- `H2`: Is [Brand] MUIS halal-certified? → **[brand] halal / [brand] muis**
- `H2`: Which [Brand] outlets are halal? → **[brand] halal outlets / [outlet] [brand] halal**
- `H2`: What's on [Brand]'s halal menu? → **[brand] halal menu**
- `H2`: How to verify it yourself → **muis halal check**
- `H2 FAQ`: each PAA → an `H3` question

**T2 — Location / mall food guide**
- `H1`: *Halal Food at [Place]: Best Eats (2026)* → **[place] halal food**
- `TL;DR`: top 3–5 picks + count of halal options
- `H2`: Best halal restaurants in [Place] → **halal food [place] / [place] halal food**
- `H2`: Halal food at [specific mall/sub-area] → **[mall] halal food**
- `H2`: Halal cafés & dessert in [Place] → **halal cafe [place]**
- `H2`: Nearest MRT & how to get there → local modifier
- `H2 FAQ`: PAA → `H3`s

**T3 — Food format / occasion roundup ("best halal …")**
- `H1`: *Best Halal [Format] in Singapore (2026)* → **halal [format] singapore**
- `H2`: Top halal [format] spots → **halal [format]**
- `H2`: Halal [format] near me / by area → **halal [format] near me**
- `H2`: Prices & what to expect → commercial sub-term
- `H2`: Is [format] halal? (if relevant) → **is [format] halal**
- `H2 FAQ`: PAA → `H3`s

**T4 — Cuisine guide**
- `H1`: *Halal [Cuisine] Food in Singapore: [N] Spots* → **halal [cuisine] food singapore**
- `H2`: Best halal [cuisine] restaurants → **halal [cuisine] restaurant singapore**
- `H2`: Which [cuisine] dishes are halal? → **is [cuisine] food halal / which [cuisine] food is halal**
- `H2`: [Cuisine] by area / near me → **halal [cuisine] food near me**
- `H2 FAQ`: PAA → `H3`s

**T5 — Deen tool / Islamic info**
- `H1`: *[Tool/Topic] Singapore — [benefit]* → primary (e.g. **waktu solat singapore**)
- `TL;DR` / live tool widget
- `H2`: Today's [data] in Singapore → **[topic] today singapore**
- `H2`: [Sub-item per prayer/surah/name] → sub-keywords
- `H2`: How to [use / recite / calculate] → how-to keyword
- `H2 FAQ`: PAA → `H3`s

**T6 — Explainer ("What is X")**
- `H1`: *What Is [Concept]? [angle]* → **what is [concept] / [concept] meaning**
- `TL;DR`: 1-sentence definition (definition bait for AI Overviews)
- `H2`: What does [concept] mean? → **[concept] meaning**
- `H2`: [concept] vs [related] → comparison keyword
- `H2`: How it works in Singapore → local term
- `H2 FAQ`: PAA → `H3`s

**T7 — Service / lifestyle guide**
- `H1`: *[Service] in Singapore: [angle]* → primary
- `H2`: Best providers / where to buy → commercial sub
- `H2`: How much does [service] cost? → **[service] price / cost**
- `H2`: What is [service] / how it works → explainer sub
- `H2 FAQ`: PAA → `H3`s

---

## 3. Pillar / Internal-Linking Map

Six hub pages anchor the clusters; every related daily post links **up** to its hub and the hub links **down** to its posts.

| Hub (day) | Primary KW (vol/KD) | Children link up from |
|---|---|---|
| Halal Food Near Me — SG guide (Day 7) | halal food near me (15,000/KD19) | all location + cuisine + format posts |
| Best Halal Restaurants in SG 2026 (Day 36) | halal restaurant singapore (3,200/KD14) | all "best of" + cuisine posts |
| Best Halal Cafés in SG by Area (Day 57) | halal cafe singapore (1,600/KD24) | café/dessert/brunch + location posts |
| MUIS Halal Certification Explained (Day 50) | muis halal (300/KD6) | every "Is X halal" post |
| Waktu Solat Singapore (Day 1) | waktu solat singapore (9,000/KD0) | all Deen-tool posts |
| Malay Wedding in SG (Day 14) | malay wedding (450/KD0) | hantaran, baju melayu, fashion posts |

---

## 4. The 90-Day Calendar (one post/day · evergreen)

Window: **Fri 19 Jun 2026 → Wed 16 Sep 2026.** Format per day: **Title** · `primary kw` (SG vol / KD) · Template · **Cluster** (H2 keywords) · **PAA** (FAQ H3s) · brief.

### Week 1 — 19–25 Jun (Days 1–7) · biggest KD-0 wins + hubs
1. **Waktu Solat Singapore — Prayer Times Tool & Guide** · `waktu solat singapore` (9,000/KD0) · T5 · Cluster: islamic prayer times singapore (1,400), waktu solat subuh singapore (450), prayer times singapore today (350) · PAA: "What time is Subuh in Singapore?", "Are these times MUIS-approved?" · Brief: Flagship Deen anchor — live MUIS-aligned daily timetable + per-prayer sections; highest-volume KD-0 term on the whole site.
2. **Halal Food at Jewel Changi Airport: Full Guide** · `jewel halal food` (1,800/KD0) · T2 · Cluster: halal food at jewel (350), changi airport halal food (50), halal food changi airport (70) · PAA: "What halal options are inside Jewel?" · Brief: Highest-volume single attainable location term; map every halal outlet across Jewel + Changi terminals.
3. **Is Paris Baguette Halal in Singapore? (2026)** · `is paris baguette halal` (1,000/KD1) · T1 · Cluster: paris baguette halal (1,400), paris baguette menu (1,500), paris baguette halal jem · PAA: "Which Paris Baguette outlets are halal?", "Is Paris Baguette MUIS-certified?" · Brief: Top brand-check by volume; outlet-by-outlet status + MUIS deep-link.
4. **Best Halal Fine Dining Restaurants in Singapore** · `halal fine dining singapore` (1,100/KD2) · T3 · Cluster: halal fine dining (350), halal japanese restaurant singapore (200), halal western food singapore (500) · PAA: "What are the best halal fine-dining spots in SG?" · Brief: Best volume-to-difficulty ratio in the format set; special-occasion roundup with price tiers.
5. **Halal Food in Bugis & Kampong Glam / Arab Street** · `bugis halal food` (1,100/KD0) · T2 · Cluster: halal food bugis (700), bugis junction halal food (700), arab street halal food (700), halal cafe bugis (150) · PAA: "What to eat at Bugis halal?" · Brief: Tourist+local overlap; combine mall + Arab Street heritage eateries.
6. **Doa Selepas Solat — Full Rumi, Arabic & Meaning** · `doa selepas solat` (5,700/KD1) · T5 · Cluster: doa selepas wudhu (1,300), doa iftitah (1,700), doa selepas azan (1,000) · PAA: "Apa doa selepas solat?" · Brief: Largest attainable Malay-doa term; full transliteration + audio + meaning.
7. **[HUB] Halal Food Near Me: The Complete Singapore Guide** · `halal food near me` (15,000/KD19) · T3 · Cluster: halal food singapore (2,900), halal restaurant singapore (3,200) · PAA: "How do I find halal food near me in Singapore?" · Brief: Master hub linking every location/cuisine post; higher KD but anchors the whole cluster.

### Week 2 — 26 Jun–2 Jul (Days 8–14)
8. **Halal Food in Orchard Road: Where to Eat** · `orchard halal food` (1,000/KD0) · T2 · Cluster: halal food orchard (1,000), ion orchard halal food (350), halal restaurant orchard (150) · PAA: "Is there halal food in ION Orchard?" · Brief: CBD/shopping-belt guide across ION, Plaza Sing, Somerset.
9. **Is Genki Sushi Halal? Before You Order** · `is genki sushi halal` (700/KD0) · T1 · Cluster: halal japanese food sg, which sushi is halal singapore · PAA: "Is Genki MUIS-certified?", "Which sushi chains in SG are halal?" · Brief: High-volume single-question post; covers Genki + Sushi Express/Tei status.
10. **Halal High Tea & Afternoon Tea Buffets in Singapore** · `halal high tea singapore` (800/KD0) · T3 · Cluster: halal high tea (300), halal high tea buffet singapore (150) · PAA: "Which hotels do halal high tea?" · Brief: Hotel afternoon-tea roundup; cross-link buffet/fine-dining.
11. **Mediterranean Restaurants in Singapore (Halal-Friendly Guide)** · `mediterranean food singapore` (1,200/KD1) · T4 · Cluster: best mediterranean food sg (200), halal mediterranean food sg (90) · PAA: "Is Mediterranean food halal?" · Brief: Highest-volume low-KD cuisine term; frame the halal-friendly Arab St / CBD spots.
12. **Halal Food at Suntec City & Marina Square** · `suntec halal food` (1,300/KD0) · T2 · Cluster: suntec city halal food (900), marina square halal food (900), halal food suntec (500) · PAA: "Halal food near Suntec Convention Centre?" · Brief: Convention/CBD foot-traffic guide bundling two malls.
13. **Doa Buka Puasa & Niat Puasa: Arabic, Rumi + Meaning** · `doa buka puasa` (3,100/KD0) · T5 · Cluster: niat buka puasa (1,300), doa buka puasa ramadhan (1,000), doa sahur (400) · PAA: "What is the doa for buka puasa?" · Brief: Evergreen doa page (rankable year-round; surges in Ramadan).
14. **[HUB] Malay Wedding in Singapore: Customs, Checklist & Etiquette** · `malay wedding` (450/KD0) · T7 · Cluster: malay wedding traditions (100), malay wedding checklist (80), what to wear to malay wedding (100), malay wedding ang bao (150) · PAA: "What to wear to a Malay wedding?", "How much to give?" · Brief: Lifestyle hub feeding hantaran/fashion posts + vendor directory.

### Week 3 — 3–9 Jul (Days 15–21)
15. **Halal Food at VivoCity & HarbourFront** · `vivocity halal food` (1,400/KD4) · T2 · Cluster: vivo halal food (1,000), halal food vivocity (800) · PAA: "Which VivoCity restaurants are halal?" · Brief: Sentosa gateway; high combined volume.
16. **Is Awfully Chocolate Halal? The Honest Answer** · `is awfully chocolate halal` (600/KD0) · T1 · Cluster: halal chocolate singapore (400), which chocolate is halal · PAA: "Is Awfully Chocolate halal-certified?" · Brief: Cake-brand check; links to halal-cake post.
17. **Best Halal Dim Sum in Singapore** · `halal dim sum singapore` (700/KD1) · T3 · Cluster: halal dim sum (450), dim sum halal singapore (60) · PAA: "Is dim sum halal in Singapore?" · Brief: Pork-free siew mai etc.; strong volume, near-zero KD.
18. **Nasi Padang in Singapore: The Ultimate Guide** · `nasi padang singapore` (700/KD3) · T4 · Cluster: best nasi padang singapore (450), nasi padang near me (1,400), nasi padang dishes (60) · PAA: "What is nasi padang?" · Brief: Heritage-cuisine deep dive under the 4,300-vol parent.
19. **Halal Food at Jurong East (Jurong Point, JEM, Westgate & IMM)** · `jurong point halal food` (1,100/KD1) · T2 · Cluster: jem halal food (1,400), westgate halal food (1,100), imm halal food (1,000) · PAA: "Where to eat halal at Jurong East MRT?" · Brief: Largest combined area demand (~4,600/mo) — one consolidated mall-cluster guide.
20. **Doa Qunut — Rumi, Arabic, Audio & When to Recite** · `doa qunut` (3,400/KD1) · T5 · Cluster: doa qunut rumi (1,800), doa witir (1,200) · PAA: "Bila baca doa qunut?" · Brief: High-vol KD-1 doa; full recitation guide.
21. **Halal Cruises from Singapore 2026: Genting Dream, Disney & More** · `halal cruise singapore` (300/KD0) · T7 · Cluster: halal cruise (200), genting dream cruise halal (20), dream cruise halal (10) · PAA: "Which cruise lines offer halal food?" · Brief: Highest-volume KD-0 travel term; booking/affiliate potential.

### Week 4 — 10–16 Jul (Days 22–28)
22. **Halal Food at Northpoint & Causeway Point (Yishun/Woodlands)** · `northpoint halal food` (1,200/KD0) · T2 · Cluster: causeway point halal food (700), halal food northpoint (400) · PAA: "Halal eateries near Yishun MRT?" · Brief: North-region mall cluster.
23. **Is Saizeriya Halal in Singapore?** · `is saizeriya halal` (500/KD0) · T1 · Cluster: saizeriya halal (350), no pork no lard restaurants · PAA: "Is Saizeriya no-pork-no-lard or fully halal?" · Brief: Popular chain; clarify NPNL vs halal.
24. **Halal Mookata in Singapore: Where to Go** · `halal mookata` (600/KD0) · T3 · Cluster: halal mookata singapore (300), mookata halal (200), halal mookata near me (40) · PAA: "Is mookata halal?" · Brief: Whole cluster sits at KD 0 — very winnable.
25. **The Best Halal Korean BBQ in Singapore (Tried & Tested)** · `halal korean bbq singapore` (250/KD2) · T4 · Cluster: halal korean bbq (450), halal korean food sg (700), halal korean fried chicken (20) · PAA: "Is Korean BBQ halal?" · Brief: Korean cluster entry point.
26. **Halal Food at Funan & Raffles City (City Hall)** · `funan halal food` (800/KD0) · T2 · Cluster: raffles city halal food (350), halal food city hall (30) · PAA: "Halal food near City Hall MRT?" · Brief: CBD/civic-district guide.
27. **Doa Dhuha & Solat Dhuha Guide** · `doa dhuha` (3,400/KD1) · T5 · Cluster: doa tahajjud (2,700), doa sholat tahajud (1,000) · PAA: "Bila waktu solat dhuha?" · Brief: High-vol KD-1 doa + how-to-pray.
28. **Best Songkok & Kopiah Shops in Singapore** · `songkok` (1,100/KD0) · T7 · Cluster: kopiah (200), songkok singapore (70), where to buy songkok in singapore (20) · PAA: "Where to buy songkok in Singapore?" · Brief: Modest-fashion accessory; feeds wedding hub.

### Week 5 — 17–23 Jul (Days 29–35)
29. **Halal Food at NEX & Serangoon** · `nex halal food` (800/KD0) · T2 · Cluster: halal food serangoon, halal food hougang (10) · PAA: "Halal food at NEX Serangoon?" · Brief: North-east mall guide.
30. **Is BreadTalk Halal? Outlet-by-Outlet Guide** · `is breadtalk halal` (450/KD0) · T1 · Cluster: which bakery is halal (20), breadtalk halal or not · PAA: "Are all BreadTalk outlets halal?" · Brief: Bakery brand check.
31. **Halal Breakfast Spots in Singapore (Where to Eat Early)** · `halal breakfast singapore` (700/KD0) · T3 · Cluster: halal breakfast near me (500), halal breakfast (150) · PAA: "Where to get halal breakfast near me?" · Brief: Two KD-0 terms feed one article (nasi lemak, prata, café brunch).
32. **The Best Nasi Padang Stalls in Singapore, Ranked** · `best nasi padang singapore` (450/KD0) · T4 · Cluster: nasi padang (4,300), sabar menanti nasi padang (100), nasi padang buffet (90) · PAA: "Where is the best nasi padang in Singapore?" · Brief: Listicle complement to Day 18.
33. **Halal Food in Tampines (Hub, Mall & MRT)** · `tampines halal food` (700/KD0) · T2 · Cluster: halal food tampines (600), tampines hub halal food (700) · PAA: "Halal food at Our Tampines Hub?" · Brief: East-region mall guide.
34. **Daily Duas Hub: Naik Kenderaan, Keluar Rumah & More** · `doa naik kenderaan` (2,100/KD0) · T5 · Cluster: doa keluar rumah (900), doa bangun tidur (1,000), doa selamat (1,000) · PAA: "Apa doa naik kenderaan?" · Brief: Searchable everyday-dua hub; many KD-0 indexed sub-pages.
35. **Prayer Rooms & Surau at Changi Airport: Terminal Guide** · `prayer room changi airport` (100/KD0) · T5 · Cluster: surau changi airport (40), prayer room changi terminal 2 (50)/3 (20)/1 (20) · PAA: "Where is the prayer room in T2?" · Brief: Evergreen, highest travel TP (300); internal-link hub for travel.

### Week 6 — 24–30 Jul (Days 36–42)
36. **[HUB] Best Halal Restaurants in Singapore (2026)** · `halal restaurant singapore` (3,200/KD14) · T3 · Cluster: best halal restaurants singapore, halal food singapore (2,900) · PAA: "What are the best halal restaurants in SG?" · Brief: Second hub; links to every cuisine/best-of post.
37. **Is KOI Halal? Bubble Tea Halal Status in SG** · `is koi halal` (300/KD0) · T1 · Cluster: which bubble tea is halal in singapore (20), halal bubble tea · PAA: "Which bubble tea brands are halal?" · Brief: Expands into a bubble-tea brand matrix.
38. **Halal Western Food in Singapore: Steaks, Burgers & Grills** · `halal western food singapore` (500/KD0) · T3 · Cluster: halal western food near me (350), halal western food (250) · PAA: "What is halal western food?" · Brief: Two KD-0 terms; steak/burger roundup.
39. **The Best Briyani in Singapore (Indian-Muslim Classics)** · `best briyani singapore` (600/KD9) · T4 · Cluster: nasi briyani singapore (500), briyani catering sg (100) · PAA: "Where is the best briyani in SG?", "Is briyani halal?" · Brief: Indian-Muslim cuisine via dish term (mamak head terms are dead).
40. **Halal Food at Plaza Singapura & Dhoby Ghaut** · `plaza singapura halal food` (600/KD0) · T2 · Cluster: ion halal food (400), ion orchard halal food (350) · PAA: "Halal options at Plaza Singapura?" · Brief: Orchard-fringe mall guide.
41. **Islamic Calendar 2026 Singapore (Hijri ⇄ Gregorian Tool)** · `islamic calendar 2026` (1,400) · T5 · Cluster: islamic calendar 2026 singapore (300), muis islamic calendar 2026 (200), hijri date today (10) · PAA: "What is today's Hijri date?" · Brief: Converter tool + MUIS calendar; pursue via long-tail (parent `hijri calendar` is KD33).
42. **Abaya Singapore: Where to Shop & How to Style** · `abaya` (1,500/KD12) · T7 · Cluster: abaya singapore (350), abaya dress (200), muslimah clothing (80) · PAA: "What is an abaya?" · Brief: Modest-fashion anchor; feeds wedding/fashion cluster.

### Week 7 — 31 Jul–6 Aug (Days 43–49)
43. **Halal Food in Paya Lebar (PLQ & Paya Lebar Quarter)** · `paya lebar halal food` (600/KD0) · T2 · Cluster: halal food paya lebar (400), plq halal food (600) · PAA: "Halal restaurants at PLQ?" · Brief: East-central mall guide.
44. **Is Starbucks Halal in Singapore?** · `is starbucks halal` (250/KD0) · T1 · Cluster: starbucks halal, starbucks singapore menu (1,000) · PAA: "Are Starbucks syrups/drinks halal?" · Brief: Clarify drinks vs food halal status.
45. **Halal Pizza in Singapore: Which Chains Are Halal?** · `halal pizza singapore` (400/KD0) · T3 · Cluster: is pizza hut halal (300), is domino pizza halal (60), pizza maru halal (40) · PAA: "Is Pizza Hut / Domino's halal in SG?" · Brief: Folds three KD-0 brand checks into one roundup.
46. **Where to Find the Best Shawarma in Singapore** · `shawarma singapore` (250/KD0) · T4 · Cluster: best shawarma in singapore (70), shawarma kingdom sg (20) · PAA: "Best shawarma in Arab Street?" · Brief: Clean KD-0 local cuisine term.
47. **Halal Food in East SG (Bedok Mall, Changi City Point, Downtown East)** · `bedok mall halal food` (500/KD0) · T2 · Cluster: changi city point halal food (400), downtown east halal food (400), waterway point halal food (500) · PAA: "Halal food in East SG malls?" · Brief: East-region mall cluster.
48. **Zakat Calculator Singapore — Harta, Emas & Nisab Tool** · `zakat calculator` (600/KD3) · T5 · Cluster: zakat calculator singapore (300), zakat harta singapore (350), nisab zakat 2026 (400) · PAA: "What is the nisab for zakat?", "How to calculate zakat harta?" · Brief: Live MUIS-rate calculator; high-intent evergreen.
49. **Umrah Packages from Singapore: 2026 Costs & What to Look For** · `umrah package singapore` (250/KD3) · T7 · Cluster: umrah package from singapore (40), cheapest umrah package 2026 singapore (20), umrah package singapore price (20) · PAA: "How much is an Umrah package from SG?" · Brief: Highest travel TP (400); pair with Day 77 visa/vaccine post.

### Week 8 — 7–13 Aug (Days 50–56)
50. **[HUB] MUIS Halal Certification Explained (+ How to Check)** · `muis halal` (300/KD6) · T6 · Cluster: muis (19,000), halal logo (450), halal certification (150), halal certified (350) · PAA: "How do I check if a place is MUIS-certified?", "What does the halal logo look like?" · Brief: Authority pillar every "Is X halal" post links to; embeds register deep-link.
51. **Is Yoshinoya Halal in Singapore?** · `is yoshinoya halal` (400/KD3) · T1 · Cluster: yoshinoya halal, halal beef bowl sg · PAA: "Is the beef at Yoshinoya halal?" · Brief: Japanese fast-food brand check.
52. **Halal Birthday Cakes in Singapore (Delivery Guide)** · `halal birthday cake` (500/KD12) · T3 · Cluster: halal cake delivery singapore (300), halal bento cake singapore (100), halal chocolate cake (100) · PAA: "Where to order a halal birthday cake?" · Brief: Commercial-intent delivery roundup.
53. **Halal Korean Food in Singapore: Complete Guide** · `halal korean food singapore` (700/KD12) · T4 · Cluster: halal korean food (600), halal korean bbq (450), halal korean (150) · PAA: "Is Korean BBQ halal in SG?" · Brief: Korean pillar consolidating the cluster.
54. **Halal Food in Sentosa: Beach & Resort Eats** · `halal food sentosa` (200/KD0) · T2 · Cluster: sentosa halal food (150) · PAA: "Is there halal food on Sentosa?" · Brief: Resort-island guide; links from VivoCity post.
55. **Hantaran & Dulang Guide + Finding a Kadi in Singapore** · `hantaran` (200/KD0) · T7 · Cluster: dulang hantaran (200), kadi singapore (150), tok kadi singapore (200) · PAA: "What is hantaran?", "Duit hantaran untuk siapa?" · Brief: Wedding sub-topic; all KD-0; links to wedding hub.
56. **Halal Food in Bangkok: Markets, Malls & the Airport** · `halal food in bangkok` (100/KD0) · T4/T2 · Cluster: bangkok halal food (70), halal food bangkok airport (10), halal thai food bangkok (10) · PAA: "Where to eat halal in Bangkok?" · Brief: Destination-guide template proof-point.

### Week 9 — 14–20 Aug (Days 57–63)
57. **[HUB] Best Halal Cafés in Singapore (by Area)** · `halal cafe singapore` (1,600/KD24) · T3 · Cluster: halal cafe (1,500), halal cafe near me (1,300), halal brunch singapore (450), halal cafe arab street (100) · PAA: "Best halal brunch spots in SG?" · Brief: Café hub linking dessert/brunch + location posts.
58. **Is Kombucha Halal? Alcohol, Fermentation & the Ruling** · `is kombucha halal` (200/KD0) · T1/T6 · Cluster: kombucha singapore (600), halal kombucha · PAA: "Does kombucha contain alcohol?", "Is kombucha haram?" · Brief: Ingredient ruling explainer; big global volume too.
59. **Halal Hotpot & Steamboat Restaurants in Singapore** · `halal hotpot` (1,100/KD13) · T3 · Cluster: halal hotpot singapore (600), halal steamboat (400), steamboat halal (90) · PAA: "Is steamboat halal in SG?" · Brief: Cook-your-own roundup; strong volume.
60. **Halal Japanese Restaurants in Singapore (Sushi, Ramen, Curry)** · `halal japanese restaurant singapore` (200/KD0) · T4 · Cluster: halal japanese food sg (250), halal japanese food (400), halal japanese curry (80) · PAA: "Is sushi halal?" · Brief: Japanese cuisine guide; links to Genki check.
61. **Qibla Direction Singapore — Find the Kiblat Compass** · `qibla direction singapore` (150/KD0) · T5 · Cluster: singapore qibla direction (70), qibla direction in singapore (40) · PAA: "What is the qibla direction in SG (degrees)?" · Brief: Compass tool + degrees explainer.
62. **What Is Takaful? Islamic Insurance Explained for Singaporeans** · `takaful` (400/KD24) · T6 · Cluster: what is takaful (50), takaful insurance (150), takaful singapore (100) · PAA: "What is takaful?", "What is takaful insurance?" · Brief: Finance explainer; KD-0 sub-terms carry it; high commercial value.
63. **Halal Food in Seoul: Where Singaporeans Should Eat** · `halal food in seoul` (100/KD0) · T4/T2 · Cluster: halal food seoul (40), halal food myeongdong seoul (10) · PAA: "How to find halal food in Korea?" · Brief: Top SG getaway destination guide.

### Week 10 — 21–27 Aug (Days 64–70)
64. **JB Halal Food Guide: Best Eats Across the Causeway** · `jb halal food` (90/KD0) · T2 · Cluster: halal food jb (50), city square jb halal food (10), best halal food in jb (30) · PAA: "What to eat in JB (halal)?" · Brief: Day-trip guide; high SG day-tripper intent.
65. **Is Ferrero Rocher Halal? Ingredients Breakdown** · `is ferrero rocher halal` (200/KD0) · T1 · Cluster: halal chocolate singapore (400), which chocolate is halal · PAA: "Does Ferrero Rocher contain alcohol/pork gelatin?" · Brief: Ingredient-level brand check.
66. **Halal Dessert Spots in Singapore (+ Near Me)** · `halal dessert near me` (600/KD0) · T3 · Cluster: halal dessert singapore (350), halal dessert (350) · PAA: "Where to find halal desserts near me?" · Brief: Dessert roundup; links to café hub.
67. **Halal Chinese Restaurants in Singapore (Dim Sum, Hotpot, Zi Char)** · `halal chinese restaurant singapore` (350/KD8) · T4 · Cluster: halal chinese food (300), halal chinese food near me (70) · PAA: "What is halal in Chinese cuisine?", "Is Chinese food halal?" · Brief: Halal-Chinese cuisine guide.
68. **Digital Tasbih Counter — Online Dzikir Tool** · `tasbih` (500/KD1) · T5 · Cluster: tasbih counter (150), tasbih online (70), tasbih kafarah (250) · PAA: "What is tasbih kafarah?", "How does a digital tasbih work?" · Brief: Interactive counter tool + dzikir guide.
69. **Bekam (Cupping) in Singapore: Benefits, Price & Where to Go** · `bekam singapore` (150/KD6) · T7 · Cluster: cupping therapy singapore (200), cupping therapy singapore price (100), bekam singapore price (20) · PAA: "What is bekam?" · Brief: Health-vertical niche; clear local service intent + healthy CPC.
70. **Halal Food in Japan: A Singaporean Muslim's Survival Guide** · `halal food in japan` (100/KD6) · T4/T2 · Cluster: japan halal food (50), halal food in japan tokyo (10), how to check halal food in japan · PAA: "How do you know if food is halal in Japan?" · Brief: Destination survival guide (parent `halal food japan` KD37 — use in-context variant).

### Week 11 — 28 Aug–3 Sep (Days 71–77)
71. **Is Gelatin Halal? Pork vs Beef vs Plant Sources** · `is gelatin halal` (150/KD1) · T6 · Cluster: halal gelatin (80), agar agar (1,100), is agar agar halal · PAA: "How to know if gelatin is halal?" · Brief: Foundational ingredient explainer; huge global volume.
72. **Halal Seafood Restaurants in Singapore** · `halal seafood singapore` (350/KD11) · T3 · Cluster: halal seafood restaurant singapore (250), is jumbo seafood halal (70) · PAA: "Is Jumbo Seafood halal?" · Brief: Seafood/crab roundup with brand checks.
73. **Halal Thai Food in Singapore: Tom Yum, Boat Noodles & More** · `halal thai food singapore` (450/KD20) · T4 · Cluster: halal thai food (300), halal thai restaurant sg (150), is thai express halal (30) · PAA: "Is Thai Express halal?" · Brief: Thai cuisine guide (higher KD — build after authority grows).
74. **Halal Mini Buffet Catering in Singapore** · `halal mini buffet catering singapore` (250/KD3) · T7 · Cluster: halal mini buffet (200), halal buffet catering (250), halal food catering for 20 pax (250) · PAA: "How much is halal mini buffet for 20 pax?" · Brief: Commercial catering guide with price bands.
75. **Halal Investment in Singapore: A Beginner's Guide** · `halal investment` (150/KD3) · T7 · Cluster: halal investment singapore (150), halal investment app singapore (20) · PAA: "What are halal investments in SG?" · Brief: Highest-CPC topic in the set; strong advertiser value.
76. **The Complete Guide to Baju Melayu (Teluk Belanga vs Cekak Musang)** · `baju melayu` (1,000/KD14) · T7 · Cluster: baju melayu lelaki (300), baju melayu teluk belanga (100), baju melayu singapore (80) · PAA: "What is baju melayu?", "Where to buy in SG?" · Brief: Modest-fashion pillar; feeds wedding hub.
77. **Umrah Vaccination & Visa Checklist for Singaporeans** · `umrah vaccination singapore` (200/KD0) · T5/T7 · Cluster: umrah visa singapore (100), umrah vaccine singapore (70), meningitis vaccine for umrah singapore (50) · PAA: "How much is an Umrah visa from SG?" · Brief: KD-0 companion to Day 49; completes the Umrah journey cluster.

### Week 12 — 4–10 Sep (Days 78–84)
78. **What "No Pork No Lard" Actually Means (vs Halal)** · `no pork no lard` (150/KD0) · T6 · Cluster: halal vs no pork no lard, halal vs non halal (80), what is halal and non halal (30) · PAA: "Is NPNL the same as halal?", "Can Muslims eat at NPNL places?" · Brief: High-confusion explainer; strong AI-overview definition target.
79. **Halal BBQ & Grill in Singapore (incl. BBQ Wholesale)** · `halal bbq singapore` (300/KD8) · T3 · Cluster: halal bbq (400), bbq halal (80), halal bbq catering (80) · PAA: "Is BBQ Wholesale halal?" · Brief: BBQ roundup + catering angle.
80. **Middle Eastern Food in Singapore: Halal Guide to Arab Street** · `middle eastern food singapore` (300/KD6) · T4 · Cluster: best middle eastern food sg (150), halal middle eastern food sg (50) · PAA: "Where to eat Middle Eastern food in SG?" · Brief: Arab Street cuisine guide; links to shawarma post.
81. **Nama Bayi Islam — Boy & Girl Names from the Quran (with Meaning)** · `nama bayi lelaki islam` (150/KD0) · T5 · Cluster: nama bayi perempuan islam (150), nama bayi perempuan islam dalam al quran (70), nama nama bayi islam dan maksud (40) · PAA: "Nama bayi perempuan dalam al-Quran?" · Brief: Use Malay spelling (English "muslim baby names" is dead in SG); searchable name+meaning library.
82. **Muslimah-Friendly Hair Salons in Singapore (Private Rooms)** · `muslimah hair salon` (300/KD15) · T7 · Cluster: muslimah hair salon singapore (150), hijab friendly hair salon singapore (50), affordable muslimah hair salon (60) · PAA: "Where to find a private-room muslimah salon?" · Brief: Beauty-vertical guide (avoid contaminated `tudung`/`hijab` head terms).
83. **Halal Food in Tokyo: From Tokyo Station to Asakusa** · `halal food in tokyo` (80/KD3) · T4/T2 · Cluster: tokyo halal food (20), halal food near tokyo station (20), halal food ginza tokyo (10) · PAA: "Where to find halal food near Tokyo Station?" · Brief: Destination guide; links from Japan survival guide.
84. **Is Texas Chicken Halal in Singapore?** · `is texas chicken halal` (50/KD0) · T1 · Cluster: texas chicken singapore (2,100), halal fried chicken sg · PAA: "Is Texas Chicken MUIS-certified?" · Brief: Fried-chicken brand check (low vol, trivial KD).

### Week 13 — 11–16 Sep (Days 85–90)
85. **Tahajjud Time Singapore — When & How to Pray** · `tahajjud time singapore` (60/KD0) · T5 · Cluster: how to pray tahajjud (250), best time to pray tahajjud (10) · PAA: "What is the best time for Tahajjud?", "How many rakaat?" · Brief: Night-prayer guide + local timing.
86. **Halal Mexican Food in Singapore: Tacos, Burritos & Quesadillas** · `halal mexican food singapore` (100/KD0) · T4 · Cluster: halal mexican food (100), halal mexican restaurant sg (10) · PAA: "Is Mexican food halal?" · Brief: Trivially rankable cuisine niche.
87. **Wasiat (Islamic Will) in Singapore: How to Write One** · `wasiat` (100/KD0) · T6/T7 · Cluster: wasiat singapore (50), wasiat in english (50), islamic finance singapore (90) · PAA: "What is wasiat?" · Brief: Finance/legal explainer; KD-0.
88. **Is Mirin Halal? Cooking With Japanese Rice Wine** · `is mirin halal` (70/KD0) · T6 · Cluster: is rice vinegar halal (60), halal mirin substitute, is vinegar halal (40) · PAA: "Does mirin contain alcohol?", "Is mirin haram in cooking?" · Brief: Cooking-ingredient ruling.
89. **Halal Food in Bali: Eating Well in Kuta, Seminyak & Ubud** · `halal food in bali` (70/KD0) · T4/T2 · Cluster: bali halal food (30), best halal food in bali (10), muslim friendly bali itinerary (10) · PAA: "Is there halal food in Bali?" · Brief: Destination guide for a top SG holiday spot.
90. **Women-Only & Muslimah Gyms in Singapore** · `women only gym singapore` (70/KD0) · T7 · Cluster: muslimah gym singapore (30), female only gym singapore · PAA: "Where to find a women-only gym in SG?" · Brief: Health/lifestyle niche; closes the 90-day push.

---

## 5. Deferred Seasonal Schedule (publish ~6 weeks pre-peak — NOT in this window)

These were strong in the research but peak outside Jun–Sep 2026. Queue for the 2027 seasons (Ramadan/Hari Raya ≈ Feb–Mar 2027; Hari Raya Haji ≈ May–Jun 2027). Publish early so a zero-authority domain has months to index.

| Topic | Primary KW (vol/KD) | Publish by |
|---|---|---|
| Ramadan 2027 Singapore hub | ramadan 2026→2027 singapore (5,400/KD0) | early Jan 2027 |
| Buka Puasa / Iftar Times timetable | buka puasa time (1,200/KD0) | late Jan 2027 |
| Geylang Serai Bazaar guide | geylang serai bazaar (2,000/KD3) | early Feb 2027 |
| Hari Raya Aidilfitri date & traditions | hari raya aidilfitri (1,800/KD10) | mid Feb 2027 |
| Zakat Fitrah + Fidyah calculators | zakat fitrah (1,000/KD5) · fidyah (500/KD0) | early Feb 2027 |
| Hari Raya Haji 2027 + Qurban/Korban | hari raya haji (11,000/KD5) · qurban singapore (200/KD2) | late Apr 2027 |
| Kuih Raya / Baju Raya 2027 | kuih raya (600/KD17) · baju raya (600/KD9) | Feb 2027 |
| Selamat Hari Raya wishes & greetings | hari raya greetings (600/KD0) | Mar & May 2027 |

**Backlog (evergreen, for the next 90-day cycle):** Tahlil & Yasin guide (tahlil arwah 700/KD0), Solat Jumaat guide (niat solat jumaat 600/KD0), Mosques in Singapore directory (masjid near me 4,000/KD7), Halal Turkish food (90/KD12), Halal Vietnamese food (100/KD0), Baju Kurung shopping guide (350/KD20), Halal nail polish/makeup (100/KD1), Hajj from Singapore registration (90/KD n-a), Halal Food in Osaka/Korea/Taiwan destination guides.

---

## 6. Feature-Image Prompts (OpenAI `gpt-image-1` / DALL·E)

Every post needs a feature image. To keep all 90 visually cohesive (one brand look), each final prompt = **STYLE PREFIX + the day's SUBJECT line + STYLE SUFFIX**. Paste the assembled string into the OpenAI image API/UI. Generate at **1536×1024 (16:9 landscape)**.

**STYLE PREFIX (same for all 90):**
> *Editorial blog hero photograph for a Singapore halal lifestyle brand. Warm natural light, shallow depth of field, clean modern composition, inviting and trustworthy mood, soft brand palette of warm cream, sage/teal green and gold accents.*

**SUBJECT:** (the per-day line below)

**STYLE SUFFIX (same for all 90):**
> *16:9 horizontal, high detail, photorealistic, generous negative space top-left for headline overlay. No text, no words, no logos, no brand trademarks, no watermarks. Respectful and tasteful; do not depict faces of people praying or any religious scripture/figures.*

> **Guardrails baked in:** "Is X halal" posts must NOT show real brand logos/packaging — depict the food generically. Islamic/Deen topics stay respectful (architecture, lanterns, prayer mats, beads, calligraphy-free) — never render Quran text, the Prophet, or worshippers' faces.

### Subject lines (Day → SUBJECT)

**Week 1** 1 — Serene Singapore mosque dome at dawn, a smartphone on a prayer mat showing a minimal prayer-times interface, tasbih beads beside it, soft sunrise glow. · 2 — The Jewel Changi Rain Vortex waterfall behind a wooden tray of assorted Singapore halal local dishes in the foreground. · 3 — Flat-lay of artisan croissants, pastries and bread loaves on a marble counter in a bright modern bakery (generic, no branding). · 4 — Elegant plated halal fine-dining course on white china, candle and wine-free table setting in an upscale restaurant. · 5 — Colourful Kampong Glam heritage shophouses with the Sultan Mosque dome behind a halal street-food spread. · 6 — Open cupped hands raised in prayer above a folded prayer mat by a sunlit window, wooden prayer beads, calm and reverent. · 7 — Overhead flat-lay of a stylised Singapore map with location pins surrounded by diverse halal dishes.

**Week 2** 8 — Orchard Road skyline of glassy malls with a halal café table and dessert in the foreground. · 9 — Beautifully arranged conveyor-belt-style sushi platter on a light wood table (generic, no branding). · 10 — Three-tier afternoon high-tea stand with scones, cakes and teapot in a bright hotel lounge. · 11 — Mediterranean mezze spread — hummus, grilled meats, pita, olives — on a rustic table. · 12 — Modern CBD convention-district mall atrium with a halal lunch tray in the foreground. · 13 — Dates and a glass of water on a wooden table at sunset, soft golden iftar light, prayer beads nearby. · 14 — Elegant Malay wedding dais (pelamin) with floral decor and traditional bridal details, no faces.

**Week 3** 15 — VivoCity waterfront mall by HarbourFront with a halal meal tray and sea view. · 16 — Decadent chocolate cake slice on a plate in a cosy dessert café (generic, no branding). · 17 — Steaming bamboo baskets of assorted dim sum on a teahouse table. · 18 — Banana-leaf nasi padang spread with many colourful Malay/Indonesian dishes, top-down. · 19 — Bright Jurong-East shopping-mall food hall with a varied halal meal in the foreground. · 20 — Quiet mosque prayer hall arches at night with soft lamplight and a row of prayer mats, no people. · 21 — A modern cruise ship at sea at golden hour with an elegant halal dining table on deck.

**Week 4** 22 — Northern Singapore neighbourhood mall exterior with a takeaway halal meal in foreground. · 23 — Casual Italian family-restaurant pasta and pizza spread on a checked tablecloth (generic). · 24 — Bubbling mookata dome grill-and-steamboat hotpot with raw halal meats and vegetables around it. · 25 — Sizzling Korean BBQ grill with marinated halal beef, banchan side dishes, tongs (generic). · 26 — Civic-district mall interior near a heritage building with a halal lunch tray foreground. · 27 — Soft mid-morning light through a mosque window onto a prayer mat and beads, serene Dhuha mood. · 28 — Neat display of black velvet songkok and embroidered kopiah caps on a shop shelf.

**Week 5** 29 — North-east mall facade at dusk with a halal dinner takeaway in the foreground. · 30 — Fresh loaves and buns cooling on bakery racks, warm tones (generic, no branding). · 31 — Halal Singapore breakfast spread — nasi lemak, roti prata, kaya toast, teh tarik — top-down. · 32 — Hawker-stall nasi padang display case packed with colourful dishes, steam rising. · 33 — Eastern Singapore community-hub mall with a family halal meal in the foreground. · 34 — Flat-lay of a car key, house keys and prayer beads on a wooden surface with soft light (everyday-dua theme). · 35 — Calm airport prayer room / surau interior with prayer mats and qibla marker, no people.

**Week 6** 36 — Lavish spread of diverse halal restaurant dishes across a long table, celebratory hero shot. · 37 — Row of colourful bubble-tea cups with tapioca pearls on a light counter (generic, no branding). · 38 — Juicy halal Western platter — grilled steak, fries, corn — on a wooden board. · 39 — Fragrant biryani on a banana leaf with raita and curry, garnished, top-down. · 40 — Orchard-fringe mall plaza with a halal café dessert in the foreground. · 41 — Elegant Islamic geometric calendar concept with a crescent moon and lantern, warm tones (no scripture). · 42 — Flowing elegant abaya garments on minimalist boutique racks, soft fabric textures.

**Week 7** 43 — Modern Paya Lebar mixed-use mall with a halal lunch tray in the foreground. · 44 — Coffee cups, syrups and pastries on a café counter, warm latte art (generic, no branding). · 45 — Halal pizza with melted cheese and toppings, fresh from a wood-fired oven (generic). · 46 — Shawarma wrap being sliced from a vertical rotisserie, garlic sauce and pickles (generic). · 47 — Eastern-Singapore mall food court with an assorted halal meal in the foreground. · 48 — Gold coins, a calculator and a charity jar on a desk with soft light, zakat theme. · 49 — Suitcase, ihram cloth, prayer beads and a passport laid out for an Umrah journey, no faces.

**Week 8** 50 — A clean halal-certification badge concept (generic green seal, no real logo) beside fresh ingredients on a counter. · 51 — Japanese beef rice bowl (gyudon) with chopsticks on a wooden table (generic). · 52 — Decorated halal birthday cake with candles on a pastel backdrop. · 53 — Korean halal feast — fried chicken, tteokbokki, banchan — top-down on a dark table. · 54 — Sentosa beach resort dining deck with a halal meal and palm trees at golden hour. · 55 — Beautifully arranged hantaran wedding gift trays with flowers and fabrics, no faces. · 56 — Bangkok street-food market scene at night with a halal Thai dish in the foreground.

**Week 9** 57 — Cosy aesthetic halal café interior with latte, brunch plate and plants, bright airy light. · 58 — Bottles of kombucha and a glass with bubbles on a counter with ginger and fruit (generic). · 59 — Communal halal steamboat hotpot with raw platters and dipping sauces, overhead. · 60 — Halal Japanese spread — ramen, sushi, katsu curry — on a light wood table (generic). · 61 — A qibla compass on a prayer mat with a softly lit mosque silhouette behind, no people. · 62 — Symbolic Islamic-finance concept — a protective umbrella over a small house and coins, warm tones. · 63 — Seoul street-food alley with neon and a halal Korean dish in the foreground.

**Week 10** 64 — Johor Bahru night street-food scene across the causeway with a halal dish in the foreground. · 65 — Assorted wrapped chocolates and pralines on a plate, festive (generic, no branding). · 66 — Colourful halal dessert spread — ice kacang, cendol, cakes — top-down, vibrant. · 67 — Halal Chinese banquet — steamed fish, noodles, dim sum — on a round table, overhead. · 68 — Wooden and digital tasbih counters resting on a prayer mat with soft light. · 69 — Calm bekam/cupping therapy setup — glass cups on a clean towel in a serene wellness room, no faces. · 70 — Tokyo cityscape with a neatly plated halal Japanese meal in the foreground.

**Week 11** 71 — Translucent gelatin jelly cubes and gummy sweets on a marble surface, science-meets-food look. · 72 — Halal seafood feast — chilli crab, prawns, fish — on a newspaper-lined table (generic). · 73 — Thai halal spread — tom yum, green curry, boat noodles — top-down, vibrant herbs. · 74 — Halal mini-buffet catering line of warmers with assorted local dishes at an event. · 75 — Clean flat-lay of a smartphone showing a rising investment chart with coins and a small plant, halal-finance theme. · 76 — Elegant baju melayu traditional menswear set with songkok on a wooden hanger, fabric detail. · 77 — Vaccination card, passport and Umrah documents on a desk with prayer beads, no faces.

**Week 12** 78 — A plate of food with a small generic green tick versus a crossed-out pork icon, "no pork no lard vs halal" concept, clean flat-lay. · 79 — Smoky halal BBQ grill with skewers, satay and grilled corn over coals. · 80 — Middle Eastern Arab-Street feast — kebabs, rice, flatbread, mezze — on a brass tray. · 81 — Soft baby nursery flat-lay with wooden alphabet blocks and a crescent-moon decor, baby-names theme, no scripture. · 82 — Serene private-room salon interior with a styling chair and soft lighting, no people. · 83 — Tokyo Station district with a tidy halal Japanese meal in the foreground. · 84 — Crispy fried chicken basket with fries on a tray (generic, no branding).

**Week 13** 85 — Pre-dawn mosque silhouette under a starry sky with a single lit window, Tahajjud night-prayer mood. · 86 — Halal Mexican spread — tacos, burritos, guacamole — colourful, top-down. · 87 — Calm flat-lay of a will document, fountain pen and prayer beads on a wooden desk, soft light. · 88 — Japanese cooking ingredients — a small bottle of rice-wine-style condiment, soy, ginger — on a counter (generic). · 89 — Bali beachside warung with a plated halal meal and tropical greenery at golden hour. · 90 — Bright modern women-only gym/studio with equipment and plants, empty and welcoming, no people.

---

## 7. How to Use This Calendar

1. **Daily workflow:** Each day, take that day's row → draft a 1,500–2,000 word post using the matching template in §2 (so each H-tag carries its mapped keyword), include all 7 GEO elements from §1, and generate the feature image with that day's prompt in §6.
2. **Optional app integration:** Port the 90 rows into [lib/content-calendar.ts](lib/content-calendar.ts) to drive the in-app calendar feature, mapping each to its template + slug + image prompt.
3. **Publishing:** Extends the existing `BlogPost` + JSON-LD pattern in [lib/blog.ts](lib/blog.ts) — add `Article` + `FAQPage` schema, a named author, and a "last updated" date to every post.

## 8. Verification

- **Data integrity:** every volume/KD value traces to a live Ahrefs `keywords-explorer` query (country=sg) run by the 8 research agents on 18 Jun 2026 — no estimated numbers. Spot-check any 5 keywords via `mcp__ahrefs__keywords-explorer-overview` before publishing if desired.
- **Coverage check:** 90 unique primary keywords, no duplicates; ~80% at KD ≤ 6; 6 pillar/hub pages present; all 7 verticals represented; all 7 templates used.
- **GEO readiness:** before publishing each post, confirm the 7 GEO elements (TL;DR answer, FAQ H3s from PAA, schema, author+date, tables) — optionally run the geo-fundamentals `scripts/geo_checker.py` against the rendered page.
- **Ranking validation (post-launch):** since humblehalal.com isn't an Ahrefs project, track via Google Search Console (the `gsc-*` MCP tools are available) — watch impressions/positions for the target keywords 2–4 weeks after each publish; re-pull `site-explorer-organic-keywords` monthly to confirm the keyword count climbs from 0.
