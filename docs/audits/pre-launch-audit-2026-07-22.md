# Humble Halal — Pre-Social-Launch Audit

**Date:** 2026-07-22
**Scope:** Phase 1 (defects, read-only) + Phase 2 (gap analysis) per the audit brief.
**Method:** Static code audit of this repo (branch `claude/humble-halal-pre-launch-audit-wcw4pg`, HEAD `c8b95c3`), live read-only Supabase introspection (project `Humblehaal`, `select` + catalog queries only), local production build + route probe. Production URLs were unreachable from the audit environment (network policy), so on-site observations are inferred from code + live data and flagged where unconfirmed.

---

## 1. Executive summary

**Can this site receive social traffic today: NO — but it is close.**

The engineering foundation is much stronger than the brief assumed: metadata/canonical/JSON-LD coverage is near-complete, expired events are already excluded from every rendering path at HEAD, sitemaps are quality-gated, RLS is hardened, UTM attribution survives end-to-end, and the repo is clean. What blocks launch is a small set of trust-labelling defects and one deployment/verification question — all cheap to fix relative to their impact:

1. **~108 of 324 public listings render a card with no halal-status label at all** — just "Muslim-Owned" (an ownership fact, not a halal status) plus a **Claim** chip (376 of 377 published businesses are unclaimed). This is the reported Defect C, confirmed and quantified.
2. **A business whose certificate has expired is shown as "Halal-Friendly"** — an upgrade in perceived trust at exactly the moment it should be downgraded.
3. **Every one of the 197 "MUIS" businesses has no certificate number on file**, yet the "MUIS certified" explore filter and admin counts include all of them, while the card label honestly says "MUIS-listed". The filter asserts what the label carefully doesn't.
4. **The homepage count and the map count measure different things without saying so** (all listings vs geocoded-only: 324 vs 165 today) — the structural cause of the "301+ vs 73" contradiction. Only 49% of listings are geocoded.
5. **Production appears to be running an older deployment than this repo** (evidence below). The reported "expired Feb/Mar 2026 events" cannot be reproduced at HEAD — those dates exactly match the in-repo mock seed data that current code never renders publicly. Verifying and redeploying is itself a launch gate.
6. **The newsletter cannot actually publish**: the digest cron has only ever "simulated" (its send webhook env var is unset and undocumented in `.env.example`), and the Beehiiv welcome automation spec still contains placeholder links (`{{referral_url}}`, `(#)`, dummy Instagram).

**Findings: 27 total — 4 CRITICAL, 8 HIGH, 9 MEDIUM, 6 LOW.**

**Launch-blocking set (must close before pushing social traffic):**
F1, F2, F3 (status labelling), F4 (event lifecycle enforcement — structural), F5 (count contradiction), F6 (deployment verification), F9 (hotel "Halal food" chip), F10 (privacy-policy processor error), F11 (newsletter canonical path + placeholders).

Everything else is fast-follow. Estimated total effort for the blocking set: mostly S, two M — realistically a few focused days.

---

## 1a. Remediation log (Phase 3, 2026-07-22)

| Finding | Status | Commit / note |
|---|---|---|
| F10 privacy-policy processor | ✅ Fixed | `e1d3a90` — Beehiiv named, MailerLite removed (incl. sub-processor bullet at `lib/legal-content.ts:69`) |
| F1 + F2 card status labels | ✅ Fixed | `18cc5f1` — pill renders for every tier; Claim is never the only signal |
| F3(a) filter wording | ✅ Fixed | `e7fb973` — "certified / listed" across explore, map, toggle, onboarding, EN+MS. F3(b) cert-number backfill remains open (data work) |
| F9 hotel amenity chips | ✅ Fixed | `d7624bb` — unverified flags: info glyph + "(per hotel)" |
| F5 count contradiction | ✅ Label fixed | `3fb545a` — map says "places mapped". Geocode backfill (169 rows) still open: `npm run geocode:listings` |
| F11 newsletter single path | ✅ Code fixed | `8e1382f` — broadcast cron + helper deleted; RSS-to-email is the one path. **Manual:** Beehiiv dashboard RSS-to-email + welcome automation with real links |
| F14 digest error-swallow | ✅ Moot | Cron deleted in `8e1382f` |
| F8 OG image wiring | ✅ Fixed | `f635a65` — five routes now reach their per-entity cards |
| F12 directions tracking | ✅ Fixed | `773c0f5` — all six untracked buttons instrumented |
| F4 event lifecycle | ⏳ Migration written, NOT applied | `e38bee8` — `supabase/migrations/0079_events_end_date.sql` awaits approval + a reachable Supabase connection; ISR 3600→900 shipped. Query flip to `ends_at` ships after apply |
| F6 deployment verification | ⛔ Blocked (access) | Needs Vercel dashboard: production commit + redeploy; not reachable from this environment |
| F18 test rows in prod DB | ⛔ Blocked (access) | Supabase connector disconnected mid-session; delete 3 test/demo event rows when back |
| F19 blocked slugs still published | ⛔ Blocked (access) | Same — flip 10 rows to `status='suspended'` when back |
| F13, F15–F17, F20–F27, Gaps 1–10 | Open | Next tranche per §7 |

---

## 2. Corrections to the brief (things that did not match the codebase)

- There is no `places`/`listings` table; the directory table is **`businesses`**. Events live in **`events`**.
- The stack is far larger than "Next.js + Supabase + Beehiiv": Clerk (auth), Stripe, Keystatic (CMS), Convex (CRM outbox), GTM + GA4 + Meta CAPI + TikTok Events, Sentry, Upstash, LiteAPI (hotels/flights), Vercel Analytics/Speed Insights. Next.js is **16.2.10** (App Router, React 19).
- **Defect B as stated ("Feb/Mar 2026 events still displaying") is not reproducible at HEAD.** The live `events` table contains only 4 rows — all test/demo (`test`, a cancelled `Humble Halal Event`, a rejected `ZZ TEST EVENT — QA automated (please delete)`, and a published `Community Iftar 2027 (Demo)`). The Feb/Mar 2026 dates match the static mock seeds in `lib/events-data.ts`, which current code never renders publicly. The observation almost certainly came from an older deployment (see F6). The *structural* weakness behind Defect B is real, though (F4).
- **Defect A's "73" is not any count the current code + data produces.** Both the hero and the explore list count the same array. The map view counts only geocoded listings (165 today). See F5 and Open Questions.
- The existing audit directory is `docs/audit/` (singular); this report creates `docs/audits/` per the brief's explicit instruction.
- `/api/cron/weekly-digest` was described as "assemble a preview and log a run without sending" — correct in effect, but it *attempts* a real send that silently degrades to `simulated` because `BEEHIIV_BROADCAST_URL` is unset (F11).
- Repo migrations do **not** allow `events.status='cancelled'`, but the live DB constraint does — live schema has drifted from the repo (F17).

---

## 3. Phase 1 findings

### 3.1 Defect diagnoses (brief §1.1)

### [CRITICAL] F1 — ~108 listing cards render no halal-status label; "Claim" is often the only chip

**Location:** `components/ui.tsx:347-356` (`hsPill`), `components/ui.tsx:357-366` (`claimChip`), `components/ui.tsx:383-389` and `:431-442` (badge rows); `lib/directory.ts:27-32` (badge derivation); `lib/halal-score.ts:46-66` (`resolveTier`)
**What is wrong:** The status pill is deliberately suppressed for `declared` and `pending` tiers (`if (hs.tier === "declared" || hs.tier === "pending") return null`). The code comment assumes "the tier badge beside it ('Muslim-Owned' / 'Halal-friendly') already carries the signal" — but `rowToListing` only adds the `friendly` fallback badge **when the badges array is empty**. A self-declared (or NULL-tier) business tagged Muslim-owned gets `badges=["owned"]`, so its card shows **"Muslim-Owned" + "Claim" and no halal status of any kind**. "Muslim-Owned" is an ownership axis, not a halal status; "Claim" is an ownership action. Live data: **108 published non-hawker businesses** are in this state (`halal_tier IN (NULL,'declared','pending')` AND owned/muslim attribute). Only **1 of 377** published businesses is claimed, so the Claim chip appears on virtually every card. The 27 NULL-tier rows silently resolve to `declared` (`resolveTier` fallthrough), so they are also unlabelled.
**Why it matters:** The brand promise is that every place carries an explicit, honest status. A third of the directory currently carries none, and the most prominent chip is an ownership CTA. This is the exact reported Defect C.
**Proposed fix:** Always render a status label: remove the `declared`/`pending` suppression in `hsPill` (show "Self-declared" / "Pending Verification" with the muted tone), or push a `declared` badge from `rowToListing` regardless of other badges. Keep the one-glossary rule (see Gap 3). Decide explicitly what NULL tier means and backfill the 27 rows.
**Effort:** S
**Risk of fixing:** Cards get one more chip (layout width on the `row` variant slices to 2 badges — verify the status chip isn't the one sliced off; render `hsPill` outside the sliced set, which it already is). "Self-declared" wording may read negatively — that is the honest label, per the brand's own glossary.
**Blocks launch:** yes

### [CRITICAL] F2 — Expired-certificate businesses are *upgraded* to "Halal-Friendly" on cards

**Location:** `app/api/cron/recheck-certs/route.ts:46` (expiry flips `halal_tier` to `'pending'`, writes `halal_score=34`); `components/ui.tsx:349` (pill suppressed for `pending`); `lib/directory.ts:27-32` (no `pending` badge emitted from live rows; the `pending`→"Pending Verification" badge in `lib/data.ts:183` is reachable only from mock data)
**What is wrong:** When the weekly cert recheck detects an expired MUIS cert it sets `halal_tier='pending'`. On cards, `pending` suppresses the status pill and (absent other tags) the badge fallback renders generic **"Halal-Friendly"** — a *friendlier* label than the business had before its cert expired. The stored `halal_score=34` is written to a column nothing reads (see F21). Live data: 1 row today, but the cron manufactures this state on every expiry, and `muis_expiry` is the mechanism the "cert freshness" franchise depends on.
**Why it matters:** This is the single worst trust inversion in the system: the moment evidence weakens, the display gets vaguer instead of flagging it.
**Proposed fix:** Same code family as F1 — render "Pending Verification" explicitly on cards. Additionally consider `reported` styling (danger tone) for expired-cert transitions, which `resolveTier` already supports via `statusChanged`.
**Effort:** S (covered by the F1 change)
**Risk of fixing:** None beyond F1's.
**Blocks launch:** yes

### [CRITICAL] F3 — "MUIS certified" filter and counts include 197/197 businesses with no certificate on file

**Location:** `components/screens/consumer.tsx:641-642` (explore filters: "Certified only" = `muis|admin` badges; "MUIS certified" = `muis` badge); `lib/directory.ts:28,42` (`badges` gets `muis` from `halal_tier` alone; `certified` = tier ∈ {muis,admin}); `app/api/admin/analytics/platform-health/route.ts:70` (same definition); contrast `lib/halal-score.ts:52-57,113-124` (`resolveTier`/`muisUnbacked` downgrade label to "MUIS-listed" when `verify.certNo` absent) and `app/muis-halal-certified-directory/page.tsx:25,46-49` (the one surface that relabels honestly)
**What is wrong:** Live data: **every one of the 197 `halal_tier='muis'` rows has `muis_cert_no` NULL/empty**. The presentation layer handles this honestly (card badge hidden by `muisUnbacked`, pill says "MUIS-listed", `certSuffix()` says "MUIS-listed"). But the *filters and counts* don't: a user who taps "MUIS certified" in explore receives 197 businesses for which the platform holds no certificate evidence, and admin "certified" KPIs count the same. Filter semantics and displayed labels have diverged — the user asks for certified and gets listed.
**Why it matters:** Filtering is an assertion. The brand's core differentiator is not overstating exactly this.
**Proposed fix:** Either (a) rename the filter to "MUIS certified or listed" (honest, zero data work), or (b) make the filter tier-aware: "MUIS Certified" = `muis` + cert on file, with "MUIS-listed" as a distinct filter — and start the cert-number backfill (each of the 197 came from a `spreadsheet` import; source URLs were not retained — see Gap 1). Align `platform-health` counts with whichever definition is chosen.
**Effort:** S for (a); M for (b)+backfill
**Risk of fixing:** (b) makes the "certified" filter return 0 results until backfill progresses — pair with (a) wording in the interim.
**Blocks launch:** yes

### [CRITICAL] F4 — Event expiry is not enforceable at the data layer (no end date; JSON-LD says "Scheduled" forever; multi-day events vanish mid-run)

**Location:** `supabase/migrations/0001_init.sql:46` (`date_iso date` nullable, the only date column); `lib/events-source.ts:97` (`.gte("date_iso", todaySG())` — start-date-only filter); `lib/events-source.ts:70` + `0014_events_display.sql` (`display.endTime`/`display.multiDay` never queried); `components/seo/json-ld.tsx:173-174,185` (`endDate` only for same-day `HH:MM`; `eventStatus` hardcoded `EventScheduled`); `app/events/[slug]/page.tsx:15` (`revalidate = 3600`)
**What is wrong:** Expiry is a query-time convention, not a data-layer rule. Consequences: (1) a single-day event stays listed (with `EventScheduled` JSON-LD) for the rest of its SG day after it ends, plus up to ~1h of ISR staleness after the date rolls; (2) a **multi-day event is dropped the day after it starts** even while still running — the opposite failure; (3) `date_iso` is nullable — a NULL-dated published event is silently invisible (`NULL >= today` is false), which is at least fail-safe; (4) `eventStatus` never reflects cancelled/completed. Timezone handling itself is correct (`todaySG()` uses `Asia/Singapore` via `Intl`, `lib/events-source.ts:19-21`; the reminder cron matches, `app/api/cron/event-reminders/route.ts:17-18`). Positive finding: **no rendering path, sitemap entry, or JSON-LD emission exists for an event whose `date_iso` is past** — pages 404/301 via `getGoneEventMeta` (`app/events/[slug]/page.tsx:68-74`), so the brief's "high severity if Event schema emitted for expired events" scenario does not occur at HEAD beyond the same-day/ISR window.
**Why it matters:** With real event volume, every one of these becomes a stale trust claim. The brief is right that this must be structural, not conventional.
**Proposed fix:** Add `ends_at date` (or `end_date`), backfill from `date_iso`, make it NOT NULL with a CHECK `ends_at >= date_iso`; filter `.gte("ends_at", todaySG())`; require end date on the creation form/API; emit real `endDate` and map `status='cancelled'` → `EventCancelled` in JSON-LD; drop `revalidate` to ≤900 on `/events/[slug]` or revalidate on the date rollover. (Migration to be shown for approval before running — Phase 3.)
**Effort:** M
**Risk of fixing:** Migration touches live table (4 rows — trivial today; that's exactly why now). Creation API/forms need the new required field.
**Blocks launch:** yes (structural; cheap while events table is nearly empty)

### [HIGH] F5 — Defect A: homepage counts all listings, map counts geocoded-only, neither is labelled; 51% of listings have no coordinates

**Location:** `components/screens/consumer.tsx:451,463,471` (hero `{placeCount}+ places` = `dir.listings.length`); `consumer.tsx:722` (explore list count = filtered same array); `consumer.tsx:990,1131-1132` (map count = `dir.listings.filter(l => l.coords)`); `lib/directory.ts:81,121-147` (coords only when `lat`/`lng` set; `getDirectory` = published, non-hawker, non-blocked)
**What is wrong:** All public counts derive from one shared array — on a clean `/explore` list load the number **must equal** the hero number (both would show 324 with today's data: 377 published − 43 hawker − 10 blocked). But the **map** tab counts only geocoded listings: **165 of 334** (169 have NULL lat/lng). So the product simultaneously tells users "324+ places" and "165 places" depending on tab, with no labelling. The observed "301+" matches an earlier data state (`lib/seo-counts.json` snapshot sums to exactly 301 non-hawker) — the hero is live, so the mismatch also indicates stale ISR HTML or an old deployment (F6). The precise "73" could not be reproduced from current code + data (no category, filter, or geocoded subset equals 73 today) — see Open Questions.
**Why it matters:** A visible numeric contradiction on the two pages social traffic lands on first. Counts are trust claims here.
**Proposed fix:** (1) Backfill geocoding for the 169 rows (`npm run geocode:listings` exists — `scripts/`); (2) until coverage is ~100%, label the map count honestly ("165 mapped") or show unmapped listings in a list-below-map; (3) consider deriving the hero stat from a single labelled helper so every count states what it counts.
**Effort:** S (labels) + M (geocode backfill/QA)
**Risk of fixing:** Geocoding errors put pins in wrong places — spot-check; the OneMap token (`ONEMAP_TOKEN`) path already exists.
**Blocks launch:** yes (labelling at minimum)

### [HIGH] F6 — Production appears to run an older deployment than this repo; the reported defects match pre-fix behaviour

**Location:** evidence: live `cron_runs` latest weekly-digest note (`6 listings, guide malay-wedding-cost-singapore`, 2026-07-16) does not match the note format current code writes (`app/api/cron/weekly-digest/route.ts:46` — `"N posts, N listings, broadcast …"`); the reported Feb/Mar-2026 events exactly match `lib/events-data.ts` mock seeds that current code never renders; observed hero "301+" matches a stale snapshot rather than live 324.
**What is wrong:** Multiple independent signals say the deployed site lags this codebase. If so, users are seeing bugs that are already fixed at HEAD — and no amount of further code fixing helps until deploys are verified.
**Why it matters:** The launch decision must be made against what production actually serves. Every audit conclusion above is about HEAD.
**Proposed fix:** Check the Vercel dashboard: which commit is the production deployment, when did it last deploy, is auto-deploy from `master` working. Redeploy HEAD, then re-verify the three reported symptoms on production (events page, hero count vs explore, card labels). The audit environment could not reach production URLs or the Vercel deployment API to do this.
**Effort:** S
**Risk of fixing:** None (verification + redeploy).
**Blocks launch:** yes

### 3.2 Trust & status presentation (brief §1.4)

### [HIGH] F9 — Hotel cards render a provider-derived "✓ Halal food" check without an inline qualifier

**Location:** `components/screens/travel/HotelCard.tsx:32-34` (flag chips); `lib/halal-hotels.ts:33,42-54` (`RX.halal = /\bhalal\b/i` over provider-supplied facility strings; `verified_by:'auto'` = unverified); `components/screens/travel/shared.tsx:36-45` (`HalalChip` — the "(unverified)" qualifier lives only in the *adjacent* chip's title/label)
**What is wrong:** A regex match on the hotel's own marketing copy becomes an affirmative green "✓ Halal food" on the card. The honest "Muslim-friendly facilities (unverified)" qualifier is a separate chip — a screenshot crop of the card asserts certification-grade fact from provider data. The module's own header (`lib/halal-hotels.ts:4-6`) states the principle correctly; the per-flag chip violates it.
**Why it matters:** Travel is where provider-supplied amenity data most needs visual separation from Humble Halal review and formal certification — the brief calls this out explicitly.
**Proposed fix:** When `verified_by === 'auto'`, render the flag as "Halal food (per hotel)" or use a hollow/grey glyph distinct from the verified ✓; keep the green check only for human-verified flags.
**Effort:** S
**Risk of fixing:** None meaningful.
**Blocks launch:** yes (cheap, and squarely the trust promise)

### [MEDIUM] F13 — Editorial copy twice equates "Muslim-owned + pork-free" with "fully halal"

**Location:** `lib/blog.ts:707` ("fully halal — either MUIS-certified or Muslim-owned and pork-free"), `lib/blog.ts:1893` (mookata "Muslim-owned … serve fully halal sets")
**What is wrong:** The site's own glossary treats Muslim-owned as an ownership axis and self-declared as uncertified; these sentences collapse that distinction into "fully halal".
**Why it matters:** An SEO-indexed page contradicting the platform's own taxonomy is quotable against the brand.
**Proposed fix:** Reword to the glossary labels ("MUIS-certified, or Muslim-owned (self-declared halal)").
**Effort:** S
**Risk of fixing:** None.
**Blocks launch:** no

Positive findings for §1.4 (no action): the numeric confidence score is never shown without its tier label anywhere (`components/halal-confidence-badge.tsx:36-49` leads with the label, number only in the expandable panel; cards show label-only pills); `aggregateRating` JSON-LD only with real reviews (`components/seo/json-ld.tsx:148`); `certSuffix()` keeps hub pages/llms.txt consistent with on-page tiers; the `/muis-halal-certified-directory` page models the honest MUIS-listed distinction correctly.

### 3.3 Data model & schema (brief §1.2) — live introspection results

Facts (live DB, 2026-07-22): `businesses` 380 rows (377 published, 3 suspended); `events` 4 rows (2 published — 1 expired test, 1 demo; 1 cancelled; 1 rejected); `claims` 1; `halal_certs` 0 rows; `analytics_events` 23,497; `cron_runs` 9,940.

- **Halal status is free text.** `businesses.halal_tier text` — no enum, no CHECK, no FK (`0002_directory.sql:26`). Live values: `muis` 197, `declared` 112, `community` 43, NULL 27, `pending` 1, plus runtime-only `muis-listed` and code-supported `admin`/`reported` (0 rows each). The four canonical brand labels do not map 1:1 to this taxonomy — "Muslim-Owned" is not a tier at all but an `attributes[]` regex match (`lib/directory.ts:30`). A third, unrelated taxonomy exists for `/is-halal` brand pages (`lib/halal-status.ts:14`).
- **Provenance columns do not exist.** No `status_source_url`, `status_checked_at`, `status_checked_by` anywhere. Nearest equivalents: `provenance jsonb` (only **10 rows** have `checked_at`/`website` keys; 292 rows are `source='spreadsheet'` imports with no retained source URL), `last_verified_at` (**NULL on 368/380**), append-only `verification_log` (0 rows). **This is the required feature gap the brief predicted — see Gap 1.**
- **Events end date:** none; single nullable `date_iso` (see F4).
- **RLS:** enabled on all 75 public tables. Live policies match the hardened migrations: anon read on `businesses`/`events` requires `status='published'` (`0029_audit_p0_security.sql:67-69`); trust columns are guarded against owner self-assertion by trigger (`guard_business_trust_columns`, `0029:15-60`); sensitive columns (`phone`, `contact_email`, `stripe_customer_id`, `owner_id`, `claimed_by`) are revoked from anon via column privileges (`0068`). Service-role key is server-only (`lib/supabase/server.ts:1,27-30`). **No anon overexposure found.** Note: the *public read path* (`getDirectory`/`getEvents`) uses the service-role client — RLS is bypassed by design there; the `status='published'` filter is applied in code (consistently, verified across all seams).
- **Confidence score:** stored `halal_score` int is **NULL on all 380 rows** and never read for display; the UI recomputes from tier+verification at render (`lib/halal-score.ts:70-97`). See F21.
- **Indexes:** `businesses` has only pkey/slug/postal/hawker partial; **no index on `status` or `halal_tier`**; `events` has only pkey/slug — no index on `status`/`date_iso`. Harmless at ~380 rows (F22, LOW).

### [MEDIUM] F17 — Live schema has drifted from repo migrations; migration history is untracked

**Location:** live `events_status_check` allows `'cancelled'`; repo `0001_init.sql:45` does not, and no migration widens it (the app writes it at `app/api/events/[id]/route.ts:116`); `supabase_migrations` history table is **empty** (`list_migrations` → none); `supabase/_ALL_MIGRATIONS.sql` monolith duplicates `migrations/0001-0078` (gaps: 0049–0051 missing, two `0077_*`)
**What is wrong:** Migrations are being applied out-of-band (SQL editor/psql) without recording history. At least one live constraint differs from the repo. The next person to run the migration folder against a fresh environment gets a schema that doesn't match production.
**Why it matters:** Phase 3 requires showing migrations before running them — that discipline is impossible without a trustworthy baseline.
**Proposed fix:** Diff live schema vs repo (start with `events` CHECK), commit a reconciliation migration, and adopt `supabase db push`/CLI-tracked migrations so history is recorded.
**Effort:** M
**Risk of fixing:** Reconciliation must be reviewed carefully — read-only diff first.
**Blocks launch:** no

### [MEDIUM] F18 — Test/demo rows live in the production events table; demo filtering is a title regex

**Location:** live rows `test-b68d` (published), `zz-test-event-qa-automated-please-delete-445d`, `community-iftar-demo` (published); filter: `lib/events-source.ts:100-103` (`/\(demo\)|\bdemo\b/i` on title/organiser)
**What is wrong:** QA/demo residue in production data, kept off the site only by an expired date, a `rejected` status, and a title regex. A real event titled "Demo Day for Muslim Founders" would be silently hidden by the same regex.
**Why it matters:** Fragile invisible filters on trust surfaces; the QA event literally asks to be deleted.
**Proposed fix:** Delete the three test rows (Phase 3, with approval); replace the regex with an explicit `source='seed'`/`is_demo` flag filter.
**Effort:** S
**Risk of fixing:** None (rows are test data; confirm before deleting per ground rules).
**Blocks launch:** no

### [MEDIUM] F19 — Ten "blocked" listings are still `status='published'` in the DB; the safety blocklist exists only in app code

**Location:** `lib/listing-safety.ts:9-24`; live check: all 10 slugs are `published`; consumed only via `lib/directory.ts:132,150,161`
**What is wrong:** Rows manually confirmed as closed/not-halal remain `published` at the data layer. Any query path that doesn't import `isBlockedFoodListing` (admin analytics, the `category_area_counts` view, future API consumers, direct PostgREST access) counts or exposes them.
**Why it matters:** These are the highest-stakes listings on the platform (confirmed non-halal evidence) protected by the weakest mechanism (a TS Set).
**Proposed fix:** Set the 10 rows to `status='suspended'` (RLS then hides them from anon too); keep the code blocklist as belt-and-braces. The audit-history rationale in the file comment survives — the rows aren't deleted.
**Effort:** S
**Risk of fixing:** `getGoneBusinessMeta` already handles non-published slugs for 301s (`lib/directory.ts:169-183`) — behaviour preserved.
**Blocks launch:** no (RLS + code filter currently hold on all public paths found)

### [MEDIUM] F20 — Supabase security-advisor items

**Location:** live advisors: 5 ERROR `security_definer_view` (`category_area_counts`, `v_organizer_rating`, `v_business_ratings`, `v_reviews_public`, `halal_verdicts_public`); 48 WARN SECURITY DEFINER functions executable by `anon`; `auth_leaked_password_protection` disabled; `pg_net` in public; 2 mutable `search_path` functions
**What is wrong:** The definer views expose only published/aggregate data (definitions verified) and the `admin_*` functions self-guard with `is_admin()` (sources verified: `admin_list_users`, `admin_summary`, `admin_set_lead_value`), so no live exposure was found — but each is one refactor away from one. Defense-in-depth: views should be `security_invoker`, and anon EXECUTE should be revoked where unneeded.
**Why it matters:** Hygiene now is cheaper than incident response during a launch spike.
**Proposed fix:** `ALTER VIEW … SET (security_invoker = true)` for the 5 views; revoke anon EXECUTE on `admin_*`; enable leaked-password protection; pin `search_path` on the 2 functions. Remediation links are in the advisor output.
**Effort:** S
**Risk of fixing:** Verify the views aren't read through PostgREST by anon clients before flipping invoker (repo grep found no app consumer of `category_area_counts`; `v_business_ratings` is read via service role in `lib/directory.ts:105` — unaffected).
**Blocks launch:** no

### [MEDIUM] F21 — Stored `halal_score` is written but never read; cron writes a number into a void

**Location:** `supabase/migrations/0002_directory.sql:27`; writer `app/api/cron/recheck-certs/route.ts:46`; no reader (`lib/directory.ts:23-95` never maps it); display recomputes via `lib/halal-score.ts:99-107`; Deno duplicate `supabase/functions/_shared/halal-score.ts` must be kept in sync by hand
**What is wrong:** Two sources of truth for the confidence score — a dead stored column (NULL on all 380 rows) and a runtime computation duplicated in a second runtime (Deno). The stored/displayed values can silently disagree.
**Proposed fix:** Drop the column (or make the computed score the thing that's persisted by one writer, if analytics need it). Extract the score/tier logic into one shared module consumed by both runtimes (see Gap 3).
**Effort:** S
**Risk of fixing:** Confirm nothing external (exports/BI) reads the column before dropping — nothing in-repo does.
**Blocks launch:** no

### 3.4 Query layer (brief §1.3)

The public read path is well-seamed: `lib/directory.ts` (`getDirectory`/`getListingBySlug`) and `lib/events-source.ts` (`getEvents`) are the only public `businesses`/`events` readers, both React-cached, and sitemap + llms.txt + SEO pages reuse them — so filters cannot drift between page, sitemap, and structured data. That is the main reason Defect B doesn't exist at HEAD. Inline `getSupabaseAdmin()` calls are confined to owner/admin/cron/checkout paths (~80 files) where per-row status filters are intentional.

Notes for the record: `select('*')` on wide tables in `getDirectory`/`getEvents`/`lib/hawker.ts:122` (acceptable at current scale; `d49173c`-era work already strips detail-only fields from the client payload in `app/layout.tsx:175-190`); all explore/map filtering is client-side over the ≤2000-row hydrated array — fine at 324 rows, a rework trigger at ~1000+; `.limit(2000)` (and hawker's 500) are silent caps that would masquerade as totals at scale — log/alert if `data.length === limit` (LOW, F23).

### 3.5 SEO & social metadata (brief §1.5)

Strong overall — verified: every route type emits title/description/canonical via `pageMeta()` (`lib/seo.ts:50-109`); only 3 intentionally-private routes lack metadata; `summary_large_image` Twitter cards everywhere; JSON-LD per route type is comprehensive (Organization+WebSite sitewide; LocalBusiness/Restaurant map on business pages; Event only for live upcoming events; ItemList/BreadcrumbList/FAQPage/Article as appropriate) with an XSS-hardened serializer (`components/seo/json-ld.tsx:21-29`); segmented sitemap is regenerated (ISR 3600) and quality-gated (published-only businesses, upcoming-only events, thin pSEO pages excluded via `seoPageIndexable()`, per-post noindex respected); `robots.ts` blocks plumbing + `/*?` and welcomes AI crawlers; `/explore` has a stable self-canonical and no paginated URL variants. No expired event can enter the sitemap or emit Event JSON-LD at HEAD (see F4 for the same-day/ISR caveat).

### [HIGH] F8 — Per-entity OG images are orphaned; most shares fall back to one generic card

**Location:** `lib/seo.ts:71-77` (`pageMeta` always sets `openGraph.images`, which suppresses Next's file-convention `opengraph-image.tsx`); orphaned routes: `app/business/[slug]/opengraph-image.tsx`, `app/blog/[slug]/opengraph-image.tsx`, `app/halal/[slug]/opengraph-image.tsx`, `app/halal-food/[location]/opengraph-image.tsx`, `app/passport/[token]/opengraph-image.tsx`; only `app/mosques/[slug]/page.tsx:49` wires its dynamic card as fallback correctly
**What is wrong:** The dynamic OG generators exist but are unreachable for most routes: `halal/`, `halal-food/`, `passport/` never pass `image` (always generic card); `business/`/`blog/` pass the entity photo but fall back to the *generic* card, not their dynamic card, when photoless.
**Why it matters:** Social launch = link previews. A distinctive per-listing card measurably lifts CTR; the code to render them is already written.
**Proposed fix:** Copy the mosques pattern: `image: l.image ?? \`${SITE.url}/business/${slug}/opengraph-image\`` per route (5 one-line changes), or delete the orphaned routes if generic-by-design.
**Effort:** S
**Risk of fixing:** OG image routes render at request time — sanity-check their output for listings with long names.
**Blocks launch:** no (a branded generic card exists) — do it in launch week anyway

Minor (LOW, F24): sitemap index stamps `new Date()` as every child's lastmod on each request (`lib/sitemaps.ts:392`) while children pin `STATIC_LASTMOD` — inconsistent freshness signalling. Bare `/halal-food` 404s but nothing links to it (F25, LOW).

### 3.6 Measurement (brief §1.6)

Verified healthy: GTM + Consent Mode v2, Vercel Analytics, first-party `analytics_events` store via `track_event` RPC mirrored to dataLayer (`lib/analytics.ts`), optional Meta CAPI/TikTok server events with shared-event-id dedup, GA4 Measurement Protocol for Stripe webhooks. **UTMs survive**: middleware never strips query strings; first-touch UTM+ref persisted to `hh_attr` cookie (`lib/attribution.ts:91-102`), snapshotted onto orders and forwarded to Beehiiv (`lib/beehiiv.ts:68-69`). Newsletter signup captures `source` → derived `intent` + `stage` end-to-end (`components/newsletter.tsx:49` → `/api/subscribe` → `beehiivSubscribe` custom fields). Instrumented conversions: listing view, save, contact/lead actions, newsletter signup, quote/lead submit, RSVP, checkout, purchase.

### [HIGH] F12 — Directions clicks are only partially instrumented

**Location:** tracked: `components/screens/consumer.tsx:1327,1407,1473,1664` (`logLead("directions")`); untracked: `consumer.tsx:1156,1180,1635,1685,1689,1915` (outlet rows, map cards, secondary buttons)
**What is wrong:** The single strongest offline-intent signal undercounts by an unknown factor because six secondary directions buttons fire no event.
**Why it matters:** Social ROI cases will be argued with this number.
**Proposed fix:** Route all six through the same `logLead("directions", …)` helper.
**Effort:** S
**Risk of fixing:** None.
**Blocks launch:** no (the DoD's "≥1 attributable downstream action" is already satisfied) — fix in launch week

### 3.7 Newsletter & digest (brief §1.7)

`/api/cron/weekly-digest` (read in full, 52 lines): auth-gates on `CRON_SECRET`; assembles newest-6 listings (unordered `slice(-6)` — `getDirectory` has no ORDER BY) + last-7-days posts into HTML; calls `beehiivBroadcast()`; logs to `cron_runs`; **catch swallows every error as `{ok:true, simulated:true}`** (`route.ts:49-51`). `beehiivBroadcast` sends **only if `BEEHIIV_BROADCAST_URL` is set** (`lib/beehiiv.ts:86-106`) — that var is not in `.env.example` (documented only in `docs/seo/multichannel-runbook.md:59-60`). Live evidence: 5 digest runs in `cron_runs`, none say "sent". Resend (`lib/email.ts` + ~35 templates) is the *transactional* path and is cleanly separated; the stale references are cosmetic-but-public: **`lib/legal-content.ts:250` tells users their data goes to "Resend and MailerLite (email)" — MailerLite is not integrated anywhere; Beehiiv, which actually receives subscriber emails, is not named** (also stale comment `lib/email.ts:5`).

### [HIGH] F10 — Privacy policy names a processor not in use and omits the one that is

**Location:** `lib/legal-content.ts:250`; `lib/email.ts:5`
**What is wrong / why it matters:** As above — a public, legally-relevant factual error about where subscriber PII goes (PDPA context).
**Proposed fix:** Replace "MailerLite" with "Beehiiv" in the privacy policy; fix the comment.
**Effort:** S · **Risk:** none · **Blocks launch:** yes (trivial)

### [HIGH] F11 — No canonical newsletter publishing path; digest has never sent; welcome flow contains placeholders

**Location:** `app/api/cron/weekly-digest/route.ts` (+ `vercel.json` cron Thu 09:00 UTC = 17:00 SGT); `lib/beehiiv.ts:86-106`; `docs/beehiiv-welcome-automation.md:13-17,49-63,95-98` (`<domain>`, `{{referral_url}}`, dead `(#)` link, dummy `@humblehalal.sg` Instagram link)
**What is wrong:** Two candidate publish paths exist (Beehiiv RSS-to-email off `/blog/feed.xml` per the code's own comment, and the cron broadcast via webhook), neither is live, and the welcome sequence is an unconfigured spec with placeholder links. `/api/subscribe` sets `send_welcome_email:true`, so new subscribers today get Beehiiv's default welcome or nothing.
**Why it matters:** The launch plan's "save this + subscribe" loop dead-ends; and if the welcome automation is set up hastily from the doc, placeholder links ship to real subscribers.
**Proposed fix:** Decide the canonical path (recommendation: **Beehiiv RSS-to-email** — no Enterprise API dependency, one system owns sending; then delete `beehiivBroadcast` + the cron per the brief's "deleted, not dormant" rule). Complete the Beehiiv dashboard automation from the doc with real URLs; verify `{{referral_url}}` renders on the paid-plan tier in use. **Vendor dependency to confirm:** Beehiiv API-triggered *broadcasts* (the webhook path) and some automation features are gated to higher/Enterprise tiers; subscription-create API (used by `/api/subscribe`) is available on standard paid tiers.
**Effort:** S (decision + dashboard) / S (code deletion in Phase 3)
**Risk of fixing:** Deleting the cron loses the "newest listings" digest section unless recreated as a Beehiiv template; acceptable.
**Blocks launch:** yes (decision + placeholder removal; the send itself can go live launch week)

### [MEDIUM] F14 — Digest swallows all errors as success; "newest listings" is unordered

**Location:** `app/api/cron/weekly-digest/route.ts:19,49-51`
**Proposed fix:** Return `ok:false` + log to `cron_runs` in catch; add `.order("created_at", …)` upstream or sort before `slice(-6)`. (Moot if the cron is deleted per F11.)
**Effort:** S · **Risk:** none · **Blocks launch:** no

### [MEDIUM] F15 — `crm-sync` cron runs every minute and has logged 9,506 consecutive no-ops

**Location:** `vercel.json` (`"* * * * *"`); live `cron_runs`: 9,506 runs, latest "claimed 0, delivered 0, failed 0"; `cron_runs` total 9,940 rows
**What is wrong:** A per-minute serverless invocation + DB insert doing nothing, 96% of the ops-log table is its noise, and real signals (like digest failures) drown.
**Proposed fix:** Drop to every 15 min (or event-trigger from `crm_outbox` inserts); stop logging no-op runs or prune `cron_runs` periodically.
**Effort:** S · **Risk:** CRM sync latency rises to the new interval — confirm acceptable · **Blocks launch:** no

### [MEDIUM] F16 — RSVP/checkout endpoints silently "succeed" against mock events

**Location:** `app/api/rsvp/route.ts:29,41-43,55-58` (`getEvent` from `lib/data.ts:545` = static mock list; returns `{ok:true, simulated:true}`); same pattern in `app/api/checkout/ticket`, `validate-promo`, `donate`
**What is wrong:** A POST for a mock-seed event id returns success and the user believes they RSVP'd; nothing links there publicly today, but the seeds share the codebase with launch traffic.
**Proposed fix:** Return 404/410 for non-DB events in production (`NODE_ENV` or a flag), keep simulated mode for dev only.
**Effort:** S · **Risk:** local dev flows that rely on simulation — gate, don't delete · **Blocks launch:** no

### 3.8 Destination health (brief §1.8)

Local production build: **succeeds** (Next 16.2.10, 827 static pages, 420 routes, zero errors — with Supabase unconfigured, i.e. empty-data mode). Route probe of 40 key destinations: all 200 except bare `/halal-food` (404, unlinked — F25). Caveats: with an empty DB every list renders its (well-designed) empty state, so a *content-full* crawl, mobile rendering, and CWV need either production access (blocked from this environment) or a local run with data. Mitigations that exist: extensive prior mobile audits with screenshots (`docs/audit/mobile-matrix-audit-2026-07.md` + `img/`), `.lighthouserc.json` budget config, `@vercel/speed-insights` live field data, and `next/image` everywhere I checked. **Open item:** run Lighthouse/crawl against production once reachable (or via Vercel preview) — listed in Open Questions. Local mock-mode note: nonexistent `/business/*`/`/events/*` slugs render 200 shells locally, but with `noindex` and only when Supabase is unconfigured; the production code path 404s (`app/business/[slug]/page.tsx` → `notFound()`).

### 3.9 Repository hygiene (brief §1.9)

Clean. `.git` = 12 MB (`size-pack` 10.96 MiB); no videos/audio/PSDs tracked; largest tracked files are audit screenshots (`docs/audit/img/mobile-matrix-2026-07/*.png`, ~4 MB total) and `package-lock.json`; `public/` ≈ 3.3 MB (webp/svg + 3 intentional PDF lead magnets). Secrets: only `.env.example` has ever been committed (verified via `git log --all --diff-filter=A -- '*.env*'`); values are empty; `.gitleaks.toml` present. Gaps: **F26 (LOW)** `.gitignore` covers `.env*` but has no `*.mp4/*.mov/*.wav/*.psd` patterns — add pre-emptively before social asset production starts; **F27 (LOW)** consider moving future audit screenshots out of the repo.

---

## 4. Open questions (recorded, not guessed)

1. **What exactly showed "73"?** No current count equals 73 (list = 324, map = 165, no category = 73). Need the URL/tab/filter state (or a screenshot) of the observation — leading candidates: the map tab at an earlier geocoding state, or a filtered session. Defect A's *structural* cause (unlabelled subset counts) stands regardless (F5).
2. **Which commit is production running, and when did it last deploy?** (F6). The Vercel MCP tools available here don't expose deployments; check the dashboard. Also confirm whether `NEXT_PUBLIC_PRELAUNCH` is set to `0` in production env.
3. **Where were the Feb/Mar 2026 events observed** (URL)? If on `/events` on production, F6's deployment-lag explanation is confirmed; if somewhere else (an email, a cached SERP, an OG scrape), different follow-up.
4. **Beehiiv plan tier** — which tier is the account on, and does it include automations with custom referral fields and (if ever wanted) API broadcasts? (F11 vendor dependency.)
5. **Is anything outside this repo reading `businesses.halal_score` or the `category_area_counts` view** (BI, exports)? Determines F21/F19 cleanup safety.
6. **Intended meaning of `halal_tier = NULL`** (27 rows) — pending triage, or genuinely unknown? Determines the F1 backfill target.
7. **Production Lighthouse/CWV run** — blocked from this environment; needs a run from anywhere with access, or grant the audit environment egress to `humblehalal.com`.

---

## 5. Phase 2 — Gap analysis (what doesn't exist yet)

| # | Gap | Exists today? | Blocks launch? | Effort |
|---|-----|--------------|----------------|--------|
| 1 | Status provenance fields | **No** — no `status_source_url/checked_at/checked_by`; `provenance` jsonb has data on 10/380 rows; `last_verified_at` NULL on 368/380 | **Yes for the "Checked Today" franchise**; site can launch without the franchise | M |
| 2 | Event lifecycle enforcement | **No** — start-date convention only (F4) | Yes (structural, cheap now) | M |
| 3 | Status label as shared component | **Partial** — `TIER_META` exists but labels duplicated in 6+ places + a Deno copy | No — fast-follow, prerequisite for F1/F2 done cleanly | M |
| 4 | Content export for social | **No** | No — needed before content production scales | S |
| 5 | Dynamic OG images | **Built but orphaned** (F8) | No | S |
| 6 | Save / collections | **Partial** — save exists (heart FAB, `/saved`, `track.save`) but is local-storage only; no accounts-synced collections/share | No | M |
| 7 | Directions/map tracking | **Partial** (F12) | No | S |
| 8 | Newsletter attribution | **Yes** — source/intent/stage wired end-to-end; verify each embedded form passes a distinct `source` | No | S |
| 9 | Correction & change log | **Partial** — cert-changes log exists (`lib/cert-changes.ts`, sitemap-gated until ≥10 events) but no general "we corrected X" public log | No | M |
| 10 | Structured-data completeness | **Mostly yes** — gap: real `endDate`, `eventStatus` mapping, same-day suppression (F4) | With F4 | S |

**Gap 1 — Provenance (the big one).** Sketch: add `status_source_url text`, `status_checked_at timestamptz`, `status_checked_by text` to `businesses`; backfill `status_checked_at` from `last_verified_at` where set; surface all three in the owner/admin listing editor (`components/owner/listing-editor.tsx`) as admin-only fields protected by the existing `guard_business_trust_columns` trigger (extend it to cover the new columns); render "Checked <date> · source" in `VerificationCard` and the trust-glance panel; require source URL whenever `halal_tier` is set to `muis`/`admin`. Until then, do not run "Checked Today" as a content franchise — the data cannot back it (12/380 rows have any check date). **M.**

**Gap 2 — Event lifecycle.** Per F4: `ends_at` column + NOT NULL + CHECK, filter on it, require on creation, JSON-LD `endDate`/`eventStatus`. Also delete the mock-event fallback in RSVP/checkout (F16) so the data layer is the only source of RSVP-able events. **M.**

**Gap 3 — One status glossary.** Create `lib/status-glossary.ts` exporting the tier/badge/label/tone/blurb table; consume from `lib/halal-score.ts`, `lib/data.ts` `badgeMeta`, `components/trust-glance.tsx`, `consumer.tsx` legend strings, `app/llms.txt/route.ts`, and generate the Deno `_shared/halal-score.ts` from it (build step or import once Deno function is bundled). Acceptance: one file to change a label everywhere, including structured data and llms.txt. **M.**

**Gap 4 — Social content export.** A `GET /api/admin/export/social` (admin-auth) returning per-listing JSON/CSV: name, status label (from the glossary), status source URL + checked date (Gap 1), destination URL, OG image URL, expiry (events). Until Gap 1 lands it can export what exists (tier, `last_verified_at`) with explicit nulls, so social production reads truth instead of retyping it. **S.**

**Gap 5 — OG wiring.** F8's five one-line changes. **S.**

**Gap 6 — Save/collections.** Saves live in local storage via app context; no server persistence, so saves are lost across devices and can't power "N people saved this". Sketch: `saved_places(user_id, business_id, created_at)` with RLS `user_id = jwt.sub`, sync-on-login merge, keep localStorage for anonymous. The primary-CTA loop works without it for launch (anonymous save works); build within the first weeks. **M.**

**Gap 7 — Directions instrumentation.** F12. **S.**

**Gap 8 — Attribution forms audit.** Enumerate `<Newsletter source=…>` usages and confirm distinct `source` per page type (the mechanism exists; this is a checklist pass). **S.**

**Gap 9 — Correction log.** Generalize the cert-changes model: a `corrections` table (or reuse `verification_log` with a `public` flag) + `/corrections` page listing "what changed, when, why, source"; link from footer. Backs the "Community Corrects the Map" franchise and the published correction promise. Feed it from `suggestions`/`reports` resolutions (tables already exist). **M.**

**Gap 10 — Structured data completeness.** With F4; plus map `status='cancelled'` → `EventCancelled` while within the event window. **S.**

**Additional gaps surfaced by the audit (not in the brief's ten):**
- **Geocoding backfill** — 169/334 listings unmapped (F5). **M.**
- **Deployment/migration discipline** — verify prod commit (F6); adopt tracked migrations (F17). **S/M.**
- **MUIS cert-number backfill programme** — 197 rows claiming the register with no cert number or source retained; this is the single largest honesty-debt item and the prerequisite for ever showing "MUIS Certified" unqualified (F3/Gap 1). **L** (data work, not code).
- **Cron observability** — digest error-swallow (F14), crm-sync noise (F15); a tiny `cron_runs` dashboard or alert on `ok:false`. **S.**

---

## 6. Verification appendix

- Live DB queries (all read-only `select`/catalog): row counts; `halal_tier`/`status` distributions; `muis_cert_no` null check (197/197); provenance jsonb key census (10/380 with `checked_at`); geocode coverage (165/334); blocked-slug status (10/10 published); events dump (4 rows); constraint + policy + index dumps (`pg_constraint`, `pg_policies`, `pg_indexes`); `cron_runs` job summaries; SECURITY DEFINER view definitions and `admin_*` function sources; Supabase security advisors (115 lints).
- Code verification: every file:line cited above was read directly in this audit (exploration agents' claims were independently re-verified for all CRITICAL/HIGH findings: `ui.tsx` card logic, `halal-score.ts` tier resolution, `directory.ts`/`events-source.ts` seams, `seo.ts` OG fallback, `weekly-digest` route, `rsvp` route, `listing-safety.ts`).
- Local build: `npm run build` → success, 827 pages; `npm run start` route probe (40 paths) — statuses recorded in §3.8.
- Not verified (environment limits): production HTML (network policy blocks `humblehalal.com`), production deployment commit, mobile/CWV on production, Beehiiv dashboard state.

*Phase 3 (remediation) has not been started, per the brief. Awaiting approval of the fix sequence proposed below.*

## 7. Proposed Phase 3 sequence (for approval — no work started)

1. **F10** privacy-policy processor fix (S, zero risk)
2. **F1+F2** card status labels — one change set (S)
3. **F3(a)** filter wording honesty (S)
4. **F9** hotel chip qualifier (S)
5. **F5** count labelling (S) — geocode backfill runs in parallel as data work
6. **F6** verify production deployment + redeploy + re-verify symptoms (S, ops)
7. **F11** newsletter decision + Beehiiv dashboard completion; delete the losing path (S code)
8. **F4/Gap 2** events `ends_at` migration (M — migration shown before running)
9. **F8** OG wiring (S) · **F12** directions events (S) · **F18** test-row cleanup (S, with approval) · **F19** blocked-row status flip (S)
10. Then MEDIUMs (F13-F17, F20-F21) and Gaps 1, 3, 4 as the next tranche.
