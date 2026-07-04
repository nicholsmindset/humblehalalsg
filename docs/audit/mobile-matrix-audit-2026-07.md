# Mobile-First Matrix Audit — humblehalal.com (July 2026)

> Third mobile pass. Where [`mobile-first-audit-2026-07.md`](./mobile-first-audit-2026-07.md) tested 4 widths on production and closed the worst blockers, this pass built a **repeatable device-matrix harness** (8 portrait widths 320→768 + 2 landscape), ran it against a local production build, fixed what it found at the root, and left a CI guard so mobile stays airtight.

**Priority (from the owner):** content is getting **cut off on real phones — text pushed over the edge and clipped**. That is #1. Performance is a distinct, later workstream (the site is already fast); this pass measures but does not chase CWV.

## Why cut-off content is invisible here

`styles/styles.css` sets `html, body { overflow-x: clip }` — deliberately, so `position: sticky` keeps working. The side effect: an element wider than the viewport is **silently clipped at the edge**, not revealed by a scrollbar. `document.scrollWidth` is therefore always equal to `clientWidth` and a naive overflow check finds nothing. The harness probes **every element's box** against the viewport (`getBoundingClientRect().right > clientWidth`), skipping intentional scrollers (`.ota-track`, `.tbl-scroll`, …) and design crops — the only reliable way to catch content that's cut off but not scrollable.

## Method

- **Build:** local `next start` production build at commit `cd36d81` (baseline) with real `.env.local` keys (Supabase + LiteAPI + Clerk), so data-backed pages (business/hotel/event detail) render with real content. `PAID_HOTELS_ENABLED=1` locally.
- **Harness:** `scripts/mobile-audit.mjs` + shared probes in `e2e/probes.mjs`. Run with `npm run audit:mobile -- --phase=before|after`; diff with `--diff before after`. Artifacts (screenshots + `findings.json`) land in the gitignored `reports/mobile-audit/`.
- **Device matrix (CSS px):** 320×693, 344×882 (Fold folded), 360×740 (Galaxy S8), 375×667 (iPhone SE), 390×844 (iPhone 12/13/14), 412×915 (Pixel 7), 430×932 (iPhone Pro Max), 768×1024 (iPad Mini), + landscape 844×390 and 932×430 for the booking/search flows.
- **Probes per route-state:** element-level horizontal overflow (parent-scroll-aware) · tap-target geometry (fail <24 / warn <44 / note <48, primary-CTA tagged) · sub-12px text · sub-16px inputs (iOS zoom) · axe WCAG 2.0/2.1/2.2 A+AA · console/pageerror. ~30 route-states, incl. interactive states (nav drawer, filter sheet, date picker, occupancy, cookie banner, newsletter popup, event ticket flow, Faraid results table).

## Result summary

Baseline `cd36d81` (harness only, pre-fix) → final `051b423` (all fixes), same 10-device matrix.

| | Before | After |
|---|---|---|
| **Critical** | 84 | **0** |
| **High** | 3151 | **0** |
| **Element-level overflow (cut-off content)** | 131 (57 unique root causes) | **0** |
| **Sub-16px inputs (iOS zoom-on-focus)** | 48 | **0** |
| **Critical axe violations** | 5 types (button-name, select-name, label, aria-required-children, aria-valid-attr-value) | **0** |
| **Map `flyTo` NaN crashes** | 8 | **0** |
| Gate-route hard-fail items (overflow / primary-CTA <44 / interactive <24 / input <16) | many | **0** |
| Medium (warnings) | 2316 | 3240 |

**The counts to read are the severity eliminations: every Critical, every High, and all cut-off content are gone.** The raw counts were dominated by a few root causes repeated across 24 routes × 8–10 devices (one footer rule, one input rule…) — the sections below group by root cause.

The Medium (warning) count *rose* — not a regression (there are zero Highs/overflows). The after-sweep exercises interactive states the before-sweep couldn't reach (date pickers, occupancy/passenger steppers, the cookie banner, a live with-offer checkout — the consent-seed fix unblocked them), so it simply *measures more UI*. Every remaining Medium is a non-gating warning: a non-primary tap target between 24–43px, a third-party console error, decorative sub-12px text, or a color-contrast item (see "Remaining" below).

**Verification:** `e2e/mobile.spec.ts` passes **43/43** across the 320 / 390 / 768 projects; the full Playwright suite passes (58 tests); the guard was confirmed to *bite* (it caught the tools-hub breadcrumb at 20px and the injected 150vw overflow, failing until fixed).

## Defects fixed (grouped by root cause)

Severity: **Critical** = content/CTA cut off or flow broken · **High** = sub-standard, hurts usability/SEO · **Medium** = polish.

### 1. Cut-off content (element-level overflow) — the priority

| # | Severity | Where | Root cause | Fix |
|---|---|---|---|---|
| O1 | **Critical** | Event detail `/events/[slug]` — every phone, main column clipped ~55–131px | `.detail-body` grid item `.detail-main` has default `min-width:auto`; long meta rows force the `1fr` column wider than the viewport | `.detail-main { min-width: 0 }` (`styles/screens.css`) |
| O2 | **High** | Hotel detail `/travel/hotel/[id]` — reserve box + room list clipped ~55px at ≤360px | same grid `min-width:auto` on `.hotel-detail-grid` children | `.hotel-detail-grid > * { min-width: 0 }` (`styles/travel.css`) |
| O3 | **Critical** | Cookie-consent banner — "Essential only" clipped off the left edge ≤344px (first-visit, every page) | 3 action buttons in a non-wrapping row wider than 344px | `.cookie-actions { flex-wrap: wrap }` (`styles/mobile-a11y.css`) |
| O4 | **High** | Explore toolbar — Filters/Sort/cert group overflowed ~20px at 320px | inner control group didn't wrap | wrap `.explore-toolbar > .flex` ≤360px |
| O5 | Medium | Date-range calendar — 2-month view (~530px) overflowed on tablet + landscape | single-month collapse only fired ≤520px | collapse to one month + cap popover to viewport ≤960px |
| O6 | Low | Prayer-strip mosque button (3px) + Quran surah-nav (5px) grazed the edge at 320px | fixed max-width / no shrink | give the label room / allow shrink+ellipsis ≤340px |
| K3 | **High** | Faraid results table `/tools/inheritance` — clipped with no scrollbar on narrow phones | `<table>` not wrapped in a scroll container (body is `overflow-x:clip`) | wrap in `.tbl-scroll` + `min-width:0` override (`inheritance.tsx`, `styles/tools.css`) |

### 2. iOS zoom-on-focus (K1) — every form on the site

Safari zooms the page when a focused text control is `< 16px`. **13 selectors** across search, travel, flights, checkout, and contact rendered at 13–15.7px. One `@media (pointer: coarse)` block in `styles/mobile-a11y.css` raises them all to 16px (desktop density preserved); `-webkit-text-size-adjust: 100%` added to `<html>`.

### 3. Body scroll lock (K2)

No overlay locked the page — the background scrolled behind every modal, drawer, sheet, and popup on mobile. New ref-counted `useBodyScrollLock` (`components/ui.tsx`), deliberately **not** baked into `useDialog` (the notification-bell popover would freeze the page). Wired into `Modal`, the nav drawer, onboarding, the newsletter popup, and the explore filter sheet (≤860px only). `overscroll-behavior: contain` on overlays stops iOS scroll-chaining. *(iOS `position:fixed` fallback documented below — chromium emulation can't prove iOS Safari.)*

### 4. Map crash — `Invalid LatLng (NaN, NaN)`

Business detail (and any map mounted in a grid/flex cell) threw from Leaflet's `flyTo`: when the container lays out **after** the map mounts, `getSize()` is (0,0) and the projection math divides by zero → NaN. Thrown from an effect, so **not catchable by the React error boundary**. `FitOrCenter` now guards on `map.getSize()` and uses an instant `setView` until the container is sized (`components/map/leaflet-map.tsx`). *(The prior audit's coord-sanitize fixed bad input coords; this is the separate zero-size-container path.)*

### 5. Critical accessibility (axe)

| Violation | Where | Fix |
|---|---|---|
| `aria-valid-attr-value` | search combobox | set `aria-controls`/`aria-owns` only when the listbox is rendered |
| `button-name` | mobile-header back button | `aria-label="Go back"` |
| `select-name` | explore sort | `aria-label="Sort results"` |
| `label` / `select-name` | contact form | `id`/`htmlFor` on all fields |
| `aria-required-children` | `.ota-track` carousels | dropped `role="list"` (children aren't listitems) |

### 6. Tap targets

The 44px touch-row rule capped at 700px, so **iPad (768px)** reverted footer nav/legal links and section toggles to ~20px. Extended the touch-row + text floor to any `pointer: coarse` device. Breadcrumb links and the "How we verify" trust button given 44px rows; Leaflet zoom bumped to 40px. *(Genuinely-inline text links are exempt per WCAG 2.5.8 — the probe skips `display:inline` anchors.)*

### 7. Legible-text floor (K4)

Recurring sub-12px content classes (newsletter consent, destination tags, halal chips, logo subtitle at 9.3px, …) raised to ≥12px on touch widths; purely decorative micro-labels left as-is.

## Evidence (before / after)

Curated pairs in [`img/mobile-matrix-2026-07/`](./img/mobile-matrix-2026-07/). Note: because `overflow:clip` *hides* over-wide content, most overflow fixes don't produce a dramatic static-image diff — the quantitative proof is the 131→0 overflow count. The clearest visual is the cookie banner. Before-shots include the consent banner, which the harness's consent-seed fix later dismissed.

| Defect | Before | After |
|---|---|---|
| O3 cookie banner clipped ("ssential only") @344px | `cookie-banner-344__before.png` | `cookie-banner-344__after.png` |
| K3 Faraid results table @320px | `faraid-table-320__before.png` | `faraid-table-320__after.png` |
| O1 event detail @320px | `event-detail-320__before.png` | `event-detail-320__after.png` |
| O2 hotel detail @320px | `hotel-detail-320__before.png` | `hotel-detail-320__after.png` |
| Date picker (single-month) @390px | `date-picker-390__before.png` | `date-picker-390__after.png` |
| K2 nav drawer + scroll-lock @390px | `nav-drawer-scrolllock-390__before.png` | `nav-drawer-scrolllock-390__after.png` |

## Remaining (non-gating warnings — deferred)

All are Medium/warning severity; none block CI or a conversion path.

- **Color contrast (52 axe "serious"):** muted grey text on the cream background falls below 4.5:1 in places. Systemic to the brand palette — fixing it is a design-token pass, not a mobile-layout fix, so it's deferred to avoid ad-hoc palette drift.
- **Non-primary tap targets 24–43px:** Leaflet zoom controls (~40px), some filter/OTA chips, breadcrumb links at landscape widths >820px. Above the 24px WCAG floor; not conversion actions.
- **Decorative sub-12px text:** a handful of micro-labels (bottom-tab captions, photo credits) intentionally left small.
- **Third-party console errors:** local `next start` has no Clerk CDN / ad / analytics wiring, so `clerk.humblehalal.com` (CORS) and AdSense/GTM resource loads log 4xx. Environmental, not a site defect — absent in production.

## Blocked / not verified

- One transient `explore` filter-open click timeout on a single device (down from 14 blocked in the before-sweep once the consent-seed fix stopped the banner intercepting taps). Re-runs cleanly.
- iOS scroll-lock fidelity and safe-area on a real notched iPhone: chromium emulation can't prove iOS Safari. The lock uses `overflow:hidden` + `overscroll-behavior:contain`; if a real device still leaks, the documented fallback is the `position:fixed` body technique.

## Out of scope (owner's call — performance is a later workstream)

- **~262KB of global CSS** is imported on every route (`app/layout.tsx`) — route-splitting it is its own PR.
- No `line-clamp` anywhere — long card text relies on wrap/ellipsis.
- CWV lab numbers not chased; the site is already fast per the owner.

## What CI now guards

`e2e/mobile.spec.ts` runs on three viewport projects (320 / 390 / 768) and **hard-fails** the build on: any element clipped by the page edge, a primary CTA under 44px, an interactive element under 24px (WCAG 2.5.8), a sub-16px input, or a critical axe violation — on key-independent routes. Sub-44px non-primary targets and sub-12px text are logged as warnings. Failing runs upload their screenshots as a CI artifact.

## Re-run the harness

```bash
npm run build && npm run start                 # local prod build with .env.local
npm run audit:mobile -- --phase=after          # full matrix sweep → reports/mobile-audit/after/
npm run audit:mobile -- --diff before after    # fixed / persisting / new
npx playwright test e2e/mobile.spec.ts         # the CI guard, locally
```
