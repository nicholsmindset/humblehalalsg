# Rank Tracker setup — Humble Halal

Priority keywords to track are in [`rank-tracker-keywords.csv`](./rank-tracker-keywords.csv)
(columns: `keyword, market, cluster, target_url, volume, kd, tier`). These are the
fast-win + head terms that show whether the new SEO pages are landing.

## Why this is a manual step
The Ahrefs API / MCP **cannot create Rank Tracker projects or add keywords** — the
management endpoints are read-only (list projects, report rankings). Project creation
and keyword import are UI-only. (GSC-via-Ahrefs also needs the domain's Search Console
connected to the Ahrefs account first.)

## How to set it up (Ahrefs UI, ~5 min)
1. **Rank Tracker → New project** → add `humblehalal.com`.
2. **Two imports by market** (Ahrefs tracks one location per keyword set):
   - Filter the CSV to `market = SG` → paste those keywords, location **Singapore**.
   - Filter to `market = Global` → paste those, location **United States** (or leave
     global) — these Quran/tools/travel terms rank worldwide.
3. Set update frequency (weekly is fine pre-launch) and tag by the `cluster` column so
   you can read performance per cluster.
4. Add competitors for context (e.g. `misistr.com`, `havehalalwilltravel.com`,
   `ordinarypatrons`-style guides) under project competitors.

## Reading it later
- `tier 1` = build/rank first; watch these weekly.
- Once GSC is connected, cross-reference real query/impression data — it will beat these
  pre-launch estimates for deciding what to double down on.
- Bump/refresh the seasonal rows (`ramadan 2026`, `hari raya 2026`, `eid al fitr 2026`)
  each year alongside `SEO_YEAR`.
