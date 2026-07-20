-- Humble Halal — hawker-centre seed (v3). Paste into the Supabase SQL editor.
-- Factual public data only (name/region/nearest MRT/address/approx coords).
-- Coordinates are approximate (5-decimal, centre-of-building) — good enough for
-- the map pin; run scripts/geocode-hawker.mjs (npm run geocode:hawker) to
-- OneMap-resolve anything still NULL. hours stay NULL: hawker centres are
-- collections of independent stalls and opening hours are genuinely
-- stall-dependent. Idempotent upsert on id; address/lat/lng are FILL-IF-MISSING
-- so re-running the seed never clobbers geocoded or hand-corrected values.
insert into public.hawker_centres (id, name, address, region, nearest_mrt, lat, lng, source) values
  -- Halal-relevant flagships (profiled in lib/hawker-content.ts)
  ('geylang-serai-market', 'Geylang Serai Market & Food Centre', '1 Geylang Serai, Singapore 402001', 'East', 'Paya Lebar', 1.31756, 103.89757, 'manual'),
  ('haig-road-market-food-centre', 'Haig Road Market & Food Centre', '14 Haig Road, Singapore 430014', 'East', 'Paya Lebar', 1.31437, 103.89729, 'manual'),
  ('adam-road-food-centre', 'Adam Road Food Centre', '2 Adam Road, Singapore 289876', 'Central', 'Botanic Gardens', 1.32360, 103.81402, 'manual'),
  ('tekka-centre', 'Tekka Centre', '665 Buffalo Road, Singapore 210665', 'Central', 'Little India', 1.30610, 103.84964, 'manual'),
  ('bedok-interchange-hawker-centre', 'Bedok Interchange Hawker Centre', '208B New Upper Changi Road, Singapore 462208', 'East', 'Bedok', 1.32480, 103.92970, 'manual'),
  ('marsiling-mall-hawker-centre', 'Marsiling Mall Hawker Centre', '4 Woodlands Street 12, Singapore 738623', 'North', 'Marsiling', 1.43310, 103.77720, 'manual'),
  ('our-tampines-hub-hawker-centre', 'Our Tampines Hub Hawker Centre', '1 Tampines Walk, Singapore 528523', 'East', 'Tampines', 1.35330, 103.94040, 'manual'),
  ('old-airport-road-food-centre', 'Old Airport Road Food Centre', '51 Old Airport Road, Singapore 390051', 'Central', 'Dakota', 1.30820, 103.88530, 'manual'),
  -- The wider centre directory
  ('punggol-coast-hawker-centre', 'Punggol Coast Hawker Centre', null, 'North-East', 'Punggol Coast', 1.41480, 103.91000, 'manual'),
  ('bukit-canberra-hawker-centre', 'Bukit Canberra Hawker Centre', '21 Canberra Link', 'North', 'Canberra', 1.44530, 103.82440, 'manual'),
  ('yishun-park-hawker-centre', 'Yishun Park Hawker Centre', '51 Yishun Avenue 11, Singapore 768867', 'North', 'Khatib', 1.42350, 103.84030, 'manual'),
  ('senja-hawker-centre', 'Senja Hawker Centre', '11 Senja Close', 'West', 'Senja', 1.38460, 103.76210, 'manual'),
  ('changi-village-hawker-centre', 'Changi Village Hawker Centre', '2 Changi Village Road, Singapore 500002', 'East', 'Tampines', 1.38930, 103.98800, 'manual'),
  ('anchorvale-village-hawker-centre', 'Anchorvale Village Hawker Centre', '339 Anchorvale Road', 'North-East', 'Sengkang', 1.39710, 103.88700, 'manual'),
  ('chinatown-complex-food-centre', 'Chinatown Complex Food Centre', '335 Smith Street, Singapore 050335', 'Central', 'Chinatown', 1.28240, 103.84330, 'manual'),
  ('ci-yuan-hawker-centre', 'Ci Yuan Hawker Centre', '51 Hougang Avenue 9, Singapore 538776', 'North-East', 'Buangkok', 1.37590, 103.88100, 'manual'),
  ('woodleigh-village-hawker-centre', 'Woodleigh Village Hawker Centre', '11 Bidadari Park Drive', 'North-East', 'Woodleigh', 1.33880, 103.87060, 'manual'),
  ('one-punggol-hawker-centre', 'One Punggol Hawker Centre', '1 Punggol Drive', 'North-East', 'Punggol', 1.40940, 103.90550, 'manual'),
  ('buangkok-hawker-centre', 'Buangkok Hawker Centre', '70 Compassvale Bow', 'North-East', 'Buangkok', 1.38290, 103.89310, 'manual'),
  ('newton-food-centre', 'Newton Food Centre', '500 Clemenceau Avenue North, Singapore 229495', 'Central', 'Newton', 1.31283, 103.83919, 'manual'),
  ('bukit-timah-market-food-centre', 'Bukit Timah Market & Food Centre', '51 Upper Bukit Timah Road, Singapore 588215', 'Central', 'Beauty World', 1.34250, 103.77650, 'manual'),
  ('market-street-hawker-centre', 'Market Street Hawker Centre', '88 Market Street, CapitaSpring, Singapore 048948', 'Central', 'Telok Ayer', 1.28460, 103.85030, 'manual'),
  ('jurong-west-hawker-centre', 'Jurong West Hawker Centre', null, 'West', 'Pioneer', null, null, 'manual'),
  ('maxwell-food-centre', 'Maxwell Food Centre', '1 Kadayanallur Street, Singapore 069184', 'Central', 'Maxwell', 1.28030, 103.84470, 'manual'),
  ('pasir-ris-central-hawker-centre', 'Pasir Ris Central Hawker Centre', '110 Pasir Ris Central, Singapore 519641', 'East', 'Pasir Ris', 1.37260, 103.95180, 'manual'),
  ('circuit-road-hawker-centre', 'Circuit Road Hawker Centre', '79A Circuit Road', 'Central', 'Mattar', 1.32390, 103.88630, 'manual'),
  ('kovan-hawker-centre', 'Kovan 209 Market & Food Centre', '209 Hougang Street 21, Singapore 530209', 'North-East', 'Kovan', 1.35890, 103.88420, 'manual'),
  ('clementi-448-market-food-centre', 'Clementi 448 Market & Food Centre', '448 Clementi Avenue 3, Singapore 120448', 'West', 'Clementi', 1.31350, 103.76460, 'manual'),
  ('kampung-admiralty-hawker-centre', 'Kampung Admiralty Hawker Centre', '676 Woodlands Drive 71, Singapore 730676', 'North', 'Admiralty', 1.43950, 103.80090, 'manual')
on conflict (id) do update set
  name = excluded.name, region = excluded.region, nearest_mrt = excluded.nearest_mrt,
  -- Fill-if-missing: never overwrite a geocoded/curated address or pin.
  address = coalesce(hawker_centres.address, excluded.address),
  lat = coalesce(hawker_centres.lat, excluded.lat),
  lng = coalesce(hawker_centres.lng, excluded.lng),
  updated_at = now();

-- Turn the hawker finder on (feature flag: FLAG_COLUMN.hawkerFinder).
update public.platform_settings set hawker_finder_enabled = true;
