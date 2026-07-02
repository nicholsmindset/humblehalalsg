# Humble Halal — UX/UI Design Audit (July 2026)

**Auditor brief:** Principal Product Designer, enterprise-grade / launch-readiness pass
**Target:** Live production — https://www.humblehalal.com
**Viewports:** Desktop 1440×900 and Mobile 375×812
**Method:** Real-browser crawl (Playwright) — a11y snapshot, full-page screenshot, scripted measurements (horizontal overflow, tap-target size, heading order, alt text, duplicate imagery), hover/focus checks, console errors. Findings cross-referenced to the site's own CSS tokens/components.
**Coverage:** Representative templates — one real example per programmatic template + every unique page. Auth-gated internals (`/admin`, `/owner`, dashboard content, event `/manage`/`/checkin`) are noted where not reachable without credentials.

**Severity key:** Critical = blocks launch / breaks trust or function · High = clearly below enterprise standard, fix before launch · Medium = polish gap · Low = nice-to-have.

---

## Design-system baseline (the rubric)

No Tailwind — hand-authored CSS. Tokens in `styles/styles.css`; ~11 feature CSS files; shared React primitives in `components/ui.tsx`; chrome (TopNav/BottomNav/Footer/PrayerStrip) in `components/chrome.tsx`.

- **Color:** emerald `#0F5C4A` (primary) · gold `#D6A84F` (accent) · cream `#FAF7EF` (bg) · ink `#1F2933` / ink-soft `#586471` / ink-faint `#6C7682` (text) · line `#ECE7DB`.
- **Type:** Spectral (serif headings, 600, −.01em) · Hanken Grotesk (sans body 16/1.5). Five serif families loaded (Spectral, Cormorant, Libre Caslon, Newsreader + fallbacks).
- **Radius:** 10 / 14 / 20 / 28 / pill. **Buttons:** `.btn` + `-primary / -gold / -outline / -ghost / -soft` × `-sm` / default / `-lg`. No React `<Button>` component.
- **Known system gaps (pre-flagged):** no spacing scale (raw px), scattered grid definitions, ad-hoc icon sizes (13–20px), one-off `.hero-*/.area-*/.biz-cta-*` classes in `screens.css`.

---

## Sitemap (audited templates)

| Section | Representative URL(s) | Programmatic count |
|---|---|---|
| Home | `/` | 1 |
| Directory hub | `/explore` (+ search state) | 1 |
| Business detail | `/business/[slug]` | ~298 |
| Brand checker | `/is-halal`, `/is-halal/[brand]` | open-ended |
| SEO landing | `/halal/[slug]` | ~80–100 |
| Mosques | `/mosques` | 1 |
| Travel hub | `/travel` | 1 |
| Travel city | `/travel/[city]` | 18 |
| Hotel detail | `/travel/hotel/[id]` | 100–500+ |
| Flights | `/travel/flights` | 1 |
| Tools hub | `/tools` | 1 |
| Tool (dynamic) | `/tools/prayer-times`, `/tools/zakat` | ~23 |
| Quran reader | `/tools/quran/[surah]` | 114 |
| Events | `/events`, `/events/[slug]` | ~5–10 |
| Blog | `/blog`, `/blog/[slug]`, `/blog/category/[slug]` | ~24 + 6 cats |
| Guides | `/guides` | 1 |
| Conversion | `/pricing`, `/for-business`, `/advertise`, `/ask`, `/subscribe` | 5 |
| Seasonal | `/ramadan`, `/hari-raya` | 2 |
| Static/trust | `/about`, `/faq`, `/contact`, legal set | ~15 |
| Auth/states | `/login`, `/404`, `/dashboard`, `/saved` | — |

---

## 1. Home — `/`

### Desktop (1440)

| # | Location (page + section + viewport) | Issue | Severity | Specific Fix |
|---|---|---|---|---|
| 1 | Home › "Discover halal places" › desktop | Section renders heading + tabs (Featured/Newest/Top rated) + "See all" but **zero listing cards** below — leaving a large empty band before "Popular areas". The flagship discovery module on the homepage is empty. | Critical | Render the featured `ListingCard` grid (real seeded data exists — 298 businesses). If a tab can legitimately be empty, show the `Empty` primitive with copy + CTA, never a bare heading. Add a guard so the section is hidden when no cards resolve. |
| 2 | Home › "Popular areas in Singapore" › desktop | Area cards use **duplicated/incorrect stock imagery** — the same photo (`photo-1565967511849…`) repeats across 4 of 6 cards (Tampines, Bugis, Bedok, Paya Lebar all show an identical peacock/Marina-Bay night image unrelated to the area). | High | Assign distinct, area-appropriate photos per area (or a consistent branded placeholder). Remove Unsplash generic peacock image. De-dupe `src` per card. |
| 3 | Home › "Popular areas" counts › desktop | Every area card reads **"0 places"** while the hero claims "301+ places" — direct data contradiction that reads as broken/unseeded. | High | Wire the per-area count query; if genuinely 0, hide the count chip rather than print "0 places". |
| 4 | Home › top notice banner › desktop | **"🌙 Early preview — Humble Halal is launching soon … we're still adding listings & features"** shown on the live, publicly-launched site, directly contradicting the footer's "Singapore's most trusted halal … directory." Erodes credibility. | Medium | Remove the preview banner now the site is live, or downgrade to a subtle "New" ribbon. Reconcile "launching soon" vs "most trusted." |
| 5 | Home › "List your business" green card › stat column › desktop | The right-hand `Free / Verified / Muslim` stat stack renders the headline words (gold) with inconsistent visual weight vs their captions; the trio sits unbalanced against the large card, reading as placeholder. | Medium | Normalise the stat pattern (equal type scale + gutters); align to a 3-up grid or convert to a compact metric row. |
| 6 | Home › footer nav columns › desktop (SITE-WIDE) | Footer link items (Explore, Events, Islamic tools, Map view, Saved places, Travel, For-business, Trust, Company, category list) are **clickable `<div>`s (cursor:pointer), not `<a>` elements** — not keyboard-focusable, no href, invisible to crawlers, can't open in new tab. Only blog-category + legal rows are real links. | High | Convert all footer navigation items to `<Link>`/`<a href>`. Same fix applies to the home category tiles (rendered as `<button>` navigations). |
| 7 | Home › hero collage › desktop | Hero uses the same peacock travel image as the area cards (duplicate `src` across hero + areas), weakening the "real, verified places" promise. | Low | Use genuine food/venue photography in the hero collage. |

_Measurements: no horizontal overflow (scrollW=innerW=1470). 1× h1 (correct). Heading order logical (h1→h2→h3). 0 images missing alt. Duplicate image srcs: 4× + 2×._

### Mobile (375)

| # | Location (page + section + viewport) | Issue | Severity | Specific Fix |
|---|---|---|---|---|
| 8 | Home › "Discover halal places" › mobile | Same empty band as desktop — heading + tabs + "See all", zero cards. | Critical | Render cards or hide module + provide empty-state. |
| 9 | Home › "Popular areas" › mobile | All 6 cards read "0 places" vs hero "301+ places". | Critical | Wire counts; suppress chip if 0. |
| 10 | Home › area cards + hero collage › mobile | Placeholder dev strings leak into visible UI: captions literally read **"photo · tampines street"**, "photo · nasi padang", "photo · kopi café"; 4× duplicate area image. | High | Remove `photo · …` caption strings (dev placeholder); de-dupe imagery. |
| 11 | Home › header EN/BM toggle › mobile | Tap targets 37×44 / 40×44 — sub-44 width. | Medium | Expand touch area to ≥44px. |
| 12 | Home › footer legal row › mobile | Legal links 31–43px wide (PDPA 31×44, Terms 36). | Low | Increase min tap width to 44px. |
| 13 | Home › prayer strip › mobile | Next-prayer time visibly swapped Asar→Zohor between loads (hydration/clock). | Low | Stabilise hydration so time doesn't flip on load. |
| 14 | Home › email capture › mobile | "Get the weekly halal guide" appears in-hero AND in footer — duplicate offer in one scroll. | Low | Keep one primary capture; de-emphasize the duplicate. |

_Measurements: no overflow (scrollW=375). 1× h1. 15 clickable non-link `<div>`s (footer/category). 0 console errors._

---

## 2. Directory hub — `/explore` (+ search state)

### Desktop (1440)

| # | Location (page + section + viewport) | Issue | Severity | Specific Fix |
|---|---|---|---|---|
| 15 | Explore › card grid › desktop | **402 (Payment Required) image failures** — ~5 of 12 cards render a bare emerald diagonal-stripe placeholder (Pasta Brava, Osia, Plentyfull, Forest, Min Jiang). Production image CDN/quota exhausted. | Critical | Fix image billing/quota (402); ship a branded monogram fallback tile, not a blank stripe. |
| 16 | Explore › every card meta › desktop | Every listing shows identical **"42" halal-confidence** and **"New"** badge across 301 places — the flagship trust score reads as fake/non-functional. | Critical | Compute real per-business scores; scope "New" to genuinely new records. |
| 17 | Explore › page structure › desktop | **No `<h1>` and no `<h2>`** on a core hub ("301 places" is a `<p>`). SEO + screen-reader landmark failure. | High | Add `<h1>` ("Explore halal places in Singapore") and heading groupings. |
| 18 | Explore › card body › desktop | **122 clickable `<div>`s** (cursor:pointer, not `<a>`/`<button>`) — card interior faux-clickable; only title + Save/Claim are real controls. | High | One stretched-link `<a>` card primitive. |
| 19 | Explore › card blurb vs badge › desktop | "Hjh Maimunah" subtitle says "**MUIS certified**" while its badge shows "42/100 · **Self-declared**" — copy contradicts trust badge on same card. | High | Reconcile certified state + score, or strip "MUIS certified" from blurb. |
| 20 | Explore › duplicate imagery › desktop | Identical curry-pan stock used for both "Atrium Restaurant" cards AND "The Guild"; generic, unrelated to business. | High | Business-specific imagery; dedupe visible photos. |
| 21 | Explore › search results (?q=nasi) › desktop | 13 results but **no "Results for 'nasi'" heading** and no query in `<h1>` — no orientation/SEO. | Medium | Add "13 results for 'nasi'" heading. |
| 22 | Explore › console › desktop | Repeated **`Multiple GoTrueClient instances detected`** Supabase warnings (24+) every load. | Medium | Instantiate a singleton Supabase browser client. |
| 23 | Explore › "Claim" chips › desktop | 12× "Claim" at 62×22px — sub-44 height and visually noisy (every card shouts Claim). | Medium | ≥44px height; show Claim on hover/detail only. |
| 24 | Explore › sort/filter controls › desktop | Native unstyled `<select>` sort + tiny inline "Search" button don't match the token system. | Low | Style select + filter drawer to tokens. |

_Measurements: no overflow. h1=0, h2=0. 73 sub-44 targets. 122 non-link divs. Console: 5× 402 + GoTrue warning flood._

---

## 3. Business detail — `/business/[slug]` (Hjh Maimunah)

### Desktop (1440)

| # | Location (page + section + viewport) | Issue | Severity | Specific Fix |
|---|---|---|---|---|
| 25 | Business › gallery › desktop | For a Malay/Nasi Padang restaurant the gallery shows a **glamour beauty-model portrait**, a generic bar interior, and a **raw pork-looking joint of meat**. On a halal-TRUST brand this is reputationally severe. | Critical | Remove all un-curated stock immediately; gate galleries so only verified photos render — else a branded "Photos coming soon" tile. |
| 26 | Business › hero banner › desktop | Hero is a blank emerald diagonal-stripe placeholder (402) — the page's first impression is empty. | Critical | Fix image pipeline; real venue photo or branded fallback as hero. |
| 27 | Business › hours › desktop | Three-way contradiction: header meta "**Hours not listed**", sidebar "**Closed**", and no hours table. | High | Single source of truth; if unknown, say "Hours not listed" everywhere, drop "Closed". |
| 28 | Business › map tile › desktop | "Map" is a fake placeholder reading "**photo · map location**" — no real embed; placeholder string leaks. | High | Embed real map (or "Open in Maps" tile); remove `photo · …`. |
| 29 | Business › halal-confidence card › desktop | "42 · Self-declared" + "**0 community confirmations**" for an iconic MUIS-certifiable institution — flagship trust feature reads abandoned. | High | Backfill real cert/score; hide the confirmations counter until >0. |
| 30 | Business › overview copy › desktop | Auto-generated copy grammatically broken: "…consistent quality **across restaurant**." + tagline runs into sentence with no separator. | Medium | Fix template string (trailing "across {category}." bug); add sentence boundary. |
| 31 | Business › "More halal places in Kampong Glam" › desktop | Related items are Outram, Raffles Place, Tanjong Pagar — **not** Kampong Glam; heading contradicts contents; cards recycle curry image + 402 blanks. | Medium | Filter related by actual area; fix imagery. |
| 32 | Business › Reviews tab › desktop | Reviews tab has no content and no empty-state; tab active/focus states barely visible. | Medium | Add "Be the first to review" empty-state; visible tab active/focus. |
| 33 | Business › CTAs › desktop | "Claim this listing/business" appears **3×** on one page (header, banner, action row); Save hover shows no visible state change. | Low | Consolidate Claim to one primary + one contextual; add hover/focus states. |

_Measurements: no overflow. h1=1. 64 sub-44. 11 imgs, 2 missing alt. 36 non-link divs. Console: 402 image error._

---

## 4. Brand checker — `/is-halal` + `/is-halal/[brand]`

### Desktop (1440)

| # | Location (page + section + viewport) | Issue | Severity | Specific Fix |
|---|---|---|---|---|
| 34 | /is-halal hub › desktop | Titled "Brand & Restaurant **Checker**" but has **no search/checker input** — it's a static A–Z list; users can't check an unlisted brand. | High | Add real typeahead ("Type a brand…") routing to `/is-halal/[brand]` or a "not found → verify on HalalSG" path. |
| 35 | Brand verdict pills › both | "Yes/No/Not certified" verdicts rely on **color as sole signal**; "No" pills risk red-on-cream contrast. | Medium | Add text + icon (not color-only); meet WCAG AA on cream. |
| 36 | /is-halal/[brand] › meta line › desktop | "Last checked… Source…" meta is ink-faint `#6C7682` on cream at small size — **likely fails WCAG AA**. | Medium | Darken to ink-soft `#586471` or darker. |
| 37 | /is-halal/[brand] › FAQ accordions › desktop | Accordion triggers (`role=group`) lack a visible chevron / `aria-expanded` affordance. | Low | Add chevron + `aria-expanded`. |
| 38 | Template quality › both | **Strong template** — sourced, dated "June 2026", HalalSG deep-link, related brands. Use as the model for the business-detail trust module. | — | Port this rigor into business detail. |

_Measurements: /is-halal — no overflow, h1=1, h2=25, hasSearch=**false**, 6 non-link divs, console clean._

---

## 5. SEO landing — `/halal/halal-buffet-singapore`

### Desktop (1440)

| # | Location (page + section + viewport) | Issue | Severity | Specific Fix |
|---|---|---|---|---|
| 39 | Landing › newsletter block › desktop | Broken template variable in visible copy: "New places in **Singaporeland** in our weekly newsletter first." | High | Fix interpolation token (should be "in Singapore"); audit all landings for the same string. |
| 40 | Landing › results grid › desktop | Only **4 listings** for a headline money term ("best halal buffet") and 3 of 4 are blank 402 placeholders; only Atrium has a (recycled curry) image. Thin + broken. | High | Show 8–12 real buffet listings with working images; fix 402. |
| 41 | Landing › H2 copy › desktop | H2s are generic "Top halal places in Singapore" on a *buffet* page — not localized to the keyword. | Medium | Interpolate the vertical: "Top halal **buffets** in Singapore". |
| 42 | Landing › cards › desktop | Same universal "42 / New / Claim" monotony as /explore. | Medium | Real scores (see #16). |
| 43 | Landing › grid balance › desktop | Row 2 has a single card leaving a large empty right gap — asymmetric grid. | Low | Balance to full rows or fill the slot. |
| 44 | Landing › accordions › desktop | "What to look for" accordions are pointer `role=group` (56 non-link divs), low interactive affordance. | Low | Chevrons + real button semantics. |

_Measurements: no overflow, h1=1, 1 img, 67 sub-44, 56 non-link divs. Console: 3× 402._

---

## 6. Mosques — `/mosques`

### Desktop (1440) + Mobile (375)

| # | Location (page + section + viewport) | Issue | Severity | Specific Fix |
|---|---|---|---|---|
| 45 | Mosques › rows › mobile | Rows look clickable (`cursor:pointer`) but only the tiny "**Map →**" (45×21px) is a real link — the row isn't tappable; 82 sub-44 targets on mobile. | High | Make the whole row a link; enlarge "Map →" to ≥44px height. |
| 46 | Mosques › region jump chips › mobile | Chips 37px tall (below 44px min height). | Medium | Increase chip height to 44px. |
| 47 | Mosques › "Map →" links › both | 70× links open a Google Maps **name-search**, not pinned coordinates — imprecise for same-named mosques. | Medium | Link to exact lat/lng where known. |
| 48 | Mosques › data richness › both | Rows give name + area only — no prayer facilities, distance, or per-mosque map, despite the trust-brand prayer-space promise. | Low | Add facilities/nearest-MRT metadata. |
| 49 | Mosques › count copy › both | Intro "70 mosques" vs closing line implying ~71 (offshore Pulau Bukom) — minor ambiguity. | Low | "70 of 71 mosques (excluding offshore Pulau Bukom)". |
| 50 | Mosques › breadcrumb › both | Breadcrumb uses a literal "›" text node vs the icon-chevron used on business pages — inconsistent. | Low | Standardise breadcrumb separators site-wide. |

_Measurements (mobile): no overflow (scrollW=360). h1=1. 82 sub-44. 6 non-link divs. Console clean._

---

## 7. Travel hub — `/travel`

### Desktop (1440) + Mobile (375)

| # | Location (page + section + viewport) | Issue | Severity | Specific Fix |
|---|---|---|---|---|
| 51 | Travel hub › hero "Search" CTA › desktop | Primary Search CTA is **white bg + emerald text** (not `.btn -primary` emerald fill) — the page's #1 action is the lowest-affordance element; reads as a chip. | High | Apply `.btn -primary -lg` (emerald fill, cream text). |
| 52 | Travel hub › "Popular halal-friendly destinations" grid › desktop | 24 solid-emerald cards form a monotonous wall — no imagery, identical fill, no hierarchy vs hotel cards above. Off-brand density. | High | Add city thumbnail per card, reduce fill saturation, cap visible + "See all". |
| 53 | Travel hub › destinations grid › mobile | Destinations stack as full-width emerald bars; hub is ~11,900px single column — excessive scroll. | Medium | 2-col chip grid on mobile; collapse dates/guests into a 2-up row. |
| 54 | Travel hub › gold "UMRAH" badges › desktop | Only Mecca/Medina carry a gold badge on emerald (gold `#D6A84F` on emerald borderline AA); lone badges make the module look half-tagged. | Medium | Verify contrast ≥4.5:1; tag all cards consistently or drop lone badges. |
| 55 | Travel hub › "Ho Chi Minh City" card › desktop | Label wraps to 2 lines → card taller than row siblings → grid baseline break. | Medium | Fixed card min-height or single-line ellipsis. |
| 56 | Travel hub › images › mobile | Console: **`_next/image` 402** — images fall back un-optimized (same pipeline failure as directory). | High | Fix Vercel image 402 / self-host. |
| 57 | Travel hub › footer + category pseudo-links › desktop (SITE-WIDE) | 18 `cursor:pointer` `<div>`/`<span>` that aren't `<a>`/`<button>`; footer links 154×21px (sub-44). | High | Real anchors; ≥44px hit area. |

_Measurements: no overflow (1425/1440). smallCount 73 desktop / 16 mobile. h1=1. Console: 402 `_next/image` (mobile)._

---

## 8. Travel city hub — `/travel/singapore`

### Desktop (1440)

| # | Location (page + section + viewport) | Issue | Severity | Specific Fix |
|---|---|---|---|---|
| 58 | City › "18 Muslim-friendly hotels" grid › desktop | **Bottom 6 cards render blank cream image placeholders** (Paradox, Mondrian, Capri, Shangri-La, JEN, Ritz-Carlton) while top 12 have photos — 402 pipeline symptom; looks broken. | Critical | Fix image 402; branded logo-watermark fallback so cards never render empty. |
| 59 | City › "Halal filters" module › desktop | Filter bar exposes exactly **one** chip ("Halal food") — orphaned stub, not a filter system. | High | Add full facility filter set (prayer room, alcohol-free, qibla, halal-nearby) or remove until populated. |
| 60 | City › hotel-card Muslim-friendly overlay › desktop | Only 1 of ~18 cards shows a "Muslim-friendly (unverified)" badge — the halal overlay looks unpopulated/inconsistent across inventory. | High | Show a facility/verification chip on every card (even "No verified facilities yet"). |
| 61 | City › "Top picks" carousel vs main grid › desktop | Same hotels repeat in carousel AND grid below — duplicated content, wasted vertical space. | Medium | De-dup: exclude carousel items from grid or make carousel distinct "editor's picks". |
| 62 | City › "Other destinations" cards › desktop | Reuses flat emerald-card monotony; gold UMRAH badge contrast on emerald. | Low | Align to fixed destination-card component; verify contrast. |
| 63 | City › price-context banner › desktop | "Singapore averages USD 218/night" in ink-faint on cream — low contrast, easy to miss; USD only for a SG audience. | Low | Bump to ink-soft `#586471`; add SGD currency toggle. |

_Measurements: no overflow. smallCount 62. h1=1. 6 visually-blank cards. Console clean._

---

## 9. Hotel detail — `/travel/hotel/[id]` (PARKROYAL Marina Bay)

### Desktop (1440) + Mobile (375)

| # | Location (page + section + viewport) | Issue | Severity | Specific Fix |
|---|---|---|---|---|
| 64 | Hotel › "Choose your room" thumbnails › desktop | **~11 of 12 room rows show blank/grey thumbnail squares** (only "COLLECTION Club" has a photo) — 402 failure; long room list looks broken. | Critical | Fix pipeline; room-type fallback image; one image per room-type not per rate. |
| 65 | Hotel › gallery + icons › desktop | **8 images missing `alt`** (gallery + qibla/prayer icons) — a11y + SEO gap on the key travel page. | High | Add descriptive alt to all gallery/room imgs. |
| 66 | Hotel › "Prayer times today" widget › desktop | Console: **502 on `/api/travel/weather`** — weather backend failing; prayer/weather context may silently degrade. | High | Fix weather API (502); independent fallback for the prayer-times widget. |
| 67 | Hotel › "Choose your room" list › desktop & mobile | 12+ near-identical Room-Only/Breakfast rate rows; desktop 8,700px, **mobile 16,995px** of mostly grey rows. | High | Group by room type with expandable rates; paginate/"show more". |
| 68 | Hotel › map controls / Save / "Show all 58 photos" › mobile | Several sub-44px controls (map zoom, Save, photo-count). | Medium | Enlarge to ≥44px. |
| 69 | Hotel › sticky Reserve bar › mobile | Sticky Reserve may crowd the OS bottom tab bar on small screens. | Medium | Ensure Reserve bar clears bottom nav; single persistent price+Reserve. |
| 70 | Hotel › Reserve CTA › desktop | ✓ Correct emerald `-primary` — note the inconsistency vs white Search CTAs elsewhere. | Low | Standardize all primary CTAs to this emerald fill. |

_Measurements: no overflow. smallCount 71 desktop / 16 mobile. h1=1. noAlt=8 desktop. Console: 502 `/api/travel/weather`._

---

## 10. Flights — `/travel/flights`

### Desktop (1440) + Mobile (375)

| # | Location (page + section + viewport) | Issue | Severity | Specific Fix |
|---|---|---|---|---|
| 71 | Flights › search "Search" CTA › desktop | White bg + emerald text again — **and mobile Search is emerald-filled**, so the same primary action differs across viewports. | High | Make desktop Search emerald `-primary` to match mobile & Reserve. |
| 72 | Flights › "Non-stop only" checkbox › desktop | Native `<input>` checkbox at **13×13px** — unstyled, off-brand, far below 44px. | High | Styled 20px+ checkbox in a 44px hit area, emerald check. |
| 73 | Flights › results filter sidebar (Stops/Baggage/Airlines) › desktop | **17 native radio/checkbox controls** (~13–18px) — unstyled, off-brand, tiny targets (smallCount 150). | High | Custom-styled radio/checkbox, emerald accent, 44px rows. |
| 74 | Flights › "Why Muslim travellers fly…" + FAQ › desktop | FAQ/"How it works" render at ~half width leaving a large empty right column — unbalanced whitespace, feels unfinished below the fold. | Medium | Centered max-width or 2-col FAQ. |
| 75 | Flights › Best/Cheapest/Fastest tab row › mobile | Tab row horizontally clipped ("Fastest" partly cut); internal scroll not obvious → looks truncated. | Medium | Scroll affordance or fit 3 tabs to width. |
| 76 | Flights › "Trending destinations" carousel › desktop | Only 4 of 8 visible; no dots/affordance that 8 exist. | Low | Pagination dots or peek-next edge. |
| 77 | Flights › results flight cards › desktop | ✓ Strong — "Muslim meal on request", "Prayer room at BAH · 2h 25m layover", Best/Cheapest/Fastest, CO2, refundable, hotel cross-sell, emerald Select. | Low | (Positive) Add tooltips explaining MOML. |

_Measurements: no overflow. smallCount 70 landing → 150 results (17 native controls). h1=1. Muslim-meal flags present. Console clean on flights._

---

## 11. Tools hub — `/tools`

### Desktop (1440) + Mobile (375)

| # | Location (page + section + viewport) | Issue | Severity | Specific Fix |
|---|---|---|---|---|
| 78 | Tools hub › tool grid › desktop | Ragged card heights per row — multi-line titles ("Hijri Date Converter", "99 Names of Allah", "Halal Stock Screener") make some cards taller than row-mates, breaking the baseline grid. | Medium | Equal card heights (`align-items:stretch` + `h-full` on card link). |
| 79 | Tools hub › card title/chevron › desktop | Two-line titles push the description down; trailing `→` chevron floats un-anchored vertically. | Low | Pin chevron to card bottom-right (absolute) or center independent of title length. |
| 80 | Tools hub › "Finders" section › both | "Halal Food Near You" + "Mosque Finder" leave a 3-cell gap in a 4-col grid — section looks unfinished. | Low | Use a 2-col grid for this short section or balance with upcoming tools. |
| 81 | Tools hub › footer link columns › desktop (SITE-WIDE) | Footer items rendered as clickable `<span>`/`<div>` (6 non-link), not `<a>`. | Medium | Convert to real anchors. |

_Measurements: no overflow. smallCount 61 (nav+footer). h1=1. Icons are inline SVG (0 imgs). Console clean._

---

## 12. Prayer times — `/tools/prayer-times`

### Desktop (1440) + Mobile (375)

| # | Location (page + section + viewport) | Issue | Severity | Specific Fix |
|---|---|---|---|---|
| 82 | Prayer times › results area › both | With location denied it collapses to one sentence ("Allow location access…") — no times table, no skeleton, **no manual city fallback**; ~60% dead canvas (page only 1599px). | High | Offer a manual city input or default to Singapore (SG-first product); illustrated empty-state. |
| 83 | Prayer times › controls vs newsletter › desktop | Axis misalignment: controls row is center-aligned in a narrow column while the newsletter card + disclaimer are left-aligned — two competing alignment axes. | High | Left-align controls to the same content gutter; wrap controls in a card matching newsletter width. |
| 84 | Prayer times › method dropdown › both | Native unstyled `<select>` (OS chevron) instead of `.select` token with emerald focus ring. | Medium | Restyle with `.select` + branded chevron + emerald focus. |
| 85 | Prayer times › disclaimer text › both | Fine-print "(via Aladhan)…" is ink-faint on cream — fails ~AA at small size. | Medium | Darken to ink-soft `#586471` or ≥14px. |
| 86 | Prayer times › right column › desktop | Single left column leaves the entire right half of the 1440 canvas empty — no next-prayer/hijri/countdown panel. | Medium | Add a live "next prayer / countdown / hijri date" panel in the right column. |

_Measurements: no overflow. smallCount 62. h1=1. select 48px. Console clean._

---

## 13. Zakat calculator — `/tools/zakat`

### Desktop (1440) + Mobile (375)

| # | Location (page + section + viewport) | Issue | Severity | Specific Fix |
|---|---|---|---|---|
| 87 | Zakat › number inputs › both | **No focus-visible ring** (focused input has `outline:none`, `box-shadow:none`) — keyboard users get zero focus indication (WCAG 2.4.7 fail); the emerald focus ring is absent. | High | Apply `.input:focus-visible` emerald ring to all spinbuttons. |
| 88 | Zakat › number inputs › both | Inputs have **no accessible name** — no `<label for>`/`aria-label`; SR announces an unlabeled spinbutton. | High | Wire each label via `htmlFor`/`id` or `aria-label`. |
| 89 | Zakat › "Debts due now" validation › both | Entering **−2000** leaves the invalid value in the field (min=0) but calc silently treats it as 0 with **no inline error/red border** — no feedback that input was rejected. | High | Inline validation + error border, or visible clamp + toast. |
| 90 | Zakat › top control card › desktop | 3-column control row has a large awkward gap between the Currency/Nisab group and the isolated "Silver price/gram". | Medium | Rebalance to a 3-equal-column grid. |
| 91 | Zakat › currency selector › both | Native unstyled `<select>` — off-brand vs `.select`. | Medium | Apply `.select` token. |
| 92 | Zakat › newsletter card › desktop | Sits under the left form column only (~half width) while results occupy the right — asymmetric footer. | Low | Make newsletter full content-width below both columns. |
| 93 | Zakat › "Find a mosque to give through" › desktop | Full-width emerald primary CTA inside the result panel competes with the SGD result figure. | Low | Demote to `.btn -soft`/`-outline` so the number stays the hero. |

_Measurements: no overflow. inputs 46px. focus outline=none (fail). aria-label=null (fail). calc math correct (25000×2.5%=625). Console clean._

---

## 14. Quran reader — `/tools/quran/[surah]` (Al-Fatihah)

### Desktop (1440) + Mobile (375)

| # | Location (page + section + viewport) | Issue | Severity | Specific Fix |
|---|---|---|---|---|
| 94 | Quran › Arabic ayah text › both | **Arabic renders in "Hanken Grotesk"** (a Latin sans with no Arabic glyphs) — falls back to an undeclared system Arabic font. For a Quran reader this is a quality/trust failure: no Uthmani/mushaf typeface, inconsistent shaping, thin glyphs. | High | Load a proper Quranic webfont (KFGQPC Uthmanic / Amiri Quran / Scheherazade) and apply explicitly to the ayah with `lang="ar"`. |
| 95 | Quran › ayah card layout › both | Arabic right-aligned + translation left-aligned with a large empty vertical gap — cards feel hollow/over-padded. | Medium | Tighten padding; add a subtle divider between Arabic and translation. |
| 96 | Quran › "Play recitation" icon › both | Play button shows a **right-arrow (→), not a play triangle (▶)** — reads as "next", misleading affordance. | Medium | Swap to a play/pause icon. |
| 97 | Quran › jump navigation › both | No in-page surah/ayah picker — only "All surahs" + next-surah; switching forces a round-trip to the index. | Medium | Add a surah/ayah jump selector in the reader header. |
| 98 | Quran › Arabic line-height › both | `line-height` ratio ≈2.2 (66.88px on 30.4px) — airy/sparse blocks. | Low | Reduce to ~1.9–2.0. |
| 99 | Quran › audio control bar › desktop | Prev/Play/Next + "Ayah 1/7" sits high under the H1 with a big gap before the ayah list — disconnected from the verses it drives. | Low | Make the audio bar sticky or adjacent to the reading area. |
| 100 | Quran › bottom surah nav › both | "All surahs" is a plain text link while "Al-Baqarah →" is a pill — inconsistent button system in one row. | Low | Use consistent `.btn -outline`/`-ghost` for both. |

_Measurements: no overflow (1440 & 360). h1=1. Arabic font-family="Hanken Grotesk" (wrong). dir=rtl, text-align right (correct). Console clean._

---

## 15. Events hub — `/events`

### Desktop (1440) + Mobile (375)

| # | Location (page + section + viewport) | Issue | Severity | Specific Fix |
|---|---|---|---|---|
| 101 | Events hub › events list › both | The ONLY event on the site is a mock — **"Community Iftar 2027 (Demo)", "by Humble Halal (demo)"** — a fake demo record shipped as the sole content on a live commercial page. | Critical | Seed real events or ship a proper empty-state; never leave a `(Demo)` record live. |
| 102 | Events hub › event-card thumbnail › both | Feature image fails to render — card shows only "photo · community" placeholder text; on 2nd load the `<img>` disappears (source of a console 404). Same image-failure family as directory/travel. | Critical | Fix event image pipeline; branded fallback tile (emerald + category glyph), not raw "photo ·" text. |
| 103 | Events hub › card wrapper › both | Card is a clickable `<div>` wrapping a real `<a>` plus nested clickable children (19 non-link) — nested/overlapping interactive regions, ambiguous hit target. | High | Single stretched-link `<a>`; remove redundant cursor:pointer divs. |
| 104 | Events hub › category filter chips › desktop | Chips are `<button>` but have no visible selected/active styling distinct from "All events". | Medium | Clear active `.btn -soft`/emerald state + `aria-pressed`. |
| 105 | Events hub › hero search › desktop | Search field 443×37px — below 44px min on a primary action. | Medium | Raise input+button to ≥44px per `.btn` height tokens. |
| 106 | Events hub › seating filter selects › desktop | Two native `<select>`s; "All areas" has ~50 ungrouped options with no search. | Low | Group areas by region or searchable combobox. |

_Measurements: no overflow. smallCount 61 desktop / 6 mobile. h1=1. Event card image BROKEN. 19 non-link. Console: 1× 404. (Events is NOT empty — one demo event.)_

---

## 16. Event detail — `/events/[slug]`

### Desktop (1440) + Mobile (375)

| # | Location (page + section + viewport) | Issue | Severity | Specific Fix |
|---|---|---|---|---|
| 107 | Event detail (`/events/demo-community-iftar`) › whole page › both | **The event detail route returns a hard 404 ("This page wandered off").** The only card on `/events` links here, so **every event click on the live site dead-ends.** Header/date/venue/RSVP/badge/share do not exist. | Critical | Fix event-detail routing/data fetch so real slugs render; the demo slug must resolve or be removed with its card. |
| 108 | 404 page › CTAs › both | "Back home" / "Explore" are `<button>` (JS nav), not `<a href>` — no href, not open-in-new-tab-able, no crawl path. | Medium | Use `<a href>` styled as `.btn`. |
| 109 | 404 page › body › both | Generic 404 with no search box or popular links — no recovery path back into events. | Low | Add "Browse all events" link + search on 404. |

_Measurements: event detail = hard 404 both viewports. no overflow. h1=1 ("This page wandered off")._

---

## 17. Blog hub — `/blog`

### Desktop (1440) + Mobile (375)

| # | Location (page + section + viewport) | Issue | Severity | Specific Fix |
|---|---|---|---|---|
| 110 | Blog hub › latest grid images › desktop | Later cards below the fold render with no `<img>` in DOM (lazy images never populated) → grid rows with and without imagery = inconsistent card heights. | High | Reserve aspect-ratio box + fallback so all cards keep uniform height even before/without image. |
| 111 | Blog hub › featured vs grid › desktop | "Featured" hero post uses essentially the same card treatment as the grid — no size/typographic hierarchy signaling it's featured. | Medium | Larger landscape featured card, bigger Spectral H2, distinct spacing. |
| 112 | Blog hub › category pills › both | Pills 40px tall (<44px); count badge glued to label with no gap ("Basics3"). | Medium | ≥44px pill height; add gap before count badge. |
| 113 | Blog hub › inline newsletter block › both | Mid-list email capture sits inside the grid flow at card width — reads as a card, weak separation. | Low | Distinct cream/emerald full-column band. |

_Measurements: no overflow. smallCount 69 desktop / 13 mobile. h1=1. Heading seq H1,H2×3,H3×20 (logical). Console clean._

---

## 18. Blog post — `/blog/[slug]`

### Desktop (1440) + Mobile (375)

| # | Location (page + section + viewport) | Issue | Severity | Specific Fix |
|---|---|---|---|---|
| 114 | Blog post › article prose column › desktop | **Measure too wide** — paragraph width 722px @16.8px ≈ 88–95 chars/line, well over the 45–75 ideal. Hurts readability on the flagship content type. | High | Cap prose column to ~65ch (≈620–680px) via article `max-width`. |
| 115 | Blog post › FAQ accordion › both | FAQ items are `role=group` wrapping a `cursor:pointer` `<div>`, NOT `<button aria-expanded>` — not keyboard-operable, no expand/collapse semantics, no focus-visible. | High | Rebuild as `<button aria-expanded>` disclosure. |
| 116 | Blog post › inline email captures › both | 2 near-identical newsletter forms within one ~8-min read + a 3rd in footer = 3 email asks per page. | Medium | Keep one inline capture; dedupe with footer form. |
| 117 | Blog post › hero feature image › desktop | Hero 760×428 from a 1200×800 (3:2) source → cropped inconsistently; column-width hero feels timid for a flagship article. | Medium | Lock consistent aspect-ratio box; consider wider-than-text hero. |
| 118 | Blog post › byline/meta color › both | Byline/meta greys (ink-faint) on cream — verify ≥4.5:1. | Low | Darken byline to ink-soft `#586471`. |
| 119 | Blog post › in-article buttons › both | Directory/brand-checker anchors are proper `.btn`; the two email-form buttons differ in height/fill — inconsistent on the same page. | Low | Normalize all in-article buttons to `.btn`. |
| 120 | Blog post › share controls › both | Header has byline + read-time but no share/save affordance on share-oriented content. | Low | Add share/save row under byline. |

_Measurements: desktop paraW 722px @16.8/26.88. mobile paraW 337px (fine). avgParaChars 223. hero 760×428 from 1200×800. no overflow. Console clean._

---

## 19. Blog category — `/blog/category/[slug]`

### Desktop (1440) + Mobile (375)

| # | Location (page + section + viewport) | Issue | Severity | Specific Fix |
|---|---|---|---|---|
| 121 | Category › hero image › desktop | "A mosque in Singapore" hero has no aspect-ratio lock; same mosque stock likely repeats across category heroes (template-y). | Medium | Lock aspect-ratio; curate per-category hero art. |
| 122 | Category › "Other topics" pills › both | Same 40px pills + glued count badge as blog hub (#112). | Medium | ≥44px + gap before count. |
| 123 | Category › post cards › desktop | Long titles wrap to 3 lines → uneven card heights in the row. | Low | `line-clamp:2` for row alignment. |

_Measurements: no overflow. h1=1. Heading seq H1,H2×4. Console clean._

---

## 20. Guides — `/guides`

### Desktop (1440) + Mobile (375)

| # | Location (page + section + viewport) | Issue | Severity | Specific Fix |
|---|---|---|---|---|
| 124 | Guides › download rows › both | Download affordance is a bare "↓" glyph in a `cursor:pointer` `<div>` — no PDF icon, no file size, no "Download PDF" label. Looks unfinished/untrustworthy for a lead-magnet. | High | Proper `.btn -gold`/`-outline` "Download PDF" with icon + size ("PDF · 2.1 MB"). |
| 125 | Guides › guide rows imagery › both | Zero imagery (imgTotal=0) — three text-only rows on a page whose job is to sell downloadable guides; no cover thumbnails = low conversion, bland. | High | Add PDF cover thumbnails per guide. |
| 126 | Guides › nomenclature › both | Breadcrumb "Free Guides" vs H1 "Free halal guides" vs nav "All guides" → /blog — three names for guide surfaces. | Medium | Unify nomenclature. |
| 127 | Guides › page density › both | Only a newsletter block below the 3 guides — page feels thin, large empty whitespace below fold on desktop. | Low | Add "what's inside" preview or more guides; tighten vertical rhythm. |

_Measurements: no overflow. h1=1. main imgTotal=0. 3 PDF links. Console clean._

> **Section-wide note (conversion/seasonal/static):** No page 404'd; consoles clean; no horizontal overflow. Recurring site-wide items (counted once): header EN/BM toggle ~40×44 (<44 width), footer legal links 31–43px wide, footer/category items rendered as clickable `<div>`/`<span>` not `<a>` (~6 per page).

## 21. Pricing — `/pricing`

### Desktop (1440) + Mobile (375)

| # | Location (page + section + viewport) | Issue | Severity | Specific Fix |
|---|---|---|---|---|
| 128 | Pricing › plan cards + founding banner › both | **Price contradiction:** Verified card = **$19/mo**, founding banner = "Verified at **$120/year ($10/mo)**" — two different anchor prices for the same tier on the money page. | Critical | Reconcile: show $19/mo struck-through vs founding $10/mo, or state the banner is the discounted rate explicitly. |
| 129 | Pricing › "Most popular" badge › desktop | Badge is clipped/overlaps the card's top gold border (sits half-outside the rounded corner). | High | Inset badge fully inside card; add top padding. |
| 130 | Pricing › 4-card row › desktop | Cards NOT bottom-aligned — Verified (7 rows) far taller than Featured/Premium (5 rows); ragged baseline looks broken. | High | Equal-height cards (`align-items:stretch`, feature list `flex:1`) so CTAs align. |
| 131 | Pricing › CTAs › both | Weak hierarchy: **3 of 4 buttons say "Join the waitlist"** while only Free is actionable — a pricing page where you can't buy reads pre-launch. | High | Differentiate CTA copy per tier; if truly waitlist, explain why paid plans aren't purchasable yet. |
| 132 | Pricing › founding banner price › both | "$120/year" gold on dark-emerald — borderline AA for 16px text. | Medium | Lighter gold/cream or bold white for the price token on emerald. |
| 133 | Pricing › Monthly/Yearly toggle › both | Segmented toggle 36px tall (<44) on the primary pricing control. | Medium | Raise to ≥44px. |
| 134 | Pricing › "/mo" cadence label › desktop | Tiny "/mo"/"forever" in ink-faint next to large price — low emphasis contrast on cream. | Low | Bump weight/contrast of cadence label. |

_Measurements: no overflow. smallCount 62 desktop / 7 mobile. h1=1. imgTotal=0. Console clean._

---

## 22. For business — `/for-business`

### Desktop (1440) + Mobile (375)

| # | Location (page + section + viewport) | Issue | Severity | Specific Fix |
|---|---|---|---|---|
| 135 | For-business › whole page › both | No social proof, no pricing preview, no testimonials/logos, no listing count — thin for a lead-gen landing (hero → 6 generic feature cards → CTA). | High | Add trust signals (business count, sample listings, testimonial) + pricing teaser linking to /pricing. |
| 136 | For-business › hero "See pricing" › both | Secondary CTA is a faint white/ghost outline on emerald hero — low contrast. | Medium | Use `.btn -soft`/lighter fill for secondary on emerald. |
| 137 | For-business › "Ready to be found?" band › both | "Claim existing listing" outline button on emerald band is low-contrast (thin light border). | Medium | Switch to `-soft` mint fill. |
| 138 | For-business › feature icons › desktop | 6 near-identical icon-only tiles feel monotonous. | Low | Vary accent or group into benefit clusters. |

_Measurements: no overflow. smallCount 60/5. h1=1. imgTotal=0. Console clean._

---

## 23. Advertise — `/advertise`

### Desktop (1440) + Mobile (375)

| # | Location (page + section + viewport) | Issue | Severity | Specific Fix |
|---|---|---|---|---|
| 139 | Advertise › pricing vs /pricing › both | **Cross-page price inconsistency:** "Featured Listing from **$89/mo**" here vs "Featured **$49/mo**" on /pricing. | Critical | Align naming/price or clarify these are different products (ad placement vs plan). |
| 140 | Advertise › "Ways to advertise" grid › desktop | 6 cards in a 4-col grid → last row 2 cards + large empty right gap (orphaned row). | High | 3-col grid (2 even rows) or center trailing row. |
| 141 | Advertise › hero alignment › desktop | Hero is left-aligned while /pricing, /subscribe, /ask, /for-business heroes are centered — inconsistent hero system. | Medium | Standardize hero alignment across conversion pages. |
| 142 | Advertise › two email forms › both | Two identical "Email address" capture forms — SR users hear duplicate "Email address". | Medium | Distinct accessible names (e.g. "Work email for media kit"). |
| 143 | Advertise › "See listing plans" hero button › both | White outline on cream — weak contrast border. | Medium | outline-emerald or `-soft`. |

_Measurements: no overflow. smallCount 60. h1=1. imgTotal=0. Console clean._

---

## 24. Ask AI concierge — `/ask`

### Desktop (1440) + Mobile (375)

| # | Location (page + section + viewport) | Issue | Severity | Specific Fix |
|---|---|---|---|---|
| 144 | Ask › search submit › desktop | ✓ **RE-VERIFIED WORKING (not a no-op).** Clicking the submit button after typing returns an in-place grounded answer: "Here are 6 halal places matching '…'. Always confirm certification on MUIS HalalSG." + 6 real, relevant `/business/{id}` cards (correctly matched Bugis + nasi padang). The earlier "dead submit" was a synthetic-Enter artifact. Remaining issues: result cards show 402 placeholder images + uniform "42/100" scores (see #15/#16); no visible loading state during fetch. | Low | Add a loading/streaming state; fix result-card images + scores via the systemic fixes. |
| 145 | Ask › naming › both | Nav "Ask AI" vs page H1 "Halal concierge / Ask for exactly what you want" vs input `aria-label`="Search" — three names for one feature. | High | Unify naming; label input "Ask the halal concierge". |
| 146 | Ask › "How the concierge works" grid › desktop | 3 cards in 2-col → 2 on top, 1 orphaned bottom-left with huge empty right space. | High | 3-col grid so cards balance. |
| 147 | Ask › content column › desktop | Content sits in a narrow left-of-center column on 1440 with large empty margins — feels sparse/misaligned. | Medium | Center/widen the column; balance whitespace. |
| 148 | Ask › prayer widget › mobile | Prayer header flickered "Asar 4:32" ↔ "Zohor 1:09" across renders on one load. | Medium | Stabilize prayer-time hydration. |

_Measurements: no overflow. h1=1. input aria="Search". Console clean._

---

## 25. Subscribe — `/subscribe`

### Desktop (1440) + Mobile (375)

| # | Location (page + section + viewport) | Issue | Severity | Specific Fix |
|---|---|---|---|---|
| 149 | Subscribe › form fields › both | Labels are placeholder-only ("First name (optional)", "you@email.com") as generic divs — no persistent visible `<label>`; context lost once typing. | Medium | Add real persistent `<label>` above each field. |
| 150 | Subscribe › layout › desktop | Card centered but benefit checklist sits below-left and right half is empty — asymmetric composition. | Low | Two-column (form left, benefits right) or center-stack. |
| 151 | Subscribe › content width › mobile | scrollW=360 (<375) — content underfills viewport width (extra side padding). | Low | Use full mobile width minus standard gutter. |

_Measurements: no overflow. h1=1. Console clean._

---

## 26. Seasonal — `/ramadan` & `/hari-raya`

### Desktop (1440) + Mobile (375)

| # | Location (page + section + viewport) | Issue | Severity | Specific Fix |
|---|---|---|---|---|
| 152 | Ramadan › hero intro › both | Typography bug: "…around **18 February 2026**(1447 AH)…" — missing space before the parenthesis. | High | Insert space before "(1447 AH)". |
| 153 | Ramadan/Hari-Raya › FAQ accordions › both | FAQ items are `role=group` + clickable `generic` (not `<button>`/`<details>`) — not keyboard-focusable or announced expandable. Same on /faq. | High | Rebuild as `<button aria-expanded>` or `<details>/<summary>` (one shared component). |
| 154 | Ramadan/Hari-Raya › hero › both | No festive hero image/illustration — plain text + link grid feels thin for a seasonal landing. | Medium | Add seasonal hero image + countdown. |
| 155 | Ramadan › "Plan your Ramadan" grid › desktop | 8 links in 3-col → last row 2 items + empty 3rd column (ragged). | Medium | Balance to even rows or fill. |
| 156 | Ramadan/Hari-Raya › content column › both | Blocks left-aligned narrow with large right whitespace; page reads left-weighted; mobile scrollW=360 underfill. | Low | Center content column. |

_Measurements: no overflow. h1=1. Console clean. (/hari-raya structurally identical to /ramadan.)_

---

## 27. Static/trust — `/about`, `/faq`, `/contact`

### Desktop (1440) + Mobile (375)

| # | Location (page + section + viewport) | Issue | Severity | Specific Fix |
|---|---|---|---|---|
| 157 | About › closing CTA row › both | Three side-by-side buttons in three different weights (emerald primary, mint `-soft`, white outline) — competing hierarchy, unclear primary. | Medium | One primary + two `-ghost`/text links. |
| 158 | About › prose › desktop | Body runs ~66% width with a large empty right column — unbalanced. | Low | Center prose or add a supporting visual. |
| 159 | FAQ › accordions › both | Triggers are `role=group` + clickable `generic` (not buttons) — not keyboard-operable / not announced expandable. | High | Rebuild as `<details>`/`<button aria-expanded>`. |
| 160 | FAQ › content column › desktop | H1 + accordions offset left-of-center — asymmetric right whitespace, looks misaligned vs centered heroes. | Medium | Center the content column. |
| 161 | FAQ › inline "Contact us" link › both | Inline link is same ink color, no underline — reads as plain text, poor affordance. | Medium | Emerald color + underline for links. |
| 162 | Contact › form inputs › both | "Your name" (and Email/Subject/Message) have no `<label for>`/`aria-label` — visible label text is an unassociated sibling `<div>`; SR announces unnamed textbox. | High | Programmatically associate all labels. |
| 163 | Contact › overall › both | (Positive) Best-built page — proper 2-col form + sidebar, mailto links, quick-help. | — | Keep as the form model for other pages. |

_Measurements: no overflow. h1=1 each. Console clean._

---

## 28. Legal — `/privacy` (+ `/terms` consistency)

### Desktop (1440) + Mobile (375)

| # | Location (page + section + viewport) | Issue | Severity | Specific Fix |
|---|---|---|---|---|
| 164 | Privacy & Terms › inline references › both | "Halal Disclaimer", "MUIS HalalSG register", "Report incorrect info", "Cookie Policy" appear as plain text instead of links in several spots. | Medium | Hyperlink these references. |
| 165 | Privacy/Terms › "not legal advice" note › both | Faint tan-on-cream callout has low contrast for an important disclaimer. | Low | Increase contrast of the note text. |
| 166 | Privacy/Terms › content column › desktop | Body left-aligned with large empty right column (measure itself is a comfortable ~680px). | Low | Optional centering; measure is fine. |

_Measurements: no overflow. h1=1. Proper h1/h2/list hierarchy, "Last updated 13 June 2026". /terms confirmed on the identical legal template. Console clean._

---

## 29. Global chrome (header, mobile menu, bottom tab bar, prayer strip)

### Mobile (375) + Desktop (1440)

| # | Location (surface + section + viewport) | Issue | Severity | Specific Fix |
|---|---|---|---|---|
| 167 | Chrome › mobile hamburger drawer › mobile (SITE-WIDE) | Every drawer nav item (Explore, Ask AI, Travel, Events, Tools, Blog, For Business, Pricing) is a `<button>` with no `href` — not a real focusable/crawlable link; right-click/new-tab/middle-click/SEO all fail. Desktop uses proper `<a>`, so mobile is inconsistent. | High | Render drawer nav as `<a href>`/`<Link>`, keep JS routing on top. |
| 168 | Chrome › mobile menu quick-action rows › mobile | "Mosques near me / Request a quote / Advertise / Host an event / How we verify / Suggest a place" rows are 272×38px — below 44px. | Medium | Row height ≥44px. |
| 169 | Chrome › mobile menu close button › mobile | Close is 36×44 — 36px wide, under 44. | Low | Pad to 44×44. |
| 170 | Chrome › mobile bottom tab bar "Add a listing" › mobile | Center item is icon-only (no label) while Home/Search/Saved/Profile are icon+label — inconsistent, ambiguous. | Medium | Add a "List" label or make it an obvious FAB with aria-label. |
| 171 | Chrome › hero/global search input › mobile | Search field 183×37px / 443×37px — under 44 on the primary conversion control. | Medium | Input height ≥44px. |
| 172 | Chrome › category tabs (Featured/Newest/Top rated) › mobile | Tabs 32px tall — under 44. | Low | Tap height ≥44px. |
| 173 | Chrome › footer nav columns › mobile+desktop (SITE-WIDE) | ~15 footer link rows are clickable `<div>`/`generic` (cursor:pointer), not `<a>` — no real links. | Medium | Convert footer items to `<a href>`. |
| 174 | Chrome › sticky header + prayer strip › desktop | Header is sticky 64px but doesn't condense on scroll; header + prayer strip pin ~106px of vertical space on every page. | Low | Optional: collapse prayer strip on scroll-down. |
| 175 | Chrome › active/structure › both | ✓ Positive — bottom bar fixed z60 (72×67), does NOT overlap content/sticky CTAs; prayer strip stays pinned; drawer is a proper `role=dialog` w/ focus; desktop active nav uses `aria-current` + emerald. No horizontal overflow at 375 anywhere. | — | Keep. |

_Measurements: no overflow (360/375). header 56px mobile / 64px desktop. bottom bar 68px. Console: `/explore` 12× GoTrue warnings; 402 image errors on directory/ask._

---

## 30. Auth & states — `/login`, `/404`, `/dashboard`, `/saved`

### Desktop (1440) + Mobile (375)

| # | Location (surface + section + viewport) | Issue | Severity | Specific Fix |
|---|---|---|---|---|
| 176 | Login › primary button token › desktop | "Email me a code" bg is `#0C4A3C` (emerald-700), darker than the `#0F5C4A` primary token — brand-token drift on the top CTA. Note: this is a **custom passwordless/OTP page**, not the Clerk-hosted widget. | Low | Align to `.btn -primary` `#0F5C4A`. |
| 177 | Login › email input focus › desktop | `outline-style:none` on focus — if no compensating box-shadow ring, keyboard focus is invisible (WCAG 2.4.7). | Medium | Ensure a visible focus ring. |
| 178 | Login › Log in/Sign up toggle › desktop | Segmented tabs 196×35px — under 44 height. | Low | ≥44px. |
| 179 | 404 › recovery CTAs › both | "Back home"/"Explore" are `<button>` (JS nav), not `<a href>` — no right-click/new-tab/crawl, no no-JS fallback on an error page. | Medium | Render as `<a href>`. |
| 180 | 404 › document title › both | Title is the generic home title, not 404-specific (server returns 404 status correctly). | Low | Set a "Page not found" title on the 404 route. |
| 181 | /dashboard › guest state › desktop | Renders a device-local "Guest" dashboard (no hard redirect) — good — but a returning user on a new device silently sees "Guest" with no data and may think their account broke; tabs are `<button>` not links. | Low | Add persistent "Saved items live on this device — log in to sync" hint. |
| 182 | /saved › empty state › desktop | Graceful "No saved places yet" + "Explore halal places" CTA — but the CTA is a `<button>`, not `<a>`. | Low | Make empty-state CTA `<a href="/explore">`. |
| 183 | Login/404/dashboard/saved › overall › both | ✓ Positive — login is chromeless & on-brand with inline empty-submit validation; 404 is polished ("This page wandered off", real 404 status); dashboard/saved degrade gracefully for guests rather than hard-redirecting. | — | Keep these patterns. |

_Measurements: login chromeless=true, Google + OTP, inline validation works. 404 real status + H1. dashboard/saved graceful guest empty states. Console clean (except expected 404)._

---

# Top 10 highest-impact fixes (ranked)

1. **Fix the production image pipeline (402 Payment Required).** `_next/image`/Unsplash returns 402 sitewide — blank emerald-hatch cards on `/explore`, blank hotel cards, grey room-list thumbnails, empty `/ask` result cards, empty event card, empty business hero. This single infra failure defines the perceived quality of a trust brand. Restore Vercel image-optimization billing/quota (or self-host) **and** ship a branded monogram fallback so cards never render empty. _(Corroborated across 4 independent audit passes.)_ [#15, #26, #40, #58, #64, #102, #179, #188]
2. **Remove off-brand / haram-adjacent stock imagery from business galleries.** A Nasi Padang page shows a glamour beauty-model portrait and a **raw pork-looking joint of meat**. On a halal-trust brand this is existential, not cosmetic. Gate galleries so only verified photos render; else a branded "Photos coming soon" tile. [#25]
3. **Populate real trust data — retire the universal "42 / New / Self-declared".** Every one of 301 listings shows the identical halal-confidence score, "New" tag, and "0 community confirmations." The flagship trust feature reads non-functional. [#16, #29, #177]
4. **Fix the empty/contradictory homepage modules.** "Discover halal places" renders tabs but zero cards; "Popular areas" shows "0 places" on every card while the hero says "301+ places", using duplicated wrong stock images. The homepage's core discovery bands look broken. [#1, #2, #3, #8, #9, #173]
5. **Fix Events — currently non-functional.** The only event is a live "(Demo)" mock and **every event click dead-ends in a 404** (`/events/[slug]`). Seed real events or ship a real empty-state; fix detail routing. [#101, #102, #107]
6. **Reconcile pricing integrity before any paid push.** $19/mo vs $10/mo for "Verified" on the same page; "Featured" is $49/mo on /pricing but "$89/mo" on /advertise. Contradictory prices on money pages destroy trust. [#128, #139]
7. **Convert navigational chrome from `<button>`/`<div>` to real `<a href>`.** Mobile drawer nav, mobile bottom tab bar, all footer columns, home category tiles, 404/empty-state CTAs are JS buttons/divs — broken right-click/new-tab, no SEO crawl, no keyboard/no-JS fallback. Systemic across every page. [#6, #18, #103, #167, #173, #184]
8. **Ship a proper Quranic typeface.** The Quran reader renders Arabic in Hanken Grotesk (a Latin sans) → undeclared system-Arabic fallback. Load a mushaf webfont (KFGQPC Uthmanic / Amiri Quran / Scheherazade) with `lang="ar"`. [#94]
9. **Fix form accessibility on tools & contact/subscribe.** Zakat inputs have no focus ring, no programmatic labels, and swallow invalid input silently; contact/subscribe labels are unassociated placeholder divs; rebuild all `div`-based FAQ accordions (blog/faq/ramadan/hari-raya) as `<button aria-expanded>`/`<details>`. [#87, #88, #89, #115, #159, #162]
10. **Enforce the 44px tap-target floor + standardize the primary-CTA fill.** Sub-44 controls recur in chrome (EN/BM toggle, search inputs, category tabs, "Claim" 22px, mosque "Map →", pricing toggle); and the primary Search CTA is a low-affordance white pill on desktop travel/flights but emerald-filled on mobile — make one primary action = `.btn -primary` emerald everywhere. [#51, #71, #72, #133, #168, #171, #176]

---

# Systemic issues (repeating site-wide — the real priorities)

| Pattern | Where it repeats | Root-cause fix |
|---|---|---|
| **Broken image pipeline (402) + no branded fallback** | explore, business hero/gallery, city hub, hotel rooms, ask results, event card, home area cards | Fix Vercel image billing/quota; add a monogram fallback component used by every card/gallery. |
| **Placeholder data shipped live** | "42/New/Self-declared" on all listings, "0 places" areas, "(Demo)" event, "photo · nasi padang / map location / tampines street" caption strings, "Singaporeland" token | Seed/compute real data; grep the codebase for `photo · ` and stray template tokens; add a "no un-verified content" gate. |
| **`<button>`/`<div>` instead of `<a href>` for navigation** | footer columns (every page), home category tiles, mobile drawer nav, bottom tab bar, card wrappers, 404 & empty-state CTAs | One `<Link>`/stretched-link card primitive + real anchors in `chrome.tsx`. |
| **Sub-44px tap targets** | EN/BM toggle, search inputs, category/tab/toggle pills, "Claim" chips, mosque "Map →", menu rows | A single control-height token (44px min) applied to `.btn-sm`, chips, tabs, inputs. |
| **`div`-based accordions (not keyboard/AT accessible)** | blog post FAQ, /faq, /ramadan, /hari-raya, business & landing "what to look for" | One `<details>`/`<button aria-expanded>` disclosure component. |
| **Unstyled native `<select>` / inputs** | prayer-times method, zakat currency, flight filters (17 native radios/checkboxes), sort selects | Apply `.select`/styled checkbox-radio tokens with emerald focus ring. |
| **Ragged / orphaned grids (unequal card heights, trailing gaps)** | pricing cards, tools hub, blog/category cards, advertise, ask, ramadan, area cards, buffet landing | `align-items:stretch` + `line-clamp` on titles; standard 2/3/4-col grid utilities; balance trailing rows. |
| **Left-of-center / asymmetric desktop layouts (huge empty right column)** | prayer-times, zakat, ask, faq, seasonal, subscribe, about, legal | A shared centered content-container max-width convention. |
| **Data contradictions that erode a trust brand** | 0 vs 301 places, Hours-not-listed vs Closed, "MUIS certified" blurb vs "Self-declared" badge, related-by-area lists not in that area, pricing mismatches, three names for one feature (Ask AI/concierge/Search; Guides/Blog/Free Guides) | Single source of truth per datum; naming style guide. |
| **Weak secondary-button contrast + primary-CTA inconsistency** | white/ghost outlines on cream/emerald; Search white vs emerald across viewports | Define `-soft` mint secondary; reserve emerald fill for the single primary per view. |
| **Low-contrast ink-faint (#6C7682) text on cream** | meta/disclaimer/byline/price-cadence across brand-checker, prayer-times, blog, pricing, legal | Promote small print to ink-soft `#586471`+ to pass WCAG AA. |

**Genuinely strong (keep):** flight results (Muslim-meal + prayer-room-layover flags, cross-sell), the `/is-halal/[brand]` trust module (sourced, dated, HalalSG deep-links), `/mosques`, `/contact` form, `/login` validation, `/404`, graceful guest dashboard/saved, the grounded `/ask` concierge, single clean `<h1>` per page (except `/explore`), zero horizontal overflow anywhere, and correct sticky-chrome behavior.

---

# Design-system recommendations (to stop these recurring)

The tokens exist in `styles/styles.css`; the failures come from **not applying them consistently** and from missing scales. Formalize:

1. **Spacing scale.** Replace raw px (`.g4…g24`, hardcoded `12px 14px` card padding) with an 8pt token set: `--sp-1:4 / -2:8 / -3:12 / -4:16 / -5:24 / -6:32 / -8:48`. Refactor cards/sections onto it.
2. **Type scale.** Fix a ramp — `display 40/48`, `h1 32/40`, `h2 24/32`, `h3 20/28`, `body 16/24`, `small 14/20`, `caption 13/18` (Spectral h1–h3, Hanken body). Add a **65ch `--measure`** applied to all prose (fixes the 88–95ch blog measure). Drop unused serif families (Cormorant/Libre/Newsreader) unless deliberately used — cuts font payload and heading inconsistency.
3. **Button system → a real `<Button>` component.** Props `variant(primary|gold|outline|ghost|soft) × size(sm|md|lg)` mapping to `.btn`, with **enforced 44px min height on md/lg**, mandatory `:focus-visible` emerald ring, defined hover/active/disabled. Kills the white-vs-emerald primary drift and the `#0C4A3C` login token drift.
4. **Color/contrast tokens.** Add `--ink-meta:#586471` (AA on cream) and forbid `--ink-faint` for text <16px. Define an on-emerald text set (cream/white + an AA-passing gold) for badges/prices on emerald.
5. **Link vs button rule (lint it).** Navigates = `<a href>`/`<Link>`; acts in place = `<button>`. Add an ESLint rule/codemod catching `onClick`+`cursor:pointer` on `div/span`. Ship one **stretched-link `Card`** primitive for every listing/area/event/blog/tool card.
6. **Form primitives.** `<Field>` wrapper enforcing associated `<label>`, `.input/.select/.textarea` styling, emerald `:focus-visible` ring, inline validation/error state; a styled checkbox/radio to replace native controls (flights, "non-stop only").
7. **Grid utilities + empty-state primitive.** Standard `.grid-2/3/4` with `align-items:stretch` and trailing-row balance; `line-clamp` tokens for card titles. A single `<EmptyState>` (icon + heading + copy + CTA) mandated wherever a list can be empty — no headed-but-empty sections.
8. **Image fallback primitive.** Extend `ImagePh` into the default for every remote image: on error/402 render a branded monogram tile (business initial on emerald/cream). No bare hatch placeholders, no leaked "photo · …" strings.
9. **Icon scale.** Presets `icon-sm:16 / icon-md:20 / icon-lg:24`; replace ad-hoc `size={13..18}`.
10. **Breakpoint tokens.** Centralize `--bp-sm/md/lg` (currently scattered 520/760/860px).
11. **Quran/RTL text style.** A dedicated `--font-quran` + `.ayah` class (`lang="ar"`, dir rtl, line-height ~1.9) so Arabic never falls back to a Latin sans.

---

# "110% ready" launch verdict

**Current state: NOT launch-grade.** The layout *fundamentals* are sound — no horizontal overflow anywhere, one clean `<h1>` per page (except `/explore`), correct sticky chrome, good `/login`, `/404`, `/contact`, `/is-halal`, `/mosques`, and a genuinely working grounded `/ask` concierge. But the site is undermined by **infrastructure and data failures that read as "broken" on a brand whose entire promise is trust.** In priority order:

**P0 — Blockers (fix before any promotion):**
1. Production image 402 failure — blank cards/heroes/thumbnails sitewide.
2. Off-brand/haram-adjacent stock in business galleries (pork/beauty imagery on a halal page).
3. Placeholder trust data everywhere ("42/New/Self-declared", "0 places").
4. Events non-functional — live "(Demo)" record + every detail click 404s.
5. Pricing contradictions across /pricing and /advertise.

**P1 — Ship-quality gaps (fix in the launch sprint):**
6. Navigational `<button>`/`<div>`→`<a>` conversion (a11y + SEO + right-click).
7. Quran Latin-font rendering.
8. Form a11y (labels/focus/validation) + `div` accordions.
9. `/explore` missing `<h1>`; leaked placeholder strings ("photo · …", "Singaporeland", missing space "2026(1447 AH)").
10. 44px tap-target floor + primary-CTA fill standardization.

**P2 — Polish (fast-follow):**
Ragged/orphaned grids, left-weighted desktop layouts, ink-faint contrast, secondary-button contrast, duplicate email captures, guides page thinness, seasonal pages lacking imagery, GoTrue singleton warning, `/api/travel/weather` 502.

**Bottom line:** roughly **8–10 P0/P1 workstreams** stand between today and launch-grade. None are deep redesigns — they are (a) two infra fixes (image quota, weather API), (b) a data-seeding/QA pass to kill placeholder content, and (c) a design-system consistency sweep (Button/Field/Card/EmptyState primitives + the 44px and `<a>`-vs-`<button>` rules). Land P0 + P1 and this crosses from "promising early-preview" to "trustworthy, premium halal platform."

---

## Audit method note & confidence

Every representative template was crawled live at 1440×900 and 375×812 with scripted measurements (overflow, tap-target rects, heading order, alt text, duplicate `src`, non-link `div`s) plus visual screenshot inspection, hover/focus and console-error capture. The **402 image failure is high-confidence** (independently reproduced on `/explore`, `/travel`, `/ask`, `/events` across four passes). The **business-gallery pork/beauty imagery is single-source (screenshot-confirmed)** — given its severity, have a human re-open 2–3 real business pages to confirm scope before remediation. The `/ask` "dead submit" was **corrected to WORKING** after manual re-verification (the initial flag was a synthetic-Enter artifact). Auth-gated internals (`/admin`, `/owner`, event `/manage`/`/checkin`, dashboard *content*) were not reachable without credentials and are out of scope.
