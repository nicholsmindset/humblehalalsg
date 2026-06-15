-- 0025_premerge_review_fixes.sql — remediation from the pre-merge code review of
-- the events + ads sprint. All statements are idempotent / safe to re-run.

-- ── 1. Allow events to be cancelled ───────────────────────────────────────────
-- app/api/events/[id]/route.ts sets status='cancelled', but the 0001 CHECK
-- constraint only allowed draft/pending/published/rejected → cancellation failed
-- with a constraint violation. Add 'cancelled'.
alter table public.events drop constraint if exists events_status_check;
alter table public.events add constraint events_status_check
  check (status in ('draft', 'pending', 'published', 'rejected', 'cancelled'));

-- ── 2. ad_orders idempotency ──────────────────────────────────────────────────
-- Parity with donations: prevent duplicate ad-revenue rows on webhook retries.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'ad_orders_payment_intent_unique'
  ) then
    alter table public.ad_orders
      add constraint ad_orders_payment_intent_unique unique (stripe_payment_intent);
  end if;
end $$;

-- ── 3. Atomic donation total ──────────────────────────────────────────────────
-- The webhook mirrored the running donation total with a read-then-write on
-- events.display, which loses concurrent increments. Increment atomically in one
-- statement (mirrors increment_event_taken from 0017). p_amount may be negative
-- (a refund reversal); the stored total is clamped at zero.
create or replace function public.increment_donation_raised(p_event_id text, p_amount int)
returns void
language sql
security definer
set search_path = public
as $$
  update public.events
     set display = jsonb_set(
       coalesce(display, '{}'::jsonb),
       '{donationRaisedCents}',
       to_jsonb(greatest(coalesce((display ->> 'donationRaisedCents')::int, 0) + p_amount, 0))
     )
   where id = p_event_id;
$$;

-- ── 4. Free capacity on refund ────────────────────────────────────────────────
-- Refunds (webhook charge.refunded) freed no capacity, so a sold-out event stayed
-- blocked after refunds. Decrement atomically, clamped at zero.
create or replace function public.decrement_event_taken(p_event_id text, p_qty int)
returns int
language sql
security definer
set search_path = public
as $$
  update public.events
     set taken = greatest(taken - greatest(p_qty, 0), 0)
   where id = p_event_id
  returning taken;
$$;

-- ── 5. SECURITY INVOKER on read views ─────────────────────────────────────────
-- Views default to SECURITY DEFINER, which bypasses RLS for any caller hitting
-- PostgREST directly. The app reads these only via the service-role admin client
-- (which bypasses RLS regardless), so re-creating them with security_invoker
-- closes direct anon/authenticated access without changing app behaviour.
create or replace view public.v_event_reviews_public with (security_invoker = true) as
  select er.id, er.event_id, e.slug as event_slug, er.rating, er.text, er.author_name, er.created_at
  from event_reviews er
  join events e on e.id = er.event_id
  where er.status = 'published';

create or replace view public.v_event_rating with (security_invoker = true) as
  select event_id,
         round(avg(rating)::numeric, 1) as avg_rating,
         count(*)::int as review_count
  from event_reviews
  where status = 'published'
  group by event_id;

create or replace view public.v_campaign_performance with (security_invoker = true) as
  select c.id as campaign_id, c.title, c.placement_key, c.status, c.business_id, c.advertiser_name,
         c.rate_cents, c.starts_on, c.ends_on,
         coalesce(sum((e.kind = 'impression')::int), 0)::int as impressions,
         coalesce(sum((e.kind = 'click')::int), 0)::int as clicks
  from ad_campaigns c
  left join ad_events e on e.campaign_id = c.id
  group by c.id;
