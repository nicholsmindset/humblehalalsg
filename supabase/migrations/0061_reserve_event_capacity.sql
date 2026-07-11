-- 0061 — Atomic, capacity-aware seat reservation for flash sales.
--
-- Before this, capacity was only READ-checked when a Checkout session was
-- created and counted at payment completion — so with N concurrently-open
-- checkouts every one of them could oversell a nearly-full event (the classic
-- TOCTOU; Stripe's managing-limited-inventory guide says to hold inventory at
-- session creation and release it on checkout.session.expired).
--
-- reserve_event_capacity increments `taken` ONLY when the result stays within
-- capacity (capacity 0/null = unlimited) and reports whether it did, in one
-- atomic statement. The release path reuses the existing decrement_event_taken
-- (0025). Service-role only, matching 0029's posture for the other counters.

create or replace function public.reserve_event_capacity(p_event_id text, p_qty int)
returns boolean
language sql
security definer
set search_path = public
as $$
  update public.events
     set taken = taken + greatest(p_qty, 0)
   where id = p_event_id
     and (capacity is null or capacity = 0 or taken + greatest(p_qty, 0) <= capacity)
  returning true;
$$;

revoke execute on function public.reserve_event_capacity(text, int) from public;
revoke execute on function public.reserve_event_capacity(text, int) from anon;
revoke execute on function public.reserve_event_capacity(text, int) from authenticated;
grant execute on function public.reserve_event_capacity(text, int) to service_role;
