-- 0064 — Track ads in every state that SERVES (audit streams-P1-2).
--
-- /api/ads/active serves campaigns with status in ('active','scheduled')
-- inside their window, but 0040's track_ad_event only recorded events for
-- status='active' — and paid self-serve campaigns are set to 'scheduled' and
-- (until the ads-lifecycle cron) never flipped. Net effect: every self-serve
-- advertiser saw 0 impressions / 0 clicks while their ad actually ran.
-- Align the tracking gate with the serving gate, and respect the review gate
-- (0043): only approved (or pre-review-era null) creatives count.

create or replace function public.track_ad_event(p_campaign uuid, p_placement text, p_kind text, p_session text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_kind not in ('impression', 'click') then return; end if;
  if not exists (
    select 1 from ad_campaigns c
    where c.id = p_campaign
      and c.status in ('active', 'scheduled')
      and (c.review_status is null or c.review_status = 'approved')
      and (c.starts_on is null or c.starts_on <= current_date)
      and (c.ends_on is null or c.ends_on >= current_date)
  ) then return; end if;
  insert into ad_events (campaign_id, placement_key, kind, session_id)
  values (p_campaign, p_placement, p_kind, left(coalesce(p_session, ''), 64));
end;
$$;
