# /is-halal Verification Report — July 2026

**Scope:** Full re-verification of the "Is [brand] halal?" dataset
(`lib/halal-status.ts`) that powers `https://www.humblehalal.com/is-halal`,
plus expansion with commonly-searched Singapore brands.

**Method:** Open-web research (news outlets, brand statements, halal
directories) cross-checked against the compliance posture in
`lib/halal-status.ts` — **MUIS HalalSG is the single source of truth**; "no
pork, no lard" ≠ certification; absence of certification never implies haram.
The official MUIS HalalSG register is WAF-protected and cannot be fetched
programmatically, so `status: "certified"` here reflects the best available
public evidence (dated news announcements, official brand pages, or strong
multi-source consensus). Every public answer still directs users to confirm the
current, per-outlet status on the register — the register remains authoritative.

**Confidence key:** 🟢 strong (reputable dated news / official brand page /
long-established fact) · 🟡 medium (halal-directory consensus + plausibility) ·
⚪ unconfirmed (conflicting evidence — left as `unknown`).

---

## Headline

The dataset was materially out of date: it was written on the assumption that
most major chains are **not** certified, but many have since obtained MUIS
certification (several in 2024–2026). **20 existing entries changed status.**
Two entries (McDonald's, KFC) were outright **factually wrong** — both have been
MUIS-certified in Singapore for 30+ years. The hub intro copy
(`app/is-halal/page.tsx`) was corrected accordingly ("Many major chains **are**
MUIS-certified — but plenty are not").

- Existing brands: **40** → re-verified. **20** changed status, **20** confirmed.
- New brands added: **16**.
- Total dataset now: **56** brands.
- `lastChecked` refreshed **June 2026 → July 2026** for all entries.

---

## Existing brands — NEEDS-UPDATE (status changed)

| Brand | Old → New | Finding | Conf. |
|---|---|---|---|
| McDonald's | not-certified → **certified** | MUIS-certified since **1992**; all outlets/McCafés/kiosks. Old entry was flat wrong. Source: McDonald's SG official customer-care page. | 🟢 |
| KFC | not-certified → **certified** | MUIS-certified since the **1990s**; all outlets. Old entry was flat wrong. | 🟢 |
| Subway | not-certified → **certified** | Dropped pork & MUIS-certified in **2018** (Coconuts SG). | 🟢 |
| Paris Baguette | not-certified → **certified** | All outlets MUIS-certified **Feb 2026** (Time Out, HHWT, The Online Citizen). | 🟢 |
| Tim Hortons | not-certified → **certified** | All 17 outlets MUIS-certified **Feb 2026** (Media OutReach press release, HHWT). | 🟢 |
| Mr Bean | no-pork → **certified** | All outlets MUIS-certified since **2022** (Mothership, Eatbook, Goody Feed). | 🟢 |
| A&W | not-certified → **certified** | MUIS-certified since **2020** (SETHLUI, Eatbook). | 🟢 |
| Yoshinoya | not-certified → **certified** | MUIS-certified across almost all outlets since **late 2024** (Mothership + official FB). | 🟢 |
| Famous Amos | not-certified → **certified** | All 17 outlets MUIS-certified since **2022** (Mothership, Eatbook, own site). | 🟢 |
| Old Chang Kee | not-certified → **certified** | Products/outlets/kitchens MUIS-certified since **2005** (own site, Wikipedia). | 🟢 |
| Swee Heng | not-certified → **certified** | Halal-certified bakery; halal supplier (own corporate site). | 🟢 |
| Sukiya | no-pork → **certified** | MUIS-certified (mustsharenews, official IG). | 🟡 |
| Wingstop | not-certified → **certified** | MUIS-certified; outlets listed by HHWT. | 🟡 |
| Popeyes | not-certified → **certified** | MUIS-certified; outlets listed by HHWT / WhereHalal. | 🟡 |
| Nando's | not-certified → **certified** | Halal-certified; SG outlets serve no alcohol (HHWT). Old entry wrongly said "serves alcohol". | 🟡 |
| Fish & Co. | not-certified → **certified** | Halal-certified (Mothership 2018). Old entry wrongly said "serves alcohol". | 🟡 |
| Krispy Kreme | not-certified → **certified** | All SG stores MUIS-certified (The Halal Food Blog, HalalTrip). | 🟡 |
| Délifrance | not-certified → **certified** | SG franchise MUIS-certified, pork-free menu (SassyMama + directories). | 🟡 |
| Genki Sushi | not-certified → **partial** | Selected outlets only (JEM, Bugis Junction, Westgate). | 🟡 |
| Killiney Kopitiam | not-certified → **partial** | Selected outlets + halal "Kedai Killiney Kopi"; most outlets serve pork. | 🟡 |

## Existing brands — flagged UNKNOWN (needs register check)

| Brand | Old → New | Why |
|---|---|---|
| Burger King | not-certified → **unknown** | Halal directories (Zabihah/WhereHalal) list outlets as MUIS-certified, but no authoritative confirmation and the global menu includes pork. **Recommend confirming on the MUIS register.** |
| Pizza Hut | not-certified → **unknown** | Directories claim certified (chicken ham replaces pork); no authoritative confirmation. **Recommend confirming on the MUIS register.** |

## Existing brands — CONFIRMED (no status change)

- **Not certified (confirmed):** Starbucks (MUIS publicly confirmed no application, May 2026), BreadTalk (pork floss; halalSG confirms not certified), Bengawan Solo (rum syrup on some cakes; halalSG confirms), Awfully Chocolate (alcohol in products; own site + MUIS confirm), Chateraise, Four Leaves (halalSG: no application), Tiong Bahru Bakery (halalSG), KOI Thé (KOI's own statement), LiHo TEA, Chocolate Origin (premises not certified; some products carry MUIS-certified logo).
- **Not halal — serves pork/alcohol (unchanged):** Saizeriya, Haidilao, Jack's Place, Shake Shack, Din Tai Fung, Haribo (pork gelatine).
- **Certified (unchanged):** Jollibee, Pepper Lunch (both re-confirmed — all SG outlets certified).

---

## New brands added (16)

| Brand | Status | Finding | Conf. |
|---|---|---|---|
| Texas Chicken | certified | All outlets MUIS-certified. | 🟡 |
| Long John Silver's | certified | Outlets MUIS-certified. | 🟡 |
| Swensen's | certified | Certified incl. Swensen's Unlimited buffets. | 🟡 |
| 4Fingers | certified | All outlets MUIS-certified (own site). | 🟢 |
| PastaMania | certified | Every outlet MUIS-certified. | 🟡 |
| Sarpino's Pizzeria | certified | Outlets MUIS-certified. | 🟡 |
| Encik Tan | certified | Halal food-atrium concept, 18+ outlets. | 🟢 |
| Stuff'd | certified | SG's largest halal burrito/kebab chain. | 🟢 |
| The Manhattan Fish Market | certified | Halal-certified seafood chain. | 🟡 |
| llaollao | certified | Frozen-yogurt menu MUIS-certified. | 🟡 |
| Toast Box | not-certified | Not on the register (own SEO'd sources + verify). | 🟢 |
| Gong Cha | not-certified | Ingredients halal, establishment not certified. | 🟢 |
| Sushi Tei | not-certified | Not certified; alcohol-based seasonings. | 🟢 |
| MOS Burger | not-certified | No pork/lard, but not MUIS-certified. | 🟢 |
| Collin's | not-certified | Main grille serves pork/alcohol; halal concept is "El Fuego by Collin's". | 🟡 |
| Boost Juice | not-certified | Plant-based, but establishment not MUIS-certified. | 🟡 |

---

## Follow-ups for a human reviewer

1. **Confirm on the MUIS HalalSG register** the two `unknown` entries (Burger
   King, Pizza Hut) and the 🟡-confidence `certified` upgrades — the register is
   the only authoritative source and could not be queried automatically here.
2. Certification is **per-outlet and time-limited**; the `partial` entries
   (Genki Sushi, Killiney) and all `certified` entries should be spot-checked at
   the specific outlet before relying on them.
3. Consider wiring the weekly `data-cross-check` job
   (`scripts/claude-jobs/prompts/data-cross-check.md`) to re-scan this dataset,
   given how quickly SG certifications changed in 2024–2026.
