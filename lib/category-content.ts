/* Humble Halal — per-category SEO content.
   Drives the Singapore-wide category landing pages (/halal/{cat}-singapore)
   and enriches the area×category pages with collapsible content + FAQ.
   Plain data module — safe to import on both server and client. */

import type { QA } from "./faq";

export interface CategoryContent {
  /** Optional H1 override; else the canonical category presentation label. */
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
      "Find Muslim-friendly beauty and grooming in Singapore — Muslimah salons, women-only spaces, barbers, spa and nail studios, and halal cosmetics. Browse Muslim-owned providers with prayer-friendly, private settings, clear trust labels and community reviews.",
    lookFor: [
      "Women-only or private rooms for Muslimah services",
      "Muslim-Owned and Admin Verified labels",
      "Halal / alcohol-free and wudhu-friendly products",
      "Clear ownership and verification details",
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
      "Find Muslim-friendly health and wellness in Singapore — clinics, dental, pharmacies, cupping (bekam), confinement care and women-friendly fitness. Discover Muslim-owned and trusted providers offering prayer-friendly, modesty-aware care, with clear verification details and reviews.",
    lookFor: [
      "Women-friendly or female practitioners where needed",
      "Muslim-Owned and Admin Verified providers",
      "Halal medication and alcohol-free options at pharmacies",
      "Cupping (bekam) and Islamic wellness practitioners",
      "Clear ownership, credentials and verification details",
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
      "Shop modest fashion in Singapore — abayas, hijabs (tudung), jubah, baju kurung, tailoring, songkok and modest footwear from Muslim-owned and homegrown labels. Browse boutiques by area, with clear ownership details and community reviews.",
    lookFor: [
      "Muslim-Owned modest fashion and hijab labels",
      "Tailoring and alteration services",
      "Bridal, abaya and occasion wear specialists",
      "Ownership details and community reviews",
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
      "Find Muslim-owned home services in Singapore — renovation and interior, aircon servicing, cleaning, movers, plumbing, electrical and handyman work. Compare verified business details and customer reviews, then request free quotes from suitable providers.",
    lookFor: [
      "Muslim-Owned and Admin Verified providers",
      "Transparent quotes and clear scope",
      "Verified business details and customer reviews",
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
      "Find Muslim-owned automotive services in Singapore — workshops, servicing, detailing, car rental and dealers. Browse trusted providers by area, compare business verification details and reviews, and request quotes for your next service.",
    lookFor: [
      "Muslim-Owned workshops and detailers",
      "Transparent servicing quotes",
      "Business verification details and reviews",
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
      "Plan a Malay or Muslim wedding in Singapore — bridal and MUA, photography, kompang, hantaran and deco, florists, halal catering and planners. Discover Muslim-owned wedding vendors, compare portfolios and reviews, and request quotes for your big day.",
    lookFor: [
      "Muslim-Owned bridal, MUA and deco specialists",
      "Photography and videography packages",
      "Kompang, hantaran and event styling",
      "Portfolios, ownership details and reviews",
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
      "Find Islamic education and tuition in Singapore — Quran, tahfiz and tajweed classes, madrasah and Islamic studies, plus academic tuition and enrichment. Discover Muslim-owned centres and tutors, compare qualifications, class formats and reviews, and enquire directly.",
    lookFor: [
      "Quran, tahfiz and tajweed programmes",
      "Qualified asatizah and experienced tutors",
      "Muslim-Owned centres and home tutors",
      "Teacher qualifications, verification details and reviews",
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
      "Find Muslim-owned professional services in Singapore — accounting, legal and Syariah, insurance and takaful, Islamic financial planning, marketing, design and printing. Browse trusted providers, compare credentials and reviews, and request quotes.",
    lookFor: [
      "Muslim-Owned and Admin Verified firms",
      "Takaful and Islamic finance specialists",
      "Clear scope and transparent fees",
      "Credentials, verification details and reviews",
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
      "Plan Umrah or Muslim-friendly travel from Singapore — Umrah and Hajj agencies, Islamic tours and Muslim-friendly stays. Discover trusted, Muslim-owned travel providers, compare licensing, package details and reviews, and request quotes for your next pilgrimage or holiday.",
    lookFor: [
      "Licensed Umrah and Hajj agencies",
      "Muslim-Owned and Admin Verified providers",
      "Clear package inclusions and itineraries",
      "Licensing, verification details and reviews",
      "The option to request quotes",
    ],
    considerations: [
      "For Umrah and Hajj, confirm the agency is licensed and check package inclusions carefully.",
      "Compare itineraries, hotels and proximity to the Haramain.",
      "Read recent traveller reviews before paying deposits.",
    ],
    faq: [
      { q: "How do I choose an Umrah agency in Singapore?", a: "Compare licensed, Muslim-owned agencies by verification details and reviews, then request quotes to compare packages, hotels and itineraries." },
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
   Keyword-rich, unique intros + hand-written lookFor/considerations/FAQ so each
   page stands on its own content (all cuisines are now individually authored;
   the old generic cuisineFaq() template has been retired). */
export const CUISINE_CONTENT: Record<string, CategoryContent> = {
  sushi: { intro: "Craving halal sushi in Singapore? Discover Muslim-friendly Japanese spots serving sushi, maki rolls, donburi and hand rolls without pork or alcohol — from casual conveyor-belt chains to sit-down restaurants. Browse by area with halal-confidence scores, reviews and directions.",
    lookFor: [
      "The MUIS Certified badge, or a clear Muslim-Owned label",
      "Halal-certified sushi chains and conveyor-belt spots",
      "Sushi rice seasoned without sake/mirin, and halal-safe toppings",
      "A halal-confidence score, reviews and directions before you go",
    ],
    considerations: [
      "Sushi rice vinegar seasoning and some sauces can contain mirin or sake",
      "Eel (unagi) sauce, some mayo blends and imitation crab may have non-halal additives",
      "Cross-contamination at restaurants that also serve pork or alcohol",
      "A MUIS certificate or Muslim-Owned label is the simplest assurance",
    ],
    faq: [
      { q: "Is sushi halal in Singapore?", a: "Sushi is mostly seafood, rice and vegetables — halal in itself — but the rice seasoning and sauces can contain alcohol, and some restaurants serve pork nearby. Several Japanese spots are MUIS-certified or Muslim-owned. Browse this page and confirm certification on the MUIS HalalSG register." },
      { q: "Is the rice in sushi halal?", a: "Usually, but sushi rice is sometimes seasoned with mirin or sake. Halal-certified sushi restaurants use alcohol-free seasoning — look for a MUIS certificate or Muslim-Owned label here." },
      { q: "Is there halal conveyor-belt sushi?", a: "Yes — some conveyor-belt and casual sushi chains are halal-certified or run no-pork menus. Check the outlet's halal status on its listing before you go." },
      { q: "What should I watch for with sushi?", a: "Mirin/sake in the rice and sauces, non-halal additives in eel sauce or imitation crab, and cross-contamination. A certified or Muslim-owned restaurant removes the doubt." },
    ] },
  japanese: { intro: "Find halal Japanese food in Singapore — sushi, ramen, donburi, katsu, teppanyaki and gyudon from Muslim-friendly kitchens with no pork and no alcohol. From certified conveyor-belt chains to sit-down restaurants, compare halal-confidence scores, read reviews and find a halal Japanese spot near you.",
    lookFor: [
      "The MUIS Certified badge, or a clear Muslim-Owned label",
      "Certified chains for gyudon and donburi (e.g. beef-bowl specialists)",
      "Ramen with chicken or beef broth instead of pork (tonkotsu)",
      "A halal-confidence score, reviews and directions before you go",
    ],
    considerations: [
      "Tonkotsu ramen and chashu are pork-based — look for chicken/beef broth and halal toppings",
      "Mirin, sake and cooking wine are common in teriyaki, glazes and simmered dishes",
      "Dashi and some sauces can contain alcohol or non-halal additives — ask when unsure",
      "Certified beef-bowl and sushi chains are the easiest reliably-halal options",
    ],
    faq: [
      { q: "Is Japanese food halal in Singapore?", a: "Several Japanese restaurants and chains in Singapore are MUIS-certified or Muslim-owned and serve fully halal Japanese food; many others are not, because pork (tonkotsu, chashu) and mirin/sake are common. Browse this page for outlets labelled with a halal-confidence score and confirm certification on the MUIS HalalSG register." },
      { q: "Is there halal ramen in Singapore?", a: "Yes — Muslim-friendly ramen bars serve rich chicken (paitan), beef or spicy miso broths with no pork, no lard and no alcohol. See our halal ramen options with reviews and directions." },
      { q: "Is sushi halal?", a: "Sushi is generally seafood, rice and vegetables, which are halal, but check for alcohol in the rice seasoning or sauces and for any non-halal toppings. Choosing a certified or Muslim-owned Japanese restaurant removes the doubt." },
      { q: "What should I watch for in Japanese dishes?", a: "Pork (tonkotsu broth, chashu, some gyoza) and alcohol (mirin, sake, cooking wine in teriyaki and glazes). Certified gyudon, donburi and sushi chains are reliable halal choices." },
    ] },
  korean: { intro: "Discover halal Korean food in Singapore — Korean fried chicken, army stew (budae jjigae), bibimbap, tteokbokki and halal Korean BBQ from Muslim-friendly restaurants. No pork, no soju, no cooking wine — just the spicy, saucy Korean flavours you love, with halal-confidence scores, reviews and directions by area.",
    lookFor: [
      "The MUIS Certified badge, or a clear Muslim-Owned label",
      "Halal Korean BBQ that grills beef, chicken and seafood (no pork belly)",
      "Korean fried chicken glazed without mirin, soju or rice wine",
      "A halal-confidence score and recent reviews before you go",
    ],
    considerations: [
      "Pork is common in Korean cooking — samgyeopsal (pork belly), and pork in some budae jjigae and dumplings",
      "Soju and rice wine (mirin) appear in marinades, stews and dipping sauces — ask before ordering",
      "Kimchi and some banchan use fish sauce or salted shrimp (usually fine), but check for pork stock",
      "Gochujang and gochugaru are plant-based; the doubt is usually the meat and the alcohol, not the chilli",
    ],
    faq: [
      { q: "Is Korean food halal in Singapore?", a: "Some Korean restaurants in Singapore are MUIS-certified or Muslim-owned and serve fully halal Korean food; many mainstream Korean spots are not, because pork and soju/rice wine are common. Use this page to find outlets we've labelled with a halal-confidence score, and confirm certification on the MUIS HalalSG register." },
      { q: "Is there halal Korean BBQ in Singapore?", a: "Yes — several Muslim-friendly Korean BBQ restaurants grill halal beef, chicken and seafood (no pork belly) with alcohol-free marinades. Browse this page by area for halal Korean BBQ with reviews and directions." },
      { q: "Is Korean fried chicken halal?", a: "It depends on the outlet. Halal Korean fried chicken uses halal chicken and glazes made without mirin, soju or rice wine. Look for a MUIS certificate or Muslim-Owned label, or check the listing's halal status here." },
      { q: "What should I watch for in Korean dishes?", a: "Pork (samgyeopsal, some budae jjigae and dumplings) and alcohol (soju, rice wine/mirin in marinades and stews). Choosing a certified or Muslim-owned Korean restaurant removes the doubt." },
    ] },
  thai: { intro: "Find halal Thai food in Singapore — tom yum, green curry, basil chicken, pad thai and mango sticky rice from Muslim-friendly Thai kitchens with no pork and no alcohol. Compare halal-confidence scores, read reviews and find a halal Thai spot near you.",
    lookFor: [
      "The MUIS Certified badge, or a clear Muslim-Owned label",
      "Halal versions of basil chicken (pad krapow), tom yum and green curry",
      "Fish sauce and shrimp paste (these are halal) rather than pork or lard",
      "A halal-confidence score, reviews and directions before you go",
    ],
    considerations: [
      "Pork appears in some dishes (moo ping pork skewers, pork in certain curries and stir-fries)",
      "Fish sauce (nam pla) and shrimp paste (kapi) are halal — the usual watch-out is pork and alcohol",
      "A little cooking wine or beer can appear in some restaurant recipes — ask if unsure",
      "Many Thai-Muslim (halal) eateries exist; a MUIS certificate or Muslim-Owned label is the simplest assurance",
    ],
    faq: [
      { q: "Is Thai food halal in Singapore?", a: "Many Thai eateries in Singapore are Muslim-owned or MUIS-certified and serve fully halal Thai food; mainstream Thai restaurants may serve pork or use cooking wine. Browse this page for outlets labelled with a halal-confidence score and confirm certification on the MUIS HalalSG register." },
      { q: "Is fish sauce halal?", a: "Yes — fish sauce (nam pla) and shrimp paste (kapi), the backbone of Thai flavour, are halal. The usual halal watch-outs in Thai food are pork and any cooking alcohol, not the fermented seafood sauces." },
      { q: "Is tom yum halal?", a: "Tom yum can be halal when made with halal seafood or chicken and no pork or cooking wine. Choose a Muslim-owned or MUIS-certified Thai restaurant, or check the outlet's halal status here." },
      { q: "What should I watch for in Thai dishes?", a: "Pork (moo ping skewers, pork in some curries and stir-fries) and occasional cooking wine or beer. Fish sauce and shrimp paste are fine. A certified or Muslim-owned kitchen removes the doubt." },
    ] },
  "dim-sum": { intro: "Looking for halal dim sum in Singapore? Discover Muslim-friendly Chinese restaurants serving siew mai, har gow, custard buns, carrot cake and more — chicken and prawn instead of pork, fully halal. Browse with halal-confidence scores, reviews and directions.",
    lookFor: [
      "The MUIS Certified badge, or a clear Muslim-Owned label",
      "Chicken or prawn siew mai and buns instead of pork char siew",
      "Egg tarts and pastries made without lard",
      "A halal-confidence score, reviews and directions before you go",
    ],
    considerations: [
      "Traditional dim sum is pork-heavy — char siew bao, pork siew mai, xiao long bao",
      "Pastry and dough can be made with lard — halal kitchens use vegetable fats",
      "Some sauces and soups use cooking wine or chicken stock of unverified source",
      "Halal dim sum specialists rebuild the menu with halal chicken, beef and prawn",
    ],
    faq: [
      { q: "Is dim sum halal in Singapore?", a: "Traditional dim sum is pork-heavy, but several Muslim-owned and MUIS-certified restaurants serve fully halal dim sum using chicken, prawn and beef. Browse this page for halal dim sum spots with a halal-confidence score and confirm certification on the MUIS HalalSG register." },
      { q: "Is siew mai halal?", a: "Classic siew mai is pork, but halal dim sum restaurants make it with chicken or prawn. Look for a MUIS certificate or Muslim-Owned label, or check the outlet's halal status here." },
      { q: "What dim sum can I eat if it's halal-certified?", a: "At a halal dim sum restaurant you can enjoy siew mai, har gow, custard (liu sha) buns, chicken feet, carrot cake and egg tarts — all rebuilt without pork or lard." },
      { q: "What should I watch for in dim sum?", a: "Pork (char siew bao, pork siew mai, xiao long bao), lard in pastry, and cooking wine in sauces. Choosing a certified or Muslim-owned dim sum restaurant removes the doubt." },
    ] },
  steamboat: { intro: "Find halal steamboat and hotpot in Singapore — mala hotpot, shabu-shabu, collagen and tom yum pots from Muslim-friendly restaurants with halal meats and no pork or wine. Gather the family around a halal pot with halal-confidence scores, reviews and directions.",
    lookFor: [
      "The MUIS Certified badge, or a clear Muslim-Owned label",
      "Halal beef, chicken and seafood slices (no pork)",
      "Broth bases made without pork bones or cooking wine",
      "A halal-confidence score, reviews and directions before you go",
    ],
    considerations: [
      "Many hotpot broths are pork-bone based, and mala/drunken bases can contain wine",
      "Pork slices, luncheon meat and some processed balls are common — halal pots swap these out",
      "Dipping sauces and some soup bases may use non-halal additives",
      "Halal steamboat and mala specialists use halal meats and alcohol-free broths",
    ],
    faq: [
      { q: "Is steamboat halal in Singapore?", a: "Mainstream hotpot often uses pork-bone broth and pork slices, but many Muslim-owned and MUIS-certified steamboat and mala restaurants serve fully halal pots. Browse this page for halal steamboat spots with a halal-confidence score and confirm certification on the MUIS HalalSG register." },
      { q: "Is mala hotpot halal?", a: "Mala can be halal when the base is made without wine or pork and the meats are halal. Several halal mala restaurants exist in Singapore — look for a MUIS certificate or Muslim-Owned label, or check the outlet here." },
      { q: "Is the broth base halal?", a: "Check it isn't pork-bone based and that mala or 'drunken' bases don't contain cooking wine. Halal steamboat restaurants use chicken, tom yum or collagen bases made without alcohol." },
      { q: "What should I watch for in steamboat?", a: "Pork-bone broth, pork slices and luncheon meat, wine in mala/drunken bases, and non-halal processed balls. A certified or Muslim-owned steamboat removes the doubt." },
    ] },
  "fine-dining": { intro: "Discover halal fine dining in Singapore — premium halal restaurants for special occasions, from wagyu grills to multi-course tasting menus, all Muslim-friendly with no pork and no alcohol. Browse with halal-confidence scores, reviews and directions.",
    lookFor: [
      "The MUIS Certified badge, or a clear Muslim-Owned label",
      "Halal-certified tasting menus and premium beef (wagyu)",
      "Sauces, reductions and desserts made without wine or spirits",
      "A halal-confidence score, reviews and directions before you book",
    ],
    considerations: [
      "Fine-dining sauces and jus frequently use wine, port or brandy reductions",
      "Desserts may use liqueurs, alcohol-based vanilla or gelatine",
      "Cheese courses can use animal rennet; charcuterie is often pork",
      "A full MUIS certificate is the simplest assurance for a tasting menu",
    ],
    faq: [
      { q: "Is there halal fine dining in Singapore?", a: "Yes — a growing number of MUIS-certified and Muslim-owned fine-dining restaurants serve premium halal tasting menus and wagyu grills without pork or alcohol. Browse this page for halal fine dining with a halal-confidence score and confirm certification on the MUIS HalalSG register." },
      { q: "Can a tasting menu be halal?", a: "It can — halal fine-dining kitchens build tasting menus without wine reductions, liqueur desserts or pork courses. Look for a MUIS certificate or Muslim-Owned label, or check the outlet here." },
      { q: "Is halal wagyu served at fine-dining restaurants?", a: "Several halal fine-dining spots serve halal-certified wagyu and premium cuts. Confirm the restaurant's certification before booking a special occasion." },
      { q: "What should I watch for in fine dining?", a: "Wine/port/brandy in sauces and desserts, liqueurs and alcohol-based vanilla, animal rennet in cheese, and pork charcuterie. A certified or Muslim-owned restaurant removes the doubt." },
    ] },
  "high-tea": { intro: "Find halal high tea in Singapore — Muslim-friendly afternoon-tea spreads, scones, finger sandwiches, pastries and brunch sets without alcohol or pork. Browse halal cafés and hotels with halal-confidence scores and reviews.",
    lookFor: [
      "The MUIS Certified badge covering the whole high-tea spread",
      "Hotel and café afternoon-tea sets certified end-to-end",
      "Savouries with chicken/beef/smoked-salmon instead of ham or pork",
      "A halal-confidence score, reviews and directions before you book",
    ],
    considerations: [
      "Finger sandwiches often use ham; pâté and some savouries can be pork",
      "Cakes and trifles may contain rum, liqueurs, gelatine or alcohol-based vanilla",
      "Scone spreads are usually fine — the watch-out is the savouries and boozy desserts",
      "Confirm the WHOLE tier is certified, not just a halal-friendly note",
    ],
    faq: [
      { q: "Is there halal high tea in Singapore?", a: "Yes — MUIS-certified and Muslim-owned hotels and cafés serve halal afternoon tea with scones, savouries and pastries, no pork or alcohol. Browse this page for halal high tea with a halal-confidence score and confirm certification on the MUIS HalalSG register." },
      { q: "Are hotel high teas halal?", a: "Some hotel high teas are fully halal-certified; many are not. Confirm the specific afternoon-tea set is certified end-to-end (not just a halal-friendly note) before booking." },
      { q: "What's in a halal high tea?", a: "Scones with jam and cream, chicken/beef/salmon finger sandwiches, quiches and tarts, and cakes made without alcohol or non-halal gelatine — at a certified or Muslim-owned venue." },
      { q: "What should I watch for at high tea?", a: "Ham in sandwiches, pork pâté, and rum/liqueurs or gelatine in cakes and trifles. A full MUIS certificate removes the doubt." },
    ] },
  western: { intro: "Discover halal Western food in Singapore — burgers, steaks, pasta, grills and chicken chop from Muslim-friendly kitchens with no pork, no bacon and no alcohol. From casual diners to sit-down grills, compare halal-confidence scores, read reviews and find a halal Western spot near you.",
    lookFor: [
      "The MUIS Certified badge, or a clear Muslim-Owned label",
      "Beef bacon or turkey bacon in place of pork bacon",
      "Grills and pastas made without wine, and desserts without alcohol or gelatine",
      "A halal-confidence score, reviews and directions before you go",
    ],
    considerations: [
      "Bacon, ham, pepperoni and sausages are often pork — check for beef/chicken versions",
      "Wine, beer and liqueurs appear in sauces, marinades, batters and desserts",
      "Cheese may use animal rennet, and some desserts use gelatine — verify when it matters",
      "A MUIS certificate or Muslim-Owned label is the simplest assurance for Western kitchens",
    ],
    faq: [
      { q: "Is Western food halal in Singapore?", a: "Plenty of Western restaurants in Singapore are MUIS-certified or Muslim-owned and serve fully halal burgers, steaks, pasta and grills; mainstream Western spots may not be, because pork and alcohol are common. Use this page to find outlets labelled with a halal-confidence score and confirm certification on the MUIS HalalSG register." },
      { q: "Is there halal steak in Singapore?", a: "Yes — Muslim-friendly steakhouses serve halal ribeye, sirloin and wagyu grilled without wine-based sauces. Browse our halal steak and grill options with reviews and directions." },
      { q: "How do I know a burger is halal?", a: "Look for a MUIS certificate or Muslim-Owned label, halal beef or chicken patties, and beef/turkey bacon rather than pork. Each listing here shows its halal status and confidence score." },
      { q: "What should I watch for in Western food?", a: "Pork (bacon, ham, pepperoni, sausages), alcohol (wine and beer in sauces and desserts), animal rennet in cheese, and gelatine in desserts. Choosing a certified or Muslim-owned kitchen removes the doubt." },
    ] },
  steak: { intro: "Find halal steak in Singapore — halal wagyu, ribeye, sirloin and tenderloin from Muslim-friendly steakhouses with no pork sides and no wine-based sauces. Browse with halal-confidence scores, reviews and directions for your next steak night.",
    lookFor: [
      "The MUIS Certified badge, or a clear Muslim-Owned label",
      "Halal-certified beef (wagyu, ribeye, sirloin) and lamb",
      "Sauces and jus made without red wine, brandy or beer",
      "A halal-confidence score, reviews and directions before you go",
    ],
    considerations: [
      "Steakhouse sauces (red-wine jus, peppercorn/brandy sauce) often contain alcohol",
      "Pork sides — bacon bits, pork sausage, lardons in salads and mash",
      "Non-halal beef/aged beef of unverified slaughter at mainstream steakhouses",
      "A MUIS certificate or Muslim-Owned label is the simplest assurance for steak",
    ],
    faq: [
      { q: "Is there halal steak in Singapore?", a: "Yes — Muslim-owned and MUIS-certified steakhouses serve halal wagyu, ribeye and sirloin with alcohol-free sauces. Browse this page for halal steak spots with a halal-confidence score and confirm certification on the MUIS HalalSG register." },
      { q: "Is halal wagyu available in Singapore?", a: "Several halal steakhouses offer halal-certified wagyu and premium cuts. Look for a MUIS certificate or Muslim-Owned label, or check the outlet's halal status here." },
      { q: "Are steak sauces halal?", a: "Watch for red-wine jus, peppercorn/brandy and some mushroom sauces that use alcohol. Halal steakhouses make these without wine — confirm with the restaurant if unsure." },
      { q: "What should I watch for at a steakhouse?", a: "Alcohol in sauces, pork sides (bacon, lardons, sausage), and beef of unverified slaughter. A certified or Muslim-owned steakhouse removes the doubt." },
    ] },
  bbq: { intro: "Discover halal BBQ and grill in Singapore — Korean BBQ, charcoal grills, smokehouse ribs and satay from Muslim-friendly kitchens with halal meats and no pork or alcohol. Browse with halal-confidence scores, reviews and directions.",
    lookFor: [
      "The MUIS Certified badge, or a clear Muslim-Owned label",
      "Halal beef short rib, chicken and lamb (no pork ribs or bacon)",
      "Marinades and glazes made without wine, beer or mirin",
      "A halal-confidence score, reviews and directions before you go",
    ],
    considerations: [
      "Pork ribs, pork belly and bacon are common at non-halal grills and smokehouses",
      "BBQ marinades, bastes and 'burnt ends' glazes can contain beer, wine or bourbon",
      "Korean BBQ may include pork and soju — choose a halal Korean BBQ outlet",
      "Shared grills in mixed kitchens — a MUIS certificate or Muslim-Owned label is the assurance",
    ],
    faq: [
      { q: "Is there halal BBQ in Singapore?", a: "Yes — Muslim-owned and MUIS-certified BBQ and grill restaurants serve halal short rib, chicken, lamb and satay without pork or alcohol. Browse this page for halal BBQ spots with a halal-confidence score and confirm certification on the MUIS HalalSG register." },
      { q: "Is Korean BBQ halal?", a: "Some Korean BBQ restaurants are halal-certified and grill halal beef, chicken and seafood (no pork belly, no soju marinades). Look for a MUIS certificate or Muslim-Owned label, or check the outlet's halal status here." },
      { q: "Are smokehouse ribs halal?", a: "Halal smokehouses use beef ribs and brisket with alcohol-free rubs and glazes (many mainstream ones use pork ribs and bourbon glazes). Confirm the outlet is certified or Muslim-owned." },
      { q: "What should I watch for in BBQ?", a: "Pork ribs/belly/bacon, and alcohol in marinades and glazes (beer, wine, bourbon). A certified or Muslim-owned grill removes the doubt." },
    ] },
  seafood: { intro: "Find halal seafood in Singapore — chilli crab, black pepper crab, grilled fish, sambal prawns and seafood platters from Muslim-friendly restaurants with no pork and no cooking wine. Compare halal-confidence scores, read reviews and find a halal seafood spot near you.",
    lookFor: [
      "The MUIS Certified badge, or a clear Muslim-Owned label",
      "Chilli and black pepper crab cooked without Chinese cooking wine",
      "Steamed fish and prawns without hua tiao / Shaoxing wine",
      "A halal-confidence score, reviews and directions before you go",
    ],
    considerations: [
      "Seafood itself is halal, but zi-char-style crab and steamed fish often use cooking wine (Shaoxing/hua tiao)",
      "Shared woks and non-halal sauces (oyster/some XO sauces) are the usual watch-outs",
      "Cross-contamination in mixed kitchens that also cook pork",
      "A MUIS certificate or Muslim-Owned label is the simplest assurance for seafood restaurants",
    ],
    faq: [
      { q: "Is seafood halal in Singapore?", a: "Seafood is halal in itself, but the way it's cooked matters — many zi char and seafood restaurants add cooking wine to crab and steamed fish. Muslim-owned and MUIS-certified seafood restaurants cook without wine or pork. Browse this page and confirm certification on the MUIS HalalSG register." },
      { q: "Is chilli crab halal?", a: "Chilli crab can be halal when made without cooking wine and non-halal sauces. Several halal seafood restaurants serve chilli and black pepper crab — look for a MUIS certificate or Muslim-Owned label, or check the outlet here." },
      { q: "Is all seafood halal?", a: "Most scholars consider fish and other sea creatures halal. The halal question with seafood restaurants is usually the cooking wine, sauces and cross-contamination — not the seafood itself." },
      { q: "What should I watch for in seafood restaurants?", a: "Cooking wine (Shaoxing/hua tiao) in crab and steamed fish, non-halal sauces, and shared woks with pork dishes. A certified or Muslim-owned seafood restaurant removes the doubt." },
    ] },
  indian: { intro: "Discover halal Indian food in Singapore — biryani, tandoori, butter chicken, prata and North & South Indian curries from MUIS-certified and Muslim-owned kitchens. Browse with halal-confidence scores, reviews and directions.",
    lookFor: [
      "The MUIS Certified badge, or a clear Muslim-Owned label",
      "Halal mutton, chicken and beef biryani and tandoori",
      "Indian-Muslim (mamak) and North Indian kitchens, widely halal",
      "A halal-confidence score, reviews and directions before you go",
    ],
    considerations: [
      "Meat source — confirm mutton/chicken is halal-slaughtered at non-Muslim-run outlets",
      "Some North Indian restaurants serve alcohol or use it in a few dishes",
      "Vegetarian South Indian food is typically fine, but check ghee/paneer at uncertified spots",
      "Indian-Muslim eateries are widely halal; a MUIS certificate confirms it",
    ],
    faq: [
      { q: "Is Indian food halal in Singapore?", a: "Much of Singapore's Indian food — especially Indian-Muslim (mamak) and North Indian kitchens — is halal, and many are MUIS-certified or Muslim-owned. Some non-Muslim-run restaurants serve alcohol or unverified meat. Browse this page and confirm certification on the MUIS HalalSG register." },
      { q: "Is biryani halal?", a: "Biryani from Indian-Muslim and halal-certified kitchens is halal. At an uncertified restaurant, confirm the mutton/chicken is halal-slaughtered — look for a MUIS certificate or Muslim-Owned label here." },
      { q: "Is prata / roti halal?", a: "Prata from Indian-Muslim outlets is generally halal. The usual watch-out is the curries' meat source at uncertified stalls, not the prata itself." },
      { q: "What should I watch for in Indian food?", a: "Meat slaughter source at non-Muslim-run outlets, alcohol at some North Indian restaurants, and ghee/paneer sources. A certified or Muslim-owned kitchen removes the doubt." },
    ] },
  "nasi-padang": { intro: "Find the best nasi padang in Singapore — rendang, ayam bakar, sambal goreng, gulai and sayur lodeh from heritage Malay and Minang kitchens, MUIS-certified and Muslim-owned. Browse with halal-confidence scores, reviews and directions.",
    lookFor: [
      "The MUIS Certified badge, or a clear Muslim-Owned label",
      "Heritage Malay/Minang stalls (the cuisine is predominantly Muslim-run)",
      "A displayed certificate rather than only a 'no pork, no lard' sign",
      "A halal-confidence score, reviews and directions before you go",
    ],
    considerations: [
      "Nasi padang is a Malay-Indonesian cuisine, so most stalls are pork-free by default",
      "'Usually halal' is not 'confirmed' — verify the individual stall's certification",
      "Food-court concessions can vary — check the specific stall, not just the court",
      "A MUIS certificate or Muslim-Owned label is the simplest confirmation",
    ],
    faq: [
      { q: "Is nasi padang halal in Singapore?", a: "Nasi padang is a Malay-Indonesian cuisine and most stalls in Singapore are Muslim-run and pork-free. To be certain, look for the MUIS certificate or a Muslim-Owned label on the stall, or check it on the Humble Halal directory before you go." },
      { q: "What is nasi padang?", a: "Steamed rice served with a pick-and-mix of Minangkabau-style dishes — rendang, ayam bakar, sambal goreng, sayur lodeh and more — displayed at the counter so you point at what you want." },
      { q: "Where can I find the best nasi padang?", a: "Well-known clusters sit around the Malay-Muslim heartlands and the CBD at lunch. Filter this page for nasi padang and Malay-Indonesian outlets near you and check each one's status." },
      { q: "What should I watch for with nasi padang?", a: "Very little — it's overwhelmingly Muslim-run — but treat 'no pork, no lard' as helpful rather than equivalent to certification, and confirm the specific stall." },
    ] },
  breakfast: { intro: "Find halal breakfast and brunch in Singapore — nasi lemak, mee rebus, big breakfasts, kaya toast and all-day brunch from Muslim-friendly cafés. Start the day with halal-confidence scores, reviews and directions.",
    lookFor: [
      "The MUIS Certified badge, or a clear Muslim-Owned label",
      "Big-breakfast plates with beef bacon / chicken sausage (no pork)",
      "Kaya toast sets and local breakfasts at halal kopitiams",
      "A halal-confidence score, reviews and directions before you go",
    ],
    considerations: [
      "Western big breakfasts often include pork bacon, ham and sausages — look for beef/chicken versions",
      "Some brunch bakes and pastries use lard, gelatine or alcohol-based vanilla",
      "Eggs benedict/hollandaise and pancakes are usually fine — the watch-out is the pork sides",
      "A MUIS certificate or Muslim-Owned label is the simplest assurance",
    ],
    faq: [
      { q: "Where can I find halal breakfast in Singapore?", a: "Muslim-owned and MUIS-certified cafés and kopitiams across Singapore serve halal breakfast and brunch — from nasi lemak and kaya toast to Western big breakfasts. Browse this page for options with a halal-confidence score and confirm certification on the MUIS HalalSG register." },
      { q: "Is a Western big breakfast halal?", a: "It can be — halal cafés serve big breakfasts with beef bacon or chicken sausage instead of pork. Look for a MUIS certificate or Muslim-Owned label, or check the outlet's halal status here." },
      { q: "Is kaya toast halal?", a: "Kaya toast at halal kopitiams is halal. At uncertified coffee shops, the watch-out is usually the wider menu (pork dishes nearby) rather than the toast itself." },
      { q: "What should I watch for at brunch?", a: "Pork bacon/ham/sausage on big breakfasts, and lard/gelatine/alcohol in some bakes. A certified or Muslim-owned café removes the doubt." },
    ] },
  dessert: { intro: "Discover halal desserts in Singapore — cakes, ice cream, kunafa, kueh, chocolate, gelato and cheesecake from Muslim-friendly bakeries and dessert bars. Whether it's a birthday cake or a late-night sweet fix, browse halal dessert spots with halal-confidence scores, reviews and directions.",
    lookFor: [
      "The MUIS Certified badge, or a clear Muslim-Owned label",
      "Halal-certified ice cream, cakes and chocolate brands",
      "Gelatine-free jellies, mousses and marshmallows, or halal-certified gelatine",
      "A halal-confidence score, reviews and ordering details before you buy",
    ],
    considerations: [
      "Gelatine in mousses, cheesecakes, marshmallows and jellies may be pork-derived — look for halal/plant-based",
      "Rum, liqueurs and alcohol-based vanilla appear in cakes, tiramisu and some chocolates",
      "Cheesecake and some dairy desserts may use animal rennet",
      "Emulsifiers (e.g. E471) and colours can be animal-derived — certification is the simplest assurance",
    ],
    faq: [
      { q: "Where can I find halal desserts in Singapore?", a: "MUIS-certified and Muslim-owned bakeries, gelato bars and dessert cafés across Singapore serve halal cakes, ice cream, chocolate and local kueh. Browse this page for halal dessert spots with halal-confidence scores, reviews and directions." },
      { q: "Is ice cream halal?", a: "Many ice creams are halal, but check for alcohol (e.g. rum-raisin), gelatine and animal-derived emulsifiers. Look for halal-certified ice cream brands or Muslim-owned parlours — each listing here shows its halal status." },
      { q: "Is gelatine in desserts halal?", a: "Only if it's from a halal source or plant-based. Gelatine in mousses, cheesecakes, marshmallows and jellies is often pork-derived, so choose halal-certified desserts or gelatine-free options. Our ingredient checker explains gelatine in detail." },
      { q: "What should I watch for in desserts?", a: "Gelatine (often pork), alcohol (rum, liqueurs, vanilla extract), animal rennet in cheesecake, and animal-derived emulsifiers or colours. A MUIS certificate or Muslim-Owned label is the simplest assurance." },
    ] },
  buffet: { intro: "Find the best halal buffet in Singapore — international spreads, BBQ and steamboat buffets, hotel buffets and high-tea buffets that are MUIS-certified or Muslim-friendly. Browse by area with halal-confidence scores, reviews and directions for your next celebration.",
    lookFor: [
      "The MUIS Certified badge covering the whole buffet line",
      "Hotel and restaurant buffets certified end-to-end (not just a halal corner)",
      "1-for-1 and free-flow promotions at halal-certified outlets",
      "A halal-confidence score, reviews and directions before you book",
    ],
    considerations: [
      "At a large buffet, confirm the WHOLE line is certified — not just some stations",
      "Non-halal buffets with a 'halal section' still risk shared utensils and cross-contamination",
      "Dessert and drink stations can hide alcohol (trifle, rum cake) or gelatine",
      "Carving/live stations may use non-halal meat — a full MUIS certificate is the assurance",
    ],
    faq: [
      { q: "What is the best halal buffet in Singapore?", a: "Singapore has many MUIS-certified halal buffets — international, BBQ, steamboat and hotel spreads. Browse this page by area for halal buffets with a halal-confidence score, reviews and directions, and confirm certification on the MUIS HalalSG register." },
      { q: "Are there 1-for-1 halal buffets in Singapore?", a: "Yes — several halal-certified buffet restaurants and hotels run 1-for-1 or free-flow promotions. Check the outlet's current deals and confirm its halal certification before booking." },
      { q: "Is a hotel buffet halal?", a: "Some hotel buffets are fully MUIS-certified; many are not. Confirm the specific buffet line is certified end-to-end (not just a halal corner) on the MUIS HalalSG register." },
      { q: "What should I watch for at a buffet?", a: "Whether the entire line is certified, shared utensils at non-halal buffets, alcohol in desserts, and non-halal carving stations. A full MUIS certificate removes the doubt." },
    ] },
  catering: { intro: "Find halal catering in Singapore — mini buffets, wedding and event catering, corporate spreads and high-tea sets from MUIS-certified and Muslim-owned caterers. Compare options, request quotes and book with confidence.", lookFor: [], considerations: [], faq: [
    { q: "How much does halal catering cost in Singapore?", a: "Halal catering in Singapore typically starts around $12–18 per person for mini buffets and rises for premium wedding or corporate spreads. Request quotes from several Muslim-owned caterers to compare inclusions." },
    { q: "Is the catering MUIS halal-certified?", a: "Many caterers are MUIS-certified; others are Muslim-owned. We label each one with a halal-confidence score — always confirm certification on the official MUIS HalalSG register before booking." },
  ] },
  // Blueprint P1 additions (Keyword Master Plan, HUB1 tab).
  mookata: { intro: "Find halal mookata in Singapore — Thai-style BBQ steamboat where you grill marinated meats over charcoal while soup bubbles around the pan, from fully Muslim-friendly kitchens with halal chicken, beef and seafood. Browse spots by area with halal-confidence scores, reviews and directions for your next group feast.",
    lookFor: [
      "The MUIS Certified badge, or a clear Muslim-Owned label",
      "Halal marinated chicken, beef and seafood platters (no pork)",
      "Soup bases made without pork bones or cooking wine",
      "A halal-confidence score, reviews and directions before you go",
    ],
    considerations: [
      "Pork slices and pork-collagen/bone broth are common at non-halal mookata",
      "Some marinades and dipping sauces use cooking wine or non-halal additives",
      "Processed items (meatballs, luncheon meat) may be pork-based",
      "Halal mookata specialists use halal meats and alcohol-free broths — the simplest assurance",
    ],
    faq: [
      { q: "Is mookata halal in Singapore?", a: "Several Muslim-owned and MUIS-certified mookata restaurants serve fully halal Thai BBQ steamboat with halal meats and pork-free broths, while mainstream mookata often uses pork. Browse this page for halal mookata spots with a halal-confidence score and confirm certification on the MUIS HalalSG register." },
      { q: "What's the difference between mookata and steamboat?", a: "Mookata is Thai-style: a domed grill in the centre for BBQ meats with a moat of soup around it, so you grill and steamboat at once. Both have halal versions — look for a MUIS certificate or Muslim-Owned label." },
      { q: "Is the broth at mookata halal?", a: "Check it isn't pork-bone based and doesn't contain cooking wine. Halal mookata restaurants use chicken or tom-yum bases made without alcohol or pork." },
      { q: "What should I watch for at mookata?", a: "Pork slices, pork-bone broth, cooking wine in marinades, and pork-based processed items. A certified or Muslim-owned mookata removes the doubt." },
    ] },
  ramen: { intro: "Craving halal ramen in Singapore? Discover Muslim-friendly Japanese ramen bars serving rich chicken paitan, beef broth and spicy miso bowls — no pork, no lard, no alcohol. Compare halal-confidence scores, read reviews and find a steaming bowl near you.",
    lookFor: [
      "The MUIS Certified badge, or a clear Muslim-Owned label",
      "Chicken (paitan), beef or miso broth instead of pork tonkotsu",
      "Chicken or beef chashu instead of pork chashu",
      "A halal-confidence score, reviews and directions before you go",
    ],
    considerations: [
      "Classic tonkotsu ramen is a pork-bone broth, and chashu is usually pork belly",
      "Ajitama eggs and broths can be seasoned with mirin, sake or cooking wine",
      "Gyoza and some toppings may be pork — halal ramen bars swap these out",
      "A MUIS certificate or Muslim-Owned label is the simplest assurance",
    ],
    faq: [
      { q: "Is there halal ramen in Singapore?", a: "Yes — Muslim-owned and MUIS-certified ramen bars serve rich chicken (paitan), beef and spicy miso ramen with no pork, no lard and no alcohol. Browse this page for halal ramen with a halal-confidence score and confirm certification on the MUIS HalalSG register." },
      { q: "Is tonkotsu ramen halal?", a: "Traditional tonkotsu is a pork-bone broth, so it isn't halal. Halal ramen bars use chicken (paitan), beef or miso broths instead — look for a MUIS certificate or Muslim-Owned label here." },
      { q: "What is the chashu in halal ramen?", a: "Instead of pork belly, halal ramen uses chicken or beef chashu. Confirm the outlet is certified or Muslim-owned so the broth and toppings are all halal." },
      { q: "What should I watch for in ramen?", a: "Pork tonkotsu broth and pork chashu, plus mirin/sake in the broth or egg marinade and pork gyoza. A certified or Muslim-owned ramen bar removes the doubt." },
    ] },
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
