-- 0079: events end date — make expiry enforceable at the data layer (audit F4).
--
-- Events carry only a nullable start date (date_iso), so "expired" is a
-- query-time convention (.gte date_iso): a multi-day event vanishes the day
-- after it STARTS while still running, and nothing structurally prevents a
-- code path from surfacing a finished event. This adds ends_at:
--   * backfilled from date_iso (single-day events end the day they start)
--   * ordered: ends_at >= date_iso whenever both are set
--   * required on NEW rows (NOT VALID check — legacy rows are not rewritten;
--     the creation API/form must also require it)
--
-- Follow-up code change (ships only after this is applied, else the query
-- errors and getEvents fail-safes to an empty list):
--   lib/events-source.ts getEvents(): .gte("date_iso", todaySG())
--                                   → .gte("ends_at", todaySG())
--   components/seo/json-ld.tsx eventJsonLd(): emit endDate from ends_at.

alter table events add column if not exists ends_at date;

update events set ends_at = date_iso where ends_at is null;

alter table events
  add constraint events_ends_after_start
  check (ends_at is null or date_iso is null or ends_at >= date_iso);

-- NOTE: the "ends_at required on new rows" constraint lives in 0080 and is
-- applied only AFTER the creation code that writes ends_at is deployed —
-- applying it while the old deployment is live would break event creation.

-- The public read path filters status + date and orders by date on every
-- request; cover it.
create index if not exists events_public_read_idx
  on events (status, ends_at, date_iso);
