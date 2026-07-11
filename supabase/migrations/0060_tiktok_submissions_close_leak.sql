-- Humble Halal — 0060: close the tiktok_submissions anon column leak (audit tiktokUgc-01).
--
-- The 0056 policy `"tiktok public read approved"` was `for select using (status
-- = 'approved')` with NO column restriction, so any anon/authenticated caller
-- could read EVERY column of an approved row via a direct API call — including
-- reviewed_by (the reviewing admin's Clerk id), raw (the submitter's Clerk id +
-- browser user-agent) and submitter_email. Same leak class as the halal_verdicts
-- audit-column leak that 0052 closed.
--
-- The app never reads this table as anon — the public routes
-- (/api/tiktok/videos, /api/tiktok/latest) use the service role, which bypasses
-- RLS and selects only safe columns (url, video_id, handle, caption). So anon
-- needs no direct access at all: drop the policy. The admin-read policy and
-- service-role writes/reads are unchanged.
--
-- Run after 0056. Idempotent.

drop policy if exists "tiktok public read approved" on public.tiktok_submissions;
