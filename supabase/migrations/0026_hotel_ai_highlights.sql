-- Humble Halal — cache for AI-generated hotel "highlights for a Muslim traveller".
-- Caps token spend: /api/travel/highlights reads this first and regenerates only
-- when a row is missing or older than 7 days. Public display data (read-only to
-- everyone); writes go through the service-role client (bypasses RLS). Run after
-- 0001–0025. Matches the style of 0006_travel.sql (public-read overlay tables).

create table if not exists hotel_ai_highlights (
  hotel_id text primary key,
  highlights jsonb not null,
  created_at timestamptz not null default now()
);

alter table hotel_ai_highlights enable row level security;

-- Public, read-only display data (writes via service-role only).
drop policy if exists "hotel_ai_highlights public read" on hotel_ai_highlights;
create policy "hotel_ai_highlights public read" on hotel_ai_highlights for select using (true);
