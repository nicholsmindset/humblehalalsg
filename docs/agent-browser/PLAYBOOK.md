# agent-browser — whole-site playbook

How we use [agent-browser](https://github.com/vercel-labs/agent-browser) across Humble Halal. It is the **agent-driven / diagnostic** layer — it does **not** replace the deterministic gate.

## Who owns what

| Layer | Tool | Gate? |
|---|---|---|
| Mobile regression (overflow / tap / input-zoom / axe) | Playwright `e2e/mobile.spec.ts` (+`e2e/probes.mjs`) | **Yes (CI)** |
| Prod perf budget | Lighthouse CI (`.lighthouserc.json`) | Yes (warn-mostly) |
| Deep local before/after mobile sweep | Playwright `scripts/mobile-audit.mjs` | No |
| **Dev-loop verification** | **agent-browser via MCP** | No |
| **Diagnostics Playwright lacks** (CWV/React/console/broken-links) | **agent-browser scripts** | No |

**agent-browser never becomes a CI gate** — that keeps the gate deterministic. The scripts reuse the exact probes in `e2e/probes.mjs`, so their numbers match the gate's.

## Setup (already done)

- Installed as a devDependency; `agent-browser install` fetched Chrome.
- MCP server wired in `.mcp.json` (`core,react` tools) → the `mcp__agent-browser__*` typed tools.
- Project defaults in `agent-browser.json` (headless, `./shots`, content-boundaries, max-output).
- Skill stub at `.claude/skills/agent-browser/SKILL.md` (defers to `agent-browser skills get core`).
- State-seeding init script `scripts/ab/seed.js` (consent + onboarding + popup, same keys as `e2e/mobile.spec.ts`).

Health check any time: `npm run browser:doctor`.

## On-demand diagnostic scripts

All default to prod (`https://www.humblehalal.com`), iPhone-14 viewport, and the core route set. Reports write to `reports/agent-browser/` (gitignored). Exit non-zero on hard failures so they can gate a local pre-push hook if you ever want.

```bash
npm run browser:audit     # mobile-readiness (shared probes): overflow / tap / input-zoom / small-text
npm run browser:perf      # Core Web Vitals + React hydration, flags per-route outliers
npm run browser:crawl     # uncaught JS errors + console errors + 4xx/5xx broken resources
```

Common flags (any script):

```bash
--base=http://localhost:3000     # target local dev / a preview deploy instead of prod
--device=mobile-320|mobile-390|tablet-768
--group=directory|tools|travel|events|blog|info|seasonal
--routes=/,/mosques,/prayer-rooms   # explicit list
```

Route seeds live in `scripts/ab/lib.mjs` (`ROUTE_GROUPS`), mirroring the SEO sources.

## Dev-loop verification (MCP)

When building or fixing a UI/flow, drive the browser live — see `dev-verify.md`. Short version: `open` local → `snapshot -i` → exercise the changed path → `vitals` + console → screenshot.

## Whole-site coverage map

| Surface | Routes (representative) | What we check | Phase |
|---|---|---|---|
| Directory / marketing | `/`, `/mosques`, `/prayer-rooms`, `/map`, `/is-halal`(+`[brand]`), `/halal`(+`[slug]`), `/ramadan`, `/hari-raya` | mobile probes, CWV, console | 1–2 (now) |
| Tools | `/tools` + ~19 calculators + Quran | exercise inputs, assert output (local-first) | 1–2 |
| Travel / OTA | `/travel`(+`[city]`), `/travel/hotel/[id]`, `/travel/flights`, `/travel/umrah` | read-only browse + search/filter; flag-gated | 2, booking → 4 |
| Events / ticketing | `/events`(+`[slug]`,`c/`,`in/`), `/host-event` | list/detail render + RSVP UI | 2, write → 4 |
| Blog | `/blog`(+`[slug]`,`category/[slug]`) | content render, image/LCP, broken links | 2 |
| Business / owner | `/business/[slug]`; `/owner`, poster, dashboards | public render now; owner → auth | 2 / 3 |
| Auth / dashboard / admin | `/login`, `/dashboard`, `/saved`, `/admin`(+`/analytics`) | authenticated render | 3 |

## Phases

- **P1 foundation** ✅ — shared probes on branch, seed init script, MCP dev-verify, this playbook.
- **P2 diagnostics** ✅ — `browser:audit` / `browser:perf` / `browser:crawl`, reports convention.
- **P3 authenticated read** — Clerk session via `agent-browser auth save`/`state save` (encrypted; set `AGENT_BROWSER_ENCRYPTION_KEY`, state files gitignored) → audit `/owner` `/dashboard` `/admin` `/travel/trips`; flag on/off matrix on local/preview (`lib/flags.ts`).
- **P4 (deferred)** — guarded write-flows (RSVP/checkout/booking) on **local/preview only**, Stripe **test** + LiteAPI **sandbox**, `--confirm-actions`/`--allowed-domains`; optional non-gating CI diagnostic + scheduled prod monitor.

## Guardrails

- Never run write/money flows against production — sandbox/test only.
- Auth-state files hold plaintext tokens → gitignored; set `AGENT_BROWSER_ENCRYPTION_KEY` before saving any.
- CWV numbers here are unthrottled/warm-cache = **best-case**; trust relative deltas (outliers), not absolutes. Field data comes from Lighthouse CI.
- Flag-gated + auth surfaces behave differently by env (`/admin` opens in demo mode when Clerk/Supabase env is unset). Audit a real-configured env for true gated behavior.
