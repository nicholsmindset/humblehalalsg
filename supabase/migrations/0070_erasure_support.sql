-- 0070: support columns + cleanup for GDPR/PDPA erasure (lib/erasure.ts).
-- orders + hotel_bookings are RETAINED (financial records) but PII-redacted;
-- redacted_at records when. Also purges any pre-existing orphan notifications
-- (user_id is text with no FK — a deleted user left dangling rows) and adds the
-- cascade FK so future deletions clean themselves.
--
-- Rollback:
--   alter table public.orders         drop column if exists redacted_at;
--   alter table public.hotel_bookings drop column if exists redacted_at;
--   alter table public.notifications  drop constraint if exists notifications_user_fk;

alter table public.orders         add column if not exists redacted_at timestamptz;
alter table public.hotel_bookings add column if not exists redacted_at timestamptz;

-- Remove notifications for users that no longer exist (historic orphans).
delete from public.notifications n
 where not exists (select 1 from public.profiles p where p.id = n.user_id);

-- FK so a future profile delete cascades notifications automatically. NOT VALID
-- first (skips scanning existing rows, which we just cleaned), then validate.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'notifications_user_fk'
  ) then
    alter table public.notifications
      add constraint notifications_user_fk
      foreign key (user_id) references public.profiles(id) on delete cascade not valid;
    alter table public.notifications validate constraint notifications_user_fk;
  end if;
end $$;
