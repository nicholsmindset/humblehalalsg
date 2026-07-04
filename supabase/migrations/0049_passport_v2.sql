-- Humble Halal — Halal Passport v2: rewards store, monthly giveaway, leaderboard.
-- Extends the 0048 ledger. Introduces SPENDING: passport_points.delta may now be
-- negative (redemptions / giveaway entries). Two point figures matter:
--   • EARNED  = sum of positive deltas → drives tiers, badges, leaderboard.
--   • BALANCE = net sum → the spendable wallet.
-- Spend RPCs take a per-user advisory lock so concurrent spends can't overdraw.
-- All writes are service-role SECURITY DEFINER (0041/0042 convention). Run after 0048.

-- ── 1. Reward redemptions (digital perks; ledger holds the negative delta) ────
create table if not exists public.passport_redemptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    text not null references public.profiles(id) on delete cascade,
  reward_id  text not null,
  cost       int  not null,
  created_at timestamptz not null default now()
);
create index if not exists passport_redemptions_user_idx on public.passport_redemptions (user_id, created_at desc);
alter table public.passport_redemptions enable row level security;
drop policy if exists passport_redemptions_select_own on public.passport_redemptions;
create policy passport_redemptions_select_own on public.passport_redemptions
  for select to authenticated using (user_id = (auth.jwt() ->> 'sub'));

-- Atomic spend: advisory-locks the user, checks BALANCE (net), writes the
-- negative ledger row (idempotent by dedupe) + the redemption. Returns
-- 'ok' | 'insufficient' | 'duplicate'.
create or replace function public.redeem_reward(
  p_user_id text, p_reward_id text, p_cost int, p_dedupe text, p_reason text
) returns text language plpgsql security definer set search_path = public as $$
declare bal int; n int;
begin
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

-- ── 2. Monthly giveaway ──────────────────────────────────────────────────────
create table if not exists public.giveaways (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,
  description    text,
  period_month   text not null,            -- 'YYYY-MM' (one active per month)
  entry_cost     int  not null default 50, -- points per entry
  status         text not null default 'open' check (status in ('open','drawn','cancelled')),
  winner_user_id text references public.profiles(id) on delete set null,
  drawn_at       timestamptz,
  created_at     timestamptz not null default now(),
  unique (period_month)
);
alter table public.giveaways enable row level security;
drop policy if exists giveaways_public_read on public.giveaways;
create policy giveaways_public_read on public.giveaways for select using (true); -- title/entry_cost are public

create table if not exists public.giveaway_entries (
  giveaway_id uuid not null references public.giveaways(id) on delete cascade,
  user_id     text not null references public.profiles(id) on delete cascade,
  entries     int  not null default 0,
  updated_at  timestamptz not null default now(),
  primary key (giveaway_id, user_id)
);
alter table public.giveaway_entries enable row level security;
drop policy if exists giveaway_entries_select_own on public.giveaway_entries;
create policy giveaway_entries_select_own on public.giveaway_entries
  for select to authenticated using (user_id = (auth.jwt() ->> 'sub'));

-- Spend points for one giveaway entry (advisory-locked balance check).
-- Returns 'ok' | 'insufficient' | 'closed' | 'no_giveaway'.
create or replace function public.enter_giveaway(p_user_id text, p_giveaway_id uuid, p_dedupe text)
returns text language plpgsql security definer set search_path = public as $$
declare bal int; v_cost int; v_status text; n int;
begin
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

-- ── 3. Leaderboard (EARNED points; opt-in names via passport_settings) ───────
-- period: 'month' (current SGT month) | 'all'. Returns top N with a display name
-- only when the user opted their passport public; else 'A Humble Halal member'.
-- Does NOT return user_id (the Clerk sub = app identity key) — it is never
-- consumed by the API and must not leak. Called ONLY by the server via the
-- service-role client, so grant service_role only (a direct anon/authenticated
-- call could otherwise enumerate identities). Stable tiebreaker for tied ranks.
create or replace function public.passport_leaderboard(p_period text, p_limit int)
returns table (rank int, display_name text, points int, is_public boolean)
language sql stable security definer set search_path = public as $$
  with earned as (
    select pp.user_id, sum(pp.delta)::int as points
      from passport_points pp
     where pp.delta > 0
       and (p_period <> 'month'
            or to_char(pp.created_at at time zone 'Asia/Singapore','YYYY-MM')
             = to_char(now() at time zone 'Asia/Singapore','YYYY-MM'))
     group by pp.user_id
  )
  select (row_number() over (order by e.points desc, e.user_id))::int as rank,
         case when coalesce(ps.is_public,false)
              then coalesce(nullif(ps.display_name,''), nullif(split_part(coalesce(p.name,''),' ',1),''), 'A Humble Halal member')
              else 'A Humble Halal member' end as display_name,
         e.points,
         coalesce(ps.is_public,false) as is_public
    from earned e
    join profiles p on p.id = e.user_id
    left join passport_settings ps on ps.user_id = e.user_id
   order by e.points desc, e.user_id
   limit greatest(1, least(p_limit, 100));
$$;
revoke execute on function public.passport_leaderboard(text,int) from public;
revoke execute on function public.passport_leaderboard(text,int) from anon, authenticated;
grant  execute on function public.passport_leaderboard(text,int) to service_role;

-- The caller's own rank + points for a period. Called ONLY server-side via the
-- service-role client (which passes the already-authenticated caller's own id),
-- so grant service_role only — this closes the IDOR where an authenticated user
-- could otherwise pass another user's id and read their points/rank.
create or replace function public.my_passport_rank(p_user_id text, p_period text)
returns table (rank int, points int)
language sql stable security definer set search_path = public as $$
  with earned as (
    select pp.user_id, sum(pp.delta)::int as points
      from passport_points pp
     where pp.delta > 0
       and (p_period <> 'month'
            or to_char(pp.created_at at time zone 'Asia/Singapore','YYYY-MM')
             = to_char(now() at time zone 'Asia/Singapore','YYYY-MM'))
     group by pp.user_id
  ), ranked as (
    select user_id, points, (row_number() over (order by points desc, user_id))::int as rank from earned
  )
  select rank, points from ranked where user_id = p_user_id;
$$;
revoke execute on function public.my_passport_rank(text,text) from public;
revoke execute on function public.my_passport_rank(text,text) from authenticated;
grant  execute on function public.my_passport_rank(text,text) to service_role;

-- ── 4. Public passport by token → use EARNED points (spending never lowers it) ─
create or replace function public.public_passport_by_token(p_token text)
returns table (display_name text, total_points int, visit_count int,
               review_count int, follow_count int, joined_month text)
language sql stable security definer set search_path = public as $$
  select
    coalesce(nullif(ps.display_name,''), nullif(split_part(coalesce(p.name,''),' ',1),''), 'A Humble Halal member'),
    coalesce((select sum(delta)::int from passport_points where user_id = ps.user_id and delta > 0), 0),
    (select count(distinct source_id)::int from passport_points where user_id = ps.user_id and source_type='visit'),
    (select count(*)::int from passport_points where user_id = ps.user_id and source_type='review'),
    (select count(*)::int from passport_points where user_id = ps.user_id and source_type='follow'),
    to_char(p.created_at,'Mon YYYY')
  from passport_settings ps join profiles p on p.id = ps.user_id
  where ps.share_token = p_token and ps.is_public;
$$;
revoke execute on function public.public_passport_by_token(text) from public;
grant  execute on function public.public_passport_by_token(text) to anon, authenticated, service_role;

-- ── 5. Full-ledger stats for the caller (tier/badges/balance/streak) ─────────
-- Aggregates the WHOLE ledger in SQL (sum/count/distinct/streak) so an active
-- user's tier, badges and balance never regress from a truncated JS window.
-- EARNED = sum of positive deltas (tiers/badges); BALANCE = net (spendable).
-- streak_days = length of the consecutive run of active SGT days ending today
-- (or yesterday, so a not-yet-active today doesn't reset a live streak) — the
-- gaps-and-islands trick: for dates ordered desc, (d + rownum) is constant only
-- within the contiguous run anchored at the top. Server-only (service_role).
create or replace function public.passport_stats(p_user_id text)
returns table (
  earned int, balance int,
  review_count int, visit_count int, follow_count int,
  streak_days int, qualified_referrals int
)
language sql stable security definer set search_path = public as $$
  with agg as (
    select
      coalesce(sum(delta) filter (where delta > 0), 0)::int as earned,
      coalesce(sum(delta), 0)::int as balance,
      count(*) filter (where source_type = 'review')::int as review_count,
      count(distinct source_id) filter (where source_type = 'visit')::int as visit_count,
      count(*) filter (where source_type = 'follow')::int as follow_count
    from passport_points where user_id = p_user_id
  ),
  dates as (
    select distinct (created_at at time zone 'Asia/Singapore')::date as d
      from passport_points where user_id = p_user_id
  ),
  anchor as (
    select case
      when exists (select 1 from dates where d = (now() at time zone 'Asia/Singapore')::date)
        then (now() at time zone 'Asia/Singapore')::date
      when exists (select 1 from dates where d = ((now() at time zone 'Asia/Singapore')::date - 1))
        then ((now() at time zone 'Asia/Singapore')::date - 1)
      else null::date end as a
  ),
  run as (
    select d, (row_number() over (order by d desc))::int as rn
      from dates, anchor
     where anchor.a is not null and d <= anchor.a
  ),
  streak as (
    select coalesce((
      select count(*)::int from run, anchor
       where anchor.a is not null and (run.d + run.rn) = (anchor.a + 1)
    ), 0) as streak_days
  )
  select agg.earned, agg.balance, agg.review_count, agg.visit_count, agg.follow_count,
         streak.streak_days,
         coalesce((select count(*)::int from referrals r
                    where r.referrer_id = p_user_id and r.status = 'qualified'), 0)
    from agg, streak;
$$;
revoke execute on function public.passport_stats(text) from public;
grant  execute on function public.passport_stats(text) to service_role;
