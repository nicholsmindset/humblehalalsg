# Mobile-First Audit — humblehalal.com (July 2026)

> **Superseded by [`mobile-matrix-audit-2026-07.md`](./mobile-matrix-audit-2026-07.md)** — a later pass that turned this audit's method into a repeatable 10-device harness, closed the open items below (sub-12px text, 320 floor, the never-verified pages, iOS input zoom, scroll lock, the map `flyTo` crash), and added a CI guard.

**Method:** Live Playwright rendering on **production** (`www.humblehalal.com`) at 320 / 375 / 390 / 414 CSS px, cross-referenced with a full source/CSS audit. Measured: real horizontal overflow (parent-scroll-aware), tap-target geometry, sub-12px text, interactive states (filter drawer, date picker), and console errors.
**Assume ≥70% mobile traffic.** Standards enforced: zero horizontal overflow 320–1024px · ≥48px tap targets (WCAG AA floor 44) · body 16px / text ≥12px · CWV good at p75.

> **Context first:** This site has already been through a dedicated mobile-a11y hardening pass (`styles/mobile-a11y.css`) — most tap targets are forced to 44–48px, safe-area insets applied, the date picker collapses to a single month ≤520px, and `next/image` is used with `sizes`/`priority`. This audit does **not** re-flag those. It reports what live testing proved is **still broken** — and several of those are conversion-blocking. The global `overflow-x: clip` is a double-edged sword: it stops the page from scrolling sideways, but it **silently clips** any too-wide element instead of revealing it, which is exactly how the two worst issues below hid in plain sight.

---

## Severity legend
**Critical** = loses conversions / breaks the page · **High** = clearly sub-standard, hurts usability/SEO · **Medium** = polish gap below enterprise bar · **Low** = minor.

Evidence tag: `[live]` measured on prod · `[code]` confirmed in source · `[live+code]` both.

---

## Per-page findings

### 1. Home `/`
| # | Section + width | Issue | Severity | Mobile-specific fix |
|---|---|---|---|---|
|1.1|Prayer strip · all widths `[live]`|~~"Find masjid near you" clipped at right edge~~ **WITHDRAWN** — clean re-test at 390px shows mosque button `183→355` in a 375px viewport, label fully visible, no overflow. Original report was browser-contamination.|~~Critical~~ **Not an issue**|No change needed. (If it ever appears on ≤360px, `.prayer-mosque` already ellipsis-truncates via `styles/moat.css:91,96`.)|
|1.2|Header · 375–414 `[live]`|EN/BM language toggles **37–40px wide** (height 44 OK, width < 44)|High|Add `min-width:44px` to `.lang-toggle button`. `styles/mobile-a11y.css:42`|
|1.3|"Discover halal places" tabs · all `[live+code]`|Featured / Newest / Top-rated pills render **~32px tall** — plain `<button role="tab">` with no min-height|High|Add `[role=tab]` (or `.tablist button`) `min-height:44px`. Origin `components/screens/consumer.tsx:218`|
|1.4|Popular-areas + inline links `[live]`|In-card / inline text links (area names, "How we verify" 29px, cuisine links) **~18–21px tall**|High|Wrap card-level anchors and inline CTAs in `min-height:44px; inline-flex`|
|1.5|Captions/eyebrows · all `[live]`|**~13 text nodes < 12px** (sub-legible captions/badges)|Medium|Raise remaining sub-12px classes to ≥12px (see §Design-system)|
|1.6|Above-the-fold `[live]`|✅ Strong: H1 + search + quick-filter chips + "301+ places" trust line all visible without scroll; no popup on arrival|—|Keep|

### 2. Explore `/explore`
| # | Section + width | Issue | Severity | Mobile-specific fix |
|---|---|---|---|---|
|2.1|Results toolbar · **all mobile widths** `[live]`|**Filters / Sort / cert-toggle / List / Map do not fit one row — List right=425, Map right=504 vs viewport 375; Map toggle ~129px off-screen and unreachable** (`pageOverflow=true`)|**Critical** → **FIXED ✅**|Added `.explore-toolbar` class (`consumer.tsx:493`) + `@media(max-width:560px){flex-wrap:wrap}` in `mobile-a11y.css`. **Verified:** List 272 / Map 351, `pageOverflow=false`.|
|2.2|Business cards · all `[live]`|**`.claim-chip` 62×22px on every card** — sub-44px tap target, repeated site-wide|High|Add `min-height:44px` hit row to the claim chip (or make it a full-width row action on mobile)|
|2.3|Search input · 390 `[live]`|Directory search input measured ~37px tall in the toolbar context; lacks `type="search"`/`inputMode`|Medium|Ensure `.input` 44px applies here; add `type="search" inputMode="search"`|
|2.4|Filters drawer (open) `[live]`|✅ Opens as inline `aside.filter-panel` that pushes list down; renders cleanly, no overflow, content not buried|—|Acceptable; consider a bottom-sheet later for one-handed reach|
|2.5|Content priority `[live]`|✅ "301 places" + cards appear immediately after toolbar — filters don't bury content|—|Keep|

### 3. Business detail `/business/[slug]`
| # | Section + width | Issue | Severity | Mobile-specific fix |
|---|---|---|---|---|
|3.1|Whole page · all `[live]`|~~PAGE CRASHES on missing coords~~ **WITHDRAWN** — `DetailScreen` uses a **static `ImagePh` map placeholder** (consumer.tsx:1124), not Leaflet. Clean re-load of the exact "crashing" slug renders perfectly (valid directions link, no error boundary). Crash was the map screen the contaminated session had open.|~~Critical~~ **Not a detail-page bug**|Kept as latent hardening — see blocker #3. `MapView` now sanitizes coords centrally.|
|3.2|Error boundary buttons `[live]`|Reload / Back buttons **~32px tall**|Medium|44px min-height on error-boundary actions|
|3.3|Sticky action bar `[code]`|✅ Sticky Call/Website bar has safe-area padding (`.detail-stickybar`)|—|Keep — but blocked by 3.1 today|

### 4. Travel hub `/travel` (redirects → flights tab)
| # | Section + width | Issue | Severity | Mobile-specific fix |
|---|---|---|---|---|
|4.1|Prayer strip `[live]`|~~Same clip as 1.1~~ **WITHDRAWN** (see 1.1)|—|No change needed|
|4.2|Hotel/route carousels `[live]`|✅ Swipeable rails with next-card peek (`.ota-track` scrollWidth 3148 > viewport) — correct pattern, no page overflow|—|Keep|
|4.3|Route quick-links `[live]`|City chips (Kuala Lumpur / Bangkok / Tokyo) **~18px tall**|High|44px hit row on `.flt-trend` / route chips|
|4.4|Resource load `[live]`|`402` console error (paid hotel/flight gating) — expected while `PAID_HOTELS_ENABLED` off, but ensure the UI degrades to a clear message, not an empty/broken rail|Medium|Confirm graceful empty-state copy when the paid API is gated|

### 5. Flights search `/travel/flights`
| # | Section + width | Issue | Severity | Mobile-specific fix |
|---|---|---|---|---|
|5.1|Trip-type pills `[live+code]`|"Round trip" / "One way" (`.ota-pill`) **32px tall**|High|`.ota-pill { min-height:44px }`. `components/screens/flights/search.tsx:267`|
|5.2|"Non-stop only" `[live]`|**Checkbox input 13×13px** — far below any tap-target floor|High|Wrap the checkbox+label in a 44px `.flt-check`-style hit row and enlarge the control|
|5.3|Umrah/Hajj presets `[live]`|"Jeddah (JED)" / "Madinah (MED)" preset chips **~29px tall**|High|44px hit row on preset chips|
|5.4|Search form · 375–414 `[live]`|✅ From/To/date/travellers/Search stack and fit; date picker opens as a **single-month** dialog (no 2-month overflow)|—|Keep|
|5.5|Hijri line + trend labels `[live]`|**12 text nodes < 12px** ("15 Safar 1448 AH (approx.)", trend sublabels)|Medium|Raise to ≥12px|

### 6. Hotel detail `/travel/hotel/[id]` `[code]`
Uses the same OTA primitives audited live elsewhere (`.ota-*`, `.field`, `.qty-stepper`, gallery `.rm-nav/.lb-nav`) — those already have 44px overrides. **Verify live** the sticky "Book" bar respects safe-area (it uses `.detail-stickybar`, which does) and that the rate/room list stacks (not a desktop table). No new blocker predicted; confirm in a targeted pass.

### 7. Hotel checkout `/travel/booking` · Flight checkout `/travel/flights/booking` `[code]`
Guest-detail inputs use `.field input/select` (44px ✅) and `.qty-stepper` (44px ✅). **Verify live:** (a) inputs set `type="email"/"tel"` + `inputMode` (prevents wrong keyboard / iOS zoom), (b) sticky "Continue/Pay" button spacing + safe-area, (c) fare/price breakdown stacks to label/value cards, not a `min-width:680px` `.tbl`.

### 8. Blog index `/blog` · 9. Blog post `/blog/[slug]` `[code]`
Content pages; main risks are inline ad/newsletter blocks (migration 0030) and line length. **Verify live:** inline blocks don't overflow, images are `next/image` with `sizes`, body ≥16px, comfortable measure. No blocker predicted.

### 10. Events list `/events` · 11. Event detail `/events/[slug]` `[code]`
Uses `.evt-stickybar` (safe-area ✅) and `.qty-stepper` (44px ✅). **Verify live:** RSVP/ticket modal doesn't exceed viewport and its close affordance is ≥44px; ticket quantity + checkout reachable one-handed.

### 12. Tools hub `/tools` · 13. Prayer times `/tools/prayer-times` `[code]`
Tool cards + input forms; geolocation prompt. **Verify live:** tool grid stacks to 1–2 cols, calculator inputs use numeric `inputMode`, results don't overflow.

### 14. Quran reader `/tools/quran/2` `[code]`
Long Arabic + translation + audio controls. **Verify live:** audio control buttons ≥44px, Arabic doesn't force horizontal scroll, translation toggle reachable, `overflow-wrap:anywhere` on long tokens.

### 15. Login `/login` `[code]`
**Verify live:** inputs `type="email"`/`autocomplete`, submit thumb-reachable, no zoom-on-focus (body 16px), OAuth buttons ≥44px.

---

## ⚠️ Correction (verification pass, 2026-07)
Two items first reported as **Critical** came from a multi-agent Playwright sweep that shared one browser a second session was hijacking. A clean single-browser re-test **could not reproduce** them — they are **withdrawn**:
- ❌ **Business-detail crash on missing coords** — the `/business/[slug]` page (`DetailScreen`) renders a **static map placeholder**, not Leaflet; it renders perfectly on a clean load (valid directions link, no error boundary). The `Invalid LatLng (NaN,NaN)` was thrown by the **map screen** the other session had navigated to, not the detail page. Kept only as a *latent* hardening item (the map path's `!= null` guards don't catch `NaN`).
- ❌ **Prayer strip clipped "every page"** — on a clean 390px the mosque button sits at `183→355` inside a 375px viewport, label fully visible, no overflow. Not reproduced.

## Critical mobile blockers (fix before "launch-grade")
1. **`/explore` toolbar overflow** — **CONFIRMED** on a clean browser at 390px (cw 375): List button right=425, Map right=504, `pageOverflow=true`; the **Map view toggle is ~129px off-screen and unreachable**. *(2.1)* → **FIXED & verified** (toolbar now wraps; List 272 / Map 351, `pageOverflow=false`).
2. **Toast notifications missing `env(safe-area-inset-bottom)`** — confirmations hidden behind the home indicator on notched phones. `styles/styles.css:534–542`. *(systemic)* → **FIXED** (safe-area added; visual confirm needs a real notched device).
3. **Latent: map crash on non-finite coords** — Leaflet throws `Invalid LatLng (NaN,NaN)` and hard-crashes any screen that mounts a map (`/map`, `/explore` map view, city, hotel, owner-edit) if a record has `NaN` coords; call-site `!= null` guards don't catch it. *(High, latent)* → **FIXED** (centralized `isFiniteCoord` sanitize in `components/map/map-view.tsx`).

## Systemic issues (repeat site-wide)
- **Round-2 tap-target gaps** the a11y pass missed — all sub-44px, all live-measured: `[role=tab]` pills (home Discover tabs, flight trip-type `.ota-pill`), **checkbox/radio controls** ("Non-stop only" 13×13), **preset/route chips** (`.flt-trend`, Jeddah/Madinah), **`.claim-chip` 62×22 on every card**, **EN/BM language toggles 37–40px wide** (min-width missing), in-card/inline text links (~18–21px), error-boundary buttons (32px).
- **Sub-12px text** — 4–13 nodes per page (Hijri dates, trend sublabels, `.badge` at 0.75rem, captions). Lighthouse "legible font sizes" risk + SEO (mobile-indexed render).
- **`overflow-x:clip` masks breakage** — because the page never scrolls sideways, over-wide elements (toolbar, prayer strip) are *clipped and unreachable* rather than visibly broken. Needs an active overflow probe in CI.
- **320px not honored** — a layout floor renders ~360px at 320, so a real 320px device (Z Fold folded, small Android) sees a scaled/zoomed layout. Confirm no fixed `min-width` on a top container.
- **Input types/`inputMode` not set** on search + travel + likely checkout inputs → wrong mobile keyboard, iOS zoom-on-focus risk.

## Mobile content-priority recommendations
- **Explore:** collapse the overflowing toolbar into a single sticky row — `[Filters]` `[Sort]` on the left, a fitting List/Map segmented toggle on the right; cert filter moves inside the Filters sheet. Promote results above everything else (already good).
- **Home:** prayer strip should degrade to icon-only / short label on ≤400px so both actions fit. Above-the-fold is already strong — protect it.
- **Business detail:** never let a missing-data field (coords) take down the whole page — the map is secondary; Call/Website/reviews are the conversion drivers and must always render.
- **Flights:** the Muslim-first differentiators (Muslim-meal flag, prayer-aware layover, qibla) are the reason to use this OTA — keep them above the fold in results, and make the trip-type/non-stop controls comfortably tappable since they gate every search.

## Mobile design-system rules to enforce going forward
- **Tap target:** every interactive element (incl. `[role=tab]`, `input[type=checkbox|radio]`, chips, in-card anchors) **≥44px min-height AND min-width**, ≥8px spacing. Add a catch-all in `mobile-a11y.css` for the classes above rather than per-component patches.
- **Type scale:** body **16px**; **no rendered text < 12px** — cap the floor with a single utility, don't hand-set 0.75rem.
- **Overflow:** target **zero** at 320–1024px; keep `overflow-x:clip` but add the overflow-probe snippet (from the `mobile-readiness` skill) to CI so clipped content is caught, not hidden.
- **Sticky bars & toasts:** always `+ env(safe-area-inset-bottom)`.
- **Sticky header budget:** 56px mobile bar + 42px prayer strip = ~98px chrome before content — acceptable, but don't add a third sticky band.
- **Inputs:** always set `type`/`inputMode`/`autocomplete`.

---

## "Mobile-first ready?" verdict
**Effectively launch-grade after this pass.** The foundation was already strong (viewport correct, safe-area handled, images optimized, most tap targets fixed, no page-level horizontal scroll). After verification, only **one** live Critical was real — and it's fixed. Status:

1. ✅ **Explore toolbar off-screen Map toggle** — FIXED & verified.
2. ✅ **Toast safe-area** — FIXED (needs a real-device visual confirm).
3. ✅ **Map NaN hard-crash (latent)** — FIXED (central sanitize).
4. ✅ **Tap-target round-2** (tabs, `.ota-pill`, checkboxes, `.claim-chip`, lang-toggle width, route chips) — FIXED; `.claim-chip`/lang verified 44px live.
5. ⬜ **Sub-12px text + input `type`/`inputMode`** — Medium, not yet done.
6. ⬜ **Live re-verify pages 6–15** (hotel detail, both checkouts, events modal, tools, Quran) — code-derived only.
7. ❌ ~~Business-detail crash~~ / ~~prayer-strip clip~~ — **withdrawn** (measurement contamination).

Ship 1–4 (done) → launch-grade mobile. 5–6 close the enterprise-polish gap.

---

## Prioritized fix plan (staged)

### Stage 0 — Critical (DONE in this pass, branch `feat/ux-audit-fixes`)
1. ✅ **Explore toolbar overflow** — `.explore-toolbar` class + mobile `flex-wrap:wrap` (`consumer.tsx:493`, `mobile-a11y.css`). Verified live: `pageOverflow=false`, Map reachable.
2. ✅ **Toast safe-area** — `styles/styles.css:537` now `calc(var(--tab-h) + 18px + env(safe-area-inset-bottom, 0px))`.
3. ✅ **Map NaN hardening** — central `isFiniteCoord` sanitize in `components/map/map-view.tsx` (fallback `SG_CENTER`, drop bad pins). *(Follow-up: add a regression test with a coordinate-less listing; optionally fix the `!= null`→`Number.isFinite` guards at call sites for defense-in-depth.)*
4. ~~Prayer strip clip~~ / ~~business crash~~ — withdrawn (not real).

### Stage 1 — High tap-target round 2 (DONE — appended to `styles/mobile-a11y.css`; `.claim-chip` & lang-toggle verified 44px live)
```css
/* Round-2 gaps found in live prod audit (2026-07) */
[role="tab"] { min-height: 44px; }
.ota-pill { min-height: 44px; }
.lang-toggle button { min-width: 44px; }               /* EN/BM were 37–40px wide */
.flt-trend, .flt-trend + *, .aa-chip { min-height: 44px; }  /* route/preset chips */
.claim-chip { min-height: 44px; display: inline-flex; align-items: center; }
/* checkbox/radio rows that aren't inside .flt-check/.fp-opt yet */
label:has(> input[type="checkbox"]), label:has(> input[type="radio"]) { min-height: 44px; display: inline-flex; align-items: center; }
/* in-card / inline anchors used as tap targets */
.card a, .flt-trend-route { min-height: 44px; }
/* error-boundary actions */
.error-actions button { min-height: 44px; }
```
(Verify each selector against the component; `.claim-chip` is currently un-styled in CSS — it may be inline-styled, so patch at its component if the rule doesn't bind.)

### Checkout + events live pass (2026-07 follow-up)
- ✅ **Input types already correct in code:** hotel `booking.tsx` and flight `booking.tsx` use `type="email"` + `type="tel"`/`inputMode`; Newsletter uses `type="email" inputMode="email" autoComplete="email"`. Only gap was the directory **SearchBar** → **FIXED** (`type="search" inputMode="search" enterKeyHint="search"`, `components/ui.tsx`).
- ✅ **Checkout degrades gracefully:** `/travel/booking` with no offer shows a clean "Couldn't start booking — Missing offer" state (no crash); `pageOverflow=false` at 390.
- ⚠️ **Blocked by data, not code:** the actual checkout *form* needs a real funnel offer/session param, and `/events` has **no events on this data branch** (mock events purged), so the events **RSVP/ticket modal** couldn't be exercised live. Re-run these two once a hotel offer session and seeded events exist. Sticky "Continue/Pay" + `.evt-stickybar` already carry safe-area in code.

### Stage 2 — Medium
- **Legible font floor** — raise remaining sub-12px classes (`.badge`, Hijri/`.flt-trend-sub`, trend labels) to ≥12px; ideally one utility caps the floor.
- **Input types** — add `type`/`inputMode`/`autocomplete` to directory search, travel autocomplete, and checkout inputs (`components/ui.tsx` SearchBar, `components/screens/travel/*`, booking field components).
- **320px floor** — locate the container min-width; allow it to shrink to 320.
- **Paid-gating (402) empty states** — confirm `/travel` + `/travel/flights` show a clear message when the hotel/flight API is gated, not a broken rail.

### Stage 3 — Durable
- Add the `mobile-readiness` overflow-probe + a Lighthouse-CI mobile budget (tap-targets, legible-font, CLS) to CI.
- Real-device matrix: one ~360 Android, one ~390 iPhone, one foldable (~344), one tablet.

### Verification (end-to-end)
- Re-run the live probe (from the `mobile-readiness` skill) at **320/360/390/414** on: `/`, `/explore`, a **coordinate-less** `/business/[slug]`, `/travel`, `/travel/flights`, `/travel/booking`, `/events/[slug]` (RSVP modal open). Assert: `pageOverflow=false`, **zero clipped interactive elements**, **zero sub-44px** interactive, **zero sub-12px** text.
- Manually confirm on a real notched iPhone: toast + all sticky bars clear the home indicator; explore List/Map toggle reachable; a coordinate-less business page renders (no error boundary).
