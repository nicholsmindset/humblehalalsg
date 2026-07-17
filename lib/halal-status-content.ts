/* Humble Halal — curated depth for the "Is [brand] halal?" checker pages.
 *
 * ACCURACY POLICY (same as lib/halal-status.ts — read before editing):
 * - MUIS HalalSG is the single source of truth. Never assert "halal" without
 *   certification; never call a MUIS-certified brand "not halal".
 * - Facts below were re-verified against brand statements and SG press in
 *   July 2026 (certification dates, known non-halal menu items, MUIS remarks).
 * - `alternatives` may only recommend brands that are MUIS-certified (either a
 *   checker sibling via `slug`, or a label-only entry for a well-known
 *   certified brand not in the checker).
 *
 * Every field is a LAYER: withCuratedContent() only fills fields the base
 * entry (built-in or CMS override) left empty, so admins can override any of
 * this from Keystatic without code changes.
 */
import {
  type BrandAlternative,
  type BrandFaqItem,
  type BrandHalal,
  type HalalStatus,
  STATUS_META,
} from "./halal-status";

type BrandContent = Pick<
  BrandHalal,
  "certifiedSince" | "whyStatus" | "watchFor" | "alternatives" | "faqs" | "explainer"
>;

/* ── Per-status defaults: guarantee depth even for brands (incl. future
   CMS-only ones) with zero curated fields. ─────────────────────────────── */
export const STATUS_EXPLAINERS: Record<
  HalalStatus,
  {
    title: string;
    body: string[];
    defaultWatchFor: string[];
    method: string[]; // "How we reached this answer" checklist (3 lines; {date} interpolated)
    defaultFaqs: (brand: string) => BrandFaqItem[];
  }
> = {
  certified: {
    title: "What 'MUIS halal-certified' means",
    body: [
      "MUIS halal certification means the Islamic Religious Council of Singapore has audited the premises, ingredients and supply chain, and issued a halal certificate for the outlet or plant. Certified outlets display the certificate and appear on the official MUIS HalalSG register.",
      "Certification is per-premises and time-limited: it must be renewed, and a new outlet is only covered once its own certificate is issued. That is why we always link you to the register — the certificate on the wall and the HalalSG listing are the ground truth on the day you visit.",
    ],
    defaultWatchFor: [
      "Check that the outlet displays a current MUIS halal certificate — certification is per-premises, not automatic for new outlets.",
      "Pop-ups, kiosks and event booths may not be covered by the main certificate; when in doubt, ask to see it.",
      "Certificates expire and are renewed periodically — the MUIS HalalSG register always shows the live status.",
    ],
    method: [
      "Searched the official MUIS HalalSG register and the brand's own statements",
      "Reviewed public information from Singapore press and halal directories",
      "Date-stamped the result — last checked {date}",
    ],
    defaultFaqs: (brand) => [
      {
        q: `Does every ${brand} outlet in Singapore hold the certificate?`,
        a: `MUIS certification is issued per premises. ${brand}'s Singapore outlets are covered under its certification, but a brand-new outlet is only covered once its own certificate is issued — confirm the specific outlet on the MUIS HalalSG register if it just opened.`,
      },
      {
        q: "Can a halal certificate lapse?",
        a: "Yes. Certificates are time-limited and renewed periodically, and MUIS can suspend a certificate if conditions are breached. The MUIS HalalSG register always reflects the current status, which is why every answer here links to it.",
      },
    ],
  },
  partial: {
    title: "What 'some outlets or items certified' means",
    body: [
      "Some brands hold MUIS halal certification for specific outlets, product lines or manufacturing facilities — but not for the whole chain. Buying from a certified outlet, or a product carrying the halal mark, is covered; the rest of the brand is not.",
      "This is the status that most rewards double-checking: the same brand name can be halal-certified in one mall and uncertified in the next. Match the exact outlet or product against the MUIS HalalSG register before you buy.",
    ],
    defaultWatchFor: [
      "Check whether the specific outlet or product you're buying is the certified one — the brand name alone doesn't tell you.",
      "Look for the halal mark on packaged products, and the MUIS certificate at outlets.",
      "Certification scope can widen or narrow over time — verify on MUIS HalalSG.",
    ],
    method: [
      "Searched the official MUIS HalalSG register for the brand's certified premises and products",
      "Reviewed the brand's own statements on which outlets or lines are covered",
      "Date-stamped the result — last checked {date}",
    ],
    defaultFaqs: (brand) => [
      {
        q: `Which parts of ${brand} are halal-certified?`,
        a: `Only specific outlets or products — not the whole brand. Check the answer above for the covered scope, and confirm the exact outlet or product on the MUIS HalalSG register before buying.`,
      },
      {
        q: "Is it safe to assume the whole chain is halal if one outlet is certified?",
        a: "No. MUIS certification is issued per premises or per product line. An uncertified outlet of the same brand may use different ingredients, suppliers or kitchens.",
      },
    ],
  },
  "no-pork": {
    title: "What 'no pork, no lard — but not certified' means",
    body: [
      "'No pork, no lard' is a self-declaration by the business. It only tells you those two ingredients are not used — it says nothing about alcohol in sauces or desserts, gelatine sources, cross-contamination, or how ingredients are sourced and handled.",
      "MUIS halal certification verifies the whole kitchen, supply chain and processes. A no-pork declaration, however sincere, is not audited by anyone. Many Muslims choose differently here — our role is to tell you clearly which assurance you're getting.",
    ],
    defaultWatchFor: [
      "Self-declared 'no pork, no lard' is not audited — sauces, stocks, flavourings and desserts can still contain alcohol or animal-derived ingredients.",
      "Ask about specific ingredients (mirin, rum, gelatine, rennet) if you dine here.",
      "Status can change — a brand may pursue certification later; check MUIS HalalSG for updates.",
    ],
    method: [
      "Searched the official MUIS HalalSG register — no certification found",
      "Reviewed the brand's own no-pork/no-lard statements and public information",
      "Date-stamped the result — last checked {date}",
    ],
    defaultFaqs: (brand) => [
      {
        q: `Is 'no pork, no lard' at ${brand} the same as halal?`,
        a: "No. It is a self-declared claim covering only those two ingredients. MUIS halal certification audits the entire kitchen, ingredient list and supply chain. Whether a self-declared establishment is acceptable is a personal decision — the facts above are here to inform it.",
      },
      {
        q: `Could ${brand} become halal-certified later?`,
        a: "Yes — several Singapore chains moved from no-pork/no-lard to full MUIS certification in recent years. Check the MUIS HalalSG register for the latest status.",
      },
    ],
  },
  "not-certified": {
    title: "What 'not MUIS certified' means",
    body: [
      "The brand or product is not listed on the MUIS HalalSG register. This does not automatically mean everything it sells is non-halal — but there is no independent verification, and in many cases the menu includes confirmed non-halal items such as pork or alcohol.",
      "Ingredients, recipes and certification status change. Always verify on MUIS HalalSG or with the brand before consuming, and check the specific concerns we list above for this brand.",
    ],
    defaultWatchFor: [
      "No independent halal verification exists for this brand — treat all items as unverified.",
      "Watch for the specific non-halal items noted above (pork, alcohol-based sauces or desserts, gelatine).",
      "Certification status can change — the MUIS HalalSG register is always the authority.",
    ],
    method: [
      "Searched the official MUIS HalalSG register — no certification found",
      "Reviewed the menu and public information for non-halal ingredients",
      "Date-stamped the result — last checked {date}",
    ],
    defaultFaqs: (brand) => [
      {
        q: `Can I eat anything at ${brand}?`,
        a: `${brand} holds no MUIS certification, so nothing on its menu is independently verified halal. Some items may contain no obviously non-halal ingredients, but sourcing and handling are unverified — most halal-conscious diners choose a certified alternative instead.`,
      },
      {
        q: "How do I verify a halal certificate?",
        a: "Search the establishment on the official MUIS HalalSG register at halal.muis.gov.sg, or look for the MUIS certificate displayed at the outlet. A 'no pork, no lard' sign is self-declared and is not certification.",
      },
    ],
  },
  unknown: {
    title: "What 'status unconfirmed' means",
    body: [
      "We could not verify this brand's current status against the MUIS HalalSG register or reliable public sources. Treat it as unverified until you can confirm directly.",
      "Check the register yourself, ask the outlet to show its certificate, and use the Report an update button if you have first-hand information — it goes straight to our review queue.",
    ],
    defaultWatchFor: [
      "Ask the outlet directly whether it holds a current MUIS certificate.",
      "Search the brand on the MUIS HalalSG register before relying on this page.",
    ],
    method: [
      "Searched the official MUIS HalalSG register",
      "Reviewed available public information — insufficient to confirm a status",
      "Date-stamped the result — last checked {date}",
    ],
    defaultFaqs: (brand) => [
      {
        q: `Why is ${brand}'s status unconfirmed?`,
        a: "Either the brand has made no clear public statement, or available sources conflict. We only assert a status when we can back it with the MUIS register or the brand's own confirmation.",
      },
      {
        q: "How can I help confirm it?",
        a: "If you've seen a current MUIS certificate at an outlet (or confirmation it has none), use the Report an update button — first-hand reports go to our review queue and speed up a verified answer.",
      },
    ],
  },
};

/* ── Shared alternative sets (only MUIS-certified recommendations) ───────── */
const ALT = {
  fastfood: [
    { label: "McDonald's — certified since 1992", slug: "mcdonalds" },
    { label: "Burger King — certified chain-wide", slug: "burger-king" },
    { label: "A&W — certified since 2020", slug: "a-w" },
  ] as BrandAlternative[],
  japanese: [
    { label: "Yoshinoya — certified since Dec 2024", slug: "yoshinoya" },
    { label: "Sukiya — certified since 2023", slug: "sukiya" },
    { label: "Pepper Lunch — certified since 2021", slug: "pepper-lunch" },
  ] as BrandAlternative[],
  bakery: [
    { label: "Swee Heng Bakery — MUIS-certified", slug: "swee-heng" },
    { label: "Délifrance — certified since 2019", slug: "delifrance" },
    { label: "Paris Baguette — certified since Feb 2026", slug: "paris-baguette" },
  ] as BrandAlternative[],
  sweet: [
    { label: "Krispy Kreme — certified since 2013", slug: "krispy-kreme" },
    { label: "Famous Amos — certified since 2022", slug: "famous-amos" },
    { label: "Swee Heng Bakery — MUIS-certified", slug: "swee-heng" },
  ] as BrandAlternative[],
  coffee: [
    { label: "Tim Hortons — certified since Feb 2026", slug: "tim-hortons" },
    { label: "McDonald's McCafé — covered by McDonald's certification", slug: "mcdonalds" },
    { label: "Mr Bean — certified since 2022", slug: "mr-bean" },
  ] as BrandAlternative[],
};

/* ── Curated per-brand content (July 2026 verification) ──────────────────── */
export const BRAND_CONTENT: Record<string, BrandContent> = {
  /* ── Certified ── */
  mcdonalds: {
    certifiedSince: "1992",
    whyStatus: [
      "Every McDonald's restaurant in Singapore holds a MUIS halal certificate — the chain has been certified since 1992, one of the longest-running certifications in Singapore fast food.",
      "Coverage includes McCafé counters and dessert kiosks, and McDonald's states this on its own customer-care pages.",
    ],
    watchFor: [
      "Certification applies to Singapore outlets — McDonald's in other countries (or across the Causeway) runs under different certifiers.",
      "Limited-time menu items are covered by the same outlet certificate, but overseas McDonald's merchandise or imports are not.",
    ],
    faqs: [
      { q: "Is McDonald's McCafé also halal?", a: "Yes — McCafé counters and dessert kiosks operate under the same MUIS certification as the main restaurants." },
      { q: "Is McDonald's halal everywhere, or just in Singapore?", a: "This answer covers Singapore only, where every outlet is MUIS-certified. Other countries have their own certifiers and rules — verify locally when travelling." },
    ],
  },
  kfc: {
    whyStatus: [
      "KFC Singapore's outlets are MUIS halal-certified, with certificates displayed per premises.",
      "The chain serves a fully halal menu in Singapore — no pork items are sold.",
    ],
    watchFor: [
      "Certification is per outlet — a newly opened branch is covered only once its own certificate is issued.",
    ],
    faqs: [
      { q: "Is KFC in Singapore the same as KFC in Malaysia for halal status?", a: "Both are halal, but under different certifiers — MUIS in Singapore, JAKIM in Malaysia. Certification does not carry across borders; each country's outlets are audited locally." },
    ],
  },
  "burger-king": {
    whyStatus: [
      "Burger King Singapore is MUIS halal-certified chain-wide.",
      "The menu is adapted for certification — no pork; items like turkey bacon replace pork ingredients.",
    ],
    watchFor: [
      "The 'bacon' on Singapore menus is turkey-based and covered by the certification — the same item overseas may not be.",
    ],
    faqs: [
      { q: "Does Burger King Singapore serve real bacon?", a: "No. Singapore outlets use turkey bacon under their MUIS certification. Overseas Burger King menus differ — this answer covers Singapore only." },
    ],
  },
  "pizza-hut": {
    whyStatus: [
      "Pizza Hut Singapore's outlets are MUIS halal-certified.",
      "The menu was adapted for certification: chicken ham and beef pepperoni replace pork toppings.",
    ],
    watchFor: [
      "Pizza Hut is not halal-certified in every country — the Singapore certification covers Singapore outlets only.",
    ],
    faqs: [
      { q: "Are the pepperoni and ham on Pizza Hut Singapore pizzas halal?", a: "Yes — Singapore outlets use beef pepperoni and chicken ham under their MUIS certification. There is no pork on the Singapore menu." },
    ],
  },
  subway: {
    certifiedSince: "2018",
    whyStatus: [
      "Subway Singapore received MUIS halal certification in August 2018 after removing pork products chain-wide.",
      "Deli meats on the Singapore menu (ham-style slices, 'bacon') are poultry-based and covered by the certification.",
    ],
    watchFor: [
      "Menus overseas still carry pork — the halal menu is specific to Singapore outlets.",
    ],
    faqs: [
      { q: "Didn't Subway used to serve pork in Singapore?", a: "Yes — before August 2018. The chain dropped pork products to qualify for MUIS certification, and its Singapore outlets have been certified since." },
    ],
  },
  popeyes: {
    whyStatus: [
      "Popeyes Singapore holds MUIS halal certification across its outlets, covering its chicken, sauces and sides.",
    ],
    watchFor: [
      "Certification is per outlet — confirm a brand-new branch on the MUIS HalalSG register.",
    ],
  },
  "a-w": {
    certifiedSince: "2020",
    whyStatus: [
      "A&W Singapore has been MUIS halal-certified since November 2020, starting with Jewel Changi Airport and AMK Hub and extending to subsequent outlets.",
      "Historically, A&W was Singapore's first halal-certified fast-food chain back in 1992, before its 2003 exit from the market.",
    ],
    watchFor: [
      "Root beer is non-alcoholic and covered by the certification — the name refers to the sassafras-style soda, not beer.",
    ],
    faqs: [
      { q: "Is A&W root beer halal?", a: "Yes. Root beer is a non-alcoholic soft drink, and A&W Singapore's menu — root beer floats included — is covered by its MUIS certification." },
    ],
  },
  wingstop: {
    whyStatus: [
      "Wingstop's Singapore outlets are MUIS halal-certified, covering wings, sauces and sides.",
    ],
    watchFor: [
      "Certification covers Singapore outlets — Wingstop's status differs by country.",
    ],
  },
  jollibee: {
    whyStatus: [
      "Jollibee Singapore is MUIS halal-certified across its outlets and appears in the MUIS halal-certified establishment listings.",
    ],
    watchFor: [
      "Jollibee outlets in other countries — including the Philippines — are generally not halal-certified; this covers Singapore only.",
    ],
  },
  "pepper-lunch": {
    certifiedSince: "2021",
    whyStatus: [
      "All Pepper Lunch Restaurant and Express outlets in Singapore have been MUIS halal-certified since February 2021.",
      "The sizzling-plate menu — beef, chicken and salmon — is fully covered.",
    ],
    watchFor: [
      "Pepper Lunch overseas is largely not halal — the certification is Singapore-specific.",
    ],
  },
  "fish-and-co": {
    certifiedSince: "2018",
    whyStatus: [
      "Fish & Co. regained its MUIS halal certification in September 2018 after a brief lapse, and its Singapore outlets remain certified.",
    ],
    watchFor: [
      "The 2018 lapse shows statuses can change — the HalalSG register always reflects the current certificate.",
    ],
    faqs: [
      { q: "Why did Fish & Co. lose its certification briefly?", a: "The chain let its certificate lapse in 2018 during a restructuring and regained MUIS certification in September that year. It has remained certified since — a good example of why we date-stamp every answer." },
    ],
  },
  nandos: {
    whyStatus: [
      "Nando's Singapore outlets are MUIS halal-certified — the flame-grilled peri-peri chicken menu is halal.",
    ],
    watchFor: [
      "Certification covers Singapore outlets; Nando's status differs by country.",
    ],
  },
  "old-chang-kee": {
    certifiedSince: "2005",
    whyStatus: [
      "Old Chang Kee has been MUIS halal-certified since January 2005 — covering its products, outlets and central kitchens.",
      "That makes its curry puffs one of Singapore's longest-certified snack lines.",
    ],
    watchFor: [
      "Sister concepts and pop-up brands under the same group may hold separate certificates — check the specific brand name on HalalSG.",
    ],
  },
  "mr-bean": {
    certifiedSince: "2022",
    whyStatus: [
      "Mr Bean has been MUIS halal-certified since June 2022, covering its Singapore outlets, soya drinks and snacks.",
    ],
    watchFor: [
      "Packaged Mr Bean products sold in supermarkets are covered when they carry the halal mark — check the pack.",
    ],
  },
  "famous-amos": {
    certifiedSince: "2022",
    whyStatus: [
      "Famous Amos Singapore has been MUIS halal-certified chain-wide since November 2022, with ingredients additionally certified by IFANCA.",
    ],
    watchFor: [
      "Famous Amos in other countries (including Malaysia's separate franchise) holds different statuses — this covers Singapore.",
    ],
  },
  "krispy-kreme": {
    certifiedSince: "2013",
    whyStatus: [
      "Krispy Kreme Singapore has been MUIS halal-certified since 2013 — doughnuts and drinks at its Singapore stores are halal.",
    ],
    watchFor: [
      "Krispy Kreme overseas is not automatically halal; the certification covers Singapore stores.",
    ],
  },
  "swee-heng": {
    whyStatus: [
      "Swee Heng Bakery — including its Swee Heng 1989 Classic outlets — is MUIS halal-certified across its Singapore outlets.",
    ],
    watchFor: [
      "Look for the certificate at newly opened outlets — per-premises coverage applies.",
    ],
  },
  delifrance: {
    certifiedSince: "2019",
    whyStatus: [
      "Délifrance Singapore's retail outlets have been MUIS halal-certified islandwide since March 2019 (after a brief lapse in 2018).",
    ],
    watchFor: [
      "The 2018–2019 lapse-and-regain shows why the register matters — always check the live status.",
    ],
  },
  "paris-baguette": {
    certifiedSince: "2026",
    whyStatus: [
      "All Paris Baguette outlets in Singapore obtained MUIS halal certification in February 2026, supported by its halal-certified food hub in Johor.",
      "The chain had operated no-pork, no-lard since 2021 before completing full certification.",
    ],
    watchFor: [
      "This is a recent certification — if you visited before February 2026, the status you remember has changed (for the better).",
      "Certification is per-premises: outlets opened after February 2026 are covered once their own certificate is issued — check new branches on HalalSG.",
    ],
    faqs: [
      { q: "When did Paris Baguette become halal-certified?", a: "February 2026, covering all Singapore outlets. Before that it operated no-pork, no-lard from 2021 without certification." },
    ],
  },
  "tim-hortons": {
    certifiedSince: "2026",
    whyStatus: [
      "Tim Hortons Singapore received MUIS halal certification in February 2026, covering all of its restaurants islandwide after a full supply-chain and kitchen audit.",
    ],
    watchFor: [
      "New outlets opening after the certification are covered once their own premises certificate is issued.",
    ],
  },
  yoshinoya: {
    certifiedSince: "2024",
    whyStatus: [
      "Yoshinoya Singapore became MUIS halal-certified in December 2024, with outlets covered islandwide.",
      "The gyudon menu was adapted for certification — sauces are prepared without mirin or sake.",
    ],
    watchFor: [
      "Yoshinoya in Japan and most other markets is not halal — the certification is Singapore-specific.",
    ],
  },
  sukiya: {
    certifiedSince: "2023",
    whyStatus: [
      "Sukiya's Singapore outlets have been MUIS halal-certified since May 2023.",
      "Before certification the chain operated no-pork, no-lard; the certified menu now has verified sourcing and preparation.",
    ],
    watchFor: [
      "Sukiya overseas (including Japan) is not halal-certified — this covers the Singapore outlets.",
    ],
  },

  /* ── Partial ── */
  "killiney-kopitiam": {
    whyStatus: [
      "Only selected Killiney operations hold MUIS certification: the Tanah Merah Ferry Terminal outlets, the halal concept Kedai Killiney Kopi, and certain packaged retail products.",
      "Most regular Killiney Kopitiam outlets are not halal-certified.",
    ],
    watchFor: [
      "Check whether the specific outlet you're visiting is one of the certified ones — the brand name alone doesn't tell you.",
      "Packaged Killiney products (kaya, coffee) are covered only when the pack carries the halal mark.",
    ],
    alternatives: [
      { label: "Kedai Killiney Kopi — Killiney's own halal-certified concept" },
      { label: "Old Chang Kee — certified since 2005", slug: "old-chang-kee" },
      ...ALT.coffee.slice(0, 1),
    ],
    faqs: [
      { q: "Which Killiney outlets are halal-certified?", a: "The Tanah Merah Ferry Terminal outlets and the Kedai Killiney Kopi concept hold MUIS certification, along with certain packaged retail products carrying the halal mark. Regular Killiney Kopitiam outlets are not certified — check the specific outlet on MUIS HalalSG." },
    ],
  },
  "chocolate-origin": {
    whyStatus: [
      "Chocolate Origin holds MUIS halal certification for specific products — including its signature chocolate cake — but its outlets are not certified premises.",
    ],
    watchFor: [
      "Only packaged items bearing the halal logo are covered; in-store handling at uncertified outlets is outside the certification.",
    ],
    alternatives: ALT.sweet,
    faqs: [
      { q: "Is the Chocolate Origin chocolate cake halal?", a: "The signature chocolate cake is among roughly seven products holding MUIS product certification — look for the halal logo on the packaging. The outlets themselves are not certified premises." },
    ],
  },
  haribo: {
    whyStatus: [
      "Standard Haribo (made in Germany) contains pork-derived gelatine and is not halal.",
      "Haribo also produces halal-certified ranges — made in Turkey with beef gelatine and certified by overseas halal bodies — which are sold in Singapore.",
    ],
    watchFor: [
      "Check every pack: only packs carrying a halal mark (typically Turkey-made) are halal; the standard range uses pork gelatine.",
      "Mixed retail shelves often stock both ranges side by side.",
    ],
    alternatives: [
      { label: "Halal-marked Haribo (Turkey-made) — look for the halal logo on the pack" },
      { label: "Sweets with plant-based gelling (pectin/agar) — check the ingredient list" },
    ],
    faqs: [
      { q: "How do I tell halal Haribo from the standard range?", a: "Look for the halal certification mark on the pack — the halal range is manufactured in Turkey with beef gelatine. Standard German-made Haribo uses pork gelatine and carries no halal mark." },
    ],
  },

  /* ── No-pork (self-declared, not certified) ── */
  "genki-sushi": {
    whyStatus: [
      "Genki Sushi Singapore states its menu uses no pork and no lard, but holds no MUIS certification.",
      "Some sauces contain mirin (a rice wine), and the chain says it cannot guarantee against cross-contamination.",
    ],
    watchFor: [
      "Mirin appears in several Japanese sauces and glazes — ask which items contain it.",
      "Self-declared no-pork status is not audited by any certifier.",
    ],
    alternatives: ALT.japanese,
  },
  koi: {
    whyStatus: [
      "KOI states its ingredients are plant- or dairy-based with no alcohol or animal gelatine — but this is self-declared; KOI holds no MUIS certification in Singapore.",
    ],
    watchFor: [
      "Flavourings, syrups and toppings are the usual uncertainty in bubble tea — none are independently verified here.",
    ],
    alternatives: [
      { label: "Mr Bean — certified drinks & snacks since 2022", slug: "mr-bean" },
      ...ALT.coffee.slice(0, 1),
    ],
  },
  liho: {
    whyStatus: [
      "LiHO has said its outlets use no pork, lard or meat products, but some ingredients come from suppliers that are not halal-certified.",
      "The chain holds no MUIS certification in Singapore.",
    ],
    watchFor: [
      "Cheese-foam and specialty toppings involve dairy cultures and flavourings that are unverified.",
    ],
    alternatives: [
      { label: "Mr Bean — certified drinks & snacks since 2022", slug: "mr-bean" },
      ...ALT.coffee.slice(0, 1),
    ],
  },
  "mos-burger": {
    whyStatus: [
      "MOS Burger Singapore serves no pork or lard according to menu guides, but holds no MUIS certification and has stated it is not halal-certified here.",
    ],
    watchFor: [
      "Sauces and patties are unverified — 'no pork' does not cover sourcing or handling.",
    ],
    alternatives: ALT.fastfood,
  },
  cedele: {
    whyStatus: [
      "Cedele's menu uses no pork or lard, but the chain has not applied for MUIS certification — sourcing and handling are unverified.",
    ],
    watchFor: [
      "Cakes and dressings can involve wine, spirits or gelatine at uncertified bakeries — ask per item.",
    ],
    alternatives: ALT.bakery,
  },
  emicakes: {
    whyStatus: [
      "Emicakes' own FAQ states it is not halal-certified, while declaring it uses no pork, lard or alcohol in products or processes.",
      "That declaration is self-made — no certifier audits it.",
    ],
    watchFor: [
      "Durian and cream cakes involve gelatine and flavourings that are not independently verified.",
    ],
    alternatives: ALT.sweet,
    faqs: [
      { q: "Why was Emicakes previously listed as halal on some sites?", a: "Emicakes declares no pork, no lard and no alcohol, which is sometimes mistaken for certification. Its own FAQ confirms it holds no halal certificate — so we list it as self-declared, not certified." },
    ],
  },

  /* ── Not certified ── */
  saizeriya: {
    whyStatus: [
      "Saizeriya's menu includes pork dishes and wine, and its outlets are not on the MUIS HalalSG register.",
    ],
    watchFor: [
      "Pork appears across the menu (cutlets, pizzas, dorias) and wine is served — this is not a borderline case.",
    ],
    alternatives: ALT.japanese,
  },
  breadtalk: {
    whyStatus: [
      "BreadTalk's own FAQ confirms it is not halal-certified.",
      "Some products contain pork floss and other non-halal fillings.",
    ],
    watchFor: [
      "Pork floss buns share display shelves and tongs with other breads — cross-contact is unmanaged.",
    ],
    alternatives: ALT.bakery,
  },
  chateraise: {
    whyStatus: [
      "Chateraise is not on the MUIS register, and some products contain alcohol (wine-based desserts) or gelatine of unverified origin.",
    ],
    watchFor: [
      "Japanese confectionery commonly uses mirin, sake or wine in glazes and jellies — check each product.",
    ],
    alternatives: ALT.sweet,
  },
  starbucks: {
    whyStatus: [
      "In May 2026 MUIS publicly confirmed it had received no halal certification application from Starbucks Singapore, and ordered the chain to remove signage referring to a 'transition toward halal-certified operations'.",
      "Most drinks are pork-free, but food items include non-halal ingredients and nothing is independently verified.",
    ],
    watchFor: [
      "Ignore in-store wording about halal transitions — MUIS itself has said no application exists.",
      "Food display cases mix items; sandwiches have included non-halal meats.",
    ],
    alternatives: ALT.coffee,
    faqs: [
      { q: "Didn't Starbucks Singapore say it was going halal?", a: "Signage referring to a 'transition toward halal-certified operations' appeared in 2026, but MUIS publicly confirmed in May 2026 that no certification application had been received and ordered the signage removed. Until a certificate appears on HalalSG, Starbucks Singapore is not halal-certified." },
    ],
  },
  haidilao: {
    whyStatus: [
      "Haidilao serves pork (including pork-blood items) and alcohol, and holds no MUIS certification.",
    ],
    watchFor: [
      "Shared hotpot broths and utensils make even 'safe-looking' orders unverifiable here.",
    ],
    alternatives: [
      { label: "Seoul Garden — MUIS-certified grill & steamboat chain" },
      ...ALT.japanese.slice(0, 2),
    ],
  },
  "four-leaves": {
    whyStatus: [
      "Four Leaves holds no MUIS certification, and its range includes pork floss buns.",
    ],
    watchFor: [
      "Bakery items share shelves, trays and tongs with pork floss products.",
    ],
    alternatives: ALT.bakery,
  },
  "tiong-bahru-bakery": {
    whyStatus: [
      "Tiong Bahru Bakery is not MUIS-certified and makes no halal or no-pork claims — the menu includes pork-based items.",
    ],
    watchFor: [
      "Croissants and viennoiserie may involve alcohol-washed fruit or pork products (e.g. ham) in the same kitchen.",
    ],
    alternatives: ALT.bakery,
  },
  "bengawan-solo": {
    whyStatus: [
      "MUIS has confirmed Bengawan Solo is not certified and has never applied.",
      "Its kueh use no pork, lard or meat, but some cakes contain rum-based syrup.",
    ],
    watchFor: [
      "The rum syrup appears in specific cakes — the kueh line is plant-based but shares production and is unverified.",
    ],
    alternatives: ALT.sweet,
    faqs: [
      { q: "Are Bengawan Solo's kueh halal even without certification?", a: "The traditional kueh are made without pork, lard or meat, but the brand holds no certification, has never applied, and some of its cakes contain rum syrup. Whether that is acceptable is a personal decision — there is no independent verification." },
    ],
  },
  "jacks-place": {
    whyStatus: [
      "Jack's Place serves pork and bacon dishes and alcohol, and is not on the MUIS register.",
      "Its parent group runs Eatzi Gourmet as its separately halal-certified brand.",
    ],
    watchFor: [
      "If you're invited to a Jack's Place dinner, note the same group's Eatzi Gourmet restaurants are the halal-certified option.",
    ],
    alternatives: [
      { label: "Eatzi Gourmet — the group's halal-certified steakhouse brand" },
      { label: "Pepper Lunch — certified sizzling plates", slug: "pepper-lunch" },
    ],
  },
  "shake-shack": {
    whyStatus: [
      "Shake Shack said from its Singapore opening that it would not seek halal certification; the menu includes non-halal beef hot dogs, bacon and alcohol.",
    ],
    watchFor: [
      "Beef items here are not from verified halal supply chains — 'beef' alone is not the test.",
    ],
    alternatives: ALT.fastfood,
  },
  "awfully-chocolate": {
    whyStatus: [
      "Awfully Chocolate itself states it is not a halal-certified company because parts of its range contain alcohol, although no pork or lard is used.",
    ],
    watchFor: [
      "Alcohol appears in specific cakes and truffles — and shared production means even alcohol-free items are unverified.",
    ],
    alternatives: ALT.sweet,
  },
  "din-tai-fung": {
    whyStatus: [
      "Din Tai Fung's signature dishes — including xiao long bao — contain pork, and its Singapore restaurants hold no MUIS certification.",
      "The Muslim-friendly 'DIN by Din Tai Fung' concept exists only in Malaysia.",
    ],
    watchFor: [
      "Pork is central to the menu here; there is no halal-adapted Singapore concept yet.",
    ],
    alternatives: ALT.japanese,
  },
  chagee: {
    whyStatus: [
      "CHAGEE holds JAKIM halal certification in Malaysia, but certification does not carry across borders — its Singapore outlets are not on the MUIS register.",
    ],
    watchFor: [
      "Malaysian JAKIM certification you may have seen online does not cover Singapore outlets.",
    ],
    alternatives: [
      { label: "Mr Bean — certified drinks & snacks since 2022", slug: "mr-bean" },
      ...ALT.coffee.slice(0, 1),
    ],
    faqs: [
      { q: "CHAGEE is halal in Malaysia — doesn't that count in Singapore?", a: "No. Halal certification is issued per country and per premises. CHAGEE's JAKIM certification covers its Malaysian operations; its Singapore outlets would need their own MUIS certification, which they do not currently hold." },
    ],
  },
};

/* ── Layering helpers ─────────────────────────────────────────────────────── */

/** Fill only the fields the base entry left empty. Base (incl. CMS override)
 * always wins — an admin can replace any curated field from Keystatic, but
 * cannot blank one entirely (leaving it empty re-inherits the curated value). */
export function withCuratedContent(b: BrandHalal): BrandHalal {
  const c = BRAND_CONTENT[b.slug];
  if (!c) return b;
  return {
    ...b,
    certifiedSince: b.certifiedSince || c.certifiedSince,
    whyStatus: b.whyStatus?.length ? b.whyStatus : c.whyStatus,
    watchFor: b.watchFor?.length ? b.watchFor : c.watchFor,
    alternatives: b.alternatives?.length ? b.alternatives : c.alternatives,
    faqs: b.faqs?.length ? b.faqs : c.faqs,
    explainer: b.explainer || c.explainer,
  };
}

/** Final FAQ list for a brand page: lead answer + curated + status defaults,
 * deduped by (normalized) question, capped at 6. Feeds BOTH the visible
 * accordion and faqJsonLd so page and schema never drift. */
export function buildBrandFaq(b: BrandHalal): BrandFaqItem[] {
  const lead: BrandFaqItem = {
    q: `Is ${b.brand} MUIS halal-certified in Singapore?`,
    a: b.answer,
  };
  const verify: BrandFaqItem = {
    q: `How can I check if ${b.brand} is halal?`,
    a: `Search for ${b.brand} on the official MUIS HalalSG register at halal.muis.gov.sg, or look for a valid MUIS halal certificate displayed at the outlet. A “no pork, no lard” sign is self-declared and is not the same as MUIS halal certification.`,
  };
  const all = [lead, ...(b.faqs || []), ...STATUS_EXPLAINERS[b.status].defaultFaqs(b.brand), verify];
  const seen = new Set<string>();
  const out: BrandFaqItem[] = [];
  for (const f of all) {
    const key = f.q.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(f);
    if (out.length >= 6) break;
  }
  return out;
}

/** Method checklist lines with the lastChecked date interpolated. */
export function methodLines(status: HalalStatus, lastChecked: string): string[] {
  return STATUS_EXPLAINERS[status].method.map((l) => l.replace("{date}", lastChecked));
}

/** Watch-for items: brand-specific first, topped up with per-status defaults
 * (deduped, capped at 4) so every page carries real depth. */
export function watchForItems(b: BrandHalal): string[] {
  const merged = [...(b.watchFor || []), ...STATUS_EXPLAINERS[b.status].defaultWatchFor];
  return [...new Set(merged)].slice(0, 4);
}

/** Verdict headline for the status card, e.g. "Yes — MUIS halal-certified". */
export function verdictHeadline(b: BrandHalal): string {
  const m = STATUS_META[b.status];
  return `${b.brand} — ${m.label}`;
}
