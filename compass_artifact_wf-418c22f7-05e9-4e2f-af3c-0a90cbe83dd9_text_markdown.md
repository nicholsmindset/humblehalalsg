# Mobile-Readiness & Mobile-Friendly Web Design — Source Material for the humblehalal.com SKILL.md

*Authoritative, current (2025–2026) best practices and exact thresholds, organized so they can be dropped directly into a structured Claude Code SKILL.md that serves both as an audit tool and a build standard for a Next.js/React OTA directory site.*

---

## TL;DR
- **Build and audit every page against three hard, numeric standards:** Core Web Vitals at the 75th percentile of real mobile users (**LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1**), **tap targets ≥ 48×48 CSS px with ≥ 8px spacing**, and **zero horizontal overflow from 320px up to 1024px**. These three rules catch the majority of the four reported pain points.
- **The four known pain points map to concrete fixes:** layout/sizing overflow → `min-w-0` + `max-width:100%` + an automated `scrollWidth` check; tiny tap targets → enforce a 48px minimum; slow load / poor CWV → `next/image` with `priority` + `next/font` + Server Components + code-splitting; bad text/image scaling → correct viewport meta + `next/image` `sizes` prop + fluid `clamp()` typography.
- **Tooling has changed:** Google **retired the standalone Mobile-Friendly Test and the Search Console Mobile Usability report on December 1, 2023**. Use **Lighthouse (mobile mode), PageSpeed Insights (CrUX field data), and Chrome DevTools device emulation**, backed by real-device testing at **320 / 360 / 375 / 390 / 412 / 414 / 428–430 / 768 / 1024 px**.

---

## Key Findings (the non-negotiable numbers)

| Standard | Value | Source |
|---|---|---|
| LCP — good / poor | ≤ **2.5s** / > 4.0s | web.dev/articles/defining-core-web-vitals-thresholds |
| INP — good / poor (replaced FID **Mar 12, 2024**) | ≤ **200ms** / > 500ms | web.dev/articles/inp |
| CLS — good / poor | ≤ **0.1** / > 0.25 | web.dev |
| CWV assessment | **75th percentile**, field/CrUX, 28-day rolling | developers.google.com/search |
| Tap target (build standard) | **48×48px + 8px spacing** | web.dev / Lighthouse |
| Tap target (Apple HIG) | **44×44pt** | Apple HIG |
| Tap target (Material 3) | **48×48dp + 8dp** | m3.material.io |
| Tap target (WCAG 2.5.8 AA, WCAG 2.2) | **24×24px** min | w3.org WCAG 2.2 |
| Tap target (WCAG 2.5.5 AAA) | **44×44px** | w3.org WCAG 2.1 |
| Legible font (Lighthouse pass) | **≥ 60% of text ≥ 12px**; aim 16px body | web.dev |
| Viewport meta | `width=device-width, initial-scale=1` | Google Search Central |
| Tailwind breakpoints | sm **640** / md **768** / lg **1024** / xl **1280** / 2xl **1536** | tailwindcss.com |

Mobile-first indexing is complete and universal — Google's smartphone Googlebot and the **mobile** rendering of each page are what gets indexed and ranked. A page that "renders at the wrong size on mobile" is therefore a ranking problem, not just a UX problem.

---

## Details

### A) Google's official mobile best practices

**Viewport meta tag (required on every page; this is the single most common cause of "wrong size on mobile"):**
```html
<meta name="viewport" content="width=device-width, initial-scale=1">
```
When drawing under notches/home indicators, extend it: `content="width=device-width, initial-scale=1, viewport-fit=cover"`. Never set `maximum-scale` or `user-scalable=no` — it blocks pinch-zoom and is an accessibility failure.

**Responsive web design** is Google's recommended pattern (one URL, one HTML, CSS adapts) over separate m-dot sites or dynamic serving — it simplifies mobile-first indexing.

**Legible font sizes:** Lighthouse's "Document uses legible font sizes" audit **fails when fewer than 60% of the page's text is ≥ 12px**. 12px is the floor to pass; **16px is the practical recommended minimum for body text** on mobile to avoid forcing zoom.

**Content sized to the viewport:** Lighthouse's "Content is sized correctly for the viewport" fails when rendered content is wider than the viewport (horizontal scroll) or the viewport meta is missing.

**Intrusive interstitials (can suppress mobile rankings):**
- **Penalized:** popups that cover the main content immediately after the user arrives from Search; standalone interstitials that must be dismissed to reach content; deceptive layouts where an interstitial-like block occupies above-the-fold and real content is pushed down.
- **Allowed:** legally required dialogs (cookie consent, age verification); login dialogs for non-indexable/private content; reasonably sized, easily dismissible banners (e.g., a modest app-install banner). The penalty targets **size, timing, and intrusiveness**, not interstitials as a category.

### B) Core Web Vitals (current 2025–2026)

| Metric | Good | Needs improvement | Poor |
|---|---|---|---|
| **LCP** (loading) | ≤ 2.5s | > 2.5s – 4.0s | > 4.0s |
| **INP** (responsiveness) | ≤ 200ms | > 200ms – 500ms | > 500ms |
| **CLS** (visual stability) | ≤ 0.1 | > 0.1 – 0.25 | > 0.25 |

- **INP replaced First Input Delay (FID) on March 12, 2024.** FID is fully deprecated. INP measures the latency of *all* interactions across the page lifecycle, so it is far harder to "game" than FID and is heavily influenced by main-thread JS — directly relevant to React hydration cost.
- **75th-percentile rule:** a metric passes only when **75% of real visits** meet the "good" threshold, segmented separately for mobile and desktop.
- **Field vs lab:** Search uses **field data from the Chrome User Experience Report (CrUX)** over a **rolling 28-day window**. **INP is field-only** (lab tools can't measure real user interactions; Lighthouse reports **Total Blocking Time (TBT)** as a lab proxy). LCP and CLS appear in both lab and field.
- **Common CLS causes** (prioritize for this site): images without `width`/`height`; ads, embeds, and iframes without reserved space; dynamically injected content (e.g., filter chips, search results, banners); web fonts causing FOIT/FOUT reflow; late-loading layout above existing content.
- **Practical "good on mobile" techniques:** preload and `priority` the LCP image; reserve space for every async element; self-host fonts with matched fallback metrics; minimize and split client JS to keep the main thread free for interactions (INP).

### C) Next.js / React–specific mobile optimization

**`next/image`** — the primary tool against poor image scaling AND CLS:
- Provide explicit **`width` and `height`** (reserves layout space → no CLS), **or** use **`fill`** with a parent that has `position: relative` and a defined size (when dimensions are unknown).
- Always set the **`sizes`** prop for responsive images / `fill` so the browser downloads the right `srcset` candidate instead of an oversized file, e.g. `sizes="(max-width: 768px) 100vw, 50vw"`. Omitting it causes over-downloading on mobile (hurts LCP and data use).
- Images are **lazy-loaded by default** (`loading="lazy"`).
- Set **`priority`** on the LCP/hero image (disables lazy load, preloads with `fetchpriority="high"`). Next.js warns in dev if the detected LCP image lacks it.
- With `fill`, set `object-fit` (usually `cover`).

**`next/font`** — eliminates font-driven CLS:
- Self-hosts fonts (Google Fonts pulled at build time, no runtime request).
- `font-display` defaults to **`swap`**.
- Automatically generates a fallback font using **`size-adjust`, `ascent-override`, `descent-override`, `line-gap-override`** so the fallback occupies the same space as the web font → **zero layout shift** during swap. Controlled via `adjustFontFallback`.

**App Router architecture:**
- **Server Components (default)** render on the server and ship **less or zero client JS**, which lowers Total Blocking Time and improves INP — the key React-specific win for responsiveness.
- **Streaming** via `loading.js` / React `<Suspense>` sends HTML in chunks, improving TTFB and perceived load — valuable for data-heavy flight/hotel results.

**Bundle reduction:**
- Automatic **per-route code splitting**; use **`next/dynamic`** for component-level lazy loading (supports `{ ssr: false }` for client-only widgets like maps, and `{ loading: ... }` for fallbacks). Defer heavy, below-the-fold, or interaction-triggered components (date pickers, maps, comparison tables) to shrink the initial mobile bundle.

**Hydration-related shifts:** avoid rendering different markup on server vs client (e.g., `typeof window` branches, locale/time formatting) — mismatches cause hydration reflow. Gate client-only UI behind a mounted flag or `dynamic(..., { ssr:false })`.

### D) Responsive CSS / Tailwind techniques

**Breakpoints (min-width based, mobile-first):** `sm` 640px · `md` 768px · `lg` 1024px · `xl` 1280px · `2xl` 1536px. **Unprefixed utilities apply to all sizes including mobile**; a prefix like `md:` applies at that width **and up**. Design the base (mobile) styles first, then layer larger breakpoints.

**Fluid typography** with `clamp(MIN, PREFERRED, MAX)`:
```css
font-size: clamp(1rem, 0.5rem + 2vw, 2rem);
```
The viewport-relative middle term scales smoothly between the min and max — avoids text that is too small on phones or too large on tablets, and reduces breakpoint churn.

**Preventing horizontal overflow — culprits and fixes:**
| Culprit | Fix |
|---|---|
| Fixed pixel widths (`w-[1200px]`) | use `max-w-full` / `w-full` |
| Images without constraint | `max-width:100%` (Tailwind `max-w-full h-auto`) |
| Flex/grid children refusing to shrink | add **`min-w-0`** to the child |
| Long unbroken strings / URLs | `break-words` / `overflow-wrap:anywhere` |
| `100vw` (includes scrollbar) | prefer `100%` or `100dvw` carefully |
| Wide tables, `pre`/`code` blocks | wrap in `overflow-x-auto` container |
| Absolute/negative positioning | constrain to a `relative overflow-hidden` parent |

**Safe-area insets (notched/foldable devices):** with `viewport-fit=cover`, pad with `env(safe-area-inset-top/right/bottom/left)` — critical for sticky bottom CTAs so "Book Now" isn't under the home indicator: `padding-bottom: env(safe-area-inset-bottom, 0px)`.

**Responsive images in plain HTML/CSS:** use `srcset` + `sizes`; ensure `img { max-width:100%; height:auto; }`.

**Tap targets in Tailwind:** enforce `min-h-[48px] min-w-[48px]` (or `h-12 w-12`) on icon buttons; add spacing (`gap-2` ≈ 8px) between adjacent targets. Set comfortable `leading-` (line-height ~1.5) for body readability.

### E) OTA / travel-site mobile patterns

- **Search forms (flights/hotels):** use full-screen or bottom-sheet date pickers (avoid cramped inline calendars); native-feeling location **autocomplete** with large list rows (≥ 48px); **stepper** controls for passengers/guests/rooms rather than tiny dropdowns. Each field should be full-width on mobile and stack vertically.
- **Results / listings:** prefer **cards over tables**; move filters into a **bottom sheet or modal** triggered by a sticky "Filters" bar; show active-filter chips; keep sort accessible. This directly addresses directory-listing overflow.
- **Data-dense content (flight times, fare/price grids, hotel comparison):** **do not** render desktop tables on phones — convert to **stacked cards** (label/value pairs) or a horizontally scrollable container with a frozen first column; never let a table force page-level horizontal scroll.
- **Booking flow / checkout:** minimize steps; large inputs and 48px buttons; a **sticky bottom "Book/Continue" CTA** that respects safe-area and is spaced away from other controls to prevent accidental taps; clear progress indication.
- **Maps:** lazy-load (`next/dynamic`, `ssr:false`); make map gestures one-finger-pan-safe (avoid trapping page scroll); provide a list/map toggle rather than a tiny inline map.

### F) Testing & measurement (post-2023 toolset)

- **What changed:** Google **removed the standalone Mobile-Friendly Test tool, its API, and the Search Console Mobile Usability report on December 1, 2023.** Mobile usability is no longer reported in Search Console.
- **Use now:** **Lighthouse in mobile mode** (Chrome DevTools) for lab diagnostics; **PageSpeed Insights** for both lab and **CrUX field data**; **Chrome DevTools Device Mode** for viewport emulation; the **Rich Results Test** for structured data; and **real devices** for true touch/scroll behavior.
- **Concrete viewport widths to test (CSS px, portrait):** **320** (worst-case legacy / iPhone SE 1st gen), **360** (most common Android), **375** (iPhone SE/mini class), **390** (modern iPhone), **412** (large Android/Pixel), **414** (older Plus iPhones), **428 / 430** (iPhone Pro Max), **768** (iPad portrait / Z Fold unfolded class), **1024** (iPad Pro / desktop boundary). **360 and 390 are the two highest-traffic real-world widths; always verify 320 as the failure case.** Foldables: Galaxy Z Fold folded ≈ 344–360px, unfolded ≈ 768–884px. Oppo/Xiaomi/Huawei/Vivo/OnePlus cluster at **360** and **393–412**.
- **Programmatic horizontal-overflow detection** (add to a dev/QA snippet):
```js
// Is the page overflowing horizontally?
const hasOverflow =
  document.documentElement.scrollWidth > document.documentElement.clientWidth;

// Which elements overflow?
const docWidth = document.documentElement.clientWidth;
[...document.querySelectorAll('*')].forEach(el => {
  if (el.getBoundingClientRect().right > docWidth || el.offsetWidth > docWidth) {
    console.log('Overflow:', el);
  }
});
```
Use `documentElement.clientWidth` (excludes scrollbar) rather than `window.innerWidth` (includes it) for accuracy.

### G) Itemized mobile audit checklist (run against ANY page, any type)

**Viewport & scaling**
- [ ] `<meta name="viewport" content="width=device-width, initial-scale=1">` present; no `maximum-scale`/`user-scalable=no`.
- [ ] Page renders at correct width at 320/360/375/390/412/428/768/1024px.

**Horizontal overflow**
- [ ] `scrollWidth === clientWidth` at every test width (no horizontal scroll).
- [ ] Flex/grid children have `min-w-0`; images `max-w-full h-auto`; tables/`pre`/`code` wrapped in `overflow-x-auto`; long strings `break-words`.

**Tap targets**
- [ ] All interactive elements ≥ **48×48px** with ≥ **8px** spacing (icon buttons, filter chips, calendar cells, autocomplete rows, pagination).

**Font legibility & readability**
- [ ] ≥ 60% of text ≥ 12px (Lighthouse); body text target **16px**; line-height ~1.5; sufficient contrast (WCAG AA 4.5:1 normal text).

**Image scaling**
- [ ] All images use `next/image` with `width`/`height` or `fill`; `sizes` set; hero/LCP image has `priority`.

**CLS sources**
- [ ] Space reserved for images, ads/embeds/iframes, and dynamically injected content; fonts via `next/font` (no FOIT/FOUT reflow).

**Core Web Vitals (mobile, field at p75)**
- [ ] LCP ≤ 2.5s · INP ≤ 200ms · CLS ≤ 0.1 in PSI field data; Lighthouse mobile lab passes (TBT low as INP proxy).

**Interstitials & safe area**
- [ ] No intrusive popups covering content on arrival; only allowed dialogs (consent/login/modest banners).
- [ ] Sticky CTAs respect `env(safe-area-inset-bottom)`; nothing hidden under notch/home indicator.

---

## Recommendations (staged, with thresholds that change them)

**Stage 1 — Stop the bleeding (overflow + viewport), 1–2 days.**
1. Confirm the viewport meta tag on the root layout (`app/layout.tsx`); if missing or modified, this alone explains "wrong size on mobile."
2. Run the `scrollWidth`-vs-`clientWidth` snippet on every page template at 320/360/390/412px; fix each offender with `min-w-0`, `max-w-full`, `overflow-x-auto`, or `break-words`.
   - *Threshold to advance:* zero overflow at all eight test widths.

**Stage 2 — Enforce build standards on components, 2–4 days.**
3. Standardize a 48px tap-target rule (a reusable `Button`/`IconButton` with `min-h-[48px] min-w-[48px]` and `gap-2` spacing); audit filter chips, date-picker cells, and autocomplete rows specifically.
4. Migrate all `<img>` to `next/image` with `sizes` + `priority` on LCP images; adopt `next/font` for all typefaces; convert data-dense tables to stacked cards on `<md`.
   - *Threshold:* Lighthouse mobile "tap targets," "legible font sizes," and "content sized correctly" all pass.

**Stage 3 — Hit CWV "good" on mobile, ongoing.**
5. Reduce client JS: convert non-interactive UI to Server Components, `next/dynamic` the map/date-picker/comparison widgets, and stream results pages with `<Suspense>`.
6. Gate releases on **PSI field data (CrUX) at p75** reaching good on LCP/INP/CLS for the key page types (home/directory, flight results, hotel detail, checkout).
   - *Threshold to consider "done":* 75% of mobile visits good on all three; if INP regresses > 200ms after a feature ship, profile main-thread/hydration cost before release.

**Stage 4 — Make it durable.**
7. Add the overflow snippet and a Lighthouse-CI mobile budget to CI; maintain a real-device test matrix (one small Android ~360, one modern iPhone ~390, one foldable, one tablet). Re-check CWV monthly given the 28-day field lag.

---

## Caveats
- **Newest device widths vary by generation** — iPhone 16 Pro (~402px) / 16 Pro Max (~440px) and Galaxy Z Fold folded (344 vs 360) / unfolded (768 vs 884) differ by model; treat the **320–430px** range as the mobile envelope and verify specific models against a device-spec reference (e.g., yesviz, BrowserStack) rather than hardcoding.
- **Field CWV data lags ~28 days**, so improvements won't show immediately in PSI/Search Console; use Lighthouse lab + the Web Vitals JS library for faster feedback, remembering **INP cannot be measured in lab** (TBT is only a proxy).
- A few exact wordings (Lighthouse's "≥60% of text ≥12px" pass rule, the Dec 1 2023 retirement date, and newest device pixel widths) are well-established but should be spot-confirmed at the cited official pages when authoring the final SKILL.md, since vendor docs occasionally revise phrasing.
- These are platform-level standards; the halal/Muslim-friendly content angle (e.g., prayer-time widgets, halal filters) should itself follow the same tap-target, overflow, and CLS rules — treat any such custom widget as a first-class audit target, especially if injected client-side.