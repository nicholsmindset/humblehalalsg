---
name: mobile-readiness
description: Audit and build any page of this Next.js/React OTA + directory site to current (2025–2026) mobile standards. Use when creating or reviewing UI for mobile — to catch the four pain points (horizontal overflow, sub-48px tap targets, slow Core Web Vitals, bad text/image scaling) and enforce hard numeric thresholds. Both an audit checklist and a build standard.
---

# Mobile-Readiness (audit + build standard)

Mobile-first indexing is universal: the **mobile** render of a page is what Google indexes and ranks. A page that renders at the wrong size on mobile is a ranking problem, not just UX. Build and audit every page against three hard rules: **CWV good at p75, ≥48px tap targets, zero horizontal overflow 320–1024px.**

## The non-negotiable numbers

| Standard | Value |
|---|---|
| LCP (loading) | good ≤ **2.5s**, poor > 4.0s |
| INP (responsiveness, replaced FID 2024-03-12) | good ≤ **200ms**, poor > 500ms (field-only; TBT is the lab proxy) |
| CLS (visual stability) | good ≤ **0.1**, poor > 0.25 |
| CWV assessment | **75th percentile** of real mobile visits (CrUX field, 28-day rolling) |
| Tap target (build standard) | **≥ 48×48 CSS px + ≥ 8px spacing** (Material 3 / Lighthouse). WCAG 2.5.8 AA floor = 24px; AAA = 44px |
| Legible font | **≥ 60% of text ≥ 12px** (Lighthouse fail below); body target **16px** (prevents iOS zoom on inputs) |
| Viewport meta | `width=device-width, initial-scale=1` — **never** `maximum-scale`/`user-scalable=no`; add `viewport-fit=cover` for notch + safe-area |
| Horizontal overflow | **zero** from **320px → 1024px** |

Test widths (CSS px, portrait): **320, 360, 375, 390, 412, 428/430, 768, 1024**. 360 + 390 are the highest-traffic real widths; **always verify 320** as the failure case. Foldables: Z Fold folded ≈ 344–360, unfolded ≈ 768–884.

## Audit checklist (run against ANY page)

- **Viewport:** correct meta, no scale lock, `viewport-fit=cover` for notches.
- **Overflow:** `scrollWidth === clientWidth` at every test width. Flex/grid children have `min-width:0`; images `max-width:100%`; tables/`pre` wrapped in `overflow-x:auto`; long strings `overflow-wrap:anywhere`. ⚠️ A global `overflow-x:clip` *hides* overflow — audit for clipped content too, not just scrolling.
- **Tap targets:** every `a/button/input/[role=tab]/[role=button]`, filter chip, calendar cell, autocomplete row, pagination ≥ 48×48 with ≥ 8px spacing.
- **Fonts:** ≥60% text ≥12px; body 16px; line-height ~1.5; contrast ≥ 4.5:1.
- **Images:** `next/image` with width/height or `fill`; `sizes` set; LCP/hero has `priority`.
- **CLS sources:** space reserved for images, embeds/iframes, and dynamically-injected content (filter chips, results, banners); fonts via `next/font` (no FOIT/FOUT reflow).
- **Safe area:** sticky bottom CTAs use `env(safe-area-inset-bottom)`; nothing under the notch/home indicator/Dynamic Island (top + side insets too).
- **Interstitials:** no popup covering content on arrival; only consent/login/modest banners.

## Detection snippets (paste into DevTools or Playwright `browser_evaluate`)

```js
// Page-level horizontal overflow + the offending elements
const cw = document.documentElement.clientWidth; // excludes scrollbar
const over = [...document.querySelectorAll('*')].filter(el => {
  const r = el.getBoundingClientRect();
  return r.right > cw + 1 || r.width > cw + 1;          // ignore intentional carousel scrollers
});
console.log('overflow?', document.documentElement.scrollWidth > cw, over.slice(0,20));

// Interactive elements under 44px
[...document.querySelectorAll('a,button,input,[role=tab],[role=button]')].forEach(el => {
  const r = el.getBoundingClientRect();
  if (r.width && r.height && (r.height < 44 || r.width < 44))
    console.log(`${r.width|0}x${r.height|0}`, el);
});
```

## Next.js / React rules (this codebase)

- **`next/image`** is the primary fix for image scaling AND CLS. Give explicit `width`/`height` **or** `fill` (parent `position:relative` + sized). **Always set `sizes`** (e.g. `sizes="(max-width:768px) 100vw, 400px"`) or mobile over-downloads the desktop file. `priority` on the LCP/hero image (preloads, disables lazy). With `fill`, set `object-fit`. **Hosts must be in `images.remotePatterns`** in the Next config or it 500s — reuse the existing `ImagePh` wrapper (`components/ui.tsx`).
- **`next/font`** self-hosts + generates a metric-matched fallback → zero font-CLS. Already used in `app/layout.tsx`. No external `<link>` to Google Fonts.
- **`next/dynamic({ ssr:false })`** + lazy-load heavy/below-fold/interaction-triggered widgets (maps, charts, date pickers, comparison tables) to cut mobile JS → lower TBT/INP. Leaflet map is already dynamic; Recharts should be.
- **Server Components** by default (ship less/zero client JS → better INP); stream data-heavy results with `<Suspense>`/`loading.js`.
- Avoid server/client markup mismatches (`typeof window`, locale/time) → hydration reflow; gate client-only UI behind a mounted flag or `ssr:false`.

## OTA / travel patterns (search, results, booking)

- **Search forms:** full-width stacked fields on mobile; full-screen/bottom-sheet date pickers (a 2-month inline calendar overflows ≤520px — show one month + nav); large autocomplete rows (≥48px); steppers for guests/pax, not tiny dropdowns.
- **Results/listings:** cards, not tables; filters in a bottom-sheet/modal with active-filter chips; keep sort reachable.
- **Data-dense (fares, rate grids):** never render desktop tables on phones — stack into label/value cards or a contained `overflow-x:auto`; never force page-level horizontal scroll.
- **Booking/checkout:** minimal steps; 48px inputs/buttons; sticky bottom "Book/Continue" that respects `env(safe-area-inset-bottom)` and is spaced from other controls.

## Staged remediation (thresholds that advance each stage)

1. **Stop the bleeding:** correct viewport; zero overflow at 320/360/390/412.
2. **Build standards:** 48px tap targets; migrate `<img>`→`next/image` (+`sizes`/`priority`); fluid `clamp()` type ≥12px; safe-area on sticky bars. → Lighthouse mobile "tap targets" / "legible font sizes" / "content sized correctly" pass.
3. **Hit CWV good (mobile, p75):** Server Components, `next/dynamic` the map/charts/date-pickers, stream results → LCP/INP/CLS good for 75% of mobile visits.
4. **Durable:** add the overflow snippet + a Lighthouse-CI mobile budget to CI; real-device matrix (one ~360 Android, one ~390 iPhone, one foldable, one tablet); re-check CWV monthly (28-day field lag).

## Tooling (post-2023)

Google retired the standalone Mobile-Friendly Test + Search Console Mobile Usability report on **2023-12-01**. Use **Lighthouse mobile mode**, **PageSpeed Insights** (lab + CrUX field), **Chrome DevTools device mode**, and **real devices**. INP can't be measured in lab — TBT is the proxy; field data lags ~28 days.
