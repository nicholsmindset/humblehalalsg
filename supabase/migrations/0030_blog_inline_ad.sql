-- 0030_blog_inline_ad.sql — add the in-article blog placement to the ad rate card.
-- Matches the ad_placements shape from 0023_ads.sql. Idempotent.
-- The <SponsoredSlot placement="blog_inline"> units on the blog index, category
-- pages and post bodies render nothing until a campaign is booked against this key.

insert into ad_placements (key, label, monthly_rate_cents, inventory_cap, sort) values
  ('blog_inline', 'Blog In-Article', 12000, 4, 6)
on conflict (key) do nothing;
