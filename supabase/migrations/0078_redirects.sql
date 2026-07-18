-- 0078_redirects.sql
-- Durable redirect map for gone content, so old indexed URLs 301 to a relevant
-- hub instead of 404ing. The app computes the most-relevant target LIVE for
-- suspended businesses, cancelled/finished events and unpublished posts (from the
-- entity's own category/area); this table is the durable backstop for rows that
-- no longer exist to resolve from, plus hand-authored manual/marketing redirects.
--
-- Public read (the render path checks it); writes are service-role only, mirroring
-- the notifications convention (no write policy → only the service key writes).

create table if not exists public.redirects (
  from_path  text primary key,
  to_path    text not null,
  kind       text,                 -- 'business' | 'event' | 'blog' | 'travel' | 'manual'
  note       text,
  created_at timestamptz not null default now()
);

alter table public.redirects enable row level security;

drop policy if exists redirects_public_read on public.redirects;
create policy redirects_public_read on public.redirects
  for select using (true);

grant select on public.redirects to anon, authenticated;
