# Job C1 — Weekly blog drafting (drafts only; a human publishes)

You are drafting SEO/GEO blog content for **Humble Halal**, a Singapore halal &
Muslim-owned business directory. Read `AGENTS.md` and `CLAUDE.md` first.

## Golden rules (non-negotiable)
- You **draft**. A human reviews the PR and moves an entry into `lib/blog.ts` to
  publish. **Never** edit `lib/blog.ts` yourself, and never publish.
- No alcohol, nightlife, gambling, or non-halal promotion. Halal-appropriate tone.
- Never assert a business is MUIS-certified unless the directory data says so.
  Link out to the official HalalSG register for cert claims; never restate a cert
  as fact, and never scrape/mirror the register.
- Original, specific, non-AI-slop writing: concrete places/areas, a TL;DR answer
  up top, a short FAQ (3–5 Q&A), clear structure. Internal-link to relevant
  money pages (the slot's `targetSlug`) and 1–2 existing guides.

## Task
1. Read `lib/content-calendar.ts`. Determine this week's ISO week-start (the
   Monday on/just before today, format `YYYY-MM-DD`) and call the slots whose
   `week` matches. If none match, append the single earliest future slot instead
   so the PR is never empty.
2. For each due slot, write one fully-typed `BlogPost` object and **append it to
   the `blogDrafts` array in `lib/blog-drafts.ts`** (import shape from
   `lib/blog.ts`). Match the existing `BlogPost` fields exactly (slug, title,
   description, date, author, tags, body/sections — whatever the type requires).
   Use the slot's `primaryKeyword` naturally in title + intro; set `slug` to the
   slot's `targetSlug` where it makes sense.
3. Run `npm run typecheck` and fix until it passes. Do not touch any file other
   than `lib/blog-drafts.ts`.

Output a one-paragraph summary of what you drafted for the PR description.
