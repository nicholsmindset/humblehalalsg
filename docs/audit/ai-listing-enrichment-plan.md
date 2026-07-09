# AI listing-enrichment pipeline — plan & ideas (2026-07-09)

## The problem (from the audit)

User-submitted listings are inconsistent: thin/missing descriptions, low-quality or absent images, no SEO fields. At scale this makes an otherwise-premium directory "look like junk." We want an **AI pipeline that runs on submission** (and can batch-run over the existing ~298 listings) to auto-produce: a clean description, decent imagery, and complete SEO — **without ever compromising halal accuracy or honesty**.

## Non-negotiable guardrails (halal directory = trust product)

1. **Never assert "halal certified"** unless MUIS-verified via the existing Halal-verification workflow. AI writes around certification status, never invents it. (Ties to `muis-compliance-posture`.)
2. **Never fabricate photos of food or the venue.** AI-generated *fake* dishes/interiors would mislead. Allowed image moves: enhance *real* photos, acquire *real* photos from the business's own sources, or use clearly-branded category placeholders — never synthetic "food porn" passed off as the venue.
3. **AI drafts, human approves.** Nothing AI-written auto-publishes. Reuse the existing **Listing approvals** admin gate. (Same pattern as halal verdicts: AI-drafts → human-approves.)
4. **Factual grounding only** — use submitted fields + verifiable sources; label AI-assisted content; store provenance.

## Architecture (fits the current stack)

**Trigger points** → enqueue an enrichment job (don't block the submit):
- `/add-listing`, `/claim`, admin *Add business*, and **CSV import** (the bulk case that most needs it).

**Async pipeline** (Supabase Edge Function or Vercel Function + a queue — Upstash QStash / Vercel Queues; Upstash already in the stack):

```
submit → enqueue → [1 normalize] → [2 describe] → [3 imagery] → [4 SEO+schema]
       → [5 admin review draft] → approve → publish → (optional) re-crawl refresh
```

1. **Normalize** — dedupe, geocode (existing OneMap flow), map to category/area taxonomy.
2. **Describe (text — Phase 1, cheapest, safest, highest impact)**
   - Vercel **AI Gateway** (`anthropic/claude-*`, already used by concierge/verdicts) with **structured output**: `{ tagline, description, cuisineTags[], highlights[], priceBand, goodFor[] }`.
   - Brand-voice system prompt: trustworthy, concise, no halal overclaiming, only facts present in input; blank rather than guess.
3. **Imagery** (Phase 2–3, honest-first ladder)
   - a. **Enhance real photos** — upscale/clean submitted images (`fal-upscale` / `fal-image-edit` skills).
   - b. **Acquire real photos** — **Firecrawl** the business's own website / listed socials for hero images (image enrichment was already trialled per `golive-real-data`); store source + attribution.
   - c. **Branded category placeholder** — when no real image exists, a tasteful on-brand template per category (café/restaurant/retail/mosque) with the business name — clearly not a photo of the venue.
   - d. AI-generated imagery only for **abstract/pattern** backgrounds, never depicting food/venue. Label `ai_generated`.
4. **SEO + schema (Phase 1, ships with text)**
   - Auto-fill: SEO `title`, meta `description`, `slug`, OG/Twitter tags, image `alt` text, keyword set.
   - Emit **schema.org** `LocalBusiness`/`Restaurant` (+ halal-relevant properties: `servesCuisine`, `menu`, area, price range) — plug into the existing schema route.
   - Feed the programmatic-SEO dimensions (area × category × cuisine) so new listings populate `/halal/*` and `/is-halal/*` correctly.
5. **Admin review draft** — enrichment lands as a **draft diff** in the Listing-approvals tab: original vs AI-enriched, per-field accept/reject, provenance + confidence. One-click approve → publish.

**Data model:** add an `enrichment` record per listing — `status`, `ai_fields` (which were AI-authored), `image_source` (`user|enhanced|crawled|placeholder|ai`), `model`, `confidence`, `reviewed_by`. Enables audit + selective re-runs.

## Phasing

- **Phase 1 — Text + SEO (2–3 days, highest ROI):** AI description + SEO fields + schema, admin-review-gated. No image risk, cheap tokens. **Do this first** — fixes most of the "junk" perception.
- **Phase 2 — Image enhancement:** upscale/clean real photos + branded category placeholders for the imageless.
- **Phase 3 — Real-image acquisition:** Firecrawl from business sites/socials + AI alt-text.
- **Phase 4 — Full automation + backfill:** queue-driven pipeline on every submit **+ a batch job over the existing ~298 listings** (lifts the whole directory now, not just new submits) + an admin "re-enrich" button.

## Reuse (already in the stack)

- **AI Gateway** (`AI_GATEWAY_API_KEY`) — powers concierge & verdicts today; same for descriptions/SEO.
- **Firecrawl** — image/content acquisition (skill + prior trial).
- **fal** skills — `fal-upscale`, `fal-image-edit`, `fal-generate` for imagery.
- **Upstash** — queue for async jobs.
- **Admin approval workflow** — the review gate already exists.
- **pSEO system** — `lib/seo-pages.ts`, schema route, area/category taxonomy.

## Cost & safety controls

- Batch/rate-limit AI calls; cache by content hash; only re-enrich on material change.
- Token budget per listing; structured-output schemas to avoid runaway responses.
- Every AI field is provenance-tagged and human-approved before publish.
- Kill-switch flag (reuse the admin Monetization/feature-flag pattern): `LISTING_ENRICHMENT_ENABLED`.

## Suggested next step

Ship **Phase 1** behind a flag: enrich on submit (text + SEO + schema) → admin-review draft → approve. Then batch-run it over the existing listings to instantly raise directory quality. I can turn this into a full implementation plan (files, schema migration, the enrichment function, the review-diff UI) whenever you want to build it.
