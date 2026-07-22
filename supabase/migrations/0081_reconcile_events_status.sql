-- 0081: reconcile repo ↔ live drift on events.status (audit F17).
--
-- The live DB's events_status_check already allows 'cancelled' (the app writes
-- it in app/api/events/[id]/route.ts), but that widening was applied out-of-band
-- and never captured as a migration — 0001 still says draft|pending|published|
-- rejected, so a fresh environment built from this folder rejects cancellations.
-- Recreating the constraint here makes the folder the source of truth again
-- (idempotent on live: same definition).
alter table events drop constraint if exists events_status_check;
alter table events
  add constraint events_status_check
  check (status in ('draft', 'pending', 'published', 'rejected', 'cancelled'));
