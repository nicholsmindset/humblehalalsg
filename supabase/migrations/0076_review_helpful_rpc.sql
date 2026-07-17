-- 0076 — Persist review "Helpful" votes.
-- The detail-page Helpful button previously only mutated client state; this
-- RPC lets /api/reviews/helpful atomically bump reviews.helpful (0002) for
-- published reviews. Service-role only — the API route rate-limits callers.

begin;

create or replace function public.increment_review_helpful(p_review_id uuid)
returns int
language plpgsql security definer set search_path = public as $$
declare v_helpful int;
begin
  update reviews
     set helpful = coalesce(helpful, 0) + 1
   where id = p_review_id and status = 'published'
  returning helpful into v_helpful;
  return v_helpful; -- null when the review is missing or not published
end; $$;

revoke all on function public.increment_review_helpful(uuid) from public;
grant execute on function public.increment_review_helpful(uuid) to service_role;

commit;
notify pgrst, 'reload schema';
