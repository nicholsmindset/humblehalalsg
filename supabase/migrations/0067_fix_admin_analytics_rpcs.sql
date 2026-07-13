-- 0054_fix_admin_analytics_rpcs.sql
-- Fix production admin analytics refresh failures:
-- - businesses uses cat_id, not category, so listing/opportunity RPCs failed.
-- - admin_recent_journeys had unqualified session_id references that can
--   collide with the function's OUT parameter in plpgsql.

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
    select *
    from public.analytics_events
    where created_at >= p_from and created_at < p_to and listing_slug is not null
  )
  select
    e.listing_slug,
    coalesce(b.name, e.listing_slug),
    coalesce(b.cat_id, max(e.category)),
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
  group by e.listing_slug, b.name, b.cat_id, b.area, b.plan
  order by 15 desc, 16 desc;
end;
$$;

revoke all on function public.admin_vendor_leads(timestamptz,timestamptz) from public;
grant execute on function public.admin_vendor_leads(timestamptz,timestamptz) to authenticated;

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
    select e.*, b.name as bname, b.cat_id as bcat, b.area as barea,
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
      when agg.bplan = 'free' and agg.claims > 0         then 'claim_followup'
      when agg.bplan = 'free' and agg.leads >= 10        then 'featured'
      when agg.bplan = 'free' and agg.leads >= 3         then 'verified'
      when agg.bplan in ('verified') and agg.leads >= 10 then 'featured'
      when agg.bplan in ('featured') and agg.leads >= 20 then 'premium'
      when agg.bplan = 'free' and agg.views >= 25        then 'verified'
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

create or replace function public.admin_recent_journeys(
  p_from  timestamptz,
  p_to    timestamptz,
  p_limit int default 50
)
returns table (
  session_id      text,
  session_start   timestamptz,
  entry_path      text,
  pages_viewed    bigint,
  listings_viewed bigint,
  used_search     boolean,
  final_action    text,
  final_category  text,
  final_action_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'admin only';
  end if;

  return query
  with ev as (
    select *
    from public.analytics_events ae
    where ae.created_at >= p_from and ae.created_at < p_to and ae.session_id is not null
  ),
  conv as (
    select ev.session_id, max(ev.created_at) as final_action_at
    from ev
    where ev.event_type = 'lead_action'
    group by ev.session_id
  ),
  final_act as (
    select distinct on (e.session_id)
      e.session_id, e.lead_action_type as final_action, e.category as final_category
    from ev e
    join conv c on c.session_id = e.session_id and c.final_action_at = e.created_at
    where e.event_type = 'lead_action'
    order by e.session_id, e.created_at desc
  ),
  entry as (
    select distinct on (x.session_id)
      x.session_id, x.path as entry_path, x.created_at as session_start
    from ev x
    order by x.session_id, x.created_at asc
  )
  select
    c.session_id,
    en.session_start,
    en.entry_path,
    count(*) filter (where e.event_type = 'page_view') as pages_viewed,
    count(distinct e.listing_slug) filter (where e.event_type = 'listing_view') as listings_viewed,
    bool_or(e.event_type = 'search') as used_search,
    fa.final_action,
    fa.final_category,
    c.final_action_at
  from conv c
  join ev e on e.session_id = c.session_id
  join final_act fa on fa.session_id = c.session_id
  left join entry en on en.session_id = c.session_id
  group by c.session_id, en.session_start, en.entry_path, fa.final_action, fa.final_category, c.final_action_at
  order by c.final_action_at desc
  limit p_limit;
end;
$$;

revoke all on function public.admin_recent_journeys(timestamptz,timestamptz,int) from public;
grant execute on function public.admin_recent_journeys(timestamptz,timestamptz,int) to authenticated;
