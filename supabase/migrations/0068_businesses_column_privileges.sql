-- 0068: column-level privileges on public.businesses.
--
-- Problem: RLS is row-level only. The PUBLIC anon key can `select=*` on any
-- published business row via PostgREST, exposing stripe_customer_id, phone,
-- contact_email, owner_id and claimed_by to anonymous scrapers. The app never
-- selects those columns for anon, but the anon key is public — so this is
-- defense-in-depth against direct REST access.
--
-- Fix: Postgres can't revoke a single column from a table-level grant, so we
-- revoke SELECT on the whole table from anon/authenticated and grant it back on
-- the safe columns only (dynamic, so it survives schema drift).
--   * anon        loses: stripe_customer_id, phone, contact_email, owner_id, claimed_by
--   * authenticated loses: stripe_customer_id, phone, contact_email
--       (KEEPS owner_id/claimed_by — the owner-dashboard PostgREST filter
--        .or(owner_id.eq…,claimed_by.eq…) needs SELECT on those columns)
--   * service_role is UNTOUCHED (all server reads/writes + RLS policy expressions
--       are exempt from column privileges).
--
-- AFTER THIS: `select=*` on businesses as anon/authenticated returns 42501 (by
-- design). ⚠️ ALTER TABLE ADD COLUMN is NOT auto-granted — any NEW public column
-- must be added to these grant lists (see docs/migration-ledger.md).
--
-- Rollback (single statement): grant select on public.businesses to anon, authenticated;

begin;

revoke select on public.businesses from anon, authenticated;

do $$
declare
  safe_cols text;
begin
  select string_agg(quote_ident(column_name), ', ' order by ordinal_position)
    into safe_cols
    from information_schema.columns
   where table_schema = 'public'
     and table_name   = 'businesses'
     and column_name not in ('stripe_customer_id', 'phone', 'contact_email', 'owner_id', 'claimed_by');

  -- anon: safe columns only.
  execute format('grant select (%s) on public.businesses to anon', safe_cols);
  -- authenticated: safe columns + owner linkage (needed by the owner dashboard).
  execute format('grant select (%s, owner_id, claimed_by) on public.businesses to authenticated', safe_cols);
end $$;

commit;

-- Make PostgREST re-read the new privileges immediately.
notify pgrst, 'reload schema';
