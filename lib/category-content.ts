/* Humble Halal — per-category SEO content.
   Drives the Singapore-wide category landing pages (/halal/{cat}-singapore)
   and enriches the area×category pages with collapsible content + FAQ.
   Plain data module — safe to import on both server and client. */

import type { QA } from "./faq";

export interface CategoryContent {
  /** Optional H1 override; else "Halal {label} in Singapore". */
  h1?: string;
  /** Singapore-wide intro paragraph (keyword-rich, ~60–80 words). */
  intro: string;
  /** "What to look for" bullets. */
  lookFor: string[];
  /** Category-specific halal considerations. */
  considerations: string[];
  /** 3–4 Q&As → rendered as FAQ + FAQPage JSON-LD. */
  faq: QA[];
}

export const CATEGORY_CONTENT: Record<string, CategoryContent> = {
  restaurants: {
    intro:
      "Find halal restaurants across Singapore — from MUIS-certified Malay and Nasi Padang stalls to Indian-Muslim, Middle Eastern and Western kitchens. Every listing shows its halal-confidence score, so you can eat out with certainty whether you’re after a quick weekday lunch or a family feast.",
    lookFor: [
      "The MUIS Certified badge — officially halal-certified by MUIS",
      "A Muslim-Owned label for community-run kitchens",
      "The halal-confidence score (0–100) at a glance",
      "Prayer space in-store, or a mosque nearby",
      "Recent reviews and photos from other diners",
    ],
    considerations: [
      "MUIS certification covers the kitchen and supply chain — check the certificate is current on HalalSG.",
      "“No pork, no lard” is self-declared and is not the same as MUIS certification.",
      "For a chain, confirm the specific outlet is certified, not just the brand.",
    ],
    faq: [
      { q: "Are all restaurants on Humble Halal MUIS-certified?", a: "No. We label each one — MUIS Certified, Admin Verified, Muslim-Owned or self-declared — and show a halal-confidence score. Always confirm certification on the official MUIS HalalSG register." },
      { q: "How do I find halal restaurants near me in Singapore?", a: "Use the area filters or the map view to see halal restaurants by neighbourhood, then sort by halal-confidence score or rating." },
      { q: "What’s the difference between MUIS-certified and Muslim-owned?", a: "MUIS-certified means the outlet holds an official MUIS halal certificate. Muslim-owned means the business is run by Muslims but may not hold MUIS certification." },
    ],
  },
  cafes: {
    intro:
      "Discover halal cafés and coffee spots in Singapore — specialty coffee, all-day brunch and dessert bars that are MUIS-certified or Muslim-owned. Browse by area, check the halal-confidence score, and find a calm spot for work, catch-ups or a weekend treat.",
    lookFor: [
      "MUIS Certified or Muslim-Owned labels",
      "Halal-confidence score before you go",
      "Alcohol-free menus and no pork on the premises",
      "Prayer space nearby for longer visits",
      "Photos of the space, coffee and bakes",
    ],
    considerations: [
      "Many cafés are Muslim-owned but not MUIS-certified — check the badge and score.",
      "Confirm that baked goods use halal gelatin and no alcohol-based flavourings.",
      "Some cafés serve halal food but share kitchens — read the verification notes.",
    ],
    faq: [
      { q: "Are the cafés listed alcohol-free?", a: "Most Muslim-owned and MUIS-certified cafés are alcohol-free, but always check the listing’s halal-confidence score and verification notes." },
      { q: "How do I find halal cafés in a specific area?", a: "Open a neighbourhood page or use the area filter to see halal cafés near you, sorted by halal-confidence and rating." },
    ],
  },
  groceries: {
    intro:
      "Shop halal groceries in Singapore — halal butchers, minimarts, frozen and wholesale suppliers, spices, dates and specialty pantry goods. Find MUIS-certified meat and Muslim-owned grocers near you, with halal-confidence scores so you can stock the kitchen with confidence.",
    lookFor: [
      "MUIS-certified halal meat and butchers",
      "Muslim-Owned minimarts and specialty stores",
      "Clear labelling of frozen and imported goods",
      "Halal-confidence score on every listing",
      "Convenient locations near your neighbourhood",
    ],
    considerations: [
      "For meat, look for MUIS certification or a clear zabihah/slaughter note.",
      "Imported and frozen products should carry a recognised halal mark.",
      "Confirm certification is current — supplier changes can affect status.",
    ],
    faq: [
      { q: "Where can I buy halal meat in Singapore?", a: "Use the Groceries category and filter by area to find MUIS-certified halal butchers and minimarts, each with a halal-confidence score." },
      { q: "Is imported frozen meat halal?", a: "Only if it carries a recognised halal certification mark. Check the product label and the store’s listing notes." },
    ],
  },
  beauty: {
    h1: "Muslim-Friendly Beauty & Grooming in Singapore",
    intro:
      "Find halal-friendly beauty and grooming in Singapore — Muslimah salons, women-only spaces, barbers, spa and nail studios, and halal cosmetics. Browse Muslim-owned providers with prayer-friendly, private settings and halal-confidence scores you can trust.",
    lookFor: [
      "Women-only or private rooms for Muslimah services",
      "Muslim-Owned and Admin Verified labels",
      "Halal / alcohol-free and wudhu-friendly products",
      "Halal-confidence score on each listing",
      "Reviews from the community",
    ],
    considerations: [
      "“Halal nail polish” should be water-permeable (breathable) for wudhu — confirm with the salon.",
      "Check whether services are women-only or have private rooms.",
      "Halal cosmetics avoid alcohol and animal-derived ingredients without certification.",
    ],
    faq: [
      { q: "Are there women-only halal salons in Singapore?", a: "Yes — many Muslimah salons offer women-only or private-room services. Look for the note in each listing and the halal-confidence score." },
      { q: "What makes cosmetics halal?", a: "Halal cosmetics avoid alcohol and uncertified animal-derived ingredients, and (for nail polish) are often water-permeable for wudhu." },
    ],
  },
  health: {
    h1: "Muslim-Friendly Health, Cupping (Bekam) & Clinics in Singapore",
    intro:
      "Find Muslim-friendly health and wellness in Singapore — clinics, dental, pharmacies, cupping (bekam), confinement care and women-friendly fitness. Discover Muslim-owned and trusted providers with prayer-friendly, modesty-aware care and halal-confidence scores.",
    lookFor: [
      "Women-friendly or female practitioners where needed",
      "Muslim-Owned and Admin Verified providers",
      "Halal medication and alcohol-free options at pharmacies",
      "Cupping (bekam) and Islamic wellness practitioners",
      "Halal-confidence score on each listing",
    ],
    considerations: [
      "Ask pharmacies about halal-formulated or gelatin-free medication where it matters to you.",
      "Confirm modesty preferences (female practitioner, private room) when booking.",
      "Wellness services like bekam are not medical advice — consult a doctor for conditions.",
    ],
    faq: [
      { q: "Can I find female doctors or modest clinics?", a: "Many listed clinics accommodate modesty preferences and female practitioners. Check the listing notes and contact the clinic to confirm." },
      { q: "Where can I find cupping (bekam) in Singapore?", a: "Use the Health & Medical category and filter by area to find bekam and Islamic wellness practitioners near you." },
    ],
  },
  fashion: {
    h1: "Modest Fashion, Abaya & Baju Kurung in Singapore",
    intro:
      "Shop modest fashion in Singapore — abayas, hijabs (tudung), jubah, baju kurung, tailoring, songkok and modest footwear from Muslim-owned and homegrown labels. Browse halal-conscious boutiques by area, with halal-confidence scores and community reviews.",
    lookFor: [
      "Muslim-Owned modest fashion and hijab labels",
      "Tailoring and alteration services",
      "Bridal, abaya and occasion wear specialists",
      "Halal-confidence score and reviews",
      "In-store or online (with local pickup) options",
    ],
    considerations: [
      "Modesty and fit vary by label — check sizing and fabric notes.",
      "Some boutiques are home-based — confirm collection or delivery details.",
      "Look for Muslim-owned labels supporting the local community.",
    ],
    faq: [
      { q: "Where can I buy hijabs and abayas in Singapore?", a: "Use the Modest Fashion category and filter by area to find Muslim-owned boutiques for hijabs, abayas, jubah and more." },
      { q: "Do these stores offer tailoring?", a: "Many do — look for tailoring and alteration notes in the listing, or message the store directly." },
    ],
  },
  services: {
    h1: "Muslim-Owned Home Services in Singapore",
    intro:
      "Find Muslim-owned home services in Singapore — renovation and interior, aircon servicing, cleaning, movers, plumbing, electrical and handyman work. Get matched with trusted, halal-conscious providers, compare halal-confidence scores, and request free quotes.",
    lookFor: [
      "Muslim-Owned and Admin Verified providers",
      "Transparent quotes and clear scope",
      "Halal-confidence score and customer reviews",
      "Coverage in your area",
      "The option to request a quote in minutes",
    ],
    considerations: [
      "Always get an itemised quote before committing to home services.",
      "Check reviews and ask for references for larger jobs like renovation.",
      "Muslim-owned does not guarantee licensing — verify credentials for regulated work.",
    ],
    faq: [
      { q: "How do I get quotes from Muslim-owned home-service providers?", a: "Use “Request a quote” to describe your job — we’ll match you with trusted Muslim-owned providers who send you quotes, free and with no obligation." },
      { q: "Are these providers licensed?", a: "Many are, but Muslim-owned doesn’t guarantee licensing. For regulated work (e.g. electrical), confirm the provider’s credentials." },
    ],
  },
  automotive: {
    h1: "Muslim-Owned Automotive Services in Singapore",
    intro:
      "Find Muslim-owned automotive services in Singapore — workshops, servicing, detailing, car rental and dealers. Browse trusted, halal-conscious providers by area, compare halal-confidence scores and reviews, and request quotes for your next service.",
    lookFor: [
      "Muslim-Owned workshops and detailers",
      "Transparent servicing quotes",
      "Halal-confidence score and reviews",
      "Convenient locations and rental options",
      "The option to request a quote",
    ],
    considerations: [
      "Get a written quote and ask which parts are OEM vs aftermarket.",
      "Check reviews for workmanship and pricing transparency.",
      "Confirm warranty terms on servicing and repairs.",
    ],
    faq: [
      { q: "Can I request quotes for car servicing?", a: "Yes — use “Request a quote” to reach Muslim-owned workshops and detailers who’ll send you quotes for servicing, repairs or detailing." },
    ],
  },
  weddings: {
    h1: "Malay & Muslim Wedding Vendors in Singapore",
    intro:
      "Plan a Malay or halal wedding in Singapore — bridal and MUA, photography, kompang, hantaran and deco, florists, catering and planners. Discover Muslim-owned wedding vendors, compare halal-confidence scores and reviews, and request quotes for your big day.",
    lookFor: [
      "Muslim-Owned bridal, MUA and deco specialists",
      "Photography and videography packages",
      "Kompang, hantaran and event styling",
      "Halal-confidence score and portfolios",
      "The option to request quotes from several vendors",
    ],
    considerations: [
      "Book popular wedding vendors early — peak dates fill fast.",
      "Confirm package inclusions and deposit terms in writing.",
      "Ask about modesty preferences for MUA and photography.",
    ],
    faq: [
      { q: "How do I find Muslim wedding vendors in Singapore?", a: "Browse the Weddings category or use “Request a quote” to reach Muslim-owned MUA, photographers, deco and halal catering vendors in one go." },
      { q: "Can vendors accommodate modesty preferences?", a: "Many do — ask about female MUA, private setups and modest photography when you request your quote." },
    ],
  },
  education: {
    h1: "Islamic Education, Quran Classes & Tuition in Singapore",
    intro:
      "Find Islamic education and tuition in Singapore — Quran, tahfiz and tajweed classes, madrasah and Islamic studies, plus academic tuition and enrichment. Discover Muslim-owned centres and tutors, compare halal-confidence scores, and enquire directly.",
    lookFor: [
      "Quran, tahfiz and tajweed programmes",
      "Qualified asatizah and experienced tutors",
      "Muslim-Owned centres and home tutors",
      "Halal-confidence score and reviews",
      "Class formats (in-centre, online, 1-to-1)",
    ],
    considerations: [
      "Ask about the teacher’s qualifications and class sizes.",
      "Confirm schedules, fees and trial-class options before enrolling.",
      "For children, check the centre’s safeguarding and environment.",
    ],
    faq: [
      { q: "Where can I find Quran classes in Singapore?", a: "Use the Education category and filter by area to find Quran, tahfiz and tajweed classes from Muslim-owned centres and tutors." },
    ],
  },
  professional: {
    h1: "Muslim-Owned Professional Services in Singapore",
    intro:
      "Find Muslim-owned professional services in Singapore — accounting, legal and Syariah, insurance and takaful, Islamic financial planning, marketing, design and printing. Browse trusted, halal-conscious providers, compare halal-confidence scores, and request quotes.",
    lookFor: [
      "Muslim-Owned and Admin Verified firms",
      "Takaful and Islamic finance specialists",
      "Clear scope and transparent fees",
      "Halal-confidence score and reviews",
      "The option to request a quote",
    ],
    considerations: [
      "For Islamic finance and takaful, confirm Shariah-compliance and any advisory board.",
      "Check licensing for regulated services (legal, financial advice).",
      "Get the scope and fees in writing before engaging.",
    ],
    faq: [
      { q: "Can I find Shariah-compliant financial services?", a: "Yes — the Professional category includes takaful and Islamic financial planning. Confirm Shariah-compliance and licensing with each provider." },
    ],
  },
  travel: {
    h1: "Umrah Agencies & Muslim-Friendly Travel in Singapore",
    intro:
      "Plan halal travel from Singapore — Umrah and Hajj agencies, Islamic tours and Muslim-friendly stays. Discover trusted, Muslim-owned travel providers, compare halal-confidence scores and reviews, and request quotes for your next pilgrimage or holiday.",
    lookFor: [
      "Licensed Umrah and Hajj agencies",
      "Muslim-Owned and Admin Verified providers",
      "Clear package inclusions and itineraries",
      "Halal-confidence score and reviews",
      "The option to request quotes",
    ],
    considerations: [
      "For Umrah and Hajj, confirm the agency is licensed and check package inclusions carefully.",
      "Compare itineraries, hotels and proximity to the Haramain.",
      "Read recent traveller reviews before paying deposits.",
    ],
    faq: [
      { q: "How do I choose an Umrah agency in Singapore?", a: "Compare licensed, Muslim-owned agencies by halal-confidence score and reviews, then request quotes to compare packages, hotels and itineraries." },
    ],
  },
};

/** Generic content for area-level pages (no specific category). */
export const AREA_CONTENT: CategoryContent = {
  intro:
    "Discover halal food and Muslim-owned businesses in this neighbourhood — MUIS-certified restaurants and cafés, groceries, services and more, each with a halal-confidence score so you can choose with certainty.",
  lookFor: [
    "The MUIS Certified badge for officially certified places",
    "Muslim-Owned labels for community-run businesses",
    "Halal-confidence score (0–100) on every listing",
    "Prayer space in-store or a mosque nearby",
    "Recent reviews and photos",
  ],
  considerations: [
    "MUIS certification is the strongest signal — confirm it’s current on HalalSG.",
    "“No pork, no lard” is self-declared, not MUIS certification.",
    "Use the filters to narrow by halal status, prayer space or family-friendly amenities.",
  ],
  faq: [
    { q: "Is everything here MUIS-certified?", a: "No. Each listing is clearly labelled — MUIS Certified, Admin Verified, Muslim-Owned or self-declared — with a halal-confidence score. Always confirm certification on MUIS HalalSG." },
    { q: "How do I find halal food near me?", a: "Use the map view or area filters to see halal places nearby, then sort by halal-confidence score or rating." },
  ],
};

export function categoryContent(catId?: string): CategoryContent {
  if (catId && CATEGORY_CONTENT[catId]) return CATEGORY_CONTENT[catId];
  return AREA_CONTENT;
}

/** Category ids that get a Singapore-wide landing page. */
export const CATEGORY_PAGE_IDS = Object.keys(CATEGORY_CONTENT);

/* ---- Cuisine / concept landing pages (/halal/halal-{cuisine}-singapore).
   Keyword-rich, unique intros so each page stands on its own content. */
const cuisineFaq = (label: string): QA[] => [
  { q: `Where can I find halal ${label.toLowerCase()} in Singapore?`, a: `Browse this page or use the area and map filters to find halal ${label.toLowerCase()} near you — each listing shows its halal-confidence score, MUIS or Muslim-owned status, reviews and directions.` },
  { q: `Is halal ${label.toLowerCase()} MUIS-certified?`, a: `Some spots are MUIS-certified and others are Muslim-owned or self-declared "no pork, no lard". We label each one and show a halal-confidence score — always confirm certification on the official MUIS HalalSG register.` },
];

export const CUISINE_CONTENT: Record<string, CategoryContent> = {
  sushi: { intro: "Craving halal sushi in Singapore? Discover Muslim-friendly Japanese spots serving sushi, sashimi-style rolls, donburi and ramen without pork or alcohol — from casual conveyor-belt chains to sit-down restaurants. Browse by area with halal-confidence scores, reviews and directions.", lookFor: [], considerations: [], faq: cuisineFaq("sushi") },
  japanese: { intro: "Find halal Japanese food in Singapore — sushi, ramen, donburi, katsu and teppanyaki from Muslim-friendly kitchens with no pork and no alcohol. Compare halal-confidence scores, read reviews and find a spot near you.", lookFor: [], considerations: [], faq: cuisineFaq("Japanese food") },
  korean: { intro: "Discover halal Korean food in Singapore — Korean fried chicken, army stew (budae jjigae), bibimbap and halal Korean BBQ from Muslim-friendly restaurants. Browse by area with halal-confidence scores, reviews and directions.", lookFor: [], considerations: [], faq: cuisineFaq("Korean food") },
  thai: { intro: "Find halal Thai food in Singapore — tom yum, green curry, basil chicken and mango sticky rice from Muslim-friendly Thai kitchens. Compare halal-confidence scores and find a spot near you.", lookFor: [], considerations: [], faq: cuisineFaq("Thai food") },
  "dim-sum": { intro: "Looking for halal dim sum in Singapore? Discover Muslim-friendly Chinese restaurants serving siew mai, har gow, custard buns and more — no pork, fully halal. Browse with halal-confidence scores, reviews and directions.", lookFor: [], considerations: [], faq: cuisineFaq("dim sum") },
  steamboat: { intro: "Find halal steamboat and hotpot in Singapore — mookata, shabu-shabu and mala hotpot from Muslim-friendly restaurants. Gather the family around a halal pot with halal-confidence scores, reviews and directions.", lookFor: [], considerations: [], faq: cuisineFaq("steamboat") },
  "fine-dining": { intro: "Discover halal fine dining in Singapore — premium halal restaurants for special occasions, from wagyu grills to multi-course tasting menus, all Muslim-friendly. Browse with halal-confidence scores, reviews and directions.", lookFor: [], considerations: [], faq: cuisineFaq("fine dining") },
  "high-tea": { intro: "Find halal high tea in Singapore — Muslim-friendly afternoon-tea spreads, scones, pastries and brunch sets without alcohol or pork. Browse halal cafés and hotels with halal-confidence scores and reviews.", lookFor: [], considerations: [], faq: cuisineFaq("high tea") },
  western: { intro: "Discover halal Western food in Singapore — burgers, steaks, pasta and grills from Muslim-friendly kitchens with no pork and no alcohol. Compare halal-confidence scores and find a spot near you.", lookFor: [], considerations: [], faq: cuisineFaq("Western food") },
  steak: { intro: "Find halal steak in Singapore — halal wagyu, ribeye and grills from Muslim-friendly steakhouses. Browse with halal-confidence scores, reviews and directions for your next steak night.", lookFor: [], considerations: [], faq: cuisineFaq("steak") },
  bbq: { intro: "Discover halal BBQ and grill in Singapore — Korean BBQ, charcoal grills and smokehouse spots that are Muslim-friendly. Browse with halal-confidence scores, reviews and directions.", lookFor: [], considerations: [], faq: cuisineFaq("BBQ") },
  seafood: { intro: "Find halal seafood in Singapore — chilli crab, grilled fish, prawns and seafood platters from Muslim-friendly restaurants. Compare halal-confidence scores and find a spot near you.", lookFor: [], considerations: [], faq: cuisineFaq("seafood") },
  indian: { intro: "Discover halal Indian food in Singapore — biryani, tandoori, prata and North Indian curries from MUIS-certified and Muslim-owned kitchens. Browse with halal-confidence scores, reviews and directions.", lookFor: [], considerations: [], faq: cuisineFaq("Indian food") },
  "nasi-padang": { intro: "Find the best nasi padang in Singapore — rendang, ayam bakar, sambal goreng and gulai from heritage Malay and Minang kitchens, MUIS-certified and Muslim-owned. Browse with halal-confidence scores, reviews and directions.", lookFor: [], considerations: [], faq: cuisineFaq("nasi padang") },
  breakfast: { intro: "Find halal breakfast and brunch in Singapore — nasi lemak, big breakfasts, kaya toast and all-day brunch from Muslim-friendly cafés. Start the day with halal-confidence scores, reviews and directions.", lookFor: [], considerations: [], faq: cuisineFaq("breakfast") },
  dessert: { intro: "Discover halal desserts in Singapore — cakes, ice cream, kunafa, kueh and chocolate from Muslim-friendly bakeries and dessert bars. Browse with halal-confidence scores, reviews and directions.", lookFor: [], considerations: [], faq: cuisineFaq("dessert") },
  buffet: { intro: "Find the best halal buffet in Singapore — international spreads, BBQ and steamboat buffets, and high-tea buffets that are MUIS-certified or Muslim-friendly. Browse by area with halal-confidence scores, reviews and directions for your next celebration.", lookFor: [], considerations: [], faq: cuisineFaq("buffet") },
  catering: { intro: "Find halal catering in Singapore — mini buffets, wedding and event catering, corporate spreads and high-tea sets from MUIS-certified and Muslim-owned caterers. Compare options, request quotes and book with confidence.", lookFor: [], considerations: [], faq: [
    { q: "How much does halal catering cost in Singapore?", a: "Halal catering in Singapore typically starts around $12–18 per person for mini buffets and rises for premium wedding or corporate spreads. Request quotes from several Muslim-owned caterers to compare inclusions." },
    { q: "Is the catering MUIS halal-certified?", a: "Many caterers are MUIS-certified; others are Muslim-owned. We label each one with a halal-confidence score — always confirm certification on the official MUIS HalalSG register before booking." },
  ] },
  // Blueprint P1 additions (Keyword Master Plan, HUB1 tab).
  mookata: { intro: "Find halal mookata in Singapore — Thai-style BBQ steamboat where you grill marinated meats over charcoal while soup bubbles around the pan, from fully Muslim-friendly kitchens with halal chicken, beef and seafood. Browse spots by area with halal-confidence scores, reviews and directions for your next group feast.", lookFor: [], considerations: [], faq: cuisineFaq("mookata") },
  ramen: { intro: "Craving halal ramen in Singapore? Discover Muslim-friendly Japanese ramen bars serving rich chicken paitan, beef broth and spicy miso bowls — no pork, no lard, no alcohol. Compare halal-confidence scores, read reviews and find a steaming bowl near you.", lookFor: [], considerations: [], faq: cuisineFaq("ramen") },
  cakes: { intro: "Find halal cakes in Singapore — birthday cakes, wedding cakes, brownies and bakes from MUIS-certified bakeries and Muslim-owned home bakers. Every listing is labelled with its halal status and confidence score, so you can order celebration bakes with certainty.", lookFor: [], considerations: [], faq: [
    { q: "Where can I buy halal birthday cakes in Singapore?", a: "MUIS-certified bakeries and Muslim-owned home bakers across Singapore take birthday-cake orders — browse this page for options with halal-confidence scores, reviews and ordering details." },
    { q: "Are the cakes here MUIS-certified?", a: "Some bakeries are MUIS-certified while home-based bakers are typically Muslim-owned and not eligible for certification. We label each one clearly — always confirm certification on the MUIS HalalSG register." },
  ] },
  "food-delivery": { intro: "Order halal food delivery in Singapore — MUIS-certified restaurants and Muslim-owned kitchens that deliver islandwide or via GrabFood, Foodpanda and Deliveroo. Each listing shows its halal status and confidence score, so what arrives at your door is food you can trust.", lookFor: [], considerations: [], faq: [
    { q: "Which halal restaurants deliver in Singapore?", a: "Many MUIS-certified and Muslim-owned restaurants offer delivery — either in-house or through GrabFood, Foodpanda and Deliveroo. Browse this page for options with halal-confidence scores and delivery details." },
    { q: "How do I know delivery food is really halal?", a: "Check the restaurant's halal status on its Humble Halal listing — MUIS Certified means a valid official certificate; Muslim-Owned and self-declared labels are shown clearly. Always confirm certification on the MUIS HalalSG register." },
  ] },
};

export function cuisineContent(id?: string): CategoryContent {
  if (id && CUISINE_CONTENT[id]) return CUISINE_CONTENT[id];
  return AREA_CONTENT;
}
