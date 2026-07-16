-- 0073 — Phase 1 owner ROI analytics.
-- Adds trustworthy placement/offer dimensions and business-scoped owner RPCs.

begin;

alter table public.analytics_events add column if not exists placement text;
alter table public.analytics_events add column if not exists plan_at_event text;
create index if not exists idx_ae_slug_created on public.analytics_events (listing_slug, created_at desc);
create index if not exists idx_ae_placement_created on public.analytics_events (placement, created_at desc)
  where placement is not null;

alter table public.analytics_events drop constraint if exists analytics_events_event_type_check;
alter table public.analytics_events add constraint analytics_events_event_type_check check (event_type in (
  'page_view','impression','listing_view','search','lead_action','checkout_start','newsletter_signup',
  'search_result_click','filter_use','map_open','ai_query','ai_result_click','offer_view'
));

-- Replace the 0045 signature with placement-aware tracking. plan_at_event is
-- resolved in the database, never trusted from the public client.
drop function if exists public.track_event(text,text,text,text,text,text,text,text,text,text,int);
create or replace function public.track_event(
  p_event_type text,
  p_session_id text default null,
  p_lead_action_type text default null,
  p_listing_slug text default null,
  p_category text default null,
  p_query text default null,
  p_path text default null,
  p_referrer text default null,
  p_area text default null,
  p_device text default null,
  p_results_count int default null,
  p_placement text default null
)
returns void language plpgsql security definer set search_path = public as $$
declare v_plan text;
begin
  select b.plan into v_plan from public.businesses b where b.slug = p_listing_slug limit 1;
  insert into public.analytics_events
    (event_type, session_id, lead_action_type, listing_slug, category, query, path,
     referrer, area, device, results_count, placement, plan_at_event)
  values
    (p_event_type, p_session_id, p_lead_action_type, p_listing_slug, p_category,
     nullif(p_query, ''), p_path, p_referrer, nullif(p_area, ''), nullif(p_device, ''),
     p_results_count, nullif(p_placement, ''), coalesce(v_plan, 'free'));
end;
$$;
revoke all on function public.track_event(text,text,text,text,text,text,text,text,text,text,int,text) from public;
grant execute on function public.track_event(text,text,text,text,text,text,text,text,text,text,int,text) to anon, authenticated;

-- One authoritative business-scoped summary. Basic reach/action totals are
-- available to every owner; commercial value and offer metrics are populated
-- only for Premium. This replaces the brittle legacy all-listings RPC path.
create or replace function public.owner_roi_summary(
  p_business_id uuid, p_from timestamptz, p_to timestamptz
)
returns table (
  impressions bigint, listing_views bigint, lead_actions bigint,
  enquiries bigint, whatsapp_clicks bigint, calls bigint, website_clicks bigint,
  directions bigint, shortlists bigint, offer_views bigint,
  est_value_cents bigint, last_event_at timestamptz
)
language plpgsql security definer set search_path = public as $$
declare v_slug text; v_premium boolean;
begin
  select b.slug, b.plan = 'premium' into v_slug, v_premium
  from public.businesses b
  where b.id = p_business_id
    and (b.owner_id = (auth.jwt() ->> 'sub') or b.claimed_by = (auth.jwt() ->> 'sub'));
  if v_slug is null then raise exception 'forbidden'; end if;
  return query
  select
    count(*) filter (where e.event_type = 'impression'),
    count(*) filter (where e.event_type = 'listing_view'),
    count(*) filter (where e.event_type = 'lead_action'),
    count(*) filter (where e.lead_action_type = 'enquiry_form'),
    count(*) filter (where e.lead_action_type = 'whatsapp'),
    count(*) filter (where e.lead_action_type = 'call'),
    count(*) filter (where e.lead_action_type = 'website'),
    count(*) filter (where e.lead_action_type = 'directions'),
    count(*) filter (where e.lead_action_type = 'shortlist'),
    case when v_premium then count(*) filter (where e.event_type = 'offer_view') else 0 end,
    case when v_premium then coalesce(sum(lv.value_cents) filter (where e.event_type = 'lead_action'), 0)::bigint else 0 end,
    max(e.created_at)
  from public.analytics_events e
  left join public.analytics_lead_values lv on lv.action = e.lead_action_type
  where e.listing_slug = v_slug and e.created_at >= p_from and e.created_at < p_to;
end;
$$;
revoke all on function public.owner_roi_summary(uuid,timestamptz,timestamptz) from public;
grant execute on function public.owner_roi_summary(uuid,timestamptz,timestamptz) to authenticated;

create or replace function public.owner_roi_daily(
  p_business_id uuid, p_from timestamptz, p_to timestamptz
)
returns table (day date, impressions bigint, listing_views bigint, lead_actions bigint, est_value_cents bigint)
language plpgsql security definer set search_path = public as $$
declare v_slug text;
begin
  select b.slug into v_slug from public.businesses b
  where b.id = p_business_id and b.plan = 'premium'
    and (b.owner_id = (auth.jwt() ->> 'sub') or b.claimed_by = (auth.jwt() ->> 'sub'));
  if v_slug is null then return; end if;
  return query select
    (e.created_at at time zone 'Asia/Singapore')::date,
    count(*) filter (where e.event_type = 'impression'),
    count(*) filter (where e.event_type = 'listing_view'),
    count(*) filter (where e.event_type = 'lead_action'),
    coalesce(sum(lv.value_cents) filter (where e.event_type = 'lead_action'), 0)::bigint
  from public.analytics_events e
  left join public.analytics_lead_values lv on lv.action = e.lead_action_type
  where e.listing_slug = v_slug and e.created_at >= p_from and e.created_at < p_to
  group by 1 order by 1;
end;
$$;
revoke all on function public.owner_roi_daily(uuid,timestamptz,timestamptz) from public;
grant execute on function public.owner_roi_daily(uuid,timestamptz,timestamptz) to authenticated;

create or replace function public.owner_roi_placements(
  p_business_id uuid, p_from timestamptz, p_to timestamptz
)
returns table (placement text, impressions bigint)
language plpgsql security definer set search_path = public as $$
declare v_slug text;
begin
  select b.slug into v_slug from public.businesses b
  where b.id = p_business_id and b.plan = 'premium'
    and (b.owner_id = (auth.jwt() ->> 'sub') or b.claimed_by = (auth.jwt() ->> 'sub'));
  if v_slug is null then return; end if;
  return query select coalesce(e.placement, 'legacy_unattributed'), count(*)::bigint
  from public.analytics_events e
  where e.listing_slug = v_slug and e.event_type = 'impression'
    and e.created_at >= p_from and e.created_at < p_to
  group by 1 order by 2 desc;
end;
$$;
revoke all on function public.owner_roi_placements(uuid,timestamptz,timestamptz) from public;
grant execute on function public.owner_roi_placements(uuid,timestamptz,timestamptz) to authenticated;

create or replace function public.owner_roi_queries(
  p_business_id uuid, p_from timestamptz, p_to timestamptz, p_limit int default 10
)
returns table (query text, searches bigint)
language plpgsql security definer set search_path = public as $$
declare v_slug text;
begin
  select b.slug into v_slug from public.businesses b
  where b.id = p_business_id and b.plan = 'premium'
    and (b.owner_id = (auth.jwt() ->> 'sub') or b.claimed_by = (auth.jwt() ->> 'sub'));
  if v_slug is null then return; end if;
  return query
  with sessions as (
    select distinct e.session_id from public.analytics_events e
    where e.listing_slug = v_slug and e.event_type = 'listing_view'
      and e.session_id is not null and e.created_at >= p_from and e.created_at < p_to
  )
  select e.query, count(*)::bigint from public.analytics_events e
  join sessions s on s.session_id = e.session_id
  where e.event_type = 'search' and e.query is not null
    and e.created_at >= p_from and e.created_at < p_to
  group by e.query order by 2 desc
  limit greatest(1, least(coalesce(p_limit, 10), 50));
end;
$$;
revoke all on function public.owner_roi_queries(uuid,timestamptz,timestamptz,int) from public;
grant execute on function public.owner_roi_queries(uuid,timestamptz,timestamptz,int) to authenticated;

commit;
notify pgrst, 'reload schema';
