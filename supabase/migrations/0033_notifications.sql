-- Humble Halal — in-app notifications + Realtime (Clerk-sub identity).
-- Powers the notification bell; written ONLY by the service role (Edge Functions),
-- read by each user via RLS, pushed live via Supabase Realtime. Run after 0031.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id    text not null,                 -- Clerk sub (matches profiles.id post-0031)
  type       text not null,                 -- 'event_published' | 'cert_change' | ...
  title      text not null,
  body       text,
  link       text,
  dedupe_key text,                          -- e.g. 'event_published:<event_id>'
  read_at    timestamptz,
  created_at timestamptz not null default now()
);
create unique index if not exists notifications_dedupe
  on public.notifications(user_id, type, dedupe_key) where dedupe_key is not null;
create index if not exists notifications_user_unread
  on public.notifications(user_id, read_at, created_at desc);

alter table public.notifications enable row level security;
-- Read your own only (Clerk sub). NO insert/update/delete policy → only the
-- service role writes; users mark-read via the SECURITY DEFINER RPC below.
drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own on public.notifications
  for select to authenticated using (user_id = (auth.jwt() ->> 'sub'));

create or replace function public.mark_notification_read(p_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.notifications set read_at = now()
  where id = p_id and user_id = (auth.jwt() ->> 'sub') and read_at is null;
$$;
revoke all on function public.mark_notification_read(uuid) from public;
grant execute on function public.mark_notification_read(uuid) to authenticated;

-- Idempotency guard for the on-event-published webhook (claim once per event).
alter table public.events add column if not exists notified_at timestamptz;

-- Enable Realtime on notifications (RLS still applies to what each client receives).
do $$
begin
  alter publication supabase_realtime add table public.notifications;
exception when others then
  null; -- already a member
end $$;
