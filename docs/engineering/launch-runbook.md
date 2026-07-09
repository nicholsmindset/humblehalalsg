# Production launch runbook

This runbook is for taking `master` live on `www.humblehalal.com`.

Order matters: database first, then environment, then webhooks, then verification, then paid feature flags.

## 1. Database migrations

Apply every migration in `supabase/migrations/*.sql`, currently through:

- `0048_halal_passport.sql`
- `0053_feature_flags.sql`

Preferred path:

```bash
supabase link --project-ref vzlcplizpkmvjspmqwns
supabase db push
```

Fallback when Supabase CLI access is unavailable:

1. Open `supabase/_ALL_MIGRATIONS.sql`.
2. Paste the full contents into Supabase SQL Editor.
3. Run it from the top.

The combined file is intentionally re-runnable for launch recovery:

- `CREATE POLICY` statements are guarded with `DROP POLICY IF EXISTS`.
- pre-Clerk auth policies are rewritten to `auth.jwt() ->> 'sub'`.
- historical analytics rows do not block CHECK constraints.

Post-migration verification:

```sql
select
  exists (select 1 from information_schema.tables where table_schema='public' and table_name='business_feature_overrides') as feature_flags_ok,
  exists (select 1 from information_schema.tables where table_schema='public' and table_name='passport_points') as passport_ok,
  exists (select 1 from information_schema.tables where table_schema='public' and table_name='halal_verdicts') as verdicts_ok,
  exists (select 1 from information_schema.tables where table_schema='public' and table_name='lead_routes') as lead_routes_ok,
  exists (select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='email') as profiles_email_ok,
  exists (select 1 from pg_constraint where conname='analytics_events_event_type_check') as analytics_check_ok;
```

All values should be `true`.

Also verify Clerk identity storage:

```sql
select data_type
from information_schema.columns
where table_schema='public'
  and table_name='profiles'
  and column_name='id';
```

Expected: `text`.

## 2. Admin access

Clerk owns auth, so `profiles.id` is the Clerk user id, not `auth.users.id`.

Set the launch admin by matching the profile email:

```sql
update public.profiles
set role = 'admin'
where lower(email) = lower('YOUR_ADMIN_EMAIL');
```

Sign out and back in after updating the role.

## 3. Real data seeding

Do not use `/api/admin/seed-demo` or `/api/admin/seed-directory`; both routes are retired and return `410`.

Use the real dataset/import path:

```bash
npm run geocode:listings
node --env-file=.env.local scripts/seed-spreadsheet.mjs
npm run seo:counts
```

Commit the updated generated SEO count file if it changes.

Before launch, remove old mock/test events from production if any remain:

```bash
DRY=1 node scripts/purge-mock-events.mjs
node scripts/purge-mock-events.mjs
```

## 4. Production environment

Required production env groups:

- Site: `NEXT_PUBLIC_SITE_URL`
- Clerk: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SIGNING_SECRET`
- Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- Cron: `CRON_SECRET`
- Email: `RESEND_API_KEY`, `EMAIL_FROM`, `CONTACT_INBOX`
- Stripe: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, price IDs for enabled paid plans
- LiteAPI: `LITEAPI_ENV`, matching `LITEAPI_PROD_KEY` or `LITEAPI_SAND_KEY`, `LITEAPI_WEBHOOK_SECRET`

LiteAPI is fail-closed by environment: `LITEAPI_ENV=prod` requires `LITEAPI_PROD_KEY`; sandbox mode requires `LITEAPI_SAND_KEY`. Do not rely on cross-fallback.

## 5. Webhooks

Configure Clerk:

- Endpoint: `https://www.humblehalal.com/api/webhooks/clerk`
- Events: `user.created`, `user.updated`, `user.deleted`

Configure Stripe:

- Endpoint: `https://www.humblehalal.com/api/webhooks/stripe`
- Events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `charge.refunded`, `account.updated`

The Stripe webhook fails closed in production if the Supabase service-role admin client is unavailable. A `503` means fix env before retrying events.

Configure LiteAPI:

- Endpoint: `https://www.humblehalal.com/api/travel/webhook`
- Secret: `LITEAPI_WEBHOOK_SECRET`
- Set `LITEAPI_WEBHOOK_SIGNATURE_HEADER` if LiteAPI gives a non-standard signature header name.

## 6. Feature flags

Paid features default off. Keep these off until each flow is verified:

- `PAID_TICKETS_ENABLED`
- `PAID_ADS_ENABLED`
- `PAID_PLANS_ENABLED`
- `PAID_HOTELS_ENABLED`
- `PAID_FLIGHTS_ENABLED`
- `PAID_LEADS_ENABLED`
- `PAYNOW_ENABLED`

Other major flags:

- `CERT_VAULT_ENABLED`
- `SEMANTIC_SEARCH_ENABLED`
- `AI_CONCIERGE_ENABLED`
- `HALAL_VERDICTS_ENABLED`
- `LEAD_ROUTING_ENABLED`
- `PASSPORT_ENABLED`
- `NEXT_PUBLIC_PRELAUNCH=0` hides the prelaunch banner.

Admin DB overrides in `platform_settings` can override env fallback values.

## 7. Verification

Local preflight:

```bash
npm run typecheck
npm run lint
npm test
npm run build
npx playwright test --project=chromium
npx playwright test --project=mobile-320 --project=mobile-390 --project=tablet-768
```

Production smoke:

```bash
E2E_BASE_URL=https://www.humblehalal.com npx playwright test --project=chromium
E2E_BASE_URL=https://www.humblehalal.com npx playwright test --project=mobile-390
```

Expected local skips are tests that require seeded Supabase or LiteAPI keys when those keys are absent.

## 8. Paid-flow checks before enabling flags

Tickets:

1. Create or use a published paid event with organiser Connect `payouts_enabled=true`.
2. Enable `PAID_TICKETS_ENABLED`.
3. Buy a ticket through Stripe Checkout.
4. Confirm webhook creates `orders` and `tickets`.
5. Check in the ticket once; a second scan should fail.
6. Refund through owner/admin tooling.
7. Confirm order/tickets are refunded and `events.taken` is decremented.

Hotels and flights:

1. Confirm `LITEAPI_ENV` and key match.
2. Keep paid flags off until one sandbox prebook/payment/book flow is verified.
3. For production, enable only after LiteAPI production booking access is confirmed.

Plans/leads/ads:

1. Confirm Stripe price IDs are production price IDs.
2. Complete one checkout.
3. Confirm webhook writes the subscription/order/campaign row.
4. Confirm billing portal works for the owner.

## 9. Deploy

Vercel production is manually promoted from this repo:

```bash
npm run deploy:prod
```

The deploy script uses clean `origin/master` in a temporary worktree. Commit and push launch changes before running it.

After deploy:

```bash
curl -I https://www.humblehalal.com
curl -s https://www.humblehalal.com/sitemap.xml | head
curl -s https://www.humblehalal.com/robots.txt | head
```

## Guardrails

- MUIS status is deep-linked and dated; the app is not a certifier.
- Donation totals, ratings, analytics, and ad metrics come from real rows only.
- Paid routes always re-check server flags.
- Cron routes must stay `CRON_SECRET` guarded.
