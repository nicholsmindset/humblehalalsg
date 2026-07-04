-- Humble Halal — Halal Passport integrity (detective controls + admin actions).
-- A blocklist that award_points honours (a flagged farmer earns nothing more),
-- and an admin aggregation RPC that surfaces accounts earning abnormally fast.
-- Clawbacks are plain admin-adjust ledger rows (service role). Run after 0050.

-- ── 1. Blocklist (presence = earning frozen) ─────────────────────────────────
create table if not exists public.passport_blocks (
  user_id    text primary key references public.profiles(id) on delete cascade,
  reason     text,
  blocked_by text references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.passport_blocks enable row level security;
drop policy if exists passport_blocks_admin_read on public.passport_blocks;
create policy passport_blocks_admin_read on public.passport_blocks
  for select to authenticated using ( public.is_admin() );
-- Writes via the admin API (service role).

-- ── 2. award_points now refuses blocked users (recreate with the guard) ──────
create or replace function public.award_points(
  p_user_id text, p_delta int, p_reason text,
  p_source_type text, p_source_id text, p_dedupe_key text
) returns boolean language plpgsql security definer set search_path = public as $$
declare n int;
begin
  -- Frozen accounts earn nothing (admin-flagged fraud). Admin-adjust clawbacks
  -- still go in via a direct service-role insert, not this function.
  if exists (select 1 from passport_blocks where user_id = p_user_id) then
    return false;
  end if;
  insert into passport_points (user_id, delta, reason, source_type, source_id, dedupe_key)
  values (p_user_id, p_delta, p_reason, p_source_type, p_source_id, p_dedupe_key)
  on conflict (user_id, dedupe_key) do nothing;
  get diagnostics n = row_count;
  return n > 0;
end; $$;
revoke execute on function public.award_points(text,int,text,text,text,text) from public;
grant  execute on function public.award_points(text,int,text,text,text,text) to service_role;

-- ── 2b. Spending is frozen for blocked accounts too ──────────────────────────
-- award_points (above) refuses NEW earns from a blocked farmer, but they could
-- still cash out points banked before the block. Re-create each spend RPC with
-- the same block guard (bodies otherwise identical to 0049/0050) so a flagged
-- account can neither earn nor spend. Signatures unchanged → clean replace.
create or replace function public.redeem_reward(
  p_user_id text, p_reward_id text, p_cost int, p_dedupe text, p_reason text
) returns text language plpgsql security definer set search_path = public as $$
declare bal int; n int;
begin
  if exists (select 1 from passport_blocks where user_id = p_user_id) then return 'blocked'; end if;
  if p_cost <= 0 then return 'insufficient'; end if;
  perform pg_advisory_xact_lock(hashtext('passport:' || p_user_id));
  select coalesce(sum(delta),0) into bal from passport_points where user_id = p_user_id;
  if bal < p_cost then return 'insufficient'; end if;
  insert into passport_points (user_id, delta, reason, source_type, source_id, dedupe_key)
  values (p_user_id, -p_cost, p_reason, 'redeem', p_reward_id, p_dedupe)
  on conflict (user_id, dedupe_key) do nothing;
  get diagnostics n = row_count;
  if n = 0 then return 'duplicate'; end if;
  insert into passport_redemptions (user_id, reward_id, cost) values (p_user_id, p_reward_id, p_cost);
  return 'ok';
end; $$;
revoke execute on function public.redeem_reward(text,text,int,text,text) from public;
grant  execute on function public.redeem_reward(text,text,int,text,text) to service_role;

create or replace function public.enter_giveaway(p_user_id text, p_giveaway_id uuid, p_dedupe text)
returns text language plpgsql security definer set search_path = public as $$
declare bal int; v_cost int; v_status text; n int;
begin
  if exists (select 1 from passport_blocks where user_id = p_user_id) then return 'blocked'; end if;
  select entry_cost, status into v_cost, v_status from giveaways where id = p_giveaway_id;
  if v_cost is null then return 'no_giveaway'; end if;
  if v_status <> 'open' then return 'closed'; end if;
  perform pg_advisory_xact_lock(hashtext('passport:' || p_user_id));
  select coalesce(sum(delta),0) into bal from passport_points where user_id = p_user_id;
  if bal < v_cost then return 'insufficient'; end if;
  insert into passport_points (user_id, delta, reason, source_type, source_id, dedupe_key)
  values (p_user_id, -v_cost, 'Giveaway entry', 'redeem', p_giveaway_id::text, p_dedupe)
  on conflict (user_id, dedupe_key) do nothing;
  get diagnostics n = row_count;
  if n = 0 then return 'closed'; end if; -- duplicate submit
  insert into giveaway_entries (giveaway_id, user_id, entries)
  values (p_giveaway_id, p_user_id, 1)
  on conflict (giveaway_id, user_id) do update set entries = giveaway_entries.entries + 1, updated_at = now();
  return 'ok';
end; $$;
revoke execute on function public.enter_giveaway(text,uuid,text) from public;
grant  execute on function public.enter_giveaway(text,uuid,text) to service_role;

create or replace function public.redeem_perk(p_user_id text, p_perk_id uuid, p_code text, p_idem text)
returns text language plpgsql security definer set search_path = public as $$
declare bal int; v_cost int; v_biz uuid; v_title text; v_active boolean; n int;
begin
  if exists (select 1 from passport_blocks where user_id = p_user_id) then return 'BLOCKED'; end if;
  select points_cost, business_id, title, active into v_cost, v_biz, v_title, v_active
    from business_perks where id = p_perk_id;
  if v_cost is null then return ''; end if;
  if not v_active then return ''; end if;
  perform pg_advisory_xact_lock(hashtext('passport:' || p_user_id));
  select coalesce(sum(delta),0) into bal from passport_points where user_id = p_user_id;
  if bal < v_cost then return 'INSUFFICIENT'; end if;
  begin
    insert into passport_points (user_id, delta, reason, source_type, source_id, dedupe_key)
    values (p_user_id, -v_cost, 'Perk: ' || v_title, 'redeem', p_perk_id::text, 'perk:' || p_idem)
    on conflict (user_id, dedupe_key) do nothing;
    get diagnostics n = row_count;
    if n = 0 then return 'DUPLICATE'; end if;
    insert into perk_redemptions (perk_id, business_id, user_id, voucher_code, title, cost)
    values (p_perk_id, v_biz, p_user_id, p_code, v_title, v_cost);
    return p_code;
  exception when unique_violation then
    return 'RETRY';
  end;
end; $$;
revoke execute on function public.redeem_perk(text,uuid,text,text) from public;
grant  execute on function public.redeem_perk(text,uuid,text,text) to service_role;

-- ── 3. Integrity aggregation for admins ──────────────────────────────────────
-- Per-user earning velocity + source breakdown over the last p_days, ranked by
-- recent earned points (the farming signal). is_admin() gate + service role.
create or replace function public.admin_passport_integrity(p_days int, p_limit int)
returns table (
  user_id text, name text, email text,
  earned_recent int, earned_total int, balance int,
  review_ct int, visit_ct int, follow_ct int, save_ct int, referral_ct int,
  redeem_ct int, last_earn timestamptz, blocked boolean
) language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  return query
  with agg as (
    select pp.user_id,
      sum(pp.delta) filter (where pp.delta > 0 and pp.created_at >= now() - make_interval(days => greatest(1, p_days)))::int as earned_recent,
      sum(pp.delta) filter (where pp.delta > 0)::int as earned_total,
      sum(pp.delta)::int as balance,
      count(*) filter (where pp.source_type = 'review')::int as review_ct,
      count(distinct pp.source_id) filter (where pp.source_type = 'visit')::int as visit_ct,
      count(*) filter (where pp.source_type = 'follow')::int as follow_ct,
      count(*) filter (where pp.source_type = 'save')::int as save_ct,
      count(*) filter (where pp.source_type = 'referral')::int as referral_ct,
      count(*) filter (where pp.source_type = 'redeem')::int as redeem_ct,
      max(pp.created_at) as last_earn
    from passport_points pp
    group by pp.user_id
  )
  select a.user_id, p.name, p.email,
    coalesce(a.earned_recent,0), a.earned_total, a.balance,
    a.review_ct, a.visit_ct, a.follow_ct, a.save_ct, a.referral_ct, a.redeem_ct,
    a.last_earn, (b.user_id is not null) as blocked
  from agg a
  join profiles p on p.id = a.user_id
  left join passport_blocks b on b.user_id = a.user_id
  order by coalesce(a.earned_recent,0) desc, a.earned_total desc
  limit greatest(1, least(p_limit, 200));
end; $$;
revoke execute on function public.admin_passport_integrity(int,int) from public;
grant  execute on function public.admin_passport_integrity(int,int) to authenticated, service_role;
