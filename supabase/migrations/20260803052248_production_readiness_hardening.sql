-- Production-readiness hardening.
--
-- This restores least-privilege RPC grants and removes the SECURITY DEFINER
-- view findings without widening access to underlying data. Schema migrations
-- 0080 and 0082 are applied separately so the ends_at guard lands only after
-- the compatible application code is deployed.

-- Public directory rollups remain subject to the existing published-row RLS
-- policies on businesses and reviews.
alter view public.category_area_counts set (security_invoker = true);
alter view public.v_business_ratings set (security_invoker = true);
alter view public.v_reviews_public set (security_invoker = true);

-- These two aggregates are consumed only through service-role server code (or
-- are currently unused). Do not expose their protected source rows via views.
alter view public.halal_verdicts_public set (security_invoker = true);
alter view public.v_organizer_rating set (security_invoker = true);
revoke all on public.halal_verdicts_public from anon, authenticated;
revoke all on public.v_organizer_rating from anon, authenticated;
revoke all on public.halal_verdicts from anon, authenticated;
revoke all on public.event_reviews from anon, authenticated;

-- Restore the grants that the source migrations intended. A later broad default
-- grant had made privileged SECURITY DEFINER functions callable by anon.
do $$
declare
  fn record;
begin
  -- Administrative RPCs enforce is_admin() internally and are browser-callable
  -- only for signed-in users.
  for fn in
    select p.oid::regprocedure as signature
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname like 'admin\_%' escape '\'
  loop
    execute format('revoke all on function %s from public, anon', fn.signature);
    execute format('grant execute on function %s to authenticated, service_role', fn.signature);
  end loop;

  -- Owner RPCs scope their result to auth.uid()/the signed-in Clerk subject.
  for fn in
    select p.oid::regprocedure as signature
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname like 'owner\_%' escape '\'
  loop
    execute format('revoke all on function %s from public, anon', fn.signature);
    execute format('grant execute on function %s to authenticated, service_role', fn.signature);
  end loop;

  -- Mutations whose authorization is enforced by the Next.js API and trigger
  -- helpers that must never be invoked directly through PostgREST.
  for fn in
    select p.oid::regprocedure as signature
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = any (array[
         'accept_lead_route', 'approve_verdict', 'award_points',
         'claim_business_coupon', 'credit_referral',
         'crm_outbox_business_change', 'crm_outbox_lead_change',
         'crm_outbox_lead_route_change', 'decrement_event_taken',
         'enter_giveaway', 'increment_donation_raised',
         'increment_event_taken', 'public_passport_by_token',
         'qualify_referral', 'redeem_business_coupon', 'redeem_reward',
         'rls_auto_enable'
       ])
  loop
    execute format('revoke all on function %s from public, anon, authenticated', fn.signature);
    execute format('grant execute on function %s to service_role', fn.signature);
  end loop;

  -- Signed-in self-service helpers.
  for fn in
    select p.oid::regprocedure as signature
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = any (array['is_admin', 'mark_notification_read', 'my_passport_rank'])
  loop
    execute format('revoke all on function %s from public, anon', fn.signature);
    execute format('grant execute on function %s to authenticated, service_role', fn.signature);
  end loop;
end $$;

-- Resolve mutable-search-path findings on utility functions.
alter function public.get_directory_stats() set search_path = public, pg_catalog;
alter function public.audit_log_block_mutation() set search_path = public, pg_catalog;

-- Cost-bearing and payment features stay fail-safe until their integrations and
-- rate limiting have passed production verification. Travel/hotels remain off.
update public.platform_settings
   set paid_tickets_enabled = false,
       paid_ads_enabled = false,
       paid_plans_enabled = false,
       paid_hotels_enabled = false,
       paid_flights_enabled = false,
       paynow_enabled = false,
       ai_concierge_enabled = false,
       semantic_search_enabled = false,
       updated_at = now()
 where id = 1;

notify pgrst, 'reload schema';
