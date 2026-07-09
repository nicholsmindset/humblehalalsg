-- 0057 — Hub 2 vendor seeding (SEO blueprint: "hand-onboard caterers + wedding
-- vendors; each = a cross-link and a future paying customer").
--
-- ACCURACY POLICY (matches lib/halal-status.ts):
--   • Only REAL, long-established Singapore businesses are seeded here.
--   • halal_tier is left NULL for every row — we NEVER assert MUIS
--     certification in seed data. Admin verifies each one (HalalSG lookup)
--     and upgrades the tier + cert number from the dashboard.
--   • attributes '{muslim-owned}' only where ownership is widely known.
--   • Contact/address fields are left for the listing-enrichment pipeline
--     (live) + admin review — never guessed.
--
-- Idempotent: ON CONFLICT (slug) DO NOTHING.

insert into businesses
  (slug, name, area, cat_id, subcategory_id, price_level, description, attributes, source, provenance, status)
values
  (
    'hjh-maimunah-catering',
    'Hjh Maimunah Catering',
    'Kampong Glam',
    'weddings',
    'Malay Wedding & Kenduri Catering',
    '$$',
    'Catering arm of the famous Hjh Maimunah nasi padang institution — kampung-style Malay spreads for weddings, kenduri and events. Verify current halal certification on MUIS HalalSG.',
    '{muslim-owned}',
    'manual',
    '{"seed":"0057","note":"blueprint Hub 2 vendor seeding — admin verify halal tier + contacts before upgrading labels"}',
    'published'
  ),
  (
    'rasel-catering',
    'Rasel Catering Singapore',
    'Islandwide',
    'restaurants',
    'Halal Catering · Corporate & Events',
    '$$',
    'Established Singapore caterer serving halal buffets, mini buffets and corporate spreads islandwide. Verify current halal certification on MUIS HalalSG.',
    '{}',
    'manual',
    '{"seed":"0057","note":"blueprint Hub 2 vendor seeding — admin verify halal tier + contacts before upgrading labels"}',
    'published'
  ),
  (
    'katong-catering',
    'Katong Catering',
    'Islandwide',
    'restaurants',
    'Halal Catering · Buffet',
    '$$',
    'Long-running halal caterer known for wedding and event buffets across Singapore. Verify current halal certification on MUIS HalalSG.',
    '{}',
    'manual',
    '{"seed":"0057","note":"blueprint Hub 2 vendor seeding — admin verify halal tier + contacts before upgrading labels"}',
    'published'
  ),
  (
    'pu3-restaurant-catering',
    'PU3 Restaurant & Catering',
    'Islandwide',
    'weddings',
    'Malay Catering · Restaurant',
    '$$',
    'Malay restaurant and caterer serving weddings, kenduri and corporate events with traditional spreads. Verify current halal certification on MUIS HalalSG.',
    '{muslim-owned}',
    'manual',
    '{"seed":"0057","note":"blueprint Hub 2 vendor seeding — admin verify halal tier + contacts before upgrading labels"}',
    'published'
  ),
  (
    'deli-moments',
    'Deli Moments',
    'Islandwide',
    'restaurants',
    'Halal Catering · Mini Buffet',
    '$$',
    'Halal caterer offering mini buffets, bento sets and event catering for homes and offices. Verify current halal certification on MUIS HalalSG.',
    '{}',
    'manual',
    '{"seed":"0057","note":"blueprint Hub 2 vendor seeding — admin verify halal tier + contacts before upgrading labels"}',
    'published'
  ),
  (
    'fatimah-mohsin-wedding-gallery',
    'Fatimah Mohsin The Wedding Gallery',
    'Geylang Serai',
    'weddings',
    'Bridal · Pelamin · Wedding Deco',
    '$$$',
    'One of Singapore''s best-known Malay wedding houses — bridal packages, pelamin and full wedding styling by the veteran mak andam Fatimah Mohsin.',
    '{muslim-owned}',
    'manual',
    '{"seed":"0057","note":"blueprint Hub 2 vendor seeding — admin verify contacts before upgrading labels"}',
    'published'
  ),
  (
    'comel-molek-wedding-service',
    'Comel & Molek Wedding Service',
    'Geylang Serai',
    'weddings',
    'Bridal · Mak Andam · Wedding Packages',
    '$$$',
    'Long-established Malay bridal house offering wedding packages, bridal outfits, mak andam services and pelamin.',
    '{muslim-owned}',
    'manual',
    '{"seed":"0057","note":"blueprint Hub 2 vendor seeding — admin verify contacts before upgrading labels"}',
    'published'
  ),
  (
    'the-landmark-restaurant',
    'The Landmark Restaurant',
    'Bugis',
    'weddings',
    'Halal Chinese Banquet · Wedding Venue',
    '$$$',
    'Halal Cantonese restaurant known for dim sum and wedding banquets in the Bugis area — a popular venue for halal Chinese-style receptions. Verify current halal certification on MUIS HalalSG.',
    '{}',
    'manual',
    '{"seed":"0057","note":"blueprint Hub 2 vendor seeding — admin verify halal tier + venue details before upgrading labels"}',
    'published'
  )
on conflict (slug) do nothing;
