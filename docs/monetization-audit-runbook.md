# Monetization audit runbook

The reference doc from the enterprise deep-audit (16 flagged features × 8 layers).
Pairs with `migration-ledger.md`, `payment-go-live-checklist.md`,
`audit-guided-admin-pass.md`, and `scripts/audit-negative-paths.mjs`.

## Feature-flag system (how a flag actually resolves)

- **Definition:** `lib/flags.ts` — `FLAG_ENV` (flag → env var) + `FLAG_COLUMN`
  (flag → `platform_settings` column).
- **Resolution:** `lib/feature-flags.ts` `getServerFlags()` = **global DB override
  ?? env ?? off** (30s cache). `resolveBusinessFlag(flag, businessId)` =
  **per-business override ?? global ?? env** (only `paidAds`, `certVault`,
  `paidLeads` have per-business overrides).
- **⚠️ Footgun:** an explicit DB `false` **beats** an env `true` — only a NULL
  column defers to env. This silently disabled a live feature once (TikTok). The
  admin Monetization tab (PR #202) now shows env / override / resolved per row
  and has **Reset to env** (writes NULL). Rule of thumb: if "env says on but the
  feature is off", check `platform_settings` for a stale `false`.
- **Client exposure:** `app/layout.tsx` seeds flags into context + `/api/flags`
  refetch after mount. The client flag only controls what's SHOWN; every
  state-changing route re-checks server-side.

## Migrations

See `migration-ledger.md`. Numbering policy: **next new migration = the highest
number in the ledger + 1** (currently 0061). Applied by pasting SQL into the
Supabase editor — no auto-tracking, so the ledger is the source of truth.
Outstanding to paste: **0060** (tiktok anon-leak fix). Prod is ahead of the repo
on passport 0049–0051 (schema for the parked v2; the repo files live on PR #145).

## Scheduler map (three ways crons fire)

| Job | GitHub Action | pg_cron | Vercel cron | Notes |
|---|---|---|---|---|
| flight-retry | `.github/workflows/flight-retry.yml` (*/10) | migration 0032 (*/10) | `vercel.json` (daily) | triple-redundant. GH secret `CRON_SECRET` must be set or every run 401s. Candidate: drop pg_cron. |
| others (payouts, stats, certs, hawker-sync, fare-alerts, lead-retention) | — | — | `vercel.json` | all guarded by `authorizeCron` (fail-closed in prod without `CRON_SECRET`). |

## Env matrix (what each flag needs to actually work)

All feature flags default OFF. Beyond the flag itself:
- `aiConcierge`, `halalVerdicts`, `listingEnrichment`, `tiktokUgc` → `AI_GATEWAY_API_KEY`.
- `listingEnrichment` images → `FIRECRAWL_API_KEY`, `FAL_KEY`.
- `hawkerFinder` NEA sync → `HAWKER_NEA_RESOURCE_ID`.
- `semanticSearch`, `paidHotels`, `paidFlights` → LiteAPI (`LITEAPI_ENV` + key).
- All paid flags → `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` (+ price IDs for plans/leads).
- Newsletter → `BEEHIIV_API_KEY` + `BEEHIIV_PUBLICATION_ID` (else opt-ins simulate).
- Crons → `CRON_SECRET` (Vercel env AND GitHub repo secret).
- Rate limiting → `UPSTASH_REDIS_REST_URL`/`_TOKEN` (fails open).
See `.env.example` for the full annotated list.

## What the audit found + shipped (2026-07-11)

43 findings across 16 features. Fixes merged: **#204** JSON-LD stored-XSS escape
(P1, owner-reachable via listing description; site-wide) · **#205/0060** close
tiktok_submissions anon PII leak · **#206** complete the aiConcierge kill-switch
across travel AI routes · **#207** webhook order-error + PayNow settle guards +
`payment-go-live-checklist.md` · **#208** passport stats cap, expired-cert grant
block, hawker sitemap · **#209** passport clarity (dual-audience help + owner
QR-poster card, semantic/cert copy-drift) · **#210** award review points on
approval not submission.

Money-dark hardening (founding cap, ticket idempotency, PayNow async, ads
oversell, …) is staged in `payment-go-live-checklist.md`, gated per flag.

## Accepted / deferred (documented, not fixed)

- `tiktokUgc-02` — `/api/tiktok/remove` is unauthenticated **by design** (creator
  opt-out without an account); rate-limited + reversible by admin re-approval.
- `leadRouting-02` — P3, only an owner's own lead, only bites once `paidLeads` is
  live → in the go-live checklist.
- Admin-action flag-gating (`halalVerdicts-02`, `listingEnrich-01`,
  `tiktokUgc-03`) — the write path ignores the flag, but it's admin-only and the
  public surface is already flag-gated; verifier down-ranked to P3.
- `halalVerdicts-04` (verdict sitemap), `hawker-02` (NEA cron region NULL),
  `listingEnrich-02`, `semanticSearch-03` — minor, tracked.

## Re-running the audit

- `node scripts/audit-negative-paths.mjs` — public/anon regression (15 checks).
- `docs/audit-guided-admin-pass.md` — the admin-session checks (human).
- The full fan-out (`Workflow` monetization-feature-audit) can be re-run for a
  fresh pass; per-feature dossiers regenerate from the 16 auditors.
