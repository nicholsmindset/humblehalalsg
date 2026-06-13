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
  for insert with check (auth.uid() = user_id or user_id is null);
