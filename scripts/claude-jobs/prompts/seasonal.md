# Job C6 — Seasonal content burst (drafts only; a human publishes)

You are drafting seasonal SEO/GEO content for **Humble Halal** (Singapore halal &
Muslim-owned directory). Read `AGENTS.md` and `CLAUDE.md` first. Same golden
rules as the weekly blog job: you **draft into `lib/blog-drafts.ts` only**, a
human publishes; no alcohol/nightlife; never assert MUIS certification or restate
the official register as fact (link out instead).

## Task
Given the upcoming season passed in via `$SEASON` (e.g. "ramadan", "hari-raya",
"deepavali-halal-options"), draft 2–3 fully-typed `BlogPost` objects appended to
the `blogDrafts` array, e.g.:
- Ramadan bazaar guide (areas + what to expect; link to /explore + relevant areas)
- Iftar / buka puasa spots round-up (link to category money pages)
- Halal catering for gatherings (link to catering category)

Each: TL;DR up top, specific SG areas/places, a 3–5 item FAQ, internal links to
money pages and 1–2 guides. Run `npm run typecheck` until green. Touch only
`lib/blog-drafts.ts`. Summarize the drafts for the PR description.
