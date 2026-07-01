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
