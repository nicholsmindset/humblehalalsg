-- 0024_owner_campaign_perf.sql — advertiser-facing campaign performance.
-- Raw ad_events are admin-only, so an advertiser can't compute their own CTR via
-- RLS. This SECURITY DEFINER function returns ONLY the caller's own campaigns
-- (scoped by auth.uid() to businesses they own/claim) with real impression/click
-- counts — no other advertiser's data is reachable.
create or replace function public.owner_campaign_performance()
returns table (
  campaign_id uuid,
  title text,
  placement_key text,
  status text,
  rate_cents int,
  starts_on date,
  ends_on date,
  impressions int,
  clicks int
)
language sql stable security definer set search_path = public as $$
  select c.id, c.title, c.placement_key, c.status, c.rate_cents, c.starts_on, c.ends_on,
         coalesce(sum((e.kind = 'impression')::int), 0)::int,
         coalesce(sum((e.kind = 'click')::int), 0)::int
  from ad_campaigns c
  left join ad_events e on e.campaign_id = c.id
  where c.business_id in (
    select id from businesses where owner_id = auth.uid() or claimed_by = auth.uid()
  )
  group by c.id
  order by c.created_at desc;
$$;

grant execute on function public.owner_campaign_performance() to authenticated;
