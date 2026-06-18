-- Humble Halal — airport transfer bookings (Mozio v2). Mozio is merchant of
-- record (Mozio-collects: it generates the payment page); we record the outcome.
-- Reservation is async, so the status state machine mirrors flight_bookings:
-- pending  = reservation created, not yet paid
-- confirming = paid, awaiting Mozio confirmation
-- then confirmed / cancelled / refunded / failed.
-- Run after 0001–0028.

create table if not exists transfer_bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete set null,
  mozio_search_id text,
  mozio_reservation_id text,
  confirmation_number text,
  pickup text,
  dropoff text,
  pickup_datetime timestamptz,
  passengers int,
  vehicle_class text,
  contact_email text,
  currency text,
  total numeric,
  commission_amount numeric,
  status text not null default 'pending'
    check (status in ('pending','confirming','confirmed','cancelled','refunded','failed')),
  payment_status text,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists transfer_bookings_open_idx on transfer_bookings (status)
  where status in ('pending','confirming');

alter table transfer_bookings enable row level security;
drop policy if exists "transfer owner read" on transfer_bookings;
create policy "transfer owner read" on transfer_bookings for select using (
  user_id = auth.uid()
  or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));
-- Writes go through the service-role key from /api/travel/transfers/*.
