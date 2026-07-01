-- 0039_ack_emails.sql — optional acknowledgement email on anonymous forms.
-- Suggest-a-business and Report-an-issue are anonymous today. Add an OPTIONAL
-- email so we can send a "thanks, we've received it" acknowledgement. Nullable —
-- existing rows and no-email submissions are unaffected.

alter table if exists public.suggestions add column if not exists email text;
alter table if exists public.reports     add column if not exists email text;
