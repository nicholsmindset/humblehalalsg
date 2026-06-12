-- Humble Halal — directory build-out: richer business fields, taxonomy,
-- reviews/photos/claims, staging pipeline, halal score. Builds on 0001_init.sql.

-- ── businesses: richer directory fields ──────────────────────────────────────
alter table businesses
  add column if not exists website text,
  add column if not exists socials jsonb default '{}'::jsonb,
  add column if not exists description text,
  add column if not exists price_level text,                  -- $ / $$ / $$$ / $$$$
  add column if not exists photos jsonb default '[]'::jsonb,  -- [{url,caption}]
  add column if not exists opening_hours jsonb default '[]'::jsonb, -- [{day,open,close}]
  add column if not exists lat double precision,
  add column if not exists lng double precision,
  add column if not exists subcategory_id text,
  add column if not exists attributes text[] default '{}',    -- prayer-space, women-friendly, …
  add column if not exists source text default 'manual',      -- nea | owner | community | manual
  add column if not exists provenance jsonb default '{}'::jsonb,
  add column if not exists claimed_by uuid references profiles(id) on delete set null,
  add column if not exists nea_licence_no text,
  add column if not exists muis_cert_no text,
  add column if not exists muis_scheme text,
  add column if not exists muis_expiry date,
  add column if not exists last_verified_at timestamptz,
  add column if not exists status text default 'published'
     check (status in ('staging','pending','published','suspended')),
  add column if not exists halal_tier text,                   -- muis|admin|community|declared|pending|reported
  add column if not exists halal_score int;

-- ── taxonomy ─────────────────────────────────────────────────────────────────
create table if not exists categories (
  id text primary key,
  label text not null,
  icon text,
  blurb text,
  sort int default 0
);
create table if not exists subcategories (
  id text primary key,
  category_id text references categories(id) on delete cascade,
  label text not null
);

-- ── staging (seed pipeline lands here; never public) ─────────────────────────
create table if not exists staging_businesses (
  id uuid primary key default gen_random_uuid(),
  staging_id text unique,                -- e.g. nea-W99288X000
  name text not null,
  slug text,
  address text,
  postal text,
  lat double precision,
  lng double precision,
  nea_licence_no text,
  category_suggested text,
  source text not null default 'nea',
  provenance jsonb default '{}'::jsonb,
  duplicate_of uuid references businesses(id) on delete set null,
  match_confidence numeric,
  review_status text not null default 'new' check (review_status in ('new','reviewing','published','rejected','merged')),
  raw jsonb,
  created_at timestamptz not null default now()
);

create table if not exists import_runs (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  rows int default 0,
  ok boolean default true,
  notes text,
  ran_at timestamptz not null default now()
);

-- ── UGC: reviews, photos, claims, confirmations, offers ──────────────────────
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  user_id uuid references profiles(id) on delete set null,
  rating int not null check (rating between 1 and 5),
  text text,
  photos jsonb default '[]'::jsonb,
  status text not null default 'published' check (status in ('pending','published','flagged','removed')),
  reply text,
  replied_at timestamptz,
  helpful int default 0,
  created_at timestamptz not null default now()
);
create table if not exists photos (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  url text not null,
  caption text,
  uploaded_by uuid references profiles(id) on delete set null,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);
create table if not exists claims (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  user_id uuid references profiles(id) on delete set null,
  role text,
  doc_urls jsonb default '[]'::jsonb,
  message text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);
create table if not exists community_confirmations (
  business_id uuid references businesses(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (business_id, user_id)
);
create table if not exists offers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  title text not null,
  details text,
  starts_at date,
  ends_at date,
  active boolean default true,
  created_at timestamptz not null default now()
);
create table if not exists email_log (
  id uuid primary key default gen_random_uuid(),
  to_email text,
  template text,
  business_id uuid references businesses(id) on delete set null,
  sent_at timestamptz not null default now()
);

-- ── events: submission + status (extends 0001 events) ────────────────────────
alter table events
  add column if not exists submitted_by uuid references profiles(id) on delete set null,
  add column if not exists source text default 'owner'; -- owner | community | curated

-- ── RLS ──────────────────────────────────────────────────────────────────────
alter table categories enable row level security;
alter table subcategories enable row level security;
alter table reviews enable row level security;
alter table photos enable row level security;
alter table claims enable row level security;
alter table offers enable row level security;
alter table staging_businesses enable row level security;
alter table community_confirmations enable row level security;

create policy "categories public read" on categories for select using (true);
create policy "subcategories public read" on subcategories for select using (true);
create policy "reviews public read" on reviews for select using (status = 'published');
create policy "photos public read" on photos for select using (status = 'approved');
create policy "offers public read" on offers for select using (active = true);
create policy "confirm read" on community_confirmations for select using (true);

-- authenticated users write their own UGC
create policy "review write own" on reviews for insert with check (user_id = auth.uid());
create policy "photo write own" on photos for insert with check (uploaded_by = auth.uid());
create policy "claim write own" on claims for insert with check (user_id = auth.uid());
create policy "confirm write own" on community_confirmations for insert with check (user_id = auth.uid());

-- staging is admin-only (service-role via API routes; no public/owner access)
-- NOTE: seed CLI + admin actions use the service-role key, which bypasses RLS.
