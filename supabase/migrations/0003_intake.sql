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
