-- Humble Halal — AI-drafted halal verdicts with human approval.
-- An LLM DRAFTS a structured verdict (verdict + confidence + ingredient table +
-- cited sources) into this queue as status='pending'. A human admin reviews and
-- approves before ANYTHING publishes. This preserves the MUIS compliance
-- posture: verdicts are never auto-published, and "halal" is never asserted
-- without a cited official source (enforced in /api/admin/verdicts on approve).
--
-- Writes go through the service-role key (AI drafter + admin routes). Public may
-- read ONLY approved rows; admins read all. Run after 0045.
-- (0046 is claimed by the parallel feat/lead-marketplace branch.)

create table if not exists public.halal_verdicts (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  page_type text not null check (page_type in ('brand','ingredient','enumber')),
  name text not null,
  h1 text,
  -- verdict + confidence are SEPARATE axes (never collapse them).
  verdict text not null check (verdict in ('halal','likely','mashbooh','haram','depends')),
  confidence text not null check (confidence in ('high','medium','low')),
  verdict_label text,
  cert_status text,
  one_line_answer text,
  confidence_explainer text,
  date_reviewed text,
  -- Structured payload (validated against the zod schema in lib/verdicts.ts).
  why_verdict jsonb not null default '[]',
  ingredient_table jsonb not null default '[]',
  look_for jsonb not null default '[]',
  alternatives jsonb not null default '[]',
  official_sources jsonb not null default '[]',
  scholarly_views jsonb not null default '[]',
  internal_links jsonb not null default '{}',
  faq_answer text,
  -- The raw input the AI was given (audit trail for a drafted verdict).
  source_input jsonb not null default '{}',
  -- Review workflow.
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  drafted_by text not null default 'ai',
  reviewed_by text references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Exactly one live (approved) verdict per slug.
create unique index if not exists halal_verdicts_slug_approved
  on public.halal_verdicts (slug) where status = 'approved';
create index if not exists halal_verdicts_status_idx on public.halal_verdicts (status, created_at desc);

alter table public.halal_verdicts enable row level security;

-- Public reads ONLY approved verdicts (the live pages).
drop policy if exists "halal_verdicts public read approved" on public.halal_verdicts;
create policy "halal_verdicts public read approved" on public.halal_verdicts
  for select using (status = 'approved');

-- Admins read everything (the review queue).
drop policy if exists "halal_verdicts admin read" on public.halal_verdicts;
create policy "halal_verdicts admin read" on public.halal_verdicts
  for select to authenticated using ( public.is_admin() );

-- No insert/update/delete policies → only the service role writes (AI drafter +
-- admin approve/reject routes).
