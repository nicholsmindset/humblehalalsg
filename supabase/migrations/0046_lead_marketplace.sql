-- Humble Halal — Lead Marketplace (shared-lead routing + lead subscriptions).
-- Consumers request quotes for high-ticket verticals; each lead is routed to up
-- to LEAD_ROUTE_CAP (5) matching claimed businesses (Bark/Thumbtack model).
-- Businesses pay a monthly Stripe subscription with a lead quota to accept them.
--
-- Writes go through the service-role key (app/api/*). Direct table reads are
-- admin-only (is_admin(), 0010); owners read via /api/owner/leads because PII
-- masking is per-row conditional and can't be expressed as column RLS.
-- Run after 0045.

-- ── 1. Extend leads: marketplace context, consent, routing state ─────────────
alter table public.leads
  add column if not exists vertical_id text,
  add column if not exists source_listing_slug text,
  add column if not exists source_path text,
  add column if not exists consent_contact boolean not null default false,
  add column if not exists consent_version text,
  add column if not exists consented_at timestamptz,
  add column if not exists routed_at timestamptz,
  add column if not exists anonymized_at timestamptz;

-- Widen the status ladder (was new/contacted/closed/spam).
alter table public.leads drop constraint if exists leads_status_check;
alter table public.leads add constraint leads_status_check
  check (status in ('new','reviewing','routed','contacted','closed','spam'));

create index if not exists leads_status_created on public.leads (status, created_at desc);
create index if not exists leads_vertical on public.leads (vertical_id);

-- ── 2. lead_routes: a routed share of a lead to one business ─────────────────
create table if not exists public.lead_routes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  status text not null default 'sent'
    check (status in ('sent','viewed','accepted','contacted','won','lost','expired')),
  quota_consumed boolean not null default false,   -- true when acceptance burned a paid credit
  sent_at timestamptz not null default now(),
  viewed_at timestamptz,
  accepted_at timestamptz,
  outcome_at timestamptz,
  unique (lead_id, business_id)
);
create index if not exists lead_routes_biz on public.lead_routes (business_id, status, sent_at desc);
create index if not exists lead_routes_lead on public.lead_routes (lead_id);

alter table public.lead_routes enable row level security;
drop policy if exists "lead_routes admin read" on public.lead_routes;
create policy "lead_routes admin read" on public.lead_routes
  for select to authenticated using ( public.is_admin() );
-- No owner select policy: owners read masked routes via /api/owner/leads
-- (service role), which hides PII until a route is accepted.

-- ── 3. lead_preferences: what verticals/areas a business wants leads for ─────
create table if not exists public.lead_preferences (
  business_id uuid primary key references public.businesses(id) on delete cascade,
  verticals text[] not null default '{}',
  areas text[] not null default '{}',     -- Listing.area names; empty = island-wide
  active boolean not null default true,
  updated_at timestamptz not null default now()
);
alter table public.lead_preferences enable row level security;
drop policy if exists "lead_prefs admin read" on public.lead_preferences;
create policy "lead_prefs admin read" on public.lead_preferences
  for select to authenticated using ( public.is_admin() );
-- Owners read/write their own prefs via /api/owner/leads/preferences (service role).

-- ── 4. Lead subscriptions ride the existing subscriptions table ──────────────
-- One webhook-owned billing system: kind distinguishes listing plans from leads.
alter table public.subscriptions
  add column if not exists kind text not null default 'plan'
    check (kind in ('plan','leads')),
  add column if not exists current_period_start timestamptz,
  add column if not exists monthly_quota int;
create index if not exists subscriptions_biz_kind
  on public.subscriptions (business_id, kind, status);

-- Quota consumed in the current period is COUNTED, never stored as a counter:
--   select count(*) from lead_routes lr
--   where lr.business_id = ? and lr.quota_consumed
--     and lr.accepted_at >= subscriptions.current_period_start;
-- (no drift; the ledger is the source of truth).
