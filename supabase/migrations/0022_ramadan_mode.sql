-- 0022_ramadan_mode.sql — admin-controlled Ramadan mode.
-- When ON, the public site surfaces the Ramadan affordance (iftar / open-late /
-- bazaars). Admins flip it for the season from the admin console; it is read
-- server-side and hydrated to the client so every visitor sees it consistently.
alter table platform_settings add column if not exists ramadan_mode_enabled boolean not null default false;
