-- 0058 — Hub 2 vendor seeding, batch 2: photographers, pelamin/deco,
-- mak andam, bridal cars. All names WEB-VERIFIED (July 2026) against the
-- vendors' own sites/directories before seeding.
--
-- ACCURACY POLICY (same as 0057):
--   • halal_tier NULL everywhere — admin verifies before upgrading labels.
--   • attributes '{}' — ownership not asserted unless independently known.
--   • Websites included where verified; other contacts left for the
--     listing-enrichment pipeline + admin review.
-- Idempotent: ON CONFLICT (slug) DO NOTHING.

insert into businesses
  (slug, name, area, cat_id, subcategory_id, price_level, website, description, attributes, source, provenance, status)
values
  -- ── Photography / videography ────────────────────────────────────────────
  ('our-momento', 'Our Momento', 'Islandwide', 'weddings',
   'Malay Wedding Photography · Videography', '$$$', 'https://ourmomento.sg',
   'Malay-wedding specialists documenting the nikah and sanding with a personalised, culturally fluent approach to photography and videography.',
   '{}', 'manual', '{"seed":"0058","note":"web-verified Jul 2026 — admin verify contacts/tier before upgrading labels"}', 'published'),

  ('studio-five-weddings', 'Studio Five Weddings', 'Islandwide', 'weddings',
   'Wedding Photography · Videography', '$$$', 'https://studiofiveweddings.com',
   'Wedding photography and videography studio with dedicated Malay-wedding packages covering up to a full day of nikah and sanding coverage.',
   '{}', 'manual', '{"seed":"0058","note":"web-verified Jul 2026 — admin verify contacts/tier before upgrading labels"}', 'published'),

  ('pixel-senseis', 'Pixel Senseis', 'Islandwide', 'weddings',
   'Malay Wedding Photography · Videography', '$$$', 'https://www.pixelsenseis.com',
   'Photo and video team with Malay-wedding packages tailored to modern couples — classic portraits, creative storytelling and drone coverage.',
   '{}', 'manual', '{"seed":"0058","note":"web-verified Jul 2026 — admin verify contacts/tier before upgrading labels"}', 'published'),

  ('colossal-weddings', 'Colossal Weddings', 'Islandwide', 'weddings',
   'Wedding Photography · Videography', '$$$', 'https://www.colossalweddings.com',
   'Singapore wedding photographers with a dedicated Malay-weddings portfolio spanning solemnisations and full majlis coverage.',
   '{}', 'manual', '{"seed":"0058","note":"web-verified Jul 2026 — admin verify contacts/tier before upgrading labels"}', 'published'),

  ('nafimages', 'Nafimages', 'Islandwide', 'weddings',
   'Actual-Day Wedding Photography', '$$$', 'https://nafimages.co',
   'Wedding photography team covering actual-day Malay weddings — nikah, sanding and family portraits.',
   '{}', 'manual', '{"seed":"0058","note":"web-verified Jul 2026 — admin verify contacts/tier before upgrading labels"}', 'published'),

  -- ── Pelamin / deco / styling ─────────────────────────────────────────────
  ('deameen-creation', 'D''Ameen Creation', 'Islandwide', 'weddings',
   'Pelamin · Mini Dais · Wedding Deco', '$$', 'http://deameencreation.com',
   'Pelamin and mini-dais specialist offering bridal-room styling and dais setups for home and venue solemnisations.',
   '{}', 'manual', '{"seed":"0058","note":"web-verified Jul 2026 — admin verify contacts/tier before upgrading labels"}', 'published'),

  ('merak-events', 'Merak Events', 'Islandwide', 'weddings',
   'Wedding Styling · Pelamin · Event Planning', '$$$', 'https://www.merakevents.com',
   'Wedding and event stylist-planner offering Malay wedding packages, pelamin styling and full event planning.',
   '{}', 'manual', '{"seed":"0058","note":"web-verified Jul 2026 — admin verify contacts/tier before upgrading labels"}', 'published'),

  ('style-it-simply', 'Style It Simply', 'Islandwide', 'weddings',
   'Mini Dais · Wedding Deco · Styling', '$$', 'https://styleitsimply.sg',
   'Event styling studio with mini-dais and wedding-reception decor collections for intimate solemnisations and receptions.',
   '{}', 'manual', '{"seed":"0058","note":"web-verified Jul 2026 — admin verify contacts/tier before upgrading labels"}', 'published'),

  ('mekar-wedding', 'Mekar', 'Islandwide', 'weddings',
   'Malay Wedding Packages · Pelamin · Planning', '$$$', 'https://mekar.com.sg',
   'Malay wedding planner offering full packages — pelamin in a range of colours and styles, catering coordination and day-of planning.',
   '{}', 'manual', '{"seed":"0058","note":"web-verified Jul 2026 — admin verify contacts/tier before upgrading labels"}', 'published'),

  -- ── Bridal / mak andam ───────────────────────────────────────────────────
  ('anggun-by-mastura', 'Anggun by Mastura', 'Novena', 'weddings',
   'Bridal Makeup · Mak Andam · Wedding House', '$$$', null,
   'Long-running andam-and-makeup house (est. 2001) offering bridal makeup, traditional mak andam services, decor and venue styling.',
   '{}', 'manual', '{"seed":"0058","note":"web-verified Jul 2026 (Stevens Rd flagship) — admin verify contacts/tier before upgrading labels"}', 'published'),

  -- ── Bridal cars ──────────────────────────────────────────────────────────
  ('bliss-wedding-cars', 'Bliss Wedding Cars', 'Islandwide', 'weddings',
   'Wedding Car Rental · Chauffeur', '$$$', 'https://www.blissweddingcars.sg',
   'Chauffeured bridal car rental — continental, luxury and vintage marques for wedding-day bookings. Confirm requirements (timing, decor, stops) directly.',
   '{}', 'manual', '{"seed":"0058","note":"web-verified Jul 2026 — admin verify contacts before upgrading labels"}', 'published'),

  ('the-wedding-car-hire-people', 'The Wedding Car Hire People', 'Islandwide', 'weddings',
   'Wedding Car Rental · Chauffeur', '$$', 'https://sg.theweddingcarhirepeople.com',
   'Chauffeur-driven wedding car hire covering bridal cars, bridesmaids'' cars and full wedding-party transport.',
   '{}', 'manual', '{"seed":"0058","note":"web-verified Jul 2026 — admin verify contacts before upgrading labels"}', 'published')
on conflict (slug) do nothing;
