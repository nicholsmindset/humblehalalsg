-- Humble Halal — flight-retry backstop via Supabase pg_cron (free-tier friendly).
--
-- WHY: time-sensitive flight bookings whose card was captured but whose LiteAPI
-- `book` call hard-failed are persisted as status='confirming' and must be
-- re-attempted quickly. Vercel Hobby crons run at most daily, which is too slow.
-- Instead we drive the EXISTING /api/cron/flight-retry handler from Supabase
-- pg_cron + pg_net every 10 minutes — no Vercel Pro, no logic rewrite. (The
-- inline retry in /api/travel/flights/book already resolves most transient
-- failures at booking time; this is the post-capture backstop.)
--
-- ONE-TIME SETUP (run separately in the SQL editor — DO NOT commit the secret):
--   select vault.create_secret('<YOUR_CRON_SECRET>', 'cron_secret');
-- (must equal the CRON_SECRET env var the Next.js app verifies via authorizeCron)
--
-- The Vercel daily flight-retry cron is removed from vercel.json in the same change.
-- Idempotent: safe to re-run.

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Replace any prior schedule with the same name.
do $$
begin
  perform cron.unschedule('flight-retry-10m');
exception when others then
  null; -- not scheduled yet
end $$;

select cron.schedule(
  'flight-retry-10m',
  '*/10 * * * *',
  $cron$
  select net.http_post(
    url     := 'https://www.humblehalal.com/api/cron/flight-retry',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'authorization', 'Bearer ' || (
        select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret'
      )
    ),
    body    := '{}'::jsonb
  );
  $cron$
);

-- Inspect runs:  select * from cron.job_run_details order by start_time desc limit 20;
