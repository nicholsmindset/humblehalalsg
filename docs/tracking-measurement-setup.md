# Humble Halal — Tracking & Measurement Stack (GTM-First Implementation Guide)

| | |
|---|---|
| **Site** | humblehalal.com — Next.js **16.2.9** (App Router), Supabase, Clerk auth, beehiiv newsletter |
| **Architecture** | Everything routed through **Google Tag Manager**; nothing hardcoded that GTM can own |
| **Privacy** | PDPA (Singapore) — **Google Consent Mode v2**, marketing pixels denied until consent |
| **Single source of truth** | One `dataLayer`, fed centrally from [lib/analytics.ts](../lib/analytics.ts) |
| **Status** | Ready to implement — follow §1 order top to bottom; nothing is "done" until §7 verifies it |

---

## Foundation already in the codebase (reuse, don't rebuild)

- **[lib/analytics.ts](../lib/analytics.ts)** — first-party `track.*` module (`pageView / impression / listingView / search / leadAction / newsletterSignup`). **This is our single dataLayer choke-point** — each method gets one `dataLayer.push()`.
- **[components/analytics/page-view.tsx](../components/analytics/page-view.tsx)** — `usePathname()` → `track.pageView` on every route change (already solves the Next.js SPA page-view problem).
- **[components/cookie-consent.tsx](../components/cookie-consent.tsx)** — banner storing `hh_consent_v1`; we upgrade it to drive Consent Mode v2.
- Env convention: `NEXT_PUBLIC_*`.

**Locked decisions:** (1) Extend the existing banner + Consent Mode v2 (no third-party CMP). (2) GA4 runs in Consent Mode with modeled/cookieless pings before consent; **Clarity is fully gated until consent**; all marketing pixels denied until consent. (3) Conversions = `sign_up`, `lead_submit` (quote/claim/suggest/contact), `contact_click`, `newsletter_signup`, event `RSVP`/`purchase`. `view_listing` = engagement, not a conversion.

## ⚑ Inputs YOU must provide (placeholders used throughout)

| Placeholder | What it is | Where to get it |
|---|---|---|
| `GTM-XXXXXXX` | GTM Container ID | tagmanager.google.com → new Web container |
| `G-XXXXXXXXXX` | GA4 Measurement ID | GA4 Admin → Data Streams → Web |
| `META_PIXEL_ID` | Meta Pixel ID | Meta Events Manager |
| `TIKTOK_PIXEL_ID` | TikTok Pixel ID | TikTok Ads → Assets → Events → Web |
| `LINKEDIN_PARTNER_ID` | LinkedIn Insight Partner ID | Campaign Manager → Analyze → Insight Tag |
| `AW-XXXXXXXXX` + labels | Google Ads Conversion ID + per-conversion labels | Ads → Goals → Conversions |
| `CLARITY_ID` | Microsoft Clarity project ID | clarity.microsoft.com |
| DNS access | add TXT to verify Search Console | registrar / Vercel DNS |
| Ad-account admin | build remarketing audiences | each ad platform |

---

## 1. Implementation Order

1. **Repo prep** — add `NEXT_PUBLIC_GTM_ID`, inject GTM in `app/layout.tsx`, centralize `dataLayer` in `lib/analytics.ts`, add the ~6 missing `track.*` calls, upgrade the consent banner. (§Code Changes)
2. **GTM container** — create it; set naming conventions (§5) + built-in Consent Mode defaults first (§6).
3. **dataLayer variables** — create all `DLV -` + `Const -` (§2·①).
4. **GA4** — Config tag (page_view OFF) + event tags + mark conversions. (§2·②)
5. **Consent wiring** — default tag + banner update + per-tag consent requirements. (§6)
6. **Marketing pixels** — Meta → TikTok → LinkedIn → Google Ads → Clarity, each base + events, each consent-gated. (§2)
7. **Search Console** — verify (DNS), submit sitemap, link GA4. (§2·③)
8. **Verify** in GTM Preview + each platform helper (§7), then **Publish**.
9. **Phase 2** later — server-side CAPI / Events API + enhanced conversions. (§8)

---

## 2. Per-Tool Setup

Naming (see §5): Tags `Platform | Type - detail` · Triggers `CE - event_name` / `Init -` / `Consent -` · Variables `DLV - param` / `Const - id`.

### ① Google Tag Manager (foundation)
- Create **Account** "Humble Halal" → **Web Container** `www.humblehalal.com` → `GTM-XXXXXXX`.
- Injection is the only hardcoded piece (GTM itself) — see §Code Changes.
- **Admin → Container Settings → enable "Consent Overview"** (shield icon).
- **Constants:** `Const - GA4 ID`, `Const - Meta Pixel ID`, `Const - TikTok Pixel ID`, `Const - LinkedIn Partner ID`, `Const - Ads Conversion ID`, `Const - Clarity ID`.
- **Custom Event triggers** (exact event names): `CE - page_view`, `CE - sign_up`, `CE - view_listing`, `CE - lead_submit`, `CE - contact_click`, `CE - newsletter_signup`, `CE - event_rsvp`, `CE - purchase`.
- **Data Layer Variables** (v2): `DLV - method`, `DLV - user_role`, `DLV - lead_type`, `DLV - listing_id`, `DLV - listing_name`, `DLV - listing_category`, `DLV - listing_area`, `DLV - contact_method`, `DLV - source`, `DLV - value`, `DLV - currency`, `DLV - transaction_id`, `DLV - item_id`, `DLV - item_name`, `DLV - quantity`, `DLV - event_id`, `DLV - page_path`, `DLV - page_title`, `DLV - page_location`.

### ② GA4 (via GTM)
- GA4 → Data Streams → create Web stream for `https://www.humblehalal.com` → `G-XXXXXXXXXX`. **Disable Enhanced Measurement "Page views"** (our dataLayer is authoritative — prevents double counts).
- **`GA4 | Config`** — Google Tag, Tag ID `{{Const - GA4 ID}}`, **uncheck "Send a page view event when this configuration loads."** Trigger: Initialization → All Pages.
- **`GA4 | Event - page_view`** — Event name `page_view`; params `page_location={{DLV - page_location}}`, `page_path={{DLV - page_path}}`, `page_title={{DLV - page_title}}`. Trigger `CE - page_view`. → exactly one page_view per route incl. first load.
- **Event tags** (each on its `CE -` trigger, params from `DLV -`):
  - `GA4 | Event - sign_up` (`method`, `user_role`)
  - `GA4 | Event - view_listing` (`listing_id`, `listing_name`, `listing_category`, `listing_area`)
  - `GA4 | Event - generate_lead` (`lead_type`, `listing_category`, `value`, `currency`)
  - `GA4 | Event - contact` (`contact_method`, `listing_id`, `listing_category`)
  - `GA4 | Event - newsletter_signup` (`source`)
  - `GA4 | Event - event_rsvp` (`item_id`, `item_name`, `quantity`)
  - `GA4 | Event - purchase` (`transaction_id`, `value`, `currency`, `item_id`, `item_name`, `quantity`)
- **Key events (conversions):** Admin → Key events → toggle ON `sign_up`, `generate_lead`, `contact`, `newsletter_signup`, `event_rsvp`, `purchase`. (`view_listing` OFF.)

### ③ Google Search Console
- **Verify = Domain property (DNS):** GSC → Add property → **Domain** `humblehalal.com` → copy the `google-site-verification=…` **TXT** → add at DNS → Verify. Covers www/apex/http/https. *(Fallback: GTM/URL-prefix verification — DNS is cleaner.)*
- **Sitemap:** submit `https://www.humblehalal.com/sitemap.xml`.
- **Link to GA4:** GA4 Admin → Product Links → Search Console links → link property → publish the Search Console report collection.

### ④ Meta (Facebook) Pixel — via GTM
Use the **Facebook Pixel** GTM template (or Custom HTML); base tag must **not** auto-send PageView.
- **`Meta | Base`** — Pixel `{{Const - Meta Pixel ID}}`, Initialize only. Trigger **All Pages**.
- **`Meta | PageView`** — `PageView`; Trigger `CE - page_view`.
- **`Meta | ViewContent`** — `content_ids=[{{DLV - listing_id}}]`, `content_name={{DLV - listing_name}}`, `content_category={{DLV - listing_category}}`, `content_type=product`; `CE - view_listing`.
- **`Meta | Lead`** — `Lead`, `eventID={{DLV - event_id}}`; `CE - lead_submit`.
- **`Meta | CompleteRegistration`** — `eventID={{DLV - event_id}}`; `CE - sign_up`.
- **`Meta | Contact`** — `eventID={{DLV - event_id}}`; `CE - contact_click`.
- **`Meta | Subscribe`** — `CE - newsletter_signup`.
- **`Meta | Purchase`** — `value`, `currency`, `eventID`; `CE - purchase`.
- **All Meta tags → Consent: require `ad_storage` + `ad_user_data`.**

### ⑤ Microsoft Clarity — via GTM
- **`Clarity | Base`** — Microsoft Clarity GTM template, Project `{{Const - Clarity ID}}`. Trigger **All Pages**. **Consent: require `analytics_storage`** (fully gated — Clarity won't load pre-consent). SPA auto-tracked.

### ⑥ Google Ads remarketing + conversions — via GTM
- **`Ads | Remarketing`** — Google Ads Remarketing, Conversion ID `{{Const - Ads Conversion ID}}`; optional dynamic params `ecomm_prodid={{DLV - listing_id}}`, `ecomm_pagetype`. Trigger **All Pages**.
- **`Ads | Conversion - <name>`** — one per conversion (Conversion ID + Label): Lead `CE - lead_submit`, Signup `CE - sign_up`, Contact `CE - contact_click`, Newsletter `CE - newsletter_signup`, Purchase `CE - purchase` (with `value`,`currency`,`transaction_id`).
- **Consent: `ad_storage` + `ad_user_data` + `ad_personalization`.**
- **Audiences:** link GA4 ↔ Google Ads; build GA4 audiences (all_users, viewed_listing, lead_no_signup) that auto-share to Ads.

### ⑦ TikTok Pixel — via GTM
Use the **TikTok Pixel** GTM template; base auto-PageView OFF.
- **`TikTok | Base`** — `{{Const - TikTok Pixel ID}}`, All Pages.
- **`TikTok | Pageview`** — `CE - page_view`.
- **`TikTok | ViewContent`** — `content_id`, `content_name`, `content_type=product`; `CE - view_listing`.
- **`TikTok | SubmitForm`** — `event_id={{DLV - event_id}}`; `CE - lead_submit`.
- **`TikTok | CompleteRegistration`** — `CE - sign_up`.
- **`TikTok | Contact`** — `CE - contact_click`.
- **`TikTok | Subscribe`** — `CE - newsletter_signup`.
- **`TikTok | CompletePayment`** — `value`, `currency`, `event_id`; `CE - purchase`.
- **All TikTok tags → Consent: `ad_storage` + `ad_user_data`.**

### ⑧ LinkedIn Insight Tag — via GTM
- Campaign Manager → `LINKEDIN_PARTNER_ID`; create conversions (Lead/Signup/Newsletter/Purchase) → get Conversion IDs.
- **`LinkedIn | Base`** — LinkedIn Insight Tag template, Partner `{{Const - LinkedIn Partner ID}}`. Trigger **All Pages** (auto-tracks SPA). **Consent: `ad_storage` + `ad_user_data`.**
- **`LinkedIn | Conversion - <name>`** — specific Conversion ID on `CE - lead_submit` / `CE - sign_up` / `CE - newsletter_signup` / `CE - purchase`.

---

## 3. dataLayer Specification (single source of truth)

The site pushes **platform-agnostic** events; GTM translates each into per-platform tags. All pushes centralized in [lib/analytics.ts](../lib/analytics.ts).

| Event | When | Parameters |
|---|---|---|
| `page_view` | every route change incl. first | `page_path`, `page_title`, `page_location` |
| `sign_up` | Clerk registration completes (register only) | `method` (`email`\|`google`), `user_role` (`user`\|`owner`), `event_id` |
| `view_listing` | business detail screen mounts | `listing_id`, `listing_name`, `listing_category`, `listing_area`, `listing_certified` |
| `lead_submit` | quote/claim/suggest/contact submitted | `lead_type`, `listing_id?`, `listing_category?`, `value?`, `currency?`, `event_id` |
| `contact_click` | call/WhatsApp/website/directions click | `contact_method`, `listing_id`, `listing_name`, `listing_category`, `event_id` |
| `newsletter_signup` | beehiiv subscribe success (new only) | `source`, `event_id` |
| `event_rsvp` | free event RSVP submitted | `item_id`, `item_name`, `quantity`, `value:0`, `currency:'SGD'`, `event_id` |
| `purchase` | paid ticket success | `transaction_id`, `item_id`, `item_name`, `tier`, `quantity`, `value`, `currency:'SGD'`, `event_id` |

`event_id` = per-event UUID; used now by browser pixels (`eventID`/`event_id`) and reused by Phase-2 server events for de-duplication.

### Snippets — add to [lib/analytics.ts](../lib/analytics.ts)
```ts
// --- GTM dataLayer bridge ---
declare global { interface Window { dataLayer?: Record<string, unknown>[] } }

function dl(payload: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(payload);
}
export function newEventId(): string {
  try { return crypto.randomUUID(); }
  catch { return `${Date.now()}-${Math.random().toString(16).slice(2)}`; }
}
```
Add one `dl()` inside each existing `track.*` (keeps Supabase + GTM in lockstep):
```ts
// track.pageView(pathname)
dl({ event: "page_view", page_path: pathname,
     page_location: typeof location !== "undefined" ? location.href : undefined,
     page_title: typeof document !== "undefined" ? document.title : undefined });

// track.listingView(slug, catId)
dl({ event: "view_listing", listing_id: slug, listing_category: catId,
     listing_name: name, listing_area: area, listing_certified: certified });

// track.leadAction(type, slug, catId)   // contact clicks
dl({ event: "contact_click", contact_method: type, listing_id: slug,
     listing_category: catId, event_id: newEventId() });

// track.newsletterSignup(source)
dl({ event: "newsletter_signup", source, event_id: newEventId() });
```
New methods:
```ts
track.signUp = (method, user_role) =>
  dl({ event: "sign_up", method, user_role, event_id: newEventId() });
track.leadSubmit = (lead_type, extra = {}) =>
  dl({ event: "lead_submit", lead_type, ...extra, event_id: newEventId() });
track.eventRsvp = (item_id, item_name, quantity) =>
  dl({ event: "event_rsvp", item_id, item_name, quantity, value: 0, currency: "SGD", event_id: newEventId() });
track.purchase = (o) =>
  dl({ event: "purchase", currency: "SGD", ...o, event_id: newEventId() });
```

### Where each new call goes
| Call | File · anchor |
|---|---|
| `track.signUp(mode==='google'?'google':'email', role)` — only when `mode==='register'` | [components/screens/misc.tsx](../components/screens/misc.tsx) `afterAuth()` (~L76) |
| `track.leadSubmit('quote',{listing_category:vertical})` | `RequestQuoteScreen` submit, before `navigate("success")` (~L550) |
| `track.leadSubmit('claim',{listing_id:picked.id})` | `ClaimScreen` submit (~L723) |
| `track.leadSubmit('suggest')` | `SuggestScreen` submit (~L465) |
| `track.leadSubmit('contact')` | [components/screens/pages.tsx](../components/screens/pages.tsx) `ContactScreen`, on `d.ok` (~L80) |
| `track.eventRsvp(ev.id, ev.title, qty)` | [components/screens/events.tsx](../components/screens/events.tsx) free RSVP, before `navigate("success")` (~L896) |
| `track.purchase({transaction_id, item_id:ev.id, item_name:ev.title, tier:tierName, quantity:qty, value})` | events success screen (post-Stripe). *Authoritative purchase = Phase-2 Stripe webhook.* |
| Already emit via existing calls: `page_view`, `view_listing`, `contact_click`, `newsletter_signup` | page-view.tsx, consumer.tsx (L902, L1038), newsletter.tsx (L41) |

---

## 4. Master Event-Mapping Table

| User action | dataLayer event | GA4 | Meta | TikTok | LinkedIn | Google Ads | Conversion? |
|---|---|---|---|---|---|---|---|
| Any route view | `page_view` | `page_view` | `PageView` | `Pageview` | (auto) | Remarketing | — |
| Registration completes | `sign_up` | `sign_up` ✦ | `CompleteRegistration` | `CompleteRegistration` | Conv-Signup | Conv-Signup | ✅ |
| View business listing | `view_listing` | `view_listing` | `ViewContent` | `ViewContent` | Remarketing (prodid) | Remarketing | — |
| Quote/Claim/Suggest/Contact submit | `lead_submit` | `generate_lead` ✦ | `Lead` | `SubmitForm` | Conv-Lead | Conv-Lead | ✅ |
| Call/WhatsApp/Website click | `contact_click` | `contact` ✦ | `Contact` | `Contact` | — | Conv-Contact | ✅ |
| Newsletter subscribe | `newsletter_signup` | `newsletter_signup` ✦ | `Subscribe` | `Subscribe` | Conv-Newsletter | Conv-Newsletter | ✅ |
| Free event RSVP | `event_rsvp` | `event_rsvp` ✦ | `Lead`/`Schedule` | `SubmitForm` | Conv-Lead | Conv-Lead | ✅ |
| Paid ticket purchase | `purchase` | `purchase` ✦ | `Purchase` | `CompletePayment` | Conv-Purchase | Conv-Purchase | ✅ |

✦ = GA4 Key event. One action → one dataLayer event → correct native event on every platform, sharing `event_id` where a CAPI/Events-API equivalent exists.

---

## 5. Naming Conventions (GTM)

- **Tags:** `Platform | Type - detail` → `GA4 | Config`, `GA4 | Event - generate_lead`, `Meta | ViewContent`, `TikTok | CompletePayment`, `LinkedIn | Conversion - Lead`, `Ads | Conversion - Purchase`, `Clarity | Base`, `Consent | Default`.
- **Triggers:** `CE - <event>`, `Init - Consent (All Pages)`, `All Pages`, `Consent - marketing granted`.
- **Variables:** `DLV - <param>`, `Const - <id>`, `CJS - <name>`, `LT - <name>`.
- **Folders:** one per platform (GA4, Meta, TikTok, LinkedIn, Google Ads, Clarity, Consent).
- **Versioning:** name each published version `vN – <change>`; never edit Live directly.

---

## 6. Consent / PDPA Implementation (Consent Mode v2)

Deny all storage by default; the banner upgrades on user choice. Marketing pixels hard-gated by GTM per-tag consent; GA4 modeled until granted; Clarity waits for `analytics_storage`.

**A. Defaults (GTM-owned, runs before any tag)** — Tag `Consent | Default` (Custom HTML), trigger **Consent Initialization - All Pages**:
```html
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('consent','default',{
    ad_storage:'denied', ad_user_data:'denied', ad_personalization:'denied',
    analytics_storage:'denied', functionality_storage:'granted',
    security_storage:'granted', wait_for_update:500
  });
  try {
    var c = JSON.parse(localStorage.getItem('hh_consent_v1')||'null');
    if (c && c.marketing) gtag('consent','update',{ad_storage:'granted',ad_user_data:'granted',ad_personalization:'granted'});
    if (c && c.analytics) gtag('consent','update',{analytics_storage:'granted'});
  } catch(e){}
</script>
```
> PDPA (SG) has no IAB-TCF requirement, so a simple banner is compliant; default-denied is best practice and future-proofs other regions.

**B. Banner upgrade** ([components/cookie-consent.tsx](../components/cookie-consent.tsx)) — replace binary accept/essential with **Accept all / Reject / Customize (Analytics ▢, Marketing ▢)**. On save:
```ts
// store shape: { analytics:boolean, marketing:boolean, ts:number, v:1 }
localStorage.setItem('hh_consent_v1', JSON.stringify(choice));
window.dataLayer = window.dataLayer || [];
function gtag(){ (window.dataLayer as any).push(arguments); }
gtag('consent','update',{
  analytics_storage: choice.analytics ? 'granted':'denied',
  ad_storage:        choice.marketing ? 'granted':'denied',
  ad_user_data:      choice.marketing ? 'granted':'denied',
  ad_personalization:choice.marketing ? 'granted':'denied',
});
window.dataLayer.push({ event: 'consent_update', analytics_consent: choice.analytics, marketing_consent: choice.marketing });
```

**C. Per-tag consent in GTM** (Tag → Advanced → Consent Settings → "Require additional consent"):
- Meta / TikTok / LinkedIn / Google Ads: `ad_storage` + `ad_user_data` (+ `ad_personalization` for Ads/remarketing).
- Clarity: `analytics_storage`.
- GA4: no *additional* consent — it natively throttles to cookieless modeled pings when `analytics_storage=denied`, upgrading on grant.
- Enable **Consent Overview** and confirm every marketing tag shows required consent before publishing.

---

## 7. Verification Checklist (nothing ships unverified)

Run in **GTM Preview** (Tag Assistant) first, then platform helpers, then Publish.

| Tool | How to verify |
|---|---|
| **GTM** | Preview → load site: Consent Initialization fires; marketing tags show **blocked** until consent; dataLayer shows your events on each action. |
| **Consent Mode** | Tag Assistant → Consent tab: pre-accept all `denied`; click Accept → `consent_update` + states flip `granted`; marketing tags fire. |
| **GA4** | DebugView: `page_view` once per route (no dupes) + `sign_up/generate_lead/contact/newsletter_signup/event_rsvp/purchase` with params; Realtime shows Key events. |
| **SPA page views** | Navigate several client routes → exactly one `page_view` per route (Next.js dup/no-fire bug absent). |
| **Meta Pixel** | Meta Pixel Helper: base + PageView after consent; `ViewContent`, `Lead` (with `eventID`); Events Manager → Test Events. |
| **TikTok Pixel** | TikTok Pixel Helper: base + `Pageview`, `ViewContent`, `SubmitForm`, `CompletePayment`; Events Manager Test code. |
| **LinkedIn** | Insight Tag Helper / Campaign Manager → tag "Active"/"Receiving traffic"; conversions register. |
| **Clarity** | clarity.microsoft.com shows live sessions/heatmaps **only after** consent; zero data pre-consent. |
| **Google Ads** | Ads → Conversions / Tag Assistant: remarketing + conversion tags "Recording" after consent. |
| **Search Console** | Property **Verified**; Sitemap "Success"; GA4 ↔ GSC link active (report populates ~48h). |

Then **GTM → Submit → Publish** (version notes). Re-run DebugView on production.

---

## 8. Phase-2 Roadmap (server-side + enhanced)

1. **Meta Conversions API (CAPI):** server endpoint (e.g. `app/api/track/meta/route.ts`) forwards `Lead/CompleteRegistration/Purchase` with the **same `event_id`** for browser↔server dedup. Prefer a **GTM Server-Side container** (Stape / Cloud Run) as the single server hub.
2. **TikTok Events API:** mirror key events server-side with `event_id` dedup.
3. **GA4 via Server-Side GTM:** first-party cookies + data redaction.
4. **Enhanced Conversions (Google Ads):** hashed email/phone from lead/purchase (consent-gated) for better match rates.
5. **Stripe webhook → server purchase:** make ticket `Purchase` authoritative from the webhook (not just the success screen).
6. **Offline/CRM conversions:** import qualified leads back to Ads/Meta.

---

## Code Changes (the only repo edits; everything else is GTM console)

1. **`.env.example` + env:** add `NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX`.
2. **[app/layout.tsx](../app/layout.tsx):** inject GTM once (`@next/third-parties` `<GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GTM_ID!} />` in `<body>`, or the standard head+noscript snippet). No other tags hardcoded.
3. **[lib/analytics.ts](../lib/analytics.ts):** add the `dl()` bridge + `newEventId()`; add one `dl()` push inside each existing `track.*`; add `track.signUp/leadSubmit/eventRsvp/purchase`.
4. **~6 call sites:** add the `track.*` calls per §3 (misc.tsx ×4, pages.tsx ×1, events.tsx ×2).
5. **[components/cookie-consent.tsx](../components/cookie-consent.tsx):** granular Analytics/Marketing toggles + Consent Mode `gtag('consent','update')` + `consent_update` push; store `{analytics,marketing}` under `hh_consent_v1`.

### End-to-end verification
`npm run dev` → GTM Preview against localhost → walk: home → listing → contact click → quote form → newsletter → sign up → event RSVP. Confirm each dataLayer event (§3) and each platform tag (§4) fire once, gated correctly by consent (§6/§7). Then publish GTM and re-verify on production with DebugView + each pixel helper.
