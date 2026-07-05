-- 0053_feature_flags.sql — admin-controllable feature flags.
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
