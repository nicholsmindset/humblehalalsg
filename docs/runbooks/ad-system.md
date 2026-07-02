# Ad system — operations runbook

Admin-controlled ads: **direct sponsors** (owner-booked, brand-safe) + **Google AdSense**
fill for unsold inventory. Direct always wins a slot; AdSense backfills; an empty or
toggled-off slot collapses with no layout shift. Built on migration `0023_ads.sql`,
extended by `0043_ads_adsense.sql`.

## Architecture at a glance

| Piece | File |
|---|---|
| Schema | `supabase/migrations/0023_ads.sql`, `supabase/migrations/0043_ads_adsense.sql` |
| Serving component | `components/ads/ad-slot.tsx` (`<AdSlot slot="…" />`) |
| AdSense loader + unit | `components/ads/adsense.tsx` |
| Back-compat shim | `components/sponsored-slot.tsx` → delegates to `<AdSlot>` |
| Public serving API | `app/api/ads/active/route.ts` (config + creative), `app/api/ads/track/route.ts` (impression/click) |
| Admin: placements | `app/api/admin/placements/route.ts` (toggle + fill mode) |
| Admin: campaigns | `app/api/admin/campaigns/route.ts` (create/status/**review**) |
| Admin: creative upload | `app/api/admin/ads/upload/route.ts` → `ad-creatives` bucket |
| Admin UI | `components/screens/admin.tsx` → **Featured & ads** tab |
| Brand-safety list | `lib/ad-safety.ts` |
| Tracking → GA4 | `lib/analytics.ts` (`track.adImpression` / `track.adClick`) |

## Go-live checklist

1. **Apply the migration.** `supabase db push` (or run `0043_ads_adsense.sql`). It adds
   the per-slot serving config + the review gate and seeds two live slots
   (`blog_article_top`, `directory_hub`) plus four inactive future slots. Existing
   campaigns are grandfathered to `review_status='approved'` so nothing goes dark.
   > The serving APIs `select("*")` and default missing columns, so they keep working
   > even if code deploys a moment before the migration — but apply it promptly.

2. **Create the storage bucket** for sponsor creatives (mirrors `business-photos`):
   ```sql
   insert into storage.buckets (id, name, public) values ('ad-creatives', 'ad-creatives', true)
   on conflict (id) do nothing;
   ```
   (or Dashboard → Storage → New bucket → `ad-creatives`, public).

3. **Direct sponsors work now — no AdSense needed.** In Admin → Featured & ads:
   - **Placements** panel: toggle any slot live/off, set its fill mode
     (Off / Direct only / AdSense fill / Direct → AdSense).
   - **New campaign**: fill the form, upload a creative image, save → it lands
     **pending**. Review it, click **Approve** → it serves. Impressions/clicks/CTR/
     revenue are live in the Campaigns table.

## AdSense go-live (after account approval)

AdSense ships **dark** until you set the publisher id.

1. Get approved at adsense.google.com; note your `ca-pub-XXXXXXXXXXXXXXXX`.
2. Set env `NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-…` (Vercel → Project → Settings → Env),
   redeploy. The loader (`AdsenseScript` in `app/layout.tsx`) now loads.
3. In AdSense, create a **display ad unit per slot** (leaderboard, rectangle, etc.);
   copy each unit's `data-ad-slot` id.
4. In Admin → Featured & ads → Placements, paste each id into the **AdSense slot**
   field for slots whose fill mode is *AdSense fill* or *Direct → AdSense*.
5. **Brand safety:** AdSense → Brand safety → Blocking controls. Block every category
   in `lib/ad-safety.ts` (alcohol, gambling, dating, adult, non-halal food, riba
   finance, conventional insurance, music/entertainment, crypto/trading). The API has
   no client-side blocklist, so the dashboard config is authoritative.
6. **Consent:** the existing cookie banner drives `ad_storage`. AdSense units render
   `data-npa="1"` (non-personalised) until the visitor grants marketing consent.

## Placement inventory

Active now: `homepage_hero`, `blog_inline` (×3), `blog_article_top`, `directory_hub`,
plus `category_featured`, `directory_inline`, `event_featured` (existing direct slots).

Future (seeded inactive — flip `active=true` in the Placements panel and drop
`<AdSlot slot="…"/>` into the template): `directory_hub_side`, `business_detail_mid`,
`tools_inline`, `travel_promo`.

## Later: auto-activation on payment

No schema change needed. A Stripe-webhook path can set a booked campaign's
`review_status='approved'` + `status='active'` on payment (the columns already exist).
Until then, activation is the manual Approve step above.
