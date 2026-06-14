-- ============================================================
-- Humble Halal — combined migrations (all, sequential)
-- Paste into Supabase → SQL Editor → Run. Idempotent; safe to re-run.
-- ============================================================
begin;

-- ─────────────────────────────────────────────────────────
-- supabase/migrations/0001_init.sql
-- ─────────────────────────────────────────────────────────
-- Humble Halal — initial schema for payments, ticketing & monetization.
-- Run in the Supabase SQL editor (or `supabase db push`).

-- ── profiles (1:1 with auth.users) ────────────────────────────────────────────
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'user' check (role in ('user','owner','admin')),
  name text,
  created_at timestamptz not null default now()
);

-- ── businesses (replaces seeded listings as source of truth) ──────────────────
create table if not exists businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id) on delete set null,
  slug text unique not null,
  name text not null,
  area text,
  cat_id text,
  plan text not null default 'free',
  featured boolean not null default false,
  stripe_customer_id text,
  created_at timestamptz not null default now()
);

-- ── stripe connect accounts (one per business) ────────────────────────────────
create table if not exists stripe_accounts (
  business_id uuid primary key references businesses(id) on delete cascade,
  stripe_account_id text unique not null,
  charges_enabled boolean not null default false,
  payouts_enabled boolean not null default false,
  details_submitted boolean not null default false,
  updated_at timestamptz not null default now()
);

-- ── events + ticket tiers ─────────────────────────────────────────────────────
create table if not exists events (
  id text primary key,
  business_id uuid references businesses(id) on delete set null,
  slug text unique not null,
  title text not null,
  is_free boolean not null default true,
  capacity int not null default 0,
  taken int not null default 0,
  status text not null default 'published' check (status in ('draft','pending','published','rejected')),
  date_iso date,
  created_at timestamptz not null default now()
);
create table if not exists ticket_tiers (
  id uuid primary key default gen_random_uuid(),
  event_id text references events(id) on delete cascade,
  name text not null,
  price_cents int not null default 0,
  qty int not null default 0,
  sold int not null default 0
);

-- ── orders + tickets ──────────────────────────────────────────────────────────
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  event_id text references events(id) on delete set null,
  business_id uuid references businesses(id) on delete set null,
  buyer_email text,
  buyer_user_id uuid references profiles(id) on delete set null,
  amount_cents int not null default 0,
  fee_cents int not null default 0,
  currency text not null default 'sgd',
  stripe_payment_intent text,
  status text not null default 'confirmed' check (status in ('pending','confirmed','refunded','cancelled')),
  created_at timestamptz not null default now()
);
create table if not exists tickets (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  event_id text references events(id) on delete cascade,
  tier text,
  qr_ref text unique not null,
  status text not null default 'valid' check (status in ('valid','used','refunded','cancelled')),
  created_at timestamptz not null default now()
);

-- ── ad orders / subscriptions ─────────────────────────────────────────────────
create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  stripe_subscription_id text unique,
  plan text,
  status text,
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);
create table if not exists ad_orders (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete set null,
  product text not null,
  amount_cents int not null,
  stripe_payment_intent text,
  status text not null default 'paid',
  created_at timestamptz not null default now()
);

-- ── webhook idempotency ledger ────────────────────────────────────────────────
create table if not exists webhook_events (
  stripe_event_id text primary key,
  received_at timestamptz not null default now()
);

-- ── platform settings (monetization kill-switches, singleton row id=1) ─────────
create table if not exists platform_settings (
  id int primary key default 1,
  paid_tickets_enabled boolean not null default false,
  paid_ads_enabled boolean not null default false,
  paid_plans_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);
insert into platform_settings (id) values (1) on conflict (id) do nothing;

-- ── Row Level Security ────────────────────────────────────────────────────────
alter table profiles enable row level security;
alter table businesses enable row level security;
alter table stripe_accounts enable row level security;
alter table events enable row level security;
alter table ticket_tiers enable row level security;
alter table orders enable row level security;
alter table tickets enable row level security;
alter table subscriptions enable row level security;
alter table ad_orders enable row level security;
alter table platform_settings enable row level security;

-- public can read published events/tiers + the monetization flags
create policy "events public read" on events for select using (status = 'published');
create policy "tiers public read" on ticket_tiers for select using (true);
create policy "businesses public read" on businesses for select using (true);
create policy "settings public read" on platform_settings for select using (true);

-- a business owner can see/manage their own rows
create policy "own business" on businesses for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "own stripe acct" on stripe_accounts for select
  using (business_id in (select id from businesses where owner_id = auth.uid()));
create policy "own orders" on orders for select
  using (business_id in (select id from businesses where owner_id = auth.uid()) or buyer_user_id = auth.uid());

-- profiles: a user sees their own row
create policy "own profile" on profiles for select using (id = auth.uid());

-- NOTE: webhooks/fulfillment use the service-role key, which bypasses RLS.
-- Admin-only writes (platform_settings, approvals) are enforced in API routes
-- by checking profiles.role = 'admin' with the service-role client.


-- ─────────────────────────────────────────────────────────
-- supabase/migrations/0002_directory.sql
-- ─────────────────────────────────────────────────────────
-- Humble Halal — directory build-out: richer business fields, taxonomy,
-- reviews/photos/claims, staging pipeline, halal score. Builds on 0001_init.sql.

-- ── businesses: richer directory fields ──────────────────────────────────────
alter table businesses
  add column if not exists website text,
  add column if not exists socials jsonb default '{}'::jsonb,
  add column if not exists description text,
  add column if not exists price_level text,                  -- $ / $$ / $$$ / $$$$
  add column if not exists photos jsonb default '[]'::jsonb,  -- [{url,caption}]
  add column if not exists opening_hours jsonb default '[]'::jsonb, -- [{day,open,close}]
  add column if not exists lat double precision,
  add column if not exists lng double precision,
  add column if not exists subcategory_id text,
  add column if not exists attributes text[] default '{}',    -- prayer-space, women-friendly, …
  add column if not exists source text default 'manual',      -- nea | owner | community | manual
  add column if not exists provenance jsonb default '{}'::jsonb,
  add column if not exists claimed_by uuid references profiles(id) on delete set null,
  add column if not exists nea_licence_no text,
  add column if not exists muis_cert_no text,
  add column if not exists muis_scheme text,
  add column if not exists muis_expiry date,
  add column if not exists last_verified_at timestamptz,
  add column if not exists status text default 'published'
     check (status in ('staging','pending','published','suspended')),
  add column if not exists halal_tier text,                   -- muis|admin|community|declared|pending|reported
  add column if not exists halal_score int;

-- ── taxonomy ─────────────────────────────────────────────────────────────────
create table if not exists categories (
  id text primary key,
  label text not null,
  icon text,
  blurb text,
  sort int default 0
);
create table if not exists subcategories (
  id text primary key,
  category_id text references categories(id) on delete cascade,
  label text not null
);

-- ── staging (seed pipeline lands here; never public) ─────────────────────────
create table if not exists staging_businesses (
  id uuid primary key default gen_random_uuid(),
  staging_id text unique,                -- e.g. nea-W99288X000
  name text not null,
  slug text,
  address text,
  postal text,
  lat double precision,
  lng double precision,
  nea_licence_no text,
  category_suggested text,
  source text not null default 'nea',
  provenance jsonb default '{}'::jsonb,
  duplicate_of uuid references businesses(id) on delete set null,
  match_confidence numeric,
  review_status text not null default 'new' check (review_status in ('new','reviewing','published','rejected','merged')),
  raw jsonb,
  created_at timestamptz not null default now()
);

create table if not exists import_runs (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  rows int default 0,
  ok boolean default true,
  notes text,
  ran_at timestamptz not null default now()
);

-- ── UGC: reviews, photos, claims, confirmations, offers ──────────────────────
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  user_id uuid references profiles(id) on delete set null,
  rating int not null check (rating between 1 and 5),
  text text,
  photos jsonb default '[]'::jsonb,
  status text not null default 'published' check (status in ('pending','published','flagged','removed')),
  reply text,
  replied_at timestamptz,
  helpful int default 0,
  created_at timestamptz not null default now()
);
create table if not exists photos (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  url text not null,
  caption text,
  uploaded_by uuid references profiles(id) on delete set null,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);
create table if not exists claims (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  user_id uuid references profiles(id) on delete set null,
  role text,
  doc_urls jsonb default '[]'::jsonb,
  message text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);
create table if not exists community_confirmations (
  business_id uuid references businesses(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (business_id, user_id)
);
create table if not exists offers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  title text not null,
  details text,
  starts_at date,
  ends_at date,
  active boolean default true,
  created_at timestamptz not null default now()
);
create table if not exists email_log (
  id uuid primary key default gen_random_uuid(),
  to_email text,
  template text,
  business_id uuid references businesses(id) on delete set null,
  sent_at timestamptz not null default now()
);

-- ── events: submission + status (extends 0001 events) ────────────────────────
alter table events
  add column if not exists submitted_by uuid references profiles(id) on delete set null,
  add column if not exists source text default 'owner'; -- owner | community | curated

-- ── RLS ──────────────────────────────────────────────────────────────────────
alter table categories enable row level security;
alter table subcategories enable row level security;
alter table reviews enable row level security;
alter table photos enable row level security;
alter table claims enable row level security;
alter table offers enable row level security;
alter table staging_businesses enable row level security;
alter table community_confirmations enable row level security;

create policy "categories public read" on categories for select using (true);
create policy "subcategories public read" on subcategories for select using (true);
create policy "reviews public read" on reviews for select using (status = 'published');
create policy "photos public read" on photos for select using (status = 'approved');
create policy "offers public read" on offers for select using (active = true);
create policy "confirm read" on community_confirmations for select using (true);

-- authenticated users write their own UGC
create policy "review write own" on reviews for insert with check (user_id = auth.uid());
create policy "photo write own" on photos for insert with check (uploaded_by = auth.uid());
create policy "claim write own" on claims for insert with check (user_id = auth.uid());
create policy "confirm write own" on community_confirmations for insert with check (user_id = auth.uid());

-- staging is admin-only (service-role via API routes; no public/owner access)
-- NOTE: seed CLI + admin actions use the service-role key, which bypasses RLS.


-- ─────────────────────────────────────────────────────────
-- supabase/migrations/0003_intake.sql
-- ─────────────────────────────────────────────────────────
-- Humble Halal — intake tables for listing reports + community suggestions,
-- plus storage notes. Builds on 0001_init.sql + 0002_directory.sql.
-- Public intake is written server-side with the SERVICE ROLE key (bypasses RLS);
-- only admins can read the queues. Run after 0001 and 0002.

-- ── reports: "report incorrect info" on a listing ───────────────────────────
create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  business_ref text,                                   -- listing id/slug as submitted (text; may be mock or real)
  business_id uuid references businesses(id) on delete set null,
  reason text not null,                                -- halal | closed | hours | address | owner | menu | other
  details text,
  status text not null default 'open'
    check (status in ('open','reviewing','resolved','dismissed')),
  created_at timestamptz not null default now()
);

-- ── suggestions: community "suggest a business" ─────────────────────────────
create table if not exists suggestions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  area text,
  category text,
  note text,
  contact text,
  status text not null default 'pending'
    check (status in ('pending','reviewing','published','rejected')),
  created_at timestamptz not null default now()
);

alter table reports enable row level security;
alter table suggestions enable row level security;

-- Admins read the queues (service role bypasses RLS for inserts/admin actions).
create policy "reports admin read" on reports for select using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
);
create policy "suggestions admin read" on suggestions for select using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- ── Storage (run once, after creating the bucket in the dashboard) ──────────
-- insert into storage.buckets (id, name, public)
--   values ('business-photos','business-photos', true) on conflict do nothing;
-- create policy "photos public read"  on storage.objects for select
--   using (bucket_id = 'business-photos');
-- create policy "photos authed write" on storage.objects for insert
--   with check (bucket_id = 'business-photos' and auth.role() = 'authenticated');


-- ─────────────────────────────────────────────────────────
-- supabase/migrations/0004_automation.sql
-- ─────────────────────────────────────────────────────────
-- Humble Halal — automation support objects for the cron + scheduled jobs.
-- Adds the tables/RPC/view the playbook assumed. Run after 0001–0003.

-- ── verification_log: every cert/freshness event (B1, B2, restamp) ──────────
create table if not exists verification_log (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  event text not null,                 -- cert_expired | reverified | flagged | restamped
  detail text,
  actor uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ── audit_log: admin actions (the verify route already best-effort writes it) ─
create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  actor uuid references profiles(id) on delete set null,
  action text not null,
  target text,
  meta jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ── cron_runs: heartbeat/log for every scheduled job ────────────────────────
create table if not exists cron_runs (
  id uuid primary key default gen_random_uuid(),
  job text not null,
  ok boolean default true,
  notes text,
  ran_at timestamptz not null default now()
);

alter table verification_log enable row level security;
alter table audit_log enable row level security;
alter table cron_runs enable row level security;
drop policy if exists "verlog admin read" on verification_log;
drop policy if exists "audit admin read" on audit_log;
drop policy if exists "cron admin read" on cron_runs;
create policy "verlog admin read" on verification_log for select using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));
create policy "audit admin read" on audit_log for select using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));
create policy "cron admin read" on cron_runs for select using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

-- ── get_directory_stats(): honest homepage numbers (B3) ─────────────────────
create or replace function get_directory_stats()
returns jsonb language sql stable as $$
  select jsonb_build_object(
    'total',        (select count(*) from businesses where status = 'published'),
    'muis',         (select count(*) from businesses where status = 'published' and halal_tier = 'muis'),
    'muslim_owned', (select count(*) from businesses where status = 'published' and 'muslim-owned' = any(attributes)),
    'reviews',      (select count(*) from reviews where status = 'published'),
    'updated_at',   now()
  );
$$;

-- ── category × area counts: flips pages indexable at the threshold (B3) ─────
-- businesses.cat_id is the top-level category (0001); area is the SG town (0001).
create or replace view category_area_counts as
  select cat_id, area, count(*) as n
  from businesses
  where status = 'published'
  group by cat_id, area;


-- ─────────────────────────────────────────────────────────
-- supabase/migrations/0005_leads.sql
-- ─────────────────────────────────────────────────────────
-- Humble Halal — lead capture (concierge / "request a vendor" form).
-- Written by app/api/leads/route.ts via the service-role client (bypasses RLS).
-- Public must NOT read leads; only admins can. Run after 0001–0004.

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  category text,
  area text,
  budget text,
  event_date text,
  details text,
  status text not null default 'new' check (status in ('new','contacted','closed','spam')),
  created_at timestamptz not null default now()
);

alter table leads enable row level security;
drop policy if exists "leads admin read" on leads;
create policy "leads admin read" on leads for select using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));
-- No insert policy: inserts go through the service-role key, which bypasses RLS.


-- ─────────────────────────────────────────────────────────
-- supabase/migrations/0006_travel.sql
-- ─────────────────────────────────────────────────────────
-- Humble Halal — halal travel (LiteAPI) overlay + bookings ledger.
-- LiteAPI supplies hotels; we add a Muslim-friendly OVERLAY (no halal filter
-- exists natively) and record bookings/commissions for our ledger. Run after
-- 0001–0005. LiteAPI is merchant of record (its Payment SDK), so there is NO
-- Stripe here; we just store the booking outcome + commission for reconciliation.

-- ── muslim_friendly_hotels: the overlay keyed by LiteAPI hotel id ────────────
-- Public-readable display data. Auto rows (verified_by='auto') are provisional/
-- "unverified"; an admin/ustaz upgrades them. Writes go through service-role.
create table if not exists muslim_friendly_hotels (
  liteapi_hotel_id text primary key,
  city text,
  country text,
  has_prayer_room boolean default false,
  halal_food_onsite boolean default false,
  halal_food_nearby boolean default false,
  alcohol_free boolean default false,
  no_alcohol_in_room boolean default false,
  women_only_facilities boolean default false,
  qibla_direction boolean default false,
  prayer_mat_available boolean default false,
  near_mosque_m int,                         -- metres to nearest mosque (null = unknown)
  halal_score int,                           -- 0–100 (provisional when verified_by='auto')
  verified_by text not null default 'auto'
    check (verified_by in ('auto','community','ustaz')),
  source_notes text,
  updated_at timestamptz not null default now()
);

-- ── hotel_bookings: outcome of a confirmed LiteAPI booking ──────────────────
create table if not exists hotel_bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete set null,
  liteapi_booking_id text,
  hotel_confirmation_code text,
  liteapi_hotel_id text,
  hotel_name text,
  city text,
  country text,
  checkin date,
  checkout date,
  occupancies jsonb default '[]'::jsonb,
  guest_email text,
  currency text,
  retail_total numeric,
  commission_amount numeric,
  refundable_tag text,
  status text not null default 'confirmed'
    check (status in ('confirmed','cancelled','refunded')),
  muslim_friendly_tags text[] default '{}',
  created_at timestamptz not null default now()
);

-- ── hotel_commissions: our revenue ledger (reconcile vs LiteAPI weekly payout)
create table if not exists hotel_commissions (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references hotel_bookings(id) on delete cascade,
  margin_pct numeric,
  commission_amount numeric,
  currency text,
  payout_status text not null default 'upcoming'
    check (payout_status in ('upcoming','available','paid')),
  payout_date date,
  created_at timestamptz not null default now()
);

alter table muslim_friendly_hotels enable row level security;
alter table hotel_bookings enable row level security;
alter table hotel_commissions enable row level security;

-- Overlay is public display data (read-only to everyone; writes via service-role).
drop policy if exists "mfh public read" on muslim_friendly_hotels;
create policy "mfh public read" on muslim_friendly_hotels for select using (true);

-- A traveller reads their own bookings; admins read all. Writes via service-role.
drop policy if exists "booking owner read" on hotel_bookings;
create policy "booking owner read" on hotel_bookings for select using (
  user_id = auth.uid()
  or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "commission admin read" on hotel_commissions;
create policy "commission admin read" on hotel_commissions for select using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));


-- ─────────────────────────────────────────────────────────
-- supabase/migrations/0007_flights.sql
-- ─────────────────────────────────────────────────────────
-- Humble Halal — flight bookings (LiteAPI). LiteAPI is merchant of record (its
-- Payment SDK / Stripe). The critical invariant: once the customer's card is
-- charged (SDK), the booking MUST be reconciled — a failed /flights/bookings
-- call after capture is NEVER shown as a payment error. We persist such cases as
-- 'confirming' and a retry job re-calls the idempotent book endpoint.
-- Run after 0001–0006.

create table if not exists flight_bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete set null,
  prebook_id text,
  transaction_id text,
  liteapi_booking_id text,
  booking_ref text,
  pnr text,
  origin text,
  destination text,
  depart_date date,
  passengers jsonb default '[]'::jsonb,
  contact_email text,
  currency text,
  total numeric,
  commission_amount numeric,
  -- state machine: confirming = paid, booking not yet confirmed (retry-safe)
  status text not null default 'confirming'
    check (status in ('confirming','confirmed','ticketed','failed','cancelled','refunded')),
  payment_status text,
  retry_count int not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists flight_bookings_retry_idx on flight_bookings (status) where status = 'confirming';

alter table flight_bookings enable row level security;
drop policy if exists "flight owner read" on flight_bookings;
create policy "flight owner read" on flight_bookings for select using (
  user_id = auth.uid()
  or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));
-- Writes go through the service-role key from /api/travel/flights/book.


-- ─────────────────────────────────────────────────────────
-- supabase/migrations/0008_flights_services.sql
-- ─────────────────────────────────────────────────────────
-- Humble Halal — flights v2: round-trip + seats/bags on flight_bookings.
-- Run after 0007_flights.sql. Idempotent.

alter table if exists public.flight_bookings
  add column if not exists trip_type text default 'one',
  add column if not exists itinerary jsonb,
  add column if not exists fare_brand text,
  add column if not exists selected_services jsonb,
  add column if not exists seats jsonb;


-- ─────────────────────────────────────────────────────────
-- supabase/migrations/0009_fare_watches.sql
-- ─────────────────────────────────────────────────────────
-- Humble Halal — flight fare alerts. A traveller watches a route+date and gets an
-- email when the cheapest fare drops. RLS: owners read their own; service role
-- (cron) manages all. Idempotent.

create table if not exists public.fare_watches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  email text not null,
  origin text not null,
  destination text not null,
  depart_date date not null,
  currency text not null default 'SGD',
  last_price numeric,
  active boolean not null default true,
  notify_count int not null default 0,
  last_checked_at timestamptz,
  last_notified_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists fare_watches_active_idx on public.fare_watches (active, depart_date);
-- email is stored already lower-cased by the API, so a plain unique index works
-- with INSERT ... ON CONFLICT (email, origin, destination, depart_date)
create unique index if not exists fare_watches_uniq on public.fare_watches (email, origin, destination, depart_date);

alter table public.fare_watches enable row level security;

drop policy if exists "fare_watches owner read" on public.fare_watches;
create policy "fare_watches owner read" on public.fare_watches
  for select using (auth.uid() = user_id);

drop policy if exists "fare_watches owner insert" on public.fare_watches;
create policy "fare_watches owner insert" on public.fare_watches
  for insert with check (auth.uid() = user_id);


-- ─────────────────────────────────────────────────────────
-- supabase/migrations/0010_analytics.sql
-- ─────────────────────────────────────────────────────────
-- Humble Halal — first-party analytics foundation.
-- Adapted from the "dashboard.zip" package (its missing migrations 001 + part of
-- 002), keyed on LISTING SLUG (our live directory renders static listings by
-- slug; lib/directory.ts) rather than a businesses.id uuid. A nullable
-- listing_id uuid is kept for future wiring to businesses as source of truth.
-- Run after 0001–0009.
--
-- Security model (why the public anon key is safe):
--   * The anon key can only INSERT events, and only through track_event() — a
--     SECURITY DEFINER function. It can never SELECT analytics_events.
--   * Reads require an authenticated admin (profiles.role='admin'), enforced by
--     RLS via is_admin() and re-checked inside every admin RPC (0011).

-- ── is_admin(): reused by RLS, the admin RPCs (0011) and share tokens (0012) ──
-- Mirrors the inline check already used in 0005_leads.sql, as a reusable fn.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ── analytics_events: the raw event log ─────────────────────────────────────
create table if not exists public.analytics_events (
  id               uuid primary key default gen_random_uuid(),
  session_id       text,
  event_type       text not null
    check (event_type in ('page_view','impression','listing_view','search','lead_action')),
  lead_action_type text
    check (lead_action_type in ('enquiry_form','whatsapp','call','website','directions','shortlist')),
  listing_slug     text,
  listing_id       uuid,                       -- reserved for future businesses.id wiring
  category         text,
  query            text,
  path             text,
  referrer         text,
  created_at       timestamptz not null default now()
);

create index if not exists idx_ae_created  on public.analytics_events (created_at);
create index if not exists idx_ae_slug     on public.analytics_events (listing_slug);
create index if not exists idx_ae_type     on public.analytics_events (event_type);
create index if not exists idx_ae_session  on public.analytics_events (session_id);

alter table public.analytics_events enable row level security;

-- Admin-only SELECT. No insert/update/delete policy → writes go solely through
-- track_event() (SECURITY DEFINER) or the service-role key.
drop policy if exists "analytics admin read" on public.analytics_events;
create policy "analytics admin read" on public.analytics_events
  for select to authenticated using ( public.is_admin() );

-- ── track_event(): the ONLY write path for the anon key ─────────────────────
create or replace function public.track_event(
  p_event_type       text,
  p_session_id       text default null,
  p_lead_action_type text default null,
  p_listing_slug     text default null,
  p_category         text default null,
  p_query            text default null,
  p_path             text default null,
  p_referrer         text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.analytics_events
    (event_type, session_id, lead_action_type, listing_slug, category, query, path, referrer)
  values
    (p_event_type, p_session_id, p_lead_action_type, p_listing_slug, p_category,
     nullif(p_query, ''), p_path, p_referrer);
end;
$$;

revoke all on function public.track_event(text,text,text,text,text,text,text,text) from public;
grant execute on function public.track_event(text,text,text,text,text,text,text,text) to anon, authenticated;

-- ── Reporting views (column names are CONTRACTS with the dashboard UI) ───────

-- Daily lead actions, day-bucketed in Singapore time. Filtered client-side by day.
create or replace view public.v_daily_lead_actions as
select
  (created_at at time zone 'Asia/Singapore')::date as day,
  lead_action_type,
  category,
  count(*)::bigint as actions
from public.analytics_events
where event_type = 'lead_action' and lead_action_type is not null
group by 1, 2, 3;

-- Per-vendor (per-slug) scorecard, all-time. listing_id is aliased to the slug
-- so the dashboard's VendorRow.listing_id works unchanged; vendor_name joins the
-- businesses table by slug and falls back to the slug.
create or replace view public.v_vendor_leads as
select
  e.listing_slug                                            as listing_id,
  coalesce(b.name, e.listing_slug)                          as vendor_name,
  max(e.category)                                           as category,
  count(*) filter (where e.lead_action_type = 'enquiry_form')::bigint as enquiries,
  count(*) filter (where e.lead_action_type = 'whatsapp')::bigint     as whatsapp_clicks,
  count(*) filter (where e.lead_action_type = 'call')::bigint         as calls,
  count(*) filter (where e.lead_action_type = 'website')::bigint      as website_clicks,
  count(*) filter (where e.lead_action_type = 'directions')::bigint   as directions,
  count(*) filter (where e.lead_action_type = 'shortlist')::bigint    as shortlists,
  count(*) filter (where e.event_type = 'listing_view')::bigint       as listing_views,
  count(*) filter (where e.event_type = 'impression')::bigint         as impressions,
  max(e.created_at)                                         as last_event_at
from public.analytics_events e
left join public.businesses b on b.slug = e.listing_slug
where e.listing_slug is not null
group by e.listing_slug, b.name;

-- Top search queries + how many converted (searched then led to any lead action
-- in the same session). All-time; the dashboard limits to 25.
create or replace view public.v_search_intelligence as
with searches as (
  select query, session_id
  from public.analytics_events
  where event_type = 'search' and query is not null
),
converters as (
  select distinct session_id
  from public.analytics_events
  where event_type = 'lead_action'
)
select
  s.query,
  count(*)::bigint as searches,
  count(*) filter (where c.session_id is not null)::bigint as searches_that_converted
from searches s
left join converters c on c.session_id = s.session_id
group by s.query;

-- First path + start time per session (entry point).
create or replace view public.v_session_entry as
select distinct on (session_id)
  session_id,
  path                          as entry_path,
  created_at                    as session_start
from public.analytics_events
where session_id is not null
order by session_id, created_at asc;


-- ─────────────────────────────────────────────────────────
-- supabase/migrations/0011_analytics_admin_rpcs.sql
-- ─────────────────────────────────────────────────────────
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


-- ─────────────────────────────────────────────────────────
-- supabase/migrations/0012_vendor_share_links.sql
-- ─────────────────────────────────────────────────────────
-- Humble Halal — shareable per-vendor scorecard links (adapted from
-- dashboard.zip's 003). A vendor opens /scorecard/<token> and sees ONLY their
-- own numbers, no login. Keyed on LISTING SLUG (see 0010), and uses the shared
-- is_admin() helper. Run after 0010–0011.
--
-- Security model:
--   * Each token maps to exactly one listing_slug.
--   * vendor_scorecard_by_token(token,…) resolves the slug and returns only that
--     listing's aggregates — never another vendor's, never session-level rows.
--   * Tokens are revocable (active flag) and optionally expire.
--   * analytics_events stays admin-only (0010).

create table if not exists public.vendor_share_tokens (
  token        text primary key default encode(gen_random_bytes(18), 'hex'),
  listing_slug text not null,
  vendor_name  text not null,
  category     text,
  active       boolean not null default true,
  expires_at   timestamptz,                 -- null = never
  created_at   timestamptz not null default now(),
  last_viewed  timestamptz
);

create index if not exists idx_vst_slug on public.vendor_share_tokens (listing_slug);

alter table public.vendor_share_tokens enable row level security;

-- Only admins can list/create/manage tokens directly.
drop policy if exists "admins manage tokens" on public.vendor_share_tokens;
create policy "admins manage tokens"
  on public.vendor_share_tokens
  for all
  to authenticated
  using ( public.is_admin() )
  with check ( public.is_admin() );

-- Admin helper: mint a token for a listing slug.
create or replace function public.admin_create_share_token(
  p_listing_slug text,
  p_vendor_name  text,
  p_category     text default null,
  p_expires_at   timestamptz default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare v_token text;
begin
  if not public.is_admin() then
    raise exception 'admin only';
  end if;
  insert into public.vendor_share_tokens (listing_slug, vendor_name, category, expires_at)
  values (p_listing_slug, p_vendor_name, p_category, p_expires_at)
  returning token into v_token;
  return v_token;
end;
$$;

revoke all on function public.admin_create_share_token(text,text,text,timestamptz) from public;
grant execute on function public.admin_create_share_token(text,text,text,timestamptz) to authenticated;

-- Public RPC: vendor scorecard by token, scoped to one date window.
-- Returns ONLY aggregate counts for the one listing the token maps to.
create or replace function public.vendor_scorecard_by_token(
  p_token text,
  p_from  timestamptz,
  p_to    timestamptz
)
returns table (
  vendor_name      text,
  category         text,
  enquiries        bigint,
  whatsapp_clicks  bigint,
  calls            bigint,
  website_clicks   bigint,
  directions       bigint,
  shortlists       bigint,
  listing_views    bigint,
  impressions      bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_slug text;
  v_name text;
  v_cat  text;
begin
  select listing_slug, vendor_name, category
    into v_slug, v_name, v_cat
  from public.vendor_share_tokens
  where token = p_token
    and active = true
    and (expires_at is null or expires_at > now());

  if v_slug is null then
    raise exception 'invalid or expired token';
  end if;

  update public.vendor_share_tokens set last_viewed = now() where token = p_token;

  return query
  select
    v_name, v_cat,
    count(*) filter (where lead_action_type = 'enquiry_form')::bigint,
    count(*) filter (where lead_action_type = 'whatsapp')::bigint,
    count(*) filter (where lead_action_type = 'call')::bigint,
    count(*) filter (where lead_action_type = 'website')::bigint,
    count(*) filter (where lead_action_type = 'directions')::bigint,
    count(*) filter (where lead_action_type = 'shortlist')::bigint,
    count(*) filter (where event_type = 'listing_view')::bigint,
    count(*) filter (where event_type = 'impression')::bigint
  from public.analytics_events
  where listing_slug = v_slug
    and created_at >= p_from and created_at < p_to;
end;
$$;

revoke all on function public.vendor_scorecard_by_token(text,timestamptz,timestamptz) from public;
grant execute on function public.vendor_scorecard_by_token(text,timestamptz,timestamptz) to anon, authenticated;


-- ─────────────────────────────────────────────────────────
-- supabase/migrations/0013_owner_analytics.sql
-- ─────────────────────────────────────────────────────────
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


-- ─────────────────────────────────────────────────────────
-- supabase/migrations/0014_events_display.sql
-- ─────────────────────────────────────────────────────────
-- Humble Halal — make DB events renderable by the rich EventItem UI.
-- The 0001/0002 events table is minimal (id, slug, title, capacity, taken,
-- is_free, date_iso, business_id, status). The UI's EventItem also needs display
-- fields (category, image, time/date labels, venue, area, organiser, blurb,
-- tags, priceFrom, tiers, …). Rather than 18 columns, we store those extras in a
-- single `display` jsonb the events data-seam merges over the structural columns.
-- Run after 0013. Idempotent.

alter table if exists public.events
  add column if not exists display jsonb not null default '{}'::jsonb;


-- ─────────────────────────────────────────────────────────
-- supabase/migrations/0015_owner_reviews.sql
-- ─────────────────────────────────────────────────────────
-- Humble Halal — owner review management (Phase 1).
-- Lets a business owner see ALL reviews on their listings (incl. pending) and
-- reply to them. Both RPCs are SECURITY DEFINER but hard-scoped to listings the
-- caller owns (businesses.owner_id / claimed_by = auth.uid()). Run after 0013.
-- (0014 is reserved for the separate events-display work.)

-- All reviews for the caller's listings, newest first.
create or replace function public.owner_reviews()
returns table (
  id            uuid,
  listing_slug  text,
  business_name text,
  rating        int,
  text          text,
  reply         text,
  status        text,
  created_at    timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select r.id, b.slug, b.name, r.rating, r.text, r.reply, r.status, r.created_at
  from public.reviews r
  join public.businesses b on b.id = r.business_id
  where b.owner_id = auth.uid() or b.claimed_by = auth.uid()
  order by r.created_at desc;
$$;

revoke all on function public.owner_reviews() from public;
grant execute on function public.owner_reviews() to authenticated;

-- Reply to one review — only if it belongs to a listing the caller owns.
create or replace function public.owner_reply_to_review(
  p_review_id uuid,
  p_reply     text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.reviews
     set reply = p_reply, replied_at = now()
   where id = p_review_id
     and business_id in (
       select id from public.businesses
       where owner_id = auth.uid() or claimed_by = auth.uid()
     );
  if not found then
    raise exception 'not your review';
  end if;
end;
$$;

revoke all on function public.owner_reply_to_review(uuid, text) from public;
grant execute on function public.owner_reply_to_review(uuid, text) to authenticated;


-- ─────────────────────────────────────────────────────────
-- supabase/migrations/0016_event_payouts.sql
-- ─────────────────────────────────────────────────────────
-- Humble Halal — event-ticket payouts (separate charges + transfers).
-- We take a SEPARATE charge for the buyer on the platform (face + booking fee),
-- hold the funds, and a cron transfers the organiser's net (face value) to their
-- Connect account 24h after the event ends. These columns track that payout on
-- the existing orders table. Run after 0015. Idempotent (only ALTERs `orders`).

alter table if exists public.orders
  add column if not exists connected_account_id text,            -- organiser's acct_… (destination)
  add column if not exists net_cents int,                        -- organiser's share to transfer (subtotal)
  add column if not exists payout_status text not null default 'none'
    check (payout_status in ('none','pending','paid','skipped','failed')),
  add column if not exists payout_due date,                      -- event end date + 1 day
  add column if not exists stripe_transfer_id text,
  add column if not exists buyer_name text,
  add column if not exists qty int;

-- cron scans for due, unpaid payouts
create index if not exists orders_payout_due_idx on public.orders (payout_status, payout_due)
  where payout_status = 'pending';


-- ─────────────────────────────────────────────────────────
-- supabase/migrations/0017_rls_hardening.sql
-- ─────────────────────────────────────────────────────────
-- Humble Halal — RLS hardening (security audit H1/H2).
-- Three tables were created without row level security and never enabled in a
-- later migration. In Supabase a table with RLS OFF is fully readable/writable
-- through the public anon key (NEXT_PUBLIC_SUPABASE_ANON_KEY ships to the
-- browser), so this closes:
--   * email_log     — recipient email addresses (PII / PDPA exposure).
--   * webhook_events— Stripe idempotency ledger (anon could read processed event
--                     ids, or INSERT rows to poison idempotency → drop a real
--                     webhook as a "duplicate").
--   * import_runs   — operational import provenance/metadata.
-- All three are written exclusively via the service-role client (bypasses RLS),
-- so enabling RLS with admin-only SELECT and NO insert/update/delete policy
-- keeps writes working while making anon access impossible. Run after 0016.
-- Idempotent. Uses the shared public.is_admin() helper (0010).

alter table if exists public.email_log      enable row level security;
alter table if exists public.webhook_events enable row level security;
alter table if exists public.import_runs    enable row level security;

drop policy if exists "email_log admin read" on public.email_log;
create policy "email_log admin read" on public.email_log
  for select to authenticated using ( public.is_admin() );

drop policy if exists "webhook_events admin read" on public.webhook_events;
create policy "webhook_events admin read" on public.webhook_events
  for select to authenticated using ( public.is_admin() );

drop policy if exists "import_runs admin read" on public.import_runs;
create policy "import_runs admin read" on public.import_runs
  for select to authenticated using ( public.is_admin() );

-- No INSERT/UPDATE/DELETE policies by design: every writer uses the service-role
-- client, which bypasses RLS. Anon/authenticated therefore cannot write.

-- ── Atomic ticket-capacity counter (security audit M2) ──────────────────────
-- The Stripe webhook previously did read-then-write on events.taken, which loses
-- updates when two ticket purchases settle concurrently (both read N, both write
-- N+qty). This increments in a single statement so the sold count stays accurate.
-- Records actual sales (no capacity clamp here — the buyer already paid; oversell
-- is prevented up-front at checkout). Service-role calls it; definer + pinned
-- search_path keep it safe.
create or replace function public.increment_event_taken(p_event_id text, p_qty int)
returns int
language sql
security definer
set search_path = public
as $$
  update public.events
     set taken = taken + greatest(p_qty, 0)
   where id = p_event_id
  returning taken;
$$;


-- ─────────────────────────────────────────────────────────
-- supabase/migrations/0018_admin_users.sql
-- ─────────────────────────────────────────────────────────
-- Humble Halal — admin user directory RPC.
-- Lets the admin console list real users (auth.users + their profile role/name)
-- instead of a hardcoded demo table. SECURITY DEFINER so it can read auth.users,
-- guarded by is_admin() (0010) so only admins get anything. Run after 0017.
-- Idempotent.

create or replace function public.admin_list_users(p_limit int default 200)
returns table (
  id         uuid,
  email      text,
  name       text,
  role       text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_admin() then
    raise exception 'admin only';
  end if;
  return query
    select u.id, u.email::text, p.name, coalesce(p.role, 'user'), u.created_at
    from auth.users u
    left join public.profiles p on p.id = u.id
    order by u.created_at desc
    limit greatest(1, least(p_limit, 1000));
end;
$$;

revoke all on function public.admin_list_users(int) from public;
grant execute on function public.admin_list_users(int) to authenticated;

commit;
