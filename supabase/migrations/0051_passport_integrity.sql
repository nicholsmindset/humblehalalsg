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
