# Admin Feature-Flag Control — Design

**Date:** 2026-07-04
**Status:** approved design, ready for implementation plan
**Branch:** `feat/admin-feature-flags`

## Context & problem

Feature flags today are **env-only**: `getServerFlags()` (`lib/flags.ts`) reads `process.env.*` synchronously, and every payment/gate route calls it. Toggling a feature means editing Vercel env and redeploying.

The admin dashboard's **Monetization** section already renders on/off toggle switches, and a `platform_settings` table + `/api/settings` route exist — but for the paid flags the toggles are **client-side demo only** (localStorage via `setFlag` in app-context). Only **Ramadan mode** genuinely persists server-side: `getRamadanMode()` in `lib/platform.ts` reads `platform_settings.ramadan_mode_enabled` with an env fallback. `getServerFlags()` never reads `platform_settings`, so flipping a UI switch changes what the admin *sees*, not what real visitors *get*.

**Goal:** admin-controllable feature flags — **global** site-wide toggles for every flag, plus **per-business** overrides for owner-scoped features — persisted to the DB and honored by the real server-side gate, with no redeploy.

## Goals

- Admin flips any feature on/off from the dashboard; the change is server-persisted and takes effect without a deploy (≤~30s propagation).
- **Global default** per feature; **per-business override** for the owner-scoped subset.
- Resolution precedence: **per-business override → global (DB) → env var → off.**
- Fail-safe: if Supabase is unreachable, resolution falls back to env/off (never crashes a gate).
- Payment flags (real money) get a confirm step in the UI.

## Non-goals

- Per-business control of site-wide / consumer / payment-rail features. **Global-only:** `paynow`, `paid_hotels`, `paid_flights`, `passport`, `halal_verdicts`, `semantic_search`, `ai_concierge`, `ramadan_mode` — these have no per-business meaning (there is no "business X" when a consumer earns passport points or when PayNow is enabled account-wide).
- Real-time push / websockets. A short cache TTL (~30s) is acceptable propagation latency for an admin toggle.
- Migrating the client-side `app-context` demo toggles' UX — those keep working as a local preview; the server gate becomes the source of truth.

## Feature taxonomy

| Flag key | Global | Per-business | Notes |
|----------|:------:|:------------:|-------|
| `paidTickets` | ✅ | — | payment rail |
| `paidPlans` | ✅ | ✅ | owner-scoped capability |
| `paidAds` | ✅ | ✅ | owner self-serve ads |
| `paidHotels` / `paidFlights` | ✅ | — | payment rail |
| `payNow` | ✅ | — | payment rail |
| `certVault` | ✅ | ✅ | owner feature (also plan-gated) |
| `semanticSearch` / `aiConcierge` | ✅ | — | travel-wide |
| `leadRouting` / `paidLeads` | ✅ | ✅ | owner lead access |
| `passport` | ✅ | — | consumer loyalty |
| `halalVerdicts` | ✅ | — | admin content tool |

Per-business overrides apply to: **paidPlans, paidAds, certVault, leadRouting, paidLeads.** These are the flags whose gate already has a business context to key on. This lets the admin beta-test a feature with select businesses (global OFF, force ON for a few) or comp/restrict it per business.

## Data model

**Extend `platform_settings`** (existing single-row table, `id = 1`). Add a **nullable** boolean column per flag not already present:
`paid_hotels_enabled`, `paid_flights_enabled`, `paynow_enabled`, `cert_vault_enabled`, `semantic_search_enabled`, `ai_concierge_enabled`, `lead_routing_enabled`, `paid_leads_enabled`, `passport_enabled`, `halal_verdicts_enabled`.

Semantics: **`null` = defer to env var; `true`/`false` = admin override.** Existing flag columns (`paid_tickets_enabled`, `paid_ads_enabled`, `paid_plans_enabled`) are altered to nullable and set to `null` in the migration — they were never read by `getServerFlags()` so this preserves current (env-driven) behaviour. `ramadan_mode_enabled` keeps its existing semantics (already the source of truth via `getRamadanMode`).

**New `business_feature_overrides`** table:

```
business_id  uuid    references businesses(id) on delete cascade
feature_key  text    check (feature_key in ('paidPlans','paidAds','certVault','leadRouting','paidLeads'))
enabled      boolean not null
updated_at   timestamptz default now()
primary key (business_id, feature_key)
```

Absent row = defer to global. RLS: admin-only read/write (service-role writes via API). Index on `business_id` for the owner-scoped read.

## Resolution logic

New module `lib/feature-flags.ts` (server-only), consolidating flag resolution:

- `getGlobalOverrides(): Promise<Partial<Record<FlagKey, boolean>>>` — reads the `platform_settings` row, maps non-null flag columns to booleans. **Cached in-module, 30s TTL, busted on write** (approach A). Fail-safe: on error returns `{}` (→ env fallback).
- `getServerFlags(): Promise<Flags>` — **becomes async.** For each flag: `globalOverride[flag] ?? envTruthy(FLAG_ENV[flag])`. This is the site-wide gate every payment route uses.
- `resolveBusinessFlag(feature, businessId): Promise<boolean>` — `businessOverride ?? global ?? env ?? false`. Reads `business_feature_overrides` for that business (also cached briefly / deduped per request). Used by owner-scoped routes that already have a `businessId` in hand.

**Ripple:** `getServerFlags()` is currently synchronous and has many call sites. Making it async requires `await` at each. The implementation plan must audit and update every call site (grep `getServerFlags(`), and keep a sync env-only helper (`envFlags()`) as the ultimate fallback.

## Caching (approach A — approved)

In-module `let cache: { value; expiresAt } | null`, 30s TTL. `/api/settings` and the per-business write route call `bustFlagCache()` after a successful write. Serverless runs multiple instances, so a bust only clears the current instance; the 30s TTL bounds cross-instance staleness. Acceptable for admin toggles.

## API

- **Extend `/api/settings`** (`app/api/settings/route.ts`): widen the `ALLOWED` list to every flag column; POST writes to `platform_settings` and calls `bustFlagCache()`. Keep the existing admin-gate (`profiles.role === 'admin'`). A `null` value clears an override (reset to env default).
- **New `/api/admin/business-flags`** (POST, admin-gated): `{ businessId, feature, enabled: boolean | null }` → upsert (`enabled` boolean) or delete (`null`) a `business_feature_overrides` row; bust cache.

## UI

- **Global — admin Monetization section** (`components/screens/admin.tsx`): wire the existing demo toggles to persist through the extended `/api/settings` (mirror the working `toggleRamadan` pattern) and add the missing flags, grouped **Payments** vs **Features**. Each toggle shows on/off; a subtle "using env default" state when the stored value is `null`, and a small "reset to default" affordance. **Payment flags** (`paidTickets`, `paidAds`, `paidPlans`, `paidHotels`, `paidFlights`, `payNow`, `paidLeads`) show a confirm step ("This enables live charging — continue?").
- **Per-business — admin business detail** (`components/screens/admin.tsx` business view): a "Features" panel listing the five owner-scoped features, each a **3-state** control: **Default (global) / Force on / Force off**, writing `/api/admin/business-flags`.

## Security

- All writes admin-gated, reusing the `/api/settings` auth pattern (Clerk `userId` → `profiles.role === 'admin'`).
- `business_feature_overrides` RLS: admin-only; writes via service-role in the API route.
- Resolution fail-safe: any DB error → env/off, logged in dev only.
- Payment-flag changes are logged (reuse the existing admin audit path if present; otherwise a simple server log line).

## Testing

- **Unit** (`lib/feature-flags`): precedence matrix — business-override wins over global wins over env wins over default; `null` global defers to env; fail-safe returns env/off on thrown DB error.
- **Manual/E2E:** flip a global flag in admin → a gated route reflects it within ~30s; set a per-business override → only that business's owner-scoped route changes; unauthenticated write → 401/403.

## Rollout

- **Migration `0053_feature_flags.sql`** — `platform_settings` new nullable columns + `business_feature_overrides` table + RLS. Idempotent (`if not exists`, `add column if not exists`).
- No env changes required; existing env flags remain the fallback, so behaviour is unchanged until the admin flips something.
- Ships without a feature flag of its own (it *is* the flag system); the admin surface is already behind the admin gate.

## Open implementation notes (for the plan, not blockers)

- Audit every `getServerFlags()` call site for the sync→async change; a few are in hot payment paths — confirm they already `await` their handler.
- Confirm `platform_settings` has (or gets) its single `id=1` seed row so reads never miss.
- Decide whether per-business reads warrant their own tiny cache or per-request dedupe (default: per-request `cache()` dedupe; revisit if hot).
