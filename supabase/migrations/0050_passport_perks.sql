-- Humble Halal — Halal Passport: business-backed perks + saved-places sync.
-- Businesses offer perks (e.g. "free drink · 200 pts"); members spend Passport
-- points for a voucher; the owner marks it used from their dashboard. Also syncs
-- saved places to the DB (was localStorage) and awards points for saving.
-- Spend uses the same advisory-locked, overdraw-safe pattern as 0049. Run after 0049.

-- ── 1. Business perks (owner-created; any CLAIMED business) ───────────────────
create table if not exists public.business_perks (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses(id) on delete cascade,
  title        text not null,
  description  text,
  terms        text,
  points_cost  int  not null check (points_cost between 1 and 100000),
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists business_perks_active_idx on public.business_perks (active, business_id);
alter table public.business_perks enable row level security;
-- Public may read ACTIVE perks (the store); owners read their own (incl. inactive).
drop policy if exists business_perks_public_read on public.business_perks;
create policy business_perks_public_read on public.business_perks for select using (active = true);
drop policy if exists business_perks_owner_read on public.business_perks;
create policy business_perks_owner_read on public.business_perks for select to authenticated using (
  exists (select 1 from public.businesses b where b.id = business_id
          and (b.owner_id = (auth.jwt() ->> 'sub') or b.claimed_by = (auth.jwt() ->> 'sub'))));
-- Writes via owner API (service role).

-- ── 2. Perk redemptions (voucher; owner marks used) ──────────────────────────
create table if not exists public.perk_redemptions (
  id           uuid primary key default gen_random_uuid(),
  perk_id      uuid not null references public.business_perks(id) on delete cascade,
  business_id  uuid not null references public.businesses(id) on delete cascade,
  user_id      text not null references public.profiles(id) on delete cascade,
  voucher_code text not null unique,
  title        text not null,           -- snapshot (perk title at redeem time)
  cost         int  not null,
  status       text not null default 'active' check (status in ('active','used','expired')),
  created_at   timestamptz not null default now(),
  used_at      timestamptz
);
create index if not exists perk_redemptions_user_idx on public.perk_redemptions (user_id, created_at desc);
create index if not exists perk_redemptions_biz_idx on public.perk_redemptions (business_id, status, created_at desc);
alter table public.perk_redemptions enable row level security;
drop policy if exists perk_redemptions_select_own on public.perk_redemptions;
create policy perk_redemptions_select_own on public.perk_redemptions
  for select to authenticated using (user_id = (auth.jwt() ->> 'sub'));
drop policy if exists perk_redemptions_owner_read on public.perk_redemptions;
create policy perk_redemptions_owner_read on public.perk_redemptions for select to authenticated using (
  exists (select 1 from public.businesses b where b.id = business_id
          and (b.owner_id = (auth.jwt() ->> 'sub') or b.claimed_by = (auth.jwt() ->> 'sub'))));

-- Atomic perk redemption: advisory-lock the user, check BALANCE, write the
-- negative ledger row + the voucher. Returns the voucher code, or '' on failure.
create or replace function public.redeem_perk(p_user_id text, p_perk_id uuid, p_code text)
returns text language plpgsql security definer set search_path = public as $$
declare bal int; v_cost int; v_biz uuid; v_title text; v_active boolean; n int;
begin
  select points_cost, business_id, title, active into v_cost, v_biz, v_title, v_active
    from business_perks where id = p_perk_id;
  if v_cost is null then return ''; end if;         -- unknown perk
  if not v_active then return ''; end if;           -- withdrawn
  perform pg_advisory_xact_lock(hashtext('passport:' || p_user_id));
  select coalesce(sum(delta),0) into bal from passport_points where user_id = p_user_id;
  if bal < v_cost then return 'INSUFFICIENT'; end if;
  insert into passport_points (user_id, delta, reason, source_type, source_id, dedupe_key)
  values (p_user_id, -v_cost, 'Perk: ' || v_title, 'redeem', p_perk_id::text, 'perk:' || p_code)
  on conflict (user_id, dedupe_key) do nothing;
  get diagnostics n = row_count;
  if n = 0 then return ''; end if;                  -- duplicate submit
  insert into perk_redemptions (perk_id, business_id, user_id, voucher_code, title, cost)
  values (p_perk_id, v_biz, p_user_id, p_code, v_title, v_cost);
  return p_code;
end; $$;
revoke execute on function public.redeem_perk(text,uuid,text) from public;
grant  execute on function public.redeem_perk(text,uuid,text) to service_role;

-- ── 3. Saved places (server sync; was localStorage-only) ─────────────────────
create table if not exists public.saved_places (
  user_id     text not null references public.profiles(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, business_id)
);
create index if not exists saved_places_user_idx on public.saved_places (user_id, created_at desc);
alter table public.saved_places enable row level security;
drop policy if exists saved_places_own on public.saved_places;
create policy saved_places_own on public.saved_places
  for all to authenticated using (user_id = (auth.jwt() ->> 'sub')) with check (user_id = (auth.jwt() ->> 'sub'));
