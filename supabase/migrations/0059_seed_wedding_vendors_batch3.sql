-- 0059 — Hub 2 vendor seeding, batch 3: videographers, photographers, planner,
-- kompang, henna, gubahan/hantaran florists. All names WEB-VERIFIED (July 2026)
-- against the vendors' own sites/directories before seeding.
--
-- ACCURACY POLICY (same as 0057/0058):
--   • halal_tier NULL everywhere — admin verifies before upgrading labels.
--   • attributes '{}' — ownership not asserted unless independently known.
--   • Websites included where verified; other contacts left for the
--     listing-enrichment pipeline + admin review.
-- Idempotent: ON CONFLICT (slug) DO NOTHING.

insert into businesses
  (slug, name, area, cat_id, subcategory_id, price_level, website, description, attributes, source, provenance, status)
values
  -- ── Photography / videography ────────────────────────────────────────────
  ('just-married-films', 'Just Married Films', 'Islandwide', 'weddings',
   'Malay Wedding Videography', '$$$', 'https://www.justmarriedfilms.com',
   'Malay-wedding videography studio covering the akad nikah, hantaran and bersanding with cinematic storytelling.',
   '{}', 'manual', '{"seed":"0059","note":"web-verified Jul 2026 — admin verify contacts/tier before upgrading labels"}', 'published'),

  ('eventhrall', 'Eventhrall', 'Islandwide', 'weddings',
   'Wedding Videography · Event Production', '$$$', 'https://eventhrall.com',
   'Event-production company with a dedicated Malay-wedding videography service — multi-camera coverage and live streaming.',
   '{}', 'manual', '{"seed":"0059","note":"web-verified Jul 2026 — admin verify contacts/tier before upgrading labels"}', 'published'),

  ('8-asthas', '8 Asthas', 'Islandwide', 'weddings',
   'Malay Wedding Photography', '$$$', 'https://8asthas.com',
   'Wedding photography studio with Malay-wedding packages spanning solemnisation and reception coverage.',
   '{}', 'manual', '{"seed":"0059","note":"web-verified Jul 2026 — admin verify contacts/tier before upgrading labels"}', 'published'),

  ('perfect-fit-photos', 'Perfect Fit Photos', 'Islandwide', 'weddings',
   'Malay Wedding Photography', '$$', 'https://perfectfitphotos.com',
   'Malay-wedding photography service covering actual-day moments including the kompang procession and bersanding.',
   '{}', 'manual', '{"seed":"0059","note":"web-verified Jul 2026 — admin verify contacts/tier before upgrading labels"}', 'published'),

  ('simplifai-studios', 'Simplifai Studios', 'Islandwide', 'weddings',
   'Wedding Photography · Videography', '$$$', 'https://simplifai.com',
   'Singapore photography and videography studio offering actual-day and overseas wedding shoots, including Malay weddings.',
   '{}', 'manual', '{"seed":"0059","note":"web-verified Jul 2026 — admin verify contacts/tier before upgrading labels"}', 'published'),

  -- ── Planning ─────────────────────────────────────────────────────────────
  ('alangkaar', 'Alangkaar', 'Islandwide', 'weddings',
   'Muslim & Malay Wedding Planner · Packages', '$$$', 'https://alangkaar.com.sg',
   'Wedding planner specialising in Malay and Indian-Muslim weddings — full packages with vendor and kompang coordination.',
   '{}', 'manual', '{"seed":"0059","note":"web-verified Jul 2026 — admin verify contacts/tier before upgrading labels"}', 'published'),

  -- ── Kompang / traditional performance ────────────────────────────────────
  ('akrab-services', 'AKRAB Services', 'Islandwide', 'weddings',
   'Kompang · Traditional Performance', '$$', null,
   'Kompang group performing the traditional drumming that announces the couple''s arrival at Malay-Muslim weddings.',
   '{}', 'manual', '{"seed":"0059","note":"web-verified Jul 2026 (kompang vendor) — admin verify contacts before upgrading labels"}', 'published'),

  -- ── Henna / inai ─────────────────────────────────────────────────────────
  ('the-henna-story', 'The Henna Story', 'Islandwide', 'weddings',
   'Bridal Henna · Inai', '$$', null,
   'Singaporean henna and lifestyle brand (est. 2016) offering artisanal bridal henna (inai) for weddings and tunang.',
   '{}', 'manual', '{"seed":"0059","note":"web-verified Jul 2026 — admin verify contacts before upgrading labels"}', 'published'),

  -- ── Gubahan / hantaran / florists ────────────────────────────────────────
  ('jw-florist', 'JW Florist', 'Islandwide', 'weddings',
   'Gubahan Hantaran · Wedding Deco', '$$', 'https://jwflorist.com.sg',
   'Florist offering custom gubahan hantaran — decorated wedding gift trays and dais florals for Malay weddings.',
   '{}', 'manual', '{"seed":"0059","note":"web-verified Jul 2026 — admin verify contacts/tier before upgrading labels"}', 'published'),

  ('theory-of-two-studio', 'Theory of Two Studio', 'Islandwide', 'weddings',
   'Dulang Hantaran · Bunga Rampai · Favours', '$$', 'https://www.theoryoftwostudio.com',
   'Studio crafting dulang hantaran gift trays, bunga rampai and wedding favours for Malay solemnisations and receptions.',
   '{}', 'manual', '{"seed":"0059","note":"web-verified Jul 2026 — admin verify contacts/tier before upgrading labels"}', 'published'),

  ('toko-warisan', 'Toko Warisan', 'Kampong Glam', 'weddings',
   'Hantaran Materials · Wedding Supplies', '$$', null,
   'Wedding-supplies shop in the Arab Street / Kampong Glam area stocking hantaran, gubahan materials and Malay wedding essentials.',
   '{}', 'manual', '{"seed":"0059","note":"web-verified Jul 2026 (Arab St wedding shop) — admin verify contacts before upgrading labels"}', 'published')
on conflict (slug) do nothing;
