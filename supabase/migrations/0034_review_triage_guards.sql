-- Humble Halal — idempotency guards for the on-review-created Edge Function.
-- The function claims triaged_at atomically so a webhook retry never re-runs AI.
alter table public.reviews       add column if not exists triaged_at timestamptz;
alter table public.event_reviews add column if not exists triaged_at timestamptz;
