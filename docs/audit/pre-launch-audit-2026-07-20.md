# Pre-launch audit — Humble Halal (2026-07-20)

Full front- + back-end **code audit** ahead of go-live, driven by three parallel deep passes over the repo (backend/API security, frontend/rendering/SEO, infra/config/tests) with every High/Medium claim re-verified against source before acting. Complements the browser-driven [full platform audit (2026-07-09)](full-platform-audit-2026-07-09.md) and the [production readiness audit (2026-07-07)](production-readiness-audit-2026-07-07.md). Five fixes were applied on `claude/pre-launch-audit-r9zihn`; everything else below is either verified-safe or an explicit launch-day checklist item.

## Headline

The platform is **launch-ready from a code standpoint** — the payments path, auth model, webhook verification, secrets hygiene, and abuse controls all checked out under adversarial review. The two real gaps found were **operational resilience** (zero React error boundaries → client crashes invisible to Sentry, unstyled error screens) and **per-request cost** (the shared layout's `select("*")` over up to 2000 businesses on every uncached hit). Both are fixed in this branch, plus three smaller hardening items.

## Verified safe (no action needed)

- **Stripe** — webhook signature verified (`stripe.webhooks.constructEvent`), idempotency ledger with claim-release on fulfillment failure, refund/dispute/fraud handling. Checkout pricing is **server-controlled everywhere**; the only client-supplied amount is `/api/donate`, deliberately bounded S$1–S$5,000.
- **Auth** — `/admin` + `/owner` edge-gated via Clerk middleware and re-checked server-side (`requireAdmin` → `profiles.role`, service-role read). No privilege-escalation path: role never sourced from request bodies, self-serve role change hardcodes `user→owner` only, Clerk webhook (Svix-verified) never touches role on update and can't demote an admin via replay.
- **Supabase** — service-role key confined to `server-only` modules; browser only ever holds the anon key. RLS: 66 tables enabled, 79 policies. An earlier pass flagged `email_log` / `webhook_events` / `import_runs` / `directory_areas` as RLS-less — **re-verified false**: `0017_rls_hardening.sql` and `0038_catalog.sql` cover all four (admin-read / deny-write). What the repo cannot prove is the **live DB** state — see checklist.
- **Convex** — public functions admin-gated, ingest is `internalMutation` + HMAC-verified HTTP action with staleness + size caps.
- **Abuse controls** — per-IP rate limiting (Upstash, unspoofable `x-vercel-forwarded-for`, fail-closed for paid buckets), Turnstile + honeypot on public forms, AI kill-switch flag on every LLM route.
- **Secrets** — only `.env.example` (placeholders) is tracked; gitleaks + audit-ci (high/critical, empty allowlist) + CodeQL in CI; no `NEXT_PUBLIC_` misuse.
- **SEO** — centralized `pageMeta`, segmented dynamic sitemaps + CI diff, robots.ts, JSON-LD across 72 files, dynamic OG images, hreflang for `/ms/*`; ISR on the landing/detail clusters.

## Findings (ranked) and what was done

### High — fixed in this branch

1. **Zero error boundaries** — no `error.tsx` / `global-error.tsx` existed across ~149 routes, so any client render crash bypassed Sentry (which only saw server errors via `onRequestError`) and dumped users on Next's unstyled default screen. **Fixed:** root `app/error.tsx` (state-screen styling, no app-context deps) + self-contained `app/global-error.tsx`, both with `Sentry.captureException`, using this Next version's `unstable_retry` convention.
2. **Layout over-fetch** — `getDirectory()` ran `businesses.select("*").limit(2000)` through the service-role client on **every uncached request** (React `cache()` is per-request only), dragging `stripe_customer_id`, `contact_email`, and `provenance` jsonb along for the ride. **Fixed:** migration-verified explicit column list (`BUSINESS_COLS`) in `lib/directory.ts`, with a guard comment — `rowToListing`'s fallback keys are *not* real columns, and naming a nonexistent column errors the whole PostgREST query.

### Medium — fixed in this branch

3. **`/faq` was `force-dynamic`** to read feature flags that are already 30s-cached in-process — so it never reflected toggles "immediately" but did force the layout's full Supabase fan-out on every crawl/hit of a high-traffic SEO page. **Fixed:** `revalidate = 300`.
4. **AI-spend route inconsistencies** — `travel/concierge` lacked the message-count/size caps its sibling `concierge/chat` has; `travel/ask` + `travel/highlights` rate-limited without `failClosed`, so a limiter outage failed *open* on paid LLM routes. **Fixed:** ported the 40-message/24KB caps; both routes now `failClosed: true`.

### Low — fixed in this branch

5. **Mosque detail hero** was a raw `<img>` — the LCP element on an indexable ISR page skipping the optimizer. **Fixed:** `next/image` with `priority` + `sizes` (sources are local public paths; no `remotePatterns` change).

| Fix | Files | Risk | Verified |
|---|---|---|---|
| Error boundaries + Sentry | `app/error.tsx`, `app/global-error.tsx` (new) | Low (additive) | lint/typecheck/build |
| Narrow directory select | `lib/directory.ts` | Medium → mitigated (columns migration-verified; single revertable commit) | typecheck/build + preview check below |
| FAQ ISR | `app/faq/page.tsx` | Low | build output lists `/faq` as ISR |
| AI route guards | `app/api/travel/{concierge,ask,highlights}/route.ts` | Very low (additive guards) | lint/typecheck |
| Mosque hero image | `app/mosques/[slug]/page.tsx` | Low (only fires when a CMS photo exists) | lint/build |

## Deliberately NOT changed (reviewed, leave as-is)

- **`hawker` / `deals` force-dynamic** — hawker `notFound()`s on a flag (ISR would cache a 404 across a flag flip; the in-code comment documents this); deals shows time/stock-sensitive coupon state. Revisit post-launch.
- **`getEvents` / catalog / `lib/hawker.ts` `select("*")`** — small tables or bounded queries; low payoff against the same nonexistent-column failure mode. Post-launch.
- **DirectoryProvider architecture** (full listing array serialized into every page's HTML) — the real long-term fix for payload size, but an architecture change is the wrong risk the week of launch. Post-launch project.
- **Enforced CSP has no `script-src`/`default-src`** — intentional staged rollout: the full allowlist policy ships in Report-Only with `report-uri /api/csp-report`. Keep collecting, then promote.
- **`typescript.ignoreBuildErrors: true`** — CI `typecheck` is the gate by design; noted so nobody bypasses CI.

## Launch-day checklist (cannot be verified from the repo)

1. **Confirm migrations `0017` + `0038` are applied to the live DB** (RLS on `email_log`, `webhook_events`, `import_runs`, `directory_areas`) — the weekly `security-probes` workflow exists but skips until its probe secrets are set; set them.
2. **`CRON_SECRET` set in Vercel production env** — `authorizeCron` fails closed in prod, and the money-moving `event-payouts` cron depends on it.
3. **`NEXT_PUBLIC_SENTRY_DSN` set in production** — Sentry (including the new error boundaries) is a no-op without it.
4. **Pick one deploy path** — Vercel git auto-deploy on master, the `deploy.yml` Action, and `scripts/deploy-prod.sh` are three competing routes to prod; disable or clearly subordinate two of them.
5. **`crm-sync` cron runs every minute** (~43k invocations/month) — confirm cost/idempotency on the Pro plan or widen the schedule.
6. **Preview smoke for the narrowed select** — on the Vercel preview: `/explore` shows listings, one `/business/[slug]` renders with phone/address/socials, one hawker stall slug resolves. (Failure mode of a bad column name is an *empty* directory, not an error.)

## Reproduce

```
npm ci
npm run lint        # 0 errors
npm run typecheck   # clean
npm test            # 45 files / 366 tests passed
npm run build       # /faq listed as ISR (5m), boundaries compile
```

Playwright e2e (`npm run test:e2e`) needs Supabase/Clerk env — runs against preview per `ci.yml`. Sentry client capture is verifiable only post-deploy (enabled in production with DSN only).
