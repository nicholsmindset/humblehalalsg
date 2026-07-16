-- 0074 — Business media governance and provenance.
-- Keeps businesses.photos as the public, ordered projection while turning the
-- existing photos table into the auditable source record for new uploads.

begin;

alter table public.photos add column if not exists role text not null default 'gallery';
alter table public.photos add column if not exists source text not null default 'owner_upload';
alter table public.photos add column if not exists rights_confirmed boolean not null default false;
alter table public.photos add column if not exists alt_text text;
alter table public.photos add column if not exists sort_order int not null default 0;
alter table public.photos add column if not exists width int;
alter table public.photos add column if not exists height int;
alter table public.photos add column if not exists focal_x numeric(5,4) not null default .5;
alter table public.photos add column if not exists focal_y numeric(5,4) not null default .5;
alter table public.photos add column if not exists content_hash text;
alter table public.photos add column if not exists reviewed_by text references public.profiles(id) on delete set null;
alter table public.photos add column if not exists reviewed_at timestamptz;
alter table public.photos add column if not exists rejection_reason text;
alter table public.photos add column if not exists updated_at timestamptz not null default now();

alter table public.photos drop constraint if exists photos_role_check;
alter table public.photos add constraint photos_role_check check (role in ('cover','gallery','logo','menu'));
alter table public.photos drop constraint if exists photos_source_check;
alter table public.photos add constraint photos_source_check check (source in ('owner_upload','admin_upload','official_website','social_media','community','legacy'));
alter table public.photos drop constraint if exists photos_focal_check;
alter table public.photos add constraint photos_focal_check check (focal_x between 0 and 1 and focal_y between 0 and 1);
alter table public.photos drop constraint if exists photos_dimensions_check;
alter table public.photos add constraint photos_dimensions_check check ((width is null or width > 0) and (height is null or height > 0));

create index if not exists photos_business_order_idx on public.photos (business_id, status, role, sort_order, created_at);
create unique index if not exists photos_business_hash_idx on public.photos (business_id, content_hash) where content_hash is not null;

create or replace function public.touch_photo_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;
drop trigger if exists trg_photos_updated_at on public.photos;
create trigger trg_photos_updated_at before update on public.photos
for each row execute function public.touch_photo_updated_at();

commit;
notify pgrst, 'reload schema';
