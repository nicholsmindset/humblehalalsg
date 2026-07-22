-- 0080: require ends_at on newly created events (audit F4, part 2 of 0079).
--
-- APPLY ONLY AFTER the deployment that writes ends_at on event creation is
-- live — the NOT VALID check skips legacy rows but enforces on every INSERT,
-- so applying it under the old code breaks event creation.
alter table events
  add constraint events_ends_at_required
  check (ends_at is not null) not valid;
