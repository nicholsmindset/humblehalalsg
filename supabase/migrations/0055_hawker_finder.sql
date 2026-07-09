-- Humble Halal — Hawker Finder (Track A, Slice 1). A halal hawker-stall finder
-- grouped by hawker centre. Stalls reuse the `businesses` table (all trust/score/
-- confirm/badge/map machinery); this adds only a thin `hawker_centres` entity
-- (its own coords/address for the map + centre page) and two link columns on
-- businesses. Gated behind the hawker_finder feature flag. Run after 0054.

-- 1) Hawker centre entity (public-read directory data).
create table if not exists public.hawker_centres (
  id text primary key,                 -- slug, e.g. 'geylang-serai-market'
  name text not null,
  address text,
  region text,                          -- for grouping on /hawker (e.g. 'East', 'Central')
  lat double precision,
  lng double precision,
  nearest_mrt text,
  hours text,                           -- human string, e.g. '6am–10pm'
  blurb text,
  source text,                          -- provenance, e.g. 'NEA', 'community', 'manual'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists hawker_centres_region_idx on public.hawker_centres (region, name);

alter table public.hawker_centres enable row level security;
-- Public directory: anyone may read; only the service role writes (seed/admin).
drop policy if exists "hawker_centres public read" on public.hawker_centres;
create policy "hawker_centres public read" on public.hawker_centres for select using (true);

-- 2) Link a business (stall) to its centre. Stall = a normal business row.
alter table public.businesses add column if not exists hawker_centre_id text references public.hawker_centres(id) on delete set null;
alter table public.businesses add column if not exists stall_no text;   -- unit, e.g. '#01-42'
create index if not exists businesses_hawker_centre_idx on public.businesses (hawker_centre_id) where hawker_centre_id is not null;

-- 3) Feature flag column (matches FLAG_COLUMN.hawkerFinder in lib/flags.ts).
alter table public.platform_settings add column if not exists hawker_finder_enabled boolean;

-- 4) Register the 'hawker' category in the admin-editable catalog (0038) so
--    stalls carry cat_id='hawker' and render with a proper label. Ignore if the
--    directory_categories table isn't present in this environment.
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='directory_categories') then
    insert into public.directory_categories (id, label, active)
    values ('hawker', 'Hawker Stall', true)
    on conflict (id) do nothing;
  end if;
end $$;
