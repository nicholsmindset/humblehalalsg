-- Humble Halal — Halal Passport (loyalty) + consumer referrals.
-- Points are SUMMED from an append-only ledger (never a stored balance — the
-- lead-marketplace 0046 no-drift pattern). All writes go through service-role
-- SECURITY DEFINER RPCs (the redeem_promo/increment_ref_click convention, 0041/0042).
-- Identity = Clerk sub (profiles.id text; RLS via auth.jwt()->>'sub', 0031).
-- Everything ships behind PASSPORT_ENABLED (default off). Run after 0046.
-- (0047 = halal-verdicts is an open PR; this is 0048.)

-- ── 1. Points ledger ─────────────────────────────────────────────────────────
create table if not exists public.passport_points (
  id          uuid primary key default gen_random_uuid(),
  user_id     text not null references public.profiles(id) on delete cascade,
  delta       int  not null,                 -- >0 earn-only in v1; signed for future spend
  reason      text not null,                 -- display label, e.g. 'Wrote a review'
  source_type text not null,                 -- 'review'|'follow'|'visit'|'checkin'|'referral'|'bonus'
  source_id   text,                          -- review id / business id / referral id / date
  dedupe_key  text not null,                 -- idempotency, unique per user
  created_at  timestamptz not null default now(),
  unique (user_id, dedupe_key)
);
create index if not exists passport_points_user_idx on public.passport_points (user_id, created_at desc);

alter table public.passport_points enable row level security;
drop policy if exists passport_points_select_own on public.passport_points;
create policy passport_points_select_own on public.passport_points
  for select to authenticated using (user_id = (auth.jwt() ->> 'sub'));
-- No write policy → only service-role / award_points() writes.

-- Idempotent award (redeem_promo pattern): inserts once per (user,dedupe_key);
-- returns TRUE only when it actually awarded (so callers fire notifications once).
create or replace function public.award_points(
  p_user_id text, p_delta int, p_reason text,
  p_source_type text, p_source_id text, p_dedupe_key text
) returns boolean language plpgsql security definer set search_path = public as $$
declare n int;
begin
  insert into passport_points (user_id, delta, reason, source_type, source_id, dedupe_key)
  values (p_user_id, p_delta, p_reason, p_source_type, p_source_id, p_dedupe_key)
  on conflict (user_id, dedupe_key) do nothing;
  get diagnostics n = row_count;
  return n > 0;
end; $$;
revoke execute on function public.award_points(text,int,text,text,text,text) from public;
grant  execute on function public.award_points(text,int,text,text,text,text) to service_role;

-- ── 2. Referral codes (one per user, minted on demand) ───────────────────────
create table if not exists public.referral_codes (
  owner_user_id text primary key references public.profiles(id) on delete cascade,
  code    text not null unique check (code ~ '^[a-z0-9]{4,12}$'),
  clicks  int  not null default 0,
  signups int  not null default 0,
  created_at timestamptz not null default now()
);
alter table public.referral_codes enable row level security;
drop policy if exists referral_codes_select_own on public.referral_codes;
create policy referral_codes_select_own on public.referral_codes
  for select to authenticated using (owner_user_id = (auth.jwt() ->> 'sub'));

create or replace function public.increment_referral_click(p_code text)
returns void language sql security definer set search_path = public as $$
  update referral_codes set clicks = clicks + 1 where code = lower(p_code);
$$;
revoke execute on function public.increment_referral_click(text) from public;
grant  execute on function public.increment_referral_click(text) to service_role;

-- ── 3. Referrals (referred once ever; self-referral blocked) ─────────────────
create table if not exists public.referrals (
  id           uuid primary key default gen_random_uuid(),
  referrer_id  text not null references public.profiles(id) on delete cascade,
  referred_id  text not null unique references public.profiles(id) on delete cascade,
  code         text not null,
  status       text not null default 'pending' check (status in ('pending','qualified')),
  qualified_at timestamptz,
  created_at   timestamptz not null default now(),
  check (referrer_id <> referred_id)
);
create index if not exists referrals_referrer_idx on public.referrals (referrer_id, status);
alter table public.referrals enable row level security;
drop policy if exists referrals_select_involved on public.referrals;
create policy referrals_select_involved on public.referrals
  for select to authenticated using (
    referrer_id = (auth.jwt() ->> 'sub') or referred_id = (auth.jwt() ->> 'sub'));

-- Credit on signup (Clerk webhook). Validates code→referrer, blocks self &
-- double-referral atomically, bumps signups. Returns referrer_id or null.
create or replace function public.credit_referral(p_referred_id text, p_code text)
returns text language plpgsql security definer set search_path = public as $$
declare v_ref text; n int;
begin
  select owner_user_id into v_ref from referral_codes where code = lower(p_code);
  if v_ref is null or v_ref = p_referred_id then return null; end if;
  insert into referrals (referrer_id, referred_id, code)
  values (v_ref, p_referred_id, lower(p_code))
  on conflict (referred_id) do nothing;
  get diagnostics n = row_count;
  if n > 0 then update referral_codes set signups = signups + 1 where code = lower(p_code); end if;
  return case when n > 0 then v_ref else null end;
end; $$;
revoke execute on function public.credit_referral(text,text) from public;
grant  execute on function public.credit_referral(text,text) to service_role;

-- Qualify pending→qualified on the referred user's first real action.
-- Returns the row ONLY on the transition (so points are awarded once).
create or replace function public.qualify_referral(p_referred_id text)
returns table (referral_id uuid, referrer_id text)
language sql security definer set search_path = public as $$
  update referrals
     set status = 'qualified', qualified_at = now()
   where referred_id = p_referred_id and status = 'pending'
  returning id, referrer_id;
$$;
revoke execute on function public.qualify_referral(text) from public;
grant  execute on function public.qualify_referral(text) to service_role;

-- ── 4. Public passport opt-in (PDPA: default private, opaque token) ──────────
create table if not exists public.passport_settings (
  user_id      text primary key references public.profiles(id) on delete cascade,
  is_public    boolean not null default false,
  share_token  text not null unique default encode(gen_random_bytes(9),'hex'),
  display_name text,
  updated_at   timestamptz not null default now()
);
alter table public.passport_settings enable row level security;
drop policy if exists passport_settings_select_own on public.passport_settings;
create policy passport_settings_select_own on public.passport_settings
  for select to authenticated using (user_id = (auth.jwt() ->> 'sub'));
-- Writes via service-role API only.

-- Public aggregates by share token — non-PII, only when is_public (mirrors
-- vendor_scorecard_by_token). Points summed, counts derived; NO email/full name.
create or replace function public.public_passport_by_token(p_token text)
returns table (display_name text, total_points int, visit_count int,
               review_count int, follow_count int, joined_month text)
language sql stable security definer set search_path = public as $$
  select
    coalesce(nullif(ps.display_name,''), nullif(split_part(coalesce(p.name,''),' ',1),''), 'A Humble Halal member'),
    coalesce((select sum(delta)::int from passport_points where user_id = ps.user_id), 0),
    (select count(distinct source_id)::int from passport_points where user_id = ps.user_id and source_type='visit'),
    (select count(*)::int from passport_points where user_id = ps.user_id and source_type='review'),
    (select count(*)::int from passport_points where user_id = ps.user_id and source_type='follow'),
    to_char(p.created_at,'Mon YYYY')
  from passport_settings ps join profiles p on p.id = ps.user_id
  where ps.share_token = p_token and ps.is_public;
$$;
revoke execute on function public.public_passport_by_token(text) from public;
grant  execute on function public.public_passport_by_token(text) to anon, authenticated, service_role;
