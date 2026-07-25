# Humble Halal — Full Codebase Audit (2026-07-25)

## Executive Summary

This audit of the Humble Halal directory (a Singapore halal-food site that makes **public halal-status claims** about food businesses) surfaced **31 confirmed or plausible findings**: **2 critical, 8 high, 12 medium, 9 low**. The dominant risk is a single recurring defect — the "MUIS-listed but no certificate on file" state (`muisUnbacked`) is silently upgraded to a definitive **"MUIS Certified"** claim on five surfaces that forgot the guard every other surface applies. The most severe of these reaches users through the **public AI concierge** (`/api/concierge`), which feeds the wrong tier to the model as ground truth; the same over-claim also appears on the map pin popup, the hawker finder, downloadable PDF guides, and the admin queue. A separate stale-claim path lets an **expired** MUIS certificate render as "MUIS Certified" for up to a week until a Monday cron runs. The second critical is an **accessibility keyboard trap**: a persistently-mounted notification bell steals focus on load and pins Tab/Shift+Tab, rendering the whole site keyboard-inoperable for signed-in users. High-severity findings cluster around halal-claim correctness, a broken mobile-drawer focus trap, an SEO structured-data mismatch on ~21 indexable cuisine pages, a heavy client payload (the full directory serialized into every route), and **zero test coverage on two load-bearing security/halal seams** (`rowToListing`, `isSafeEventRef`). Overall posture: the app has a well-designed `muisUnbacked`/`resolveTier` guard and a mature CI stack, but the guard is enforced by convention rather than by a single source of truth, so it has drifted on multiple surfaces and is unpinned by tests. Fixing the halal-tier single-sourcing and the two focus traps should be treated as launch-blocking.

## Findings at a glance

| Severity | Dimension | Location | Title | Verdict |
|---|---|---|---|---|
| Critical | halal-correctness | `app/api/concierge/route.ts:53` | AI concierge labels unbacked-MUIS listings "MUIS Certified" and feeds it to the model | CONFIRMED |
| Critical | accessibility | `components/notification-bell.tsx:29` | Notification bell steals focus and traps keyboard users | CONFIRMED |
| High | halal-correctness | `components/screens/consumer.tsx:859` | Map pin popup shows gold "MUIS-certified" chip for unbacked-MUIS listings | CONFIRMED |
| High | halal-correctness | `app/hawker/page.tsx:129` | Hawker Finder shows "MUIS" chip / "MUIS certified" for unbacked-MUIS stalls | CONFIRMED |
| High | stale-halal-claim | `lib/directory.ts:42` | Expired MUIS certificate still renders as "MUIS Certified" on every read path | CONFIRMED |
| High | accessibility | `components/chrome.tsx:502` | Mobile nav drawer declares `aria-modal` but has no focus trap or initial focus | CONFIRMED |
| High | structured-data | `components/screens/misc.tsx:1061` | Cuisine pSEO FAQPage JSON-LD doesn't match visible FAQ; authored cuisine body never renders | CONFIRMED |
| High | client-payload | `app/layout.tsx:199` | Entire business directory (≤2000 rows) serialized into every route's client payload | CONFIRMED |
| High | test-gap | `lib/directory.ts:42` | `rowToListing` — the DB→Listing halal-claim seam — has zero tests | CONFIRMED |
| High | test-gap | `lib/event-ref.ts:10` | PostgREST `.or()` injection guard `isSafeEventRef` is untested | CONFIRMED |
| Medium | halal-correctness | `scripts/build-guides.tsx:101` | Downloadable PDF guides label any muis-badged listing "MUIS Certified" | PLAUSIBLE |
| Medium | rate-limiting-dos | `app/api/travel/concierge/route.ts:29` | AI travel concierge accepts an unbounded `messages` payload | PLAUSIBLE |
| Medium | error-handling/cron | `app/api/cron/recheck-certs/route.ts:46` | Sole cert-expiry enforcer ignores its own UPDATE errors, reports success on failure | PLAUSIBLE |
| Medium | halal-correctness | `lib/halal-hotels.ts:46` | Hotel halal/alcohol auto-flags false-positive on "non-halal" and "not alcohol-free" | PLAUSIBLE |
| Medium | accessibility | `components/screens/event-manage.tsx:278` | Attendee filter/search controls have no accessible name | PLAUSIBLE |
| Medium | server-waterfall | `lib/directory.ts:136` | `getDirectory()` runs businesses then ratings query serially on every page | PLAUSIBLE |
| Medium | image-optimization | `lib/img.ts:29` | Blog/mosque/author/brand images forced `unoptimized` on a stale Hobby-quota rationale | PLAUSIBLE |
| Medium | font-loading | `app/layout.tsx:139` | Four route-specific font families (incl. Arabic Amiri) preloaded on every page | PLAUSIBLE |
| Medium | test-gap | `lib/admin-auth.ts:78` | Admin gate (`isAdminOrUnconfigured` / `requireAdmin` MFA) has no tests | PLAUSIBLE |
| Medium | test-gap | `lib/halal-score.ts:64` | `resolveTier` nopork branch and bare-confirms→community transition untested | PLAUSIBLE |
| Medium | test-gap | `app/api/admin/verify/route.ts:116` | `cert_new` vs `cert_renewed` selection is inline, already divergent, and untested | PLAUSIBLE |
| Medium | test-gap | `lib/event-auth.ts:46` | Owner/admin authorization `authoriseEventManager` is untested | PLAUSIBLE |
| Low | halal-correctness | `components/screens/admin.tsx:1253` | Admin verification queue shows "MUIS verified" pill for unbacked-MUIS businesses | PLAUSIBLE |
| Low | rate-limiting-quota | `app/api/travel/flights/airports/route.ts:9` | Airport autocomplete proxies paid LiteAPI with no rate limit and no caching | PLAUSIBLE |
| Low | timezone | `lib/prayer.ts:30` | Prayer-time date built from server-local (UTC) fields for non-SG hotel locations | PLAUSIBLE |
| Low | correctness/quota | `lib/lead-routing.ts:160` | `remainingQuota` counts accepted leads from epoch when `current_period_start` is null | PLAUSIBLE |
| Low | correctness | `lib/hours.ts:74` | Dead ternary in `openStatus` and missing close-time on overnight-spill open state | PLAUSIBLE |
| Low | accessibility | `components/chrome.tsx:322` | Onboarding region picker uses `role=tablist/tab` without the tabs pattern | PLAUSIBLE |
| Low | accessibility | `components/halal-confidence-badge.tsx:88` | Halal-status ring label can fail contrast for the gold (admin) tier | PLAUSIBLE |
| Low | canonical/indexability | `app/keystatic/[[...params]]/page.tsx:1` | Robots-blocked utility routes inherit `canonical="/"` and lack explicit `noindex` | PLAUSIBLE |
| Low | render-blocking-css | `app/layout.tsx:13` | ~306KB of render-blocking CSS on every route; `ota.css` serves only travel verticals | PLAUSIBLE |

**Root-cause clusters (not duplicates — distinct code locations):**
- **Unbacked-MUIS over-claim** (missing `muisUnbacked`/`verify.certNo` guard on the `muis` badge): concierge (Critical), map popup (High), hawker (High), PDF guides (Medium), admin queue (Low). All share one fix: single-source the tier from `lib/halal-score`.
- **`useDialog` focus mismanagement** (hook silently depends on `onClose` identity and whether the ref target exists at mount): notification bell (Critical), mobile drawer (High).
- **`lib/directory.ts` / root-layout payload**: full-directory serialization (High), serial ratings waterfall (Medium), plus the expired-cert read path (High) and its enforcing cron (Medium).

---

## Critical

### C1 — AI concierge labels unbacked-MUIS listings "MUIS Certified" and feeds it to the model as ground truth
**Location:** `app/api/concierge/route.ts:53` (written to `compact[].halal_tier` at line 113, injected into the model prompt at line 128) · **Verdict: CONFIRMED**

**Why it matters.** `tierOf()` returns `"MUIS Certified"` whenever `l.badges.includes("muis")`, with **no** check for a certificate on file (`verify.certNo`). The value is written into the model's ground-truth context and the system prompt (lines 122–127) explicitly instructs the model to state the tier and to "never assert a place is halal-certified beyond its stated `halal_tier`." Because the floor itself is wrong, the AI authoritatively tells the user a place is MUIS-certified. The sibling implementation `lib/concierge-agent.ts:16` guards this exact branch with `&& l.verify?.certNo`, and the canonical `resolveTier()` (`lib/halal-score.ts:55-60`) returns `"muis-listed"` (not certified) unless a cert number is present — proving this is drift, not policy. This defeats the entire purpose of the `muisUnbacked` guard.

**Failure scenario.** A `businesses` row has `halal_tier='muis'` and `muis_cert_no=NULL` (tagged MUIS on import/claim before the cert number is recorded, or after a cert lapses). `rowToListing()` yields `badges=['muis']`, `verify.certNo=null`. A user POSTs `/api/concierge` "halal nasi padang in Tampines". `tierOf()` returns `"MUIS Certified"` → sent to the model → the concierge tells the user the place is MUIS Certified, while every other surface (card pill, detail VerificationCard, poster, OG, JSON-LD) shows "MUIS-listed / not certified." A Muslim user relies on a certification that is not on file.

**Fix direction.** Mirror `lib/concierge-agent.ts:16`: gate the muis branch on `verify?.certNo`. Better: single-source all concierge tiers from `lib/halal-score` (`scoreListing().label` + `muisUnbacked`) so this string can never drift from `resolveTier` again. (Note: `tierOf` feeds the model only on the AI path, which requires `aiConfigured`; the no-AI fallback at lines 96–108 doesn't use it. This narrows *when* the bug fires but not *whether* — the AI path is the intended production path.)

### C2 — Notification bell steals focus on load and traps keyboard users
**Location:** `components/notification-bell.tsx:29` (focus/trap logic in `useDialog`, `components/ui.tsx:798-816`) · **Verdict: CONFIRMED** · WCAG 2.1.2 (No Keyboard Trap), 3.2.1 (On Focus)

**Why it matters.** `useDialog(ref, useCallback(() => setOpen(false), []))` is called **unconditionally**, with no `open` guard, on a component whose wrapper `<div>` and trigger `<button>` are always in the DOM. `NotificationBell` is persistently mounted for every signed-in user (`chrome.tsx:447` desktop, `chrome.tsx:539` mobile). `useDialog`'s effect has stable deps `[ref, onClose]` (a `useRef` + an empty-dep `useCallback`), so it runs once at mount and never tears down: line 798 focuses the first focusable inside the wrapper (the bell), and the document-level keydown handler — when the menu is closed the bell is the only focusable, so `first === last` — `preventDefault`s both Tab and Shift+Tab and re-focuses the bell.

**Failure scenario.** A signed-in keyboard or screen-reader user loads any page. After hydration, focus jumps unbidden to the "Notifications" header button. Tab and Shift+Tab do nothing — focus is pinned to the bell — so the user can never reach navigation or content by keyboard. Escape only fires `onClose` on an already-closed menu; it does not release focus. The site becomes keyboard-inoperable for logged-in users.

**Fix direction.** Engage the trap only while the popover is open: render the `useDialog`-bearing subtree conditionally (inner component calling `useDialog` only when `open`), or gate the hook on `open`. Scope the trap to the popover element rather than `document`, place initial focus only on open, restore focus on close, and never `preventDefault` Tab when there is a single focusable. Add `aria-haspopup="menu"` to the trigger. (Shared root cause with H4.)

---

## High

### H1 — Map pin popup shows a gold "MUIS-certified" chip for unbacked-MUIS listings
**Location:** `components/screens/consumer.tsx:859` (rendered as `hh-popchip-halal` in `components/map/leaflet-map.tsx:283`) · **Verdict: CONFIRMED**

**Why it matters.** `listingPopup()` sets `badge='MUIS-certified'` whenever `l.badges.includes('muis')`, ignoring `muisUnbacked` — which is already imported at line 15 and used correctly elsewhere in the same file (e.g. lines 1779, 2250). The popup object is spread into map points on both the `/explore` preview (line 883) and the full `/map` screen (line 1040). The card copy downgrades this state to "MUIS-listed" (`components/ui.tsx:386/434`), so the map contradicts the card and the computed tier.

**Failure scenario.** Same data state (`halal_tier='muis'`, `muis_cert_no=NULL`). A user opens `/map` or the explore map, taps the pin, and sees a gold "MUIS-certified" chip (a definitive certification claim) while the listing card and detail page for the same business show "MUIS-listed" / "certificate not yet on file."

**Fix direction.** Guard the muis branch with the already-imported `muisUnbacked`: `l.badges.includes('muis') && !muisUnbacked(l) ? 'MUIS-certified' : l.badges.includes('muis') ? 'MUIS-listed' : …`.

### H2 — Halal Hawker Finder shows "MUIS" chip and "MUIS certified" for unbacked-MUIS stalls
**Location:** `app/hawker/page.tsx:120` (chip), `:129-130` (label) · **Verdict: CONFIRMED**

**Why it matters.** The popular-stalls carousel renders `<span className="hk-stall-muis">MUIS</span>` and the foot label "MUIS certified" purely on `stall.badges?.includes('muis')`, with no `muisUnbacked`/`verify.certNo` guard. `getPopularStalls()` builds stalls via `rowToListing` (`lib/hawker.ts:128`), so a stall row with `halal_tier='muis'` and no `muis_cert_no` becomes `badges=['muis']`, `verify.certNo=null` and is presented as MUIS certified — stronger than its own `resolveTier` "muis-listed" tier. The live import script `scripts/upsert-breakfast-directory.ts:27` sets `halal_tier:"muis"` from a business's self-claim with no cert number, so this state is reachable in production.

**Failure scenario.** A hawker stall is published with `halal_tier='muis'` but no certificate number. On `/hawker` it appears in "Popular halal hawker stalls" with a "MUIS" badge and "MUIS certified" text, even though its own `/business/[slug]` page shows "MUIS certificate not yet on file" and no verified badge.

**Fix direction.** Import `muisUnbacked` and show the MUIS chip / "MUIS certified" only when `!muisUnbacked(stall)`; otherwise "MUIS-listed" (or the community-verified copy). Reuse `certSuffix()` to keep the label single-sourced.

### H3 — Expired MUIS certificate still renders as "MUIS Certified" on every read path
**Location:** `lib/directory.ts:42` (and `verify` object, lines 88–94) · **Verdict: CONFIRMED**

**Why it matters.** `rowToListing` derives `certified`/badge/tier purely from `businesses.halal_tier` and never compares `muis_expiry` to now. `verify.expiringSoon` is never populated, so the render-time `scoreListing()`/`HalalConfidenceBadge` (which recompute rather than read the stored `halal_score`) never apply the −8 expiry penalty, and the schema.org `hasCredential` "Halal Certification" block (`components/seo/json-ld.tsx:158`) is emitted whenever `certified && verify.certNo`, also with no expiry check. The **only** thing that downgrades an expired cert is the weekly `recheck-certs` cron (`vercel.json: "0 3 * * 1"`) — see M3, which itself can fail silently.

**Failure scenario.** A business has `halal_tier='muis'`, `muis_cert_no` set, `muis_expiry='2026-07-24'` (yesterday). On 2026-07-25 its `/business/[slug]` page, confidence badge (score ~94, tier "muis"), `certSuffix` ("MUIS certified"), and the JSON-LD credential ingested by Google/AI assistants all assert active MUIS certification. It stays wrong for up to ~7 days until the next Monday cron run — a wrong halal claim shown to users for a week.

**Fix direction.** Compute expiry at read time: set `verify.expiringSoon` (and treat past-expiry as not-certified) by comparing `muis_expiry` to `Date.now()`, or have `scoreListing()`/`certified` honour an expired `muis_expiry` directly so badge, `certSuffix`, and JSON-LD degrade the instant a cert lapses.

### H4 — Mobile nav drawer declares `aria-modal` but has no focus trap or initial focus
**Location:** `components/chrome.tsx:501-502` (drawer `<aside>` at line 561; `useDialog` in `components/ui.tsx:788-822`) · **Verdict: CONFIRMED** · WCAG 2.4.3 (Focus Order)

**Why it matters.** `MobileBar` is persistently mounted and calls `useDialog(ref, close)` with a **stable** `useCallback` `onClose`. The effect (deps `[ref, onClose]`, both stable) runs once at mount, when the drawer `<aside ref={ref}>` is not rendered (it's gated on `open`). `useDialog` captures `node = ref.current = null` (`ui.tsx:790`) and never re-runs, so `focusables()` always returns `[]` — no control is focused when the drawer opens and the Tab handler no-ops. The `role="dialog" aria-modal="true"` drawer provides zero keyboard focus management. (`NewsletterPopup` works only by accident: it passes an unstable inline `onClose` that re-runs the effect each render.)

**Failure scenario.** On a phone, a keyboard/switch-access user taps the burger. Focus stays on the burger behind the overlay; the first menu link is never focused. Tabbing walks the drawer links, then continues into the still-visible page content behind the open drawer with no wrap — the modal doesn't behave modally, and the user can operate hidden background controls.

**Fix direction.** Mount the trap only while open (conditional child/hook), or add `open` to the effect deps and read `ref.current` live instead of capturing `node` once. Move focus to the drawer's first control on open, restore to the burger on close. Root cause shared with C2.

### H5 — Cuisine pSEO pages: FAQPage JSON-LD doesn't match visible FAQ, and authored cuisine body never renders
**Location:** `components/screens/misc.tsx:1061` (visible FAQ at `:1082/:1223`; JSON-LD via `app/halal/[slug]/page.tsx:71` → `lib/seo-pages.ts:314`) · **Verdict: CONFIRMED**

**Why it matters.** `SeoScreen` derives body content from `categoryContent(page.catId)`. Cuisine pages have no `catId` (only `cuisineId`), so `categoryContent(undefined)` returns the generic `AREA_CONTENT` (`lib/category-content.ts:294`), whose 2-question FAQ is what users see. But the route emits `faqJsonLd(seoFaqItems(p))`, and `seoFaqItems` special-cases cuisine (`if (page.cuisineId) return cuisineContent(page.cuisineId).faq`) — returning 4 cuisine-specific Q&As. The FAQPage markup therefore advertises questions absent from the DOM, violating Google's rule that structured-data content be visible on the page (spammy-structured-data / manual-action risk). The same defect suppresses the authored cuisine `lookFor`/`considerations`, so the What-to-look-for/considerations/FAQ sections are byte-identical across all ~21 indexable cuisine pages (`kind 'cuisine'` is not gated by `seoPageIndexable`, `lib/seo-pages.ts:184-185`). (Honest caveat: `page.intro` *is* cuisine-specific, so pages are not fully byte-identical — only the three named sections are.)

**Failure scenario.** Googlebot fetches `/halal-sushi-singapore`. The HTML shows 2 generic FAQ items, but the inline `FAQPage` JSON-LD declares 4 sushi-specific Q&As not in the DOM. Rich Results Test flags a content mismatch; Search Console can issue a spammy-structured-data manual action and drop FAQ eligibility. Simultaneously, `/halal-sushi-`, `/halal-japanese-`, and `/halal-ramen-singapore` serve identical body sections, so the cluster reads as thin/duplicate.

**Fix direction.** Resolve content by cuisine first: `const content = page.cuisineId ? cuisineContent(page.cuisineId) : categoryContent(page.catId)`, mirroring `seoFaqItems` precedence. Add a test asserting the FAQ `SeoScreen` renders deep-equals `seoFaqItems(page)` for every page in `allSeoPages()`.

### H6 — Entire business directory (up to 2000 rows) serialized into every route's client payload
**Location:** `app/layout.tsx:199` (`getDirectory()` = `.select("*").limit(2000)` at `lib/directory.ts:126`) · **Verdict: CONFIRMED**

**Why it matters.** The single root layout awaits `getDirectory()` and hands the whole array to `DirectoryProvider`, a client component. Anything passed into a client provider in the root layout is serialized into the RSC/HTML of **every** route — including SEO landing pages and blog posts that render none of the directory. The layout only trims ~11 fields per row (lines 175–190) and keeps name/blurb/tags/photos/coords/verify/badges/etc., so the full row set still ships and scales toward the 2000-row cap. The layout's own comment (lines 164–166) acknowledges the serialization.

**Failure scenario.** With ~1500 published businesses (~500–700 bytes each serialized), a reader landing on `/blog/what-is-halal-singapore` or `/privacy` downloads and JSON-parses ~0.8–1.5 MB of business data (~150–250 KB gzipped) the page never displays, inflating HTML transfer, hydration, and TBT and pushing back LCP on exactly the organic-entry pages. (Byte figures are estimates; the mechanism is confirmed.)

**Fix direction.** Stop providing the full directory from the root layout. Fetch it only inside `/explore`, `/map`, `/search`, or provide a slug-only lightweight index from the root and lazy-load full records on demand. Server SEO/detail pages already read `getDirectory()` directly.

### H7 — `rowToListing` — the DB→Listing halal-claim seam — has zero tests
**Location:** `lib/directory.ts:42` (badges line 28, `certBody` line 87, `verify.certNo` line 89) · **Verdict: CONFIRMED**

**Why it matters.** `rowToListing` is the single mapping that turns a raw `businesses` row into the `Listing` shape from which **every** public halal claim is computed (`certSuffix`, `muisUnbacked`, `scoreListing`, JSON-LD, OG image, poster, llms.txt). Its load-bearing invariant is unpinned: a `halal_tier="muis"` row with `muis_cert_no=null` must yield `certified=true, badges=["muis"], verify.certNo=null` so downstream renders "MUIS-listed" and never "MUIS Certified". No test imports `directory.ts` at all (verified across `tests/` and `e2e/`; `smoke.spec.ts` is `test.skip`'d without seeded Supabase).

**Failure scenario.** A refactor drops the `"muis"` badge push at line 28 while leaving `certified=true` and `certBody="MUIS"`. A register-only business (`muis_cert_no=null`) then flips `muisUnbacked` to false, so `certSuffix` returns "MUIS certified" — a wrong halal claim shipped to `/business/[slug]`, its OG image, JSON-LD, and llms.txt. Every unit test still passes. (Honest note: the finding's *first* example — changing line 42 to `certified = tier==="muis" && !!r.muis_cert_no` — is misanalyzed; that produces an under-claim, not an over-claim. The badge-drop example fully substantiates the harm.)

**Fix direction.** Add `tests/unit/directory.test.ts` asserting `rowToListing` output for the four tier rows (muis+cert, muis+no-cert, admin, pending/empty): check `badges`, `certified`, `certBody`, `halalTier`, `verify.certNo`, and assert `certSuffix(rowToListing(row)) === "MUIS-listed"` for the unbacked-MUIS row and `"MUIS certified"` only when `muis_cert_no` is present.

### H8 — PostgREST `.or()` injection guard `isSafeEventRef` is untested
**Location:** `lib/event-ref.ts:10` (regex `/^[A-Za-z0-9_-]{1,64}$/`) · **Verdict: CONFIRMED**

**Why it matters.** `isSafeEventRef` is the **only** defense stopping an attacker-controlled event ref from injecting extra OR conditions into the raw `.or(\`id.eq.${ref},slug.eq.${ref}\`)` filters used by `event-auth.ts:36` (owner-route authorization), plus `donate/route.ts:38`, `rsvp/route.ts:50`, `join-request/route.ts:26`, `checkout/ticket/route.ts:64`, and `validate-promo/route.ts:26`. Because PostgREST parses `.or()` strings as unparameterized filter expressions, this regex is the sole injection defense for cross-org manager auth and payment routes. A grep across `tests/`/`e2e/` returns zero matches. (The current code is correct and consistently applied — the risk is a future regression shipping with green CI.)

**Failure scenario.** Someone loosens the regex to allow dotted slugs (adds `.`/`,`). An attacker POSTs `eventId="x,id.gte.0"`; the `.or()` filter now matches every event row, so `authoriseEventManager` resolves an arbitrary event and a non-owner gains manager access to another org's promo codes, ref codes, and marketing/lead PII (and donate/rsvp attach to the wrong event).

**Fix direction.** Add `tests/unit/event-ref.test.ts`: accept a mock id, a UUID, a hyphen slug; reject `""`, a 65-char string, and any ref containing comma/dot/paren/space/percent. Explicitly assert `isSafeEventRef("x,id.gte.0") === false`.

---

## Medium

### M1 — Downloadable PDF guides label any muis-badged listing "MUIS Certified"
**Location:** `scripts/build-guides.tsx:101` · **Verdict: PLAUSIBLE**

`halalTag()` returns `{ text: 'MUIS Certified' }` for any `badges.includes('muis')` with no `verify.certNo`/`muisUnbacked` guard. `npm run guides` renders these into `public/guides/*.pdf` served as downloadable artifacts. Currently latent because the seed's muis listings carry cert numbers, but the helper over-claims the moment it runs against real directory rows (which include register-listed places without a recorded cert number).

**Failure scenario.** The script is re-run sourcing the live directory (or a seed row with `halal_tier='muis'` and no cert number is added). The generated PDF prints a green "MUIS Certified" tag next to a register-listed-only place, and that PDF is distributed as an authoritative guide.

**Fix direction.** Thread the listing's `verify`/`certNo` into `halalTag` and downgrade to "MUIS-listed" when the certificate is absent — reuse `certSuffix()`/`muisUnbacked()`. (Same root cause as C1/H1/H2.)

### M2 — AI travel concierge accepts an unbounded `messages` payload
**Location:** `app/api/travel/concierge/route.ts:29` · **Verdict: PLAUSIBLE**

The most expensive public endpoint — an unauthenticated tool-loop agent fanning out into LiteAPI hotel/flight searches **and** paid LLM calls per turn — only does `if (!Array.isArray(messages))` and forwards `messages` straight into `createAgentUIStreamResponse` with no length/byte cap. Its sibling `app/api/concierge/chat/route.ts:44-45` deliberately caps input (`messages.length > 40` → 413; serialized `> 24_000` → 413). The per-IP rate limit (20/min) bounds request count, not per-request cost.

**Failure scenario.** An attacker POSTs a multi-megabyte `messages` array. Each request (up to 20/min/IP, unlimited across rotated IPs) pushes the whole transcript into the tool-loop agent, running up Anthropic + LiteAPI cost with no per-request ceiling — the exact cost-DoS already blocked on `/api/concierge/chat`.

**Fix direction.** Before `createAgentUIStreamResponse`, mirror the `concierge/chat` guards: reject empty arrays, cap turn count (`> 40` → 413) and serialized size (`> ~24_000` → 413).

### M3 — Sole cert-expiry enforcer ignores its own UPDATE errors and reports success on failure
**Location:** `app/api/cron/recheck-certs/route.ts:46` · **Verdict: PLAUSIBLE**

Pass 1 does `await sb.from('businesses').update({halal_tier:'pending',…}).eq('id',b.id)` without checking the returned error, then increments `flagged` and logs `cron_runs` `ok:true` regardless of whether the downgrade persisted. The outer try/catch returns `{ok:true, simulated:true}`, so Vercel Cron sees HTTP 200 even on total failure, with no alert. This is the enforcement mechanism H3 depends on.

**Failure scenario.** If the `businesses` UPDATE persistently fails (transient DB error, a constraint/permission issue during a migration), expired MUIS certs are never downgraded, yet the cron keeps reporting success and returns `ok:true` — so expired certs display as "MUIS Certified" indefinitely with zero operator signal.

**Fix direction.** Check the error from each update/insert; on failure do NOT count it as flagged, set `cron_runs` `ok:false` with the error, and make the outer catch return non-200 (or record `ok:false`) so a failing run is visible.

### M4 — Hotel halal/alcohol auto-flags false-positive on "non-halal" and "not alcohol-free"
**Location:** `lib/halal-hotels.ts:46` · **Verdict: PLAUSIBLE**

`deriveHotelFlags` uses `/\bhalal\b/i` for `halal_food_onsite`/`nearby`; the hyphen in "non-halal" is a word boundary, so the pattern matches the negated phrase. `RX.alcohol_free` (`/alcohol[-\s]?free/`) likewise matches inside "not alcohol-free". These feed `hotelHalalScore` (+22 onsite, +15 alcohol_free) and the user-facing `FLAG_LABELS` badges.

**Failure scenario.** A hotel whose LiteAPI facilities include "Non-halal buffet restaurant" (no human overlay) is shown with a "Halal food on-site" badge and a score inflated by 22 points — a wrong halal-related claim (even if marked `verified_by:'auto'`). "not alcohol-free" gets an "Alcohol-free" badge.

**Fix direction.** Add a negation guard (reject matches preceded by "no", "non-", "not", "without") or require a positive phrase ("halal certified", "halal food", "halal restaurant") and exclude "non-halal"; anchor `alcohol_free` so it doesn't match "not alcohol-free".

### M5 — Attendee filter/search controls have no accessible name
**Location:** `components/screens/event-manage.tsx:277-281` · **Verdict: PLAUSIBLE** · WCAG 1.3.1, 4.1.2, 3.3.2

The status filter `<select>` (line 278) and ticket-tier filter `<select>` (line 281) have no `<label>`/`aria-label`/`aria-labelledby`, and the search `<input>` (line 277) conveys purpose only via placeholder (not an accessible name). The consumer filters in `consumer.tsx` (1119/1123/1127) correctly use `aria-label`, so this is an inconsistent gap.

**Failure scenario.** A screen-reader organiser hears "combo box, All statuses" and "combo box, All tiers" with no indication of what each filters, and "edit text, blank" for search — they cannot distinguish the two filters or know the field searches by name/email.

**Fix direction.** Give each control an `aria-label` ("Filter by status", "Filter by ticket tier", "Search attendees by name or email") or a wrapping/associated `<label>`; keep placeholders as supplementary hints.

### M6 — `getDirectory()` runs businesses query then ratings query serially
**Location:** `lib/directory.ts:126` then `:136` · **Verdict: PLAUSIBLE**

`getDirectory()` awaits the businesses query, then separately awaits `ratingsBySlug(sb)`, which only needs the client handle — so two independent queries run as a serial waterfall. Because `getDirectory()` is called from the root layout, this extra round-trip is paid on the server render of every page (the `Promise.all` in `layout.tsx` parallelizes the six top-level reads but can't see inside this function).

**Failure scenario.** On every request the server issues the 2000-row `select businesses` (all columns incl. jsonb photos) and only after it resolves fires `select v_business_ratings`, adding ~1 DB RTT to TTFB on all routes.

**Fix direction.** Issue both together: `const [{data,error}, ratings] = await Promise.all([sb.from('businesses')…limit(2000), ratingsBySlug(sb)])`, then overlay ratings onto the mapped listings.

### M7 — Blog/mosque/author/brand images forced `unoptimized` on a stale Hobby-quota rationale
**Location:** `lib/img.ts:28-33` · **Verdict: PLAUSIBLE**

`isUnoptimizedImageSrc()` returns true for any src starting with `/blog/`, `/mosques/`, `/authors/`, `/brands/`, justified by a comment claiming these route through `/_next/image` which "returns HTTP 402 while the Hobby optimizer quota is exhausted." But the file's own header (lines 10–14) states the project is now on Vercel Pro with the quota restored. The blog hero (`app/blog/[slug]/page.tsx:135`) is rendered with `priority` (the LCP element on the blog SEO surface) and, with `unoptimized`, emits a single full-size WebP and no responsive srcset.

**Failure scenario.** A phone on 4G opening a blog post downloads the full ~178 KB desktop hero as its LCP resource instead of a ~640px variant (~40–60 KB), delaying LCP on the dominant mobile audience for these organic pages.

**Fix direction.** Remove the relative-path branch (or gate it behind an env flag that is off on Pro) so `/blog`, `/mosques`, `/authors`, `/brands` route through `next/image` again.

### M8 — Four route-specific font families (incl. Arabic Amiri) preloaded on every page
**Location:** `app/layout.tsx:106-144` · **Verdict: PLAUSIBLE**

The root layout instantiates six `next/font` families; only Spectral and Hanken render by default. Newsreader is used only by `/blog`, Amiri (`--font-quran`) only by `/tools`, and Cormorant/Libre Caslon only if a visitor opts in via the tweaks panel. `next/font` defaults to `preload:true`, so all six woff2 files are preloaded as high-priority requests on every route, competing with the LCP resource — including the Arabic Amiri face on English-only pages.

**Failure scenario.** On the homepage (which uses only Spectral + Hanken) the browser still issues high-priority preloads for Cormorant (3 weights), Libre Caslon (2), Newsreader (4), and Amiri — several hundred KB of font fetches contending with the hero image, delaying LCP, while none of those faces render.

**Fix direction.** Set `preload:false` on cormorant/libreCaslon/newsreader/amiri (keep Spectral + Hanken preloaded); better, move Amiri into `app/tools` and Newsreader into `app/blog`, matching the existing route-scoping pattern.

### M9 — Admin gate (`isAdminOrUnconfigured` / `requireAdmin` MFA) has no tests
**Location:** `lib/admin-auth.ts:78` (prod-deny branch line 80; MFA parsing lines 24–38) · **Verdict: PLAUSIBLE**

`requireAdmin` gates 39 admin API routes including the halal cert grant (`/api/admin/verify`, `/api/admin/cert`). `isAdminOrUnconfigured` encodes security rule M1 (unconfigured backend must DENY in production, may allow only in dev), and `requireAdmin`'s MFA path fails **open** on a Clerk error. Neither the prod-deny branch nor the MFA claim parsing/fail-open is tested.

**Failure scenario.** A refactor drops or inverts the `process.env.NODE_ENV !== "production"` guard, so an unconfigured production deploy returns true and the `/admin` console renders to any anonymous visitor. Or claim parsing regresses so `tfa:"false"` reads as enrolled, defeating `ADMIN_MFA_ENFORCED`. No test catches either.

**Fix direction.** Extract pure decisions — `adminConsoleAllowed(backendReady, nodeEnv, gateOk)` and `mfaFromClaim(claim)` — and unit-test: prod+unconfigured→false, dev+unconfigured→true; claim `true`/`"true"`→enrolled, `false`/`"false"`→not, missing→falls through.

### M10 — `resolveTier` nopork branch and bare-confirms→community transition untested
**Location:** `lib/halal-score.ts:64` (and `:67`) · **Verdict: PLAUSIBLE**

`halal-score.test.ts` exercises the "friendly" self-declared path but never the sibling "nopork" branch nor the badge-less `confirms >= 50 → community` fallthrough. nopork is a self-declared halal signal on seed/mock listings, and the 50-confirmation promotion is a trust boundary deciding "Community Confirmed."

**Failure scenario.** A refactor drops "nopork" from the line-64 predicate: a nopork listing with 60 confirms that should read "Community Confirmed" silently collapses to "Self-declared." Or changing `>= 50` to `> 50` demotes every exactly-50-confirm listing. Neither is covered (tests use only 10 and 60).

**Fix direction.** Add cases: nopork with confirms 10→"declared" and 60→"community"; a non-self-declared listing (e.g. `badges:["owned"]`) with confirms 49→"declared" and 50→"community" to pin the boundary and the nopork==friendly equivalence.

### M11 — `cert_new` vs `cert_renewed` selection is inline, already divergent across two routes, and untested
**Location:** `app/api/admin/verify/route.ts:116` (and `app/api/admin/cert/route.ts:221`) · **Verdict: PLAUSIBLE**

The choice of `cert_new` (first certification) vs `cert_renewed` (had cert before) that feeds the **public** cert-changes changelog is computed inline from `wasCertifiedBefore` in both routes — not extracted into a pure helper like `buildGrantPatch`. The two implementations already diverge: the cert route (lines 173–181) adds a prior-cert-row count fallback the verify route lacks, and nothing tests the parity.

**Failure scenario.** Editing the predicate in only one route makes approving an uploaded cert for a previously-certified-but-lapsed business log `cert_new` instead of `cert_renewed` → the public "newly certified" changelog wrongly announces an existing halal business as newly certified.

**Fix direction.** Extract `certLogEvent(action, prior)` into `lib/verify-grant.ts` (single source, mirroring `buildGrantPatch`) and unit-test: revoke→"flagged"; grant with prior muis/admin tier or existing `muis_cert_no`→"cert_renewed"; grant with no prior→"cert_new". Have both routes call it.

### M12 — Owner/admin authorization `authoriseEventManager` is untested
**Location:** `lib/event-auth.ts:46` · **Verdict: PLAUSIBLE**

`authoriseEventManager` is the shared authorization for organiser routes (promo-codes, ref-codes, marketing analytics — which expose lead PII). Its allow decision — platform admin OR `ev.submitted_by === userId` OR `owner_id`/`claimed_by` of the linked business — has no test.

**Failure scenario.** A refactor to the allow logic (lines 46–55) — an OR/AND slip, or defaulting `allowed=true` when `ev.business_id` is null — lets a signed-in non-owner clear the gate for another org's event and mint promo/ref codes or read that event's marketing leads. Because the decision isn't a pure, tested function, the regression ships unnoticed.

**Fix direction.** Factor the allow decision into a pure `eventManagerAllowed({role, submittedBy, userId, ownerMatch})` and unit-test the matrix: admin→allow; `submitted_by` match→allow; owner/`claimed_by` match→allow; none→deny; null `business_id` with no other match→deny.

---

## Low

### L1 — Admin verification queue shows "MUIS verified" pill for unbacked-MUIS businesses
**Location:** `components/screens/admin.tsx:1253` · **Verdict: PLAUSIBLE**

`{biz?.certified && <span className="pill-tag green">{biz.certBody} verified</span>}` renders "MUIS verified" for any certified listing (`certified = tier is muis|admin`) without the `muisUnbacked` guard. Internal/admin-only, so limited impact, but it can mislead an admin into thinking a certificate is recorded when it is not.

**Failure scenario.** An admin reviews the queue for a business with `halal_tier='muis'` and no `muis_cert_no`; the green "MUIS verified" pill implies a cert on file, so the admin doesn't chase the missing number, leaving the listing permanently unbacked while appearing verified internally.

**Fix direction.** Apply `muisUnbacked` here too: "MUIS-listed (no cert on file)" vs "MUIS verified". (Same root cause as C1/H1/H2/M1.)

### L2 — Airport autocomplete proxies paid LiteAPI with no rate limit and no caching
**Location:** `app/api/travel/flights/airports/route.ts:9` · **Verdict: PLAUSIBLE**

`searchAirports(q)` hits LiteAPI `/data/flights/airports` for every distinct query with no `rateLimit()` and no `withCache` — unlike its sibling `app/api/travel/places/route.ts`, which rate-limits (comment: "Throttle to protect the upstream LiteAPI quota from autocomplete abuse") and caches via `searchPlaces()`. The bundled local dataset is primary so responses never fail, but the live LiteAPI call fires additively and unthrottled when a key is configured.

**Failure scenario.** With flights activated, a script requests `GET /api/travel/flights/airports?q=<varying strings>`; each unique query issues one uncached LiteAPI call with no per-IP throttle, letting an attacker burn LiteAPI quota/cost at will.

**Fix direction.** Add `rateLimit(req, "airports", 60, 60)` as in `/travel/places`, and wrap the `searchAirports()` live merge in `withCache` keyed by the normalized query.

### L3 — Prayer-time date built from server-local (UTC) fields for non-SG hotel locations
**Location:** `lib/prayer.ts:30` · **Verdict: PLAUSIBLE**

`getPrayerTimes` builds the Aladhan date from `date.getDate()/getMonth()/getFullYear()` (local getters). On a UTC server (Vercel) with default `new Date()`, near local midnight in the hotel's own timezone the server is on a different calendar day than the hotel, so it requests the wrong day's timings.

**Failure scenario.** A hotel in Dubai (UTC+4) at 01:30 local (21:30 UTC prior day): the server computes yesterday's date and returns the previous day's prayer times (off by ~1 min/prayer, one day stale for iftar/Maghrib at the boundary).

**Fix direction.** Format the date in the hotel's timezone (`Intl.DateTimeFormat` with the resolved tz, or pass the location-local date) rather than server-local getters.

### L4 — `remainingQuota` counts accepted leads from epoch when `current_period_start` is null
**Location:** `lib/lead-routing.ts:160` · **Verdict: PLAUSIBLE**

`const since = s.current_period_start || new Date(0).toISOString();` — for a leads subscription whose `current_period_start` isn't populated yet (set later by `customer.subscription.updated`, not by the `checkout.session.completed` upsert), the accepted-lead count is taken from 1970 instead of the current period.

**Failure scenario.** A returning subscriber who resubscribes (new sub row, `current_period_start` still null before the first `subscription.updated` webhook) has all historical accepted `lead_routes` counted against this period; if that count ≥ `monthly_quota`, `hasQuota` is wrongly false and they're treated as out of quota until the field populates.

**Fix direction.** Fall back to the subscription's `created_at` or the start of the current calendar month rather than epoch, or skip quota counting until `current_period_start` is known.

### L5 — Dead ternary in `openStatus` and missing close-time on overnight-spill open state
**Location:** `lib/hours.ts:74` · **Verdict: PLAUSIBLE**

`const close = today && toMin(today.close) > mins ? today.close : today?.close;` returns `today?.close` on both branches (dead condition). More substantively, when a listing is open only via yesterday's overnight spill, `today` is null/closed, so `close` is undefined and the label falls back to "Open now" with no closing time even though the true close (yesterday's range close) is known.

**Failure scenario.** A bar/eatery open 22:00–02:00: at 01:00 SGT, today's entry may be null, so `openStatus` returns `{ open:true, label:'Open now' }` instead of "Open · closes 2:00 AM", omitting the closing time users need.

**Fix direction.** Remove the no-op ternary; when open via overnight spill, derive the close label from the yesterday range's close time (`week[(day+6)%7].close`).

### L6 — Onboarding region picker uses `role=tablist/tab` without the tabs pattern
**Location:** `components/chrome.tsx:322` · **Verdict: PLAUSIBLE** · WCAG 4.1.2

The region buttons declare `role="tablist"` and `role="tab"` + `aria-selected` but have no associated tabpanels (no `aria-controls`), no roving tabindex, and no ArrowLeft/Right handling. They are really toggle filters. The tab role sets AT expectations (a tab controls a panel; arrows move between tabs) the markup doesn't satisfy.

**Failure scenario.** A screen-reader user hears "Central, tab, 1 of 5, selected" and presses arrows expecting to move between tabs; nothing happens, and there is no panel the "tab" controls, so the announced relationship is misleading.

**Fix direction.** Expose them as toggle buttons (`aria-pressed`) inside a `role="group"`/radiogroup with an accessible name, or implement the full ARIA APG tabs pattern.

### L7 — Halal-status ring label can fail contrast for the gold (admin) tier
**Location:** `components/halal-confidence-badge.tsx:88` · **Verdict: PLAUSIBLE** · WCAG 1.4.3

`.hc-ring-label` is small bold text (~10.9px, weight 800 — `moat.css:194`) colored `scoreTone(tier)`. For the admin tier `scoreTone` returns `var(--gold-700)` (#A96430), ~4.4:1 on cream/white — below the 4.5:1 required for non-large text. The team already added `--gold-800` specifically because gold-700 fails as text (`styles.css:23`), but this label still uses the tone directly.

**Failure scenario.** On an admin-verified listing header, the status label renders in gold-700 on cream at ~4.4:1; a low-vision user may be unable to read the most trust-critical text on the listing.

**Fix direction.** Map tier tones to AA-safe text variants for text (use `--gold-800` for gold), keeping the bright tone for the badge fill only; consider raising the label above the 12px legible-text floor.

### L8 — Robots-blocked utility routes inherit `canonical="/"` and lack explicit `noindex`
**Location:** `app/keystatic/[[...params]]/page.tsx:1` (and `app/sign-in/sso-callback/page.tsx`) · **Verdict: PLAUSIBLE**

Both export no metadata and have no metadata-bearing sub-layout, so they inherit the root layout's `alternates.canonical = "/"` (`app/layout.tsx:68`) and carry no robots `noindex`, relying solely on robots.txt Disallow. Disallow prevents crawling but not indexing of an externally-linked URL, and the inherited self-referential-wrong canonical points these routes at the homepage. (`app/scorecard/[token]/layout.tsx` already does this correctly with `index:false` — these two were missed.)

**Failure scenario.** If any external page links to `…/keystatic` or the SSO callback URL, Google may index the URL-without-crawl and, reading the inherited canonical, fold it toward the homepage — a wrong-canonical signal on a private console/auth page.

**Fix direction.** Add `export const metadata = { robots: { index: false, follow: false } }` (or a `pageMeta({…, index:false})` layout like scorecard's) to both routes.

### L9 — ~306KB of render-blocking CSS on every route; `ota.css` serves only travel verticals
**Location:** `app/layout.tsx:13` (CSS imports) · **Verdict: PLAUSIBLE**

The root layout imports ten stylesheets totalling ~306KB uncompressed, all combined into a render-blocking sheet on every page. `ota.css` (18KB) is used only by the travel/flights screens and the `/ask` + `/travel` concierge (no `ota-` classes on homepage/SEO/blog), so it's fetched and parsed on every non-travel route for nothing. The codebase already route-scopes `tools.css`, `hawker.css`, and `blog.css` via per-route layouts.

**Failure scenario.** A visitor on the homepage or any SEO landing page render-blocks on `ota.css` (and much of `travel.css`) — CSS their page never uses — adding parse/transfer time to first paint on mobile.

**Fix direction.** Move `ota.css` (and, after auditing travel-only selectors, the travel-vertical parts of `travel.css`) into a scoped `app/travel` layout. Keep `events.css` global (the homepage EventsStrip uses `.evt-grid`).

---

## What CI already covers

The repo has a mature CI stack. Cross-referencing the workflows against these findings:

- **`ci.yml`** — `lint`, `typecheck`, `check:content`, **`test`** (unit), `build`, plus a Playwright **`e2e`** job (desktop smoke + mobile-matrix regression on 320/390/768). **Key limitation for this audit:** the data-backed integration specs *skip* when `NEXT_PUBLIC_SUPABASE_*` secrets are unset, and `smoke.spec.ts` is `test.skip`'d without seeded Supabase. So none of the halal-tier/`rowToListing` behaviour (C1, H1, H2, H3, H7) is exercised by CI today, and the test-gap findings (H7, H8, M9–M12) are, by definition, uncovered — CI *would* run new unit tests if they were added.
- **`codeql.yml`** — CodeQL `security-extended` on JS/TS (PR + push + weekly). May flag classic injection patterns but does not encode the `.or()` PostgREST-filter semantics behind H8, and does not assert semantic halal-claim correctness.
- **`security.yml`** — `audit-ci` (prod deps, high+) and **gitleaks** secret scan. Covers dependency CVEs and leaked secrets — no finding here is a leaked secret or a vulnerable dependency, so this guards a dimension the audit found clean.
- **`security-probes.yml`** — weekly black-box probe of `businesses` column privileges (migration 0068), skips until `PROBE_SUPABASE_*` secrets are set. Guards the anon-column-exposure invariant (not among these findings); does **not** probe endpoint cost/DoS (M2, L2) or the `.or()` guard (H8).
- **`lighthouse.yml`** — LHCI mobile on 4 URLs (`/`, `/explore`, `/travel`, `/blog/what-is-halal-singapore`). **Error-level assertions gate the PR: viewport present, content-width (no horizontal overflow), SEO.** Perf/LCP/CLS/tap-targets/font-size are **warn-only** (don't block). Implication: the perf findings (H6, M6–M8, L9) may *surface* as Lighthouse warnings but are **not gated**, and only on those 4 URLs; the **accessibility keyboard-trap/focus findings (C2, H4)** are **not** caught — Lighthouse doesn't simulate keyboard interaction, and the contrast finding (L7) targets a listing-detail gold tier not among the 4 audited URLs. Naming/label a11y (M5) and the tab-role misuse (L6) are likewise outside the audited paths.
- **`schema-check.yml`** — `check-schema.mjs` asserts only the **presence** of required JSON-LD `@type` values on 4 fixed paths (`/`, `/explore`, `/is-halal/paris-baguette`, `/blog/what-is-halal-singapore`). It does **not** crawl cuisine pages and does **not** compare FAQPage content to the visible DOM, so the H5 FAQPage-vs-DOM mismatch is a **genuine gap**.
- **`link-scan.yml`** / **`sitemap-diff.yml`** — weekly dead-link scan and daily sitemap diff. Useful for content hygiene; unrelated to the correctness/security/a11y findings here. Note the L8 canonical/noindex issue would not be caught by either.

**Net:** CI robustly guards dependency CVEs, secret leaks, JSON-LD block *presence*, mobile overflow/viewport, and anon DB-column exposure. It does **not** guard: (1) semantic halal-claim correctness across surfaces (the entire unbacked-MUIS cluster and the expired-cert path), (2) keyboard focus management / interactive accessibility, (3) endpoint cost/DoS ceilings, (4) FAQPage content-visibility matching, or (5) any of the untested seams — precisely where this audit's highest-severity findings sit.

## Recommended next steps

1. **Single-source the MUIS tier (fixes C1, H1, H2, M1, L1 at once).** Route every "is this MUIS Certified?" decision through `lib/halal-score` (`scoreListing().label` + `muisUnbacked`) and delete the ad-hoc `badges.includes("muis")` checks in the concierge, map popup, hawker page, PDF guide builder, and admin queue. This is the highest-leverage fix in the report.
2. **Fix the two focus traps (C2, H4).** Make `useDialog` engage only while open and scope it to the popover element; this removes the site-wide keyboard trap for signed-in users and the non-functional mobile drawer trap together.
3. **Degrade expired certs at read time (H3) and harden the enforcing cron (M3).** Compare `muis_expiry` to now inside `rowToListing`/`scoreListing` so a lapsed cert stops claiming certification immediately, and make `recheck-certs` surface UPDATE failures instead of reporting `ok:true`.
4. **Pin the load-bearing seams with tests (H7, H8, M9–M12).** Add unit tests for `rowToListing`, `isSafeEventRef`, `isAdminOrUnconfigured`/MFA, `resolveTier` nopork/boundary, `certLogEvent`, and `authoriseEventManager` — extracting pure helpers where the logic is currently inline/duplicated. Consider a CI assertion that `SeoScreen`'s rendered FAQ deep-equals `seoFaqItems(page)` for every page (H5).
5. **Fix the cuisine pSEO content resolution (H5)** by resolving `cuisineContent` before `categoryContent`, removing the FAQPage-vs-DOM mismatch and the thin-duplicate body across ~21 indexable pages.
6. **Trim the client/critical-path weight (H6, then M6–M8, L9).** Stop serializing the full directory from the root layout; parallelize `getDirectory`'s two queries; re-enable image optimization for blog/mosque/author/brand; set `preload:false` on the four route-specific fonts; scope `ota.css` to a travel layout.
7. **Add cost ceilings to public AI/upstream endpoints (M2, L2)** by mirroring the sibling routes' payload caps and per-IP rate limits.
8. **Sweep the remaining a11y and correctness polish (M5, L3–L8)** as a batch.
