# Vercel paid plan task list

Last checked: 2026-07-08, Asia/Singapore.

This checklist turns the paid Vercel plan into an operating advantage for Humble Halal: safer releases, better observability, performance monitoring, clearer cost control, and faster debugging.

## Current verified state

- [x] Vercel project is linked: `nicholsmindset-gmailcoms-projects/humblehalalsg`.
- [x] Latest production alias is `https://www.humblehalal.com`.
- [x] Latest inspected production deployment is `READY`.
- [x] Project Node version in Vercel project list is `24.x`.
- [x] Production/Preview env variables exist for the main launch surface:
  - Site: `NEXT_PUBLIC_SITE_URL`, `SITE_URL`
  - Clerk: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SIGNING_SECRET`, sign-in/up URLs
  - Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
  - LiteAPI: `LITEAPI_ENV`, `LITEAPI_PROD_KEY`, `LITEAPI_SAND_KEY`, `LITEAPI_WEBHOOK_SECRET`
  - Stripe: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, plan price IDs
  - Paid flags: `PAID_ADS_ENABLED`, `PAID_FLIGHTS_ENABLED`, `PAID_PLANS_ENABLED`, `PAID_TICKETS_ENABLED`
  - Infra: `CRON_SECRET`, `EMAIL_FROM`, `NEXT_PUBLIC_GTM_ID`
- [x] Vercel cron jobs are declared in `vercel.json`.
- [x] Vercel Web Analytics and Speed Insights code hooks are installed in `app/layout.tsx`.

## P0: Do this first

- [x] Enable Vercel Web Analytics in the Vercel dashboard for `humblehalalsg`.
  - Owner: Robert
  - Verify: Vercel dashboard shows page views after a production visit. Data can take a few minutes to appear.

- [ ] Enable Vercel Speed Insights in the Vercel dashboard for `humblehalalsg`.
  - Owner: Robert
  - Verify: Vercel dashboard starts showing real-user Core Web Vitals after production traffic.

- [ ] Split Preview vs Production secrets where possible.
  - Current finding: every listed Vercel env var is scoped to both `Preview` and `Production`.
  - Risk: a preview deployment can talk to production Clerk/Supabase/Stripe/LiteAPI.
  - Target:
    - Production uses live Clerk, live Stripe, production Supabase, production LiteAPI only.
    - Preview uses Clerk development/test, Stripe test mode, sandbox LiteAPI, and either a staging Supabase project or strictly non-destructive flags.

- [ ] Confirm paid-plan feature availability in Vercel dashboard.
  - Check: Web Analytics, Speed Insights, Observability, Firewall/Security, team access, spend limits.
  - Record enabled features in this file under `Paid-plan feature register`.

- [ ] Add missing production env values if those features are intended to be live.
  - Email/newsletter: `RESEND_API_KEY`, `CONTACT_INBOX`, `BEEHIIV_API_KEY`, `BEEHIIV_PUBLICATION_ID`
  - AI: `AI_GATEWAY_API_KEY`, optional `AI_MODEL`, `AI_MODEL_FAST`
  - Rate limit/cache: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
  - Singapore maps/geocode: `ONEMAP_TOKEN`
  - Live hotels: `PAID_HOTELS_ENABLED`
  - Lead subscriptions: `PAID_LEADS_ENABLED`, `STRIPE_PRICE_LEADS_M`
  - Founding offers: `STRIPE_PRICE_VERIFIED_FOUNDING_Y`, `STRIPE_PRICE_LEADS_FOUNDING_M`
  - Only add values that match real production readiness; keep flags off otherwise.

## P1: Release safety

- [ ] Use preview deployments for every user-facing UI change before production.
  - Verify screenshots at desktop, mobile 390, and mobile 320.
  - Required pages: `/`, `/explore`, `/prayer-rooms`, `/ask`, `/tools`, `/pricing`, `/dashboard`, `/admin/analytics`.

- [ ] Define rollback procedure.
  - Fast rollback: use Vercel dashboard rollback to last known-good deployment.
  - Code rollback: revert commit, push, deploy.
  - Data rollback: never assume code rollback reverses Supabase changes.

- [ ] Add a release checklist to every production deploy.
  - `npm run typecheck`
  - `npm run build`
  - Targeted ESLint for touched files
  - Local production smoke
  - Production smoke after deploy

- [ ] Verify custom domains after every deploy.
  - `https://www.humblehalal.com`
  - `https://humblehalal.com`
  - Confirm both point to the same ready deployment.

## P2: Observability and debugging

- [ ] Create a weekly production health review.
  - Traffic: top pages, referrers, growth.
  - Performance: LCP, INP, CLS, slowest pages.
  - Errors: failed API routes, webhook failures, cron failures.
  - Conversions: newsletter signups, Ask AI queries, pricing clicks, checkout starts.

- [ ] Watch high-value routes.
  - `/`
  - `/explore`
  - `/prayer-rooms`
  - `/ask`
  - `/pricing`
  - `/dashboard`
  - `/admin/analytics`
  - `/api/subscribe`
  - `/api/webhooks/clerk`
  - `/api/webhooks/stripe`
  - `/api/travel/webhook`

- [ ] Add alert thresholds.
  - 5xx rate spikes.
  - Slow API duration on admin analytics and AI routes.
  - Stripe/Clerk webhook failures.
  - Cron route failures.
  - Sudden traffic/bandwidth spikes.

- [ ] Review existing first-party analytics against Vercel Analytics.
  - Vercel: traffic and performance truth.
  - Supabase `analytics_events`: business funnel truth.
  - GTM/GA4: marketing attribution.
  - Avoid duplicating PII across systems.

## P3: Cost and scale control

- [ ] Set Vercel spend/budget alerts.
  - Watch bandwidth, function duration, image optimization, edge requests, build minutes.

- [x] Review cache strategy.
  - Static SEO pages should stay cheap.
  - Dynamic admin/owner routes should be monitored for slow server work.
  - AI/search routes should be rate limited before promotion.
  - Added conservative response caching for high-repeat public endpoints:
    - `/api/ads/active`: 60s edge cache, 5m stale revalidate.
    - `/api/prayer-times`: 1h edge cache, 24h stale revalidate.
    - `/api/travel/hoteltypes`: 24h edge cache, 7d stale revalidate.
    - `/api/travel/loyalty`: 1h edge cache, 24h stale revalidate.
    - `/api/tools/prayer-times`: 1h private browser cache because query coordinates should not be shared through a public CDN cache.

- [ ] Review cron frequency now that the plan supports more serious operations.
  - Current `flight-retry` is daily in `vercel.json`.
  - Before live flights: decide whether to increase retry frequency and confirm plan limits.

- [x] Confirm image optimization strategy.
  - Large homepage/category/listing images affect bandwidth and LCP.
  - Use Speed Insights to identify pages where images are hurting LCP.
  - Current config constrains optimizer widths, uses a 31-day minimum TTL, and bypasses optimizer for Unsplash, LiteAPI hotel images, Supabase-hosted assets, and local blog images.

## P4: Conversion and business growth

- [ ] Track homepage email capture conversion.
  - Source: `home-guide`
  - Watch form views vs submissions.

- [ ] Track Ask AI usage.
  - Query volume.
  - Result clicks.
  - Zero-result or fallback cases.

- [ ] Track prayer-room map value.
  - Filter clicks.
  - Pin/card clicks.
  - Directions clicks.

- [ ] Track pricing/checkout flow.
  - Pricing page views.
  - Plan button clicks.
  - Checkout starts.
  - Webhook-completed subscriptions.

- [ ] Track owner dashboard activation.
  - Dashboard visits.
  - Listing edits.
  - Certificate uploads.
  - Sponsored ads/billing clicks.

## Paid-plan feature register

Fill this in after checking the Vercel dashboard.

| Feature | Status | Notes |
|---|---|---|
| Web Analytics | Enabled | Code hook installed; wait for production traffic to populate dashboard |
| Speed Insights | Pending dashboard enable | Code hook installed |
| Observability | Pending dashboard check | Use for route/API debugging |
| Firewall/Security | Pending dashboard check | Useful before paid traffic campaigns |
| Spend limits/alerts | Pending dashboard check | Set before ads or high-traffic launch |
| Team access | Pending dashboard check | Add collaborators with least privilege |

## Command reference

```bash
vercel project ls
vercel env ls
vercel inspect https://www.humblehalal.com
npm run typecheck
npm run build
npm run deploy:prod
```

## Notes

- Do not paste secrets into this file.
- Do not enable paid flags just because env variables exist.
- Preview deployments should be safe to share without charging cards, mutating production data, or sending real customer emails.
- Keep `docs/engineering/launch-runbook.md`, `docs/engineering/clerk-go-live.md`, `docs/engineering/payment-go-live.md`, and `docs/engineering/analytics.md` as the detailed source runbooks.
