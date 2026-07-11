-- 0065 — Featured-Listing price alignment + partial-donation-refund tracking.
--
-- (a) streams-P1-1: "Featured Listing" is marketed at $49/mo and the anonymous
--     checkout (lib/ad-products, fixed earlier) charges $49 — but the SAME
--     product booked through the signed-in self-serve builder resolves to
--     ad_placements.directory_inline, still seeded at $89/mo (0023). Same
--     product, different price by auth state. Align to the marketed rate.
--     Guarded on the old value so an admin who deliberately re-priced later
--     isn't silently overwritten by a re-paste.
update public.ad_placements
   set monthly_rate_cents = 4900
 where key = 'directory_inline'
   and monthly_rate_cents = 8900;

-- (b) streams-P2-7: the public "raised" figure only reversed FULL donation
--     refunds; a partial refund left events.display.donationRaisedCents
--     overstated. Track the cumulative refunded amount per donation so the
--     webhook can decrement by the newly-refunded delta on every
--     charge.refunded (partial or full), exactly once.
alter table public.donations
  add column if not exists refunded_cents int not null default 0;
