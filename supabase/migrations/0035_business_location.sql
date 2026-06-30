-- 0035_business_location — give the live `businesses` table a street address +
-- postal code. The directory seed (scripts/seed-spreadsheet.mjs) writes these
-- so detail pages can show the exact location and the postal can drive precise
-- geocoding. Both nullable + additive (safe on the live table). After applying,
-- re-run the seed to backfill addresses for the spreadsheet rows.

alter table businesses add column if not exists address text;
alter table businesses add column if not exists postal text;

-- Optional: index postal for any postal-based lookups/dedup.
create index if not exists businesses_postal_idx on businesses (postal);
