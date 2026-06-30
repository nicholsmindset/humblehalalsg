-- 0036_business_phone — add a phone column to `businesses`. Needed so claimed
-- owners can edit their contact number and so contact enrichment
-- (scripts/enrich-contacts.mjs) can backfill phones. Nullable + additive.

alter table businesses add column if not exists phone text;
