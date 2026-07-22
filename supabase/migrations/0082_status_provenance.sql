-- 0082: status provenance on businesses (audit Gap 1).
--
-- The trust promise needs receipts: WHERE a halal status came from, WHEN it
-- was last checked, and WHO checked it. Until now the closest signals were a
-- free-form provenance jsonb (populated on 10/380 rows) and last_verified_at
-- (NULL on 368/380). These columns make provenance first-class:
--   status_source_url — public evidence (HalalSG register entry, official
--                       menu/page used for the check)
--   status_checked_at — when the status was last humanly/systemically checked
--   status_checked_by — internal audit trail (admin user id or system:<job>);
--                       NOT granted to anon/authenticated
-- Writes flow through lib/verify-grant.ts (admin grants), /api/admin/verify,
-- /api/admin/cert and the recheck-certs cron.

alter table businesses
  add column if not exists status_source_url text,
  add column if not exists status_checked_at timestamptz,
  add column if not exists status_checked_by text;

-- Backfill: last_verified_at is the closest historical "checked" signal.
update businesses
   set status_checked_at = last_verified_at
 where status_checked_at is null
   and last_verified_at is not null;

-- Owners must not self-assert provenance any more than tier/cert fields:
-- extend the 0029 guard trigger (null on INSERT, preserved on UPDATE for
-- non-BYPASSRLS roles).
create or replace function public.guard_business_trust_columns()
returns trigger
language plpgsql
set search_path = public, pg_catalog
as $$
begin
  if exists (select 1 from pg_roles where rolname = current_user and rolbypassrls) then
    return new; -- service_role / postgres may set anything
  end if;

  if tg_op = 'INSERT' then
    -- An owner may create a listing, but never self-certified / featured / paid.
    new.halal_tier         := null;
    new.halal_score        := null;
    new.featured           := false;
    new.plan               := 'free';
    new.muis_cert_no       := null;
    new.muis_scheme        := null;
    new.muis_expiry        := null;
    new.last_verified_at   := null;
    new.status_source_url  := null;
    new.status_checked_at  := null;
    new.status_checked_by  := null;
    return new;
  end if;

  -- UPDATE: preserve every trust/monetization/provenance column from the old row.
  new.halal_tier         := old.halal_tier;
  new.halal_score        := old.halal_score;
  new.featured           := old.featured;
  new.plan               := old.plan;
  new.status             := old.status;
  new.muis_cert_no       := old.muis_cert_no;
  new.muis_scheme        := old.muis_scheme;
  new.muis_expiry        := old.muis_expiry;
  new.last_verified_at   := old.last_verified_at;
  new.source             := old.source;
  new.provenance         := old.provenance;
  new.claimed_by         := old.claimed_by;
  new.owner_id           := old.owner_id;
  new.stripe_customer_id := old.stripe_customer_id;
  new.status_source_url  := old.status_source_url;
  new.status_checked_at  := old.status_checked_at;
  new.status_checked_by  := old.status_checked_by;
  return new;
end;
$$;

-- 0068 model: new columns are NOT auto-granted. Source URL + check date are
-- public trust data; checked_by is internal-only (service role still reads it).
grant select (status_source_url, status_checked_at)
  on public.businesses to anon, authenticated;

notify pgrst, 'reload schema';
