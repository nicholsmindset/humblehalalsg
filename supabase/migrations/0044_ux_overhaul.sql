-- 0044_ux_overhaul.sql — owner-dashboard UX overhaul + self-serve ads groundwork.
-- Depends on 0043_ads_adsense.sql (review_status) being applied first.

-- ── 1. Pending-submission visibility ────────────────────────────────────────
-- /api/submissions already stores the signed-in submitter inside raw
-- (raw->>'submitted_by', a Clerk user id) and the admin queue promotes it to
-- owner_id/claimed_by on approval. A stored generated column makes it queryable
-- so the owner dashboard can show "in review" cards; derived, so no backfill.
alter table staging_businesses
  add column if not exists submitted_by text
    generated always as (raw->>'submitted_by') stored;

create index if not exists staging_businesses_submitted_by_idx
  on staging_businesses (submitted_by) where submitted_by is not null;

-- ── 2. Self-serve ad campaigns ───────────────────────────────────────────────
-- stripe_payment_intent: unique => webhook replays are no-ops (same pattern as
-- ad_orders in 0025). created_via distinguishes owner self-serve purchases from
-- admin-entered campaigns in the review queue.
alter table ad_campaigns
  add column if not exists stripe_payment_intent text,
  add column if not exists created_via text not null default 'admin'
    check (created_via in ('admin','self_serve'));

create unique index if not exists ad_campaigns_stripe_pi_uidx
  on ad_campaigns (stripe_payment_intent) where stripe_payment_intent is not null;

create index if not exists ad_campaigns_business_created_idx
  on ad_campaigns (business_id, created_at desc);

-- ── 3. owner_campaign_performance: expose review/creative fields ─────────────
-- The owner Ads tab needs review_status + creative + created_via to render
-- status chips (Pending review / Scheduled / Live / Rejected / Awaiting payment)
-- and card previews. Same Clerk-scoped ownership predicate as the 0031 rewrite.
drop function if exists public.owner_campaign_performance();
create function public.owner_campaign_performance()
returns table (
  campaign_id uuid, title text, placement_key text, status text, review_status text,
  created_via text, body text, image_url text, target_url text, rate_cents int,
  starts_on date, ends_on date, impressions int, clicks int
)
language sql stable security definer set search_path = public as $fn$
  select c.id, c.title, c.placement_key, c.status, c.review_status,
         c.created_via, c.body, c.image_url, c.target_url, c.rate_cents,
         c.starts_on, c.ends_on,
         coalesce(sum((e.kind = 'impression')::int), 0)::int,
         coalesce(sum((e.kind = 'click')::int), 0)::int
  from public.ad_campaigns c
  left join public.ad_events e on e.campaign_id = c.id
  where c.business_id in (
    select id from public.businesses where owner_id = (auth.jwt() ->> 'sub') or claimed_by = (auth.jwt() ->> 'sub')
  )
  group by c.id
  order by c.created_at desc;
$fn$;
revoke all on function public.owner_campaign_performance() from public;
grant execute on function public.owner_campaign_performance() to authenticated;
