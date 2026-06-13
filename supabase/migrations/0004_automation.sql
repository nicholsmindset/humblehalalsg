-- Humble Halal — automation support objects for the cron + scheduled jobs.
-- Adds the tables/RPC/view the playbook assumed. Run after 0001–0003.

-- ── verification_log: every cert/freshness event (B1, B2, restamp) ──────────
create table if not exists verification_log (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  event text not null,                 -- cert_expired | reverified | flagged | restamped
  detail text,
  actor uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ── audit_log: admin actions (the verify route already best-effort writes it) ─
create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  actor uuid references profiles(id) on delete set null,
  action text not null,
  target text,
  meta jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ── cron_runs: heartbeat/log for every scheduled job ────────────────────────
create table if not exists cron_runs (
  id uuid primary key default gen_random_uuid(),
  job text not null,
  ok boolean default true,
  notes text,
  ran_at timestamptz not null default now()
);

alter table verification_log enable row level security;
alter table audit_log enable row level security;
alter table cron_runs enable row level security;
drop policy if exists "verlog admin read" on verification_log;
drop policy if exists "audit admin read" on audit_log;
drop policy if exists "cron admin read" on cron_runs;
create policy "verlog admin read" on verification_log for select using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));
create policy "audit admin read" on audit_log for select using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));
create policy "cron admin read" on cron_runs for select using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

-- ── get_directory_stats(): honest homepage numbers (B3) ─────────────────────
create or replace function get_directory_stats()
returns jsonb language sql stable as $$
  select jsonb_build_object(
    'total',        (select count(*) from businesses where status = 'published'),
    'muis',         (select count(*) from businesses where status = 'published' and halal_tier = 'muis'),
    'muslim_owned', (select count(*) from businesses where status = 'published' and 'muslim-owned' = any(attributes)),
    'reviews',      (select count(*) from reviews where status = 'published'),
    'updated_at',   now()
  );
$$;

-- ── category × area counts: flips pages indexable at the threshold (B3) ─────
-- businesses.cat_id is the top-level category (0001); area is the SG town (0001).
create or replace view category_area_counts as
  select cat_id, area, count(*) as n
  from businesses
  where status = 'published'
  group by cat_id, area;
