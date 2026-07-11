-- 0063 — One order per Stripe payment.
--
-- Stripe documents that a single occurrence can emit two distinct Event
-- objects; the webhook's per-EVENT-id idempotency claim can't dedupe those, so
-- a duplicated checkout.session.completed would insert a second order for the
-- same payment_intent, double-issue tickets and double-count capacity. The
-- partial unique index makes the second insert fail 23505, which the webhook
-- treats as "already fulfilled" (checklist item paidTickets-01).
-- Partial: comped orders have NULL payment intents and may repeat freely.

create unique index if not exists orders_stripe_payment_intent_uniq
  on public.orders (stripe_payment_intent)
  where stripe_payment_intent is not null;
