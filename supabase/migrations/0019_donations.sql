-- 0019_donations.sql — Zakat / sadaqah donations for charity events.
-- Donations are charged on the platform (separate from ticket entry). Each paid
-- donation is recorded here; the running total is mirrored into events.display
-- (donationRaisedCents) by the Stripe webhook so the public detail page can show
-- an HONEST figure without exposing donor PII. Raw rows are admin-only.

create table if not exists donations (
  id uuid primary key default gen_random_uuid(),
  event_id text references events(id) on delete set null,
  amount_cents int not null check (amount_cents >= 0),
  currency text not null default 'sgd',
  donor_name text,
  donor_email text,
  anonymous boolean not null default true,
  stripe_payment_intent text unique,
  status text not null default 'paid' check (status in ('pending', 'paid', 'refunded')),
  created_at timestamptz not null default now()
);

create index if not exists donations_event_idx on donations (event_id);

alter table donations enable row level security;

-- No anon/authenticated access to raw donation rows (donor PII). The Stripe
-- webhook writes via the service role (which bypasses RLS); admins read via the
-- service-role admin client. Public totals come from events.display, not here.
drop policy if exists donations_admin_read on donations;
create policy donations_admin_read on donations
  for select using (public.is_admin());
