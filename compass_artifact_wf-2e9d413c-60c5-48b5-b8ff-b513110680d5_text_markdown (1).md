# Building a Full Online Travel Agency on LiteAPI for HumbleHalal: Capability Map, Tech Feature Set & CX Roadmap

## TL;DR
- **LiteAPI can fully power the hotels pillar of your OTA — and now offers a native (gated) Flights API — but cars, activities/tours, and airport transfers are NOT covered and require complementary providers** (Mozio for transfers, Viator/GetYourGuide for activities, a car-rental aggregator, and either LiteAPI Flights or Duffel/Kiwi for air). Hotels are the right wedge: LiteAPI gives 2.6M+ properties, white-label, payments, and your own markup with zero supplier contracts.
- **Launch hotels-first as a halal-filtered booking layer on humblehalal.com.** The defensible differentiator is not breadth (Booking.com wins that) but halal-specific trust: alcohol-free filtering, halal-food-nearby, prayer/qibla data, women-friendly facilities, family rooms, and Umrah/Ramadan packages — the exact playbook HalalBooking has validated in a market projected to reach US$230 billion in spend by 2030.
- **Sequence: (1) hotels white-label or API MVP with halal filters → (2) airport transfers + activities (easy commission ancillaries) → (3) flights (operationally hardest) → (4) cars.** Use LiteAPI's free white-label to validate demand in weeks, then move to a custom API build for differentiated halal UX.

## Key Findings

### What LiteAPI covers vs. what needs a separate provider
| OTA pillar | LiteAPI native? | Recommendation |
|---|---|---|
| **Hotels** | ✅ Yes — core product, 2.6M+ properties, 300+ suppliers | Build on LiteAPI |
| **Flights** | ⚠️ Partial — native Flights API exists but is gated (access not on by default, sandbox + production both require approval, booking only via credit line today) | Pilot LiteAPI Flights; keep Duffel/Kiwi as alternative |
| **Car rental** | ❌ No | Separate provider (CarTrawler, Discover Cars affiliate, Amadeus Cars) |
| **Activities/tours** | ❌ No ("Experiences" is "coming soon") | Viator (300k+ products) or GetYourGuide |
| **Airport transfers** | ❌ No | Mozio (white-label/API/widget, 190+ countries) |

### LiteAPI technical feature set (hotels)
- **Search/availability:** `POST /hotels/rates` is the primary endpoint — search by hotel IDs, city/country, lat/long+radius, Google Place ID, IATA code, or natural-language AI search. Filters by star rating, facilities, chains, accessibility. Multi-room/group occupancy. Default 200 hotels, expandable to 5,000. Recommended 6–12s timeout.
- **Static content:** `GET /data/hotels`, `/data/hotel`, `/data/reviews`, `/data/cities`, `/data/countries`, `/data/currencies`, `/data/iataCodes`. Includes descriptions, amenities, images, mapped room images, and a hotel reviews endpoint. The "Cupid" engine maps, deduplicates, and enriches supplier content.
- **Booking flow:** Three-step — `POST /rates/prebook` (locks rate, returns transaction ID, flags price/cancellation/board changes) → `POST /rates/book` (confirms with guest + payment data) → returns booking ID + hotel confirmation code. Instant confirmation; vouchers/confirmation data in response. Booking management + cancellation endpoints with refundable (RFN) / non-refundable (NRFN) tags and time-bound cancellation policies.
- **Payments / merchant of record:** Two models. (1) LiteAPI as MoR via their payment SDK (Stripe-based; prebook returns a Stripe secret/transaction ID) — they handle PCI/payments, you set a `margin`. (2) You as MoR on net rates (`margin:0`) — full control, you handle payments. Wallet + credit-card billing; daily invoices.
- **Revenue/markup:** `margin` and `additionalMarkup` params on the rates endpoint, or a default markup in dashboard. `margin:0` = net rate; any positive value = your commission. Dynamic Markup (AI, competitor-aware) and Markup Optimization Rules now available. Caution: don't sell below the Suggested Selling Price (SSP) on public channels — use a closed user group (login wall) for below-SSP rates.
- **Whitelabel:** Free, no-code, fully-hosted branded OTA. Free `yourbrand.nuitee.link`/`.liteapi.travel` subdomain or custom domain. Configure logo/colors/markup/support contact, optional login wall, accessibility-only filter, 10% guest-vs-member price nudge. LiteAPI handles guest payments; earnings split into "Upcoming" (pre-check-in) and "Available" (checked-in); payouts every Monday to a connected account. Loyalty program integration (card-linked or SSO), deep-linking, SSO.
- **Developer experience:** REST + GraphQL; OpenAPI specs; MCP-native (Claude/ChatGPT/Gemini). SDKs in Node.js, Python, Golang, Swift, Android. Sandbox mirrors production (test card 4242…). Open-source example apps. 40+ languages. Rate limits: sandbox 5 req/s, production 27,000 req/min. Dashboard analytics (error rates, response times, API logs). Marketed time-to-integrate: "hours, not weeks"; Revolut cited 3 weeks to production.
- **Pricing/commercial:** Core booking/management endpoints free. Premium endpoints priced per-request (Places: $0.01/req; Price Index: $0.05/req confirmed). A "managed content fee per booking" exists (amount not public). Payment SDK transaction fee 2.9% or 3.9% (local vs. international card). No paperwork to start. The main per-endpoint pricing table is on a JS-rendered page; exact search/book overage figures should be confirmed in-dashboard.
- **Coverage:** 2.6M+ (marketing also says 3M+/40M+ incl. long-tail) properties, 300+ suppliers, 190+ countries.
- **Loyalty/vouchers/analytics:** Loyalty API (cashback %, points accrual, guest tracking via guestId, 10 points = $1 redemption); Vouchers API (percentage discounts, min spend, max discount, validity windows, usage limits); analytics/reporting (most-booked hotels, weekly/market reports), webhooks.

### The halal-travel opportunity & competitive landscape
- **Market:** Per the 2025 Mastercard-CrescentRating Global Muslim Travel Index, "international Muslim arrivals reached 176 million in 2024 – up 25% from 2023 – and are projected to grow to 245 million by 2030. By then, total travel spending is expected to reach USD$230 billion." For context, the wider global halal economy is "worth more than $2 trillion worldwide" spanning food, finance, fashion, pharmaceuticals and lifestyle (Impact Wealth, 2026). GMTI 2025 trends: smart apps for faith-aligned journeys, the modern female Muslim traveler, and a solo-travel surge.
- **Competitors:** **HalalBooking** (HQ London, founded 2009 per PitchBook; 500,000+ properties in 100+ countries) is the category leader. Its $52.5M figure was the Dec 2019 Series A valuation; valuation rose to $102 million in July 2023 ("helping the company to reach a valuation of $102 million," ShortTermRentalz) on ~$52M of 2022 sales and a "17 per cent profit margin" per CEO Elnur Seyidli. Its scale per Startupmag: "850,000 members from 110 countries, supported by a network of 2,600 affiliate agency partners" and "more than 50 API integrations, including… Expedia, Agoda, and Hotelbeds." HalalBooking's granular filters — halal-food gradations, alcohol-free areas, women-only beaches/pools/spas, modest-swimwear flags, Haram-view/walking-distance Makkah/Madinah filters, verified halal-conscious reviews — define the category. **Tripfez** (Malaysia; merged with HolidayMe 2018; Umrah specialist, first Shariah-compliant-certified OTA via Malaysia's MDEC). Also HalalTrip, Salam Booking, Rihaala, UmrahMe. Big OTAs (Agoda's Umrah section) are circling but the segment remains underserved.
- **Halal feature set that matters:** halal food (on-site/nearby gradations), alcohol-free filtering, prayer room/qibla/mosque proximity, women-only/family-friendly facilities, modest-swimwear info, Ramadan/Hajj/Umrah packages, Haram-proximity filters, verified reviews from like-minded travelers, family/multi-room booking logic.

## Details

### Track 1 — Technical capability deep-dive

**Hotels are LiteAPI's home turf and map cleanly to a full booking engine.** The search→prebook→book flow is well-documented with SDKs and an open-source reference web app, so a competent developer can stand up a working hotel booking funnel quickly. The AI/semantic search ("romantic hotel in Paris with no carpet") and image-based room search are genuinely differentiated and useful for a niche brand — you could surface halal-relevant attributes through natural-language queries. The Cupid mapping engine matters because it removes the single biggest pain of multi-supplier hotel content (dedup and normalization).

**Flights: a real but constrained native option.** LiteAPI quietly added a Flights API (search/price/seat+baggage/book). However, it follows a "stricter access and operational model than Hotels": not enabled by default even in sandbox, production requires explicit approval (use case, traffic, working sandbox integration), sandbox data is limited, and — critically — **booking currently only supports a credit line; SDK-based booking is "in development."** This means LiteAPI Flights is viable for a pilot but not yet as turnkey as hotels. The mature alternative is **Duffel** (300+ airlines incl. NDC/LCC, full white-label, JS/Python/Ruby/C#/Java SDKs, pay-as-you-go, no IATA accreditation needed, weeks to integrate) or **Kiwi/Tequila** for budget multi-city routing.

**The three gaps that definitively need third parties:**
- **Airport transfers → Mozio** is the cleanest fit: white-label/API/widget + iOS/Android SDK, 190+ countries, 3,500+ airports, 3,000+ providers, 5–10% commission, you set your own markup, geocoded (no "zones"), 24/7 multilingual support. Already powers Agoda's transfers. Hoppa/SmartRyde are alternatives.
- **Activities/tours → Viator** (300k+ products, 2,500+ destinations; merchant or affiliate models; 8–12% typical commission; partner approval required via Tripadvisor) or **GetYourGuide** (curated, strong in Europe, 140k+ experiences). Activities/experiences are strategically important for halal: curated halal-friendly tours, mosque/heritage tours, Umrah add-ons.
- **Car rental → CarTrawler** (airline/OTA-grade), **Discover Cars** (affiliate 70%/partner; 10,000 locations/145 countries), or **Amadeus Cars** (69+ providers, enterprise).

**Build vs. white-label:** The free LiteAPI white-label lets you validate demand in days, but its customization is template-bound — you cannot deeply embed halal filters or multi-vertical bundling. For a differentiated halal product the custom API build is the right medium-term path; white-label is the fastest validation step.

### Track 2 — Customer experience & product strategy

**Best-in-class OTA conversion patterns to adopt (from Booking.com/Expedia/Agoda/Hopper/Kayak):**
- **Search & discovery:** rich filters, map view, photo galleries, semantic/AI search, flexible-date and price calendars.
- **Conversion/urgency (use ethically):** "Only 1 room left," "X people viewing," recent-booking counters, free-cancellation messaging, price-drop/price-prediction and alerts (Hopper's signature), price-match. Research is unanimous: scarcity/urgency works but **false scarcity destroys trust** — and trust is the entire value proposition for a faith-based brand, so every cue must be truthful and data-driven.
- **Trust signals:** verified reviews, security badges, transparent all-in pricing, clear cancellation policies, money-back/price-match guarantees near CTAs. The payoff of friction-removal is large: Expedia gained $12M/yr in profit simply by deleting the optional "Company" checkout field — per its then-VP of global analytics Joe Megibow, "overnight there was a step function [change], resulting in $12m of profit a year, simply by deleting a field."
- **Checkout:** guest checkout, minimal fields, address autocomplete, digital wallets, multi-currency, instant confirmation.
- **Mobile-first & performance:** majority of travel research is on mobile; Core Web Vitals and sub-3s loads directly affect conversion.
- **Personalization/AI:** AI trip planning, recommendations, chatbots/concierges (LiteAPI's MCP server makes a conversational halal travel assistant unusually easy to build).
- **Loyalty/rewards:** points/cashback, member pricing, tiers (HalalBooking's HB Loyalty Club offers up to 20% + room upgrades/late checkout).
- **Post-booking:** itinerary management, modifications/cancellations, support.

**Halal differentiation woven through every layer (this is the moat):**
- **Filters:** alcohol-free (graduated, like HalalBooking's "removed from room" vs. "alcohol-free restaurant" vs. "fully alcohol-free"), halal food (on-site / on request / within 500m), women-only beaches/pools/spas, modest-swimwear flags, family-only/private facilities, prayer room/qibla direction/nearby mosque, Haram walking-distance & Haram-view rooms for Makkah/Madinah.
- **Packages:** Umrah (DIY + guided), Ramadan, Hajj, family trips — bundle hotel + transfer + activities (and later flights). Umrah is the most competitive sub-segment but also the highest-intent and most loyalty-generating.
- **Content/trust:** reviews from verified halal-conscious travelers, prayer-time and qibla widgets, halal-restaurant proximity (your existing humblehalal halal-lifestyle content/SEO is a genuine asset here), women-traveler safety info.
- **AI concierge:** a faith-aware chatbot ("find me an alcohol-free family resort in Antalya near a mosque with halal breakfast") is a natural fit for LiteAPI's semantic search + MCP.

## Recommendations

**Stage 1 (0–3 months) — Hotels MVP, halal-first.**
- Stand up the LiteAPI **free white-label** on a `book.humblehalal.com` subdomain to validate demand and learn the booking funnel with near-zero engineering. Set a modest markup (e.g., 8–12%) staying at/above SSP for public sale.
- In parallel, scope the **custom API build** (Next.js + LiteAPI Node SDK) so you can implement halal filters the white-label can't. Map LiteAPI facility/amenity fields to halal attributes; supplement gaps with your own curated halal-data layer (alcohol-free, prayer, halal-food-nearby) — this curated layer is your defensible IP.
- Decide MoR model: start with **LiteAPI as merchant of record** (payment SDK) to avoid PCI burden; revisit self-MoR once volume justifies it.
- Ship trust + CX basics: verified reviews, map view, transparent pricing, free-cancellation labels, mobile-first, multi-currency.
- **Benchmark to advance:** if white-label converts (target >1–2% search-to-book) and you see repeat/loyalty signal, greenlight the custom build.

**Stage 2 (3–6 months) — Ancillaries: transfers + activities.**
- Add **Mozio transfers** (widget first, then API) and **Viator/GetYourGuide activities** — both are pure commission upside with low operational risk and strong halal angles (Umrah transfers, halal/heritage tours). These also raise AOV and basket size.
- Launch **Umrah/Ramadan hotel+transfer packages** as the first bundle. Add the **AI halal concierge** (MCP).
- Add loyalty (LiteAPI Loyalty API) and vouchers for launch promotions.

**Stage 3 (6–12 months) — Flights.**
- Request **LiteAPI Flights** sandbox access and build the integration; evaluate against **Duffel** in parallel. Flights are operationally hardest (ticketing, schedule changes, refunds, credit-line booking) — only launch when support and post-booking ops are ready. Until SDK-based flight booking ships, weigh Duffel for a smoother MoR/payment flow.
- Introduce **hotel+flight Umrah/holiday packages** once both verticals are stable.

**Stage 4 (12 months+) — Cars + scale.**
- Add **car rental** (CarTrawler or Discover Cars affiliate) to complete the full OTA.
- Invest in personalization, price alerts, native apps, and deeper loyalty tiers.

**What would change this plan:** If LiteAPI Flights SDK booking ships and proves reliable, pull flights forward (single-vendor simplicity). If white-label conversion is weak, double down on content/SEO and the curated halal-data layer before adding verticals. If a major OTA (Booking/Agoda/Expedia) launches serious halal filters, accelerate proprietary halal data and community/reviews — that's the one asset they can't quickly copy.

## Caveats
- **LiteAPI's exact per-endpoint pricing (search/rates/book overage cents, the "managed content fee per booking" dollar amount, and any free monthly request allowance) is not fully public** — the main pricing table is JS-rendered. Confirmed figures: Places $0.01/req, Price Index $0.05/req, payment-SDK transaction fee 2.9%/3.9%. Verify the full table in-dashboard before modeling unit economics.
- **LiteAPI Flights is new and gated**; capabilities and booking flow (currently credit-line only) are evolving — treat the native-flights finding as accurate as of mid-2026 but verify current state at integration time.
- **"Experiences" on LiteAPI is described as "coming soon"** — do not plan around it; use Viator/GetYourGuide.
- Coverage numbers vary across LiteAPI's own pages (2M / 2.6M / 3M+ / 40M+) depending on whether long-tail/aggregated supply is counted — treat 2.6M+ "properties" as the conservative figure.
- Halal-attribute data quality is the hard part: mainstream supplier feeds (incl. LiteAPI's) won't reliably flag alcohol-free/prayer/women-only facilities, so a curated/verification layer (and possibly direct hotel relationships, as HalalBooking built) is required for credibility.
- The broader "halal tourism market ~$300B / ~6% CAGR" figures circulating from analyst houses (Credence, Future Market Insights) vary widely by methodology and were not independently confirmed here — treat as directional; the firmly sourced figure is the GMTI's US$230B Muslim-travel spend by 2030.
- I could not verify the specific nature of humblehalal.com (it was not fetchable); recommendations assume it is an established halal-lifestyle brand with an audience to cross-sell travel to. Validate the brand/audience fit before building.