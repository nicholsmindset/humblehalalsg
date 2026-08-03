-- Durable first-party capture when the external newsletter provider is absent
-- or unavailable. This contains email addresses, so it is service-role only.
create table if not exists public.newsletter_signups (
  email text primary key,
  source text not null default 'newsletter',
  name text,
  stage text,
  referring_site text,
  provider_status text not null default 'queued'
    check (provider_status in ('queued', 'synced')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  synced_at timestamptz
);

alter table public.newsletter_signups enable row level security;
revoke all on public.newsletter_signups from public, anon, authenticated;
grant select, insert, update, delete on public.newsletter_signups to service_role;

create index if not exists newsletter_signups_status_idx
  on public.newsletter_signups (provider_status, updated_at);
