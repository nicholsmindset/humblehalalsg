-- Humble Halal — migrate auth from Supabase Auth → Clerk (keep Supabase as the DB).
--
-- Clerk now owns identity. Supabase trusts Clerk JWTs via Third-Party Auth, so the
-- user id is the Clerk id (TEXT like 'user_xxx') read from auth.jwt()->>'sub'
-- instead of auth.uid() (a uuid).
--
-- DYNAMIC + AGGREGATE-FREE: reads the pg_policy / pg_constraint CATALOGS directly
-- (NOT the pg_policies view, whose `roles` column is computed via array_agg, which
-- this Postgres rejects inside a FOR loop). Role lists are built with an array
-- CONSTRUCTOR, not an aggregate. All state is carried in jsonb inside one DO block
-- (no temp tables). It:
--   1. Captures + drops every public RLS policy referencing auth.uid().
--   2. Drops every FK to profiles(id)/auth.users(id), retypes those columns +
--      profiles.id to TEXT, then re-adds the FKs to profiles(id).
--   3. Recreates the captured policies with auth.uid() → (auth.jwt()->>'sub').
--   4. Rewrites the known SECURITY DEFINER functions to the Clerk sub, adds
--      profiles.email; flags any OTHER function still using auth.uid().
--
-- CLEAN CUTOVER: user-identity tables effectively empty (no real users). The
-- uuid→text retype is lossless. Wrapped in a transaction (failure rolls back).
-- Idempotent.

begin;

do $$
declare
  pols  jsonb := '[]'::jsonb;
  fks   jsonb := '[]'::jsonb;
  r     record;
  elem  jsonb;
  v_roles text; v_cmd text; v_using text; v_check text; v_sql text; deltype text;
begin
  -- ── 1. Capture + drop auth.uid() policies (from the pg_policy catalog) ──────
  for r in
    select cls.relname                                  as tbl,
           pol.polname                                  as name,
           pol.polpermissive                            as permissive,
           pol.polcmd                                   as cmd,
           pol.polroles                                 as roles,
           pg_get_expr(pol.polqual, pol.polrelid)       as qual,
           pg_get_expr(pol.polwithcheck, pol.polrelid)  as wc
    from pg_policy pol
    join pg_class cls     on cls.oid = pol.polrelid
    join pg_namespace nsp on nsp.oid = cls.relnamespace
    where nsp.nspname = 'public'
  loop
    if coalesce(r.qual, '') not like '%auth.uid()%'
       and coalesce(r.wc, '') not like '%auth.uid()%' then
      continue;
    end if;

    -- roles → csv (array constructor, NOT an aggregate). 0 = PUBLIC.
    if r.roles is null or cardinality(r.roles) = 0 or 0::oid = any(r.roles) then
      v_roles := 'public';
    else
      v_roles := array_to_string(
        array(select quote_ident(rolname) from pg_roles where oid = any(r.roles)), ', ');
      if v_roles is null or v_roles = '' then v_roles := 'public'; end if;
    end if;

    v_cmd := case r.cmd when 'r' then 'select' when 'a' then 'insert'
                        when 'w' then 'update' when 'd' then 'delete' else 'all' end;

    pols := pols || jsonb_build_object(
      'tbl', r.tbl, 'name', r.name,
      'perm', case when r.permissive then 'permissive' else 'restrictive' end,
      'cmd', v_cmd, 'roles', v_roles, 'qual', r.qual, 'wc', r.wc);

    execute format('drop policy %I on public.%I', r.name, r.tbl);
  end loop;

  -- ── 2. Capture + drop FKs to profiles/auth.users (single-col; not profiles.id)
  for r in
    select con.conname, rel.relname as tbl, att.attname as col, con.confdeltype as deltype
    from pg_constraint con
    join pg_class rel     on rel.oid  = con.conrelid
    join pg_namespace ns  on ns.oid   = rel.relnamespace
    join pg_class frel    on frel.oid = con.confrelid
    join pg_namespace fns on fns.oid  = frel.relnamespace
    join pg_attribute att on att.attrelid = con.conrelid and att.attnum = con.conkey[1]
    where con.contype = 'f'
      and ns.nspname = 'public'
      and cardinality(con.conkey) = 1
      and ( (fns.nspname = 'public' and frel.relname = 'profiles')
         or (fns.nspname = 'auth'   and frel.relname = 'users') )
      and not (rel.relname = 'profiles' and att.attname = 'id')
  loop
    fks := fks || jsonb_build_object('conname', r.conname, 'tbl', r.tbl, 'col', r.col, 'deltype', r.deltype);
    execute format('alter table public.%I drop constraint %I', r.tbl, r.conname);
  end loop;

  -- profiles' own FK(s) → auth.users (whatever the name)
  for r in
    select con.conname
    from pg_constraint con
    join pg_class rel    on rel.oid = con.conrelid
    join pg_namespace ns on ns.oid  = rel.relnamespace
    where con.contype = 'f' and ns.nspname = 'public' and rel.relname = 'profiles'
  loop
    execute format('alter table public.profiles drop constraint %I', r.conname);
  end loop;

  -- ── 3. Retype profiles.id → text, add email ────────────────────────────────
  execute 'alter table public.profiles alter column id type text using id::text';
  execute 'alter table public.profiles add column if not exists email text';

  -- ── 4. Retype each captured column → text, re-add FK to profiles(id) ────────
  for elem in select value from jsonb_array_elements(fks)
  loop
    execute format('alter table public.%I alter column %I type text using %I::text',
                   elem->>'tbl', elem->>'col', elem->>'col');
    deltype := case elem->>'deltype'
                 when 'c' then ' on delete cascade'
                 when 'n' then ' on delete set null'
                 when 'd' then ' on delete set default'
                 when 'r' then ' on delete restrict'
                 else '' end;
    execute format('alter table public.%I add constraint %I foreign key (%I) references public.profiles(id)%s',
                   elem->>'tbl', elem->>'conname', elem->>'col', deltype);
  end loop;

  -- ── 5. Recreate policies with auth.uid() → (auth.jwt()->>'sub') ─────────────
  for elem in select value from jsonb_array_elements(pols)
  loop
    v_using := nullif(replace(coalesce(elem->>'qual', ''), 'auth.uid()', '(auth.jwt() ->> ''sub'')'), '');
    v_check := nullif(replace(coalesce(elem->>'wc', ''),   'auth.uid()', '(auth.jwt() ->> ''sub'')'), '');
    v_sql := format('create policy %I on public.%I as %s for %s to %s',
                    elem->>'name', elem->>'tbl', elem->>'perm', elem->>'cmd', elem->>'roles');
    if v_using is not null then v_sql := v_sql || ' using (' || v_using || ')'; end if;
    if v_check is not null then v_sql := v_sql || ' with check (' || v_check || ')'; end if;
    execute v_sql;
  end loop;
end $$;

-- ── 6. Rewrite known SECURITY DEFINER functions (after columns are text) ──────
create or replace function public.is_admin()
returns boolean language sql security definer set search_path = public stable as $fn$
  select exists (
    select 1 from public.profiles p
    where p.id = (auth.jwt() ->> 'sub') and p.role = 'admin'
  );
$fn$;

create or replace function public.owner_listing_analytics(p_from timestamptz, p_to timestamptz)
returns table (
  listing_slug text, vendor_name text, enquiries bigint, whatsapp_clicks bigint,
  calls bigint, website_clicks bigint, directions bigint, shortlists bigint,
  listing_views bigint, impressions bigint, page_views bigint
)
language plpgsql security definer set search_path = public as $fn$
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
$fn$;

create or replace function public.owner_reviews()
returns table (id uuid, listing_slug text, business_name text, rating int, text text, reply text, status text, created_at timestamptz)
language sql security definer set search_path = public stable as $fn$
  select r.id, b.slug, b.name, r.rating, r.text, r.reply, r.status, r.created_at
  from public.reviews r
  join public.businesses b on b.id = r.business_id
  where b.owner_id = (auth.jwt() ->> 'sub') or b.claimed_by = (auth.jwt() ->> 'sub')
  order by r.created_at desc;
$fn$;

create or replace function public.owner_reply_to_review(p_review_id uuid, p_reply text)
returns void language plpgsql security definer set search_path = public as $fn$
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
$fn$;

create or replace function public.owner_campaign_performance()
returns table (
  campaign_id uuid, title text, placement_key text, status text, rate_cents int,
  starts_on date, ends_on date, impressions int, clicks int
)
language sql stable security definer set search_path = public as $fn$
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
$fn$;

-- admin_list_users: auth.users is empty under Clerk → read profiles (now has email).
drop function if exists public.admin_list_users(int);
create function public.admin_list_users(p_limit int default 200)
returns table (id text, email text, name text, role text, created_at timestamptz)
language plpgsql security definer set search_path = public as $fn$
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  return query
    select p.id, p.email, p.name, coalesce(p.role, 'user'), p.created_at
    from public.profiles p
    order by p.created_at desc
    limit greatest(1, least(p_limit, 1000));
end;
$fn$;
revoke all on function public.admin_list_users(int) from public;
grant execute on function public.admin_list_users(int) to authenticated;

-- ── 7. Flag any OTHER function still referencing auth.uid() (manual review) ────
do $$
declare r record;
begin
  for r in
    select n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) as args
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and pg_get_functiondef(p.oid) like '%auth.uid()%'
  loop
    raise notice 'CLERK MIGRATION: function %.%(%) still uses auth.uid() — rewrite to (auth.jwt()->>''sub'')',
      r.nspname, r.proname, r.args;
  end loop;
end $$;

commit;
