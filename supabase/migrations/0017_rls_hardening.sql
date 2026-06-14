-- Humble Halal — RLS hardening (security audit H1/H2).
-- Three tables were created without row level security and never enabled in a
-- later migration. In Supabase a table with RLS OFF is fully readable/writable
-- through the public anon key (NEXT_PUBLIC_SUPABASE_ANON_KEY ships to the
-- browser), so this closes:
--   * email_log     — recipient email addresses (PII / PDPA exposure).
--   * webhook_events— Stripe idempotency ledger (anon could read processed event
--                     ids, or INSERT rows to poison idempotency → drop a real
--                     webhook as a "duplicate").
--   * import_runs   — operational import provenance/metadata.
-- All three are written exclusively via the service-role client (bypasses RLS),
-- so enabling RLS with admin-only SELECT and NO insert/update/delete policy
-- keeps writes working while making anon access impossible. Run after 0016.
-- Idempotent. Uses the shared public.is_admin() helper (0010).

alter table if exists public.email_log      enable row level security;
alter table if exists public.webhook_events enable row level security;
alter table if exists public.import_runs    enable row level security;

drop policy if exists "email_log admin read" on public.email_log;
create policy "email_log admin read" on public.email_log
  for select to authenticated using ( public.is_admin() );

drop policy if exists "webhook_events admin read" on public.webhook_events;
create policy "webhook_events admin read" on public.webhook_events
  for select to authenticated using ( public.is_admin() );

drop policy if exists "import_runs admin read" on public.import_runs;
create policy "import_runs admin read" on public.import_runs
  for select to authenticated using ( public.is_admin() );

-- No INSERT/UPDATE/DELETE policies by design: every writer uses the service-role
-- client, which bypasses RLS. Anon/authenticated therefore cannot write.

-- ── Atomic ticket-capacity counter (security audit M2) ──────────────────────
-- The Stripe webhook previously did read-then-write on events.taken, which loses
-- updates when two ticket purchases settle concurrently (both read N, both write
-- N+qty). This increments in a single statement so the sold count stays accurate.
-- Records actual sales (no capacity clamp here — the buyer already paid; oversell
-- is prevented up-front at checkout). Service-role calls it; definer + pinned
-- search_path keep it safe.
create or replace function public.increment_event_taken(p_event_id text, p_qty int)
returns int
language sql
security definer
set search_path = public
as $$
  update public.events
     set taken = taken + greatest(p_qty, 0)
   where id = p_event_id
  returning taken;
$$;
