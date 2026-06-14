-- Humble Halal — make DB events renderable by the rich EventItem UI.
-- The 0001/0002 events table is minimal (id, slug, title, capacity, taken,
-- is_free, date_iso, business_id, status). The UI's EventItem also needs display
-- fields (category, image, time/date labels, venue, area, organiser, blurb,
-- tags, priceFrom, tiers, …). Rather than 18 columns, we store those extras in a
-- single `display` jsonb the events data-seam merges over the structural columns.
-- Run after 0013. Idempotent.

alter table if exists public.events
  add column if not exists display jsonb not null default '{}'::jsonb;
