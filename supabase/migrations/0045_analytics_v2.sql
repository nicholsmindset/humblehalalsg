-- 0045_analytics_v2.sql — business analytics v2: richer event taxonomy,
-- date-ranged admin RPCs (the old v_vendor_leads / v_search_intelligence views
-- were all-time, so the Vendors and Search tabs ignored the range buttons),
-- area/category/monetization rollups, a configurable lead-value model, and
-- owner-facing trend + search-term RPCs.
-- Run after 0044. Views from 0010 are kept for back-compat; the dashboard now
-- reads the RPCs below.

-- ── 1. Event taxonomy ────────────────────────────────────────────────────────
-- New dimensions. area rides on listing events (from the listing card/detail),
-- device is a coarse client hint, results_count captures zero-result searches.
alter table public.analytics_events
  add column if not exists area          text,
  add column if not exists device        text,
  add column if not exists results_count int;

-- Widen the event_type gate (same pattern as 0042).
alter table public.analytics_events
  drop constraint if exists analytics_events_event_type_check;
alter table public.analytics_events
  add constraint analytics_events_event_type_check
  check (event_type in (
    'page_view','impression','listing_view','search','lead_action',
    'checkout_start','newsletter_signup',
    'search_result_click','filter_use','map_open','ai_query','ai_result_click'
  ));

alter table public.analytics_events
  drop constraint if exists analytics_events_lead_action_type_check;
alter table public.analytics_events
  add constraint analytics_events_lead_action_type_check
  check (lead_action_type in (
    'enquiry_form','whatsapp','call','website','directions','shortlist',
    'share','claim','booking','menu','cert_view'
  ));

-- ── 2. track_event(): one signature, three new optional params ───────────────
-- The 8-param version is DROPPED (not overloaded) — two overloads would make
-- PostgREST named-arg resolution ambiguous. Old deployed clients that still
-- send 8 named args resolve fine against this one function via the defaults;
-- the client also carries a legacy-args retry for the deploy-before-migration
-- window (lib/analytics.ts).
drop function if exists public.track_event(text,text,text,text,text,text,text,text);
create or replace function public.track_event(
  p_event_type       text,
  p_session_id       text default null,
  p_lead_action_type text default null,
  p_listing_slug     text default null,
  p_category         text default null,
  p_query            text default null,
  p_path             text default null,
  p_referrer         text default null,
  p_area             text default null,
  p_device           text default null,
  p_results_count    int  default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.analytics_events
    (event_type, session_id, lead_action_type, listing_slug, category, query,
     path, referrer, area, device, results_count)
  values
    (p_event_type, p_session_id, p_lead_action_type, p_listing_slug, p_category,
     nullif(p_query, ''), p_path, p_referrer,
     nullif(p_area, ''), nullif(p_device, ''), p_results_count);
end;
$$;

revoke all on function public.track_event(text,text,text,text,text,text,text,text,text,text,int) from public;
grant execute on function public.track_event(text,text,text,text,text,text,text,text,text,text,int) to anon, authenticated;

-- ── 3. Lead-value model (admin-configurable, never hardcoded in the UI) ──────
create table if not exists public.analytics_lead_values (
  action      text primary key,
  value_cents int not null default 0 check (value_cents >= 0),
  updated_at  timestamptz not null default now()
);

insert into public.analytics_lead_values (action, value_cents) values
  ('enquiry_form', 2500), ('whatsapp', 1200), ('call', 1500), ('website', 500),
  ('directions', 800), ('shortlist', 200), ('share', 150), ('claim', 3000),
  ('booking', 3000), ('menu', 300), ('cert_view', 150)
on conflict (action) do nothing;

alter table public.analytics_lead_values enable row level security;
drop policy if exists "lead values admin read" on public.analytics_lead_values;
create policy "lead values admin read" on public.analytics_lead_values
  for select to authenticated using ( public.is_admin() );

create or replace function public.admin_set_lead_value(p_action text, p_value_cents int)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  insert into public.analytics_lead_values (action, value_cents, updated_at)
  values (p_action, greatest(p_value_cents, 0), now())
  on conflict (action) do update set value_cents = excluded.value_cents, updated_at = now();
end;
$$;
revoke all on function public.admin_set_lead_value(text,int) from public;
grant execute on function public.admin_set_lead_value(text,int) to authenticated;

-- ── 4. admin_vendor_leads(): date-ranged listing performance + plan join ─────
-- Replaces the all-time v_vendor_leads for the dashboard. Joins businesses for
-- plan/area so paid-vs-free and outreach columns come from source of truth.
create or replace function public.admin_vendor_leads(p_from timestamptz, p_to timestamptz)
returns table (
  listing_id text, vendor_name text, category text, area text, plan text,
  enquiries bigint, whatsapp_clicks bigint, calls bigint, website_clicks bigint,
  directions bigint, shortlists bigint, shares bigint, claims bigint,
  bookings bigint, lead_actions bigint, listing_views bigint, impressions bigint,
  est_value_cents bigint, last_event_at timestamptz
)
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  return query
  with ev as (
    select * from public.analytics_events
    where created_at >= p_from and created_at < p_to and listing_slug is not null
  )
  select
    e.listing_slug,
    coalesce(b.name, e.listing_slug),
    coalesce(b.category, max(e.category)),
    coalesce(b.area, max(e.area)),
    coalesce(b.plan, 'free'),
    count(*) filter (where e.lead_action_type = 'enquiry_form'),
    count(*) filter (where e.lead_action_type = 'whatsapp'),
    count(*) filter (where e.lead_action_type = 'call'),
    count(*) filter (where e.lead_action_type = 'website'),
    count(*) filter (where e.lead_action_type = 'directions'),
    count(*) filter (where e.lead_action_type = 'shortlist'),
    count(*) filter (where e.lead_action_type = 'share'),
    count(*) filter (where e.lead_action_type = 'claim'),
    count(*) filter (where e.lead_action_type = 'booking'),
    count(*) filter (where e.event_type = 'lead_action'),
    count(*) filter (where e.event_type = 'listing_view'),
    count(*) filter (where e.event_type = 'impression'),
    coalesce(sum(lv.value_cents) filter (where e.event_type = 'lead_action'), 0)::bigint,
    max(e.created_at)
  from ev e
  left join public.businesses b on b.slug = e.listing_slug
  left join public.analytics_lead_values lv on lv.action = e.lead_action_type
  group by e.listing_slug, b.name, b.category, b.area, b.plan
  order by 15 desc, 16 desc;
end;
$$;
revoke all on function public.admin_vendor_leads(timestamptz,timestamptz) from public;
grant execute on function public.admin_vendor_leads(timestamptz,timestamptz) to authenticated;

-- ── 5. admin_search_terms(): date-ranged search intelligence + zero results ──
create or replace function public.admin_search_terms(p_from timestamptz, p_to timestamptz, p_limit int default 50)
returns table (
  query text, searches bigint, zero_result_searches bigint,
  result_clicks bigint, searches_that_converted bigint
)
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  return query
  with ev as (
    select * from public.analytics_events
    where created_at >= p_from and created_at < p_to
  ),
  s as (
    select ev.query as q, ev.session_id, ev.results_count
    from ev where ev.event_type = 'search' and ev.query is not null
  ),
  clicks as (
    -- search_result_click carries the originating query (lib/analytics.ts),
    -- so clicks attribute to the exact term, not just the session.
    select ev.query as q, count(*) as n from ev
    where ev.event_type = 'search_result_click' and ev.query is not null
    group by ev.query
  ),
  conv as (
    select distinct ev.session_id from ev where ev.event_type = 'lead_action'
  )
  select
    s.q,
    count(*),
    count(*) filter (where s.results_count = 0),
    coalesce(max(ck.n), 0)::bigint,
    count(*) filter (where cv.session_id is not null)
  from s
  left join clicks ck on ck.q = s.q
  left join conv cv   on cv.session_id = s.session_id
  group by s.q
  order by 2 desc
  limit p_limit;
end;
$$;
revoke all on function public.admin_search_terms(timestamptz,timestamptz,int) from public;
grant execute on function public.admin_search_terms(timestamptz,timestamptz,int) to authenticated;

-- ── 6. admin_area_demand(): demand by Singapore area ─────────────────────────
-- Area comes from the event when the client sent it, else from businesses.
create or replace function public.admin_area_demand(p_from timestamptz, p_to timestamptz)
returns table (
  area text, listing_views bigint, lead_actions bigint, impressions bigint,
  vendors_active bigint, paid_vendors bigint, top_category text,
  top_listing text, top_listing_name text
)
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  return query
  with ev as (
    select e.*, coalesce(e.area, b.area) as a, b.plan, b.name as bname
    from public.analytics_events e
    left join public.businesses b on b.slug = e.listing_slug
    where e.created_at >= p_from and e.created_at < p_to
      and coalesce(e.area, b.area) is not null
  ),
  per_listing as (
    select ev.a, ev.listing_slug, max(ev.bname) as bname,
           count(*) filter (where ev.event_type = 'lead_action') as leads
    from ev where ev.listing_slug is not null
    group by ev.a, ev.listing_slug
  ),
  top_l as (
    select distinct on (pl.a) pl.a, pl.listing_slug, pl.bname
    from per_listing pl order by pl.a, pl.leads desc
  ),
  per_cat as (
    select ev.a, ev.category, count(*) filter (where ev.event_type = 'lead_action') as leads
    from ev where ev.category is not null group by ev.a, ev.category
  ),
  top_c as (
    select distinct on (pc.a) pc.a, pc.category
    from per_cat pc order by pc.a, pc.leads desc
  )
  select
    ev.a,
    count(*) filter (where ev.event_type = 'listing_view'),
    count(*) filter (where ev.event_type = 'lead_action'),
    count(*) filter (where ev.event_type = 'impression'),
    count(distinct ev.listing_slug),
    count(distinct ev.listing_slug) filter (where ev.plan is not null and ev.plan <> 'free'),
    max(tc.category),
    max(tl.listing_slug),
    max(coalesce(tl.bname, tl.listing_slug))
  from ev
  left join top_c tc on tc.a = ev.a
  left join top_l tl on tl.a = ev.a
  group by ev.a
  order by 3 desc, 2 desc;
end;
$$;
revoke all on function public.admin_area_demand(timestamptz,timestamptz) from public;
grant execute on function public.admin_area_demand(timestamptz,timestamptz) to authenticated;

-- ── 7. admin_category_demand(): demand by category + supply gap inputs ───────
create or replace function public.admin_category_demand(p_from timestamptz, p_to timestamptz)
returns table (
  category text, listing_views bigint, lead_actions bigint, impressions bigint,
  vendors_active bigint, paid_vendors bigint, top_listing text, top_listing_name text
)
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  return query
  with ev as (
    select e.*, b.plan, b.name as bname
    from public.analytics_events e
    left join public.businesses b on b.slug = e.listing_slug
    where e.created_at >= p_from and e.created_at < p_to and e.category is not null
  ),
  per_listing as (
    select ev.category as c, ev.listing_slug, max(ev.bname) as bname,
           count(*) filter (where ev.event_type = 'lead_action') as leads
    from ev where ev.listing_slug is not null
    group by ev.category, ev.listing_slug
  ),
  top_l as (
    select distinct on (pl.c) pl.c, pl.listing_slug, pl.bname
    from per_listing pl order by pl.c, pl.leads desc
  )
  select
    ev.category,
    count(*) filter (where ev.event_type = 'listing_view'),
    count(*) filter (where ev.event_type = 'lead_action'),
    count(*) filter (where ev.event_type = 'impression'),
    count(distinct ev.listing_slug),
    count(distinct ev.listing_slug) filter (where ev.plan is not null and ev.plan <> 'free'),
    max(tl.listing_slug),
    max(coalesce(tl.bname, tl.listing_slug))
  from ev
  left join top_l tl on tl.c = ev.category
  group by ev.category
  order by 3 desc, 2 desc;
end;
$$;
revoke all on function public.admin_category_demand(timestamptz,timestamptz) from public;
grant execute on function public.admin_category_demand(timestamptz,timestamptz) to authenticated;

-- ── 8. admin_opportunities(): who to sell to first ───────────────────────────
-- Free-plan (or unclaimed) listings ranked by the estimated value of the leads
-- they received free — the outreach hit-list. suggested_offer is a starting
-- pitch, not a rule engine.
create or replace function public.admin_opportunities(p_from timestamptz, p_to timestamptz, p_limit int default 25)
returns table (
  listing_id text, vendor_name text, category text, area text, plan text,
  lead_actions bigint, claims bigint, shortlists bigint, listing_views bigint,
  est_value_cents bigint, suggested_offer text
)
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  return query
  with ev as (
    select e.*, b.name as bname, b.category as bcat, b.area as barea,
           coalesce(b.plan, 'free') as bplan
    from public.analytics_events e
    left join public.businesses b on b.slug = e.listing_slug
    where e.created_at >= p_from and e.created_at < p_to and e.listing_slug is not null
  ),
  agg as (
    select
      ev.listing_slug, max(ev.bname) as bname, max(ev.bcat) as bcat,
      max(ev.barea) as barea, max(ev.bplan) as bplan,
      count(*) filter (where ev.event_type = 'lead_action') as leads,
      count(*) filter (where ev.lead_action_type = 'claim') as claims,
      count(*) filter (where ev.lead_action_type = 'shortlist') as shortlists,
      count(*) filter (where ev.event_type = 'listing_view') as views,
      coalesce(sum(lv.value_cents) filter (where ev.event_type = 'lead_action'), 0)::bigint as est_cents
    from ev
    left join public.analytics_lead_values lv on lv.action = ev.lead_action_type
    group by ev.listing_slug
  )
  select
    agg.listing_slug,
    coalesce(agg.bname, agg.listing_slug),
    agg.bcat, agg.barea, agg.bplan,
    agg.leads, agg.claims, agg.shortlists, agg.views, agg.est_cents,
    case
      when agg.bplan = 'free' and agg.claims > 0                  then 'claim_followup'
      when agg.bplan = 'free' and agg.leads >= 10                 then 'featured'
      when agg.bplan = 'free' and agg.leads >= 3                  then 'verified'
      when agg.bplan in ('verified') and agg.leads >= 10          then 'featured'
      when agg.bplan in ('featured') and agg.leads >= 20          then 'premium'
      when agg.bplan = 'free' and agg.views >= 25                 then 'verified'
      else 'nurture'
    end
  from agg
  where agg.bplan in ('free','verified','featured') and (agg.leads > 0 or agg.views > 0)
  order by agg.est_cents desc, agg.leads desc
  limit p_limit;
end;
$$;
revoke all on function public.admin_opportunities(timestamptz,timestamptz,int) from public;
grant execute on function public.admin_opportunities(timestamptz,timestamptz,int) to authenticated;

-- ── 9. Owner-facing: daily trend + top search terms for the Insights tab ─────
-- Clerk-scoped like 0044's owner_campaign_performance: auth.jwt()->>'sub'.
create or replace function public.owner_listing_daily(p_from timestamptz, p_to timestamptz)
returns table (day date, listing_views bigint, lead_actions bigint)
language plpgsql security definer set search_path = public as $$
begin
  return query
  with mine as (
    select b.slug from public.businesses b
    where b.owner_id = (auth.jwt() ->> 'sub') or b.claimed_by = (auth.jwt() ->> 'sub')
  )
  select
    (e.created_at at time zone 'Asia/Singapore')::date,
    count(*) filter (where e.event_type = 'listing_view'),
    count(*) filter (where e.event_type = 'lead_action')
  from public.analytics_events e
  where e.created_at >= p_from and e.created_at < p_to
    and e.listing_slug in (select slug from mine)
  group by 1 order by 1;
end;
$$;
revoke all on function public.owner_listing_daily(timestamptz,timestamptz) from public;
grant execute on function public.owner_listing_daily(timestamptz,timestamptz) to authenticated;

-- Search terms typed by sessions that then viewed one of the caller's listings
-- (aggregated — no session ids or journeys are exposed to owners).
create or replace function public.owner_top_queries(p_from timestamptz, p_to timestamptz, p_limit int default 10)
returns table (query text, searches bigint)
language plpgsql security definer set search_path = public as $$
begin
  return query
  with mine as (
    select b.slug from public.businesses b
    where b.owner_id = (auth.jwt() ->> 'sub') or b.claimed_by = (auth.jwt() ->> 'sub')
  ),
  my_sessions as (
    select distinct e.session_id from public.analytics_events e
    where e.created_at >= p_from and e.created_at < p_to
      and e.event_type = 'listing_view' and e.session_id is not null
      and e.listing_slug in (select slug from mine)
  )
  select e.query, count(*)::bigint
  from public.analytics_events e
  join my_sessions m on m.session_id = e.session_id
  where e.created_at >= p_from and e.created_at < p_to
    and e.event_type = 'search' and e.query is not null
  group by e.query
  order by 2 desc
  limit p_limit;
end;
$$;
revoke all on function public.owner_top_queries(timestamptz,timestamptz,int) from public;
grant execute on function public.owner_top_queries(timestamptz,timestamptz,int) to authenticated;
