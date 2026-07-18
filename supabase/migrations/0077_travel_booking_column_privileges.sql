-- 0077: column-level privileges on public.hotel_bookings + public.flight_bookings.
--
-- Problem: RLS is row-level only. The "booking owner read" / "flight owner read"
-- policies (0006, 0007) let an authenticated traveller SELECT their OWN booking
-- rows via PostgREST — with no column restriction. Those rows carry
-- commission_amount (Humble Halal's per-booking cut), so a buyer can
-- `select=commission_amount` on their own bookings and read our internal margin.
-- The 0068 column-privilege hardening was applied to businesses only; these two
-- money tables were missed.
--
-- Fix: same technique as 0068 — Postgres can't revoke a single column from a
-- table-level grant, so revoke SELECT on the whole table from anon/authenticated
-- and grant it back on the safe columns only (dynamic, survives schema drift).
--   * anon + authenticated LOSE: commission_amount
--   * everything else stays readable, so the owner "My trips" page
--     (app/travel/trips/page.tsx — selects retail_total etc., never
--     commission_amount) and the owner-read RLS filter (user_id = auth.uid())
--     keep working.
--   * service_role is UNTOUCHED (all server reads/writes go through it and are
--     exempt from column privileges).
--
-- AFTER THIS: selecting commission_amount as anon/authenticated returns 42501 (by
-- design). ⚠️ ALTER TABLE ADD COLUMN is NOT auto-granted — a NEW public column on
-- these tables must be added to the grant lists (see docs/migration-ledger.md).
--
-- Rollback (single statement per table):
--   grant select on public.hotel_bookings  to anon, authenticated;
--   grant select on public.flight_bookings to anon, authenticated;

begin;

revoke select on public.hotel_bookings  from anon, authenticated;
revoke select on public.flight_bookings from anon, authenticated;

do $$
declare
  hotel_cols  text;
  flight_cols text;
begin
  select string_agg(quote_ident(column_name), ', ' order by ordinal_position)
    into hotel_cols
    from information_schema.columns
   where table_schema = 'public'
     and table_name   = 'hotel_bookings'
     and column_name  <> 'commission_amount';

  select string_agg(quote_ident(column_name), ', ' order by ordinal_position)
    into flight_cols
    from information_schema.columns
   where table_schema = 'public'
     and table_name   = 'flight_bookings'
     and column_name  <> 'commission_amount';

  execute format('grant select (%s) on public.hotel_bookings  to anon, authenticated', hotel_cols);
  execute format('grant select (%s) on public.flight_bookings to anon, authenticated', flight_cols);
end $$;

commit;

-- Make PostgREST re-read the new privileges immediately.
notify pgrst, 'reload schema';
