-- Humble Halal — event-ticket payouts (separate charges + transfers).
-- We take a SEPARATE charge for the buyer on the platform (face + booking fee),
-- hold the funds, and a cron transfers the organiser's net (face value) to their
-- Connect account 24h after the event ends. These columns track that payout on
-- the existing orders table. Run after 0012. Idempotent.

alter table if exists public.orders
  add column if not exists connected_account_id text,            -- organiser's acct_… (destination)
  add column if not exists net_cents int,                        -- organiser's share to transfer (subtotal)
  add column if not exists payout_status text not null default 'none'
    check (payout_status in ('none','pending','paid','skipped','failed')),
  add column if not exists payout_due date,                      -- event end date + 1 day
  add column if not exists stripe_transfer_id text,
  add column if not exists buyer_name text,
  add column if not exists qty int;

-- cron scans for due, unpaid payouts
create index if not exists orders_payout_due_idx on public.orders (payout_status, payout_due)
  where payout_status = 'pending';
