-- Social auto-posting outbox (Phase 4 growth loop).
-- New/updated content is enqueued as `pending_approval`; a human flips rows to
-- `approved`; a cron dispatches approved rows to a provider webhook (Buffer/Meta/
-- custom) and marks them `sent`/`failed`. Never auto-posts without approval.
create table if not exists public.social_outbox (
  id            uuid primary key default gen_random_uuid(),
  kind          text not null default 'blog_post',   -- blog_post | listing | event
  ref_slug      text,                                 -- source slug (for dedupe)
  url           text not null,                        -- canonical URL to share
  caption       text,
  image_url     text,                                 -- share card / hero
  status        text not null default 'pending_approval', -- pending_approval|approved|sent|failed|skipped
  provider      text,
  result        jsonb,
  attempt_count int not null default 0,
  created_at    timestamptz not null default now(),
  approved_at   timestamptz,
  sent_at       timestamptz,
  unique (kind, ref_slug)
);

create index if not exists social_outbox_status_idx on public.social_outbox (status, created_at);

-- Service-role only (all access is via getSupabaseAdmin, which bypasses RLS).
alter table public.social_outbox enable row level security;
