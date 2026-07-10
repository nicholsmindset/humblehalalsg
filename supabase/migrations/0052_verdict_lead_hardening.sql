-- Humble Halal — hardening for merged features (verdicts #139, lead marketplace #136).
-- 1. Stop anon reads of halal_verdicts leaking audit columns; expose only the
--    public verdict fields through a view.
-- 2. Make verdict approval (supersede + promote) atomic — no window/failure that
--    leaves a slug with zero live verdicts.
-- 3. Make lead-route acceptance atomic under the per-business quota / beta cap so
--    concurrent accepts can't exceed it.
-- Run after 0047 (halal_verdicts) and 0046 (lead_routes). NOTE: numbered 0052 to
-- sit clear of the in-flight passport migrations 0049–0051 (PR #145) so the two
-- branches never collide on a filename regardless of merge order.

-- ── 1. halal_verdicts: don't expose audit columns to anon ────────────────────
-- The app reads verdicts ONLY via the service role (lib/verdicts-data.ts), which
-- bypasses RLS — so the broad "public read approved" policy served nobody except
-- a direct anon API caller, to whom it leaked reviewed_by / review_note /
-- source_input (admin id + internal notes + the raw AI input). Drop it; expose
-- just the public verdict fields for approved rows through an owner-rights view.
drop policy if exists "halal_verdicts public read approved" on public.halal_verdicts;
-- (admin-read policy + service-role writes are unchanged.)

create or replace view public.halal_verdicts_public as
  select slug, page_type, name, h1, verdict, confidence, verdict_label, cert_status,
         one_line_answer, confidence_explainer, date_reviewed,
         why_verdict, ingredient_table, look_for, alternatives,
         official_sources, scholarly_views, internal_links, faq_answer
    from public.halal_verdicts
   where status = 'approved';
-- Owner-rights view (NOT security_invoker) so it can serve approved rows past the
-- now-restrictive base RLS, while exposing only the safe columns above.
grant select on public.halal_verdicts_public to anon, authenticated;

-- ── 2. Atomic verdict approval (supersede + promote in ONE transaction) ──────
-- The route did retire-then-promote as two separate statements: between them a
-- reader saw zero approved (404), and if the promote failed the slug was left
-- with no live verdict permanently. One transaction fixes both — a reader sees
-- the old approved until commit, then the new one; a failure rolls both back.
-- Compliance gate (halal needs a cited source) stays in the route, pre-call.
create or replace function public.approve_verdict(p_id uuid, p_reviewer text, p_note text)
returns text language plpgsql security definer set search_path = public as $$
declare v_slug text;
begin
  select slug into v_slug from halal_verdicts where id = p_id;
  if v_slug is null then return null; end if;
  -- retire the current approved sibling(s) for this slug...
  update halal_verdicts set status = 'rejected', review_note = 'superseded by a newer verdict'
   where slug = v_slug and status = 'approved' and id <> p_id;
  -- ...then promote this one (same tx → the partial unique index sees 0 approved).
  update halal_verdicts
     set status = 'approved', reviewed_by = p_reviewer, reviewed_at = now(), review_note = p_note
   where id = p_id;
  return v_slug;
end; $$;
revoke execute on function public.approve_verdict(uuid,text,text) from public;
grant  execute on function public.approve_verdict(uuid,text,text) to service_role;

-- ── 3. Atomic lead-route acceptance under the quota / beta cap ────────────────
-- The accept route counted usage then updated in two calls: two concurrent
-- accepts of different routes for the SAME business both passed the cap check and
-- both consumed, exceeding the paid quota (a given-away credit) or the beta free
-- cap. Serialize per business with an advisory lock, re-check inside it, update.
-- Returns: 'ok' | 'not_found' | 'wrong_state' | 'cap' (beta) | 'quota' (paid).
create or replace function public.accept_lead_route(
  p_route_id uuid, p_business_id uuid, p_paid boolean, p_cap int, p_since timestamptz
) returns text language plpgsql security definer set search_path = public as $$
declare v_status text; v_used int; n int;
begin
  perform pg_advisory_xact_lock(hashtext('leadcap:' || p_business_id::text));
  select status into v_status from lead_routes where id = p_route_id;
  if v_status is null then return 'not_found'; end if;
  if v_status not in ('sent','viewed') then return 'wrong_state'; end if; -- already handled / raced
  if p_paid then
    select count(*) into v_used from lead_routes
      where business_id = p_business_id and quota_consumed = true and accepted_at >= p_since;
    if v_used >= p_cap then return 'quota'; end if;
  else
    select count(*) into v_used from lead_routes
      where business_id = p_business_id and status in ('accepted','contacted','won','lost')
        and accepted_at >= p_since;
    if v_used >= p_cap then return 'cap'; end if;
  end if;
  update lead_routes set status = 'accepted', accepted_at = now(), quota_consumed = p_paid
   where id = p_route_id and status in ('sent','viewed');
  get diagnostics n = row_count;
  if n = 0 then return 'wrong_state'; end if;
  return 'ok';
end; $$;
revoke execute on function public.accept_lead_route(uuid,uuid,boolean,int,timestamptz) from public;
grant  execute on function public.accept_lead_route(uuid,uuid,boolean,int,timestamptz) to service_role;
