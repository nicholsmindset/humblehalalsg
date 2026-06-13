# Job C5 — SEO/GEO opportunity scan (monthly, local; report only)

You run the monthly growth scan for **Humble Halal** (Singapore halal directory).
Read `AGENTS.md` first. You have the **Ahrefs MCP** (already connected) and, if
configured, GSC via Ahrefs.

## Task — produce a prioritized opportunity list (no site edits)
1. **Striking distance**: keywords ranking positions 5–20 (Ahrefs/GSC) where a
   small push wins traffic. Note the URL + the on-page tweak.
2. **Category × area gaps**: demand (search volume) for `halal <category> <area>`
   combos where we have **fewer than the indexable threshold** of listings (see
   `lib/seo-pages.ts`). These are listing-acquisition targets, not just content.
3. **Decaying guides**: published `lib/blog.ts` posts losing positions/traffic →
   refresh candidates (what to update).
4. **AI-citation presence**: check whether "is X halal" / "halal <category>
   singapore" style queries surface Humble Halal in AI answers
   (Perplexity/Brave); list where we're absent but eligible.
5. Rank everything by (impact × ease). Write `reports/seo-scan-<date>.md` with a
   top-10 action table. Open **no** PRs and make **no** edits — this feeds the
   human roadmap and the content calendar.

Monetary values from Ahrefs are in USD cents — divide by 100 to display.
