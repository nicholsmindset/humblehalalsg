-- Humble Halal — AI listing enrichment with human approval (Phase 1: text + SEO).
-- An LLM DRAFTS an improved description + SEO fields for an existing business
-- into this queue as status='pending'. A human admin reviews and approves before
-- ANYTHING is written back to the live listing. Nothing auto-publishes.
--
-- Halal-safety: the AI is instructed never to assert halal certification (that
-- comes only from the MUIS verification workflow); enrichment only rewords the
-- owner-submitted facts and fills SEO. Writes go through the service role
-- (AI drafter + admin routes). Run after 0053.
-- (0049-0052 are claimed by the parallel passport/verdict-security branches.)

-- 1) Stored SEO fields on the live listing (nullable; generateMetadata prefers them).
alter table public.businesses add column if not exists seo_title text;
alter table public.businesses add column if not exists seo_description text;

-- 2) The enrichment review queue.
create table if not exists public.listing_enrichments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  business_slug text not null,
  business_name text not null,
  -- The AI draft (validated against EnrichmentSchema in lib/listing-enrich.ts).
  generated jsonb not null default '{}',
  -- The input the AI was given (audit trail).
  source_input jsonb not null default '{}',
  model text,
  -- Review workflow.
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  drafted_by text not null default 'ai',
  reviewed_by text references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- At most one pending draft per business (re-drafting supersedes; enforced in the route).
create unique index if not exists listing_enrichments_business_pending
  on public.listing_enrichments (business_id) where status = 'pending';
create index if not exists listing_enrichments_status_idx
  on public.listing_enrichments (status, created_at desc);

alter table public.listing_enrichments enable row level security;

-- Admins read the queue; nothing public (drafts never surface until written to
-- the business row on approve). No insert/update/delete policies → service role only.
drop policy if exists "listing_enrichments admin read" on public.listing_enrichments;
create policy "listing_enrichments admin read" on public.listing_enrichments
  for select to authenticated using ( public.is_admin() );

-- 3) Feature flag column (global admin override; defaults to env/off). Matches
--    the FLAG_COLUMN mapping in lib/flags.ts.
alter table public.platform_settings add column if not exists listing_enrichment_enabled boolean;
