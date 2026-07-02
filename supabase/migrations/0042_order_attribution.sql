-- Humble Halal — order attribution + organiser tracking links + fee modes
-- (events marketplace Phase 1). Gives organisers Eventbrite-style channel
-- analytics (which link/UTM sold each ticket) and lets them choose whether the
-- booking fee is passed to the buyer (default, current behaviour) or absorbed
-- into the face value. Builds on 0001_init (orders), 0010_analytics,
-- 0041_promo_codes.
--
-- Attribution is PDPA-conscious: utm/ref_code/session_id identify a marketing
-- channel and an anonymous session, never a person. The hh_attr cookie set by
-- /e/[slug] and lib/attribution.ts carries no PII.

-- ── 1. Orders: attribution + pricing snapshot columns ────────────────────────
-- fee_mode and promo details are SNAPSHOTTED onto the order at webhook time so
-- reporting stays correct even if the organiser later flips the event's fee
-- mode or deletes the code.
alter table orders
  add column if not exists utm jsonb,               -- {source,medium,campaign,content,term,referrer} first touch
  add column if not exists ref_code text,           -- organiser tracking-link code (event_ref_codes.code)
  add column if not exists session_id text,         -- analytics_events.session_id → funnel joins
  add column if not exists fee_mode text not null default 'pass'
    check (fee_mode in ('pass','absorb')),
  add column if not exists promo_code_id uuid references promo_codes(id) on delete set null,
  add column if not exists discount_cents int not null default 0 check (discount_cents >= 0);

create index if not exists orders_event_ref_idx on orders (event_id, ref_code);

-- ── 2. Organiser tracking links ──────────────────────────────────────────────
-- /e/[slug]?ref=CODE 302s to the event page, sets the first-touch hh_attr
-- cookie and counts the click. Codes are created from the event Marketing tab.
create table if not exists event_ref_codes (
  id uuid primary key default gen_random_uuid(),
  event_id text not null references events(id) on delete cascade,
  business_id uuid not null references businesses(id) on delete cascade,
  code text not null check (char_length(code) between 2 and 32),
  label text,
  clicks int not null default 0,
  created_at timestamptz not null default now(),
  unique (event_id, code)
);

create index if not exists event_ref_codes_business_idx on event_ref_codes (business_id);

alter table event_ref_codes enable row level security;

drop policy if exists event_ref_codes_owner_read on event_ref_codes;
create policy event_ref_codes_owner_read on event_ref_codes for select using (
  exists (
    select 1 from businesses b
    where b.id = event_ref_codes.business_id
      and (b.owner_id = (auth.jwt() ->> 'sub') or b.claimed_by = (auth.jwt() ->> 'sub'))
  )
);
drop policy if exists event_ref_codes_admin_read on event_ref_codes;
create policy event_ref_codes_admin_read on event_ref_codes for select using (public.is_admin());

-- Click counter: service-role only (called by the /e/[slug] route handler),
-- same convention as increment_event_taken (0017/0029).
create or replace function public.increment_ref_click(p_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update event_ref_codes set clicks = clicks + 1 where id = p_id;
$$;

revoke execute on function public.increment_ref_click(uuid) from public;
grant execute on function public.increment_ref_click(uuid) to service_role;

-- ── 3. analytics_events: add the checkout_start funnel step ──────────────────
-- Completes the organiser funnel: page_view (event page) → checkout_start →
-- confirmed order. The CHECK constraint is dropped and re-added with the new
-- value; track_event() (0010) needs no change — it validates via this CHECK.
-- Also admits 'newsletter_signup', which lib/analytics.ts has been emitting all
-- along: the old CHECK rejected it, so those inserts silently failed
-- (fire-and-forget). Same fix, zero code change.
alter table public.analytics_events
  drop constraint if exists analytics_events_event_type_check;
alter table public.analytics_events
  add constraint analytics_events_event_type_check
  check (event_type in ('page_view','impression','listing_view','search','lead_action','checkout_start','newsletter_signup'));
