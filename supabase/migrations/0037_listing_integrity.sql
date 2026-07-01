-- 0037_listing_integrity — two integrity fixes found in the listing-lifecycle audit.

-- 1. Let an owner SELECT their OWN listings regardless of status. Public read is
--    published-only (0029); the "own business" policy is owner_id-only. This adds
--    an explicit owner-scoped read covering owner_id OR claimed_by, so a claimed
--    or non-published listing is visible to its owner in the dashboard. Uses the
--    Clerk id from the JWT (post-0031), not auth.uid().
drop policy if exists "owner sees own" on public.businesses;
create policy "owner sees own" on public.businesses
  for select using (
    owner_id = (auth.jwt() ->> 'sub') or claimed_by = (auth.jwt() ->> 'sub')
  );

-- 2. Community-confirmation count. lib/directory.ts rowToListing reads
--    businesses.confirm_count (was missing → always 0). Additive + nullable-safe.
alter table public.businesses add column if not exists confirm_count int not null default 0;
