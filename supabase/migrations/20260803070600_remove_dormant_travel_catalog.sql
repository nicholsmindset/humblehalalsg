-- Keep the hotel/travel vertical dormant for launch, including back-office
-- catalog surfaces. The application implementation remains available for a
-- later re-launch, but no placement or category can be activated accidentally.

update public.ad_placements
set active = false,
    fill_mode = 'off',
    adsense_slot = null
where key = 'travel_promo';

delete from public.ad_placements p
where p.key = 'travel_promo'
  and not exists (
    select 1 from public.ad_campaigns c where c.placement_key = p.key
  );

delete from public.directory_categories where id = 'travel';
