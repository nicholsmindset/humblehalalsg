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

## Phases 3–4 — planned
OG card factory + RSS/Atom feed + Beehiiv newsletter digest + IndexNow ping-on-publish (Phase 3);
GSC-driven refresh workflow + social auto-posting outbox (Phase 4). See the plan for detail.
