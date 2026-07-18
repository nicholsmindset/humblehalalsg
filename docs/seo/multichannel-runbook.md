# Multi-channel CMS — Runbook

How to operate the CMS-as-content-engine pieces. Built in phases (see
`docs/seo/cms-improvements.md` for the roadmap). Everything **fails soft** without its keys.

## Phase 2 — Blog hero images (AI-generated, governed)

Replaces hotlinked/duplicated Unsplash blog heroes with unique, on-brand images re-hosted to Supabase.

**Pipeline:** `scripts/gen-blog-images.mts` → fal text-to-image (prompt from
`lib/blog-image-prompt.ts`, brand palette + hard halal guardrails) → optional fal upscale → upload to
the Supabase `blog-photos` bucket → rewrite the entry's `image:` line → record `content/blog-image-manifest.json`.

**Commands**
```
npm run gen:blog-images -- --check            # list posts still on hotlinked Unsplash
npm run gen:blog-images                        # dry-run: what it would generate + a sample prompt
npm run gen:blog-images -- --apply             # generate + re-host + rewrite (needs keys)
npm run gen:blog-images -- --apply --slug=<slug> --limit=1   # one post, e.g. a test
```

**Env (set in `.env.local` or the environment):**
- `FAL_KEY` — fal.ai (already used for listing upscales).
- `FAL_IMAGE_MODEL` — optional, default `fal-ai/flux/schnell`.
- `FAL_UPSCALE_MODEL` — optional; if set, upscales after generation.
- `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` — to create/upload to the `blog-photos` bucket.

**Guarantees**
- **Guardrails baked into every prompt:** no text/logos, no alcohol/nightlife, no pork, and for
  Deen/prayer topics no faces of people praying and no Quran/scripture text or calligraphy.
- **Governance:** each generated image is logged in `content/blog-image-manifest.json`
  (`slug, prompt, model, source:"ai-fal", url, rightsConfirmed:true`) — a committed audit trail. (The
  business `photos` table is business-coupled and intentionally not reused for blog.)
- **Idempotent/resumable:** skips posts already on Supabase or `/blog` local paths.
- Serving: Supabase URLs are already an allowed `next.config.ts` remote host and are served
  unoptimized via `lib/img.ts` (matches the Vercel-402 decision).

**Current state:** the 19 scheduled Keystatic posts are still on Unsplash. Run `--apply` once `FAL_KEY`
+ Supabase service creds are set to backfill them; review the images, then commit the rewritten YAML +
manifest.

**Deferred:** a Keystatic `fields.image` upload field (editor uploads) — the text `image` field + this
generator cover the core win for now.

## Phase 1 — recap (shipped)
Per-post SEO overrides (`metaTitle`/`metaDescription`/`canonicalUrl`/`noindex`/`socialImage`), Authors
collection + `Person` schema, and the `check:content` CI validator. See `docs/seo/cms-improvements.md`.

## Phase 3 — Distribution + OG cards (shipped)

- **RSS feed** at `/blog/feed.xml` (RSS 2.0, live posts only, hero enclosures). Discoverable via
  `<link rel="alternate" type="application/rss+xml">` in every page head.
  - **Newsletter (primary):** point **Beehiiv's RSS-to-email** automation at
    `https://www.humblehalal.com/blog/feed.xml` — no code, sends each new post automatically.
- **OG card factory:** shared `components/og/card.tsx`; `/blog/[slug]/opengraph-image` renders a
  branded card. Posts default to their hero photo for social; pin the card (or any image) per-post via
  the `socialImage` override. Reuse `OgCard` for is-halal/pSEO cards next.
- **Newsletter digest (cron):** `app/api/cron/weekly-digest` assembles new guides (last 7 days) +
  newest listings and calls `beehiivBroadcast()`. Direct-send is optional: set `BEEHIIV_BROADCAST_URL`
  (a Beehiiv automation trigger / Zapier / custom sender) + `BEEHIIV_API_KEY`; else it simulates + logs.
- **IndexNow ping-on-publish:** `lib/indexnow.ts` + `/api/cron/indexnow` submit the day's newly-live
  URLs to Bing/Yandex. The daily `blog-publish.yml` curls it after deploy (needs `CRON_SECRET`). Set
  `INDEXNOW_KEY` to activate (verified via `/indexnow-key.txt`); else it no-ops.

**Env to activate:** `BEEHIIV_BROADCAST_URL` (+ `BEEHIIV_API_KEY`) for direct digest send, `INDEXNOW_KEY`
for fast indexing, `CRON_SECRET` for the workflow ping. All degrade gracefully when unset.

## Phase 4 — Growth loops (shipped)

- **SEO/GEO scan workflow:** `.github/workflows/claude-seo-scan.yml` (monthly + dispatch, gated on
  `CLAUDE_JOBS_ENABLED` + `ANTHROPIC_API_KEY`) runs the **report-only** `seo-scan.md` and opens a PR
  with `reports/`. Feeds the roadmap/content calendar — makes no edits. Needs the **Ahrefs MCP** on the
  runner for real data (hosted runners lack it → run on a connected/self-hosted runner or interactively).
- **Social auto-posting outbox (approval-gated):** `supabase/migrations/0077_social_outbox.sql` +
  `lib/social-outbox.ts`. `/api/cron/social-enqueue` queues each day's newly-live post as
  **`pending_approval`** (caption from the post, image = its OG card); a human flips rows to
  `approved`; `/api/cron/social-dispatch` (every 6h) POSTs approved rows to `SOCIAL_WEBHOOK_URL`
  (Buffer/Meta/custom) and marks them sent. **Never auto-posts** — unapproved rows are never sent.
  Both crons registered in `vercel.json`.

**Env to activate:** `SOCIAL_WEBHOOK_URL` (+ optional `SOCIAL_WEBHOOK_SECRET`) for social sends; apply
migration `0077`. Approve rows in the `social_outbox` table (or a future admin view). No keys → the
outbox still queues + logs but dispatch no-ops.
