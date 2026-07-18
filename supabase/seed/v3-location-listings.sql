-- Humble Halal — location-listing seed TEMPLATE (v3).
-- Paste into the Supabase SQL editor AFTER filling in real, verified outlets.
--
-- WHY: each /halal-food/[location] page self-noindexes until it has >=3 published
-- businesses whose `area` matches the page's `match` token (AREA_INDEX_MIN=3 in
-- lib/seo-pages.ts). Seed >=3 verified halal outlets per location to make it rank.
--
-- TRUST RULE: only set halal_tier='muis' for outlets you have verified on the
-- MUIS HalalSG register. Use 'muslim-owned' in attributes for Muslim-owned spots,
-- 'declared'/'community' halal_tier for self-declared. NEVER guess a MUIS status.
--
-- REQUIRED per row: slug (unique), name, area (must equal the token below),
--   cat_id, status='published', halal_tier. Recommended: price_level, address,
--   attributes, website. lat/lng are filled by scripts/geocode-listings.mjs.
--
-- AREA TOKEN MAP (page  ->  area value to put in the `area` column):
--   /halal-food/ion-orchard          -> 'Orchard'
--   /halal-food/marina-bay-sands     -> 'Marina Bay'      (or 'Marina Square')
--   /halal-food/parkway-parade       -> 'Marine Parade'
--   /halal-food/raffles-city         -> 'City Hall'
--   /halal-food/star-vista           -> 'Buona Vista'     (or 'Holland Village')
--   /halal-food/city-hall            -> 'City Hall'
--   /halal-food/chinatown            -> 'Chinatown'
--   /halal-food/tanjong-pagar        -> 'Tanjong Pagar'
--   /halal-food/somerset             -> 'Somerset'        (or 'Orchard')
--   /halal-food/harbourfront         -> 'HarbourFront'
--   /halal-food/toa-payoh            -> 'Toa Payoh'
--   /halal-food/raffles-place        -> 'Raffles Place'
--   /halal-food/esplanade            -> 'City Hall'        (or 'Esplanade')
--   /halal-food/downtown-east        -> 'Pasir Ris'
--   /halal-food/great-world-city     -> 'Great World'
--   /halal-food/hillion-mall         -> 'Bukit Panjang'
--   /halal-food/junction-8           -> 'Bishan'
--   /halal-food/tiong-bahru-plaza    -> 'Tiong Bahru'
--   /halal-food/wisma-geylang-serai  -> 'Geylang Serai'
--   cat_id values: restaurants | cafes | groceries | bakery | ... (see lib/data.ts)
--   halal_tier values: muis | admin | community | declared | pending | reported
--
-- ─────────────────────────────────────────────────────────────────────────────
-- VERIFIED EXAMPLES (MUIS-certified chains with confirmed outlets at these malls;
-- re-verify the specific outlet + certificate before relying on it). Replace the
-- address/postal with the real unit; geocode fills lat/lng.
insert into public.businesses (slug, name, area, cat_id, status, halal_tier, attributes, price_level, website)
values
  ('poulet-ion-orchard',     'Poulet (ION Orchard)',   'Orchard',   'restaurants', 'published', 'muis', '{}',              '$$', 'https://www.poulet.com.sg'),
  ('poulet-raffles-city',    'Poulet (Raffles City)',  'City Hall', 'restaurants', 'published', 'muis', '{}',              '$$', 'https://www.poulet.com.sg'),
  ('soup-spoon-raffles-city','The Soup Spoon (Raffles City)','City Hall','cafes',   'published', 'muis', '{}',              '$',  'https://thesoupspoon.com')
on conflict (slug) do nothing;

-- ─────────────────────────────────────────────────────────────────────────────
-- TEMPLATE ROW — copy per verified outlet, one per line, >=3 per area token:
-- insert into public.businesses (slug, name, area, cat_id, status, halal_tier, attributes, price_level, address, postal, website, phone)
-- values ('<unique-slug>', '<Outlet Name>', '<Area token from map above>', 'restaurants',
--         'published', 'muis', '{"muslim-owned"}', '$$', '<address>', '<6-digit postal>',
--         '<https url or NULL>', '<phone or NULL>')
-- on conflict (slug) do nothing;

-- After importing, run:  node scripts/geocode-listings.mjs   (fills lat/lng)
--                        node scripts/gen-seo-counts.mjs      (refresh page counts)
