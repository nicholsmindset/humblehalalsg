-- Humble Halal — record the promo voucher applied to a hotel booking.
-- The voucher is applied at /rates/prebook (LiteAPI computes the discount and
-- returns a fresh payment intent); we store the code + discount on the booking row
-- so the ledger reconciles against LiteAPI's weekly payout report. Additive,
-- backwards-compatible (both nullable). Run after 0001–0026.

alter table hotel_bookings add column if not exists voucher_code text;
alter table hotel_bookings add column if not exists discount_amount numeric;
