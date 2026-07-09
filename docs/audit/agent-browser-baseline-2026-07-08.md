# Whole-site agent-browser baseline (2026-07-08)

First full-site sweep with the new agent-browser diagnostic scripts (`browser:audit` / `browser:crawl` / `browser:perf`), 20 representative routes, **iPhone-14 (390×844)**, live prod `www.humblehalal.com`. Probes are the shared `e2e/probes.mjs` (same thresholds as the Playwright CI gate). Reports: `reports/agent-browser/{audit,crawl,perf}-2026-07-08.json` (gitignored).

> CWV are **unthrottled / warm-cache = best-case**. Trust relative deltas, not absolutes; field data comes from Lighthouse CI.

## Headline

- **No blockers:** 0 overflow, 0 primary-CTA-under-44px, 0 uncaught JS errors, 0 broken (4xx/5xx) requests, CLS 0 everywhere.
- **2 high-severity tap/zoom issues**, a broad tail of sub-44px targets, and one repeated console warning.

## Findings

### High
1. **`/mosques` — ~70 interactive elements under 24px** (WCAG 2.5.8 fail-tier via the shared probe). This is the one route that would likely **fail the Playwright mobile gate** once the harness merges. Densely-packed region/filter controls are the suspect. **Investigate + fix first.**
2. **`/tools` — 1 text input under 16px** → triggers iOS zoom-on-focus. Bump the control to ≥16px.

### Medium — sub-44px tap targets (site-wide tail)
Highest counts: `/prayer-rooms` 109, `/tools` 17, `/map` 13, `/travel/flights` 13, `/blog` 10, `/tools/inheritance` 9. Mostly dense metadata chips, tags, and footer/nav links (footer links measured 15–17px tall in the earlier audit). Batchable CSS fix (padding/line-height → ≥44px hit area).

### Low — text under 12px
Present on most routes (4–7 groups each); concentrated in listing metadata and footer. Raise to ≥12px (ideally 14px for body metadata).

### Console hygiene
- **`/map` (1×) and `/explore` (12×): "Multiple GoTrueClient instances detected in the same browser context."** The Supabase browser client is being created repeatedly (instances :1–:6+ on `/explore`) instead of reused as a singleton. Functionally harmless but a memory/perf smell — consolidate to one browser client (memoized/module-singleton). No other console errors or warnings site-wide.

## Perf (best-case, no outliers)

FCP 116–216ms, LCP ≤252ms, CLS 0 on all 20 routes; **no route exceeded 2× the median** (the earlier `/mosques` 768ms was a transient cold-cache hit, not a regression). LCP element is text (`h1`/`p`) except `/map`, `/explore`, `/blog` (images). Measurement gap: `/travel`, `/travel/flights`, `/host-event` reported no LCP element in-window (interactive/lazy pages) — re-check with interaction if perf work targets them.

## Suggested fix order

1. `/mosques` sub-24px targets (only WCAG-fail; would break the gate).
2. `/tools` sub-16px input (iOS zoom).
3. Site-wide sub-44px tail — footer + nav + directory chips (one CSS pass, biggest win on `/prayer-rooms`).
4. Supabase GoTrueClient singleton (kills the `/explore` warning spam).
5. Small-text (<12px) pass on metadata/footer.

## Reproduce

```bash
npm run browser:audit    # + browser:crawl, browser:perf
# flags: --base= --device=mobile-320|mobile-390|tablet-768 --group= --routes=
```
See `docs/agent-browser/PLAYBOOK.md`.
