-- 0075 — Structured business promotions, consumer claims, atomic redemption,
-- owner ROI and Passport-compatible redemption records.

begin;

create table if not exists public.business_promotions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  kind text not null default 'coupon' check (kind in ('offer','coupon')),
  title text not null check (char_length(title) between 3 and 90),
  details text,
  discount_type text not null default 'percent' check (discount_type in ('percent','fixed','free_item','bundle')),
  discount_value int check (discount_value is null or discount_value >= 0),
  reward_text text,
  min_spend_cents int not null default 0 check (min_spend_cents >= 0),
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  valid_days smallint[] not null default '{0,1,2,3,4,5,6}',
  redeem_start time,
  redeem_end time,
  per_user_limit int not null default 1 check (per_user_limit between 1 and 20),
  total_limit int check (total_limit is null or total_limit > 0),
  claimed_count int not null default 0 check (claimed_count >= 0),
  redeemed_count int not null default 0 check (redeemed_count >= 0),
  terms text,
  status text not null default 'pending' check (status in ('draft','pending','active','paused','expired','rejected')),
  created_by text references public.profiles(id) on delete set null,
  reviewed_by text references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or ends_at > starts_at),
  check (discount_type <> 'percent' or discount_value between 1 and 100),
  check (discount_type <> 'fixed' or discount_value > 0),
  check (discount_type not in ('free_item','bundle') or nullif(reward_text,'') is not null)
);
create index if not exists business_promotions_public_idx on public.business_promotions (status, starts_at, ends_at);
create index if not exists business_promotions_business_idx on public.business_promotions (business_id, created_at desc);

create table if not exists public.coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  promotion_id uuid not null references public.business_promotions(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id text not null references public.profiles(id) on delete cascade,
  token text not null unique default encode(gen_random_bytes(18), 'hex'),
  short_code text not null default upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 8)),
  status text not null default 'claimed' check (status in ('claimed','redeemed','expired','cancelled')),
  claimed_at timestamptz not null default now(),
  expires_at timestamptz,
  redeemed_at timestamptz,
  redeemed_by text references public.profiles(id) on delete set null,
  unique (promotion_id, short_code)
);
create index if not exists coupon_redemptions_user_idx on public.coupon_redemptions (user_id, claimed_at desc);
create index if not exists coupon_redemptions_business_idx on public.coupon_redemptions (business_id, status, claimed_at desc);

alter table public.business_promotions enable row level security;
alter table public.coupon_redemptions enable row level security;
drop policy if exists coupon_redemptions_select_own on public.coupon_redemptions;
create policy coupon_redemptions_select_own on public.coupon_redemptions
  for select to authenticated using (user_id = (auth.jwt() ->> 'sub'));

create or replace function public.touch_business_promotion_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;
drop trigger if exists trg_business_promotions_updated_at on public.business_promotions;
create trigger trg_business_promotions_updated_at before update on public.business_promotions
for each row execute function public.touch_business_promotion_updated_at();

-- Claim is atomic: checks plan, publication, dates, inventory and per-user cap,
-- then increments the counter only if a redemption row was created.
create or replace function public.claim_business_coupon(p_promotion_id uuid, p_user_id text)
returns table (redemption_id uuid, token text, short_code text, expires_at timestamptz)
language plpgsql security definer set search_path = public as $$
declare p public.business_promotions%rowtype; rid uuid; rt text; rc text; re timestamptz; used int;
begin
  select bp.* into p from public.business_promotions bp
  join public.businesses b on b.id = bp.business_id
  where bp.id = p_promotion_id and bp.kind = 'coupon' and bp.status = 'active'
    and b.status = 'published' and b.plan = 'premium'
  for update of bp;
  if p.id is null then raise exception 'coupon_unavailable'; end if;
  if p.starts_at > now() or (p.ends_at is not null and p.ends_at <= now()) then raise exception 'coupon_inactive'; end if;
  if p.total_limit is not null and p.claimed_count >= p.total_limit then raise exception 'coupon_sold_out'; end if;
  select count(*) into used from public.coupon_redemptions cr
    where cr.promotion_id = p.id and cr.user_id = p_user_id and cr.status <> 'cancelled';
  if used >= p.per_user_limit then
    return query select cr.id, cr.token, cr.short_code, cr.expires_at
      from public.coupon_redemptions cr where cr.promotion_id = p.id and cr.user_id = p_user_id
      order by cr.claimed_at desc limit 1;
    return;
  end if;
  insert into public.coupon_redemptions (promotion_id, business_id, user_id, expires_at)
  values (p.id, p.business_id, p_user_id, p.ends_at)
  returning id, coupon_redemptions.token, coupon_redemptions.short_code, coupon_redemptions.expires_at into rid, rt, rc, re;
  update public.business_promotions set claimed_count = claimed_count + 1 where id = p.id;
  return query select rid, rt, rc, re;
end; $$;

-- Staff redemption is atomic and owner-scoped. Repeated scans return the same
-- successful record without double-incrementing totals or Passport rewards.
create or replace function public.redeem_business_coupon(p_lookup text, p_owner_id text)
returns table (redemption_id uuid, promotion_id uuid, business_id uuid, user_id text, newly_redeemed boolean)
language plpgsql security definer set search_path = public as $$
declare r public.coupon_redemptions%rowtype; p public.business_promotions%rowtype; dow_sgt int; time_sgt time;
begin
  select cr.* into r from public.coupon_redemptions cr
  join public.businesses b on b.id = cr.business_id
  where (cr.token = lower(trim(p_lookup)) or cr.short_code = upper(trim(p_lookup)))
    and (b.owner_id = p_owner_id or b.claimed_by = p_owner_id)
  for update of cr;
  if r.id is null then raise exception 'coupon_not_found'; end if;
  if r.status = 'redeemed' then return query select r.id, r.promotion_id, r.business_id, r.user_id, false; return; end if;
  if r.status <> 'claimed' or (r.expires_at is not null and r.expires_at <= now()) then raise exception 'coupon_expired'; end if;
  select * into p from public.business_promotions where id = r.promotion_id and status = 'active';
  if p.id is null then raise exception 'coupon_inactive'; end if;
  dow_sgt := extract(dow from now() at time zone 'Asia/Singapore')::int;
  time_sgt := (now() at time zone 'Asia/Singapore')::time;
  if not (dow_sgt = any(p.valid_days)) then raise exception 'coupon_wrong_day'; end if;
  if p.redeem_start is not null and time_sgt < p.redeem_start then raise exception 'coupon_wrong_time'; end if;
  if p.redeem_end is not null and time_sgt > p.redeem_end then raise exception 'coupon_wrong_time'; end if;
  update public.coupon_redemptions set status = 'redeemed', redeemed_at = now(), redeemed_by = p_owner_id where id = r.id;
  update public.business_promotions set redeemed_count = redeemed_count + 1 where id = r.promotion_id;
  return query select r.id, r.promotion_id, r.business_id, r.user_id, true;
end; $$;

revoke all on function public.claim_business_coupon(uuid,text) from public;
revoke all on function public.redeem_business_coupon(text,text) from public;
grant execute on function public.claim_business_coupon(uuid,text) to service_role;
grant execute on function public.redeem_business_coupon(text,text) to service_role;

-- Coupon funnel events join the same first-party analytics stream.
alter table public.analytics_events drop constraint if exists analytics_events_event_type_check;
alter table public.analytics_events add constraint analytics_events_event_type_check check (event_type in (
  'page_view','impression','listing_view','search','lead_action','checkout_start','newsletter_signup',
  'search_result_click','filter_use','map_open','ai_query','ai_result_click','offer_view',
  'coupon_view','coupon_claim','coupon_redeem'
));

commit;
notify pgrst, 'reload schema';
