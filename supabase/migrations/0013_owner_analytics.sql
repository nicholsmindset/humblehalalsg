-- Humble Halal — owner-scoped analytics + public ratings rollup.
-- Closes the analytics loop: owners see their OWN listing metrics (from the
-- analytics_events log, 0010) and the directory surfaces REAL review ratings.
-- Run after 0010–0012.

-- ── v_business_ratings: public avg rating + count, keyed BY SLUG ─────────────
-- reviews (0002) already allows public SELECT where status='published' and
-- businesses public SELECT is true, so this aggregate is safe to expose
-- read-only. Keyed by slug so getDirectory() can overlay real numbers onto
-- listings (mock-rendered or DB) without exposing business_id plumbing.
create or replace view public.v_business_ratings as
select
  b.slug                          as listing_slug,
  round(avg(r.rating)::numeric, 1) as avg_rating,
  count(*)::bigint               as review_count
from public.reviews r
join public.businesses b on b.id = r.business_id
where r.status = 'published'
group by b.slug;

-- ── v_reviews_public: published reviews keyed by slug (for detail pages) ─────
-- Anon-readable (underlying RLS already permits published reviews + public
-- businesses). DetailReviews reads this by listing_slug.
create or replace view public.v_reviews_public as
select
  b.slug        as listing_slug,
  r.id,
  r.rating,
  r.text,
  r.reply,
  r.helpful,
  r.created_at
from public.reviews r
join public.businesses b on b.id = r.business_id
where r.status = 'published';

-- ── owner_listing_analytics(): per-listing metrics for the caller's listings ──
-- SECURITY DEFINER so it can read the admin-only analytics_events, but it is
-- HARD-SCOPED to listings the caller owns: businesses.owner_id (0001) OR
-- businesses.claimed_by (0002) = auth.uid(). Events join by listing_slug =
-- businesses.slug (the loop only aligns once the directory is DB-backed and
-- slugs match — see the seed script).
create or replace function public.owner_listing_analytics(
  p_from timestamptz,
  p_to   timestamptz
)
returns table (
  listing_slug    text,
  vendor_name     text,
  enquiries       bigint,
  whatsapp_clicks bigint,
  calls           bigint,
  website_clicks  bigint,
  directions      bigint,
  shortlists      bigint,
  listing_views   bigint,
  impressions     bigint,
  page_views      bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with mine as (
    select b.slug, b.name
    from public.businesses b
    where b.owner_id = auth.uid() or b.claimed_by = auth.uid()
  ),
  ev as (
    select * from public.analytics_events
    where created_at >= p_from and created_at < p_to
      and listing_slug in (select slug from mine)
  )
  select
    m.slug                                                              as listing_slug,
    m.name                                                             as vendor_name,
    count(*) filter (where e.lead_action_type = 'enquiry_form')::bigint as enquiries,
    count(*) filter (where e.lead_action_type = 'whatsapp')::bigint     as whatsapp_clicks,
    count(*) filter (where e.lead_action_type = 'call')::bigint         as calls,
    count(*) filter (where e.lead_action_type = 'website')::bigint      as website_clicks,
    count(*) filter (where e.lead_action_type = 'directions')::bigint   as directions,
    count(*) filter (where e.lead_action_type = 'shortlist')::bigint    as shortlists,
    count(*) filter (where e.event_type = 'listing_view')::bigint       as listing_views,
    count(*) filter (where e.event_type = 'impression')::bigint         as impressions,
    count(*) filter (where e.event_type = 'page_view')::bigint          as page_views
  from mine m
  left join ev e on e.listing_slug = m.slug
  group by m.slug, m.name
  order by listing_views desc;
end;
$$;

revoke all on function public.owner_listing_analytics(timestamptz,timestamptz) from public;
grant execute on function public.owner_listing_analytics(timestamptz,timestamptz) to authenticated;
