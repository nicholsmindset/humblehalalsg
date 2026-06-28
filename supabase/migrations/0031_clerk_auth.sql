-- Humble Halal — migrate auth from Supabase Auth → Clerk (keep Supabase as the DB).
--
-- Clerk now owns identity. Supabase trusts Clerk JWTs via Third-Party Auth, so the
-- user id is the Clerk id (TEXT like 'user_xxx') read from auth.jwt()->>'sub'
-- instead of auth.uid() (a uuid).
--
-- This migration is DYNAMIC (catalog-driven) so it converts the WHOLE live schema,
-- including tables/policies that may not exist in this branch's migration files
-- (e.g. transfer_bookings, donations, vendor share tokens). It:
--   1. Drops every public RLS policy whose expression references auth.uid()
--      (saving its definition), so column type changes aren't blocked.
--   2. Drops every FK to profiles(id)/auth.users(id), retypes those columns +
--      profiles.id to TEXT, then re-adds the FKs to profiles(id).
--   3. Recreates the saved policies with auth.uid() → (auth.jwt()->>'sub').
--   4. Rewrites the known SECURITY DEFINER functions to the Clerk sub and adds
--      profiles.email; flags any OTHER function still using auth.uid().
--
-- CLEAN CUTOVER ASSUMPTION: user-identity tables are EMPTY (no real users to
-- migrate) so the uuid→text retype is lossless. TRUNCATE any seeded user rows
-- first. Wrapped in a transaction — a failure rolls everything back. Idempotent.

begin;

-- ── 1. Save + drop all auth.uid()-based policies in schema public ──────────────
create temp table _pol_backup on commit drop as
  select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
  from pg_policies
  where schemaname = 'public'
    and ( coalesce(qual, '') like '%auth.uid()%'
       or coalesce(with_check, '') like '%auth.uid()%' );

do $$
declare r record;
begin
  for r in select * from _pol_backup loop
    execute format('drop policy %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- ── 2. Drop FKs to profiles/auth.users (save them), excluding profiles' own FK ──
create temp table _fk_backup on commit drop as
  select con.conname,
         rel.relname  as tbl,
         att.attname  as col,
         con.confdeltype as deltype
  from pg_constraint con
  join pg_class rel       on rel.oid  = con.conrelid
  join pg_namespace ns    on ns.oid   = rel.relnamespace
  join pg_class frel      on frel.oid = con.confrelid
  join pg_namespace fns   on fns.oid  = frel.relnamespace
  cross join lateral unnest(con.conkey) as k(attnum)
  join pg_attribute att   on att.attrelid = con.conrelid and att.attnum = k.attnum
  where con.contype = 'f'
    and ns.nspname = 'public'
    and array_length(con.conkey, 1) = 1
    and ( (fns.nspname = 'public' and frel.relname = 'profiles')
       or (fns.nspname = 'auth'   and frel.relname = 'users') )
    and not (rel.relname = 'profiles' and att.attname = 'id');   -- handle profiles.id separately

do $$
declare r record;
begin
  -- child FKs
  for r in select * from _fk_backup loop
    execute format('alter table public.%I drop constraint %I', r.tbl, r.conname);
  end loop;
  -- profiles' own FK → auth.users (whatever its name is)
  for r in
    select con.conname
    from pg_constraint con
    join pg_class rel    on rel.oid = con.conrelid
    join pg_namespace ns on ns.oid  = rel.relnamespace
    where con.contype = 'f' and ns.nspname = 'public' and rel.relname = 'profiles'
  loop
    execute format('alter table public.profiles drop constraint %I', r.conname);
  end loop;
end $$;

-- ── 3. Retype profiles.id → text, add email, retype every saved user column ────
alter table profiles alter column id type text using id::text;
alter table profiles add column if not exists email text;

do $$
declare r record; deltype text;
begin
  for r in select * from _fk_backup loop
    execute format('alter table public.%I alter column %I type text using %I::text', r.tbl, r.col, r.col);
    deltype := case r.deltype
                 when 'c' then ' on delete cascade'
                 when 'n' then ' on delete set null'
                 when 'd' then ' on delete set default'
                 when 'r' then ' on delete restrict'
                 else '' end;
    execute format('alter table public.%I add constraint %I foreign key (%I) references public.profiles(id)%s',
                   r.tbl, r.conname, r.col, deltype);
  end loop;
end $$;

-- ── 4. Rewrite known SECURITY DEFINER functions: auth.uid() → (auth.jwt()->>'sub')
create or replace function public.is_admin()
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (auth.jwt() ->> 'sub') and p.role = 'admin'
  );
$$;

create or replace function public.owner_listing_analytics(p_from timestamptz, p_to timestamptz)
returns table (
  listing_slug text, vendor_name text, enquiries bigint, whatsapp_clicks bigint,
  calls bigint, website_clicks bigint, directions bigint, shortlists bigint,
  listing_views bigint, impressions bigint, page_views bigint
)
language plpgsql security definer set search_path = public as $$
begin
  return query
  with mine as (
    select b.slug, b.name from public.businesses b
    where b.owner_id = (auth.jwt() ->> 'sub') or b.claimed_by = (auth.jwt() ->> 'sub')
  ),
  ev as (
    select * from public.analytics_events
    where created_at >= p_from and created_at < p_to
      and listing_slug in (select slug from mine)
  )
  select
    m.slug, m.name,
    count(*) filter (where e.lead_action_type = 'enquiry_form')::bigint,
    count(*) filter (where e.lead_action_type = 'whatsapp')::bigint,
    count(*) filter (where e.lead_action_type = 'call')::bigint,
    count(*) filter (where e.lead_action_type = 'website')::bigint,
    count(*) filter (where e.lead_action_type = 'directions')::bigint,
    count(*) filter (where e.lead_action_type = 'shortlist')::bigint,
    count(*) filter (where e.event_type = 'listing_view')::bigint,
    count(*) filter (where e.event_type = 'impression')::bigint,
    count(*) filter (where e.event_type = 'page_view')::bigint
  from mine m
  left join ev e on e.listing_slug = m.slug
  group by m.slug, m.name
  order by 9 desc;
end;
$$;

create or replace function public.owner_reviews()
returns table (id uuid, listing_slug text, business_name text, rating int, text text, reply text, status text, created_at timestamptz)
language sql security definer set search_path = public stable as $$
  select r.id, b.slug, b.name, r.rating, r.text, r.reply, r.status, r.created_at
  from public.reviews r
  join public.businesses b on b.id = r.business_id
  where b.owner_id = (auth.jwt() ->> 'sub') or b.claimed_by = (auth.jwt() ->> 'sub')
  order by r.created_at desc;
$$;

create or replace function public.owner_reply_to_review(p_review_id uuid, p_reply text)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.reviews
     set reply = p_reply, replied_at = now()
   where id = p_review_id
     and business_id in (
       select id from public.businesses
       where owner_id = (auth.jwt() ->> 'sub') or claimed_by = (auth.jwt() ->> 'sub')
     );
  if not found then raise exception 'not your review'; end if;
end;
$$;

create or replace function public.owner_campaign_performance()
returns table (
  campaign_id uuid, title text, placement_key text, status text, rate_cents int,
  starts_on date, ends_on date, impressions int, clicks int
)
language sql stable security definer set search_path = public as $$
  select c.id, c.title, c.placement_key, c.status, c.rate_cents, c.starts_on, c.ends_on,
         coalesce(sum((e.kind = 'impression')::int), 0)::int,
         coalesce(sum((e.kind = 'click')::int), 0)::int
  from public.ad_campaigns c
  left join public.ad_events e on e.campaign_id = c.id
  where c.business_id in (
    select id from public.businesses where owner_id = (auth.jwt() ->> 'sub') or claimed_by = (auth.jwt() ->> 'sub')
  )
  group by c.id
  order by c.created_at desc;
$$;

-- admin_list_users: auth.users is empty under Clerk → read profiles (now has email).
-- Return type changes (id uuid → text), so drop before recreate.
drop function if exists public.admin_list_users(int);
create function public.admin_list_users(p_limit int default 200)
returns table (id text, email text, name text, role text, created_at timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  return query
    select p.id, p.email, p.name, coalesce(p.role, 'user'), p.created_at
    from public.profiles p
    order by p.created_at desc
    limit greatest(1, least(p_limit, 1000));
end;
$$;
revoke all on function public.admin_list_users(int) from public;
grant execute on function public.admin_list_users(int) to authenticated;

-- ── 5. Recreate the saved policies, substituting auth.uid() → (auth.jwt()->>'sub')
do $$
declare
  r record; v_roles text; v_using text; v_check text; v_sql text;
begin
  for r in select * from _pol_backup loop
    select string_agg(case when role = 'public' then 'public' else quote_ident(role) end, ', ')
      into v_roles from unnest(r.roles) as role;
    v_using := nullif(replace(coalesce(r.qual, ''),       'auth.uid()', '(auth.jwt() ->> ''sub'')'), '');
    v_check := nullif(replace(coalesce(r.with_check, ''), 'auth.uid()', '(auth.jwt() ->> ''sub'')'), '');
    v_sql := format('create policy %I on public.%I as %s for %s to %s',
                    r.policyname, r.tablename, lower(r.permissive), lower(r.cmd), coalesce(v_roles, 'public'));
    if v_using is not null then v_sql := v_sql || ' using (' || v_using || ')'; end if;
    if v_check is not null then v_sql := v_sql || ' with check (' || v_check || ')'; end if;
    execute v_sql;
  end loop;
end $$;

-- ── 6. Flag any OTHER function still referencing auth.uid() (cannot auto-rewrite)
do $$
declare r record;
begin
  for r in
    select n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) as args
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and pg_get_functiondef(p.oid) like '%auth.uid()%'
  loop
    raise notice 'CLERK MIGRATION: function %.%(%) still uses auth.uid() — review/rewrite to (auth.jwt()->>''sub'')',
      r.nspname, r.proname, r.args;
  end loop;
end $$;

commit;
