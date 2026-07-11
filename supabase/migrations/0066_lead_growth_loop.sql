-- 0066_lead_growth_loop — exclusive round-robin routing, 24h cascade,
-- first-lead-free-full-contact, unclaimed outreach, capture controls.
-- Safe to re-run.

-- 1. lead_routes: rotation + cascade + delivery markers
alter table public.lead_routes
  add column if not exists mode text not null default 'shared',
  add column if not exists delivery text not null default 'teaser',
  add column if not exists expires_at timestamptz,
  add column if not exists delivered_at timestamptz,
  add column if not exists delivery_channel text;

alter table public.lead_routes drop constraint if exists lead_routes_mode_check;
alter table public.lead_routes add constraint lead_routes_mode_check
  check (mode in ('shared','exclusive'));

alter table public.lead_routes drop constraint if exists lead_routes_delivery_check;
alter table public.lead_routes add constraint lead_routes_delivery_check
  check (delivery in ('teaser','full'));

create index if not exists lead_routes_cascade
  on public.lead_routes (expires_at)
  where mode = 'exclusive' and status in ('sent','viewed');

-- 2. businesses: admin-entered outreach email (internal only, never public)
alter table public.businesses add column if not exists contact_email text;

-- 3. platform_settings: capture flags (tri-state) + per-surface toggles
alter table public.platform_settings
  add column if not exists lead_capture_enabled boolean,
  add column if not exists lead_auto_route_enabled boolean,
  add column if not exists lead_capture_surfaces jsonb not null
    default '{"blog":true,"hub":true,"listing":true,"popup":true}'::jsonb;

-- 4. accept_lead_route v2 — a gifted free-full-contact lead (delivery='full')
--    must never burn a beta slot: the beta count now only counts teasers.
--    (Identical to 0052 otherwise: per-business advisory lock, re-check, update.)
create or replace function public.accept_lead_route(
  p_route_id uuid, p_business_id uuid, p_paid boolean, p_cap int, p_since timestamptz
) returns text language plpgsql security definer set search_path = public as $$
declare v_status text; v_used int; n int;
begin
  perform pg_advisory_xact_lock(hashtext('leadcap:' || p_business_id::text));
  select status into v_status from lead_routes where id = p_route_id;
  if v_status is null then return 'not_found'; end if;
  if v_status not in ('sent','viewed') then return 'wrong_state'; end if;
  if p_paid then
    select count(*) into v_used from lead_routes
      where business_id = p_business_id and quota_consumed = true and accepted_at >= p_since;
    if v_used >= p_cap then return 'quota'; end if;
  else
    select count(*) into v_used from lead_routes
      where business_id = p_business_id and status in ('accepted','contacted','won','lost')
        and accepted_at >= p_since
        and delivery = 'teaser';   -- free-taste gifts don't count against the beta cap
    if v_used >= p_cap then return 'cap'; end if;
  end if;
  update lead_routes set status = 'accepted', accepted_at = now(), quota_consumed = p_paid
   where id = p_route_id and status in ('sent','viewed');
  get diagnostics n = row_count;
  if n = 0 then return 'wrong_state'; end if;
  return 'ok';
end; $$;
revoke execute on function public.accept_lead_route(uuid,uuid,boolean,int,timestamptz) from public;
grant  execute on function public.accept_lead_route(uuid,uuid,boolean,int,timestamptz) to service_role;
