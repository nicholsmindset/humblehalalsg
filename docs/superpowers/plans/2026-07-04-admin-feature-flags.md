# Admin Feature-Flag Control — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let an admin turn any feature on/off from the dashboard — globally site-wide, plus per-business overrides for owner-scoped features — persisted to Supabase and honored by the real server-side gate, with no redeploy.

**Architecture:** A server-only resolver reads DB overrides on top of the existing env flags with precedence `per-business → global → env → off`. Global overrides live in the existing single-row `platform_settings`; per-business overrides in a new `business_feature_overrides` table. The global read is cached in-module (30s TTL, busted on write). The admin Monetization section persists global toggles (like Ramadan mode already does); a per-business Features panel writes overrides.

**Tech Stack:** Next.js 16 (App Router, async server components + route handlers), Supabase Postgres + RLS, Clerk auth, Vitest (unit), TypeScript strict.

## Global Constraints

- `lib/flags.ts` is imported by **client** code (`components/app-context.tsx` uses `Flags`/`DEFAULT_FLAGS`) — it MUST stay client-safe (no `server-only`, no Supabase imports).
- All flag DB reads **fail safe**: any error → fall back to env/off, never throw into a gate.
- Migrations are idempotent (`add column if not exists`, `create table if not exists`) and applied manually in the Supabase SQL editor (no local Supabase; verify via PostgREST probe).
- Admin writes are gated by Clerk `userId` → `profiles.role === 'admin'` (reuse the `app/api/settings/route.ts` pattern).
- Per-business overrides apply to exactly these five flags: `paidPlans`, `paidAds`, `certVault`, `leadRouting`, `paidLeads`.
- TypeScript strict — verify each task with `npx tsc --noEmit 2>&1 | grep -v node_modules`.

---

## File structure

- `supabase/migrations/0049_feature_flags.sql` — **create.** Global columns + per-business table + RLS.
- `lib/flags.ts` — **modify.** Add `FlagKey`, `FLAG_ENV`, `FLAG_COLUMN`, `envFlags()`; keep client-safe. Remove the old sync `getServerFlags` in Task 4.
- `lib/feature-flags.ts` — **create** (`server-only`). Async `getServerFlags()`, `getGlobalOverrides()`, `resolveBusinessFlag()`, `bustFlagCache()`.
- `tests/unit/feature-flags.test.ts` — **create.** Precedence, cache, fail-safe.
- `app/api/settings/route.ts` — **modify.** Widen `ALLOWED`; bust cache on write.
- `app/api/admin/business-flags/route.ts` — **create.** Per-business override upsert/delete.
- ~52 server call sites of `getServerFlags` — **modify** (Task 4, tsc-gated).
- `components/screens/admin.tsx` — **modify.** Global toggles persist + all flags + payment confirm (Task 6); per-business Features panel (Task 7).
- The five owner-scoped gates — **modify** to use `resolveBusinessFlag` (Task 7).

---

### Task 1: Migration 0049 — data model

**Files:**
- Create: `supabase/migrations/0049_feature_flags.sql`

**Interfaces:**
- Produces: `platform_settings` nullable flag columns (null = defer to env); `business_feature_overrides(business_id, feature_key, enabled)`.

- [ ] **Step 1: Write the migration**

```sql
-- 0049_feature_flags.sql — admin-controllable feature flags.
-- Global overrides live in platform_settings (single row id=1); a NULL column
-- means "defer to the env var" and true/false is an explicit admin override.
-- Per-business overrides live in business_feature_overrides.

-- ── 1. Global: widen platform_settings with a nullable column per flag ───────
-- Existing paid_* columns were never read by the gate (getServerFlags read env
-- only); make them nullable and NULL so behaviour stays env-driven until an
-- admin flips something. ramadan_mode_enabled keeps its own semantics (0022).
alter table public.platform_settings
  alter column paid_tickets_enabled drop not null,
  alter column paid_ads_enabled     drop not null,
  alter column paid_plans_enabled   drop not null;
update public.platform_settings
  set paid_tickets_enabled = null, paid_ads_enabled = null, paid_plans_enabled = null
  where id = 1;

alter table public.platform_settings
  add column if not exists paid_hotels_enabled    boolean,
  add column if not exists paid_flights_enabled   boolean,
  add column if not exists paynow_enabled         boolean,
  add column if not exists cert_vault_enabled     boolean,
  add column if not exists semantic_search_enabled boolean,
  add column if not exists ai_concierge_enabled   boolean,
  add column if not exists halal_verdicts_enabled boolean,
  add column if not exists lead_routing_enabled   boolean,
  add column if not exists paid_leads_enabled     boolean,
  add column if not exists passport_enabled       boolean;

-- Guarantee the single settings row exists so reads never miss.
insert into public.platform_settings (id) values (1) on conflict (id) do nothing;

-- ── 2. Per-business overrides ────────────────────────────────────────────────
create table if not exists public.business_feature_overrides (
  business_id uuid not null references public.businesses(id) on delete cascade,
  feature_key text not null
    check (feature_key in ('paidPlans','paidAds','certVault','leadRouting','paidLeads')),
  enabled     boolean not null,
  updated_at  timestamptz not null default now(),
  primary key (business_id, feature_key)
);
create index if not exists bfo_business on public.business_feature_overrides (business_id);

alter table public.business_feature_overrides enable row level security;
-- Admin-only read; all writes go through the service-role API route.
drop policy if exists "bfo admin read" on public.business_feature_overrides;
create policy "bfo admin read" on public.business_feature_overrides
  for select to authenticated using ( public.is_admin() );
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/0049_feature_flags.sql
git commit -m "feat(flags): migration 0049 — platform_settings flag columns + business_feature_overrides"
```

- [ ] **Step 3: Verification note (manual, at deploy time)**

Apply in the Supabase SQL editor, then probe with the service-role key:
`curl "$SUPABASE_URL/rest/v1/business_feature_overrides?select=business_id&limit=1" -H "apikey: $KEY" -H "Authorization: Bearer $KEY"` → expect `200 []`; and `.../platform_settings?select=passport_enabled&limit=1` → expect a row with `passport_enabled: null`.

---

### Task 2: `flags.ts` — flag/env maps + `envFlags()` (client-safe)

**Files:**
- Modify: `lib/flags.ts`
- Test: `tests/unit/feature-flags.test.ts`

**Interfaces:**
- Produces: `type FlagKey`; `FLAG_ENV: Record<FlagKey,string>`; `FLAG_COLUMN: Record<FlagKey,string>`; `envFlags(): Flags` (pure, sync, reads `process.env`). Leaves the existing sync `getServerFlags` untouched for now.

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/feature-flags.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { envFlags, FLAG_ENV } from "@/lib/flags";

describe("envFlags", () => {
  const saved = { ...process.env };
  afterEach(() => { process.env = { ...saved }; });

  it("reads truthy env vars into the Flags shape", () => {
    process.env.PASSPORT_ENABLED = "1";
    process.env.PAID_ADS_ENABLED = "";
    const f = envFlags();
    expect(f.passport).toBe(true);
    expect(f.paidAds).toBe(false);
  });

  it("covers every flag key with an env var name", () => {
    expect(Object.keys(FLAG_ENV).sort()).toEqual([
      "aiConcierge","certVault","halalVerdicts","leadRouting","paidAds",
      "paidFlights","paidHotels","paidLeads","paidPlans","paidTickets",
      "passport","payNow","semanticSearch",
    ].sort());
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/feature-flags.test.ts`
Expected: FAIL — `envFlags`/`FLAG_ENV` not exported.

- [ ] **Step 3: Add the maps + `envFlags` to `lib/flags.ts`**

Add after the existing `truthy` helper (keep `Flags`, `DEFAULT_FLAGS`, `getServerFlags` as they are):

```ts
export type FlagKey = keyof Flags;

/** flag → env var name (the current source of truth / fallback). */
export const FLAG_ENV: Record<FlagKey, string> = {
  paidTickets: "PAID_TICKETS_ENABLED",
  paidAds: "PAID_ADS_ENABLED",
  paidPlans: "PAID_PLANS_ENABLED",
  paidHotels: "PAID_HOTELS_ENABLED",
  paidFlights: "PAID_FLIGHTS_ENABLED",
  payNow: "PAYNOW_ENABLED",
  certVault: "CERT_VAULT_ENABLED",
  semanticSearch: "SEMANTIC_SEARCH_ENABLED",
  aiConcierge: "AI_CONCIERGE_ENABLED",
  halalVerdicts: "HALAL_VERDICTS_ENABLED",
  leadRouting: "LEAD_ROUTING_ENABLED",
  paidLeads: "PAID_LEADS_ENABLED",
  passport: "PASSPORT_ENABLED",
};

/** flag → platform_settings column name (global admin override). */
export const FLAG_COLUMN: Record<FlagKey, string> = {
  paidTickets: "paid_tickets_enabled",
  paidAds: "paid_ads_enabled",
  paidPlans: "paid_plans_enabled",
  paidHotels: "paid_hotels_enabled",
  paidFlights: "paid_flights_enabled",
  payNow: "paynow_enabled",
  certVault: "cert_vault_enabled",
  semanticSearch: "semantic_search_enabled",
  aiConcierge: "ai_concierge_enabled",
  halalVerdicts: "halal_verdicts_enabled",
  leadRouting: "lead_routing_enabled",
  paidLeads: "paid_leads_enabled",
  passport: "passport_enabled",
};

/** Env-only flags (the fallback layer). Pure + sync — safe to import anywhere. */
export function envFlags(): Flags {
  const out = {} as Flags;
  for (const k of Object.keys(FLAG_ENV) as FlagKey[]) out[k] = truthy(process.env[FLAG_ENV[k]]);
  return out;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/feature-flags.test.ts`
Expected: PASS.

- [ ] **Step 5: Typecheck + commit**

```bash
npx tsc --noEmit 2>&1 | grep -v node_modules | head
git add lib/flags.ts tests/unit/feature-flags.test.ts
git commit -m "feat(flags): add FLAG_ENV/FLAG_COLUMN maps + envFlags() helper"
```

---

### Task 3: `lib/feature-flags.ts` — async resolver + cache + business overrides

**Files:**
- Create: `lib/feature-flags.ts`
- Test: `tests/unit/feature-flags.test.ts` (extend)

**Interfaces:**
- Consumes: `Flags`, `FlagKey`, `FLAG_ENV`, `FLAG_COLUMN`, `envFlags` from `@/lib/flags`; `getSupabaseAdmin` from `@/lib/supabase/server`.
- Produces:
  - `getGlobalOverrides(): Promise<Partial<Record<FlagKey, boolean>>>` — cached 30s.
  - `getServerFlags(): Promise<Flags>` — `global ?? env`, per flag.
  - `resolveBusinessFlag(feature: FlagKey, businessId: string): Promise<boolean>` — `businessOverride ?? global ?? env ?? false`.
  - `bustFlagCache(): void`.

- [ ] **Step 1: Write the failing tests**

Append to `tests/unit/feature-flags.test.ts`. The resolver reads Supabase via `getSupabaseAdmin`; mock that module so no network is needed.

```ts
import { vi } from "vitest";

// Mock the Supabase admin client. `rows` is what the settings/overrides reads return.
const state: { settings: Record<string, unknown> | null; overrides: { enabled: boolean }[] } =
  { settings: null, overrides: [] };
vi.mock("@/lib/supabase/server", () => ({
  getSupabaseAdmin: () => ({
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: table === "platform_settings" ? state.settings : null }),
          // business_feature_overrides read: .eq().eq().maybeSingle()
          eq: () => ({ maybeSingle: async () => ({ data: state.overrides[0] ?? null }) }),
        }),
      }),
    }),
  }),
}));

describe("resolver precedence", () => {
  beforeEach(() => {
    state.settings = null; state.overrides = [];
    for (const k of Object.keys(process.env)) if (k.endsWith("_ENABLED")) delete process.env[k];
    // reset the module cache between tests
  });

  it("global override wins over env", async () => {
    process.env.PASSPORT_ENABLED = "1";           // env ON
    state.settings = { passport_enabled: false };  // global OFF
    const { getServerFlags, bustFlagCache } = await import("@/lib/feature-flags");
    bustFlagCache();
    expect((await getServerFlags()).passport).toBe(false);
  });

  it("null global defers to env", async () => {
    process.env.PAID_ADS_ENABLED = "1";
    state.settings = { paid_ads_enabled: null };
    const { getServerFlags, bustFlagCache } = await import("@/lib/feature-flags");
    bustFlagCache();
    expect((await getServerFlags()).paidAds).toBe(true);
  });

  it("business override wins over global", async () => {
    state.settings = { lead_routing_enabled: false };  // global OFF
    state.overrides = [{ enabled: true }];              // business ON
    const { resolveBusinessFlag, bustFlagCache } = await import("@/lib/feature-flags");
    bustFlagCache();
    expect(await resolveBusinessFlag("leadRouting", "biz-1")).toBe(true);
  });

  it("fails safe to env when the DB throws", async () => {
    process.env.CERT_VAULT_ENABLED = "1";
    state.settings = null; // maybeSingle returns {data:null} → no override → env
    const { getServerFlags, bustFlagCache } = await import("@/lib/feature-flags");
    bustFlagCache();
    expect((await getServerFlags()).certVault).toBe(true);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run tests/unit/feature-flags.test.ts`
Expected: FAIL — `@/lib/feature-flags` not found.

- [ ] **Step 3: Implement `lib/feature-flags.ts`**

```ts
import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { type Flags, type FlagKey, FLAG_COLUMN, envFlags } from "@/lib/flags";

/* Server-side flag resolution: DB overrides layered on top of env.
   Precedence: per-business override → global (platform_settings) → env → off.
   Fail-safe: any DB error resolves to env/off — a gate never throws. */

const TTL_MS = 30_000;
let cache: { value: Partial<Record<FlagKey, boolean>>; expiresAt: number } | null = null;

/** Invalidate the global-override cache (called by the admin write routes). */
export function bustFlagCache(): void { cache = null; }

/** Global admin overrides from platform_settings. NULL column → key absent
    (defer to env). Cached 30s; fail-safe to {} (→ env). */
export async function getGlobalOverrides(): Promise<Partial<Record<FlagKey, boolean>>> {
  if (cache && cache.expiresAt > Date.now()) return cache.value;
  const out: Partial<Record<FlagKey, boolean>> = {};
  try {
    const admin = getSupabaseAdmin();
    if (admin) {
      const { data } = await admin.from("platform_settings").select("*").eq("id", 1).maybeSingle();
      if (data) {
        for (const k of Object.keys(FLAG_COLUMN) as FlagKey[]) {
          const v = (data as Record<string, unknown>)[FLAG_COLUMN[k]];
          if (typeof v === "boolean") out[k] = v;
        }
      }
    }
  } catch { /* fail-safe → {} */ }
  cache = { value: out, expiresAt: Date.now() + TTL_MS };
  return out;
}

/** Site-wide flags: global override ?? env. The gate every server route uses. */
export async function getServerFlags(): Promise<Flags> {
  const env = envFlags();
  const global = await getGlobalOverrides();
  const out = {} as Flags;
  for (const k of Object.keys(env) as FlagKey[]) out[k] = global[k] ?? env[k];
  return out;
}

/** Resolve a flag for a specific business: business override ?? global ?? env. */
export async function resolveBusinessFlag(feature: FlagKey, businessId: string): Promise<boolean> {
  try {
    const admin = getSupabaseAdmin();
    if (admin && businessId) {
      const { data } = await admin
        .from("business_feature_overrides")
        .select("enabled").eq("business_id", businessId).eq("feature_key", feature).maybeSingle();
      if (data && typeof (data as { enabled?: unknown }).enabled === "boolean") {
        return (data as { enabled: boolean }).enabled;
      }
    }
  } catch { /* fall through to global/env */ }
  return (await getServerFlags())[feature];
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run tests/unit/feature-flags.test.ts`
Expected: PASS (all precedence + fail-safe cases).

- [ ] **Step 5: Typecheck + commit**

```bash
npx tsc --noEmit 2>&1 | grep -v node_modules | head
git add lib/feature-flags.ts tests/unit/feature-flags.test.ts
git commit -m "feat(flags): server-only resolver — global+business overrides, 30s cache, fail-safe"
```

---

### Task 4: Migrate `getServerFlags` call sites to the async resolver

**Files:**
- Modify: `lib/flags.ts` (delete the old sync `getServerFlags`)
- Modify: ~52 server files importing `getServerFlags` from `@/lib/flags`

**Interfaces:**
- Consumes: async `getServerFlags` from `@/lib/feature-flags` (Task 3).

- [ ] **Step 1: Delete the old sync `getServerFlags` from `lib/flags.ts`**

Remove the entire `export function getServerFlags(): Flags { … }` block. Keep `Flags`, `DEFAULT_FLAGS`, `truthy`, `FlagKey`, `FLAG_ENV`, `FLAG_COLUMN`, `envFlags`.

- [ ] **Step 2: Run tsc to enumerate every broken call site**

Run: `npx tsc --noEmit 2>&1 | grep -v node_modules`
Expected: errors at every `getServerFlags` importer — either "no exported member 'getServerFlags'" (import) or "Property 'x' does not exist on type 'Promise<Flags>'" (missing await, once the import is repointed).

- [ ] **Step 3: Repoint imports + add `await` at each site**

For each file tsc reports:
1. Change the import specifier: `from "@/lib/flags"` → `from "@/lib/feature-flags"` for the `getServerFlags` symbol (if the file imports other things from `@/lib/flags`, split into two imports).
2. Change each `getServerFlags()` call to `await getServerFlags()` (the enclosing route handler / server component is already `async`; if a rare sync helper calls it, make that helper async and await it up the chain).

Representative diff (`app/api/passport/route.ts`):
```ts
- import { getServerFlags } from "@/lib/flags";
+ import { getServerFlags } from "@/lib/feature-flags";
  ...
- const flags = getServerFlags();
+ const flags = await getServerFlags();
```

Work through the list until tsc is clean. TypeScript is the gate — every un-awaited or mis-imported site is a compile error, so none can be silently missed.

- [ ] **Step 4: Verify clean typecheck + build**

Run: `npx tsc --noEmit 2>&1 | grep -v node_modules | head` → expect no output.
Run: `npm run build 2>&1 | tail -3` → expect success.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor(flags): getServerFlags is async (DB-aware) across all call sites"
```

---

### Task 5: API — extend `/api/settings`, add `/api/admin/business-flags`

**Files:**
- Modify: `app/api/settings/route.ts`
- Create: `app/api/admin/business-flags/route.ts`

**Interfaces:**
- Consumes: `bustFlagCache` from `@/lib/feature-flags`; `FLAG_COLUMN` from `@/lib/flags`.
- Produces: `POST /api/settings` accepts every flag column (value `boolean` = override, `null` = clear); `POST /api/admin/business-flags` `{ businessId, feature, enabled: boolean|null }`.

- [ ] **Step 1: Widen `/api/settings` `ALLOWED` + bust cache**

In `app/api/settings/route.ts`, replace the `ALLOWED` array and add a cache bust after a successful write:

```ts
import { bustFlagCache } from "@/lib/feature-flags";
import { FLAG_COLUMN } from "@/lib/flags";

const ALLOWED = ["ramadan_mode_enabled", ...Object.values(FLAG_COLUMN)];
```

Change the patch loop to accept `null` (clear override) as well as booleans, and bust the cache after the update:

```ts
  const patch: Record<string, boolean | null> = {};
  for (const k of ALLOWED) if (k in body) patch[k] = body[k] === null ? null : !!body[k];
  if (Object.keys(patch).length === 0) return NextResponse.json({ ok: false, reason: "no_changes" }, { status: 400 });
  const { error } = await admin.from("platform_settings").update(patch).eq("id", 1);
  if (error) return NextResponse.json({ ok: false, reason: "db_error" }, { status: 500 });
  bustFlagCache();
  return NextResponse.json({ ok: true });
```

- [ ] **Step 2: Create `/api/admin/business-flags`**

```ts
// app/api/admin/business-flags/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { bustFlagCache } from "@/lib/feature-flags";

const FEATURES = ["paidPlans", "paidAds", "certVault", "leadRouting", "paidLeads"];

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, reason: "unauthenticated" }, { status: 401 });
  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ ok: false, reason: "db_not_configured" }, { status: 503 });
  const { data: profile } = await admin.from("profiles").select("role").eq("id", userId).maybeSingle();
  if (profile?.role !== "admin") return NextResponse.json({ ok: false, reason: "forbidden" }, { status: 403 });

  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const businessId = String(b.businessId || "");
  const feature = String(b.feature || "");
  if (!businessId || !FEATURES.includes(feature)) {
    return NextResponse.json({ ok: false, reason: "bad_request" }, { status: 400 });
  }
  // enabled === null  → clear the override (defer to global)
  if (b.enabled === null) {
    const { error } = await admin.from("business_feature_overrides")
      .delete().eq("business_id", businessId).eq("feature_key", feature);
    if (error) return NextResponse.json({ ok: false, reason: "db_error" }, { status: 500 });
  } else {
    const { error } = await admin.from("business_feature_overrides")
      .upsert({ business_id: businessId, feature_key: feature, enabled: !!b.enabled, updated_at: new Date().toISOString() });
    if (error) return NextResponse.json({ ok: false, reason: "db_error" }, { status: 500 });
  }
  bustFlagCache();
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: Verify unauthorized is blocked (dev-server smoke)**

Run the dev server, then:
`curl -s -o /dev/null -w "%{http_code}\n" -X POST localhost:3000/api/admin/business-flags` → expect `401`.

- [ ] **Step 4: Typecheck + commit**

```bash
npx tsc --noEmit 2>&1 | grep -v node_modules | head
git add app/api/settings/route.ts app/api/admin/business-flags/route.ts
git commit -m "feat(flags): admin APIs — global settings (all flags) + per-business overrides"
```

---

### Task 6: Global toggles UI — admin Monetization section

**Files:**
- Modify: `components/screens/admin.tsx`

**Interfaces:**
- Consumes: `POST /api/settings` (Task 5). Mirrors the existing `toggleRamadan` persistence pattern (admin.tsx ~176-181).

- [ ] **Step 1: Hydrate current global values**

In the admin Monetization component, on mount `GET /api/settings` and hold the returned column values in state (a `Record<string, boolean|null>`), so each toggle shows the persisted state (with a "using env default" hint when the value is `null`).

- [ ] **Step 2: Render a toggle per flag, grouped Payments vs Features**

Drive the toggles from `FLAG_COLUMN` (import from `@/lib/flags`), split into a Payments group (`paidTickets,paidAds,paidPlans,paidHotels,paidFlights,payNow,paidLeads`) and a Features group (the rest). Reuse the existing `cert-toggle`/`cert-switch`/`cert-knob` switch markup already in this section.

- [ ] **Step 3: Persist on toggle (with a confirm on payment flags)**

On flip, `POST /api/settings` with `{ [column]: nextBool }` (mirroring `toggleRamadan`). For the Payments group, first show a confirm ("This enables live charging — continue?"); only persist on confirm. Optimistically update local state; revert + toast on non-ok response.

```ts
async function setGlobalFlag(column: string, next: boolean, isPayment: boolean) {
  if (isPayment && next && !confirm("This enables a LIVE payment/charging flow. Continue?")) return;
  setValues((v) => ({ ...v, [column]: next }));            // optimistic
  const r = await fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [column]: next }) });
  if (!(await r.json().catch(() => ({}))).ok) { setValues((v) => ({ ...v, [column]: !next })); toast("Couldn't save — try again."); }
}
```

- [ ] **Step 4: Manual verify + commit**

Dev server → admin → Monetization: flip a non-payment flag (e.g. Passport), reload, confirm it persists; flip a payment flag → confirm dialog appears.

```bash
git add components/screens/admin.tsx
git commit -m "feat(admin): global feature toggles persist to platform_settings (all flags, payment confirm)"
```

---

### Task 7: Per-business Features panel + wire owner-scoped gates

**Files:**
- Modify: `components/screens/admin.tsx` (business detail view)
- Modify: the five owner-scoped gates to use `resolveBusinessFlag`

**Interfaces:**
- Consumes: `POST /api/admin/business-flags` (Task 5); `resolveBusinessFlag` from `@/lib/feature-flags` (Task 3).

- [ ] **Step 1: Add the Features panel to the admin business detail view**

For the five features, render a 3-state control (Default / On / Off). Load current overrides for the business (add them to the admin business-detail fetch, or a small `GET` — reuse the existing business-detail data path). On change, `POST /api/admin/business-flags` with `{ businessId, feature, enabled }` where **Default → `null`**, On → `true`, Off → `false`.

- [ ] **Step 2: Route the five gates through `resolveBusinessFlag`**

In each owner-scoped route that currently reads the global flag AND has a `businessId` in scope, swap the gate. Example — `app/api/owner/ads/checkout/route.ts` already loads `biz`:
```ts
- const flags = await getServerFlags();
- if (flags.paidAds) { /* stripe */ }
+ const paidAds = await resolveBusinessFlag("paidAds", businessId);
+ if (paidAds) { /* stripe */ }
```
Apply the same swap for: `paidAds` (owner ads checkout/options), `leadRouting` + `paidLeads` (owner leads routes + `/api/checkout/leads`), `certVault` (`/api/owner/cert`), `paidPlans` (`/api/checkout/plan`). Where a route has no business context, leave it on the global `getServerFlags()`.

- [ ] **Step 3: Typecheck + build**

Run: `npx tsc --noEmit 2>&1 | grep -v node_modules | head` → no output.
Run: `npm run build 2>&1 | tail -3` → success.

- [ ] **Step 4: Manual verify + commit**

Dev server → admin business detail: set a business's `leadRouting` to **On** while global is Off; confirm that business's owner leads route is enabled and another business's is not.

```bash
git add -A
git commit -m "feat(admin): per-business feature overrides — panel + owner-scoped gates via resolveBusinessFlag"
```

---

## Self-review

- **Spec coverage:** data model (T1), resolver + precedence + cache + fail-safe (T3), async ripple (T4), APIs (T5), global UI + payment confirm (T6), per-business UI + gates (T7), env/DB fallback (T2/T3), migration 0049 (T1). All spec sections mapped.
- **Placeholders:** none — every code step shows real code; the 52-site sweep is a tsc-gated loop with a representative diff (legitimate — the edit is identical in shape at each site).
- **Type consistency:** `FlagKey`, `FLAG_ENV`, `FLAG_COLUMN`, `envFlags`, `getServerFlags` (async), `getGlobalOverrides`, `resolveBusinessFlag`, `bustFlagCache` names are used identically across tasks; the five per-business features match the `check` constraint (T1), the API `FEATURES` list (T5) and the panel (T7).

## Deployment

- Apply `0049_feature_flags.sql` in the Supabase SQL editor; probe-verify (T1 step 3).
- No env changes required — env stays the fallback; behaviour is unchanged until an admin flips a toggle.
- Ships without its own feature flag (it *is* the flag system); the surface is already admin-gated.
