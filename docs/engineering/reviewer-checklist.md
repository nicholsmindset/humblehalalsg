# Humble Halal — reviewer checklist

A lightweight, repo-specific gate for any PR that touches trust, data, or revenue.
Adapted from the "Superpowers" methodology — discipline, not ceremony. Use the full
list for features/integrations; skip it for copy/style tweaks.

## Trust rules (non-negotiable)
- [ ] **Never** scrape, crawl, or mirror the MUIS register — deep-link only (`lib/muis.ts`).
- [ ] Deterministic expiry/freshness may run automatically; **ambiguous halal-status or
      content judgments must produce a human-reviewed PR/queue item**, never auto-publish.
- [ ] No change that could surface **stale or overstated** halal status (check `halal-score`,
      `recheck-certs`, tier badges).

## Branch coverage (this codebase degrades gracefully)
- [ ] Works in **configured** mode (Supabase/Stripe/LiteAPI keys present) **and** in
      **mock mode** (no keys) — every new route/effect must no-op or fall back, never crash.
- [ ] Client analytics/data calls use the null-safe `getSupabaseBrowser()` /
      `getSupabaseAdmin()` helpers, not a raw `createClient`.

## Tests & evidence
- [ ] New trust/analytics logic has a **vitest** unit test (`npm test`).
- [ ] Ran `npm run typecheck && npm run lint && npm test && npm run build` — all green.
- [ ] If the change is user-visible, verified the **mock-mode** render too (no Supabase keys).

## Data & security
- [ ] RLS respected: user-scoped reads via `getSupabaseServer`, system jobs via
      `getSupabaseAdmin`; `SECURITY DEFINER` RPCs are hard-scoped (admin or owner).
- [ ] No secrets in client code, logs, or committed files.

## Singapore specifics
- [ ] OneMap for SG geocoding; SG time (`Asia/Singapore`) for day bucketing; SGD where money appears.
