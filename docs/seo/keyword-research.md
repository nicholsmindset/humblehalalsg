# Humble Halal — Master Keyword Research & On-Page SEO Strategy

> **Source of truth** for the site's organic-search strategy. Every keyword below is backed by live Ahrefs data (Singapore market unless marked **[global]**). Volume = avg monthly searches; **KD** = Ahrefs Keyword Difficulty (0–100); intent tags: *I* informational, *C* commercial, *T* transactional, *L* local, *B* branded. Data pulled June 2026.

---

## 1. Executive summary

Humble Halal competes **entirely on organic search**. The research confirms an unusually favourable landscape: the Singapore halal niche is **high-intent and low-competition** — most money keywords sit at **KD 0–15** with 300–2,000 monthly searches, and the Islamic-tools niche offers **global** terms in the tens of thousands at KD 1–8.

**The five biggest opportunities, in priority order:**

1. **Mall / venue food pages (NEW cluster — highest ROI).** Dozens of `{mall} halal food` queries at **KD 0** and 500–1,800 vol that the site does not target today: `jewel halal food` (1,800), `jem halal food` (1,400), `vivocity halal food` (1,400), `suntec halal food` (1,300), `jurong point` (1,100), `northpoint` (1,200), `westgate`/`imm`/`nex`/`funan` (800–1,100). ~25 pages, ~18,000 combined vol, almost no competition.
2. **Location (area/district) pages — already built, under-optimised.** `halal food orchard` (1,000/KD0), `bugis halal food` (1,100/KD0), `tampines halal food` (700/KD0), `paya lebar` (600/KD0). Optimise titles/H1 + add missing districts (Orchard, Central, Woodlands, Yishun, Sengkang…).
3. **Cuisine / concept pages — partly built.** `halal sushi singapore` (1,200/KD3), `halal fine dining` (1,100/KD2), `halal high tea` (800/KD0), `halal dim sum` (700/KD1), `halal mookata`/`mala` (600/KD0), `halal korean bbq` (250/KD2), `halal steak`/`mooncake` (500/KD0–2).
4. **Brand checker (`is X halal`) — built, expand + GEO.** KD 0–1, **AI-Overview triggering** (so they win AI answers too): `is paris baguette halal` (1,000), `is genki sushi halal` (700), `is chateraise halal` (700), `is saizeriya` (500), `is breadtalk` (450), `is yoshinoya` (400)… 40+ brands.
5. **Deen tools — built, massively under-scaled [global].** `prayer times` (64,000/KD1), `surah mulk` (35,000/KD8), `surah kahf` (17,000/KD4), `surah rahman` (12,000/KD8), `eid al fitr 2026` (19,000/KD6), `zakat calculator` (6,500/KD5), `muslim girl names` (5,400/KD3), `islamic date today` (4,200/KD7). These rank globally, not just SG.

**Seasonal spikes to own:** `hari raya 2026` (16,000/KD7), `ramadan 2026` (10,000/KD2), `geylang serai bazaar` (2,000/KD3), `eid al fitr 2026` [global] (19,000/KD6).

**Travel reality check:** "muslim friendly hotels" has ~0 SG volume and is a **global/source-market** play. Real demand lives in transactional terms: `halal restaurants near me` [global] (23,000/KD4), `umrah packages` [global] (2,500/KD7), `makkah hotels` (1,500/KD4), `madinah hotels` (1,100/KD2), `hajj packages` (800/KD5).

---

## 2. Funnel map

| Stage | Intent | Example keywords | Target pages | Conversion goal |
|---|---|---|---|---|
| **Top (ToFu)** | Informational / question | `what is halal` (250), `what does halal mean` (200), `ramadan 2026`, `surah mulk` [global], `prayer times` [global] | Blog, deen tools, seasonal hubs | Brand awareness, email, return visit |
| **Mid (MoFu)** | Commercial / research | `best halal restaurants singapore` (1,000), `halal sushi singapore`, `is X halal`, `{mall} halal food`, `halal food {area}` | Cuisine pages, mall/venue pages, location pages, brand checker, business listings | Listing views, saves, "directions/WhatsApp" clicks |
| **Bottom (BoFu)** | Transactional | `halal catering singapore` (1,200), `halal cake delivery` (300), `umrah package singapore`, `mini buffet singapore` (1,400), `abaya singapore` (350) | Catering/wedding hub, transactional category pages, business detail (quote/WhatsApp), travel | Quote request, WhatsApp, booking, paid listing |

**Internal flow:** ToFu (blog/tools/seasonal) → MoFu (cuisine/location/mall) → BoFu (listing detail / catering / travel). Every page links **down** the funnel.

---

## 3. Cluster architecture

### A. Core directory & discovery — `/`, `/explore`, `/map`, `/halal`

| Keyword | Vol | KD | Intent | Target URL |
|---|---|---|---|---|
| halal food near me | 15,000 | 19 | I·L | /explore, /map |
| halal food | 3,600 | 0 | I·C | / or /halal |
| halal restaurant singapore | 3,200 | 14 | I·L | /halal |
| halal food singapore | 2,900 | 9 | I·L | / (home) |
| halal (definition) | 2,800 | 15 | I | /blog (what-is-halal) |
| halal restaurant near me | 1,800 | 13 | I·L | /explore |
| halal restaurants singapore | 1,500 | 13 | I·L | /halal |
| halal restaurants | 1,300 | 2 | I | /halal |
| halal near me | 1,100 | 6 | I·L | /explore |
| best halal restaurants singapore | 1,000 | 1 | I·L | /halal or /blog best-halal |
| halal food nearby | 600 | 0 | I·L | /map |
| halal food delivery singapore | 250 | 0 | C·T | new: delivery page or blog |

**Notes:** "near me" terms need `local_pack` + LocalBusiness schema (present). `/explore` and `/map` should target the "near me / nearby" cluster; `/halal` is the "directory/browse" hub for "halal restaurants singapore".

### B. Location pages (area & district) — `/halal/halal-food-in-{area}` etc.

Built today for 6 areas; data shows **KD 0** across the board and demand in **many uncovered districts**. Note Google often ranks the `{area} halal food` word order — cover both.

| Keyword | Vol | KD | Built? |
|---|---|---|---|
| halal food orchard / orchard halal food | 1,000 / 1,000 | 0 | ❌ add Orchard |
| bugis halal food / halal food bugis | 1,100 / 700 | 0 | ✅ |
| tampines halal food / halal food tampines | 700 / 600 | 0 | ✅ |
| paya lebar halal food | 600 | 0 | ✅ |
| halal food yishun | 250 | 0 | ❌ add Yishun |
| halal food arab street | 200 / 700 (arab street halal food) | 0–4 | ❌ add Arab St / Kampong Glam |
| halal food sentosa | 200 | 0 | ❌ |
| halal food jurong east | 250 | 0 | ⚠️ (have Jurong) |
| halal food novena / amk / bishan / clementi / sengkang / queenstown | 20–50 ea | 0 | ❌ long-tail, cheap to add |

**Action:** add districts to `areas`: **Orchard, Woodlands, Yishun, Hougang, Pasir Ris, Sengkang, Serangoon/NEX, Ang Mo Kio, Clementi, Jurong East, Sembawang, Punggol, Arab Street/Kampong Glam, Sentosa, Changi**. Also a "Central Singapore" / region rollup (user-requested).

### C. Mall / venue food pages (NEW — biggest opportunity) — `/halal/halal-food-in-{venue}`

Almost all **KD 0**, branded-local intent, huge aggregate volume. The site has no venue dimension today.

| Keyword | Vol | KD |
|---|---|---|
| jewel halal food | 1,800 | 0 |
| jem halal food | 1,400 | 0 |
| vivocity halal food | 1,400 | 4 |
| suntec halal food / suntec city halal food | 1,300 / 900 | 0 |
| northpoint halal food | 1,200 | 0 |
| jurong point halal food | 1,100 | 1 |
| westgate halal food | 1,100 | 0 |
| imm halal food | 1,000 | 0 |
| marina square halal food | 900 | 0 |
| nex halal food | 800 | 0 |
| funan halal food | 800 | 0 |
| tampines mall / tampines hub halal food | 700 / 700 | 0 |
| bugis junction halal food | 700 | 0 |
| causeway point halal food | 700 | 0 |
| plaza singapura halal food | 600 | 0 |
| plq (paya lebar quarter) halal food | 600 | 0 |
| bedok mall halal food | 500 | 0 |
| waterway point halal food | 500 | 0 |
| changi airport halal food | 70 | 0 |

**Aggregate ≈ 18,000+ vol at KD 0.** Build a `venues` dimension (mall name → nearby area filter) generating `/halal/halal-food-in-{venue-slug}`.

### D. Cuisine / concept pages — `/halal/halal-{cuisine}-singapore`

| Keyword | Vol | KD | Built? |
|---|---|---|---|
| halal buffet singapore | 5,100 | 38 | blog ✅ (hard) |
| halal sushi singapore | 1,200 | 3 | ❌ add |
| halal fine dining singapore | 1,100 | 2 | ❌ add |
| halal cafe singapore | 1,600 | 24 | ✅ (cafes) |
| halal hotpot / steamboat singapore | 600–700 | 13–15 | ❌ add |
| halal high tea singapore | 800 | 0 | ❌ add |
| halal dim sum singapore | 700 | 1 | ❌ add |
| halal mookata | 600 | 0 | ❌ add |
| halal mala | 600 | 0 | ❌ add |
| halal korean food / bbq singapore | 700 / 250 | 2–12 | ❌ add |
| halal western food singapore | 500 | 0 | ❌ add |
| halal steak | 500 | 0 | ❌ add |
| halal mooncake | 500 | 2 | ❌ seasonal |
| halal breakfast singapore | 700 | 0 | ❌ add |
| halal brunch singapore | 450 | 13 | ❌ add |
| halal ramen singapore | 400 | 8 | ❌ add |
| halal pizza singapore | 400 | 0 | ❌ add |
| halal dessert singapore / near me | 350 / 600 | 0–14 | ❌ add |
| halal ice cream singapore | 250 | 0 | ❌ add |
| nasi lemak / nasi padang singapore | 800 / 700 | 0–3 | ❌ add |
| halal thai / japanese / indian / pasta / chicken rice / cake delivery | 30–450 | 0–22 | ❌ add selectively |

**Action:** expand `SEO_CATS` / add a cuisine taxonomy so these generate standalone Singapore pages + `{cuisine} near me` and per-area variants where vol supports.

### E. Brand checker (`is {brand} halal`) — `/is-halal/[brand]`

All **KD 0–1**, most trigger **AI Overviews** (answer-first first sentence wins the AI answer + the snippet). Capture both `is {brand} halal` and bare `{brand} halal`.

| Keyword | Vol | KD | AI-Overview |
|---|---|---|---|
| is paris baguette halal / paris baguette halal | 1,000 / 1,400 | 0–1 | ✅ |
| is genki sushi halal / genki sushi halal | 700 / 450 | 0 | ✅ |
| is chateraise halal | 700 | 0 | ✅ |
| is awfully chocolate halal / awfully chocolate halal | 600 / 600 | 0 | — |
| chocolate origin halal | 600 | 4 | — |
| is saizeriya halal | 500 | 0 | ✅ |
| is breadtalk halal | 450 | 0 | ✅ |
| is yoshinoya halal / yoshinoya halal | 400 / 900 | 0–3 | ✅ |
| is shake shack halal | 400 | 0 | ✅ |
| is koi / sukiya / pepper lunch / jollibee / liho / old chang kee / mr bean halal | 200–300 | 0–7 | ✅ |
| is starbucks / haidilao / nandos / famous amos / pastamania / astons halal | 80–250 | 0–26 | mixed |
| is monster curry / texas chicken / kfc / 4 fingers / a&w / burger king / din tai fung / popeyes halal | 30–250 | 0 | mixed |

**Action:** ensure each high-volume brand has a page; first sentence = direct verdict ("Yes — [brand] is MUIS-certified halal in Singapore." / "No — …"); add `{brand} halal` (no "is") as secondary; include `(2026)` freshness; FAQPage + Article schema (present).

### F. Catering & weddings — `/halal/halal-catering-singapore` + Malay-wedding cluster (NEW hub)

High **commercial/transactional** intent + high CPC (strong monetisation).

| Keyword | Vol | KD | Intent |
|---|---|---|---|
| catering singapore | 2,800 | 55 | C (hard head) |
| buffet catering singapore | 1,900 | 40 | C |
| mini buffet singapore | 1,400 | 2 | I·L |
| halal catering singapore | 1,200 | 22 | C·L |
| halal catering | 900 | 24 | C |
| mini buffet catering | 500 | 5 | C |
| corporate catering singapore | 350 | 49 | C |
| wedding catering singapore | 300 | 2 | C·L |
| high tea catering singapore | 300 | 1 | C·L |
| halal buffet catering | 250 | 3 | C·T |
| halal mini buffet | 200 | 5 | C |
| event catering singapore | 200 | — | C |
| malay wedding package | 150 | 0 | C |
| berkat kahwin | 150 | 0 | C |
| wedding catering halal | 150 | 15 | C |
| malay wedding dress / baju pengantin | 150 / 40 | 0 | I·C |
| malay wedding singapore | 90 | 1 | C·L |
| akad nikah / nikah singapore | 100 / 30 | 0–1 | I·L |
| kompang singapore | 100 | 0 | I·L |
| doorgift / dessert table singapore | 90 / 90 | 0 | C·L |
| bridal makeup / mua singapore | 60 / 40 | 0–17 | C·L |

**Action:** build `/halal/halal-catering-singapore` (target halal catering + mini buffet + buffet catering) and a Malay-wedding hub (`/halal/malay-wedding-singapore`) linking to wedding-category listings (MUA, hantaran, kompang, photography, florist, catering). Quote-request CTA = BoFu conversion.

### G. Business categories & retail — `/halal/halal-{cat}-singapore`

| Keyword | Vol | KD | Intent |
|---|---|---|---|
| abaya singapore | 350 | 0 | C·T·L |
| baju kurung singapore | 350 | 20 | C·L |
| cupping singapore | 300 | 0 | I·L |
| bekam singapore | 150 | 6 | C·L |
| muslim owned business singapore | (low, brand-defining) | — | I·L |
| madrasah singapore | 100 | 20 | I·L |
| takaful singapore | 100 | 0 | I·L (CPC $1.20) |
| islamic finance singapore | 90 | 0 | I·L |
| halal butcher singapore | 70 | 48 | C·T |
| women only / muslimah gym singapore | 70 / 30 | 0–22 | I·L |
| tudung / hijab singapore | 30 / 50 | 9–36 | C·L |
| quran class / tahfiz singapore | 40 / 30 | — | I·L |

**Action:** these map to existing category landing pages (`fashion`, `health`, `professional`, `education`, `beauty`). Optimise category-content H1/intro/FAQ to the validated head term (e.g. fashion page → "modest fashion, abaya & baju kurung"). Add bekam/cupping + takaful as health/professional sub-angles.

### H. Deen tools (mostly **[global]**) — `/tools/*`, `/tools/quran/[surah]`

The largest raw-volume cluster; ranks worldwide, KD low. SG volumes in parentheses where notable.

| Keyword | Vol [global] | KD | Tool/page |
|---|---|---|---|
| quran | 114,000 | 71 | /tools/quran (hard head; win via surah pages) |
| prayer times | 64,000 (SG `prayer times singapore` 6,200/KD44) | 1 | /tools/prayer-times |
| qibla finder | 51,000 | 56 | /tools/qibla |
| surah mulk | 35,000 | 8 | /tools/quran/al-mulk |
| ayatul kursi | 30,000 | 50 | /tools/quran (Al-Baqarah 255) |
| surah yaseen | 26,000 | 67 | /tools/quran/ya-sin |
| eid al fitr 2026 | 19,000 | 6 | /tools/islamic-calendar + seasonal hub |
| qibla direction | 17,000 | 31 | /tools/qibla |
| surah kahf | 17,000 | 4 | /tools/quran/al-kahf |
| dua | 13,000 | 42 | /tools/duas |
| hadith | 13,000 | 60 | /tools/hadith |
| surah rahman | 12,000 | 8 | /tools/quran/ar-rahman |
| islamic calendar | 8,300 | 29 | /tools/islamic-calendar |
| 99 names of allah | 6,800 (SG 800/KD38) | 26 | /tools/99-names |
| zakat calculator | 6,500 (SG 600/KD3) | 5 | /tools/zakat |
| muslim girl names | 5,400 | 3 | /tools/baby-names |
| islamic date today | 4,200 | 7 | /tools/date-converter |
| muslim boy names | 3,700 | 2 | /tools/baby-names |
| hijri calendar | 2,700 | 49 | /tools/date-converter |
| ramadan calendar 2026 | 1,500 | 14 | seasonal |
| muslim baby names | 700 | 12 | /tools/baby-names |
| tasbih counter | 500 (SG 150/KD17) | 22 | /tools/tasbih |
| tahajjud time | 350 | 1 | /tools/prayer-times |

**Action:** the Quran surah pages (114 already built) are the lever for `surah {name}` — ensure each surah title/H1 targets `surah {name}` + English + "read online". Baby-names tool should split boy/girl. Zakat & prayer-times pages are low-KD global wins.

### I. Mosques & community — `/mosques`

| Keyword | Vol | KD |
|---|---|---|
| mosque near me | 5,900 (global higher) | 6 |
| nearest mosque | 700 | 13 |
| masjid near me / terdekat | (parent) | — |
| mosques in singapore | 150 | 9 |
| friday prayer singapore | 10 | 36 |

**Action:** `/mosques` targets "mosques in singapore"; add per-region or per-mosque pages (`masjid {name}`) for the long tail and "mosque near me" via local intent. Cross-link mosque → nearby halal food (area page).

### J. Travel — `/travel`, `/travel/[city]`, `/travel/hotel/[id]` (SG + **[global]** source markets)

| Keyword | Vol | KD | Market |
|---|---|---|---|
| halal restaurants near me [global] | 23,000 | 4 | global |
| umrah packages [global] / umrah package | 2,500 / 1,900 | 7–24 | global/SG |
| makkah hotels | 1,500 | 4 | global |
| madinah hotels | 1,100 | 2 | global |
| hajj packages | 800 | 5 | global |
| umrah package singapore | 250 | 3 | SG |
| hajj package singapore | 90 | — | SG |
| halal food bali / tokyo | 100 / 150 | 0–1 | global |
| prayer room near me | 150 | 0 | global |
| hotels near masjid al haram / nabawi | 50 / 50 | 0 | global |
| muslim friendly hotels (head) | ~0 | — | low — target city terms instead |

**Action:** travel hubs should target **city + hotel/umrah** terms, not the generic "muslim friendly hotels" head. Priority hubs: **Mecca (makkah hotels, hotels near haram, umrah), Medina (madinah hotels, hotels near nabawi), + Umrah/Hajj package SG**. Leisure hubs (Bali, Tokyo, Istanbul, Dubai, KL) target `halal food {city}` + `muslim friendly {city}`.

### K. Events & seasonal — `/events`, NEW `/ramadan`, `/hari-raya`

| Keyword | Vol | KD | Page |
|---|---|---|---|
| hari raya 2026 | 16,000 | 7 | NEW /hari-raya hub |
| ramadan 2026 | 10,000 | 2 | NEW /ramadan hub |
| eid al fitr 2026 [global] | 19,000 | 6 | seasonal + calendar |
| geylang serai bazaar | 2,000 | 3 | /events seasonal page |
| ramadan calendar 2026 [global] | 1,500 | 14 | /ramadan |
| islamic calendar 2026 | 1,400 | — | /tools/islamic-calendar |
| when is ramadan 2026 | 2,600 | — | /ramadan (answer block) |
| hari raya bazaar / ramadan bazaar singapore | 90 / 70 | 0 | /events |

**Action:** build evergreen `/ramadan` and `/hari-raya` hubs (update the year annually) wiring bazaar guide, prayer/fasting times, iftar spots (→ listings), Raya catering (→ catering hub). Huge seasonal traffic at low KD.

### L. Informational / question (ToFu) — `/blog`, FAQ blocks

| Keyword | Vol | KD | Page |
|---|---|---|---|
| what is halal | 250 | 17 | blog: what-is-halal |
| what is halal food | 250 | 16 | blog |
| what does halal mean | 200 | 28 | blog |
| what does halal certified mean | 60 | — | blog/FAQ |
| where to eat halal singapore | 50 | — | /halal + blog |
| what is halal meat | 40 | 2 | blog |
| halal logo | 450 | 0 | blog: MUIS cert explainer |
| halal snacks | 450 | 0 | blog/listicle |

**Action:** these feed FAQ schema (PAA/AI-Overview) and the existing answer-first blog. Ensure "what is halal / halal certified" content exists and links down to `/halal` and `/is-halal`.

---

## 4. Per-URL on-page recommendations (static & template pages)

Rules: **title ≤ 60 chars**, **description ≤ 155 chars**, exactly one **H1**, primary keyword in title + H1 + first 100 words.

| URL | Recommended Title | Recommended Meta Description | H1 | Primary kw |
|---|---|---|---|---|
| `/` | Humble Halal — Halal Food & Muslim-Owned Singapore | Find halal food in Singapore — MUIS-certified & Muslim-owned restaurants, cafés, shops and services near you. A discovery platform, not a certifier. | Find halal food & Muslim-owned businesses in Singapore | halal food singapore |
| `/explore` | Halal Food Near Me in Singapore — Explore & Filter | Search halal restaurants, cafés and Muslim-owned shops near you in Singapore — filter by area, cuisine, price, prayer space and halal status. | Halal food near you in Singapore | halal food near me |
| `/map` | Halal Map of Singapore — Food & Mosques Near You | Find halal restaurants, Muslim-owned businesses and mosques nearby on an interactive map of Singapore. | Halal map of Singapore | halal food nearby |
| `/halal` | Halal Directory Singapore — Restaurants by Area | Browse Singapore's halal & Muslim-owned directory by category and neighbourhood — restaurants, cafés, halal food in every mall and MRT area. | Singapore's halal & Muslim-owned directory | halal restaurant singapore |
| `/is-halal` | Is It Halal? Singapore Brand & Restaurant Checker | Check whether Paris Baguette, Genki Sushi, Saizeriya and more are halal in Singapore — MUIS status, answers and sources, updated 2026. | Is it halal? Singapore brand checker | is it halal |
| `/travel` | Halal Travel — Muslim-Friendly Hotels & Umrah Stays | Find Muslim-friendly hotels with prayer rooms and halal dining — Umrah stays near the Haramain in Makkah & Madinah and family trips across Asia. | Halal travel & Muslim-friendly hotels | muslim friendly hotels |
| `/tools` | Free Islamic Tools — Prayer Times, Quran, Zakat & Duas | Free everyday Islamic tools: prayer times, Quran reader, qibla finder, Zakat calculator, tasbih, duas and the 99 Names. No sign-up, private by default. | Free Islamic tools for every day | islamic tools |
| `/tools/prayer-times` | Prayer Times Today — Accurate Salah Times Near You | Free, accurate daily prayer times (Fajr, Dhuhr, Asr, Maghrib, Isha) for your location, with calculation methods. No sign-up — location stays on device. | Prayer times today | prayer times |
| `/tools/zakat` | Zakat Calculator 2026 — Work Out the 2.5% You Owe | Free Zakat calculator: add cash, gold, silver, investments and debts to see if you're above the nisab and how much Zakat is due (2.5%). Private. | Zakat calculator | zakat calculator |
| `/tools/quran` | Quran Online — Read All 114 Surahs (Arabic & English) | Read the Quran online — all 114 surahs in Arabic with English translation and audio recitation. Includes Mulk, Kahf, Yaseen and Ar-Rahman. | Read the Quran online | read quran online |
| `/tools/quran/[surah]` | Surah {Name} ({English}) — Read Online, Arabic & English | Read Surah {Name} ({English}, chapter {N}) online in Arabic with English translation and audio recitation. | {N}. Surah {Name} · {English} | surah {name} |
| `/tools/qibla` | Qibla Finder — Find the Qibla Direction From You | Find the qibla direction to the Kaaba from your exact location with a live compass. Free and works on mobile. | Qibla finder | qibla finder |
| `/tools/99-names` | 99 Names of Allah — Asma ul Husna, Meanings & Audio | The 99 Names of Allah (Asma ul Husna) with Arabic, transliteration, meanings and audio. Free to read and learn. | The 99 Names of Allah | 99 names of allah |
| `/tools/baby-names` | Muslim Baby Names — Boy & Girl Names with Meanings | Browse Muslim baby names for boys and girls with Arabic meanings and origins. Free, searchable list. | Muslim baby names | muslim baby names |
| `/tools/date-converter` | Hijri Date Today — Islamic & Gregorian Date Converter | What's today's Islamic date? Convert between Hijri and Gregorian dates instantly. Free and accurate. | Hijri ⇄ Gregorian date converter | islamic date today |
| `/tools/islamic-calendar` | Islamic Calendar 2026 — Ramadan, Eid & Hijri Dates | The 2026 Islamic (Hijri) calendar with Ramadan, Eid al-Fitr, Eid al-Adha and Hajj dates. | Islamic calendar 2026 | islamic calendar 2026 |
| `/mosques` | Mosques in Singapore — Find a Masjid Near You | Directory of all mosques (masjid) in Singapore — find a masjid near you and get directions. Grouped by region: Central, East, North-East, North, West. | Mosques in Singapore | mosques in singapore |
| `/events` | Halal Events in Singapore — Bazaars, Classes & Ta'lim | Bazaars, classes, ta'lim and community gatherings hosted by Muslim-owned businesses across Singapore, including the Geylang Serai Ramadan bazaar. | Halal-friendly events in Singapore | events singapore (halal) |
| `/blog` | Halal Guides Singapore — Where & What to Eat Halal | Guides to eating halal in Singapore — what halal means, MUIS certification, the best halal restaurants, buffets, cafés and Muslim-friendly travel. | Halal guides & stories | halal food guides |
| `/for-business` | List Your Halal Business — Get Found on Humble Halal | Get discovered by Singapore's Muslim community. List your halal or Muslim-owned business, earn verified labels and turn searches into visits. | List your business on Humble Halal | list halal business |

### Template (dynamic) formulas

| Template | Title formula | Description formula | H1 formula |
|---|---|---|---|
| `/halal/halal-food-in-{area}` | `Halal Food in {Area} — Best Halal Eats ({Year})` | `Discover the best halal food in {Area}, Singapore — MUIS-certified & Muslim-owned restaurants, cafés and eateries, with halal status and reviews.` | `Halal Food in {Area}` |
| `/halal/halal-food-in-{venue}` (NEW) | `Halal Food at {Venue} — Where to Eat ({Year})` | `Find halal food at {Venue} — every MUIS-certified and Muslim-friendly restaurant and stall, with halal status, prayer info and directions.` | `Halal Food at {Venue}` |
| `/halal/halal-{cat}-in-{area}` | `Halal {Cat} in {Area} — MUIS-Certified & Muslim-Owned` | `The best halal {cat} in {Area}, Singapore — certified and Muslim-friendly options in one place, with reviews and directions.` | `Halal {Cat} in {Area}` |
| `/halal/halal-{cat}-singapore` | `Halal {Cat} Singapore — Best {Cat} ({Year})` | `{intro — category-specific, validated head term}` | `Halal {Cat} in Singapore` |
| `/business/[slug]` | `{Name} — Halal {Cuisine} in {Area}` | `{Blurb} {MUIS/Muslim-owned} in {Area}. {Rating}★ from {Reviews} reviews. Halal status, prayer info, hours & directions.` | `{Name}` |
| `/is-halal/[brand]` | `Is {Brand} Halal in Singapore? ({Year})` | `{Direct verdict sentence}. See {Brand}'s MUIS halal status, which outlets are certified, and what to order.` | `Is {Brand} halal?` |
| `/travel/[city]` | `{City}: Muslim-Friendly Hotels & Halal Food` | `Muslim-friendly hotels in {City} with prayer rooms and halal dining nearby{ — for Umrah/Hajj/leisure}.` | `Muslim-friendly {City}` |

---

## 5. Keyword gaps & new-page opportunities (→ Phase D)

1. **Mall/venue pages** (`/halal/halal-food-in-{venue}`) — ~25 pages, ~18k vol, KD 0. **#1 priority.**
2. **Missing cuisine pages** — sushi, fine dining, high tea, dim sum, hotpot/steamboat, mookata, mala, korean bbq, western, steak, breakfast, dessert, ramen, pizza, ice cream, nasi lemak, nasi padang. ~10k vol, KD 0–8.
3. **Catering hub** (`/halal/halal-catering-singapore`) + **Malay-wedding hub** — ~5k vol, high CPC, BoFu.
4. **Seasonal hubs** — `/ramadan` (10k) + `/hari-raya` (16k) + Geylang Serai bazaar page (2k). KD 2–7.
5. **District/region pages** — Orchard, Central Singapore, Woodlands, Yishun, Sengkang, Serangoon, AMK, Clementi, Arab Street/Kampong Glam, Sentosa, Changi, Jurong East.
6. **"Near me" intent pages** — `halal dessert near me` (600), `halal breakfast near me` (500) → cuisine pages with geo-aware copy.
7. **Definition/explainer content** — what is halal, what does halal certified mean, halal logo, halal vs non-halal → blog + FAQ schema (GEO).
8. **Travel city/umrah pages** — Makkah, Madinah, Umrah/Hajj package SG, halal food {city}.
9. **Baby-names split** — boy names (3,700) vs girl names (5,400) as separate indexable views.

## 6. Low-hanging fruit shortlist (KD ≤ 10, vol ≥ 200)

`jewel halal food` (1,800/0) · `jem halal food` (1,400/0) · `suntec halal food` (1,300/0) · `northpoint halal food` (1,200/0) · `westgate halal food` (1,100/0) · `jurong point halal food` (1,100/1) · `bugis halal food` (1,100/0) · `orchard halal food` (1,000/0) · `imm halal food` (1,000/0) · `best halal restaurants singapore` (1,000/1) · `halal sushi singapore` (1,200/3) · `halal fine dining singapore` (1,100/2) · `is paris baguette halal` (1,000/1) · `halal high tea singapore` (800/0) · `nasi lemak singapore` (800/0) · `is genki sushi halal` (700/0) · `is chateraise halal` (700/0) · `halal dim sum singapore` (700/1) · `halal breakfast singapore` (700/0) · `halal mookata` (600/0) · `halal mala` (600/0) · `mini buffet singapore` (1,400/2) · `wedding catering singapore` (300/2) · `geylang serai bazaar` (2,000/3) · `ramadan 2026` (10,000/2) · **[global]** `prayer times` (64,000/1) · `surah mulk` (35,000/8) · `surah kahf` (17,000/4) · `zakat calculator` (6,500/5) · `muslim girl names` (5,400/3) · `eid al fitr 2026` (19,000/6) · `umrah packages` (2,500/7) · `madinah hotels` (1,100/2) · `halal restaurants near me` (23,000/4).

## 7. Internal-linking & anchor map (→ Phase E)

**Hub → spoke, keyword-rich exact/partial-match anchors (never "click here"):**

- **Home `/`** → top location pages (anchor "halal food in Orchard", "halal food in Bugis"), top mall pages ("halal food at Jewel", "halal food at VivoCity"), top cuisine pages ("halal sushi in Singapore", "halal fine dining"), `/is-halal` ("is it halal? brand checker"), `/tools` ("free Islamic tools"), seasonal hub in season.
- **`/halal` hub** → all area, mall, cuisine, category pages (the master internal-link surface). Group by Areas / Malls / Cuisines / Categories.
- **Location page** → sibling cuisine pages ("halal cafés in {area}"), nearby **mall** pages, nearby **mosques** ("mosques near {area}"), relevant **blog** guide, and **catering** ("halal catering in {area}").
- **Mall page** → parent area page, nearby malls, "halal food near {nearest MRT}".
- **Cuisine page** → related cuisine ("halal Korean BBQ" ↔ "halal Korean food"), top area variants, relevant brand-checker pages (e.g. halal sushi ↔ "is Genki Sushi halal").
- **Brand-checker page** → relevant cuisine page ("more halal {cuisine} in Singapore") + `/halal` + nearest listing alternatives.
- **Blog post** → matching programmatic page (best-halal-buffet post → `/halal/halal-buffet-singapore`), with descriptive anchor.
- **Tools** → cross-link prayer-times ↔ qibla ↔ mosques; Quran reader ↔ individual surah pages (anchor "Surah Al-Mulk", "Surah Al-Kahf"); islamic-calendar ↔ /ramadan ↔ /hari-raya.
- **No orphans:** every new Phase D page linked from at least one hub + present in `sitemap.ts`. Strengthen `relatedSeoPages()` to surface highest-volume siblings first.

## 8. Title / Description / H1 governance (for future auto-generated pages)

- Keep template formulas in §4 as the canonical generators (in `lib/seo-pages.ts` + `lib/category-content.ts`).
- Always: primary keyword left-most in title; brand "Humble Halal" appended by the title template only where space allows (≤60 incl. suffix); `{Year}` token auto-updates.
- Descriptions: lead with the primary keyword + a differentiator (MUIS-certified, Muslim-owned, reviews, directions, prayer info); end with a soft CTA where natural.
- One H1 per page; H1 ≈ primary keyword in natural language (may differ slightly from title to avoid exact dupe).
- FAQ blocks reuse validated **question keywords** (§3L) for PAA + AI-Overview capture.
