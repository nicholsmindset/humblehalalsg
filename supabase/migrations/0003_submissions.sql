-- User-generated submissions: suggest a place, claim a listing, report an
-- issue, add-listing applications and host-event applications. One table with
-- a type discriminator + jsonb payload; rows are promoted to real directory
-- records by an admin. Written only via the service-role API route.

create table if not exists submissions (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('suggest','claim','report','listing','event')),
  listing_ref text,                          -- directory id/slug the submission refers to (claim/report)
  name text,
  email text,
  phone text,
  payload jsonb not null default '{}'::jsonb,
  file_paths jsonb not null default '[]'::jsonb,  -- storage object paths in the `uploads` bucket
  status text not null default 'new' check (status in ('new','reviewing','accepted','rejected')),
  created_at timestamptz not null default now()
);

create index if not exists submissions_type_status_idx on submissions (type, status, created_at desc);

-- Service-role only: RLS on with no policies blocks anon/authenticated access.
alter table submissions enable row level security;

-- Close the gap from 0001: webhook_events had RLS disabled.
alter table webhook_events enable row level security;

-- Private storage bucket for submission attachments (photos, proof documents).
insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', false)
on conflict (id) do nothing;
