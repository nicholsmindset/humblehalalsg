# Humble Halal — Content Plan & Execution Tracker (v3)

*Execution companion to the master keyword research
[keyword-research-v3.md](./keyword-research-v3.md) (1,921 kw / 298,740 SV, SG). This is the live
tracker for the content roadmap — five workstreams, a "do-now" tranche and a phased rollout.*

**How the surfaces work (source of truth):**
- **Blog** = automated. Schedule lives in `lib/content-calendar.ts::postSchedule`; human calendar
  [content-calendar-final.md](./content-calendar-final.md). Posts are `content/posts/*.yaml`,
  validated by `npm run check:content` (≥3 sections, ≥4 FAQ, `answer` 40–70w, one of 10 categories
  in `lib/blog-categories.ts`). Weekly drafter + auto-publish workflows handle the rest.
- **pSEO** = code/data factories: `/halal-food/[location]` (`lib/seo-pages.ts`), `/is-halal/[brand]`
  (`lib/halal-status.ts`), `/tools/ingredient-checker` (`lib/tools/ingredients.ts`),
  `/hawker/[centre]` (Supabase).
- **On-page content** = `lib/area-content.ts` + `lib/category-content.ts` (pSEO) and inline
  `app/*/page.tsx` (landing pages).
- **Distribution** = RSS → Beehiiv newsletter, OG cards, IndexNow ping, approval-gated social outbox,
  monthly `claude-seo-scan.yml`.

> Supersedes the stale `docs/seo/content-calendar-v2.md` (built on the old `lib/blog.ts` architecture,
> none of its Batch-1 slugs shipped). Keep `content-calendar-90day.md` as the template/image-prompt
> reference only.

---

## Workstreams

| ID | Workstream | Primary surface | Lever files |
|----|-----------|-----------------|-------------|
| **WS-A** | On-page optimization of existing pages | pSEO + landing | `lib/area-content.ts`, `lib/category-content.ts`, `app/*/page.tsx`, `lib/seo-pages.ts` |
| **WS-B** | pSEO fan-out (new URLs) | locations, brands, ingredients, hawker | `lib/seo-pages.ts`, `lib/halal-status.ts`, `lib/tools/ingredients.ts`, Supabase |
| **WS-C** | New evergreen guides & blog | blog | `content/posts/*.yaml`, `lib/content-calendar.ts` |
| **WS-D** | Answer-box / GEO (AI Overviews) | brand `answer`, FAQ JSON-LD, explainers | brand/blog `answer` fields, `components/seo/json-ld.tsx` |
| **WS-E** | Distribution (feed the existing machine) | RSS/newsletter/social | no build — publish into it |

---

## Rollout status

### Phase 0 — Setup
| Item | Status |
|------|--------|
| `content-plan-v3.md` tracker (this doc) | ✅ Done |
| Supersede note on `content-calendar-v2.md` | ✅ Done |

### Phase 1 — "Do now" balanced quick wins (weeks 1–4)
| WS | Item | Target SV / KD | Status |
|----|------|----------------|--------|
| WS-B | Ingredient batch — E-numbers already covered; added lard, mirin, shortening, whey, vanilla extract (indexable, cited) | ~1,550 / KD 0 | ✅ Done |
| WS-D/C | "What is Halal? Meaning, Logo & MUIS Certification" explainer | `halal meaning` 600, `what is halal`, `halal logo` 650 | ⬜ In progress |
| WS-B | Brand pages — batch 1 shipped (8 web-verified): PastaMania, Poulet, Soup Spoon, Namu Bulgogi (certified); Sushi Tei, Oriental Kopi (no-pork); IKEA (partial); Astons (not-cert). Each-a-Cup/Mixue held back — conflicting sources. | ~20k / KD 0–2 | 🟡 Batch 1 of ~3 done |
| WS-A | Optimize top ~10 existing pages (Orchard/Tampines/Jurong/Bugis + Korean/Japanese/Western/Dessert cuisine + catering hub) | "Optimise" rows | ⬜ Queued |
| WS-B | First 5 location page objects + seed listings (ION, MBS, Parkway Parade, Raffles City, Star Vista) | ~1,900 / KD 0 | ⬜ Queued (needs directory data) |
| WS-C | 3 biggest-gap guides (Best Halal Cafés, Halal Dessert Guide, Halal Korean/BBQ) | ~4,400 / KD 0–26 | ⬜ Queued |

### Hawker centres — dedicated opportunity (`/hawker/[centre]`, Supabase-driven)
Separate Ahrefs harvest: [`keywords/v3-hawker-matching-terms.csv`](./keywords/v3-hawker-matching-terms.csv)
— **415 kw / 114,150 SV, almost all KD 0–6**. Demand is for *specific named centres* (mostly
non-halal-specific navigation queries), so the play is to seed the top centres into the Supabase
`hawker_centres` table and win them with a **halal-stall overlay + nearby prayer room** as the
value-add. Top targets: Punggol Coast (6.0k), Bukit Canberra (3.1k), Yishun Park (2.7k), Senja
(2.6k), Changi Village (1.9k), Anchorvale (1.5k), Chinatown Complex (1.4k), Ci Yuan (1.3k), Woodleigh
Village (1.2k), One Punggol (1.2k), Buangkok (1.1k), Newton (1.1k), Bukit Timah (900), Old Airport Rd
(900), Market St (900), Jurong West (800), Maxwell (800), Pasir Ris (800), Circuit Rd (700), Kovan
(600), Clementi (600), Kampung Admiralty (500). *(Exclude news/noise queries: "hawker chan", stall
feuds, personalities.)* Requires the `hawkerFinder` flag on. Tracked as tasks WS-B/WS-A Hawker.

### Phase 2 — Scale the factories (weeks 5–10)
- WS-B: remaining ~15 location pages (+listings), next ~30 brand pages, hawker centres (Maxwell, Wisma Geylang Serai).
- WS-A: 2nd optimization wave; create `AREA_PROFILES` for every area still on the fallback formula.
- WS-C: cuisine-gap pages (Middle-Eastern, Vietnamese, Peranakan) + roundups; mini-buffet/catering guides; delivery hub.

### Phase 3 — Depth, seasonal & long-tail (weeks 11+, ongoing)
- WS-C: travel destination guides; seasonal posts scheduled ~6 weeks ahead of each peak.
- WS-B: long-tail brands/ingredients; new PDF lead-magnets.
- WS-A: quarterly refresh of top pages (bump `dateModified`, refresh FAQ from SEO-scan deltas).

---

## Standing rules
- **Trust moat:** never assert a halal certification we haven't verified against the MUIS HalalSG
  register or the brand's own public statement. Use `status: "unknown"` when unverified; record the
  `source` and `lastChecked`. Never scrape MUIS data.
- **Cannibalization guard** (keyword-research-v3 §7): pSEO/landing own transactional heads; blog/guides
  own informational long-tail and link *down*. One primary head term per URL.
- **Every new page must clear its factory gate** before it indexes: location pages need ≥3 published
  listings (`AREA_INDEX_MIN`); ingredient detail pages need the full field set (`ingredientQualifies`).
- **Verify before commit:** `npm run check:content`, `npm run typecheck`, `npm run lint`; regenerate
  `lib/seo-counts.json` after seeding listings.
