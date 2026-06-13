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
