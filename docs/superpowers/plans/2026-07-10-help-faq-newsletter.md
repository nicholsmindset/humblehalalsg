# Help System, Nested FAQ & Newsletter Setup — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a nested, flag-aware `/faq` page and dismissible per-tab "what is this / how it works" help callouts on `/owner` and `/dashboard`, both rendered from one shared content source, plus make the beehiiv newsletter production-ready (general).

**Architecture:** A single typed content source (`lib/help-content.ts`) defines, per feature: label, flag, what-it-does, how-it-works steps, and FAQs. The FAQ page and the dashboard callouts both render from it, so they never drift. Beehiiv is already wired to one publication; work is a misconfig signal + copy audit + prod env (user).

**Tech Stack:** Next.js 16 App Router (Turbopack), React 19, TypeScript, Vitest (unit tests for pure logic), existing feature-flag system (`lib/flags.ts`, `lib/feature-flags.ts`), beehiiv v2 API (`lib/beehiiv.ts`).

## Global Constraints

- **Halal trust rule:** copy must NEVER assert or imply halal *certification* unless it's the MUIS/admin-verified distinction. Entries touching certification/verdicts are marked `halalSensitive: true` and their copy is flagged for human review before ship.
- **Flag source of truth:** server pages read `getServerFlags()` (`lib/feature-flags.ts`); client components read `useApp().flags`. A flag key used anywhere must exist in `FLAG_ENV` (`lib/flags.ts`).
- **Graceful/dark by default:** nothing renders for a feature whose flag is off. Non-flagged (always-on) entries always render.
- **Testing posture (match the repo):** pure logic gets Vitest unit tests; React UI is verified via `npm run typecheck` + `npm run build` + agent-browser/curl. Do not add a React test runner.
- **Commit style:** end messages with `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- **Branch:** `feat/help-faq-newsletter` (already created off master; the spec commit is on it).

---

### Task 1: Shared help-content source (`lib/help-content.ts`)

**Files:**
- Create: `lib/help-content.ts`
- Test: `tests/unit/help-content.test.ts`

**Interfaces:**
- Produces:
  - `interface HelpFeature { key: string; label: string; flag?: FlagKey; audience: ("user"|"business"|"public")[]; what: string; how: string[]; faqs: { q: string; a: string }[]; faqCategory: FaqCategory; dashboard?: { surface: "owner"|"user"; tab: string }; halalSensitive?: boolean }`
  - `type FaqCategory = "Getting started" | "Features" | "For businesses" | "Travel" | "Trust & verification"`
  - `const HELP: HelpFeature[]`
  - `function helpByKey(key: string): HelpFeature | undefined`
  - `function helpForTab(surface: "owner"|"user", tab: string): HelpFeature | undefined`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/help-content.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { HELP, helpByKey, helpForTab } from "@/lib/help-content";
import { FLAG_ENV } from "@/lib/flags";

describe("help-content", () => {
  it("every entry has non-empty copy and a valid category", () => {
    const cats = ["Getting started", "Features", "For businesses", "Travel", "Trust & verification"];
    for (const h of HELP) {
      expect(h.key, "key").toBeTruthy();
      expect(h.label, `${h.key} label`).toBeTruthy();
      expect(h.what.length, `${h.key} what`).toBeGreaterThan(0);
      expect(h.how.length, `${h.key} how`).toBeGreaterThan(0);
      expect(cats).toContain(h.faqCategory);
      expect(h.audience.length, `${h.key} audience`).toBeGreaterThan(0);
    }
  });

  it("keys are unique", () => {
    const keys = HELP.map((h) => h.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("every referenced flag exists in FLAG_ENV", () => {
    for (const h of HELP) {
      if (h.flag) expect(Object.keys(FLAG_ENV), `${h.key} flag`).toContain(h.flag);
    }
  });

  it("lookups work", () => {
    expect(helpByKey("passport")?.label).toBe("Halal Passport");
    expect(helpForTab("user", "passport")?.key).toBe("passport");
    expect(helpByKey("nope")).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/help-content.test.ts`
Expected: FAIL — cannot resolve `@/lib/help-content`.

- [ ] **Step 3: Write `lib/help-content.ts`**

```ts
import type { FlagKey } from "./flags";

/* Single source of truth for user-facing feature help. Powers BOTH the nested
   /faq page and the dismissible dashboard callouts, so they never drift.
   Client-safe (no server imports). HALAL: entries marked halalSensitive must
   never assert certification beyond the MUIS/admin-verified distinction. */

export type FaqCategory =
  | "Getting started" | "Features" | "For businesses" | "Travel" | "Trust & verification";

export interface HelpFeature {
  key: string;
  label: string;
  flag?: FlagKey;                       // omit = always on
  audience: ("user" | "business" | "public")[];
  what: string;                         // one-line "what it does"
  how: string[];                        // ordered "how it works" steps
  faqs: { q: string; a: string }[];
  faqCategory: FaqCategory;
  dashboard?: { surface: "owner" | "user"; tab: string };
  halalSensitive?: boolean;
}

export const HELP: HelpFeature[] = [
  {
    key: "ask-ai", label: "Ask AI", flag: "aiConcierge", audience: ["public"],
    what: "A halal-aware assistant that answers questions and finds places, prayer spaces and Muslim-friendly travel for you.",
    how: [
      "Open Ask AI from the top nav (or /ask).",
      "Type a question in plain English — e.g. “halal buffet near Bugis with a prayer room”.",
      "It answers using our verified listings and links you straight to them.",
    ],
    faqs: [
      { q: "What can Ask AI do?", a: "It answers halal-lifestyle questions and recommends places from our directory — by cuisine, area, prayer space, family-friendliness and more — and can help plan Muslim-friendly travel." },
      { q: "Is Ask AI a substitute for checking halal status?", a: "No. It surfaces our recorded halal status and links to the listing, but you should always confirm certification on the official MUIS HalalSG register." },
    ],
    faqCategory: "Features",
  },
  {
    key: "tiktok", label: "TikTok features", flag: "tiktokUgc", audience: ["public", "business", "user"],
    what: "Community TikToks about halal spots, shown on the matching listing with credit to the creator.",
    how: [
      "Anyone pastes a TikTok link at /feature-tiktok and says which place it's about.",
      "Our team reviews it (an AI helps classify and match it to a listing).",
      "Once approved, the video appears on that business's page. Creators can ask us to remove it anytime.",
    ],
    faqs: [
      { q: "How do I get my TikTok featured?", a: "Submit the link at /feature-tiktok with the business name. We review every submission before it appears — nothing is auto-published." },
      { q: "Does featuring a video mean the place is halal-certified?", a: "No. A featured video is community content, not a certification. Always check the listing's halal status and trust signals." },
      { q: "Can I remove my video?", a: "Yes — go to /remove-video and paste the link. We take it down right away." },
    ],
    faqCategory: "Features",
  },
  {
    key: "passport", label: "Halal Passport", flag: "passport", audience: ["user"],
    what: "A loyalty passport — earn points for reviews, visits and referrals, unlock badges, and climb tiers.",
    how: [
      "Open the Passport tab in your dashboard (it opens there by default when signed in).",
      "Earn points by writing reviews, confirming places, and inviting friends.",
      "Points unlock badges and move you up tiers — track progress on your passport.",
    ],
    faqs: [
      { q: "How do I earn points?", a: "You earn points for writing reviews, confirming a place is still halal/open, checking in, and referring friends who join and take their first action." },
      { q: "What are tiers and badges?", a: "Tiers reflect your total points (Explorer → Regular → and up). Badges are one-off achievements like your first review or visiting 5 places." },
    ],
    faqCategory: "Features",
    dashboard: { surface: "user", tab: "passport" },
  },
  {
    key: "halal-verdicts", label: "Halal verdicts", flag: "halalVerdicts", audience: ["public"], halalSensitive: true,
    what: "Researched “is it halal?” answers for brands and products, reviewed by our team before publishing.",
    how: [
      "Browse verdicts from the Is-it-halal section.",
      "Each verdict shows the reasoning and any cited source.",
      "Verdicts are drafted with AI assistance but published only after human review — never auto-approved.",
    ],
    faqs: [
      { q: "How are verdicts decided?", a: "Our team reviews each verdict before it's published. An AI drafts a starting point, but a person checks the reasoning and a cited source is required for a ‘halal’ call." },
      { q: "Is a verdict the same as MUIS certification?", a: "No. Verdicts are our informational research, not official certification. For certification, always check the MUIS HalalSG register." },
    ],
    faqCategory: "Trust & verification",
  },
  {
    key: "hawker", label: "Hawker Finder", flag: "hawkerFinder", audience: ["public"],
    what: "Find halal stalls grouped by hawker centre on a map, with trust signals and a Halal Confidence Score.",
    how: [
      "Open Hawker from the top nav (or /hawker).",
      "Browse centres on the map or by region, then tap one to see its halal stalls.",
      "Each stall links to its full listing — confirm halal status on site.",
    ],
    faqs: [
      { q: "Are hawker stalls halal-certified?", a: "Some are MUIS-certified; many are Muslim-owned or self-declared and clearly labelled as such. Always confirm on site — the Halal Confidence Score reflects the strength of the signals, not a certification." },
    ],
    faqCategory: "Features",
  },
  {
    key: "semantic-search", label: "Semantic search", flag: "semanticSearch", audience: ["public"],
    what: "Smarter search that understands what you mean, not just keywords.",
    how: [
      "Search from Explore or the map as usual.",
      "Describe what you want naturally — e.g. “cosy halal date-night spot”.",
      "Results are ranked by meaning and your filters (area, prayer space, open now).",
    ],
    faqs: [
      { q: "How is this different from normal search?", a: "It matches the intent of your query, so you can search in natural language and still get relevant halal places even without exact keyword matches." },
    ],
    faqCategory: "Getting started",
  },
  {
    key: "cert-vault", label: "Halal certificate", flag: "certVault", audience: ["business"], halalSensitive: true,
    what: "Upload your MUIS halal certificate so we can verify it and show a trusted badge on your listing.",
    how: [
      "Open the Halal certificate tab in your business dashboard.",
      "Upload a clear photo or PDF of your valid MUIS certificate.",
      "Our team reviews it; once verified, your listing shows the verified badge. We never mark a listing certified without a valid document.",
    ],
    faqs: [
      { q: "Does uploading a certificate make my listing ‘certified’ automatically?", a: "No. Certification status comes only from a valid MUIS certificate that our team verifies. Uploading starts that review; it isn't automatic." },
    ],
    faqCategory: "For businesses",
    dashboard: { surface: "owner", tab: "cert" },
  },
  {
    key: "events", label: "Events & tickets", flag: "paidTickets", audience: ["business"],
    what: "List community events and (optionally) sell tickets to them.",
    how: [
      "Open the My events tab and create an event.",
      "Keep it free RSVP, or enable paid tickets once your payout details are set.",
      "Manage attendees and check-ins from the same tab.",
    ],
    faqs: [
      { q: "Do I have to charge for tickets?", a: "No. Every event can be free RSVP. Paid tickets are optional and only work once payments are enabled and your payout onboarding is complete." },
    ],
    faqCategory: "For businesses",
    dashboard: { surface: "owner", tab: "events" },
  },
  {
    key: "sponsored-ads", label: "Sponsored ads", flag: "paidAds", audience: ["business"],
    what: "Promote your listing to the top of search and its category.",
    how: [
      "Open the Sponsored ads tab.",
      "Choose a placement and dates.",
      "When paid ads are live you pay per placement; otherwise it sends us an enquiry.",
    ],
    faqs: [
      { q: "Where do sponsored listings appear?", a: "At the top of relevant search results and category pages, clearly marked as sponsored." },
    ],
    faqCategory: "For businesses",
    dashboard: { surface: "owner", tab: "ads" },
  },
  {
    key: "leads", label: "Leads", flag: "leadRouting", audience: ["business"],
    what: "Customer enquiries that match your business, routed to you.",
    how: [
      "Open the Leads tab.",
      "Review incoming enquiries matched to your category and area.",
      "Respond to win the customer. Free while lead billing is off.",
    ],
    faqs: [
      { q: "How are leads matched to me?", a: "When a customer requests a quote or enquiry in your category and area, we route it to matching businesses so you can respond." },
    ],
    faqCategory: "For businesses",
    dashboard: { surface: "owner", tab: "leads" },
  },
  {
    key: "listing-enrichment", label: "Listing enrichment", flag: "listingEnrichment", audience: ["business"],
    what: "AI drafts a cleaner description and SEO for a listing; our team approves before it goes live.",
    how: [
      "Submit or claim your listing with the basics.",
      "Our team can run an AI draft that improves the wording and SEO from your facts only.",
      "A human approves it before anything changes on your live listing.",
    ],
    faqs: [
      { q: "Will AI invent details about my business?", a: "No. It only rewords the facts you provide and never claims halal certification. A person reviews every draft before it's published." },
    ],
    faqCategory: "For businesses",
  },
  // ── Always-on dashboard tabs (no flag) — callout only, minimal FAQ ──
  {
    key: "payouts", label: "Payouts", audience: ["business"],
    what: "Where your ticket/ad earnings are paid out. Connect your payout account to receive money.",
    how: ["Open the Payouts tab.", "Complete payout onboarding (bank details).", "Earnings are transferred to you on the platform's payout schedule."],
    faqs: [], faqCategory: "For businesses", dashboard: { surface: "owner", tab: "payouts" },
  },
  {
    key: "reviews-owner", label: "Reviews", audience: ["business"],
    what: "Reviews customers left on your listings — read them and reply.",
    how: ["Open the Reviews tab.", "Read customer reviews of your listings.", "Reply publicly to build trust."],
    faqs: [], faqCategory: "For businesses", dashboard: { surface: "owner", tab: "reviews" },
  },
  {
    key: "billing", label: "Billing", audience: ["business"],
    what: "Manage your subscription plan, card and invoices.",
    how: ["Open the Billing tab.", "Open the secure Stripe portal to change plan or card.", "Download invoices anytime."],
    faqs: [], faqCategory: "For businesses", dashboard: { surface: "owner", tab: "billing" },
  },
  {
    key: "collections", label: "Collections", audience: ["user"],
    what: "Group saved places into your own lists (e.g. “Date night”, “Halal cafes”).",
    how: ["Open the Collections tab.", "Create a collection.", "Add saved places to it and share the list."],
    faqs: [], faqCategory: "Getting started", dashboard: { surface: "user", tab: "collections" },
  },
  {
    key: "requests", label: "My requests", audience: ["user"],
    what: "Quote and enquiry requests you've sent to businesses, and their status.",
    how: ["Open the My requests tab.", "Track requests you've sent.", "See responses from matching businesses."],
    faqs: [], faqCategory: "Getting started", dashboard: { surface: "user", tab: "requests" },
  },
  {
    key: "reviews-user", label: "My reviews", audience: ["user"],
    what: "Reviews you've written — edit them or add photos.",
    how: ["Open the My reviews tab.", "See every review you've posted.", "Edit or add photos to keep them helpful."],
    faqs: [], faqCategory: "Getting started", dashboard: { surface: "user", tab: "reviews" },
  },
];

export function helpByKey(key: string): HelpFeature | undefined {
  return HELP.find((h) => h.key === key);
}

export function helpForTab(surface: "owner" | "user", tab: string): HelpFeature | undefined {
  return HELP.find((h) => h.dashboard?.surface === surface && h.dashboard.tab === tab);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/help-content.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add lib/help-content.ts tests/unit/help-content.test.ts
git commit -m "feat(help): shared help-content source powering FAQ + dashboard callouts

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Nested, flag-aware FAQ page

**Files:**
- Modify: `lib/faq.ts` (move `TRAVEL_FAQ` + `BUSINESS_FAQ` here as exports)
- Modify: `components/screens/pages.tsx` (rewrite `FaqScreen`, drop the local FAQ consts)
- Modify: `app/faq/page.tsx` (force-dynamic + pass enabled feature FAQs to JSON-LD)

**Interfaces:**
- Consumes: `HELP`, `helpByKey` (Task 1); `getServerFlags()` (`lib/feature-flags.ts`); `Flags` (`lib/flags.ts`).
- Produces: `FaqScreen({ flags }: { flags: Flags })` — now takes resolved flags so it renders only enabled feature sub-groups. `lib/faq.ts` now exports `HOME_FAQ`, `VERIFY_FAQ`, `TRAVEL_FAQ`, `BUSINESS_FAQ`.

- [ ] **Step 0: Move `TRAVEL_FAQ` + `BUSINESS_FAQ` into `lib/faq.ts`**

They currently live as local `const`s at `components/screens/pages.tsx:303` and `:309`. Cut both arrays out of `pages.tsx` and paste them into `lib/faq.ts` as exports (append after `VERIFY_FAQ`), typed `QA[]`:

```ts
export const TRAVEL_FAQ: QA[] = [ /* the array currently at pages.tsx:303 */ ];
export const BUSINESS_FAQ: QA[] = [ /* the array currently at pages.tsx:309 */ ];
```

Preserve their exact content verbatim. After this, `pages.tsx` no longer defines them locally.

- [ ] **Step 1: Rewrite `FaqScreen` in `components/screens/pages.tsx`**

Replace the existing `export function FaqScreen()` with a flag-aware, nested version. It merges the legacy category arrays (`HOME_FAQ`, `VERIFY_FAQ`, `TRAVEL_FAQ`, `BUSINESS_FAQ`) with per-feature `HELP` FAQs, grouped by `faqCategory`, with a sticky jump-nav and per-feature anchors.

```tsx
// add imports at top of pages.tsx (near the existing faq import on line 8):
import { HELP, type FaqCategory } from "@/lib/help-content";
import type { Flags } from "@/lib/flags";
// update the existing lib/faq import (line 8) to pull all four arrays now that
// TRAVEL_FAQ + BUSINESS_FAQ live there (Step 0):
//   import { HOME_FAQ, VERIFY_FAQ, TRAVEL_FAQ, BUSINESS_FAQ } from "@/lib/faq";

const FAQ_ORDER: FaqCategory[] = ["Getting started", "Features", "For businesses", "Travel", "Trust & verification"];

export function FaqScreen({ flags }: { flags: Flags }) {
  // Legacy flat categories keep their content.
  const legacy: Record<FaqCategory, { q: string; a: string }[]> = {
    "Getting started": [...HOME_FAQ],
    "Features": [],
    "For businesses": [...BUSINESS_FAQ],
    "Travel": [...TRAVEL_FAQ],
    "Trust & verification": [...VERIFY_FAQ],
  };

  // Per-feature sub-groups (only enabled features), grouped by category.
  const enabled = HELP.filter((h) => !h.flag || flags[h.flag]);
  const featureGroups: Record<string, { key: string; label: string; faqs: { q: string; a: string }[] }[]> = {};
  for (const h of enabled) {
    if (h.faqs.length === 0) continue;
    (featureGroups[h.faqCategory] ||= []).push({ key: h.key, label: h.label, faqs: h.faqs });
  }

  const categories = FAQ_ORDER.filter(
    (c) => legacy[c].length > 0 || (featureGroups[c] && featureGroups[c].length > 0),
  );

  return (
    <div className="screen-in hh-page">
      <Crumb trail={[{ label: "Home", href: "/" }, { label: "FAQ" }]} />
      <div className="hh-wrap hh-section" style={{ maxWidth: 900 }}>
        <h1 style={{ fontSize: "1.9rem", marginBottom: 6 }}>Frequently asked questions</h1>
        <p className="muted" style={{ marginBottom: 18 }}>
          How Humble Halal works — finding halal places, our trust badges, features and travel. Still stuck? <Link href="/contact">Contact us</Link>.
        </p>

        {/* sticky jump-nav */}
        <nav className="faq-jump" aria-label="FAQ categories">
          {categories.map((c) => (
            <a key={c} href={`#${slugCat(c)}`} className="faq-jump-link">{c}</a>
          ))}
        </nav>

        {categories.map((c) => (
          <section key={c} id={slugCat(c)} style={{ marginBottom: 30 }}>
            <h2 style={{ fontSize: "1.3rem", marginBottom: 12 }}>{c}</h2>

            {/* category-level (legacy) Q&As */}
            <div className="flt-faq">
              {legacy[c].map((it) => (
                <details key={it.q} className="flt-faq-item"><summary>{it.q}<span className="faq-chevron" aria-hidden="true" /></summary><p>{it.a}</p></details>
              ))}
            </div>

            {/* per-feature sub-groups */}
            {(featureGroups[c] || []).map((g) => (
              <div key={g.key} id={g.key} className="faq-subgroup">
                <h3 style={{ fontSize: "1.05rem", margin: "16px 0 8px" }}>{g.label}</h3>
                <div className="flt-faq">
                  {g.faqs.map((it) => (
                    <details key={it.q} className="flt-faq-item"><summary>{it.q}<span className="faq-chevron" aria-hidden="true" /></summary><p>{it.a}</p></details>
                  ))}
                </div>
              </div>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}

function slugCat(c: string): string {
  return c.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
```

- [ ] **Step 2: Add minimal CSS for the jump-nav + subgroup**

Append to `styles/screens2.css`:

```css
/* FAQ jump-nav + feature sub-groups */
.faq-jump { position: sticky; top: 60px; z-index: 5; display: flex; flex-wrap: wrap; gap: 8px; padding: 10px 0; margin-bottom: 18px; background: var(--cream, #fbf7ef); border-bottom: 1px solid var(--line, #e7e2d6); }
.faq-jump-link { font-size: .82rem; font-weight: 700; padding: 6px 12px; border-radius: 999px; border: 1px solid var(--line, #e7e2d6); color: var(--emerald, #0f5c4a); text-decoration: none; white-space: nowrap; }
.faq-jump-link:hover { background: var(--emerald-50, #e9f6f0); }
.faq-subgroup { scroll-margin-top: 110px; }
```

- [ ] **Step 3: Update `app/faq/page.tsx` — force-dynamic + flag-aware JSON-LD**

```tsx
import { FaqScreen } from "@/components/screens/pages";
import { pageMeta } from "@/lib/seo";
import { JsonLd, faqJsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";
import { HOME_FAQ, VERIFY_FAQ, TRAVEL_FAQ, BUSINESS_FAQ } from "@/lib/faq";
import { HELP } from "@/lib/help-content";
import { getServerFlags } from "@/lib/feature-flags";

// Flag-gated content → evaluate per request so toggles reflect immediately.
export const dynamic = "force-dynamic";

export const metadata = pageMeta({ title: "Frequently asked questions — Humble Halal", description: "Answers about finding halal places in Singapore, our trust badges and verification, our features (Ask AI, TikTok, Halal Passport and more), and Muslim-friendly travel.", path: "/faq" });

export default async function Page() {
  const flags = await getServerFlags();
  const featureFaqs = HELP.filter((h) => !h.flag || flags[h.flag]).flatMap((h) => h.faqs);
  const allFaqs = [...HOME_FAQ, ...VERIFY_FAQ, ...TRAVEL_FAQ, ...BUSINESS_FAQ, ...featureFaqs];
  return (
    <>
      <JsonLd data={[faqJsonLd(allFaqs), breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "FAQ", path: "/faq" }])]} />
      <FaqScreen flags={flags} />
    </>
  );
}
```

- [ ] **Step 4: Typecheck + build**

Run: `npx tsc --noEmit && npm run build`
Expected: no errors; `/faq` builds as a dynamic (ƒ) route.

- [ ] **Step 5: Manual verify (dev)**

Run dev with a feature flag on: `TIKTOK_UGC_ENABLED=1 HAWKER_FINDER_ENABLED=1 npm run dev`, then:
`curl -s localhost:3000/faq | grep -oE "TikTok features|Hawker Finder|FAQ categories"` — expect the feature labels present. Toggle a flag off and confirm its sub-group disappears.

- [ ] **Step 6: Commit**

```bash
git add components/screens/pages.tsx app/faq/page.tsx styles/screens2.css
git commit -m "feat(faq): nested, flag-aware FAQ from shared help-content + jump-nav

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: `HelpCallout` component

**Files:**
- Create: `components/help-callout.tsx`
- Modify: `styles/screens2.css` (callout styles)

**Interfaces:**
- Consumes: `helpByKey` (Task 1); `useApp().flags` (`components/app-context.tsx`); `Icon` (`components/ui`).
- Produces: `HelpCallout({ feature }: { feature: string })` — renders a dismissible help box, or null when the feature's flag is off / unknown.

- [ ] **Step 1: Write `components/help-callout.tsx`**

```tsx
"use client";

/* Dismissible "what is this / how it works" callout for a dashboard tab.
   Content comes from lib/help-content (shared with /faq). Renders nothing when
   the feature has a flag that's off. Dismissal is remembered per-key in
   localStorage; a small "?" (rendered by the host tab header) can re-open it. */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "./ui";
import { useApp } from "./app-context";
import { helpByKey } from "@/lib/help-content";

const LS_KEY = "hh_help_dismissed";

function readDismissed(): string[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); } catch { return []; }
}
function writeDismissed(keys: string[]) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(keys)); } catch { /* ignore */ }
}

export function HelpCallout({ feature }: { feature: string }) {
  const { flags } = useApp();
  const h = helpByKey(feature);
  const [dismissed, setDismissed] = useState(true); // default hidden until we read LS (avoids flash)

  useEffect(() => { setDismissed(readDismissed().includes(feature)); }, [feature]);

  if (!h) return null;
  if (h.flag && !flags?.[h.flag]) return null;
  if (dismissed) return null;

  const dismiss = () => {
    const next = Array.from(new Set([...readDismissed(), feature]));
    writeDismissed(next);
    setDismissed(true);
  };

  return (
    <div className="help-callout" role="note">
      <div className="help-callout-body">
        <div className="help-callout-title"><Icon name="info" size={16} /> {h.label}</div>
        <p className="help-callout-what">{h.what}</p>
        <details className="help-callout-how">
          <summary>How it works</summary>
          <ol>{h.how.map((s, i) => <li key={i}>{s}</li>)}</ol>
          {h.faqs.length > 0 && <Link className="help-callout-more" href={`/faq#${h.key}`}>More in the FAQ →</Link>}
        </details>
      </div>
      <button className="help-callout-x" onClick={dismiss} aria-label={`Dismiss ${h.label} help`}><Icon name="x" size={16} /></button>
    </div>
  );
}

/** Small re-open control for a tab header: clears the dismissed flag for `feature`. */
export function HelpReopen({ feature }: { feature: string }) {
  const h = helpByKey(feature);
  if (!h) return null;
  const reopen = () => {
    writeDismissed(readDismissed().filter((k) => k !== feature));
    // Nudge listeners in the same tab: a storage event doesn't fire for same-tab
    // writes, so dispatch a custom event the callout could listen to if needed.
    window.dispatchEvent(new Event("hh-help-reopen"));
  };
  return <button className="help-reopen" onClick={reopen} aria-label={`Show ${h.label} help`}><Icon name="info" size={15} /></button>;
}
```

Note: to keep Task 4 simple, the host tab re-mounts `HelpCallout` on tab switch (the dashboards already re-render tab content on `tab` change), so `HelpReopen` clearing localStorage + a tab re-render is enough to re-show it. Wire `HelpReopen` only where a header slot exists; it's optional per tab.

- [ ] **Step 2: Add callout styles**

Append to `styles/screens2.css`:

```css
/* Dashboard help callout */
.help-callout { display: flex; gap: 10px; align-items: flex-start; justify-content: space-between; padding: 12px 14px; margin-bottom: 16px; border: 1px solid var(--emerald-200, #bfe3d6); border-radius: 12px; background: var(--emerald-50, #e9f6f0); }
.help-callout-title { font-weight: 800; font-size: .95rem; display: flex; align-items: center; gap: 6px; color: var(--emerald-800, #0b4a3b); }
.help-callout-what { margin: 4px 0 0; font-size: .88rem; color: var(--ink, #23271f); line-height: 1.45; }
.help-callout-how { margin-top: 6px; }
.help-callout-how > summary { cursor: pointer; font-size: .82rem; font-weight: 700; color: var(--emerald, #0f5c4a); }
.help-callout-how ol { margin: 8px 0 0 18px; font-size: .85rem; line-height: 1.5; display: grid; gap: 4px; }
.help-callout-more { display: inline-block; margin-top: 8px; font-size: .82rem; font-weight: 700; color: var(--emerald, #0f5c4a); }
.help-callout-x { flex: none; border: 0; background: transparent; cursor: pointer; color: var(--ink-soft, #5b6d64); padding: 2px; }
.help-reopen { border: 0; background: transparent; cursor: pointer; color: var(--emerald, #0f5c4a); padding: 2px; }
```

- [ ] **Step 3: Typecheck + build**

Run: `npx tsc --noEmit && npm run build`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/help-callout.tsx styles/screens2.css
git commit -m "feat(help): dismissible HelpCallout component (shared help-content)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: Wire callouts into `/owner` and `/dashboard`

**Files:**
- Modify: `components/screens/business.tsx` (`OwnerDashboardScreen`, tab render blocks ~760-953)
- Modify: `components/screens/misc.tsx` (`UserDashboardScreen`, tab render ~462)

**Interfaces:**
- Consumes: `HelpCallout` (Task 3).

- [ ] **Step 1: Owner dashboard — import + mount callouts**

In `components/screens/business.tsx`, add the import near the top:

```tsx
import { HelpCallout } from "../help-callout";
```

Then add a callout at the top of each mapped tab's content. The tabs render as `{tab === "cert" && <CertVault .../>}` etc. Wrap each target so the callout appears above it. For the `cert`, `events`, `ads`, `payouts`, `reviews`, `leads`, `billing` tabs, prepend the callout. Example for the cert tab (line ~938):

```tsx
{tab === "cert" && <><HelpCallout feature="cert-vault" /><CertVault toast={toast} navigate={navigate} live={live} certVaultEnabled={flags.certVault} biz={myBiz} /></>}
```

Apply the same pattern with these feature keys:
- `events` tab → `feature="events"`
- `ads` tab → `feature="sponsored-ads"`
- `payouts` tab → `feature="payouts"`
- `reviews` tab → `feature="reviews-owner"`
- `leads` tab → `feature="leads"`
- `billing` tab → `feature="billing"`

For tabs whose block is multi-line (e.g. `events`, `reviews`, `billing` use `(...)`), place `<HelpCallout .../>` as the first child inside the existing fragment/wrapper.

- [ ] **Step 2: User dashboard — import + mount callouts**

In `components/screens/misc.tsx`, add:

```tsx
import { HelpCallout } from "../help-callout";
```

At the passport tab render (line ~462) and the other mapped tabs, prepend the callout:

```tsx
{tab === "passport" && <><HelpCallout feature="passport" /><PassportScreen /></>}
```

Apply for: `collections` → `feature="collections"`, `requests` → `feature="requests"`, `reviews` → `feature="reviews-user"`.

- [ ] **Step 3: Typecheck + build**

Run: `npx tsc --noEmit && npm run build`
Expected: no errors.

- [ ] **Step 4: Manual verify (dev + agent-browser)**

Run dev, sign in as a business owner, open `/owner` → Sponsored ads tab → the callout shows above the ads panel; dismiss it → it disappears; reload → still dismissed (localStorage). Repeat one tab on `/dashboard`.

- [ ] **Step 5: Commit**

```bash
git add components/screens/business.tsx components/screens/misc.tsx
git commit -m "feat(help): mount HelpCallout on /owner and /dashboard tabs

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: Beehiiv — misconfig signal + CTA copy audit

**Files:**
- Modify: `lib/beehiiv.ts` (surface a `status` on non-2xx)
- Modify: `app/api/subscribe/route.ts` (log + return a clearer signal when configured-but-rejected)
- Test: `tests/unit/beehiiv.test.ts`
- Modify (copy audit): `components/newsletter.tsx` callers with guide-specific CTAs (only if any promise unbuilt guides)

**Interfaces:**
- Produces: `BeehiivResult` gains optional `status?: number` and `configured?: boolean`.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/beehiiv.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { deriveIntent } from "@/lib/beehiiv";

describe("beehiiv deriveIntent", () => {
  it("maps sources to coarse intents", () => {
    expect(deriveIntent("tool:zakat")).toBe("deen");
    expect(deriveIntent("umrah")).toBe("travel");
    expect(deriveIntent("event")).toBe("events");
    expect(deriveIntent("ramadan")).toBe("seasonal");
    expect(deriveIntent("advertise")).toBe("owner");
    expect(deriveIntent("footer")).toBe("general");
    expect(deriveIntent("popup")).toBe("foodie");
  });
});
```

- [ ] **Step 2: Run test to verify it passes (deriveIntent already exists)**

Run: `npx vitest run tests/unit/beehiiv.test.ts`
Expected: PASS — this locks current segmentation behavior before we touch the module.

- [ ] **Step 3: Add a status/configured signal in `lib/beehiiv.ts`**

Change the `BeehiivResult` type and the return paths:

```ts
export type BeehiivResult = { ok: boolean; already?: boolean; simulated?: boolean; status?: number; configured?: boolean };
```

In `beehiivSubscribe`, when not configured: `return { ok: true, simulated: true, configured: false };`
On the API response: `if (res.ok) return { ok: true, configured: true, ...(res.status === 200 ? { already: true } : {}) };` and `return { ok: false, configured: true, status: res.status };`
In the `catch`: `return { ok: false, configured: true };`

- [ ] **Step 4: Surface it in `app/api/subscribe/route.ts`**

After the `beehiivSubscribe` call, before the final response:

```ts
  if (!r.ok && r.configured) {
    // Configured but beehiiv rejected — most often a bad API key / wrong publication
    // pairing (fails silently otherwise, like the platform_settings service-role bug).
    console.error("[subscribe] beehiiv rejected", { status: r.status, source });
    return NextResponse.json({ ok: false, error: "Subscription service unavailable — please try again." }, { status: 502 });
  }
```

Keep the existing success branch unchanged.

- [ ] **Step 5: Run tests + typecheck**

Run: `npx vitest run && npx tsc --noEmit`
Expected: all pass, no type errors.

- [ ] **Step 6: CTA copy audit**

Grep for capture CTAs that promise a specific guide: `grep -rn "guide\|download\|free PDF\|lead magnet" components/newsletter.tsx components/*newsletter* app/**/*.tsx | grep -i cta` — for any that promise an unbuilt guide, change the `cta`/surrounding copy to a general "Join the weekly halal guide" / "Subscribe". Do NOT remove the `source`/`intent` tagging. If none exist, note "no guide-specific CTAs found" and skip.

- [ ] **Step 7: Commit**

```bash
git add lib/beehiiv.ts app/api/subscribe/route.ts tests/unit/beehiiv.test.ts components/newsletter.tsx
git commit -m "fix(newsletter): surface beehiiv misconfig instead of silent fail; general CTAs

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Final verification (after all tasks)

- [ ] `npx vitest run` — all unit tests pass (incl. new help-content + beehiiv).
- [ ] `npx tsc --noEmit` — 0 errors.
- [ ] `npm run build` — success; `/faq` is dynamic (ƒ).
- [ ] `npm run lint` — 0 new errors.
- [ ] Manual: `/faq` shows nested categories + jump-nav, feature groups gated by flags; `/owner` + `/dashboard` show dismissible callouts.
- [ ] Open PR `feat/help-faq-newsletter` → master.

## User (prod) actions — document in the PR

- Set `BEEHIIV_API_KEY` + `BEEHIIV_PUBLICATION_ID` (matching account) in Vercel prod.
- Configure ONE general welcome email in the beehiiv dashboard.
- Review copy for `halalSensitive` entries (cert-vault, halal-verdicts) before/after ship.

## Follow-on (separate plan)

Notifications for admin + business owner — diagnosis + coverage-fill on the existing `notifications` table (0033) / `lib/notify.ts` / `notification-bell.tsx`. Not part of this plan.
