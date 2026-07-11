-- 0062 — Dispute/reversal payout states.
--
-- The separate-charges model means refunds and chargebacks hit the PLATFORM
-- balance; Stripe never auto-reverses an organiser transfer. The dispute and
-- refund paths therefore need three more payout_status states beyond 0016's
-- set:
--   held           — a dispute opened before the payout ran; cron must not pay
--   reversed       — the organiser transfer was clawed back (refund/dispute
--                    after payout)
--   reverse_failed — reversal was attempted but failed (organiser balance
--                    already drained) — needs manual follow-up
-- Code falls back to 'skipped' (also cron-safe) until this is pasted.

alter table public.orders drop constraint if exists orders_payout_status_check;
alter table public.orders add constraint orders_payout_status_check
  check (payout_status in ('none','pending','paid','skipped','failed','held','reversed','reverse_failed'));
