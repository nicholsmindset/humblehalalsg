# Production Readiness Audit — 2026-07-07

Scope: full public site, events, business listings, travel/hotels/flights, Ask AI, user dashboard, business dashboard, admin dashboard, payments, webhooks, cron jobs, migrations, and production environment readiness.

## Executive Summary

The public site is close to launch-ready after the migration work and the P1 backend fixes made in this branch. Desktop and mobile smoke tests pass locally and against production. Admin and paid flows still need manual authenticated checks before launch because they require real Clerk/admin/owner sessions and live Stripe/LiteAPI state.

At audit time, launch should not happen directly from the then-current live production state because required fixes were still local. The go-live path is: commit/push these changes first, then deploy `origin/master` with `npm run deploy:prod`.

## Verified Passing

- Supabase combined migration was applied and verified by SQL checks:
  - feature flags table present
  - passport tables present
  - halal verdicts present
  - lead routing tables present
  - `profiles.email` present
  - analytics check constraint repaired
  - `profiles.id` is `text`
- TypeScript: `npm run typecheck` passed.
- Unit tests: `npm test` passed, 14 files / 124 tests.
- Lint: `npm run lint` passed with 0 errors and 106 existing warnings.
- Production build: `npm run build` passed, 419 static pages generated.
- Local built app desktop Playwright: 15 passed, 3 intentional key/data skips.
- Local built app mobile/tablet Playwright: 43 passed, 2 intentional axe duplicate-project skips.
- Production desktop Playwright: 15 passed, 3 intentional key/data skips.
- Production mobile/tablet Playwright: 43 passed, 2 intentional axe duplicate-project skips.

## Fixes Applied Locally

- LiteAPI environment split is strict: production uses `LITEAPI_PROD_KEY`; sandbox uses `LITEAPI_SAND_KEY`; no cross-fallback.
- Hotel and flight booking pages now derive LiteAPI payment mode from the same helper as the server.
- Stripe webhook now fails closed in production when the service-role DB client is missing.
- Manual ticket refunds now reverse ticket capacity immediately and guard against non-confirmed orders.
- Owner dashboard guest state no longer calls owner-only Supabase RPCs.
- Approval-gated event join requests now reject approval when the event is already full.
- Launch runbook updated for the current migration state and go-live commands.
- Combined SQL migration file patched for Supabase SQL Editor reruns and existing live policies/functions.

## Launch Blockers

### P1 — Commit/Deploy Required

`scripts/deploy-prod.sh` deploys clean `origin/master`, not the dirty local worktree. Do not run production go-live until these files are committed and pushed:

- `lib/liteapi.ts`
- `app/travel/booking/page.tsx`
- `app/travel/flights/booking/page.tsx`
- `app/api/webhooks/stripe/route.ts`
- `app/api/refunds/route.ts`
- `app/api/events/[id]/requests/route.ts`
- `components/owner/insights.tsx`
- `components/owner/ads-tab.tsx`
- `docs/engineering/launch-runbook.md`
- `supabase/_ALL_MIGRATIONS.sql`

### P1 — Authenticated Production Smoke Still Required

Automated headless production checks cannot validate Clerk-hosted admin login. `/admin` and `/admin/analytics` correctly redirect away for anonymous users, but Playwright receives a Cloudflare 403 on the hosted Clerk sign-in domain. Before launch, manually verify in a normal browser:

- Admin login works.
- `/admin` opens only for `profiles.role = admin`.
- `/admin/analytics` opens only for admin.
- Non-admin account is blocked.
- Owner account can open `/owner`, edit listing, see events, and manage billing.
- Normal user can open `/dashboard`, tickets, saves, reviews, and settings.

### P1 — Capacity Enforcement Needs Database Hardening

The app prechecks event capacity before RSVP/checkout and now before approving join requests. However, the SQL helper `increment_event_taken` only increments; it does not enforce `taken + qty <= capacity` inside the database. Under normal traffic this is fine, but concurrent submissions can still oversell.

Recommended fix before serious paid ticket volume:

- Add a guarded RPC such as `increment_event_taken_if_available(p_event_id text, p_qty int)` that updates only when `capacity = 0 OR taken + p_qty <= capacity`.
- Use it in RSVP, comp tickets, paid-ticket webhook fulfillment, and join-request approval.
- Return 409 when the RPC cannot reserve capacity.

### P1 — Production Environment Gaps

Critical envs exist for Clerk, Supabase, Stripe, LiteAPI, Resend, and cron. Missing or not shown in production env list:

- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`: rate limits are per-instance without this.
- `AI_GATEWAY_API_KEY`: Ask AI falls back to deterministic search unless Vercel OIDC is intentionally used.
- `NEXT_PUBLIC_PRELAUNCH=0`: prelaunch banner remains visible unless set to exactly `0`.
- `STRIPE_PRICE_VERIFIED_FOUNDING_Y`: founding offer button exists but cannot complete without this.
- `STRIPE_PRICE_LEADS_M` / `STRIPE_PRICE_LEADS_FOUNDING_M`: keep `PAID_LEADS_ENABLED` off until configured.
- `PAYNOW_ENABLED`: PayNow will stay off.
- `NEXT_PUBLIC_ADSENSE_CLIENT`: AdSense stays off, direct ads still work.

## Area Audit

### UX/UI

Status: mostly ready.

Passed mobile/tablet guard routes:

- Home
- Explore
- Explore filter sheet
- Travel stays
- Flights
- Flights date picker
- Events
- Blog post
- Tools hub
- Inheritance table
- Prayer times
- Login
- Pricing
- Is-halal brand page

Manual checks still needed:

- Admin dashboard at desktop and mobile widths after real login.
- Owner dashboard with a real owner account and at least one claimed business.
- User dashboard with real tickets/saves/reviews.
- Stripe/LiteAPI payment-return pages after real sandbox/live flows.

### Business Listings

Status: launch-ready with manual owner/admin smoke required.

Good:

- Public explore and business detail render in production.
- Owner listing edit route checks authenticated ownership before using service role.
- Owner photo upload validates auth, ownership, file type, and size.
- Admin listing management is admin-gated.
- Claim/add-listing public pages render cleanly.

Risks:

- Business dashboard guest mode is a public acquisition surface, but production currently shows a failed owner analytics RPC until local guard fix deploys.
- Admin business feature overrides read some state directly via Supabase browser client; admin page is server-gated, but still verify this tab after admin login.

### Events

Status: mostly ready, with capacity hardening recommended.

Good:

- Events listing renders in production.
- Event owner/admin APIs consistently check organiser/admin permissions.
- Promo codes and ref-code routes use shared event-manager authorization.
- Check-in route protects against non-owner scans and reused/refunded/cancelled tickets.
- Refund route now reverses capacity and tickets.

Risks:

- Database capacity reservation is not fully race-safe.
- Event cancellation still marks refunded after `stripe.refunds.create`; if a refund webhook later checks status before reversing capacity, cancelled-event stats can drift. Lower launch risk because the event is cancelled, but should be cleaned up for reporting consistency.
- Need real event flow smoke: create event, admin approve, RSVP, ticket email, check-in, cancel/refund.

### Travel, Hotels, Flights

Status: code paths are good, operational smoke required.

Good:

- Public travel, hotel search, flight search, city hubs, and Umrah hub pass smoke.
- LiteAPI prod/sandbox split fixed locally.
- Booking endpoints are feature-flagged and rate-limited.
- Booking/cancel/amend flows require signed-in traveller ownership for stored trips.
- LiteAPI webhook fails closed in production when secret is missing.

Risks:

- Hotel/flight booking ledger writes are best-effort after provider confirmation. If Supabase fails after LiteAPI confirms, local dashboard/revenue rows require reconciliation.
- Key-dependent E2E tests are skipped unless LiteAPI env is present locally/CI.
- Need one real LiteAPI sandbox booking chain before flipping prod traffic.

### Ask AI

Status: ready with env decision.

Good:

- Public Ask AI endpoints are rate-limited.
- Responses are grounded in directory/hotel candidates and instructed not to claim halal certification beyond stored facts.
- No-AI-key fallback works.

Risks:

- Production env list does not show `AI_GATEWAY_API_KEY`. Confirm whether Vercel OIDC is intentionally supplying AI Gateway access. If not, Ask AI will be fallback-only.
- Without Upstash, public AI rate limiting is per serverless instance.

### User Dashboard

Status: public shell works; authenticated data smoke required.

Good:

- Anonymous `/dashboard` renders a guest state.
- API routes for tickets, settings, follows, reviews, passport, and referrals require auth.

Manual checks:

- Sign in as normal user.
- Save/unsave business.
- View tickets after RSVP/paid ticket.
- Resend ticket.
- Update profile/settings.
- View passport if flag enabled.

### Business Dashboard

Status: fixed locally; manual owner smoke required.

Good:

- Owner listing APIs enforce ownership.
- Owner cert vault is flag + plan gated.
- Owner leads, ads, payouts, offers, review replies are auth/owner guarded.
- Guest RPC noise fixed locally.

Manual checks:

- Sign in as owner.
- Claimed business appears.
- Edit listing and see public page revalidated.
- Upload photo.
- Submit cert if `CERT_VAULT_ENABLED`.
- Create sponsored campaign if paid ads are enabled.
- Open Connect onboarding/billing portal.

### Admin Dashboard

Status: backend gating is good; manual tab smoke required.

Good:

- `/admin` and `/admin/analytics` are server-gated through profile role.
- `/api/admin/*` routes use `requireAdmin`.
- Retired seed endpoints are disabled with 410.
- Admin revenue, listings, imports, users, catalog, campaigns, verification, travel vouchers, audit log are gated.

Manual checks:

- Open each nav item after admin login.
- Approve/reject listing.
- Claim ownership.
- Verify halal status.
- Approve/reject event.
- Update user role.
- Toggle feature flag.
- Review travel revenue/vouchers.
- Review audit log.

### Payments, Webhooks, Cron

Status: mostly ready after local fixes.

Good:

- Stripe webhook is signed and now fails closed if DB is missing in production.
- Clerk webhook is signed and syncs profiles.
- LiteAPI webhook is signed/HMAC with bearer fallback and fails closed in production.
- Cron routes use `authorizeCron` and `CRON_SECRET` is present in production.
- Paid flow flags are server-side.

Risks:

- Need Stripe CLI/live webhook replay test for:
  - checkout session completed for ticket
  - charge refunded
  - subscription created/updated/deleted
  - account updated
- Need verify Stripe Connect onboarding and payouts before enabling paid tickets broadly.
- Event payout cron should be manually invoked once with `CRON_SECRET` after deploying current fixes.

## Go-Live Plan

1. Commit and push current local fixes.
2. Deploy Supabase Edge Functions:
   - `npm run deploy:functions`
3. Confirm production env:
   - set `NEXT_PUBLIC_PRELAUNCH=0`
   - add Upstash Redis envs
   - decide AI Gateway env
   - keep unready paid flags off
4. Deploy production:
   - `npm run deploy:prod`
5. Run production automated smoke:
   - `E2E_BASE_URL=https://www.humblehalal.com npx playwright test --project=chromium`
   - `E2E_BASE_URL=https://www.humblehalal.com npx playwright test --project=mobile-320 --project=mobile-390 --project=tablet-768`
6. Run manual authenticated smoke:
   - admin
   - owner
   - normal user
7. Run paid-flow smoke in controlled mode:
   - Stripe test checkout/webhook
   - LiteAPI sandbox hotel/flight booking
   - ticket RSVP/check-in/refund
8. Only after the above:
   - flip payment flags one at a time from Admin → Monetization
   - monitor Stripe webhooks, Vercel logs, Supabase logs, and email delivery

## Recommended Next Fixes

1. Add guarded capacity RPC and use it everywhere capacity is reserved.
2. Make event cancellation refund/capacity handling consistent with manual refund route.
3. Add authenticated Playwright fixtures for admin/owner/user smoke using Clerk test users.
4. Add a travel booking reconciliation job/report for LiteAPI bookings missing local DB rows.
5. Add Upstash Redis before launch traffic.
6. Reduce React 19 lint warnings after launch; they do not block current build.
