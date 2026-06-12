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
