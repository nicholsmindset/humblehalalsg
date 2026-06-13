-- Humble Halal — flights v2: round-trip + seats/bags on flight_bookings.
-- Run after 0007_flights.sql. Idempotent.

alter table if exists public.flight_bookings
  add column if not exists trip_type text default 'one',
  add column if not exists itinerary jsonb,
  add column if not exists fare_brand text,
  add column if not exists selected_services jsonb,
  add column if not exists seats jsonb;
