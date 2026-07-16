-- 0072 — Phase 0 paid-plan entitlement contract and trust controls.
--
-- Paid promises must be derived from the authoritative businesses.plan value,
-- observable by the owner, and enforced below the UI. This migration:
--   1. makes businesses.featured a derived Featured/Premium entitlement;
--   2. records Stripe plan lifecycle events for reconciliation/audit;
--   3. creates a real priority-support queue;
--   4. enforces Premium-only advanced analytics inside the owner RPCs.

begin;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'businesses_plan_known' and conrelid = 'public.businesses'::regclass
  ) then
    alter table public.businesses
      add constraint businesses_plan_known
      check (plan in ('free','verified','featured','premium')) not valid;
  end if;
end $$;

create or replace function public.sync_business_plan_entitlements()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.plan := coalesce(new.plan, 'free');
  new.featured := new.plan in ('featured', 'premium');
  return new;
end;
$$;

drop trigger if exists sync_business_plan_entitlements on public.businesses;
create trigger sync_business_plan_entitlements
  before insert or update of plan, featured on public.businesses
  for each row execute function public.sync_business_plan_entitlements();

-- Stripe/webhook lifecycle ledger. The webhook event id is unique, so webhook
-- retries never create duplicate entitlement history.
create table if not exists public.plan_entitlement_events (
  id uuid primary key default gen_random_uuid(),
  stripe_event_id text not null unique,
  stripe_subscription_id text,
  business_id uuid references public.businesses(id) on delete cascade,
  plan text check (plan is null or plan in ('free','verified','featured','premium')),
  subscription_status text,
  source text not null default 'stripe' check (source in ('stripe','admin','reconciliation')),
  effective_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists plan_entitlement_events_business
  on public.plan_entitlement_events (business_id, effective_at desc);

alter table public.plan_entitlement_events enable row level security;
drop policy if exists "plan entitlement events admin read" on public.plan_entitlement_events;
create policy "plan entitlement events admin read" on public.plan_entitlement_events
  for select to authenticated using (public.is_admin());
grant select on public.plan_entitlement_events to authenticated;

-- Priority support is now an operational promise, not marketing-only copy.
create table if not exists public.support_requests (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  owner_id text not null,
  plan text not null check (plan in ('free','verified','featured','premium')),
  priority text not null default 'normal' check (priority in ('normal','high')),
  subject text not null check (char_length(subject) between 3 and 120),
  message text not null check (char_length(message) between 5 and 4000),
  status text not null default 'open' check (status in ('open','in_progress','resolved','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index if not exists support_requests_open_priority
  on public.support_requests ((case when priority = 'high' then 0 else 1 end), created_at)
  where status in ('open','in_progress');
create index if not exists support_requests_owner
  on public.support_requests (owner_id, created_at desc);

alter table public.support_requests enable row level security;
drop policy if exists "support owner read" on public.support_requests;
create policy "support owner read" on public.support_requests
  for select to authenticated using (owner_id = (auth.jwt() ->> 'sub'));
drop policy if exists "support owner insert" on public.support_requests;
create policy "support owner insert" on public.support_requests
  for insert to authenticated with check (owner_id = (auth.jwt() ->> 'sub'));
drop policy if exists "support admin manage" on public.support_requests;
create policy "support admin manage" on public.support_requests
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
grant select, insert on public.support_requests to authenticated;

-- Premium analytics is enforced at the data layer. Basic owner totals remain
-- available through owner_listing_analytics; only the advanced daily trend and
-- search-intelligence RPCs are restricted to Premium-owned listings.
create or replace function public.owner_listing_daily(p_from timestamptz, p_to timestamptz)
returns table (day date, listing_views bigint, lead_actions bigint)
language plpgsql security definer set search_path = public as $$
begin
  return query
  with mine as (
    select b.slug from public.businesses b
    where (b.owner_id = (auth.jwt() ->> 'sub') or b.claimed_by = (auth.jwt() ->> 'sub'))
      and b.plan = 'premium'
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

create or replace function public.owner_top_queries(p_from timestamptz, p_to timestamptz, p_limit int default 10)
returns table (query text, searches bigint)
language plpgsql security definer set search_path = public as $$
begin
  return query
  with mine as (
    select b.slug from public.businesses b
    where (b.owner_id = (auth.jwt() ->> 'sub') or b.claimed_by = (auth.jwt() ->> 'sub'))
      and b.plan = 'premium'
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
  limit greatest(1, least(coalesce(p_limit, 10), 50));
end;
$$;
revoke all on function public.owner_top_queries(timestamptz,timestamptz,int) from public;
grant execute on function public.owner_top_queries(timestamptz,timestamptz,int) to authenticated;

commit;

notify pgrst, 'reload schema';
