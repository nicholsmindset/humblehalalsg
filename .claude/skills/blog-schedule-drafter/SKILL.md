---
name: blog-schedule-drafter
description: Draft humblehalal.com scheduled blog posts as Keystatic entries (content/posts/<slug>.yaml) from the dated plan in lib/content-calendar.ts (postSchedule). Grounded to avoid hallucination, follows the 90-day header-tag templates and GEO checklist, and matches the exact Keystatic YAML format. Use whenever drafting upcoming "queued" calendar slots into scheduled posts. Never publishes and never edits lib/blog.ts.
---

# Blog schedule drafter

Write ready-to-review **Keystatic blog entries** for humblehalal.com's dated content plan. A human
reviews/merges; you never publish and never touch `lib/blog.ts`.

## Inputs (read these first)
- `lib/content-calendar.ts` → `postSchedule` — the dated slots. Draft the ones with `status: "queued"`
  that have no `content/posts/<slug>.yaml` yet. Each row gives `publishDate`, `slug`, `title`,
  `category`, `template` (T1–T7), `primaryKeyword`, `volume`, `kd`.
- `docs/seo/content-calendar-final.md` and `docs/content-calendar-90day.md` — templates (§2), cluster
  keywords, People-Also-Ask (→ FAQ), internal-link targets.
- `docs/seo/keyword-research-v2.md` — the cannibalization guard.
- **Canonical format examples:** `content/posts/waktu-solat-singapore.yaml`,
  `content/posts/halal-food-orchard-road.yaml`, `content/posts/mediterranean-food-singapore.yaml`.
  Copy their structure exactly.

## Anti-hallucination rules (hard requirements)
1. **Never invent specifics** — no made-up restaurant/stall names, addresses, prices, opening hours,
   phone numbers, or "X is MUIS-certified" claims. If you can't verify it, don't state it.
2. Write in **verifiable generalities**: "look for the MUIS halal certificate", "the basement food
   hall has several halal options", "many outlets around Arab Street are Muslim-owned". Point readers
   to the **directory** and the **MUIS HalalSG register** to confirm current status.
3. For **"is [brand] halal"**: never assert certification — state Humble Halal's assessment framing and
   deep-link to MUIS. (Most brand checks belong in `/is-halal`, not the blog.)
4. **Religious content** (doa, prayer, zakat): give transliteration (rumi) + English meaning of
   well-established recitations only; defer to MUIS / asatizah for full Arabic, audio and rulings. Do
   not fabricate wording.
5. **Compliance:** food may be "halal"; non-food services are "Muslim-owned"/"Muslim-friendly", never
   "halal salon/barber". No alcohol, bar or nightlife content.

## Exact Keystatic YAML format
Flat file `content/posts/<slug>.yaml`. Top-level keys, in this order:
`title, status, dek, answer, author, datePublished, dateModified, readMins, category, tags, image,
imageAlt, sections, faq, related` (+ optional `dropcap`, `pullQuote`, `pullQuoteBy`, `leadVertical`).
- `status: scheduled`. `datePublished` and `dateModified`: the slot's date, unquoted `YYYY-MM-DD`.
- `category`: the slot's slug (must exist in `lib/blog-categories.ts`).
- `author: The Humble Halal Team`. `readMins`: integer 7–9.
- `image`: `https://images.unsplash.com/photo-<id>?auto=format&fit=crop&w=1200&q=70` — reuse an id
  already present in a seed file (confirmed-loading); do not invent ids.
- Use YAML block scalars (`>-`) for `answer`, every section `body` paragraph, any `bullets`/`faq`
  answer containing a colon — avoids quoting/escaping bugs.
- `sections`: 4–6 items `{ h2, body: [..], bullets?: [..], links?: [{label, href}] }`. `href` is an
  absolute `https://www.humblehalal.com/...` URL into the directory / pSEO / another blog post.
- `faq`: 4–5 items `{ q, a }` built from the slot's real People-Also-Ask questions.

## Quality bar (GEO)
- `answer` = 40–70-word answer-first TL;DR. Each H2 maps to a template keyword. FAQ = real PAA.
- ~1,500–2,000 words across sections. Link to the money/landing page for the transactional head —
  never re-target it in the post. ≥2 internal links via section `links`.

## Validate before finishing
```
npx tsx --eval "import('@keystatic/core/reader').then(async m=>{const c=(await import('./keystatic.config.ts')).default;const r=m.createReader(process.cwd(),c);const a=await r.collections.posts.all();console.log('parsed',a.length)})"
npm run typecheck
```
Every new file must parse. Then stop — the caller (or `claude-schedule.yml`) opens the PR.
