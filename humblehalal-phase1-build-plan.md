# HumbleHalal — Phase 1 Build Plan (Claude Code Tickets)

*Repo: `nicholsmindset/humblehalalsg` (branch `master`) · Stack: Next.js 16, Supabase, Stripe, Leaflet*
*Goal: Listing tiers + Halal Confidence badge + cert vault. Slots into existing schema — no greenfield rewrites.*

> Convention: each ticket = one branch + one PR. Run `npm run typecheck && npm run lint && npm test` before every PR. Schema changes go through `supabase/migrations/` (next number is `0027_`). Respect existing RLS patterns from `0017_rls_hardening.sql`.

---

## EPIC HH-1: Listing Tiers

### HH-1.1 — Tier schema & taxonomy
**Files:** `supabase/migrations/0027_listing_tiers.sql`, `lib/taxonomy.ts`, `lib/types.ts`
- New table `listing_tiers(key text pk, label, monthly_cents int, sort int, features jsonb)`.
- Seed rows: `free`, `verified`, `premium`, `spotlight`.
- Add `businesses.tier text not null default 'free'` + index.
- Backfill existing rows to `free`. Add RLS: tier readable by all, writable by admin/owner-of-business only.
**Done when:** migration applies cleanly; `check-schema.mjs` passes in CI.

### HH-1.2 — Feature gating helper
**Files:** `lib/platform.ts` (extend), new `lib/tiers.ts`
- `canUse(business, feature)` reading `listing_tiers.features` jsonb (e.g. `gallery_max`, `show_offers`, `priority_rank`, `hide_competitor_ads`).
- Unit tests in `lib/tiers.test.ts` covering each tier × feature.
**Done when:** vitest green; helper used by at least the business page.

### HH-1.3 — Gate the business profile UI
**Files:** `app/business/[slug]/page.tsx`, `components/screens/business.tsx`, `app/dashboard/page.tsx`
- Premium-only: extended gallery, offers block, "featured" ribbon, lead button.
- Owner dashboard shows current tier + locked features with upgrade CTA.
**Done when:** free listing renders gated UI; premium renders full.

### HH-1.4 — Stripe plan → tier wiring
**Files:** `app/api/checkout/plan/route.ts`, `app/api/webhooks/stripe/route.ts`, `lib/stripe.ts`
- Map Stripe price IDs → tier key. On `customer.subscription.updated/deleted`, set `businesses.tier` and upsert `subscriptions` (already exists).
- Idempotent via existing `webhook_events` ledger.
**Done when:** test-mode checkout upgrades a business; cancel downgrades to `free`.

---

## EPIC HH-2: Halal Confidence Score

### HH-2.1 — Score model
**Files:** `lib/halal-score.ts` (extend), `lib/halal-status.ts`
- Compose 0–100 from: MUIS status (weight), valid cert (weight), review avg + volume, community confirmations, freshness.
- Return `{ score, band: 'verified'|'community'|'unverified', reasons: string[] }`.
- Pure function + full unit tests (`lib/halal-score.test.ts`).
**Done when:** deterministic output for fixture businesses; reasons human-readable.

### HH-2.2 — Badge component + breakdown
**Files:** `components/halal-confidence-badge.tsx` (new), `components/seo/json-ld.tsx`
- Visual badge (band color + score) with expandable "why this score".
- Emit `Rating`/`Certification` JSON-LD for the score.
**Done when:** badge on business pages + halal pages; Lighthouse a11y ≥ 95.

### HH-2.3 — Recompute cron
**Files:** `app/api/cron/refresh-stats/route.ts` (extend) or new `app/api/cron/confidence/route.ts`, `lib/cron.ts`
- Nightly recompute; store snapshot on `businesses` (e.g. `confidence_score int`, `confidence_band text`).
**Done when:** cron writes scores; `cron_runs` logs success.

---

## EPIC HH-3: Halal Certificate Vault

### HH-3.1 — Cert schema
**Files:** `supabase/migrations/0028_cert_vault.sql`
- `halal_certs(id, business_id, issuer, cert_no, issued_on, expires_on, file_url, status check('pending','approved','rejected','expired'), created_at)`.
- Supabase Storage bucket `certs` (private) + RLS: owner upload, admin review, public sees only `status='approved'` + expiry.
**Done when:** migration + bucket policy applied.

### HH-3.2 — Owner upload flow
**Files:** `app/owner/page.tsx`, `app/api/upload/route.ts` (extend), `components/screens/business.tsx`
- Upload PDF/image, capture issuer + numbers + expiry. Premium+ feature (gate via `lib/tiers.ts`).
**Done when:** owner can upload; pending state visible.

### HH-3.3 — Admin review + expiry cron
**Files:** `app/admin/page.tsx`, `app/api/admin/verify/route.ts` (extend), `app/api/cron/recheck-certs/route.ts` (exists — extend)
- Admin approve/reject → feeds HH-2.1 score. Expiry cron flips to `expired` and notifies owner (reuse `lib/email.ts` + owner-alerts cron).
**Done when:** approval lifts confidence score; expiry downgrades it + sends alert.

---

## Sequencing
1. HH-1.1 → HH-1.2 → HH-3.1 (schema + helpers first; parallelizable after).
2. HH-2.1 → HH-2.2 (score before badge).
3. HH-1.3, HH-1.4, HH-3.2, HH-3.3, HH-2.3 (UI/integration).
4. Ship behind a `platform_settings` flag; enable per-business for a pilot cohort before GA.

## Guardrails
- Never expose private cert files publicly — only approved status + expiry.
- All money paths idempotent via `webhook_events`.
- Keep consumer experience free; gating affects business/owner surfaces only.
- Each PR updates `docs/engineering/` if it changes a runbook step.
