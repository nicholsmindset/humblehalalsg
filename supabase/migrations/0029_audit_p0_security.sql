-- Humble Halal — CP1 security-audit P0 RLS/privilege hardening.
-- Closes anon-key-exploitable holes found in the codebase audit. Idempotent.
-- Run after 0028. Service-role (admin API / seed) bypasses RLS and has
-- rolbypassrls, so every fix below leaves the service-role paths working.

-- ── 1. Lock business trust/monetization columns against owner self-service ───
-- The "own business" RLS policy is FOR ALL with no column scope, so an owner
-- could UPDATE (or INSERT) halal_tier='muis' (fake MUIS certification — a golden-
-- rule violation), halal_score, featured/plan='premium' (free paid placement),
-- status, muis_* etc. directly through the browser anon key, bypassing the
-- service-role admin path (app/api/admin/verify). This trigger pins those columns
-- for RLS-bound roles (anon/authenticated) on BOTH insert and update; roles with
-- BYPASSRLS (service_role admin API, postgres migrations/seed) are unaffected.
-- SECURITY INVOKER (default) so current_user is the *caller's* role, not the owner.
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
  return new;
end;
$$;

drop trigger if exists trg_guard_business_trust on public.businesses;
create trigger trg_guard_business_trust
  before insert or update on public.businesses
  for each row execute function public.guard_business_trust_columns();

-- ── 2. Public read: published rows only ─────────────────────────────────────
-- "businesses public read" was using(true) — anon could read unpublished
-- (staging/pending/suspended) rows. The public directory already filters
-- status='published' (lib/directory.ts), and owners keep access to their own
-- rows via the "own business" policy, so this is a safe tightening.
drop policy if exists "businesses public read" on public.businesses;
create policy "businesses public read" on public.businesses
  for select using (status = 'published');

-- ── 3. SECURITY DEFINER counters: service_role only (not PUBLIC) ─────────────
-- increment/decrement_event_taken + increment_donation_raised were EXECUTE-able
-- by PUBLIC, so anon could RPC them to tamper ticket sold-counts and public
-- donation totals. Only the Stripe webhook (service-role) should call them.
revoke execute on function public.increment_event_taken(text, int) from public;
revoke execute on function public.decrement_event_taken(text, int) from public;
revoke execute on function public.increment_donation_raised(text, int) from public;
grant execute on function public.increment_event_taken(text, int) to service_role;
grant execute on function public.decrement_event_taken(text, int) to service_role;
grant execute on function public.increment_donation_raised(text, int) to service_role;

-- ── 4. Analytics views respect analytics_events' admin-only RLS ─────────────
-- These reporting views read analytics_events (RLS: admin-only SELECT) but, as
-- plain views, ran with the view owner's rights and bypassed that RLS. Switch to
-- security_invoker so the caller's RLS applies (admins via is_admin() / service-
-- role still see everything; anon/non-admin see nothing).
alter view public.v_daily_lead_actions  set (security_invoker = on);
alter view public.v_vendor_leads         set (security_invoker = on);
alter view public.v_search_intelligence  set (security_invoker = on);
alter view public.v_session_entry        set (security_invoker = on);
