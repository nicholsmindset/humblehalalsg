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
