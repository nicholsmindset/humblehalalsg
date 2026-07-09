# Mobile audit — agent-browser sweep (2026-07-08)

Automated with **agent-browser** (headless Chrome 150, CDP) driving a real **iPhone 14 viewport (390×844, DPR 3)** against production `www.humblehalal.com`. 10 key routes probed for the four mobile pain points (horizontal overflow, tap-target size, text scaling, Core Web Vitals) plus CWV per route.

> ⚠️ **CWV caveat:** measurements are **unthrottled on a fast local connection with warm cache** — treat them as *best-case*, not field data. Real throttled-3G/4G will be materially higher (prior throttled runs put homepage LCP ~4s). The **relative** differences between routes are the reliable signal here.

## Core Web Vitals (mobile, best-case)

| Route | TTFB | FCP | LCP | LCP element | CLS |
|---|--:|--:|--:|---|--:|
| `/` | 9.1ms | 192ms | 192ms | `h1` | 0 |
| `/mosques` | 8.2ms | **768ms** | **768ms** | `p` | 0 |
| `/prayer-rooms` | 8.1ms | 132ms | 132ms | `p` | 0 |
| `/map` | 9.4ms | 148ms | 248ms | `img` (OSM tile) | 0 |
| `/tools` | 9.4ms | 208ms | 208ms | `h1` | 0 |
| `/tools/inheritance` | 6.6ms | 148ms | 148ms | `p` | 0 |
| `/travel/hotels` | 8.2ms | 124ms | 140ms | `p` | 0 |
| `/events` | 6.4ms | 132ms | 164ms | `p` | 0 |
| `/blog` | 6.5ms | 196ms | 212ms | `img` (webp) | 0 |
| `/is-halal` | 6.9ms | 272ms | 272ms | `p` | 0 |

**CLS = 0 on every route** — excellent, no layout shift. LCP elements are text (`h1`/`p`) except `/map` (OSM tile) and `/blog` (hero webp, already optimized).

## Mobile-readiness probe (390px)

| Route | H-overflow | Tap targets <44px | Tiny text (<12px) | Img overflow |
|---|:--:|--:|--:|--:|
| `/` | none | 18 | 14 | 0 |
| `/mosques` | none | **83** | 10 | 0 |
| `/prayer-rooms` | none | **116** | **109** | 2 |
| `/map` | none | 15 | 3 | 2 |
| `/tools` | none | 19 | 38 | 0 |
| `/tools/inheritance` | none | 14 | 6 | 0 |
| `/travel/hotels` | none | 5 | 5 | 0 |
| `/events` | none | 27 | 7 | 0 |
| `/blog` | none | 15 | 32 | 0 |
| `/is-halal` | none | 8 | 45 | 0 |

**No horizontal overflow anywhere** ✓ (the 1600px Leaflet tile container on `/prayer-rooms` and `/map` is clipped inside the map, not page-level overflow).

## Findings, ranked

### 1. HIGH — Footer links 15–17px tall, site-wide
`Privacy Policy` (71×**15**), `Onnifyworks` (72×**17**), Terms/PDPA. Fails WCAG 2.5.8 (AA, 24px min) **and** Apple HIG (44px). Appears on every page. **Fix:** bump footer link line-height/padding to ≥44px touch area.

### 2. HIGH — `/prayer-rooms` + `/mosques` dense directory metadata
The two core directory pages carry the most sub-44px targets (**116** and **83**) and `/prayer-rooms` has **109 sub-12px text nodes** — facility tags, badges, distance/category labels on listing cards. Readability + tappability suffer on the primary content. **Fix:** raise metadata font-size to ≥12px (ideally 14px) and give chips/tags ≥44px hit area.

### 3. MED — Header nav links 34px tall (all pages)
`Explore` 51×**34**, `Ask AI` 43×**34**, `Travel` 41×**34**, `Events` 44×**34**, `Tools` 35×**34**, `Pricing` 45×**34**. Below the 44px min. **Fix:** increase nav item vertical padding to hit 44px.

### 4. MED — `/mosques` FCP/LCP outlier (768ms vs 130–270ms siblings)
4–6× slower first paint than every other route on the same warm connection. Worth profiling the mosques server render / above-the-fold payload. **Next:** relaunch with `--enable react-devtools` and run `agent-browser react renders` + `vitals` to localize.

### 5. LOW — Category filter chips 37–42px
`Central 33` 106×37, mall/region chips 368×**42** — just under 44px. Small bump closes it.

### 6. LOW — Cookie consent banner overlays content
On `/prayer-rooms` the consent modal covers the "Directory snapshot" section on load. agent-browser flags it as a click-blocker (covering element). Consider a less intrusive placement or ensure it doesn't obscure primary content on first paint.

## How to reproduce

```bash
agent-browser --session audit set device "iPhone 14"
agent-browser --session audit open https://www.humblehalal.com/<route>
agent-browser --session audit eval "<mobile-probe.js>"   # overflow / tap targets / tiny text
agent-browser --session audit vitals --json               # CWV
```

Screenshots saved to `shots/audit-*-390.png` (gitignored).
