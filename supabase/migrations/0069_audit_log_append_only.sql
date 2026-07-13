-- 0069: make public.audit_log append-only (tamper-evidence for SOC2/ISO-style
-- audit trails). Blocks UPDATE/DELETE/TRUNCATE for EVERYONE — including the
-- service_role — via triggers, so a compromised server key still can't rewrite
-- history. Retention pruning (if ever needed) must DROP the trigger first in a
-- deliberate maintenance migration.
--
-- Rollback:
--   drop trigger if exists audit_log_no_mutation on public.audit_log;
--   drop trigger if exists audit_log_no_truncate on public.audit_log;

create or replace function public.audit_log_block_mutation()
returns trigger language plpgsql as $$
begin
  raise exception 'audit_log is append-only';
end $$;

drop trigger if exists audit_log_no_mutation on public.audit_log;
create trigger audit_log_no_mutation
  before update or delete on public.audit_log
  for each row execute function public.audit_log_block_mutation();

drop trigger if exists audit_log_no_truncate on public.audit_log;
create trigger audit_log_no_truncate
  before truncate on public.audit_log
  for each statement execute function public.audit_log_block_mutation();

-- Belt-and-braces: no mutation grants for anon/authenticated either.
revoke update, delete, truncate on public.audit_log from anon, authenticated;
