-- 0043_ads_adsense.sql — Phase 3: dual-source ad serving (direct sponsor + AdSense fill).
-- Extends the existing direct-sponsor system (0023_ads.sql). No rebuild:
--  • ad_placements gains per-slot serving config (size, fill mode, AdSense slot,
--    reserved height for CLS, lazy flag) so the admin controls each slot's behaviour.
--  • ad_campaigns gains a review gate (pending → approved) so a direct creative is
--    brand-safety reviewed before it can serve.
-- The public serving API (/api/ads/active) reads this config; the <AdSlot> component
-- renders direct → AdSense → nothing per fill_mode.

-- ── Placement serving config ──────────────────────────────────────────────────
alter table ad_placements
  add column if not exists page_type            text,           -- 'homepage'|'blog'|'directory'|'business'|'tools'|'travel'|'events'
  add column if not exists position_label       text,           -- human label shown in the admin
  add column if not exists size_format          text not null default 'in_feed'
    check (size_format in ('leaderboard','mobile_banner','rectangle','halfpage','in_article','in_feed')),
  add column if not exists fill_mode            text not null default 'direct_then_adsense'
    check (fill_mode in ('off','direct_only','adsense_only','direct_then_adsense')),
  add column if not exists adsense_slot         text,           -- AdSense data-ad-slot id (set post-approval)
  add column if not exists min_height_px        int  not null default 0,   -- reserved height, desktop (CLS guard)
  add column if not exists min_height_px_mobile int  not null default 0,   -- reserved height, mobile
  add column if not exists lazy                 boolean not null default true;

-- ── Direct-creative review gate ───────────────────────────────────────────────
alter table ad_campaigns
  add column if not exists review_status text not null default 'pending'
    check (review_status in ('pending','approved','rejected'));
-- Grandfather existing campaigns so nothing that was already serving goes dark.
update ad_campaigns set review_status = 'approved'
  where review_status = 'pending' and status in ('active','paused','ended');

-- ── Patch existing placements with sizes/modes ────────────────────────────────
update ad_placements set page_type='homepage', position_label='Below discover rail',
  size_format='in_feed',    fill_mode='direct_then_adsense', min_height_px=120, min_height_px_mobile=120 where key='homepage_hero';
update ad_placements set page_type='directory', position_label='In listing feed',
  size_format='in_feed',    fill_mode='direct_then_adsense', min_height_px=120, min_height_px_mobile=120 where key='directory_inline';
update ad_placements set page_type='directory', position_label='Category page',
  size_format='in_feed',    fill_mode='direct_then_adsense', min_height_px=120, min_height_px_mobile=120 where key='category_featured';
update ad_placements set page_type='events', position_label='Events strip',
  size_format='in_feed',    fill_mode='direct_only',         min_height_px=120, min_height_px_mobile=120 where key='event_featured';
update ad_placements set page_type='newsletter', position_label='Newsletter',
  size_format='in_feed',    fill_mode='direct_only',         min_height_px=0,   min_height_px_mobile=0   where key='newsletter';

-- ── New high-value slots (built now = active; future inventory = inactive) ─────
insert into ad_placements
  (key, label, position_label, page_type, size_format, fill_mode, adsense_slot,
   inventory_cap, min_height_px, min_height_px_mobile, monthly_rate_cents, sort, active) values
  -- Built now
  ('blog_article_top',   'Blog article — top',    'Under title, above body',  'blog',      'leaderboard', 'adsense_only',         null, 1, 90,  100, 0,     6,  true),
  ('directory_hub',      'Directory hub — inline','Between listings & guide', 'directory', 'leaderboard', 'direct_then_adsense',  null, 1, 90,  100, 20000, 7,  true),
  -- Future inventory: schema-ready, seeded inactive. Flip active=true + drop <AdSlot> in.
  ('directory_hub_side', 'Directory hub — sidebar','Sidebar, above related', 'directory', 'rectangle',   'adsense_only',         null, 1, 250, 0,   0,     8,  false),
  ('business_detail_mid','Business — mid',        'After contact buttons',    'business',  'rectangle',   'direct_only',          null, 1, 250, 250, 15000, 9,  false),
  ('tools_inline',       'Tools — inline',        'Between tool sections',    'tools',     'leaderboard', 'adsense_only',         null, 1, 90,  100, 0,     10, false),
  ('travel_promo',       'Travel — below promo',  'After travel promo band',  'travel',    'leaderboard', 'direct_only',          null, 1, 90,  100, 0,     11, false)
on conflict (key) do nothing;

-- Note: the public storage bucket `ad-creatives` (sponsor creative images) is created
-- out-of-band (dashboard or storage.buckets insert), mirroring `business-photos`.
-- See docs/runbooks for the exact step. RLS is unchanged: ad_placements is public-read;
-- all writes go through the service role (admin API) — no public write policy.
