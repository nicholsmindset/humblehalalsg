-- Humble Halal — admin-only, date-ranged analytics RPCs (dashboard.zip's 002).
-- Both functions guard on is_admin() (0010) so even with a leaked anon key the
-- aggregates can't be read by a non-admin. Run after 0010.

-- ── admin_summary(): headline cards for a [from, to) window ──────────────────
create or replace function public.admin_summary(
  p_from timestamptz,
  p_to   timestamptz
)
returns table (
  total_sessions     bigint,
  total_page_views   bigint,
  total_lead_actions bigint,
  enquiries          bigint,
  whatsapp_clicks    bigint,
  calls              bigint,
  website_clicks     bigint,
  directions         bigint,
  shortlists         bigint,
  searches           bigint,
  search_conv_rate   numeric
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
    select * from public.analytics_events
    where created_at >= p_from and created_at < p_to
  ),
  searched as (
    select distinct session_id from ev where event_type = 'search'
  ),
  searched_converted as (
    select distinct s.session_id
    from searched s
    join ev l on l.session_id = s.session_id and l.event_type = 'lead_action'
  )
  select
    count(distinct ev.session_id)                                            as total_sessions,
    count(*) filter (where ev.event_type = 'page_view')                      as total_page_views,
    count(*) filter (where ev.event_type = 'lead_action')                    as total_lead_actions,
    count(*) filter (where ev.lead_action_type = 'enquiry_form')             as enquiries,
    count(*) filter (where ev.lead_action_type = 'whatsapp')                 as whatsapp_clicks,
    count(*) filter (where ev.lead_action_type = 'call')                     as calls,
    count(*) filter (where ev.lead_action_type = 'website')                  as website_clicks,
    count(*) filter (where ev.lead_action_type = 'directions')              as directions,
    count(*) filter (where ev.lead_action_type = 'shortlist')               as shortlists,
    count(*) filter (where ev.event_type = 'search')                         as searches,
    round(
      100.0 * (select count(*) from searched_converted)
      / nullif((select count(*) from searched), 0), 1
    )                                                                        as search_conv_rate
  from ev;
end;
$$;

revoke all on function public.admin_summary(timestamptz,timestamptz) from public;
grant execute on function public.admin_summary(timestamptz,timestamptz) to authenticated;

-- ── admin_recent_journeys(): recent converting sessions, newest first ────────
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
    select * from public.analytics_events
    where created_at >= p_from and created_at < p_to and session_id is not null
  ),
  -- sessions that converted (had a lead action) in-window
  conv as (
    select session_id, max(created_at) as final_action_at
    from ev where event_type = 'lead_action'
    group by session_id
  ),
  final_act as (
    select distinct on (e.session_id)
      e.session_id, e.lead_action_type as final_action, e.category as final_category
    from ev e
    join conv c on c.session_id = e.session_id and c.final_action_at = e.created_at
    where e.event_type = 'lead_action'
  ),
  entry as (
    select distinct on (session_id) session_id, path as entry_path, created_at as session_start
    from ev order by session_id, created_at asc
  )
  select
    c.session_id,
    en.session_start,
    en.entry_path,
    count(*) filter (where e.event_type = 'page_view')                       as pages_viewed,
    count(distinct e.listing_slug) filter (where e.event_type = 'listing_view') as listings_viewed,
    bool_or(e.event_type = 'search')                                          as used_search,
    fa.final_action,
    fa.final_category,
    c.final_action_at
  from conv c
  join ev e        on e.session_id = c.session_id
  join final_act fa on fa.session_id = c.session_id
  left join entry en on en.session_id = c.session_id
  group by c.session_id, en.session_start, en.entry_path, fa.final_action, fa.final_category, c.final_action_at
  order by c.final_action_at desc
  limit p_limit;
end;
$$;

revoke all on function public.admin_recent_journeys(timestamptz,timestamptz,int) from public;
grant execute on function public.admin_recent_journeys(timestamptz,timestamptz,int) to authenticated;
