# LiteAPI ↔ Google Hotel Center — setup runbook

**What this is.** Google Hotel Center (GHC) is a distribution channel: LiteAPI pushes
your bookable hotel rates into Google Hotels, so Humble Halal appears as a point of
sale in Google's hotel search and maps. It drives qualified traffic straight to our
hotel pages. This is **mostly account/feed configuration on the LiteAPI + Google side**,
not app code — the app's job is to (a) accept Google's deep links and (b) render a
bookable rate from a cold URL.

## App-side contract (already supported)

The hotel detail route accepts rate deep-link params and re-prices live:

```
/travel/hotel/{liteapiHotelId}?checkin=YYYY-MM-DD&checkout=YYYY-MM-DD&currency=USD
```

- Implemented in [app/travel/hotel/[id]/page.tsx](../../app/travel/hotel/[id]/page.tsx)
  (`searchParams.checkin/checkout/currency` → `hotelDetail(id, dates)`).
- The hotel id in the URL is the **LiteAPI hotel id**, which is what GHC carries.
- Booking still requires `PAID_HOTELS_ENABLED=1` (see [lib/flags.ts](../../lib/flags.ts)).

### Known follow-up (do before GHC go-live)

- **Occupancy not yet threaded.** The deep link reads dates + currency but not
  `adults`/`children`/`rooms`; `hotelDetail()` prices a default occupancy. For exact
  landed-price parity with the GHC feed, extend `hotelDetail(id, dates)` and the page
  to read occupancy params and pass `occupancies` into the live rate fetch.
- **Landed price accuracy.** GHC compares the feed price to the price shown on landing.
  Confirm the rate the page shows (taxes/fees inclusive) matches what the LiteAPI feed
  reports, or Google will flag price-accuracy issues.

## Setup steps (LiteAPI + Google)

1. **Enable the channel in the LiteAPI dashboard.** LiteAPI → Distribution / Google
   Hotel Center → connect. LiteAPI provisions the rate feed (ARI/price + property feed).
2. **Link Google Hotel Center / Google Ads.** Create or link a Hotel Center account and
   set Humble Halal as a **point of sale (POS)** with the deep-link template above
   (Google substitutes `(PARTNER-HOTEL-ID)`, `(CHECKIN)`, `(CHECKOUT)`, currency, and
   occupancy tokens into the URL).
3. **Set the POS URL** to our pattern, e.g.:
   `https://humblehalal.sg/travel/hotel/(PARTNER-HOTEL-ID)?checkin=(CHECK-IN)&checkout=(CHECK-OUT)&currency=(USER-CURRENCY)`
4. **Currency / point-of-sale region.** Match the feed currency and POS country to our
   default (`USD`, guest nationality `SG`) or expand as needed.
5. **Go live gates.** Turn on `PAID_HOTELS_ENABLED` so the landing page can actually
   book; verify webhook secret (`LITEAPI_WEBHOOK_SECRET`) is set so booking status
   updates flow back ([app/api/travel/webhook/route.ts](../../app/api/travel/webhook/route.ts)).

## Verification

- Hit a deep link directly (sandbox): `/travel/hotel/<id>?checkin=<+30d>&checkout=<+32d>&currency=USD`
  → the page renders the hotel with live offers and a working "Book" CTA.
- In GHC, run the **Price accuracy / coverage** report after the first feed sync; resolve
  any landed-price mismatches (usually the occupancy/taxes follow-up above).
- Confirm a test booking from a deep-linked page records to `hotel_bookings` and the
  weekly figures appear in **Admin → Travel revenue → LiteAPI weekly sales**.

## Ownership

GHC feed wiring is a growth task owned by ops once Phases 1–3 (voucher, filters,
discovery) are live. The app-side deep-link contract above is the only code dependency
and is already in place apart from the occupancy follow-up.
