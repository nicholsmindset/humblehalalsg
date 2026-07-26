# Vercel cost optimization — account `nicholsmindset` (Pro)

_Written 2026-07-25. Context: a "100% free-tier Edge Requests (1M)" alert prompted a
review of the whole account._

## The real picture (from the Usage panel)
On Pro with a **$20 included credit**, this cycle's spend was **$15.70** with 11 days
left (on pace ~$21–22; On-Demand $0 so far). **Edge Requests are not a top cost line** —
the alert is a quota signal, not the money. Actual drivers:

| Line item | Cost | Lever |
|---|---|---|
| **Build CPU Minutes** | **$6.85** | Fewer/cheaper builds across the 8 projects |
| Fast Origin Transfer | $2.84 | Smaller payloads, more caching |
| ISR Writes + Reads | $3.57 | Longer revalidate / on-demand revalidation |
| Fluid CPU + Memory | $1.19 | Function efficiency |
| Functions / Images / Observability | ~$1.1 | Fewer per-view calls |

**8 projects share the credit:** elumihome, sg-calc, humblehalalsg, arahkaiiblog,
your-website-plan, sgborder, schemacheck, sleepcalc. Edge-request leaders (12h sample):
**sg-calc 22K**, humblehalalsg 9.2K, elumihome 2.2K, arahkaiiblog 2.1K, rest small.
So **sg-calc, not humblehalalsg, is the top edge-request driver.**

## Do this first (account-level, in the Vercel dashboard)
1. **Set a Spend Management cap** (Settings → Billing → Spend Management) at ~$20–25 so
   the account can never surprise-bill. Highest safety-to-effort action.
2. **Add an "Ignored Build Step" to every project** that doesn't have one — this attacks
   the #1 cost (Build CPU $6.85). Two ways:
   - Per project → Settings → Git → *Ignored Build Step*, or
   - a `vercel.json` `"ignoreCommand"`.
   humblehalalsg already does this (`scripts/ignore-build.sh`, now also skipping
   `.design-sync/` and `.github/` changes) — **copy that pattern to the other 7 projects.**
   Minimal inline version for a project with no script (Vercel: exit 0 = skip, exit 1 = build):
   ```bash
   # Ignored Build Step command
   git diff --quiet "$VERCEL_GIT_PREVIOUS_SHA" HEAD -- . ':(exclude)*.md' ':(exclude)docs' ':(exclude).github' && exit 0 || exit 1
   ```
3. **Limit which branches deploy.** humblehalalsg builds only `master`
   (`vercel.json` → `git.deploymentEnabled: { "master": true, "**": false }`). Apply the
   same to the others so preview builds for every push/PR branch stop burning Build CPU.
4. **Pause or consolidate dormant projects.** sleepcalc had ~5 requests in the sample;
   schemacheck/your-website-plan/sgborder are low-traffic. Each still costs build minutes
   on every deploy. Pause the ones not in active use, or move pure-static ones (sg-calc,
   sleepcalc, sgborder are calculators) to a free static host (Cloudflare Pages / GitHub
   Pages) — that removes their Build CPU, ISR, and Edge Requests from this account
   entirely. **sg-calc is the biggest edge-request driver and looks static — moving it is
   likely the single highest-impact account change.**
5. **Turn off Observability/Speed Insights sampling** where you don't use it
   (Observability Events was $0.60) — small, but free.

## Code changes already made to humblehalalsg (branch `perf/vercel-cost`)
- **`/api/flags`** is now session-cached (30-min TTL) instead of fetched on every page
  view (`components/app-context.tsx`) — cuts an edge request + function invocation per
  view while keeping admin flag-flips propagating.
- **`/api/ads/active`** now has a module-level cache + in-flight dedup
  (`components/ads/ad-slot.tsx`) — repeat mounts / client navigations / same-slot
  placements share one request instead of one per mount.
- **Route-specific fonts** (Cormorant, Libre Caslon, Newsreader, Amiri) set
  `preload:false` (`app/layout.tsx`) — fewer font requests on non-blog/non-tools pages.
- **`scripts/ignore-build.sh`** now also skips builds for `.design-sync/` and `.github/`
  changes.

### Investigated and deliberately NOT changed (would have backfired)
- **`ota.css` route-scoping** (audit L9 suggested it's travel-only): **false** —
  `Popover`, `Carousel`, and `Stepper` (shared `components/ota.tsx`) use `ota-` classes
  and render on non-travel routes. Scoping it would break those site-wide.
- **Re-enabling image optimization** (audit M6): the `/blog/`, `/mosques/`, etc. assets
  are already WebP + sized at build; routing them through `/_next/image` would *increase*
  Image-Optimization Transformation + Cache-Write cost. The current bypass in
  `lib/img.ts` is correct cost management.
- **Shortening ISR `revalidate`:** already well-tuned (24 pages daily, 16 hourly, 2 at
  15-min). Business/verdict pages should NOT be shortened — audit H3 wants halal claims
  *fresher*, and the right fix there is **on-demand revalidation** on admin edits, a
  larger follow-up.

## Follow-ups (larger, not in this round)
- **humblehalalsg H6** (audit): the full directory (≤2000 rows) is serialized into every
  route's client payload — the biggest Fast-Origin-Transfer lever. Send only what each
  route needs.
- **On-demand revalidation** for business/verdict pages so ISR writes happen on data
  change, not on a timer — cuts ISR cost without staling halal claims.
- **sg-calc / elumihome / arahkaiiblog**: apply the same per-view-fetch / font / build-skip
  fixes when those repos are added to a session.
