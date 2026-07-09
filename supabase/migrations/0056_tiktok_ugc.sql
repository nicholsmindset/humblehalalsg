-- Humble Halal — TikTok UGC pipeline (Track B). Creators/users submit a TikTok
-- URL about a business; an AI classifies + place-matches it as a DRAFT; a human
-- approves; approved videos render on the listing as consent-gated embeds with
-- attribution. Nothing auto-publishes. Embeds reference the TikTok URL (we never
-- re-host video). Run after 0055.

create table if not exists public.tiktok_submissions (
  id uuid primary key default gen_random_uuid(),
  url text not null,                     -- the TikTok video URL
  video_id text,                         -- parsed id
  handle text,                           -- parsed @handle
  submitter_email text,
  claimed_business_id uuid references public.businesses(id) on delete set null,  -- what the submitter said it's about
  note text,
  raw jsonb not null default '{}',       -- sanitized submission payload (audit)
  source text not null default 'self',   -- 'self' (creator/user) | 'admin'
  -- AI classification draft (validated against lib/tiktok.ts TiktokSchema).
  generated jsonb not null default '{}',
  model text,
  -- Review workflow.
  status text not null default 'pending' check (status in ('pending','approved','rejected','removed')),
  matched_business_id uuid references public.businesses(id) on delete set null,  -- final match on approval
  reviewed_by text references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tiktok_submissions_status_idx on public.tiktok_submissions (status, created_at desc);
create index if not exists tiktok_submissions_matched_idx on public.tiktok_submissions (matched_business_id) where status = 'approved';
-- Dedupe: at most one live row per URL.
create unique index if not exists tiktok_submissions_url_uniq on public.tiktok_submissions (url) where status in ('pending','approved');

alter table public.tiktok_submissions enable row level security;

-- Public may read ONLY approved videos (to render on listings). Admins read all.
drop policy if exists "tiktok public read approved" on public.tiktok_submissions;
create policy "tiktok public read approved" on public.tiktok_submissions
  for select using (status = 'approved');
drop policy if exists "tiktok admin read" on public.tiktok_submissions;
create policy "tiktok admin read" on public.tiktok_submissions
  for select to authenticated using ( public.is_admin() );
-- No insert/update/delete policies → only the service role writes (intake + admin).

-- Feature flag column (matches FLAG_COLUMN.tiktokUgc in lib/flags.ts).
alter table public.platform_settings add column if not exists tiktok_ugc_enabled boolean;
