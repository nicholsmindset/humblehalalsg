-- Browser writes now pass through validated, rate-limited Next.js endpoints.
-- Keep only the opaque-token scorecard RPC publicly callable; these helpers are
-- all consumed through getSupabaseAdmin() server code in the application.

revoke all on function public.follower_count(uuid) from public, anon, authenticated;
grant execute on function public.follower_count(uuid) to service_role;

revoke all on function public.increment_ref_click(uuid) from public, anon, authenticated;
grant execute on function public.increment_ref_click(uuid) to service_role;

revoke all on function public.increment_referral_click(text) from public, anon, authenticated;
grant execute on function public.increment_referral_click(text) to service_role;

revoke all on function public.increment_review_helpful(uuid) from public, anon, authenticated;
grant execute on function public.increment_review_helpful(uuid) to service_role;

revoke all on function public.passport_leaderboard(text, integer) from public, anon, authenticated;
grant execute on function public.passport_leaderboard(text, integer) to service_role;

revoke all on function public.my_passport_rank(text, text) from public, anon, authenticated;
grant execute on function public.my_passport_rank(text, text) to service_role;

revoke all on function public.track_ad_event(uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.track_ad_event(uuid, text, text, text) to service_role;

revoke all on function public.track_event(text, text, text, text, text, text, text, text, text, text, integer, text)
  from public, anon, authenticated;
grant execute on function public.track_event(text, text, text, text, text, text, text, text, text, text, integer, text)
  to service_role;

notify pgrst, 'reload schema';
