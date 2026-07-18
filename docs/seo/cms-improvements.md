# Keystatic CMS — Improvement Ideas

> **Shipped — Phase 1 (CMS control & E-E-A-T):** per-post SEO overrides
> (`metaTitle`/`metaDescription`/`canonicalUrl`/`noindex`/`socialImage`, wired through
> `pageMeta()`; `noindex` also drops from the sitemap); an **Authors** collection + `Person`
> schema (`lib/blog-authors.ts`, `authorJsonLd`, resolved byline/AuthorBio — add a named author
> entry + set a post's `authorId` to upgrade from Organization to Person); and a **CI content
> validator** (`scripts/check-blog-content.mts` in `ci.yml`).
>
> **Shipped — Phase 2 (images):** AI hero generator (`scripts/gen-blog-images.mts` +
> `lib/blog-image-prompt.ts`) — fal text-to-image with hard halal guardrails → Supabase `blog-photos`
> → rewrites the entry `image:` + a governance manifest (`content/blog-image-manifest.json`). Kills the
> duplicated Unsplash hotlinks. Run `npm run gen:blog-images -- --apply` once `FAL_KEY` + Supabase creds
> are set (see `docs/seo/multichannel-runbook.md`). Phases 3–4 (distribution/OG, growth loops) below.


Grounded in the current setup: Keystatic (GitHub storage, `content/posts/*` + `content/brands/*`),
a structured `posts` schema (no rich-text body — prose lives in `sections[]`), and the new
`scheduled` status + date-gate (`lib/cms-blog.ts`). Ordered by value-to-effort.

## High value, low effort
1. **Auto-flip `scheduled → published` on go-live.** Today a live post keeps `status: scheduled`
   (the date-gate handles visibility), so the CMS list doesn't show it as "live". Extend
   `blog-publish.yml` to also commit the status change for any post whose date has passed — the
   Keystatic list then reflects reality. *(Touches: `.github/workflows/blog-publish.yml`.)*
2. **Content validation in CI.** Add `scripts/check-blog-content.mjs` (run in `ci.yml`) that fails the
   build if any `content/posts/*.yaml`: is missing a required field, uses a `category` not in
   `lib/blog-categories.ts`, has < 3 sections or < 3 FAQ, has a `datePublished` collision, or contains
   an internal link to a non-existent blog slug / route. Stops bad AI-drafted entries from merging.
3. **Related posts as a relationship, not free text.** Change `related` from `fields.array(text)` to
   `fields.array(fields.relationship({ collection: "posts" }))` so editors pick real posts and links
   can't break. *(Touches: `keystatic.config.ts`, `lib/cms-blog.ts` mapping.)*
4. **Explicit SEO fields.** Add optional `metaTitle`, `metaDescription`, `canonicalUrl` and a
   `noindex` checkbox to the `posts` schema; fall back to `title`/`dek` when empty. Gives editors
   direct control over the AI-Overview snippet. *(Touches: `keystatic.config.ts`, `app/blog/[slug]`.)*

## High value, medium effort
5. **Real image assets instead of hotlinked Unsplash.** Switch `image` from `fields.text(url)` to
   `fields.image({ directory: "public/blog", publicPath: "/blog" })`. Editors upload once; images are
   committed, versioned, and served from our own domain (better OG cards, no third-party breakage).
   The current confirmed-Unsplash-id workaround exists precisely because there's no asset field.
6. **Authors as a collection (E-E-A-T / GEO).** Replace the free-text `author` with a `authors`
   collection (name, bio, credentials, photo, links) and a relationship field, plus an optional
   `reviewedBy` and `sources[]` (citation URLs). AI engines and Google reward named, credentialed
   authors and cited authorities — directly lifts the GEO checklist in the 90-day plan.
7. **Generate scheduled entries from `postSchedule`.** A `scripts/scaffold-scheduled-posts.mjs` that,
   for each `queued` slot, writes a skeleton `content/posts/<slug>.yaml` (front-matter + empty
   sections) so editors/AI fill prose instead of recreating structure. Pairs with the drafter skill.
8. **Editorial preview.** Per-PR Vercel preview already builds; add a `?preview` param (or a
   draft-token route) so `status: draft`/`scheduled` posts render on preview only — editors see a post
   before its go-live date without publishing.

## Nice to have
9. **Calendar dashboard.** A small internal `/admin/calendar` (or a Keystatic singleton) that reads
   `postSchedule` and shows date · slug · status (queued / drafted / scheduled / live) — one glance at
   pipeline health.
10. **Slug-change redirects.** A `redirects` singleton (from → to) wired into `next.config`/middleware,
    so renaming a post doesn't 404 or lose link equity.
11. **Malay-language support.** The doa/Deen cluster is Malay-heavy; add a `language` field (en/ms) or
    paired translations so hreflang and on-page language are correct.
12. **Analytics loop.** Surface GSC impressions/clicks per post back into the CMS (read-only panel) so
    editors prioritise refreshes — the `gsc-*` Ahrefs MCP tools already provide the data.

## Suggested first PR
Items **1–4** are self-contained, low-risk, and immediately improve the scheduled-publishing workflow
we just shipped. **5–6** are the biggest quality/GEO wins and worth a dedicated follow-up.
