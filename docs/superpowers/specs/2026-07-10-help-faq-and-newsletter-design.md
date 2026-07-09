# Help system, nested FAQ & newsletter setup — design

**Date:** 2026-07-10
**Status:** approved (design), pending spec review
**Author:** Robert + Claude

## Problem

Humble Halal now has many features (Ask AI, TikTok UGC, Halal Verdicts, Halal Passport, Hawker Finder, Cert Vault, Semantic search, Listing enrichment, Lead routing, paid tickets/ads/plans, travel). Users — both consumers and business owners — don't understand what each feature does or how to use it. Two gaps:

1. **No structured, discoverable FAQ** that covers the major features. The current `/faq` is four flat categories and predates most features.
2. **No in-product guidance.** Owners/consumers land in a dashboard full of tabs with no "what is this / how it works" explanation.

Separately, the **beehiiv newsletter** integration is built and merged (PR #37) but not switched on in production (env keys unset), and capture CTAs should stay "general" until dedicated lead-magnet guides exist.

## Goals

- A single **nested FAQ page** covering all major features, category-within-category, flag-aware.
- **In-dashboard help callouts** on `/owner` and `/dashboard` that explain each tab's feature.
- **Newsletter live + general**: prod env set, capture CTAs promise nothing unbuilt, one general welcome.
- **No content drift**: FAQ and dashboard help share one source of truth.

## Non-goals (YAGNI)

- Admin-console callouts (admin toggles already carry descriptions).
- Per-feature FAQ sub-pages / separate routes.
- Setup checklist / guided tour / first-run wizard.
- Lead-magnet-specific email flows or new lead-magnet guides.
- Per-user server-side "seen help" state (localStorage is enough).
- **Notifications** — see "Follow-on (separate spec)".

## Architecture

### ① Shared content source — `lib/help-content.ts` (the seam)

One typed array, one entry per feature. This is the single source both surfaces render from.

```ts
export interface HelpFeature {
  key: string;                 // "tiktok", "passport", "ask-ai", …
  label: string;               // "TikTok features"
  flag?: FlagKey;              // gate; omit for always-on features
  audience: ("user" | "business" | "public")[];
  what: string;                // one-line "what it does"
  how: string[];               // ordered "how it works" steps
  faqs: { q: string; a: string }[];
  faqCategory: "Getting started" | "Features" | "For businesses" | "Travel" | "Trust & verification";
  dashboard?: { surface: "owner" | "user"; tab: string };  // where the callout mounts
  halalSensitive?: boolean;    // copy needs human sign-off before ship
}
export const HELP: HelpFeature[] = [ /* … */ ];
```

- Existing `HOME_FAQ` / `VERIFY_FAQ` / `TRAVEL_FAQ` / `BUSINESS_FAQ` (`lib/faq.ts`) fold in as the non-feature categories — nothing is lost; the FAQ page merges them with the per-feature `faqs`.
- Anchors: each feature gets a stable id (`#tiktok`) used by both the FAQ section and the callout's "How it works →" link.

### ② Nested FAQ page — `/faq` (one page)

- `FaqScreen` (in `components/screens/pages.tsx`) rewritten to render from `HELP` + the legacy arrays.
- Structure: top-level categories (Getting started · Features · For businesses · Travel · Trust) with a **sticky jump-nav**. Under **Features**, a sub-group per feature (accordion of Q&As), each with an `id` anchor.
- **Flag-aware**: a feature sub-group renders only when its `flag` resolves true (server `getServerFlags()`), so the FAQ never documents a hidden feature.
- **Dynamic render**: add `export const dynamic = "force-dynamic"` to `app/faq/page.tsx` so flag flips reflect immediately (same fix pattern as `/hawker`).
- **SEO**: extend `faqJsonLd` to include the enabled feature FAQs (one `FAQPage` schema).

### ③ Dashboard callouts — `/owner` + `/dashboard`

- New reusable client component `components/help-callout.tsx`:
  - `<HelpCallout feature="sponsored-ads" />` → looks up `HELP` by key, reads client `flags` (`useApp()`). Renders nothing **only when the entry has a `flag` and that flag resolves false**; entries with no `flag` (always-on tabs like Payouts/Billing/Reviews) always render.
  - Renders a dismissible info box: label · `what` · "How it works →" (links `/faq#<key>`).
  - Dismissal stored per-key in `localStorage` (`hh_help_dismissed`: string[]).
  - **Re-open affordance**: a small "?" button on the tab header re-shows a dismissed callout (so help isn't lost forever).
- Wiring: one `<HelpCallout>` at the top of each mapped tab. The exact tab set is confirmed against the live dashboard tabs during implementation (a mapped tab that doesn't exist is skipped, not invented).
  - **/owner** (`components/screens/business.tsx`) target tabs: Halal certificate (cert-vault), My events (events), Sponsored ads (paid-ads), Payouts, Reviews, Billing (+ Leads if a lead tab is present).
  - **/dashboard** (`components/screens/misc.tsx` `UserDashboardScreen`): Passport, Collections, My requests, My reviews.

### ④ Beehiiv "general" newsletter setup

- **Env (user action)**: set `BEEHIIV_API_KEY` + `BEEHIIV_PUBLICATION_ID` in Vercel prod. Every capture form already targets the one publication via `lib/beehiiv.ts`.
- **Key-pairing guard (code)**: `/api/subscribe` currently returns generic `{ok:false}` on a non-2xx beehiiv response. Improve it to distinguish "not configured" (simulated) from "configured but rejected" (e.g., 401/publication mismatch) and log the status — so a bad key/publication pairing is visible, not silent (same failure class as the service-role-key bug). No behaviour change when correctly configured.
- **CTA audit (copy)**: review the multi-surface capture CTAs (`components/newsletter.tsx` + callers) so none promise a specific guide/lead-magnet that isn't built. They read as a general "join the weekly halal guide" until guides exist. Keep the existing `source`/`intent` custom-field tagging (invisible metadata; powers future segmentation).
- **Welcome email (user action, beehiiv dashboard)**: one general welcome automation.

## Content authoring & halal safety

- I draft `what` / `how` / `faqs` for each feature factually.
- Any entry with `halalSensitive: true` (Cert Vault, Halal Verdicts, anything referencing certification) is **flagged for human review before ship** — AI never asserts halal certification status; copy must match the project's trust posture (certified vs self-declared distinction).

## Testing / verification

- **Unit**: a test asserting every `HELP` entry has non-empty `what`, `how`, and a valid `faqCategory`; and that every `flag` referenced exists in `FLAG_ENV` (mirrors the existing `feature-flags.test.ts` guard).
- **Build/typecheck/lint** green.
- **Manual (agent-browser/curl)**: `/faq` renders nested categories + jump-nav; a feature section appears only when its flag is on; a `/owner` and `/dashboard` tab shows its callout; dismiss + re-open works; `/api/subscribe` returns a clear signal when misconfigured.

## Rollout

1. `lib/help-content.ts` (content source) — draft copy, mark halal-sensitive for review.
2. FAQ page rewrite (`FaqScreen` + `app/faq/page.tsx` dynamic + JSON-LD).
3. `HelpCallout` component + wire into `/owner` and `/dashboard` tabs.
4. Beehiiv: `/api/subscribe` signal improvement + CTA copy audit.
5. Ship behind normal review; **user sets beehiiv env + welcome email in prod**.

## Follow-on (separate spec — NOT this build)

**Notifications for admin + business owner.** System exists — `notifications` table (migration `0033`), `lib/notify.ts` helper, `components/notification-bell.tsx`, and triggers already fire from `lib/passport-server.ts`, `lib/lead-routing.ts`, `app/api/events/[id]`, `app/api/owner/review-reply`. Gap: coverage/delivery for admin- and owner-facing events (new listing/claim/event-to-approve for admin; new review/lead/booking/payout for owner) and whether the bell surfaces them (read path / RLS). This is a **diagnosis + coverage-fill** task, handled as its own focused pass immediately after this spec.
