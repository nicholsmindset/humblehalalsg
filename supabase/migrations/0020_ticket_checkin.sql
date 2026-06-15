-- 0020_ticket_checkin.sql — event check-in (QR scan) support.
-- A ticket flips 'valid' → 'used' when scanned at the door. We record WHEN and
-- WHO checked it in for the organiser's roster/audit. Re-scanning a 'used' (or
-- refunded/cancelled) ticket is rejected by the check-in API.

alter table tickets add column if not exists checked_in_at timestamptz;
alter table tickets add column if not exists checked_in_by uuid references auth.users(id) on delete set null;

create index if not exists tickets_event_status_idx on tickets (event_id, status);
