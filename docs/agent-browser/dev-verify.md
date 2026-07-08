# Dev-loop verification with agent-browser (MCP)

Use this whenever a change has a **runtime surface** — a page, component, form, or flow — to confirm it actually works in a real browser before committing. This is the agent-driven counterpart to the repo's `verify` discipline; the deterministic guarantees still come from Playwright + Lighthouse in CI.

The MCP server (`.mcp.json`, `core,react`) exposes typed `mcp__agent-browser__*` tools, so the agent drives the browser with approvable, structured calls — no raw shell needed.

## The loop

1. **Start the dev server** — `npm run dev` (usually `http://localhost:3000`).
2. **Open** the changed route — `agent_browser_open` with the local URL. For mobile, follow with a `set device "iPhone 14"` (the `--device` launch flag does not apply on a reused daemon — set it after launch).
3. **Seed state** if overlays get in the way — launch with `--init-script scripts/ab/seed.js` to pre-accept consent / onboarding / newsletter popup (same keys as `e2e/mobile.spec.ts`).
4. **Snapshot** — `agent_browser_snapshot` (interactive) to get stable `@eN` refs.
5. **Exercise the change** — `click` / `fill` / `find` the refs to walk the actual path the change affects.
6. **Observe** — `agent_browser_vitals` for CWV/hydration, plus a console/errors check; `agent_browser_screenshot` to eyeball layout.
7. **React introspection** when debugging hydration/renders — launch with `--enable react-devtools`, then `react tree` / `react renders` / `react suspense`.

## When to reach for it vs. the scripts

- **Verifying one change you just made** → this loop (MCP, interactive).
- **Sweeping many routes** for regressions/perf/errors → `npm run browser:audit` / `browser:perf` / `browser:crawl` (see `PLAYBOOK.md`).

## Notes

- Target **local or a preview deploy** for in-progress changes — prod won't have them, and flag/auth surfaces differ by env.
- Don't automate write/money flows against prod. Local/preview + Stripe test + LiteAPI sandbox only.
- If a click reports being blocked by a covering element (e.g. the consent banner), dismiss it or use the seed init script, then re-snapshot before retrying the ref.
