# Halal Ecosystem Growth — Value Ladder, Onnifyworks & the Growth Partner Program

> Status: strategy + build plan (July 2026). Companion to `docs/roadmap/events-ticketing.md`
> and `docs/seo/keyword-research.md`. Build items here are NOT shipped unless marked ✅ —
> each gets its own PR when green-lit.

Humble Halal's position: **Singapore's first full halal ecosystem** — directory + events +
travel OTA + tools + content + leads under one trusted brand. This doc covers the three
growth asks: (1) the free→paid value ladder, (2) how Onnifyworks (our agency) plugs in
without compromising consumer trust, and (3) the deep plan for the **Growth Partner**
program — paid managed marketing with rotator landing pages and delivered leads.

---

## Part 1 — The value ladder (post package-integrity PR)

Every tier must deliver *exactly* what it markets (the package-integrity PR enforced
this: rotation/boost/offers built, analytics gated, unbuilt bullets withdrawn).

| Tier | Price | The promise | The retention hook |
|---|---|---|---|
| **Free** | $0 | Be findable: profile, map pin, 3 photos, reviews **+ reply to reviews**, website badge, QR poster, review link | Monthly "your listing got N views" email (build: cron + template) — proof the channel works before asking for money |
| **Verified** | $19/mo · founding $120/yr | Trust: halal-status review, cert vault, 15 photos, WhatsApp/directions buttons | The badge itself — dropping to Free visibly removes trust markers |
| **Featured** | $49/mo | Visibility: top of category & area ✅, daily homepage rotation ✅, featured styling | Rank + rotation are felt immediately when cancelled |
| **Premium** | $99/mo | Demand: offers block ✅, advanced analytics (trend + search insights) ✅, 30 photos | The offer drives measurable redemptions; analytics shows them |
| **Growth Partner** | $299–$499/mo (Part 3) | We do the marketing FOR you + deliver leads | A monthly report with attributed leads — cancelling turns off a pipeline |

**Free-tier upgrade drivers (cheap, high-leverage):**
1. **Locked-but-visible features** — free owners SEE the offers card and the analytics
   teaser with an Upgrade button (✅ shipped in package-integrity PR).
2. **Monthly performance email** (build next: extends the existing email infra) — "127
   people viewed your listing; 9 tapped WhatsApp. Featured businesses in your category
   averaged 4× that." The comparison line is the upsell.
3. **Founding-rate urgency** — the $120/yr Verified founding cap (200) is real; surface a
   "N founding spots left" counter on /pricing once >50 are taken.

**Playbook:** sell Verified first (trust is the wedge — it's why HH exists), upsell
Featured when their category page gets busy, Premium when they ask "can I run a promo?",
Growth Partner when they ask "can you just do it for me?" — which is exactly what the
`request-quote` flow and Opportunities tab in admin analytics already capture.

---

## Part 2 — Onnifyworks placement (subtle, owner-facing only)

Principle: **consumer surfaces stay agency-free.** Muslim diners must never feel the
directory is an ad-agency funnel; MUIS-compliance trust is the moat. Onnifyworks appears
only where *business owners* are already thinking about growth.

Placements (each is a small PR when approved):

1. **Owner dashboard — under Insights** (highest intent: they're staring at their numbers)
   > **Want this handled for you?**
   > Humble Halal Growth Partner — managed marketing by **Onnifyworks**, our in-house
   > growth team. We run the campaigns, you get the customers. *From $299/mo.*
   > [Learn more →]

2. **/advertise + /for-business** — one line under the packages grid:
   > Prefer done-for-you? **Managed marketing is available** — campaigns, content and
   > lead generation run by Onnifyworks, Humble Halal's growth partner. [Request a call]

3. **Footer brand column** — one line under the ONN GROUP address block:
   > Growth services by [Onnifyworks](https://onnifyworks.com)

4. **Quote-request confirmation email** — P.S. line: "If you'd rather have marketing
   handled end-to-end, ask us about Growth Partner."

Copy rules: always "by Onnifyworks" (transparency), never a consumer-facing logo, never
in listings/search/events/tools. One link per surface.

---

## Part 3 — Growth Partner program (rotator + leads) — deep plan

### The offer (owner's words)
"Pay one monthly fee. We run halal-targeted marketing for your category, feature you on
a rotating campaign page, and send you the enquiries. You see every lead and what you
paid per lead."

### Why this is mostly assembly, not building
| Piece | Status |
|---|---|
| Lead capture + routing + quotas (`lead_routes`, `leads`, Stripe lead subscriptions) | ✅ built (PR #136), dormant behind `LEAD_ROUTING_ENABLED` / `PAID_LEADS_ENABLED` |
| Attribution (GTM ✅ live, UTM params, analytics v2 lead-value model) | ✅ built |
| Admin reporting (Opportunities tab, lead-value dashboard) | ✅ built (PR #134) |
| Ad system (placements, campaigns, AdSense fill) | ✅ built (PR #132) |
| Bell + email notifications to owners on routed leads | ✅ built |
| **Rotator landing pages `/go/[vertical]`** | ❌ new (small) |
| **Growth Partner plan + billing (Stripe price)** | ❌ new (small — reuse lead-subscription pattern) |
| **Monthly client report** | ❌ new (medium — template over existing analytics RPCs) |

### How it works, end to end
1. **Client onboarding** — business joins Growth Partner (Stripe subscription; founding
   cohort manually onboarded). Admin flips their `lead_routes` membership + adds them to
   their vertical's rotator pool with a weight.
2. **Traffic** — Onnifyworks runs Meta/Google/TikTok campaigns pointing at
   `humblehalal.com/go/{vertical}?utm_source=meta&utm_campaign=gp-{vertical}-{month}`.
   Verticals map to existing lead verticals (caterers, wedding vendors, home services,
   travel, F&B openings).
3. **Rotator page `/go/[vertical]`** — a fast, conversion-first landing page:
   - Hero: "Get quotes from Singapore's trusted halal {vertical}" + trust strip
     (MUIS-verified badges, review counts).
   - **Member rotation**: the page features N member businesses, rotated per-request
     with weighted selection (package weight × equal-share fairness window — see
     mechanics below). Rotation is server-side so ad traffic splits fairly.
   - One lead form (name, contact, area, budget, date) → posts to the EXISTING
     `/api/leads` intake with `vertical_id` + UTM payload.
   - No prices, no agency branding — pure HH trust.
4. **Lead routing** — the existing engine fans the lead to eligible members within quota,
   fires bell + email ("New catering enquiry — tap to accept").
5. **Attribution** — UTM lands in GTM + `analytics_events`; the lead row carries
   `utm_source/campaign`; the admin lead-value dashboard already prices actions.
6. **Monthly report** (per client): leads delivered, cost per lead vs their fee,
   profile views uplift, offer redemptions, next-month plan. Generated from the
   admin analytics RPCs; sent by email + PDF.

### Rotator mechanics (fairness you can defend)
- Each member has `weight` (Starter 1 / Growth 2 / Scale 3) and a **fairness window**:
  within each 24h window, impressions are allocated proportional to weight, but every
  member is guaranteed a floor of `window_impressions × weight / total_weight × 0.8`.
- Implementation: deterministic weighted round-robin seeded per request counter (same
  `lib/rotate.ts` seeded-PRNG approach — no DB write per impression; log impressions to
  `analytics_events` for the report).
- Cap members per vertical pool (e.g. 8) so each member's share stays meaningful —
  scarcity is also the sales lever ("2 slots left for halal caterers").

### Pricing model (recommendation: hybrid)
| Package | Monthly | Includes | Lead expectation* |
|---|---|---|---|
| Starter | $299 | rotation weight 1, up to 10 leads/mo, monthly report | ~6–10 |
| Growth | $499 | weight 2, up to 25 leads/mo, offer creative refresh, quarterly strategy call | ~15–25 |
| Scale | $899 | weight 3, uncapped leads, dedicated campaigns, WhatsApp-speed routing | 30+ |
*Expectations, not guarantees — see SLA below. Ad spend: packages include a fixed spend
pool managed by Onnifyworks; overage spend billable at cost + 15%.

Alternatives considered: pure per-lead pricing (rejected: revenue volatility + incentive
to inflate lead counts) and pure retainer with no lead caps (rejected: whales starve the
pool). Hybrid keeps incentives clean: HH wants quality because members renew on the report.

### Lead-quality SLA
- A billable lead = name + working SG contact + vertical-relevant request. Duplicates
  (same contact, 30 days), spam, and out-of-scope requests are auto-credited back.
- Members mark leads accepted/rejected in the existing owner Leads tab; >30% rejection
  triggers a manual campaign review, not a shrug.
- Response-time nudge: leads unopened for 24h re-route to the next member (quota-aware)
  — keeps the consumer experience good and creates urgency for members.

### Phase-1 launch checklist (in order)
1. Apply migration 0053, then flip `LEAD_ROUTING_ENABLED=1` (free-beta routing) — prove
   the pipe with organic quote requests before paid traffic.
2. Recruit 3–5 founding members in ONE vertical (halal catering — highest search volume
   + existing quote-request demand) at a founding rate ($199/mo, 3-month commitment).
3. Build `/go/catering` rotator page + wire UTM (1 PR).
4. Onnifyworks runs a $500–$1,000 test month; target ≤$25 cost per qualified lead.
5. First monthly reports → testimonials → open vertical #2 (weddings), then home
   services, then travel.
6. Only then: Stripe self-serve Growth Partner subscriptions (`PAID_LEADS_ENABLED=1` +
   the existing lead-subscription prices).

### KPIs
- Cost per qualified lead (target ≤$25 catering, ≤$40 weddings)
- Lead acceptance rate ≥70% · member renewal ≥80% after month 3
- Program gross margin ≥55% after ad spend

---

## Ecosystem gap-scan (what "first halal ecosystem" still misses)

Ranked by (community value × revenue potential ÷ build cost):

1. **Deals wallet / redemption tracking** — offers exist now; add "save offer → show QR →
   business scans" and you get redemption data that proves ROI for Premium + Growth
   Partner reports. Small build on existing passport/QR infra.
2. **Jobs board (halal F&B + retail hiring)** — every restaurant is hiring; job posts are
   a natural $ upsell and a huge SEO surface ("halal restaurant jobs singapore"). Medium
   build (posts table + moderation + 2 SEO page types).
3. **Supplier / B2B directory** — halal-certified suppliers (meat, ingredients, packaging,
   logistics) selling to the 300+ listed businesses. B2B listings monetize at 3–5× B2C;
   pairs perfectly with Growth Partner leads. Medium build (category dimension + gated
   contact).
4. **Creator/affiliate program** — extend the existing Passport referral rails to food
   creators: personal referral links, leaderboard, paid collabs booked through HH
   (Onnifyworks manages creator campaigns for Growth Partner clients). Small-medium.
5. **Certification-consulting funnel** — "want to get MUIS-certified?" content + a
   qualified-referral pipe to certification consultants (a lead vertical, not advice we
   give ourselves — MUIS posture unchanged). Small (content + lead vertical).
6. **Zakat/donations rails** — mosque/charity campaign pages with PayNow. High community
   trust value, low direct revenue; do it for the brand halo once payments are live.
   Small-medium (reuse events donation flow).

Explicitly NOT gaps worth chasing now: halal grocery delivery (capital-intensive,
incumbents), a standalone super-app (the web ecosystem IS the moat), and any scraped
certification data (never — MUIS posture).

---

## Sequencing (recommended)
1. **Now**: monthly performance email (free-tier hook) + Onnifyworks placements PR.
2. **Weeks 1–2**: lead-routing free beta on organic quote requests (flip flag, watch).
3. **Weeks 2–4**: catering rotator + founding members + first paid traffic.
4. **Month 2**: first reports, second vertical, deals-wallet build.
5. **Month 3+**: self-serve Growth Partner billing; jobs board or B2B directory next
   depending on which enquiry type the Opportunities tab shows more of.
