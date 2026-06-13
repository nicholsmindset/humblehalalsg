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
