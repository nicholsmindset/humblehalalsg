-- Humble Halal — first-party analytics foundation.
-- Adapted from the "dashboard.zip" package (its missing migrations 001 + part of
-- 002), keyed on LISTING SLUG (our live directory renders static listings by
-- slug; lib/directory.ts) rather than a businesses.id uuid. A nullable
-- listing_id uuid is kept for future wiring to businesses as source of truth.
-- Run after 0001–0009.
--
-- Security model (why the public anon key is safe):
--   * The anon key can only INSERT events, and only through track_event() — a
--     SECURITY DEFINER function. It can never SELECT analytics_events.
--   * Reads require an authenticated admin (profiles.role='admin'), enforced by
--     RLS via is_admin() and re-checked inside every admin RPC (0011).

-- ── is_admin(): reused by RLS, the admin RPCs (0011) and share tokens (0012) ──
-- Mirrors the inline check already used in 0005_leads.sql, as a reusable fn.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ── analytics_events: the raw event log ─────────────────────────────────────
create table if not exists public.analytics_events (
  id               uuid primary key default gen_random_uuid(),
  session_id       text,
  event_type       text not null
    check (event_type in ('page_view','impression','listing_view','search','lead_action')),
  lead_action_type text
    check (lead_action_type in ('enquiry_form','whatsapp','call','website','directions','shortlist')),
  listing_slug     text,
  listing_id       uuid,                       -- reserved for future businesses.id wiring
  category         text,
  query            text,
  path             text,
  referrer         text,
  created_at       timestamptz not null default now()
);

create index if not exists idx_ae_created  on public.analytics_events (created_at);
create index if not exists idx_ae_slug     on public.analytics_events (listing_slug);
create index if not exists idx_ae_type     on public.analytics_events (event_type);
create index if not exists idx_ae_session  on public.analytics_events (session_id);

alter table public.analytics_events enable row level security;

-- Admin-only SELECT. No insert/update/delete policy → writes go solely through
-- track_event() (SECURITY DEFINER) or the service-role key.
drop policy if exists "analytics admin read" on public.analytics_events;
create policy "analytics admin read" on public.analytics_events
  for select to authenticated using ( public.is_admin() );

-- ── track_event(): the ONLY write path for the anon key ─────────────────────
create or replace function public.track_event(
  p_event_type       text,
  p_session_id       text default null,
  p_lead_action_type text default null,
  p_listing_slug     text default null,
  p_category         text default null,
  p_query            text default null,
  p_path             text default null,
  p_referrer         text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.analytics_events
    (event_type, session_id, lead_action_type, listing_slug, category, query, path, referrer)
  values
    (p_event_type, p_session_id, p_lead_action_type, p_listing_slug, p_category,
     nullif(p_query, ''), p_path, p_referrer);
end;
$$;

revoke all on function public.track_event(text,text,text,text,text,text,text,text) from public;
grant execute on function public.track_event(text,text,text,text,text,text,text,text) to anon, authenticated;

-- ── Reporting views (column names are CONTRACTS with the dashboard UI) ───────

-- Daily lead actions, day-bucketed in Singapore time. Filtered client-side by day.
create or replace view public.v_daily_lead_actions as
select
  (created_at at time zone 'Asia/Singapore')::date as day,
  lead_action_type,
  category,
  count(*)::bigint as actions
from public.analytics_events
where event_type = 'lead_action' and lead_action_type is not null
group by 1, 2, 3;

-- Per-vendor (per-slug) scorecard, all-time. listing_id is aliased to the slug
-- so the dashboard's VendorRow.listing_id works unchanged; vendor_name joins the
-- businesses table by slug and falls back to the slug.
create or replace view public.v_vendor_leads as
select
  e.listing_slug                                            as listing_id,
  coalesce(b.name, e.listing_slug)                          as vendor_name,
  max(e.category)                                           as category,
  count(*) filter (where e.lead_action_type = 'enquiry_form')::bigint as enquiries,
  count(*) filter (where e.lead_action_type = 'whatsapp')::bigint     as whatsapp_clicks,
  count(*) filter (where e.lead_action_type = 'call')::bigint         as calls,
  count(*) filter (where e.lead_action_type = 'website')::bigint      as website_clicks,
  count(*) filter (where e.lead_action_type = 'directions')::bigint   as directions,
  count(*) filter (where e.lead_action_type = 'shortlist')::bigint    as shortlists,
  count(*) filter (where e.event_type = 'listing_view')::bigint       as listing_views,
  count(*) filter (where e.event_type = 'impression')::bigint         as impressions,
  max(e.created_at)                                         as last_event_at
from public.analytics_events e
left join public.businesses b on b.slug = e.listing_slug
where e.listing_slug is not null
group by e.listing_slug, b.name;

-- Top search queries + how many converted (searched then led to any lead action
-- in the same session). All-time; the dashboard limits to 25.
create or replace view public.v_search_intelligence as
with searches as (
  select query, session_id
  from public.analytics_events
  where event_type = 'search' and query is not null
),
converters as (
  select distinct session_id
  from public.analytics_events
  where event_type = 'lead_action'
)
select
  s.query,
  count(*)::bigint as searches,
  count(*) filter (where c.session_id is not null)::bigint as searches_that_converted
from searches s
left join converters c on c.session_id = s.session_id
group by s.query;

-- First path + start time per session (entry point).
create or replace view public.v_session_entry as
select distinct on (session_id)
  session_id,
  path                          as entry_path,
  created_at                    as session_start
from public.analytics_events
where session_id is not null
order by session_id, created_at asc;
