-- Humble Halal — hawker-centre seed (v3). Paste into the Supabase SQL editor.
-- Factual public data only (name/region/nearest MRT). address/lat/lng left NULL —
-- fill later or run scripts/geocode-listings.mjs. Idempotent upsert on id.
insert into public.hawker_centres (id, name, region, nearest_mrt, source) values
  ('punggol-coast-hawker-centre', 'Punggol Coast Hawker Centre', 'North-East', 'Punggol Coast', 'manual'),
  ('bukit-canberra-hawker-centre', 'Bukit Canberra Hawker Centre', 'North', 'Canberra', 'manual'),
  ('yishun-park-hawker-centre', 'Yishun Park Hawker Centre', 'North', 'Khatib', 'manual'),
  ('senja-hawker-centre', 'Senja Hawker Centre', 'West', 'Senja', 'manual'),
  ('changi-village-hawker-centre', 'Changi Village Hawker Centre', 'East', 'Tampines', 'manual'),
  ('anchorvale-village-hawker-centre', 'Anchorvale Village Hawker Centre', 'North-East', 'Sengkang', 'manual'),
  ('chinatown-complex-food-centre', 'Chinatown Complex Food Centre', 'Central', 'Chinatown', 'manual'),
  ('ci-yuan-hawker-centre', 'Ci Yuan Hawker Centre', 'North-East', 'Buangkok', 'manual'),
  ('woodleigh-village-hawker-centre', 'Woodleigh Village Hawker Centre', 'North-East', 'Woodleigh', 'manual'),
  ('one-punggol-hawker-centre', 'One Punggol Hawker Centre', 'North-East', 'Punggol', 'manual'),
  ('buangkok-hawker-centre', 'Buangkok Hawker Centre', 'North-East', 'Buangkok', 'manual'),
  ('newton-food-centre', 'Newton Food Centre', 'Central', 'Newton', 'manual'),
  ('bukit-timah-market-food-centre', 'Bukit Timah Market & Food Centre', 'Central', 'Beauty World', 'manual'),
  ('old-airport-road-food-centre', 'Old Airport Road Food Centre', 'Central', 'Dakota', 'manual'),
  ('market-street-hawker-centre', 'Market Street Hawker Centre', 'Central', 'Telok Ayer', 'manual'),
  ('jurong-west-hawker-centre', 'Jurong West Hawker Centre', 'West', 'Pioneer', 'manual'),
  ('maxwell-food-centre', 'Maxwell Food Centre', 'Central', 'Maxwell', 'manual'),
  ('pasir-ris-central-hawker-centre', 'Pasir Ris Central Hawker Centre', 'East', 'Pasir Ris', 'manual'),
  ('circuit-road-hawker-centre', 'Circuit Road Hawker Centre', 'Central', 'Mattar', 'manual'),
  ('kovan-hawker-centre', 'Kovan 209 Market & Food Centre', 'North-East', 'Kovan', 'manual'),
  ('clementi-448-market-food-centre', 'Clementi 448 Market & Food Centre', 'West', 'Clementi', 'manual'),
  ('kampung-admiralty-hawker-centre', 'Kampung Admiralty Hawker Centre', 'North', 'Admiralty', 'manual')
on conflict (id) do update set
  name = excluded.name, region = excluded.region, nearest_mrt = excluded.nearest_mrt, updated_at = now();

-- Turn the hawker finder on (feature flag: FLAG_COLUMN.hawkerFinder).
update public.platform_settings set hawker_finder_enabled = true;
