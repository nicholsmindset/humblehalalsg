-- Humble Halal — event promo/discount codes (events marketplace Phase 1).
-- Organisers create percent or fixed-amount codes scoped to one event or the
-- whole organisation (event_id null). Discounts are PRE-COMPUTED server-side in
-- /api/checkout/ticket (never Stripe coupons: our two-line-item structure —
-- face value + booking fee — and the metadata-driven payout math must reflect
-- the discount exactly; a session-wide Stripe discount would corrupt both).
-- Builds on 0001_init (events, businesses), 0031_clerk_auth (text user ids).
--
-- Security model (0017/0029 conventions):
--   * Writes go through owner-authorised server routes using the service role —
--     no public insert/update/delete policies.
--   * Owners/admins may read their own codes (dashboard); the public never
--     reads this table — code validation happens server-side in the API.
--   * redeemed is only advanced by redeem_promo(), a SECURITY DEFINER counter
--     executable by service_role alone (same pattern as increment_event_taken).

create table if not exists promo_codes (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  event_id text references events(id) on delete cascade, -- null = all the organiser's events
  code text not null check (code = upper(code) and char_length(code) between 3 and 32),
  kind text not null check (kind in ('percent','fixed')),
  percent_off int check (percent_off between 1 and 100),
  amount_off_cents int check (amount_off_cents > 0),
  max_redemptions int check (max_redemptions > 0),
  redeemed int not null default 0,
  min_qty int not null default 1 check (min_qty >= 1),
  starts_at timestamptz,
  expires_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (business_id, code),
  -- the discount field must match the kind
  check (
    (kind = 'percent' and percent_off is not null and amount_off_cents is null) or
    (kind = 'fixed' and amount_off_cents is not null and percent_off is null)
  )
);

create index if not exists promo_codes_event_idx on promo_codes (event_id) where event_id is not null;
create index if not exists promo_codes_business_idx on promo_codes (business_id);

alter table promo_codes enable row level security;

drop policy if exists promo_codes_owner_read on promo_codes;
create policy promo_codes_owner_read on promo_codes for select using (
  exists (
    select 1 from businesses b
    where b.id = promo_codes.business_id
      and (b.owner_id = (auth.jwt() ->> 'sub') or b.claimed_by = (auth.jwt() ->> 'sub'))
  )
);
drop policy if exists promo_codes_admin_read on promo_codes;
create policy promo_codes_admin_read on promo_codes for select using (public.is_admin());

-- Atomic redemption with headroom check: only counts a redemption while the
-- code is active and under its cap. Called by the Stripe webhook on confirmed
-- ticket orders (accepting the tiny oversell window between session creation
-- and webhook confirm — bounded and harmless at current volume).
create or replace function public.redeem_promo(p_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  ok boolean;
begin
  update promo_codes
     set redeemed = redeemed + 1
   where id = p_id
     and active
     and (max_redemptions is null or redeemed < max_redemptions)
  returning true into ok;
  return coalesce(ok, false);
end;
$$;

revoke execute on function public.redeem_promo(uuid) from public;
grant execute on function public.redeem_promo(uuid) to service_role;
