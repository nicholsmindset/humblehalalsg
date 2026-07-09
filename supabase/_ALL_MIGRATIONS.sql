-- ============================================================
-- Humble Halal — combined Supabase migrations (full, sequential)
-- Generated from supabase/migrations/*.sql in numeric order.
-- Paste into Supabase SQL Editor or run with psql against the target project.
-- Re-runnable: CREATE POLICY statements are preceded by DROP POLICY IF EXISTS.
-- Clerk-safe: pre-0031 auth.uid() checks are rewritten to auth.jwt()->>sub with text casts.
-- Do not wrap this whole file in BEGIN/COMMIT: 0031_clerk_auth.sql has its own transaction.
-- ============================================================


-- ============================================================
-- supabase/migrations/0001_init.sql
-- ============================================================

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
drop policy if exists "events public read" on events;
create policy "events public read" on events for select using (status = 'published');
drop policy if exists "tiers public read" on ticket_tiers;
create policy "tiers public read" on ticket_tiers for select using (true);
drop policy if exists "businesses public read" on businesses;
create policy "businesses public read" on businesses for select using (true);
drop policy if exists "settings public read" on platform_settings;
create policy "settings public read" on platform_settings for select using (true);

-- a business owner can see/manage their own rows
drop policy if exists "own business" on businesses;
create policy "own business" on businesses for all
  using (owner_id::text = (auth.jwt() ->> 'sub')) with check (owner_id::text = (auth.jwt() ->> 'sub'));
drop policy if exists "own stripe acct" on stripe_accounts;
create policy "own stripe acct" on stripe_accounts for select
  using (business_id in (select id from businesses where owner_id::text = (auth.jwt() ->> 'sub')));
drop policy if exists "own orders" on orders;
create policy "own orders" on orders for select
  using (business_id in (select id from businesses where owner_id::text = (auth.jwt() ->> 'sub')) or buyer_user_id::text = (auth.jwt() ->> 'sub'));

-- profiles: a user sees their own row
drop policy if exists "own profile" on profiles;
create policy "own profile" on profiles for select using (id::text = (auth.jwt() ->> 'sub'));

-- NOTE: webhooks/fulfillment use the service-role key, which bypasses RLS.
-- Admin-only writes (platform_settings, approvals) are enforced in API routes
-- by checking profiles.role = 'admin' with the service-role client.

-- ============================================================
-- supabase/migrations/0002_directory.sql
-- ============================================================

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

drop policy if exists "categories public read" on categories;
create policy "categories public read" on categories for select using (true);
drop policy if exists "subcategories public read" on subcategories;
create policy "subcategories public read" on subcategories for select using (true);
drop policy if exists "reviews public read" on reviews;
create policy "reviews public read" on reviews for select using (status = 'published');
drop policy if exists "photos public read" on photos;
create policy "photos public read" on photos for select using (status = 'approved');
drop policy if exists "offers public read" on offers;
create policy "offers public read" on offers for select using (active = true);
drop policy if exists "confirm read" on community_confirmations;
create policy "confirm read" on community_confirmations for select using (true);

-- authenticated users write their own UGC
drop policy if exists "review write own" on reviews;
create policy "review write own" on reviews for insert with check (user_id::text = (auth.jwt() ->> 'sub'));
drop policy if exists "photo write own" on photos;
create policy "photo write own" on photos for insert with check (uploaded_by::text = (auth.jwt() ->> 'sub'));
drop policy if exists "claim write own" on claims;
create policy "claim write own" on claims for insert with check (user_id::text = (auth.jwt() ->> 'sub'));
drop policy if exists "confirm write own" on community_confirmations;
create policy "confirm write own" on community_confirmations for insert with check (user_id::text = (auth.jwt() ->> 'sub'));

-- staging is admin-only (service-role via API routes; no public/owner access)
-- NOTE: seed CLI + admin actions use the service-role key, which bypasses RLS.

-- ============================================================
-- supabase/migrations/0003_intake.sql
-- ============================================================

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
drop policy if exists "reports admin read" on reports;
create policy "reports admin read" on reports for select using (
  exists (select 1 from profiles p where p.id::text = (auth.jwt() ->> 'sub') and p.role = 'admin')
);
drop policy if exists "suggestions admin read" on suggestions;
create policy "suggestions admin read" on suggestions for select using (
  exists (select 1 from profiles p where p.id::text = (auth.jwt() ->> 'sub') and p.role = 'admin')
);

-- ── Storage (run once, after creating the bucket in the dashboard) ──────────
-- insert into storage.buckets (id, name, public)
--   values ('business-photos','business-photos', true) on conflict do nothing;
-- create policy "photos public read"  on storage.objects for select
--   using (bucket_id = 'business-photos');
-- create policy "photos authed write" on storage.objects for insert
--   with check (bucket_id = 'business-photos' and auth.role() = 'authenticated');

-- ============================================================
-- supabase/migrations/0004_automation.sql
-- ============================================================

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
drop policy if exists "verlog admin read" on verification_log;
create policy "verlog admin read" on verification_log for select using (
  exists (select 1 from profiles p where p.id::text = (auth.jwt() ->> 'sub') and p.role = 'admin'));
drop policy if exists "audit admin read" on audit_log;
create policy "audit admin read" on audit_log for select using (
  exists (select 1 from profiles p where p.id::text = (auth.jwt() ->> 'sub') and p.role = 'admin'));
drop policy if exists "cron admin read" on cron_runs;
create policy "cron admin read" on cron_runs for select using (
  exists (select 1 from profiles p where p.id::text = (auth.jwt() ->> 'sub') and p.role = 'admin'));

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

-- ============================================================
-- supabase/migrations/0005_leads.sql
-- ============================================================

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
  exists (select 1 from profiles p where p.id::text = (auth.jwt() ->> 'sub') and p.role = 'admin'));
-- No insert policy: inserts go through the service-role key, which bypasses RLS.

-- ============================================================
-- supabase/migrations/0006_travel.sql
-- ============================================================

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
  user_id::text = (auth.jwt() ->> 'sub')
  or exists (select 1 from profiles p where p.id::text = (auth.jwt() ->> 'sub') and p.role = 'admin'));

drop policy if exists "commission admin read" on hotel_commissions;
create policy "commission admin read" on hotel_commissions for select using (
  exists (select 1 from profiles p where p.id::text = (auth.jwt() ->> 'sub') and p.role = 'admin'));

-- ============================================================
-- supabase/migrations/0007_flights.sql
-- ============================================================

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
  user_id::text = (auth.jwt() ->> 'sub')
  or exists (select 1 from profiles p where p.id::text = (auth.jwt() ->> 'sub') and p.role = 'admin'));
-- Writes go through the service-role key from /api/travel/flights/book.

-- ============================================================
-- supabase/migrations/0008_flights_services.sql
-- ============================================================

-- Humble Halal — flights v2: round-trip + seats/bags on flight_bookings.
-- Run after 0007_flights.sql. Idempotent.

alter table if exists public.flight_bookings
  add column if not exists trip_type text default 'one',
  add column if not exists itinerary jsonb,
  add column if not exists fare_brand text,
  add column if not exists selected_services jsonb,
  add column if not exists seats jsonb;

-- ============================================================
-- supabase/migrations/0009_fare_watches.sql
-- ============================================================

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
  for select using ((auth.jwt() ->> 'sub') = user_id::text);

drop policy if exists "fare_watches owner insert" on public.fare_watches;
create policy "fare_watches owner insert" on public.fare_watches
  for insert with check ((auth.jwt() ->> 'sub') = user_id::text);

-- ============================================================
-- supabase/migrations/0010_analytics.sql
-- ============================================================

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
    where p.id::text = (auth.jwt() ->> 'sub') and p.role = 'admin'
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

-- ============================================================
-- supabase/migrations/0011_analytics_admin_rpcs.sql
-- ============================================================

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

-- ============================================================
-- supabase/migrations/0012_vendor_share_links.sql
-- ============================================================

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

-- ============================================================
-- supabase/migrations/0013_owner_analytics.sql
-- ============================================================

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
    where b.owner_id::text = (auth.jwt() ->> 'sub') or b.claimed_by::text = (auth.jwt() ->> 'sub')
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

-- ============================================================
-- supabase/migrations/0014_events_display.sql
-- ============================================================

-- Humble Halal — make DB events renderable by the rich EventItem UI.
-- The 0001/0002 events table is minimal (id, slug, title, capacity, taken,
-- is_free, date_iso, business_id, status). The UI's EventItem also needs display
-- fields (category, image, time/date labels, venue, area, organiser, blurb,
-- tags, priceFrom, tiers, …). Rather than 18 columns, we store those extras in a
-- single `display` jsonb the events data-seam merges over the structural columns.
-- Run after 0013. Idempotent.

alter table if exists public.events
  add column if not exists display jsonb not null default '{}'::jsonb;

-- ============================================================
-- supabase/migrations/0015_owner_reviews.sql
-- ============================================================

-- Humble Halal — owner review management (Phase 1).
-- Lets a business owner see ALL reviews on their listings (incl. pending) and
-- reply to them. Both RPCs are SECURITY DEFINER but hard-scoped to listings the
-- caller owns (businesses.owner_id / claimed_by::text = (auth.jwt() ->> 'sub')). Run after 0013.
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
  where b.owner_id::text = (auth.jwt() ->> 'sub') or b.claimed_by::text = (auth.jwt() ->> 'sub')
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
       where owner_id::text = (auth.jwt() ->> 'sub') or claimed_by::text = (auth.jwt() ->> 'sub')
     );
  if not found then
    raise exception 'not your review';
  end if;
end;
$$;

revoke all on function public.owner_reply_to_review(uuid, text) from public;
grant execute on function public.owner_reply_to_review(uuid, text) to authenticated;

-- ============================================================
-- supabase/migrations/0016_event_payouts.sql
-- ============================================================

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

-- ============================================================
-- supabase/migrations/0017_rls_hardening.sql
-- ============================================================

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

-- ============================================================
-- supabase/migrations/0018_admin_users.sql
-- ============================================================

-- Humble Halal — admin user directory RPC.
-- Lets the admin console list real users (auth.users + their profile role/name)
-- instead of a hardcoded demo table. SECURITY DEFINER so it can read auth.users,
-- guarded by is_admin() (0010) so only admins get anything. Run after 0017.
-- Idempotent.

drop function if exists public.admin_list_users(int);
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

-- ============================================================
-- supabase/migrations/0019_donations.sql
-- ============================================================

-- 0019_donations.sql — Zakat / sadaqah donations for charity events.
-- Donations are charged on the platform (separate from ticket entry). Each paid
-- donation is recorded here; the running total is mirrored into events.display
-- (donationRaisedCents) by the Stripe webhook so the public detail page can show
-- an HONEST figure without exposing donor PII. Raw rows are admin-only.

create table if not exists donations (
  id uuid primary key default gen_random_uuid(),
  event_id text references events(id) on delete set null,
  amount_cents int not null check (amount_cents >= 0),
  currency text not null default 'sgd',
  donor_name text,
  donor_email text,
  anonymous boolean not null default true,
  stripe_payment_intent text unique,
  status text not null default 'paid' check (status in ('pending', 'paid', 'refunded')),
  created_at timestamptz not null default now()
);

create index if not exists donations_event_idx on donations (event_id);

alter table donations enable row level security;

-- No anon/authenticated access to raw donation rows (donor PII). The Stripe
-- webhook writes via the service role (which bypasses RLS); admins read via the
-- service-role admin client. Public totals come from events.display, not here.
drop policy if exists donations_admin_read on donations;
create policy donations_admin_read on donations
  for select using (public.is_admin());

-- ============================================================
-- supabase/migrations/0020_ticket_checkin.sql
-- ============================================================

-- 0020_ticket_checkin.sql — event check-in (QR scan) support.
-- A ticket flips 'valid' → 'used' when scanned at the door. We record WHEN and
-- WHO checked it in for the organiser's roster/audit. Re-scanning a 'used' (or
-- refunded/cancelled) ticket is rejected by the check-in API.

alter table tickets add column if not exists checked_in_at timestamptz;
alter table tickets add column if not exists checked_in_by uuid references auth.users(id) on delete set null;

create index if not exists tickets_event_status_idx on tickets (event_id, status);

-- ============================================================
-- supabase/migrations/0021_follows_event_reviews.sql
-- ============================================================

-- 0021_follows_event_reviews.sql — Epic E: organiser follows + event ratings.

-- ── Organiser follows ─────────────────────────────────────────────────────────
-- A user follows a business (organiser) to keep up with their events.
create table if not exists organizer_follows (
  user_id uuid references profiles(id) on delete cascade,
  business_id uuid references businesses(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, business_id)
);
alter table organizer_follows enable row level security;
-- Users manage only their own follows.
drop policy if exists follows_select_own on organizer_follows;
create policy follows_select_own on organizer_follows for select using ((auth.jwt() ->> 'sub') = user_id::text);
drop policy if exists follows_insert_own on organizer_follows;
create policy follows_insert_own on organizer_follows for insert with check ((auth.jwt() ->> 'sub') = user_id::text);
drop policy if exists follows_delete_own on organizer_follows;
create policy follows_delete_own on organizer_follows for delete using ((auth.jwt() ->> 'sub') = user_id::text);

-- Public follower counts (no PII) via a SECURITY DEFINER function.
create or replace function public.follower_count(p_business_id uuid)
returns int language sql stable security definer set search_path = public as $$
  select count(*)::int from organizer_follows where business_id = p_business_id;
$$;

-- ── Event ratings ─────────────────────────────────────────────────────────────
-- Attendee ratings for events (moderated, like business reviews). Honest: only
-- published rows count toward the public average, and we never fabricate one.
create table if not exists event_reviews (
  id uuid primary key default gen_random_uuid(),
  event_id text references events(id) on delete cascade,
  author_id uuid references profiles(id) on delete set null,
  author_name text,
  rating int not null check (rating between 1 and 5),
  text text,
  status text not null default 'pending' check (status in ('pending', 'published', 'rejected')),
  created_at timestamptz not null default now()
);
create index if not exists event_reviews_event_idx on event_reviews (event_id, status);
alter table event_reviews enable row level security;
-- No anon access to raw rows (moderation queue). Reads go through the API
-- (service role) / the published view below; writes go through the API.
drop policy if exists event_reviews_admin_read on event_reviews;
create policy event_reviews_admin_read on event_reviews for select using (public.is_admin());

-- Published reviews keyed by event slug (for detail pages).
create or replace view public.v_event_reviews_public as
  select er.id, er.event_id, e.slug as event_slug, er.rating, er.text, er.author_name, er.created_at
  from event_reviews er
  join events e on e.id = er.event_id
  where er.status = 'published';

-- Aggregate rating per event (published only).
create or replace view public.v_event_rating as
  select event_id,
         round(avg(rating)::numeric, 1) as avg_rating,
         count(*)::int as review_count
  from event_reviews
  where status = 'published'
  group by event_id;

-- ============================================================
-- supabase/migrations/0022_ramadan_mode.sql
-- ============================================================

-- 0022_ramadan_mode.sql — admin-controlled Ramadan mode.
-- When ON, the public site surfaces the Ramadan affordance (iftar / open-late /
-- bazaars). Admins flip it for the season from the admin console; it is read
-- server-side and hydrated to the client so every visitor sees it consistently.
alter table platform_settings add column if not exists ramadan_mode_enabled boolean not null default false;

-- ============================================================
-- supabase/migrations/0023_ads.sql
-- ============================================================

-- 0023_ads.sql — Phase 2: sponsored-ad sales + tracking (admin-operated).
-- Inventory (placements/rate-card) → campaigns (a sponsor's booking) → events
-- (impressions/clicks). Honest: performance is computed from real events only.

-- ── Inventory / rate card ─────────────────────────────────────────────────────
create table if not exists ad_placements (
  key text primary key,                 -- e.g. 'homepage_hero'
  label text not null,
  monthly_rate_cents int not null default 0,
  inventory_cap int not null default 1, -- max concurrent active campaigns
  active boolean not null default true,
  sort int not null default 0
);

-- ── Campaigns (a sponsor's booking on a placement) ────────────────────────────
create table if not exists ad_campaigns (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete set null,
  advertiser_name text,                 -- shown when the advertiser isn't a listed business
  placement_key text references ad_placements(key) on delete restrict,
  title text not null,                  -- creative headline
  body text,
  image_url text,
  target_url text,                      -- internal slug or external url
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'active', 'paused', 'ended')),
  starts_on date,
  ends_on date,
  rate_cents int not null default 0,    -- agreed price
  budget_cents int,
  notes text,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists ad_campaigns_placement_idx on ad_campaigns (placement_key, status);
create index if not exists ad_campaigns_business_idx on ad_campaigns (business_id);

-- ── Impression / click events ─────────────────────────────────────────────────
create table if not exists ad_events (
  id bigint generated always as identity primary key,
  campaign_id uuid references ad_campaigns(id) on delete cascade,
  placement_key text,
  kind text not null check (kind in ('impression', 'click')),
  session_id text,
  created_at timestamptz not null default now()
);
create index if not exists ad_events_campaign_idx on ad_events (campaign_id, kind);
create index if not exists ad_events_created_idx on ad_events (created_at);

-- ── RLS ───────────────────────────────────────────────────────────────────────
alter table ad_placements enable row level security;
alter table ad_campaigns enable row level security;
alter table ad_events enable row level security;
-- Placements are public (needed to render the rate card / slots).
drop policy if exists ad_placements_read on ad_placements;
create policy ad_placements_read on ad_placements for select using (true);
-- Campaigns: admins see all; a business owner sees their own (advertiser report).
drop policy if exists ad_campaigns_read on ad_campaigns;
create policy ad_campaigns_read on ad_campaigns for select using (
  public.is_admin() or business_id in (
    select id from businesses where owner_id::text = (auth.jwt() ->> 'sub') or claimed_by::text = (auth.jwt() ->> 'sub')
  )
);
-- Raw events: admin only (writes go through the SECURITY DEFINER RPC below).
drop policy if exists ad_events_admin on ad_events;
create policy ad_events_admin on ad_events for select using (public.is_admin());

-- Anonymous impression/click tracking (write-only, validated).
create or replace function public.track_ad_event(p_campaign uuid, p_placement text, p_kind text, p_session text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_kind not in ('impression', 'click') then return; end if;
  insert into ad_events (campaign_id, placement_key, kind, session_id)
  values (p_campaign, p_placement, p_kind, left(coalesce(p_session, ''), 64));
end;
$$;

-- ── Performance aggregate (real events only) ──────────────────────────────────
create or replace view public.v_campaign_performance as
  select c.id as campaign_id, c.title, c.placement_key, c.status, c.business_id, c.advertiser_name,
         c.rate_cents, c.starts_on, c.ends_on,
         coalesce(sum((e.kind = 'impression')::int), 0)::int as impressions,
         coalesce(sum((e.kind = 'click')::int), 0)::int as clicks
  from ad_campaigns c
  left join ad_events e on e.campaign_id = c.id
  group by c.id;

-- ── Seed the rate card (mirrors the Advertise page products) ──────────────────
insert into ad_placements (key, label, monthly_rate_cents, inventory_cap, sort) values
  ('homepage_hero',     'Homepage Spotlight',     45000, 1, 1),
  ('category_featured', 'Category Sponsorship',   30000, 3, 2),
  ('directory_inline',  'Featured Listing',        8900, 8, 3),
  ('newsletter',        'Newsletter Sponsorship', 25000, 1, 4),
  ('event_featured',    'Event Promotion',        12000, 4, 5)
on conflict (key) do nothing;

-- ============================================================
-- supabase/migrations/0024_owner_campaign_perf.sql
-- ============================================================

-- 0024_owner_campaign_perf.sql — advertiser-facing campaign performance.
-- Raw ad_events are admin-only, so an advertiser can't compute their own CTR via
-- RLS. This SECURITY DEFINER function returns ONLY the caller's own campaigns
-- (scoped by auth.uid() to businesses they own/claim) with real impression/click
-- counts — no other advertiser's data is reachable.
drop function if exists public.owner_campaign_performance();
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
    select id from businesses where owner_id::text = (auth.jwt() ->> 'sub') or claimed_by::text = (auth.jwt() ->> 'sub')
  )
  group by c.id
  order by c.created_at desc;
$$;

grant execute on function public.owner_campaign_performance() to authenticated;

-- ============================================================
-- supabase/migrations/0025_premerge_review_fixes.sql
-- ============================================================

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

-- ============================================================
-- supabase/migrations/0026_hotel_ai_highlights.sql
-- ============================================================

-- Humble Halal — cache for AI-generated hotel "highlights for a Muslim traveller".
-- Caps token spend: /api/travel/highlights reads this first and regenerates only
-- when a row is missing or older than 7 days. Public display data (read-only to
-- everyone); writes go through the service-role client (bypasses RLS). Run after
-- 0001–0025. Matches the style of 0006_travel.sql (public-read overlay tables).

create table if not exists hotel_ai_highlights (
  hotel_id text primary key,
  highlights jsonb not null,
  created_at timestamptz not null default now()
);

alter table hotel_ai_highlights enable row level security;

-- Public, read-only display data (writes via service-role only).
drop policy if exists "hotel_ai_highlights public read" on hotel_ai_highlights;
create policy "hotel_ai_highlights public read" on hotel_ai_highlights for select using (true);

-- ============================================================
-- supabase/migrations/0027_hotel_booking_voucher.sql
-- ============================================================

-- Humble Halal — record the promo voucher applied to a hotel booking.
-- The voucher is applied at /rates/prebook (LiteAPI computes the discount and
-- returns a fresh payment intent); we store the code + discount on the booking row
-- so the ledger reconciles against LiteAPI's weekly payout report. Additive,
-- backwards-compatible (both nullable). Run after 0001–0026.

alter table hotel_bookings add column if not exists voucher_code text;
alter table hotel_bookings add column if not exists discount_amount numeric;

-- ============================================================
-- supabase/migrations/0028_cert_vault.sql
-- ============================================================

-- Humble Halal — Halal Certificate Vault.
-- Verified+ owners upload halal certificate files; admins approve/reject; the
-- existing halal score (lib/halal-score.ts, written by /api/admin/verify) reflects
-- approved / expiring / expired certs. Files live in a PRIVATE storage bucket and are
-- NEVER public — reached only via short-TTL signed URLs minted server-side with the
-- service role. Builds on 0001_init, 0002_directory, 0004_automation, 0017_rls_hardening.

create table if not exists halal_certs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  issuer text,                          -- e.g. "MUIS"
  scheme text,                          -- e.g. "Eating Establishment"
  cert_no text,
  issued_on date,
  expires_on date,
  file_path text,                       -- path within the private 'certs' bucket (NEVER a public URL)
  status text not null default 'pending'
    check (status in ('pending','approved','rejected','expired')),
  review_note text,                     -- admin reason on reject / note
  reviewed_by uuid references profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists halal_certs_business_idx on halal_certs(business_id);
create index if not exists halal_certs_status_idx on halal_certs(status);
create index if not exists halal_certs_expiry_idx on halal_certs(expires_on) where status = 'approved';

alter table halal_certs enable row level security;

-- Owner reads own business's certs; admins read all. Writes go through server routes
-- with the service role (which bypasses RLS) — matching the 0017 convention of no
-- public insert/update/delete policies. The public NEVER reads this table: approved
-- status + expiry surface via the businesses row, never the cert file.
drop policy if exists "halal_certs owner read" on halal_certs;
create policy "halal_certs owner read" on halal_certs for select using (
  exists (
    select 1 from businesses b
    where b.id = halal_certs.business_id and b.owner_id::text = (auth.jwt() ->> 'sub')
  )
);
drop policy if exists "halal_certs admin read" on halal_certs;
create policy "halal_certs admin read" on halal_certs for select using (
  exists (select 1 from profiles p where p.id::text = (auth.jwt() ->> 'sub') and p.role = 'admin')
);

-- ── Private storage bucket for certificate files ────────────────────────────
-- public = false → no anonymous/authenticated direct access. With RLS on
-- storage.objects (Supabase default) and NO select/insert policies for this bucket,
-- only the service role can read/write — exactly what we want. The server uploads
-- with the service role and mints short-TTL signed URLs for owner/admin preview.
insert into storage.buckets (id, name, public)
  values ('certs', 'certs', false)
  on conflict (id) do nothing;

-- ============================================================
-- supabase/migrations/0029_audit_p0_security.sql
-- ============================================================

-- Humble Halal — CP1 security-audit P0 RLS/privilege hardening.
-- Closes anon-key-exploitable holes found in the codebase audit. Idempotent.
-- Run after 0028. Service-role (admin API / seed) bypasses RLS and has
-- rolbypassrls, so every fix below leaves the service-role paths working.

-- ── 1. Lock business trust/monetization columns against owner self-service ───
-- The "own business" RLS policy is FOR ALL with no column scope, so an owner
-- could UPDATE (or INSERT) halal_tier='muis' (fake MUIS certification — a golden-
-- rule violation), halal_score, featured/plan='premium' (free paid placement),
-- status, muis_* etc. directly through the browser anon key, bypassing the
-- service-role admin path (app/api/admin/verify). This trigger pins those columns
-- for RLS-bound roles (anon/authenticated) on BOTH insert and update; roles with
-- BYPASSRLS (service_role admin API, postgres migrations/seed) are unaffected.
-- SECURITY INVOKER (default) so current_user is the *caller's* role, not the owner.
create or replace function public.guard_business_trust_columns()
returns trigger
language plpgsql
set search_path = public, pg_catalog
as $$
begin
  if exists (select 1 from pg_roles where rolname = current_user and rolbypassrls) then
    return new; -- service_role / postgres may set anything
  end if;

  if tg_op = 'INSERT' then
    -- An owner may create a listing, but never self-certified / featured / paid.
    new.halal_tier         := null;
    new.halal_score        := null;
    new.featured           := false;
    new.plan               := 'free';
    new.muis_cert_no       := null;
    new.muis_scheme        := null;
    new.muis_expiry        := null;
    new.last_verified_at   := null;
    return new;
  end if;

  -- UPDATE: preserve every trust/monetization/provenance column from the old row.
  new.halal_tier         := old.halal_tier;
  new.halal_score        := old.halal_score;
  new.featured           := old.featured;
  new.plan               := old.plan;
  new.status             := old.status;
  new.muis_cert_no       := old.muis_cert_no;
  new.muis_scheme        := old.muis_scheme;
  new.muis_expiry        := old.muis_expiry;
  new.last_verified_at   := old.last_verified_at;
  new.source             := old.source;
  new.provenance         := old.provenance;
  new.claimed_by         := old.claimed_by;
  new.owner_id           := old.owner_id;
  new.stripe_customer_id := old.stripe_customer_id;
  return new;
end;
$$;

drop trigger if exists trg_guard_business_trust on public.businesses;
create trigger trg_guard_business_trust
  before insert or update on public.businesses
  for each row execute function public.guard_business_trust_columns();

-- ── 2. Public read: published rows only ─────────────────────────────────────
-- "businesses public read" was using(true) — anon could read unpublished
-- (staging/pending/suspended) rows. The public directory already filters
-- status='published' (lib/directory.ts), and owners keep access to their own
-- rows via the "own business" policy, so this is a safe tightening.
drop policy if exists "businesses public read" on public.businesses;
create policy "businesses public read" on public.businesses
  for select using (status = 'published');

-- ── 3. SECURITY DEFINER counters: service_role only (not PUBLIC) ─────────────
-- increment/decrement_event_taken + increment_donation_raised were EXECUTE-able
-- by PUBLIC, so anon could RPC them to tamper ticket sold-counts and public
-- donation totals. Only the Stripe webhook (service-role) should call them.
revoke execute on function public.increment_event_taken(text, int) from public;
revoke execute on function public.decrement_event_taken(text, int) from public;
revoke execute on function public.increment_donation_raised(text, int) from public;
grant execute on function public.increment_event_taken(text, int) to service_role;
grant execute on function public.decrement_event_taken(text, int) to service_role;
grant execute on function public.increment_donation_raised(text, int) to service_role;

-- ── 4. Analytics views respect analytics_events' admin-only RLS ─────────────
-- These reporting views read analytics_events (RLS: admin-only SELECT) but, as
-- plain views, ran with the view owner's rights and bypassed that RLS. Switch to
-- security_invoker so the caller's RLS applies (admins via is_admin() / service-
-- role still see everything; anon/non-admin see nothing).
alter view public.v_daily_lead_actions  set (security_invoker = on);
alter view public.v_vendor_leads         set (security_invoker = on);
alter view public.v_search_intelligence  set (security_invoker = on);
alter view public.v_session_entry        set (security_invoker = on);

-- ============================================================
-- supabase/migrations/0030_blog_inline_ad.sql
-- ============================================================

-- 0030_blog_inline_ad.sql — add the in-article blog placement to the ad rate card.
-- Matches the ad_placements shape from 0023_ads.sql. Idempotent.
-- The <SponsoredSlot placement="blog_inline"> units on the blog index, category
-- pages and post bodies render nothing until a campaign is booked against this key.

insert into ad_placements (key, label, monthly_rate_cents, inventory_cap, sort) values
  ('blog_inline', 'Blog In-Article', 12000, 4, 6)
on conflict (key) do nothing;

-- ============================================================
-- supabase/migrations/0031_clerk_auth.sql
-- ============================================================

-- Humble Halal — migrate auth from Supabase Auth → Clerk (keep Supabase as the DB).
--
-- Clerk now owns identity. Supabase trusts Clerk JWTs via Third-Party Auth, so the
-- user id is the Clerk id (TEXT like 'user_xxx') read from auth.jwt()->>'sub'
-- instead of auth.uid() (a uuid).
--
-- DYNAMIC + AGGREGATE-FREE: reads the pg_policy / pg_constraint CATALOGS directly
-- (NOT the pg_policies view, whose `roles` column is computed via array_agg, which
-- this Postgres rejects inside a FOR loop). Role lists are built with an array
-- CONSTRUCTOR, not an aggregate. All state is carried in jsonb inside one DO block
-- (no temp tables). It:
--   1. Captures + drops every public RLS policy before changing profile id types.
--   2. Drops every FK to profiles(id)/auth.users(id), retypes those columns +
--      profiles.id to TEXT, then re-adds the FKs to profiles(id).
--   3. Recreates the captured policies with auth.uid() → (auth.jwt()->>'sub').
--   4. Rewrites the known SECURITY DEFINER functions to the Clerk sub, adds
--      profiles.email; flags any OTHER function still using auth.uid().
--
-- CLEAN CUTOVER: user-identity tables effectively empty (no real users). The
-- uuid→text retype is lossless. Wrapped in a transaction (failure rolls back).
-- Idempotent.

begin;

do $$
declare
  pols  jsonb := '[]'::jsonb;
  fks   jsonb := '[]'::jsonb;
  r     record;
  elem  jsonb;
  v_roles text; v_cmd text; v_using text; v_check text; v_sql text; deltype text;
begin
  -- ── 1. Capture + drop public policies (from the pg_policy catalog) ──────────
  -- Drop every policy, not only auth.uid() policies: Postgres also blocks
  -- altering profiles.id when any policy expression depends on it (for example
  -- an older "transfer owner read" policy on transfer_bookings).
  for r in
    select cls.relname                                  as tbl,
           pol.polname                                  as name,
           pol.polpermissive                            as permissive,
           pol.polcmd                                   as cmd,
           pol.polroles                                 as roles,
           pg_get_expr(pol.polqual, pol.polrelid)       as qual,
           pg_get_expr(pol.polwithcheck, pol.polrelid)  as wc
    from pg_policy pol
    join pg_class cls     on cls.oid = pol.polrelid
    join pg_namespace nsp on nsp.oid = cls.relnamespace
    where nsp.nspname = 'public'
  loop
    -- roles → csv (array constructor, NOT an aggregate). 0 = PUBLIC.
    if r.roles is null or cardinality(r.roles) = 0 or 0::oid = any(r.roles) then
      v_roles := 'public';
    else
      v_roles := array_to_string(
        array(select quote_ident(rolname) from pg_roles where oid = any(r.roles)), ', ');
      if v_roles is null or v_roles = '' then v_roles := 'public'; end if;
    end if;

    v_cmd := case r.cmd when 'r' then 'select' when 'a' then 'insert'
                        when 'w' then 'update' when 'd' then 'delete' else 'all' end;

    pols := pols || jsonb_build_object(
      'tbl', r.tbl, 'name', r.name,
      'perm', case when r.permissive then 'permissive' else 'restrictive' end,
      'cmd', v_cmd, 'roles', v_roles, 'qual', r.qual, 'wc', r.wc);

    execute format('drop policy %I on public.%I', r.name, r.tbl);
  end loop;

  -- ── 2. Capture + drop FKs to profiles/auth.users (single-col; not profiles.id)
  for r in
    select con.conname, rel.relname as tbl, att.attname as col, con.confdeltype as deltype
    from pg_constraint con
    join pg_class rel     on rel.oid  = con.conrelid
    join pg_namespace ns  on ns.oid   = rel.relnamespace
    join pg_class frel    on frel.oid = con.confrelid
    join pg_namespace fns on fns.oid  = frel.relnamespace
    join pg_attribute att on att.attrelid = con.conrelid and att.attnum = con.conkey[1]
    where con.contype = 'f'
      and ns.nspname = 'public'
      and cardinality(con.conkey) = 1
      and ( (fns.nspname = 'public' and frel.relname = 'profiles')
         or (fns.nspname = 'auth'   and frel.relname = 'users') )
      and not (rel.relname = 'profiles' and att.attname = 'id')
  loop
    fks := fks || jsonb_build_object('conname', r.conname, 'tbl', r.tbl, 'col', r.col, 'deltype', r.deltype);
    execute format('alter table public.%I drop constraint %I', r.tbl, r.conname);
  end loop;

  -- profiles' own FK(s) → auth.users (whatever the name)
  for r in
    select con.conname
    from pg_constraint con
    join pg_class rel    on rel.oid = con.conrelid
    join pg_namespace ns on ns.oid  = rel.relnamespace
    where con.contype = 'f' and ns.nspname = 'public' and rel.relname = 'profiles'
  loop
    execute format('alter table public.profiles drop constraint %I', r.conname);
  end loop;

  -- ── 3. Retype profiles.id → text, add email ────────────────────────────────
  execute 'alter table public.profiles alter column id type text using id::text';
  execute 'alter table public.profiles add column if not exists email text';

  -- ── 4. Retype each captured column → text, re-add FK to profiles(id) ────────
  for elem in select value from jsonb_array_elements(fks)
  loop
    execute format('alter table public.%I alter column %I type text using %I::text',
                   elem->>'tbl', elem->>'col', elem->>'col');
    deltype := case elem->>'deltype'
                 when 'c' then ' on delete cascade'
                 when 'n' then ' on delete set null'
                 when 'd' then ' on delete set default'
                 when 'r' then ' on delete restrict'
                 else '' end;
    execute format('alter table public.%I add constraint %I foreign key (%I) references public.profiles(id)%s',
                   elem->>'tbl', elem->>'conname', elem->>'col', deltype);
  end loop;

  -- ── 5. Recreate policies with auth.uid() → (auth.jwt()->>'sub') ─────────────
  for elem in select value from jsonb_array_elements(pols)
  loop
    v_using := nullif(replace(coalesce(elem->>'qual', ''), 'auth.uid()', '(auth.jwt() ->> ''sub'')'), '');
    v_check := nullif(replace(coalesce(elem->>'wc', ''),   'auth.uid()', '(auth.jwt() ->> ''sub'')'), '');
    -- Policies captured from older schemas may compare profiles.id (now text)
    -- against columns that were not FK-captured/retyped. Cast the common profile
    -- aliases to text so recreated policies don't fail with text = uuid.
    v_using := replace(v_using, 'profiles.id = ', 'profiles.id::text = ');
    v_using := replace(v_using, 'p.id = ', 'p.id::text = ');
    v_check := replace(v_check, 'profiles.id = ', 'profiles.id::text = ');
    v_check := replace(v_check, 'p.id = ', 'p.id::text = ');
    v_sql := format('create policy %I on public.%I as %s for %s to %s',
                    elem->>'name', elem->>'tbl', elem->>'perm', elem->>'cmd', elem->>'roles');
    if v_using is not null then v_sql := v_sql || ' using (' || v_using || ')'; end if;
    if v_check is not null then v_sql := v_sql || ' with check (' || v_check || ')'; end if;
    execute v_sql;
  end loop;
end $$;

-- ── 6. Rewrite known SECURITY DEFINER functions (after columns are text) ──────
create or replace function public.is_admin()
returns boolean language sql security definer set search_path = public stable as $fn$
  select exists (
    select 1 from public.profiles p
    where p.id = (auth.jwt() ->> 'sub') and p.role = 'admin'
  );
$fn$;

create or replace function public.owner_listing_analytics(p_from timestamptz, p_to timestamptz)
returns table (
  listing_slug text, vendor_name text, enquiries bigint, whatsapp_clicks bigint,
  calls bigint, website_clicks bigint, directions bigint, shortlists bigint,
  listing_views bigint, impressions bigint, page_views bigint
)
language plpgsql security definer set search_path = public as $fn$
begin
  return query
  with mine as (
    select b.slug, b.name from public.businesses b
    where b.owner_id = (auth.jwt() ->> 'sub') or b.claimed_by = (auth.jwt() ->> 'sub')
  ),
  ev as (
    select * from public.analytics_events
    where created_at >= p_from and created_at < p_to
      and listing_slug in (select slug from mine)
  )
  select
    m.slug, m.name,
    count(*) filter (where e.lead_action_type = 'enquiry_form')::bigint,
    count(*) filter (where e.lead_action_type = 'whatsapp')::bigint,
    count(*) filter (where e.lead_action_type = 'call')::bigint,
    count(*) filter (where e.lead_action_type = 'website')::bigint,
    count(*) filter (where e.lead_action_type = 'directions')::bigint,
    count(*) filter (where e.lead_action_type = 'shortlist')::bigint,
    count(*) filter (where e.event_type = 'listing_view')::bigint,
    count(*) filter (where e.event_type = 'impression')::bigint,
    count(*) filter (where e.event_type = 'page_view')::bigint
  from mine m
  left join ev e on e.listing_slug = m.slug
  group by m.slug, m.name
  order by 9 desc;
end;
$fn$;

create or replace function public.owner_reviews()
returns table (id uuid, listing_slug text, business_name text, rating int, text text, reply text, status text, created_at timestamptz)
language sql security definer set search_path = public stable as $fn$
  select r.id, b.slug, b.name, r.rating, r.text, r.reply, r.status, r.created_at
  from public.reviews r
  join public.businesses b on b.id = r.business_id
  where b.owner_id = (auth.jwt() ->> 'sub') or b.claimed_by = (auth.jwt() ->> 'sub')
  order by r.created_at desc;
$fn$;

create or replace function public.owner_reply_to_review(p_review_id uuid, p_reply text)
returns void language plpgsql security definer set search_path = public as $fn$
begin
  update public.reviews
     set reply = p_reply, replied_at = now()
   where id = p_review_id
     and business_id in (
       select id from public.businesses
       where owner_id = (auth.jwt() ->> 'sub') or claimed_by = (auth.jwt() ->> 'sub')
     );
  if not found then raise exception 'not your review'; end if;
end;
$fn$;

create or replace function public.owner_campaign_performance()
returns table (
  campaign_id uuid, title text, placement_key text, status text, rate_cents int,
  starts_on date, ends_on date, impressions int, clicks int
)
language sql stable security definer set search_path = public as $fn$
  select c.id, c.title, c.placement_key, c.status, c.rate_cents, c.starts_on, c.ends_on,
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

-- admin_list_users: auth.users is empty under Clerk → read profiles (now has email).
drop function if exists public.admin_list_users(int);
create function public.admin_list_users(p_limit int default 200)
returns table (id text, email text, name text, role text, created_at timestamptz)
language plpgsql security definer set search_path = public as $fn$
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  return query
    select p.id, p.email, p.name, coalesce(p.role, 'user'), p.created_at
    from public.profiles p
    order by p.created_at desc
    limit greatest(1, least(p_limit, 1000));
end;
$fn$;
revoke all on function public.admin_list_users(int) from public;
grant execute on function public.admin_list_users(int) to authenticated;

-- ── 7. Flag any OTHER function still referencing auth.uid() (manual review) ────
do $$
declare r record;
begin
  for r in
    select n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) as args
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prokind = 'f'                 -- normal funcs only (pg_get_functiondef errors on aggregates)
      and p.prosrc like '%auth.uid()%'    -- read source text directly (no pg_get_functiondef)
  loop
    raise notice 'CLERK MIGRATION: function %.%(%) still uses auth.uid() — rewrite to (auth.jwt()->>''sub'')',
      r.nspname, r.proname, r.args;
  end loop;
end $$;

commit;

-- ============================================================
-- supabase/migrations/0032_pg_cron_flight_retry.sql
-- ============================================================

-- Humble Halal — flight-retry backstop via Supabase pg_cron (free-tier friendly).
--
-- WHY: time-sensitive flight bookings whose card was captured but whose LiteAPI
-- `book` call hard-failed are persisted as status='confirming' and must be
-- re-attempted quickly. Vercel Hobby crons run at most daily, which is too slow.
-- Instead we drive the EXISTING /api/cron/flight-retry handler from Supabase
-- pg_cron + pg_net every 10 minutes — no Vercel Pro, no logic rewrite. (The
-- inline retry in /api/travel/flights/book already resolves most transient
-- failures at booking time; this is the post-capture backstop.)
--
-- ONE-TIME SETUP (run separately in the SQL editor — DO NOT commit the secret):
--   select vault.create_secret('<YOUR_CRON_SECRET>', 'cron_secret');
-- (must equal the CRON_SECRET env var the Next.js app verifies via authorizeCron)
--
-- Runs ALONGSIDE the daily Vercel flight-retry cron, which is kept as a safety
-- backstop until this pg_cron is verified working (needs the Vault secret below).
-- Idempotent: safe to re-run.

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Replace any prior schedule with the same name.
do $$
begin
  perform cron.unschedule('flight-retry-10m');
exception when others then
  null; -- not scheduled yet
end $$;

select cron.schedule(
  'flight-retry-10m',
  '*/10 * * * *',
  $cron$
  select net.http_post(
    url     := 'https://www.humblehalal.com/api/cron/flight-retry',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'authorization', 'Bearer ' || (
        select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret'
      )
    ),
    body    := '{}'::jsonb
  );
  $cron$
);

-- Inspect runs:  select * from cron.job_run_details order by start_time desc limit 20;

-- ============================================================
-- supabase/migrations/0033_notifications.sql
-- ============================================================

-- Humble Halal — in-app notifications + Realtime (Clerk-sub identity).
-- Powers the notification bell; written ONLY by the service role (Edge Functions),
-- read by each user via RLS, pushed live via Supabase Realtime. Run after 0031.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id    text not null,                 -- Clerk sub (matches profiles.id post-0031)
  type       text not null,                 -- 'event_published' | 'cert_change' | ...
  title      text not null,
  body       text,
  link       text,
  dedupe_key text,                          -- e.g. 'event_published:<event_id>'
  read_at    timestamptz,
  created_at timestamptz not null default now()
);
create unique index if not exists notifications_dedupe
  on public.notifications(user_id, type, dedupe_key) where dedupe_key is not null;
create index if not exists notifications_user_unread
  on public.notifications(user_id, read_at, created_at desc);

alter table public.notifications enable row level security;
-- Read your own only (Clerk sub). NO insert/update/delete policy → only the
-- service role writes; users mark-read via the SECURITY DEFINER RPC below.
drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own on public.notifications
  for select to authenticated using (user_id = (auth.jwt() ->> 'sub'));

create or replace function public.mark_notification_read(p_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.notifications set read_at = now()
  where id = p_id and user_id = (auth.jwt() ->> 'sub') and read_at is null;
$$;
revoke all on function public.mark_notification_read(uuid) from public;
grant execute on function public.mark_notification_read(uuid) to authenticated;

-- Idempotency guard for the on-event-published webhook (claim once per event).
alter table public.events add column if not exists notified_at timestamptz;

-- Enable Realtime on notifications (RLS still applies to what each client receives).
do $$
begin
  alter publication supabase_realtime add table public.notifications;
exception when others then
  null; -- already a member
end $$;

-- ============================================================
-- supabase/migrations/0034_review_triage_guards.sql
-- ============================================================

-- Humble Halal — idempotency guards for the on-review-created Edge Function.
-- The function claims triaged_at atomically so a webhook retry never re-runs AI.
alter table public.reviews       add column if not exists triaged_at timestamptz;
alter table public.event_reviews add column if not exists triaged_at timestamptz;

-- ============================================================
-- supabase/migrations/0035_business_location.sql
-- ============================================================

-- 0035_business_location — give the live `businesses` table a street address +
-- postal code. The directory seed (scripts/seed-spreadsheet.mjs) writes these
-- so detail pages can show the exact location and the postal can drive precise
-- geocoding. Both nullable + additive (safe on the live table). After applying,
-- re-run the seed to backfill addresses for the spreadsheet rows.

alter table businesses add column if not exists address text;
alter table businesses add column if not exists postal text;

-- Optional: index postal for any postal-based lookups/dedup.
create index if not exists businesses_postal_idx on businesses (postal);

-- ============================================================
-- supabase/migrations/0036_business_phone.sql
-- ============================================================

-- 0036_business_phone — add a phone column to `businesses`. Needed so claimed
-- owners can edit their contact number and so contact enrichment
-- (scripts/enrich-contacts.mjs) can backfill phones. Nullable + additive.

alter table businesses add column if not exists phone text;

-- ============================================================
-- supabase/migrations/0037_listing_integrity.sql
-- ============================================================

-- 0037_listing_integrity — two integrity fixes found in the listing-lifecycle audit.

-- 1. Let an owner SELECT their OWN listings regardless of status. Public read is
--    published-only (0029); the "own business" policy is owner_id-only. This adds
--    an explicit owner-scoped read covering owner_id OR claimed_by, so a claimed
--    or non-published listing is visible to its owner in the dashboard. Uses the
--    Clerk id from the JWT (post-0031), not auth.uid().
drop policy if exists "owner sees own" on public.businesses;
create policy "owner sees own" on public.businesses
  for select using (
    owner_id = (auth.jwt() ->> 'sub') or claimed_by = (auth.jwt() ->> 'sub')
  );

-- 2. Community-confirmation count. lib/directory.ts rowToListing reads
--    businesses.confirm_count (was missing → always 0). Additive + nullable-safe.
alter table public.businesses add column if not exists confirm_count int not null default 0;

-- ============================================================
-- supabase/migrations/0038_catalog.sql
-- ============================================================

-- 0038_catalog — admin-editable directory taxonomy (categories + areas).
--
-- The app ships with a STATIC seed (lib/data.ts: HHData.categories / HHData.areas)
-- that remains the single source of truth when these tables are empty. Rows here
-- OVERRIDE a matching static id (by primary key) and APPEND brand-new ones; a row
-- flipped active=false hides that id from the browse UI. See lib/catalog.ts for
-- the merge. Public may only READ active rows; all writes go through the
-- service-role client behind requireAdmin (app/api/admin/catalog).

create table if not exists public.directory_categories (
  id         text primary key,               -- slug (e.g. 'restaurants'); overrides matching static id
  label      text not null,
  icon       text,
  sort       int not null default 100,
  active      boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.directory_areas (
  id         text primary key,               -- slug (e.g. 'tampines')
  name       text not null,
  tone       text,
  sort       int not null default 100,
  active      boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.directory_categories enable row level security;
alter table public.directory_areas      enable row level security;

-- Public (anon + authenticated) may read ACTIVE rows only. No insert/update/delete
-- policy → only the service role can write (admin API after requireAdmin).
drop policy if exists directory_categories_select_active on public.directory_categories;
create policy directory_categories_select_active on public.directory_categories
  for select using (active = true);

drop policy if exists directory_areas_select_active on public.directory_areas;
create policy directory_areas_select_active on public.directory_areas
  for select using (active = true);

-- ============================================================
-- supabase/migrations/0039_ack_emails.sql
-- ============================================================

-- 0039_ack_emails.sql — optional acknowledgement email on anonymous forms.
-- Suggest-a-business and Report-an-issue are anonymous today. Add an OPTIONAL
-- email so we can send a "thanks, we've received it" acknowledgement. Nullable —
-- existing rows and no-email submissions are unaffected.

alter table if exists public.suggestions add column if not exists email text;
alter table if exists public.reports     add column if not exists email text;

-- ============================================================
-- supabase/migrations/0040_booking_idempotency.sql
-- ============================================================

-- 0040: booking idempotency + ad-event integrity (pre-production audit).
--
-- 1) Replay-proof the booking ledgers. bookFlight/book are idempotent at
--    LiteAPI, but a double-submitted (or replayed) prebook/transaction inserted
--    DUPLICATE hotel_bookings / flight_bookings / hotel_commissions rows —
--    duplicate "My Trips" entries, duplicate confirmation emails and
--    double-counted commission revenue. Unique indexes make the DB the
--    backstop; the book routes treat 23505 as "replay" and skip the
--    commission insert + email.
--    (Partial WHERE NOT NULL: legacy/simulated rows may lack these ids.)

-- Dedupe any rows that already violate the constraints (keep the oldest).
delete from hotel_commissions hc using hotel_commissions older
  where hc.booking_id = older.booking_id
    and (hc.created_at, hc.id) > (older.created_at, older.id);
delete from hotel_bookings hb using hotel_bookings older
  where hb.liteapi_booking_id is not null
    and hb.liteapi_booking_id = older.liteapi_booking_id
    and (hb.created_at, hb.id) > (older.created_at, older.id);
delete from flight_bookings fb using flight_bookings older
  where fb.prebook_id is not null
    and fb.prebook_id = older.prebook_id
    and (fb.created_at, fb.id) > (older.created_at, older.id);

create unique index if not exists hotel_bookings_liteapi_id_uq
  on hotel_bookings (liteapi_booking_id) where liteapi_booking_id is not null;
create unique index if not exists flight_bookings_prebook_uq
  on flight_bookings (prebook_id) where prebook_id is not null;
create unique index if not exists hotel_commissions_booking_uq
  on hotel_commissions (booking_id);

-- 2) track_ad_event: only count events for campaigns that exist, are ACTIVE
--    and are within their run window. The FK already rejected nonexistent ids,
--    but paused/expired/pending campaigns could have impressions/clicks
--    inflated by anyone posting a known campaign id to /api/ads/track.
create or replace function public.track_ad_event(p_campaign uuid, p_placement text, p_kind text, p_session text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_kind not in ('impression', 'click') then return; end if;
  if not exists (
    select 1 from ad_campaigns c
    where c.id = p_campaign
      and c.status = 'active'
      and (c.starts_on is null or c.starts_on <= current_date)
      and (c.ends_on is null or c.ends_on >= current_date)
  ) then return; end if;
  insert into ad_events (campaign_id, placement_key, kind, session_id)
  values (p_campaign, p_placement, p_kind, left(coalesce(p_session, ''), 64));
end;
$$;

-- ============================================================
-- supabase/migrations/0041_promo_codes.sql
-- ============================================================

-- Humble Halal — event promo/discount codes (events marketplace Phase 1).
-- Organisers create percent or fixed-amount codes scoped to one event or the
-- whole organisation (event_id null). Discounts are PRE-COMPUTED server-side in
-- /api/checkout/ticket (never Stripe coupons: our two-line-item structure —
-- face value + booking fee — and the metadata-driven payout math must reflect
-- the discount exactly; a session-wide Stripe discount would corrupt both).
-- Builds on 0001_init (events, businesses), 0031_clerk_auth (text user ids).
--
-- Security model (0017/0029 conventions):
--   * Writes go through owner-authorised server routes using the service role —
--     no public insert/update/delete policies.
--   * Owners/admins may read their own codes (dashboard); the public never
--     reads this table — code validation happens server-side in the API.
--   * redeemed is only advanced by redeem_promo(), a SECURITY DEFINER counter
--     executable by service_role alone (same pattern as increment_event_taken).

create table if not exists promo_codes (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  event_id text references events(id) on delete cascade, -- null = all the organiser's events
  code text not null check (code = upper(code) and char_length(code) between 3 and 32),
  kind text not null check (kind in ('percent','fixed')),
  percent_off int check (percent_off between 1 and 100),
  amount_off_cents int check (amount_off_cents > 0),
  max_redemptions int check (max_redemptions > 0),
  redeemed int not null default 0,
  min_qty int not null default 1 check (min_qty >= 1),
  starts_at timestamptz,
  expires_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (business_id, code),
  -- the discount field must match the kind
  check (
    (kind = 'percent' and percent_off is not null and amount_off_cents is null) or
    (kind = 'fixed' and amount_off_cents is not null and percent_off is null)
  )
);

create index if not exists promo_codes_event_idx on promo_codes (event_id) where event_id is not null;
create index if not exists promo_codes_business_idx on promo_codes (business_id);

alter table promo_codes enable row level security;

drop policy if exists promo_codes_owner_read on promo_codes;
create policy promo_codes_owner_read on promo_codes for select using (
  exists (
    select 1 from businesses b
    where b.id = promo_codes.business_id
      and (b.owner_id = (auth.jwt() ->> 'sub') or b.claimed_by = (auth.jwt() ->> 'sub'))
  )
);
drop policy if exists promo_codes_admin_read on promo_codes;
create policy promo_codes_admin_read on promo_codes for select using (public.is_admin());

-- Atomic redemption with headroom check: only counts a redemption while the
-- code is active and under its cap. Called by the Stripe webhook on confirmed
-- ticket orders (accepting the tiny oversell window between session creation
-- and webhook confirm — bounded and harmless at current volume).
create or replace function public.redeem_promo(p_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  ok boolean;
begin
  update promo_codes
     set redeemed = redeemed + 1
   where id = p_id
     and active
     and (max_redemptions is null or redeemed < max_redemptions)
  returning true into ok;
  return coalesce(ok, false);
end;
$$;

revoke execute on function public.redeem_promo(uuid) from public;
grant execute on function public.redeem_promo(uuid) to service_role;

-- ============================================================
-- supabase/migrations/0042_order_attribution.sql
-- ============================================================

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
  check (event_type in ('page_view','impression','listing_view','search','lead_action','checkout_start','newsletter_signup')) not valid;

-- ============================================================
-- supabase/migrations/0043_ads_adsense.sql
-- ============================================================

-- 0043_ads_adsense.sql — Phase 3: dual-source ad serving (direct sponsor + AdSense fill).
-- Extends the existing direct-sponsor system (0023_ads.sql). No rebuild:
--  • ad_placements gains per-slot serving config (size, fill mode, AdSense slot,
--    reserved height for CLS, lazy flag) so the admin controls each slot's behaviour.
--  • ad_campaigns gains a review gate (pending → approved) so a direct creative is
--    brand-safety reviewed before it can serve.
-- The public serving API (/api/ads/active) reads this config; the <AdSlot> component
-- renders direct → AdSense → nothing per fill_mode.

-- ── Placement serving config ──────────────────────────────────────────────────
alter table ad_placements
  add column if not exists page_type            text,           -- 'homepage'|'blog'|'directory'|'business'|'tools'|'travel'|'events'
  add column if not exists position_label       text,           -- human label shown in the admin
  add column if not exists size_format          text not null default 'in_feed'
    check (size_format in ('leaderboard','mobile_banner','rectangle','halfpage','in_article','in_feed')),
  add column if not exists fill_mode            text not null default 'direct_then_adsense'
    check (fill_mode in ('off','direct_only','adsense_only','direct_then_adsense')),
  add column if not exists adsense_slot         text,           -- AdSense data-ad-slot id (set post-approval)
  add column if not exists min_height_px        int  not null default 0,   -- reserved height, desktop (CLS guard)
  add column if not exists min_height_px_mobile int  not null default 0,   -- reserved height, mobile
  add column if not exists lazy                 boolean not null default true;

-- ── Direct-creative review gate ───────────────────────────────────────────────
alter table ad_campaigns
  add column if not exists review_status text not null default 'pending'
    check (review_status in ('pending','approved','rejected'));
-- Grandfather existing campaigns so nothing that was already serving goes dark.
update ad_campaigns set review_status = 'approved'
  where review_status = 'pending' and status in ('active','paused','ended');

-- ── Patch existing placements with sizes/modes ────────────────────────────────
update ad_placements set page_type='homepage', position_label='Below discover rail',
  size_format='in_feed',    fill_mode='direct_then_adsense', min_height_px=120, min_height_px_mobile=120 where key='homepage_hero';
update ad_placements set page_type='directory', position_label='In listing feed',
  size_format='in_feed',    fill_mode='direct_then_adsense', min_height_px=120, min_height_px_mobile=120 where key='directory_inline';
update ad_placements set page_type='directory', position_label='Category page',
  size_format='in_feed',    fill_mode='direct_then_adsense', min_height_px=120, min_height_px_mobile=120 where key='category_featured';
update ad_placements set page_type='events', position_label='Events strip',
  size_format='in_feed',    fill_mode='direct_only',         min_height_px=120, min_height_px_mobile=120 where key='event_featured';
update ad_placements set page_type='newsletter', position_label='Newsletter',
  size_format='in_feed',    fill_mode='direct_only',         min_height_px=0,   min_height_px_mobile=0   where key='newsletter';

-- ── New high-value slots (built now = active; future inventory = inactive) ─────
insert into ad_placements
  (key, label, position_label, page_type, size_format, fill_mode, adsense_slot,
   inventory_cap, min_height_px, min_height_px_mobile, monthly_rate_cents, sort, active) values
  -- Built now
  ('blog_article_top',   'Blog article — top',    'Under title, above body',  'blog',      'leaderboard', 'adsense_only',         null, 1, 90,  100, 0,     6,  true),
  ('directory_hub',      'Directory hub — inline','Between listings & guide', 'directory', 'leaderboard', 'direct_then_adsense',  null, 1, 90,  100, 20000, 7,  true),
  -- Future inventory: schema-ready, seeded inactive. Flip active=true + drop <AdSlot> in.
  ('directory_hub_side', 'Directory hub — sidebar','Sidebar, above related', 'directory', 'rectangle',   'adsense_only',         null, 1, 250, 0,   0,     8,  false),
  ('business_detail_mid','Business — mid',        'After contact buttons',    'business',  'rectangle',   'direct_only',          null, 1, 250, 250, 15000, 9,  false),
  ('tools_inline',       'Tools — inline',        'Between tool sections',    'tools',     'leaderboard', 'adsense_only',         null, 1, 90,  100, 0,     10, false),
  ('travel_promo',       'Travel — below promo',  'After travel promo band',  'travel',    'leaderboard', 'direct_only',          null, 1, 90,  100, 0,     11, false)
on conflict (key) do nothing;

-- Note: the public storage bucket `ad-creatives` (sponsor creative images) is created
-- out-of-band (dashboard or storage.buckets insert), mirroring `business-photos`.
-- See docs/runbooks for the exact step. RLS is unchanged: ad_placements is public-read;
-- all writes go through the service role (admin API) — no public write policy.

-- ============================================================
-- supabase/migrations/0044_ux_overhaul.sql
-- ============================================================

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

-- ============================================================
-- supabase/migrations/0045_analytics_v2.sql
-- ============================================================

-- 0045_analytics_v2.sql — business analytics v2: richer event taxonomy,
-- date-ranged admin RPCs (the old v_vendor_leads / v_search_intelligence views
-- were all-time, so the Vendors and Search tabs ignored the range buttons),
-- area/category/monetization rollups, a configurable lead-value model, and
-- owner-facing trend + search-term RPCs.
-- Run after 0044. Views from 0010 are kept for back-compat; the dashboard now
-- reads the RPCs below.

-- ── 1. Event taxonomy ────────────────────────────────────────────────────────
-- New dimensions. area rides on listing events (from the listing card/detail),
-- device is a coarse client hint, results_count captures zero-result searches.
alter table public.analytics_events
  add column if not exists area          text,
  add column if not exists device        text,
  add column if not exists results_count int;

-- Widen the event_type gate (same pattern as 0042).
alter table public.analytics_events
  drop constraint if exists analytics_events_event_type_check;
alter table public.analytics_events
  add constraint analytics_events_event_type_check
  check (event_type in (
    'page_view','impression','listing_view','search','lead_action',
    'checkout_start','newsletter_signup',
    'search_result_click','filter_use','map_open','ai_query','ai_result_click'
  )) not valid;

alter table public.analytics_events
  drop constraint if exists analytics_events_lead_action_type_check;
alter table public.analytics_events
  add constraint analytics_events_lead_action_type_check
  check (lead_action_type in (
    'enquiry_form','whatsapp','call','website','directions','shortlist',
    'share','claim','booking','menu','cert_view'
  )) not valid;

-- ── 2. track_event(): one signature, three new optional params ───────────────
-- The 8-param version is DROPPED (not overloaded) — two overloads would make
-- PostgREST named-arg resolution ambiguous. Old deployed clients that still
-- send 8 named args resolve fine against this one function via the defaults;
-- the client also carries a legacy-args retry for the deploy-before-migration
-- window (lib/analytics.ts).
drop function if exists public.track_event(text,text,text,text,text,text,text,text);
create or replace function public.track_event(
  p_event_type       text,
  p_session_id       text default null,
  p_lead_action_type text default null,
  p_listing_slug     text default null,
  p_category         text default null,
  p_query            text default null,
  p_path             text default null,
  p_referrer         text default null,
  p_area             text default null,
  p_device           text default null,
  p_results_count    int  default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.analytics_events
    (event_type, session_id, lead_action_type, listing_slug, category, query,
     path, referrer, area, device, results_count)
  values
    (p_event_type, p_session_id, p_lead_action_type, p_listing_slug, p_category,
     nullif(p_query, ''), p_path, p_referrer,
     nullif(p_area, ''), nullif(p_device, ''), p_results_count);
end;
$$;

revoke all on function public.track_event(text,text,text,text,text,text,text,text,text,text,int) from public;
grant execute on function public.track_event(text,text,text,text,text,text,text,text,text,text,int) to anon, authenticated;

-- ── 3. Lead-value model (admin-configurable, never hardcoded in the UI) ──────
create table if not exists public.analytics_lead_values (
  action      text primary key,
  value_cents int not null default 0 check (value_cents >= 0),
  updated_at  timestamptz not null default now()
);

insert into public.analytics_lead_values (action, value_cents) values
  ('enquiry_form', 2500), ('whatsapp', 1200), ('call', 1500), ('website', 500),
  ('directions', 800), ('shortlist', 200), ('share', 150), ('claim', 3000),
  ('booking', 3000), ('menu', 300), ('cert_view', 150)
on conflict (action) do nothing;

alter table public.analytics_lead_values enable row level security;
drop policy if exists "lead values admin read" on public.analytics_lead_values;
create policy "lead values admin read" on public.analytics_lead_values
  for select to authenticated using ( public.is_admin() );

create or replace function public.admin_set_lead_value(p_action text, p_value_cents int)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  insert into public.analytics_lead_values (action, value_cents, updated_at)
  values (p_action, greatest(p_value_cents, 0), now())
  on conflict (action) do update set value_cents = excluded.value_cents, updated_at = now();
end;
$$;
revoke all on function public.admin_set_lead_value(text,int) from public;
grant execute on function public.admin_set_lead_value(text,int) to authenticated;

-- ── 4. admin_vendor_leads(): date-ranged listing performance + plan join ─────
-- Replaces the all-time v_vendor_leads for the dashboard. Joins businesses for
-- plan/area so paid-vs-free and outreach columns come from source of truth.
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
    select * from public.analytics_events
    where created_at >= p_from and created_at < p_to and listing_slug is not null
  )
  select
    e.listing_slug,
    coalesce(b.name, e.listing_slug),
    coalesce(b.category, max(e.category)),
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
  group by e.listing_slug, b.name, b.category, b.area, b.plan
  order by 15 desc, 16 desc;
end;
$$;
revoke all on function public.admin_vendor_leads(timestamptz,timestamptz) from public;
grant execute on function public.admin_vendor_leads(timestamptz,timestamptz) to authenticated;

-- ── 5. admin_search_terms(): date-ranged search intelligence + zero results ──
create or replace function public.admin_search_terms(p_from timestamptz, p_to timestamptz, p_limit int default 50)
returns table (
  query text, searches bigint, zero_result_searches bigint,
  result_clicks bigint, searches_that_converted bigint
)
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  return query
  with ev as (
    select * from public.analytics_events
    where created_at >= p_from and created_at < p_to
  ),
  s as (
    select ev.query as q, ev.session_id, ev.results_count
    from ev where ev.event_type = 'search' and ev.query is not null
  ),
  clicks as (
    -- search_result_click carries the originating query (lib/analytics.ts),
    -- so clicks attribute to the exact term, not just the session.
    select ev.query as q, count(*) as n from ev
    where ev.event_type = 'search_result_click' and ev.query is not null
    group by ev.query
  ),
  conv as (
    select distinct ev.session_id from ev where ev.event_type = 'lead_action'
  )
  select
    s.q,
    count(*),
    count(*) filter (where s.results_count = 0),
    coalesce(max(ck.n), 0)::bigint,
    count(*) filter (where cv.session_id is not null)
  from s
  left join clicks ck on ck.q = s.q
  left join conv cv   on cv.session_id = s.session_id
  group by s.q
  order by 2 desc
  limit p_limit;
end;
$$;
revoke all on function public.admin_search_terms(timestamptz,timestamptz,int) from public;
grant execute on function public.admin_search_terms(timestamptz,timestamptz,int) to authenticated;

-- ── 6. admin_area_demand(): demand by Singapore area ─────────────────────────
-- Area comes from the event when the client sent it, else from businesses.
create or replace function public.admin_area_demand(p_from timestamptz, p_to timestamptz)
returns table (
  area text, listing_views bigint, lead_actions bigint, impressions bigint,
  vendors_active bigint, paid_vendors bigint, top_category text,
  top_listing text, top_listing_name text
)
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  return query
  with ev as (
    select e.*, coalesce(e.area, b.area) as a, b.plan, b.name as bname
    from public.analytics_events e
    left join public.businesses b on b.slug = e.listing_slug
    where e.created_at >= p_from and e.created_at < p_to
      and coalesce(e.area, b.area) is not null
  ),
  per_listing as (
    select ev.a, ev.listing_slug, max(ev.bname) as bname,
           count(*) filter (where ev.event_type = 'lead_action') as leads
    from ev where ev.listing_slug is not null
    group by ev.a, ev.listing_slug
  ),
  top_l as (
    select distinct on (pl.a) pl.a, pl.listing_slug, pl.bname
    from per_listing pl order by pl.a, pl.leads desc
  ),
  per_cat as (
    select ev.a, ev.category, count(*) filter (where ev.event_type = 'lead_action') as leads
    from ev where ev.category is not null group by ev.a, ev.category
  ),
  top_c as (
    select distinct on (pc.a) pc.a, pc.category
    from per_cat pc order by pc.a, pc.leads desc
  )
  select
    ev.a,
    count(*) filter (where ev.event_type = 'listing_view'),
    count(*) filter (where ev.event_type = 'lead_action'),
    count(*) filter (where ev.event_type = 'impression'),
    count(distinct ev.listing_slug),
    count(distinct ev.listing_slug) filter (where ev.plan is not null and ev.plan <> 'free'),
    max(tc.category),
    max(tl.listing_slug),
    max(coalesce(tl.bname, tl.listing_slug))
  from ev
  left join top_c tc on tc.a = ev.a
  left join top_l tl on tl.a = ev.a
  group by ev.a
  order by 3 desc, 2 desc;
end;
$$;
revoke all on function public.admin_area_demand(timestamptz,timestamptz) from public;
grant execute on function public.admin_area_demand(timestamptz,timestamptz) to authenticated;

-- ── 7. admin_category_demand(): demand by category + supply gap inputs ───────
create or replace function public.admin_category_demand(p_from timestamptz, p_to timestamptz)
returns table (
  category text, listing_views bigint, lead_actions bigint, impressions bigint,
  vendors_active bigint, paid_vendors bigint, top_listing text, top_listing_name text
)
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  return query
  with ev as (
    select e.*, b.plan, b.name as bname
    from public.analytics_events e
    left join public.businesses b on b.slug = e.listing_slug
    where e.created_at >= p_from and e.created_at < p_to and e.category is not null
  ),
  per_listing as (
    select ev.category as c, ev.listing_slug, max(ev.bname) as bname,
           count(*) filter (where ev.event_type = 'lead_action') as leads
    from ev where ev.listing_slug is not null
    group by ev.category, ev.listing_slug
  ),
  top_l as (
    select distinct on (pl.c) pl.c, pl.listing_slug, pl.bname
    from per_listing pl order by pl.c, pl.leads desc
  )
  select
    ev.category,
    count(*) filter (where ev.event_type = 'listing_view'),
    count(*) filter (where ev.event_type = 'lead_action'),
    count(*) filter (where ev.event_type = 'impression'),
    count(distinct ev.listing_slug),
    count(distinct ev.listing_slug) filter (where ev.plan is not null and ev.plan <> 'free'),
    max(tl.listing_slug),
    max(coalesce(tl.bname, tl.listing_slug))
  from ev
  left join top_l tl on tl.c = ev.category
  group by ev.category
  order by 3 desc, 2 desc;
end;
$$;
revoke all on function public.admin_category_demand(timestamptz,timestamptz) from public;
grant execute on function public.admin_category_demand(timestamptz,timestamptz) to authenticated;

-- ── 8. admin_opportunities(): who to sell to first ───────────────────────────
-- Free-plan (or unclaimed) listings ranked by the estimated value of the leads
-- they received free — the outreach hit-list. suggested_offer is a starting
-- pitch, not a rule engine.
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
    select e.*, b.name as bname, b.category as bcat, b.area as barea,
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
      when agg.bplan = 'free' and agg.claims > 0                  then 'claim_followup'
      when agg.bplan = 'free' and agg.leads >= 10                 then 'featured'
      when agg.bplan = 'free' and agg.leads >= 3                  then 'verified'
      when agg.bplan in ('verified') and agg.leads >= 10          then 'featured'
      when agg.bplan in ('featured') and agg.leads >= 20          then 'premium'
      when agg.bplan = 'free' and agg.views >= 25                 then 'verified'
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

-- ── 9. Owner-facing: daily trend + top search terms for the Insights tab ─────
-- Clerk-scoped like 0044's owner_campaign_performance: auth.jwt()->>'sub'.
create or replace function public.owner_listing_daily(p_from timestamptz, p_to timestamptz)
returns table (day date, listing_views bigint, lead_actions bigint)
language plpgsql security definer set search_path = public as $$
begin
  return query
  with mine as (
    select b.slug from public.businesses b
    where b.owner_id = (auth.jwt() ->> 'sub') or b.claimed_by = (auth.jwt() ->> 'sub')
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

-- Search terms typed by sessions that then viewed one of the caller's listings
-- (aggregated — no session ids or journeys are exposed to owners).
create or replace function public.owner_top_queries(p_from timestamptz, p_to timestamptz, p_limit int default 10)
returns table (query text, searches bigint)
language plpgsql security definer set search_path = public as $$
begin
  return query
  with mine as (
    select b.slug from public.businesses b
    where b.owner_id = (auth.jwt() ->> 'sub') or b.claimed_by = (auth.jwt() ->> 'sub')
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
  limit p_limit;
end;
$$;
revoke all on function public.owner_top_queries(timestamptz,timestamptz,int) from public;
grant execute on function public.owner_top_queries(timestamptz,timestamptz,int) to authenticated;

-- ============================================================
-- supabase/migrations/0046_lead_marketplace.sql
-- ============================================================

-- Humble Halal — Lead Marketplace (shared-lead routing + lead subscriptions).
-- Consumers request quotes for high-ticket verticals; each lead is routed to up
-- to LEAD_ROUTE_CAP (5) matching claimed businesses (Bark/Thumbtack model).
-- Businesses pay a monthly Stripe subscription with a lead quota to accept them.
--
-- Writes go through the service-role key (app/api/*). Direct table reads are
-- admin-only (is_admin(), 0010); owners read via /api/owner/leads because PII
-- masking is per-row conditional and can't be expressed as column RLS.
-- Run after 0045.

-- ── 1. Extend leads: marketplace context, consent, routing state ─────────────
alter table public.leads
  add column if not exists vertical_id text,
  add column if not exists source_listing_slug text,
  add column if not exists source_path text,
  add column if not exists consent_contact boolean not null default false,
  add column if not exists consent_version text,
  add column if not exists consented_at timestamptz,
  add column if not exists routed_at timestamptz,
  add column if not exists anonymized_at timestamptz;

-- Widen the status ladder (was new/contacted/closed/spam).
alter table public.leads drop constraint if exists leads_status_check;
alter table public.leads add constraint leads_status_check
  check (status in ('new','reviewing','routed','contacted','closed','spam'));

create index if not exists leads_status_created on public.leads (status, created_at desc);
create index if not exists leads_vertical on public.leads (vertical_id);

-- ── 2. lead_routes: a routed share of a lead to one business ─────────────────
create table if not exists public.lead_routes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  status text not null default 'sent'
    check (status in ('sent','viewed','accepted','contacted','won','lost','expired')),
  quota_consumed boolean not null default false,   -- true when acceptance burned a paid credit
  sent_at timestamptz not null default now(),
  viewed_at timestamptz,
  accepted_at timestamptz,
  outcome_at timestamptz,
  unique (lead_id, business_id)
);
create index if not exists lead_routes_biz on public.lead_routes (business_id, status, sent_at desc);
create index if not exists lead_routes_lead on public.lead_routes (lead_id);

alter table public.lead_routes enable row level security;
drop policy if exists "lead_routes admin read" on public.lead_routes;
create policy "lead_routes admin read" on public.lead_routes
  for select to authenticated using ( public.is_admin() );
-- No owner select policy: owners read masked routes via /api/owner/leads
-- (service role), which hides PII until a route is accepted.

-- ── 3. lead_preferences: what verticals/areas a business wants leads for ─────
create table if not exists public.lead_preferences (
  business_id uuid primary key references public.businesses(id) on delete cascade,
  verticals text[] not null default '{}',
  areas text[] not null default '{}',     -- Listing.area names; empty = island-wide
  active boolean not null default true,
  updated_at timestamptz not null default now()
);
alter table public.lead_preferences enable row level security;
drop policy if exists "lead_prefs admin read" on public.lead_preferences;
create policy "lead_prefs admin read" on public.lead_preferences
  for select to authenticated using ( public.is_admin() );
-- Owners read/write their own prefs via /api/owner/leads/preferences (service role).

-- ── 4. Lead subscriptions ride the existing subscriptions table ──────────────
-- One webhook-owned billing system: kind distinguishes listing plans from leads.
alter table public.subscriptions
  add column if not exists kind text not null default 'plan'
    check (kind in ('plan','leads')),
  add column if not exists current_period_start timestamptz,
  add column if not exists monthly_quota int;
create index if not exists subscriptions_biz_kind
  on public.subscriptions (business_id, kind, status);

-- Quota consumed in the current period is COUNTED, never stored as a counter:
--   select count(*) from lead_routes lr
--   where lr.business_id = ? and lr.quota_consumed
--     and lr.accepted_at >= subscriptions.current_period_start;
-- (no drift; the ledger is the source of truth).

-- ============================================================
-- supabase/migrations/0047_halal_verdicts.sql
-- ============================================================

-- Humble Halal — AI-drafted halal verdicts with human approval.
-- An LLM DRAFTS a structured verdict (verdict + confidence + ingredient table +
-- cited sources) into this queue as status='pending'. A human admin reviews and
-- approves before ANYTHING publishes. This preserves the MUIS compliance
-- posture: verdicts are never auto-published, and "halal" is never asserted
-- without a cited official source (enforced in /api/admin/verdicts on approve).
--
-- Writes go through the service-role key (AI drafter + admin routes). Public may
-- read ONLY approved rows; admins read all. Run after 0045.
-- (0046 is claimed by the parallel feat/lead-marketplace branch.)

create table if not exists public.halal_verdicts (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  page_type text not null check (page_type in ('brand','ingredient','enumber')),
  name text not null,
  h1 text,
  -- verdict + confidence are SEPARATE axes (never collapse them).
  verdict text not null check (verdict in ('halal','likely','mashbooh','haram','depends')),
  confidence text not null check (confidence in ('high','medium','low')),
  verdict_label text,
  cert_status text,
  one_line_answer text,
  confidence_explainer text,
  date_reviewed text,
  -- Structured payload (validated against the zod schema in lib/verdicts.ts).
  why_verdict jsonb not null default '[]',
  ingredient_table jsonb not null default '[]',
  look_for jsonb not null default '[]',
  alternatives jsonb not null default '[]',
  official_sources jsonb not null default '[]',
  scholarly_views jsonb not null default '[]',
  internal_links jsonb not null default '{}',
  faq_answer text,
  -- The raw input the AI was given (audit trail for a drafted verdict).
  source_input jsonb not null default '{}',
  -- Review workflow.
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  drafted_by text not null default 'ai',
  reviewed_by text references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Exactly one live (approved) verdict per slug.
create unique index if not exists halal_verdicts_slug_approved
  on public.halal_verdicts (slug) where status = 'approved';
create index if not exists halal_verdicts_status_idx on public.halal_verdicts (status, created_at desc);

alter table public.halal_verdicts enable row level security;

-- Public reads ONLY approved verdicts (the live pages).
drop policy if exists "halal_verdicts public read approved" on public.halal_verdicts;
create policy "halal_verdicts public read approved" on public.halal_verdicts
  for select using (status = 'approved');

-- Admins read everything (the review queue).
drop policy if exists "halal_verdicts admin read" on public.halal_verdicts;
create policy "halal_verdicts admin read" on public.halal_verdicts
  for select to authenticated using ( public.is_admin() );

-- No insert/update/delete policies → only the service role writes (AI drafter +
-- admin approve/reject routes).

-- ============================================================
-- supabase/migrations/0048_halal_passport.sql
-- ============================================================

-- Humble Halal — Halal Passport (loyalty) + consumer referrals.
-- Points are SUMMED from an append-only ledger (never a stored balance — the
-- lead-marketplace 0046 no-drift pattern). All writes go through service-role
-- SECURITY DEFINER RPCs (the redeem_promo/increment_ref_click convention, 0041/0042).
-- Identity = Clerk sub (profiles.id text; RLS via auth.jwt()->>'sub', 0031).
-- Everything ships behind PASSPORT_ENABLED (default off). Run after 0046.
-- (0047 = halal-verdicts is an open PR; this is 0048.)

-- ── 1. Points ledger ─────────────────────────────────────────────────────────
create table if not exists public.passport_points (
  id          uuid primary key default gen_random_uuid(),
  user_id     text not null references public.profiles(id) on delete cascade,
  delta       int  not null,                 -- >0 earn-only in v1; signed for future spend
  reason      text not null,                 -- display label, e.g. 'Wrote a review'
  source_type text not null,                 -- 'review'|'follow'|'visit'|'checkin'|'referral'|'bonus'
  source_id   text,                          -- review id / business id / referral id / date
  dedupe_key  text not null,                 -- idempotency, unique per user
  created_at  timestamptz not null default now(),
  unique (user_id, dedupe_key)
);
create index if not exists passport_points_user_idx on public.passport_points (user_id, created_at desc);

alter table public.passport_points enable row level security;
drop policy if exists passport_points_select_own on public.passport_points;
create policy passport_points_select_own on public.passport_points
  for select to authenticated using (user_id = (auth.jwt() ->> 'sub'));
-- No write policy → only service-role / award_points() writes.

-- Idempotent award (redeem_promo pattern): inserts once per (user,dedupe_key);
-- returns TRUE only when it actually awarded (so callers fire notifications once).
create or replace function public.award_points(
  p_user_id text, p_delta int, p_reason text,
  p_source_type text, p_source_id text, p_dedupe_key text
) returns boolean language plpgsql security definer set search_path = public as $$
declare n int;
begin
  insert into passport_points (user_id, delta, reason, source_type, source_id, dedupe_key)
  values (p_user_id, p_delta, p_reason, p_source_type, p_source_id, p_dedupe_key)
  on conflict (user_id, dedupe_key) do nothing;
  get diagnostics n = row_count;
  return n > 0;
end; $$;
revoke execute on function public.award_points(text,int,text,text,text,text) from public;
grant  execute on function public.award_points(text,int,text,text,text,text) to service_role;

-- ── 2. Referral codes (one per user, minted on demand) ───────────────────────
create table if not exists public.referral_codes (
  owner_user_id text primary key references public.profiles(id) on delete cascade,
  code    text not null unique check (code ~ '^[a-z0-9]{4,12}$'),
  clicks  int  not null default 0,
  signups int  not null default 0,
  created_at timestamptz not null default now()
);
alter table public.referral_codes enable row level security;
drop policy if exists referral_codes_select_own on public.referral_codes;
create policy referral_codes_select_own on public.referral_codes
  for select to authenticated using (owner_user_id = (auth.jwt() ->> 'sub'));

create or replace function public.increment_referral_click(p_code text)
returns void language sql security definer set search_path = public as $$
  update referral_codes set clicks = clicks + 1 where code = lower(p_code);
$$;
revoke execute on function public.increment_referral_click(text) from public;
grant  execute on function public.increment_referral_click(text) to service_role;

-- ── 3. Referrals (referred once ever; self-referral blocked) ─────────────────
create table if not exists public.referrals (
  id           uuid primary key default gen_random_uuid(),
  referrer_id  text not null references public.profiles(id) on delete cascade,
  referred_id  text not null unique references public.profiles(id) on delete cascade,
  code         text not null,
  status       text not null default 'pending' check (status in ('pending','qualified')),
  qualified_at timestamptz,
  created_at   timestamptz not null default now(),
  check (referrer_id <> referred_id)
);
create index if not exists referrals_referrer_idx on public.referrals (referrer_id, status);
alter table public.referrals enable row level security;
drop policy if exists referrals_select_involved on public.referrals;
create policy referrals_select_involved on public.referrals
  for select to authenticated using (
    referrer_id = (auth.jwt() ->> 'sub') or referred_id = (auth.jwt() ->> 'sub'));

-- Credit on signup (Clerk webhook). Validates code→referrer, blocks self &
-- double-referral atomically, bumps signups. Returns referrer_id or null.
create or replace function public.credit_referral(p_referred_id text, p_code text)
returns text language plpgsql security definer set search_path = public as $$
declare v_ref text; n int;
begin
  select owner_user_id into v_ref from referral_codes where code = lower(p_code);
  if v_ref is null or v_ref = p_referred_id then return null; end if;
  insert into referrals (referrer_id, referred_id, code)
  values (v_ref, p_referred_id, lower(p_code))
  on conflict (referred_id) do nothing;
  get diagnostics n = row_count;
  if n > 0 then update referral_codes set signups = signups + 1 where code = lower(p_code); end if;
  return case when n > 0 then v_ref else null end;
end; $$;
revoke execute on function public.credit_referral(text,text) from public;
grant  execute on function public.credit_referral(text,text) to service_role;

-- Qualify pending→qualified on the referred user's first real action.
-- Returns the row ONLY on the transition (so points are awarded once).
create or replace function public.qualify_referral(p_referred_id text)
returns table (referral_id uuid, referrer_id text)
language sql security definer set search_path = public as $$
  update referrals
     set status = 'qualified', qualified_at = now()
   where referred_id = p_referred_id and status = 'pending'
  returning id, referrer_id;
$$;
revoke execute on function public.qualify_referral(text) from public;
grant  execute on function public.qualify_referral(text) to service_role;

-- ── 4. Public passport opt-in (PDPA: default private, opaque token) ──────────
create table if not exists public.passport_settings (
  user_id      text primary key references public.profiles(id) on delete cascade,
  is_public    boolean not null default false,
  share_token  text not null unique default encode(gen_random_bytes(9),'hex'),
  display_name text,
  updated_at   timestamptz not null default now()
);
alter table public.passport_settings enable row level security;
drop policy if exists passport_settings_select_own on public.passport_settings;
create policy passport_settings_select_own on public.passport_settings
  for select to authenticated using (user_id = (auth.jwt() ->> 'sub'));
-- Writes via service-role API only.

-- Public aggregates by share token — non-PII, only when is_public (mirrors
-- vendor_scorecard_by_token). Points summed, counts derived; NO email/full name.
create or replace function public.public_passport_by_token(p_token text)
returns table (display_name text, total_points int, visit_count int,
               review_count int, follow_count int, joined_month text)
language sql stable security definer set search_path = public as $$
  select
    coalesce(nullif(ps.display_name,''), nullif(split_part(coalesce(p.name,''),' ',1),''), 'A Humble Halal member'),
    coalesce((select sum(delta)::int from passport_points where user_id = ps.user_id), 0),
    (select count(distinct source_id)::int from passport_points where user_id = ps.user_id and source_type='visit'),
    (select count(*)::int from passport_points where user_id = ps.user_id and source_type='review'),
    (select count(*)::int from passport_points where user_id = ps.user_id and source_type='follow'),
    to_char(p.created_at,'Mon YYYY')
  from passport_settings ps join profiles p on p.id = ps.user_id
  where ps.share_token = p_token and ps.is_public;
$$;
revoke execute on function public.public_passport_by_token(text) from public;
grant  execute on function public.public_passport_by_token(text) to anon, authenticated, service_role;

-- ============================================================
-- supabase/migrations/0053_feature_flags.sql
-- ============================================================

-- 0053_feature_flags.sql — admin-controllable feature flags.
-- Global overrides live in platform_settings (single row id=1); a NULL column
-- means "defer to the env var" and true/false is an explicit admin override.
-- Per-business overrides live in business_feature_overrides.

-- ── 1. Global: widen platform_settings with a nullable column per flag ───────
-- Existing paid_* columns were never read by the gate (getServerFlags read env
-- only); make them nullable and NULL so behaviour stays env-driven until an
-- admin flips something. ramadan_mode_enabled keeps its own semantics (0022).
alter table public.platform_settings
  alter column paid_tickets_enabled drop not null,
  alter column paid_ads_enabled     drop not null,
  alter column paid_plans_enabled   drop not null;
update public.platform_settings
  set paid_tickets_enabled = null, paid_ads_enabled = null, paid_plans_enabled = null
  where id = 1;

alter table public.platform_settings
  add column if not exists paid_hotels_enabled    boolean,
  add column if not exists paid_flights_enabled   boolean,
  add column if not exists paynow_enabled         boolean,
  add column if not exists cert_vault_enabled     boolean,
  add column if not exists semantic_search_enabled boolean,
  add column if not exists ai_concierge_enabled   boolean,
  add column if not exists halal_verdicts_enabled boolean,
  add column if not exists lead_routing_enabled   boolean,
  add column if not exists paid_leads_enabled     boolean,
  add column if not exists passport_enabled       boolean;

-- Guarantee the single settings row exists so reads never miss.
insert into public.platform_settings (id) values (1) on conflict (id) do nothing;

-- ── 2. Per-business overrides ────────────────────────────────────────────────
create table if not exists public.business_feature_overrides (
  business_id uuid not null references public.businesses(id) on delete cascade,
  feature_key text not null
    check (feature_key in ('paidPlans','paidAds','certVault','leadRouting','paidLeads')),
  enabled     boolean not null,
  updated_at  timestamptz not null default now(),
  primary key (business_id, feature_key)
);
create index if not exists bfo_business on public.business_feature_overrides (business_id);

alter table public.business_feature_overrides enable row level security;
-- Admin-only read; all writes go through the service-role API route.
drop policy if exists "bfo admin read" on public.business_feature_overrides;
create policy "bfo admin read" on public.business_feature_overrides
  for select to authenticated using ( public.is_admin() );
