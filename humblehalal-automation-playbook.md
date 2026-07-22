# HumbleHalal SG — Automation, Scanning & Scheduling Playbook

How to keep the site accurate, fresh, and at peak using **GitHub Actions** (CI + cron),
**Vercel Cron** (in-app scheduled jobs), and **Claude Code scheduled/headless runs**
(AI-judgment work). Each item below says WHERE it should live and WHY.

---

## The 3 layers (and which to use for what)

| Layer | Best for | Runs where | Cost |
|---|---|---|---|
| **GitHub Actions** | Code quality gates, link/SEO scans, scheduled scripts that don't need app secrets, opening PRs/issues | GitHub runners | Free tier generous |
| **Vercel Cron** | Jobs that need your live DB + app code (cert re-checks, sending emails, recomputing stats) | Your deployed app (`/api/cron/*`) | Included in Vercel plans |
| **Claude Code (scheduled/headless)** | Anything needing judgment: drafting blogs, reviewing data anomalies, QA-ing content against your skills, triaging the review queue | Your machine or a runner via `claude -p` | Your Claude usage |

**Rule of thumb:** deterministic checks → GitHub Actions or Vercel Cron. "Does this look right / write this / decide this" → Claude Code.

---

## A. GitHub Actions — Code & SEO quality gates

### A1. CI on every PR (the foundation)
**Lives in:** `.github/workflows/ci.yml`
Runs on every push/PR: `build`, `lint`, `typecheck`, Vitest, and a Playwright smoke test on the key flows (search → business → action). Blocks merge if red. This is the single most important automation — it stops broken code from ever reaching the live directory.

### A2. Schema & structured-data validation
**Lives in:** `.github/workflows/schema-check.yml` (on PR + weekly cron)
Crawls a sample of business pages, money pages, and guides on the Vercel preview URL and validates the JSON-LD (LocalBusiness, ItemList, FAQPage, Review). Fails the PR if schema breaks. **Why:** a silent schema regression kills your rich results and AI citations — you want to catch it before merge, not when traffic drops.

### A3. Broken-link & dead-listing scanner
**Lives in:** `.github/workflows/link-scan.yml` (weekly cron)
Runs a link checker across the site (internal + outbound business websites/socials). Opens a GitHub Issue listing dead links and businesses whose website returns 404/closed. **Why:** dead outbound links and closed businesses are exactly the "stale data" problem that killed Zabihah's reputation. This feeds your verification queue.

### A4. Lighthouse / Core Web Vitals budget
**Lives in:** `.github/workflows/lighthouse.yml` (on PR)
Runs Lighthouse CI against the preview deploy with budgets (LCP <2.5s, CLS <0.1). Comments scores on the PR, fails if you blow the budget. **Why:** keeps the mobile-first performance you need for SG users and rankings.

### A5. Sitemap & indexation diff
**Lives in:** `.github/workflows/sitemap-diff.yml` (daily cron)
Fetches your live sitemap, diffs against yesterday's, and posts a summary (new/removed URLs) to a Slack/Discord webhook or a GitHub Issue. **Why:** you instantly see if a deploy accidentally dropped 500 pages from the index, or confirm new money pages crossed the ≥5-listings threshold.

---

## B. Vercel Cron — Live data accuracy & freshness

These need your database and app code, so they live as API routes in the app, scheduled in `vercel.json`.

### B1. MUIS certification re-check (weekly) — already in Prompt 1.1
**Route:** `/api/cron/recheck-certs` · **Schedule:** weekly
Flags businesses whose `muis_cert_expiry` has passed → sets `halal_status='pending'`, logs to `verification_log`, surfaces in admin digest. **This is your #1 moat job** — never let an expired cert show as "certified."

### B2. Freshness decay monitor (weekly)
**Route:** `/api/cron/freshness-audit`
Finds listings not verified in 180+ days, queues them for re-verification, and emails the owner (if claimed) a "confirm your details are current" link (one-click re-stamps `last_verified_at`). **Why:** turns freshness into a self-maintaining loop instead of manual labor.

### B3. Live-stats recompute (hourly/daily)
**Route:** `/api/cron/refresh-stats`
Recomputes `get_directory_stats()` and the `category_area_counts` view, busts the relevant ISR caches. **Why:** keeps homepage numbers honest and flips category×area pages to indexable the moment they hit 5 listings.

### B4. Newsletter / digest sender (weekly)
**Path:** Beehiiv native RSS-to-email pointed at `/blog/feed.xml` (dashboard config — the one
publishing path; the old `/api/cron/weekly-digest` broadcast cron was removed 2026-07 having
never sent). **Why:** retention engine, runs itself.

### B5. Owner lead/analytics alerts (daily)
**Route:** `/api/cron/owner-alerts`
Daily roll-up emails to owners: views, WhatsApp clicks, new leads. **Why:** this is what makes the S$19–49/mo feel worth it → reduces churn.

### B6. AI-crawler & indexation health (daily)
**Route:** `/api/cron/index-health`
Pings GSC + Bing APIs for coverage errors, checks robots.txt still allows GPTBot/PerplexityBot/ClaudeBot, alerts on drops. **Why:** Bing indexation powers ChatGPT citations — silent breakage = invisible in AI search.

---

## C. Claude Code — Scheduled AI-judgment automations

Claude Code can run headless/non-interactively (`claude -p "prompt"`), so you can trigger it from cron (your Mac via `launchd`/`cron`), from a GitHub Action on a schedule, or kick it off manually. Use it for everything that needs reading, writing, or judgment — the work GitHub Actions and Vercel Cron can't do.

### C1. Weekly content scheduler & blog drafting
**Trigger:** Monday morning cron → `claude -p` with the prompt below, run inside your repo so it has the skills + CLAUDE.md.
```
Read CLAUDE.md and the arahkaii/smartcalculator content skills as relevant.
It's the start of the week. 1) Pull this week's content calendar from
/content/calendar.json. 2) For each slot due this week, draft the guide as
MDX in /content/guides/_drafts/ using the "Best halal [category] in [area]"
or seasonal template, with live-listing embeds, GEO direct-answer opening,
FAQ block, and internal links to the matching money pages. 3) Open a PR
titled "Content: [titles]" with the drafts and a checklist for my review.
Do NOT publish — drafts + PR only.
```
**Why:** you get publish-ready drafts every Monday without writing them; you review + merge. Pairs with your existing editorial/SEO skills.

### C2. Data-accuracy cross-check (weekly)
**Trigger:** weekly cron → `claude -p`
```
Read CLAUDE.md. Cross-check data accuracy: 1) Pull the link-scan and
freshness-audit outputs (GitHub Issue / cron digest). 2) For the 20 most
trafficked listings, verify name/address/hours/halal-status against the
business's website + Google Maps + MUIS register where applicable. 3) For
any MUIS-certified listing, confirm the cert number still appears on the
MUIS HalalSG register. 4) Output a report: CONFIRMED / NEEDS-UPDATE /
LIKELY-CLOSED per listing, with the source you checked. Open issues for
NEEDS-UPDATE and LIKELY-CLOSED. Do not edit listing data directly —
flag for admin approval (human signs off on every halal-status change).
```
**Why:** this is the SmartCalculator accuracy-ledger discipline applied to listings — automated detection, human sign-off. Protects the one thing you can't recover if lost: trust.

### C3. Content QA against your skills (on PR)
**Trigger:** GitHub Action on content PRs → `claude -p`
```
Read CLAUDE.md. Review the changed guide drafts in this PR. Run the
anti-AI-slop checklist, halal-compliance scan (no alcohol/nightlife refs),
banned-phrase scan, internal-link density check, SEO meta check, and the
GEO direct-answer / FAQ presence check. Comment PASS/FAIL per file with
specific fixes. Do not merge.
```
**Why:** every published guide clears the same editorial bar automatically before it goes live.

### C4. Review-queue triage (daily)
**Trigger:** daily cron → `claude -p`
```
Read CLAUDE.md. Pull pending reviews from the moderation queue (admin API,
read-only). Classify each: APPROVE (genuine), FLAG-SPAM, FLAG-FAKE
(duplicate/templated), FLAG-ABUSE, or NEEDS-HUMAN. Output a triage list with
reasons. Auto-approve nothing — produce recommendations for the admin to
action in one click.
```
**Why:** keeps the review pipeline moving without you reading every one, while a human still presses the button.

### C5. SEO opportunity scan (monthly)
**Trigger:** monthly cron → `claude -p` (uses your Ahrefs + GSC/SEOTesting MCPs)
```
Read CLAUDE.md. Using Ahrefs + GSC data: 1) Find "halal [category] [area] SG"
keywords where we rank positions 5–20 (striking distance) — list page +
quick-win fix. 2) Find category×area combos with search demand but <5 listings
(content gaps to fill via outreach). 3) Find guides losing traffic (decay) and
suggest refreshes. 4) Check our citation presence in ChatGPT/Perplexity/AI
Overviews for the top 10 queries. Output a prioritized monthly SEO action list.
```
**Why:** turns your existing MCP stack into a monthly growth engine — mirrors what you already do for Mediacorp/SmartCalculator.

### C6. Ramadan / seasonal content burst (scheduled ~8 weeks before Ramadan)
**Trigger:** dated cron → `claude -p`
```
Read CLAUDE.md. Ramadan is ~8 weeks out. Draft the seasonal content burst:
bazaar guides by area, iftar/buffet round-ups, "halal catering for Ramadan"
lead-gen landing copy, and deal-module prompts for owners. Open a PR with all
drafts + a publish schedule. Do not publish.
```
**Why:** Ramadan is your biggest traffic/revenue window — this guarantees you're prepped 2 months out instead of scrambling.

---

## D. How to wire Claude Code to a schedule (practical)

Two clean options:

1. **GitHub Actions + Claude Code (recommended for team/repo jobs).** A scheduled workflow checks out the repo, installs Claude Code, and runs `claude -p "<prompt>"` with `ANTHROPIC_API_KEY` in repo secrets. Good for C1, C3, C5 — anything that produces a PR or comment. Drafts land as PRs you review from your phone.
2. **Local cron on your Mac / Claude Code desktop (recommended for MCP-heavy jobs).** Use `cron`/`launchd` to run `claude -p` from the repo folder where your MCPs (Ahrefs, GSC, Supabase) are already configured. Good for C2, C4, C5, C6. Keep the Mac awake (caffeinate) or run on your Hostinger VPS where your n8n stack already lives.

**Golden rules for all scheduled AI runs:**
- **AI drafts and flags; humans approve and publish.** No automation directly changes a halal-status, publishes a guide, or sends an email to a business without a human gate. (Same principle as your smartcalc accuracy ledger.)
- **Everything outputs to a PR, an Issue, or a digest** — never silent edits to production.
- **Secrets live in GitHub Secrets / Vercel env / local .env only** — never in the repo (your project-hygiene rule).

---

## E. Suggested schedule at a glance

| When | Job | Layer |
|---|---|---|
| Every PR | CI, schema check, Lighthouse, content QA (C3) | GitHub Actions / Claude |
| Hourly | Live-stats recompute (B3) | Vercel Cron |
| Daily | Owner alerts (B5), index health (B6), sitemap diff (A5), review triage (C4) | Vercel / GH / Claude |
| Weekly | Cert re-check (B1), freshness audit (B2), digest (B4), link scan (A3), blog drafting (C1), data cross-check (C2) | Vercel / GH / Claude |
| Monthly | SEO opportunity scan (C5), stats page refresh | Claude / Vercel |
| Seasonal | Ramadan burst (C6) | Claude |

---

## F. Build order for the automations

Don't build all of these at once. Sequence:
1. **With Phase 0–1:** A1 (CI), A2 (schema), B1 (cert re-check), B3 (stats). These protect correctness from day one.
2. **With Phase 2:** B4/B5 (digest + owner alerts), C1 (blog drafting), C3 (content QA). These drive retention + content cadence once you have paying users.
3. **With Phase 3:** A3/A5 (scans), B2/B6 (freshness + index health), C2/C4/C5/C6 (cross-check, triage, SEO scan, seasonal). These are the "always at peak" polish layer.

Paste any single section above into Claude Code as its own task — each is scoped to be built in one session.
