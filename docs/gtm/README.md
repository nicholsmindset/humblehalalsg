# GTM Container Import — Humble Halal

`humblehalal-gtm-container.json` is a ready-to-import Google Tag Manager container that wires up the whole stack against the dataLayer the site already emits (see [../tracking-measurement-setup.md](../tracking-measurement-setup.md)).

**What's inside (v2 — full-journey + owner segmentation + revenue):** 58 tags, 31 triggers, 56 variables.
- **Consent | Default** (Consent Mode v2, defaults denied) + **Conversion Linker**
- **GA4**: Config (page_view OFF) + **31 event tags** — the original 8 (`page_view`, `sign_up`, `view_listing`, `generate_lead`, `contact`, `newsletter_signup`, `event_rsvp`, `purchase`) plus journey events (`search`, `search_result_click`, `filter_use`, `map_open`, `ai_query`, `ai_result_click`, `save_listing`, `share`, `claim_click`, `cert_view`, `begin_checkout`, `ad_impression`, `ad_click`, `view_event`, `add_to_calendar`, `review_submit`, `follow`, `tool_use`, `blog_read`) and **owner events** (`owner_add_listing`, `owner_create_event`, `owner_lead_won`, `owner_action`)
- **`GTES - User`** (Google Tag Event Settings variable): attaches **`user_id`** (Clerk id, consent-gated by the site) + user properties **`user_role` / `owner_business_id` / `owner_plan`** to every GA4 event tag → segment anything by business owner
- **Ecommerce**: `begin_checkout` + `purchase` read the dataLayer `ecommerce` object ("Send Ecommerce data" ON) → proper revenue reports; real order values also arrive server-side via the Stripe webhook → GA4 Measurement Protocol (lib/ga4-mp.ts)
- **Meta**: Base + PageView, ViewContent, Lead, CompleteRegistration, Contact, Subscribe, **InitiateCheckout**, Purchase
- **TikTok**: Base + Pageview, ViewContent, SubmitForm, CompleteRegistration, Contact, Subscribe, **InitiateCheckout**, CompletePayment
- **LinkedIn**: Base + Conversion (Lead) · **Clarity**: Base · **Google Ads**: Remarketing + Conversion (Lead) + **Conversion (Purchase** with value/currency/order id**)**
- Every marketing tag has **per-tag consent** (`ad_storage`+`ad_user_data`, Ads also `ad_personalization`); Clarity requires `analytics_storage`. Owner events are GA4-only (B2B).

---

## 1. Import

1. GTM → your **Web** container → **Admin → Import Container**.
2. Choose file `humblehalal-gtm-container.json`.
3. **Workspace:** create a new one ("Import — full stack v1").
4. **Merge** → **Rename conflicting tags** (safe: this is a fresh container). *(Use Overwrite only if you're intentionally replacing everything.)*
5. Preview the changes, then **Confirm** (this stages them in the workspace — nothing is live until you Publish in step 4).

> The `accountId`/`containerId`/`GTM-XXXXXXX` in the file are placeholders — GTM remaps them to *your* container on import. The internal tag/trigger/variable IDs are self-consistent, so all links resolve automatically.

## 2. Fill in your IDs (Variables → each `Const -`)

| Variable | Set to |
|---|---|
| `Const - GA4 ID` | `G-XXXXXXXXXX` |
| `Const - Meta Pixel ID` | your Meta pixel id |
| `Const - TikTok Pixel ID` | your TikTok pixel id |
| `Const - LinkedIn Partner ID` | your LinkedIn partner id |
| `Const - Ads Conversion ID` | `AW-XXXXXXXXX` (remarketing) |
| `Const - Clarity ID` | your Clarity project id |

Then edit the two Google Ads conversion placeholders in **`Ads | Conversion - Lead`** (`REPLACE_ADS_CONVERSION_ID_NUMBER` = the number after `AW-`, `REPLACE_LEAD_LABEL` = the conversion label) and the LinkedIn conversion id (`0000000`) in **`LinkedIn | Conversion - Lead`**.

## 3. Duplicate the conversion tags per action (optional but recommended)

The container ships **one** Google Ads and **one** LinkedIn conversion tag (both on `lead_submit`). To count sign-ups, newsletter, and purchases as conversions too, **copy** those tags and repoint the copy's trigger + label:

| Copy → new tag | Trigger | Label |
|---|---|---|
| `Ads \| Conversion - Signup` | `CE - sign_up` | signup label |
| `Ads \| Conversion - Newsletter` | `CE - newsletter_signup` | newsletter label |
| `Ads \| Conversion - Purchase` | `CE - purchase` | purchase label (add value/currency/txn id) |
| `LinkedIn \| Conversion - Signup/Newsletter/Purchase` | matching `CE -` | matching conversion id |

## 4. Verify, then Publish

1. **Preview** (Tag Assistant) against the site running with `NEXT_PUBLIC_GTM_ID` set.
2. Walk: home → listing → contact click → quote → newsletter → sign up → RSVP.
3. Confirm in the Consent tab that marketing tags are **blocked before consent** and fire **after** Accept; confirm GA4 **DebugView** shows one `page_view` per route + each event once.
4. Full checklist: [../tracking-measurement-setup.md §7](../tracking-measurement-setup.md).
5. **Submit → Publish.**

## Notes / gotchas

- **GA4 event tags & the config link:** each `GA4 | Event -` tag references `GA4 | Config` for its Measurement ID. If your account is on the newer split setup and an event tag shows no linked config, set its **Measurement ID** field to `{{Const - GA4 ID}}`.
- **Pixels are Custom HTML** (not gallery templates) so the file is fully self-contained — no template install needed. If you prefer the official community templates later, you can swap them 1:1 (same triggers/variables).
- **Meta/TikTok string params** are quoted for the common case. If any listing name legitimately contains an apostrophe it could break that one payload — the safe hardening (build the payload object from the dataLayer in JS) is noted for Phase 2.
- **Purchase** currently fires client-side on the demo path; the authoritative server-side purchase (Stripe webhook → Meta CAPI / TikTok Events API) is Phase 2 in the main guide.
- **`event_id`** is already on every conversion payload (browser `eventID`/`event_id`) so Phase-2 server events de-duplicate cleanly.
