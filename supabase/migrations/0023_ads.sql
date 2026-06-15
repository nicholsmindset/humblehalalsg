-- 0023_ads.sql — Phase 2: sponsored-ad sales + tracking (admin-operated).
-- Inventory (placements/rate-card) → campaigns (a sponsor's booking) → events
-- (impressions/clicks). Honest: performance is computed from real events only.

-- ── Inventory / rate card ─────────────────────────────────────────────────────
create table if not exists ad_placements (
  key text primary key,                 -- e.g. 'homepage_hero'
  label text not null,
  monthly_rate_cents int not null default 0,
  inventory_cap int not null default 1, -- max concurrent active campaigns
  active boolean not null default true,
  sort int not null default 0
);

-- ── Campaigns (a sponsor's booking on a placement) ────────────────────────────
create table if not exists ad_campaigns (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete set null,
  advertiser_name text,                 -- shown when the advertiser isn't a listed business
  placement_key text references ad_placements(key) on delete restrict,
  title text not null,                  -- creative headline
  body text,
  image_url text,
  target_url text,                      -- internal slug or external url
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'active', 'paused', 'ended')),
  starts_on date,
  ends_on date,
  rate_cents int not null default 0,    -- agreed price
  budget_cents int,
  notes text,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists ad_campaigns_placement_idx on ad_campaigns (placement_key, status);
create index if not exists ad_campaigns_business_idx on ad_campaigns (business_id);

-- ── Impression / click events ─────────────────────────────────────────────────
create table if not exists ad_events (
  id bigint generated always as identity primary key,
  campaign_id uuid references ad_campaigns(id) on delete cascade,
  placement_key text,
  kind text not null check (kind in ('impression', 'click')),
  session_id text,
  created_at timestamptz not null default now()
);
create index if not exists ad_events_campaign_idx on ad_events (campaign_id, kind);
create index if not exists ad_events_created_idx on ad_events (created_at);

-- ── RLS ───────────────────────────────────────────────────────────────────────
alter table ad_placements enable row level security;
alter table ad_campaigns enable row level security;
alter table ad_events enable row level security;
-- Placements are public (needed to render the rate card / slots).
drop policy if exists ad_placements_read on ad_placements;
create policy ad_placements_read on ad_placements for select using (true);
-- Campaigns: admins see all; a business owner sees their own (advertiser report).
drop policy if exists ad_campaigns_read on ad_campaigns;
create policy ad_campaigns_read on ad_campaigns for select using (
  public.is_admin() or business_id in (
    select id from businesses where owner_id = auth.uid() or claimed_by = auth.uid()
  )
);
-- Raw events: admin only (writes go through the SECURITY DEFINER RPC below).
drop policy if exists ad_events_admin on ad_events;
create policy ad_events_admin on ad_events for select using (public.is_admin());

-- Anonymous impression/click tracking (write-only, validated).
create or replace function public.track_ad_event(p_campaign uuid, p_placement text, p_kind text, p_session text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_kind not in ('impression', 'click') then return; end if;
  insert into ad_events (campaign_id, placement_key, kind, session_id)
  values (p_campaign, p_placement, p_kind, left(coalesce(p_session, ''), 64));
end;
$$;

-- ── Performance aggregate (real events only) ──────────────────────────────────
create or replace view public.v_campaign_performance as
  select c.id as campaign_id, c.title, c.placement_key, c.status, c.business_id, c.advertiser_name,
         c.rate_cents, c.starts_on, c.ends_on,
         coalesce(sum((e.kind = 'impression')::int), 0)::int as impressions,
         coalesce(sum((e.kind = 'click')::int), 0)::int as clicks
  from ad_campaigns c
  left join ad_events e on e.campaign_id = c.id
  group by c.id;

-- ── Seed the rate card (mirrors the Advertise page products) ──────────────────
insert into ad_placements (key, label, monthly_rate_cents, inventory_cap, sort) values
  ('homepage_hero',     'Homepage Spotlight',     45000, 1, 1),
  ('category_featured', 'Category Sponsorship',   30000, 3, 2),
  ('directory_inline',  'Featured Listing',        8900, 8, 3),
  ('newsletter',        'Newsletter Sponsorship', 25000, 1, 4),
  ('event_featured',    'Event Promotion',        12000, 4, 5)
on conflict (key) do nothing;
