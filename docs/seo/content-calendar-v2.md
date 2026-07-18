# Humble Halal — Content Calendar v2 (Cluster Expansion)

*Derived from [keyword-research-v2.md](./keyword-research-v2.md) and the raw
[`keywords/*.csv`](./keywords/). Supersedes the mapping in `../content-calendar-90day.md` for the
new clusters. Each row → one `lib/blog.ts` post (answer-first TL;DR + FAQ built from real
People-Also-Ask questions + section `links[]` into the directory/pSEO pages).*

## Legend
- **Cat** = target `BlogCategorySlug` (see `lib/blog-categories.ts`).
- **Tier** T1 = build now (KD ≤ 10, vol ≥ 150); T2 = next; seasonal = publish ~6 wks pre-peak.
- **Internal links** = the directory/pSEO pages the post must chip-link to (cannibalization guard:
  the post never targets the transactional head — it hands that to the linked page).

## Batch 1 — shipping in this PR (10 posts)

| Slug | Primary kw (vol/kd) | Cat | Key PAA / FAQ | Internal links |
|------|--------------------|-----|---------------|----------------|
| `halal-food-johor-bahru-guide` | jb halal food (90/0) + jb food (1000/0) | muslim-travel | Is JB food halal? Best halal food City Square? Halal buffet JB? | `/travel/johor-bahru` if exists, `/halal-food/*`, `/is-halal` |
| `crossing-to-johor-bahru-checkpoints-transport` | woodlands checkpoint (44k/5) | muslim-travel | Woodlands vs Tuas? How to get to JB? Train JB to KL? Prayer at checkpoint? | JB food post, `/mosques` |
| `umrah-from-singapore-guide` | umrah package singapore (200/1) | muslim-travel | Umrah cost? Umrah vaccination SG? Umrah vs hajj? Umrah visa? | `/travel/mecca`, `/travel/medina`, `/tools` |
| `halal-mala-singapore` | halal mala (600/0) | cuisines | Is mala halal? Halal mala xiang guo? Where near me? | `/halal/halal-steamboat-singapore` or pSEO, `/halal-food/*` |
| `halal-mookata-singapore` | halal mookata (500/0) | cuisines | Is mookata halal? Halal mookata buffet? Mookata vs steamboat? | pSEO mookata page, `/halal` |
| `halal-korean-bbq-singapore` | halal korean bbq (400/10) | cuisines | Is Korean BBQ halal? Halal samgyeopsal? Buffet? | existing `halal-korean-food-singapore` post, pSEO |
| `halal-western-food-singapore` | halal western food singapore (450/4) | cuisines | Is Western food halal? Halal steak/burger? Near me? | existing `halal-steak-singapore`, `/halal` |
| `is-it-halal-popular-chains-singapore` | is mos burger halal (700/0) + set | halal-questions | Is MOS Burger / Genki / Sukiya / Yoshinoya halal? | `/is-halal`, brand pages |
| `is-it-halal-bakeries-cafes-singapore` | is paris baguette halal (900/0) + set | halal-questions | Is Paris Baguette / BreadTalk / Cedele / Four Leaves halal? | `/is-halal`, `halal-cakes-bakeries-singapore` |
| `aqiqah-singapore-guide` | aqiqah singapore (200/0) | muslim-services | What is aqiqah? Aqiqah cost SG? When to do it? Boy vs girl? | `muslim-owned-businesses-singapore`, `halal-catering-singapore-guide` |

## Batch 2 — next (queued, not in this PR)

| Slug | Primary kw (vol/kd) | Cat | Notes |
|------|--------------------|-----|-------|
| `qurban-korban-singapore-2026` | korban 2026 (300/0) | muslim-services | Seasonal — publish ~4 wks before Hari Raya Haji; lead-capture (qurban vertical) |
| `halal-thai-food-singapore` | halal thai food singapore (450/16) | cuisines | T2; pSEO thai page keeps the head |
| `halal-seafood-singapore` | halal seafood singapore (300/11) | cuisines | T2; links to pSEO seafood |
| `halal-pizza-singapore` | halal pizza singapore (250/5) | cuisines | T1; no pSEO page yet — blog can hold head |
| `muslim-friendly-bangkok-guide` | halal food in bangkok (90/0) | muslim-travel | Aggregate outbound city guide |
| `muslim-friendly-bali-guide` | halal food in bali (70/0) | muslim-travel | Aggregate outbound city guide |
| `muslim-friendly-seoul-guide` | halal food in seoul (100/0) | muslim-travel | Aggregate outbound city guide |
| `is-it-halal-chocolate-snacks-singapore` | is royce chocolate halal (250/0) | halal-questions | Ingredient + brand roundup |
| `halal-zi-char-singapore` | halal zi char singapore (100/0) | areas-malls | Hawker/zi-char angle |
| `malay-wedding-venues-singapore` | malay wedding venue singapore (150/0) | muslim-services | Complements existing wedding-cost post |

## Seasonal schedule (publish ~6 weeks pre-peak — NOT in this PR)

| Post | Primary kw (vol/kd) | Publish by | Peak |
|------|--------------------|-----------|------|
| Hari Raya Haji 2026 guide | hari raya haji (8800/3) | early ~May 2026* | Hari Raya Haji |
| Qurban/Korban 2026 | korban 2026 (300/0) | ~4 wks pre | Hari Raya Haji |
| Ramadan 2027 (refresh existing) | iftar (1900/7) | ~mid Jan 2027 | Ramadan (Feb 2027) |
| Zakat fitrah 2027 | zakat fitrah 2026 (3000/0) | during Ramadan | Ramadan |
| Hari Raya Puasa 2027 | hari raya 2026 (36000/8) | ~Jan 2027 | Syawal (Mar 2027) |

*Hari Raya Haji 2026 has likely passed by publish date — if so, pivot the slug to a 2027 evergreen
guide. Verify the current Islamic-calendar dates before scheduling.

## Execution notes
- Follow `lib/blog.ts` conventions exactly: append to `rawPosts`, add a `META` entry (category +
  image + optional `leadVertical`), and list the slug in `PUBLISHED_SLUGS`. A missing `META` entry
  throws at module load, so build fails fast if a post is half-migrated.
- Reuse `BlogSection.links[]` for internal links (already rendered as `.article-place-links` chips).
- 1,500–2,000 words, `answer` 40–70 words, ≥4 FAQ items from harvested PAA.
- Set `leadVertical` on service/travel posts that map to a lead vertical (`catering`, `weddings`,
  and `umrah`/`qurban` if those verticals exist in `lib/lead-verticals`).
