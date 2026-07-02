/* Humble Halal — editorial blog. Typed posts (no CMS yet) rendered as
   server HTML with BlogPosting + FAQPage schema. Each post leads with an
   answer-first TL;DR (AI-Overview unit) and links into the directory. */

import { bimg, type BlogCategorySlug } from "./blog-categories";

export interface BlogSection {
  h2: string;
  body?: string[];
  bullets?: string[];
  /** Optional in-body editorial figure (breaks wider than the reading column). */
  image?: string;
  imageAlt?: string;
  caption?: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  dek: string;
  /** Answer-first TL;DR — 40–70 words, the featured-snippet / AIO unit. */
  answer: string;
  datePublished: string; // YYYY-MM-DD
  dateModified?: string;
  author: string;
  readMins: number;
  tags: string[];
  /** Primary category — exactly one (see lib/blog-categories.ts). */
  category: BlogCategorySlug;
  /** Curated Unsplash feature image (absolute URL). */
  image: string;
  /** Descriptive alt text for the feature image (a11y + SEO). */
  imageAlt: string;
  /** Optional photo credit, e.g. "Photo: Name / Unsplash". */
  imageCredit?: string;
  sections: BlogSection[];
  faq: { q: string; a: string }[];
  related?: string[];
  /** Editorial extras (flagship pieces): drop-cap opener + one pull-quote. */
  dropcap?: boolean;
  pullQuote?: string;
  pullQuoteBy?: string;
}

const AUTHOR = "The Humble Halal Team";

/* The post literals carry the prose; the feature image + category live in META
   below (slug-keyed) and are merged in, keeping the big array clean. A missing
   META entry throws at module load so no post can ship un-migrated. */
type RawPost = Omit<BlogPost, "category" | "image" | "imageAlt" | "imageCredit">;

const rawPosts: RawPost[] = [
  {
    slug: "what-is-halal-singapore",
    title: "What Is Halal? A Simple Guide for Singapore",
    dek: "Halal, haram, MUIS certification and the halal-confidence score — explained plainly for eating out in Singapore.",
    answer:
      "Halal (Arabic for “permissible”) describes food and businesses that comply with Islamic law. In Singapore, the official authority is MUIS (Majlis Ugama Islam Singapura), which certifies halal eateries and products. A place is only officially halal if it holds a valid MUIS halal certificate — “no pork, no lard” is self-declared and is not the same thing.",
    datePublished: "2026-06-11",
    author: AUTHOR,
    readMins: 8,
    tags: ["Halal basics", "MUIS", "Guides"],
    sections: [
      {
        h2: "What does “halal” actually mean?",
        body: [
          "Halal is an Arabic word meaning “permissible”. For food, it means the ingredients, preparation and handling all follow Islamic dietary law. The opposite of halal is haram (“forbidden”) — most notably pork and its derivatives, alcohol, and meat that wasn’t slaughtered according to Islamic rites.",
          "In day-to-day Singapore, when someone asks “is this halal?” they usually mean two things: does it avoid haram ingredients, and is it officially certified by MUIS?",
        ],
      },
      {
        h2: "Who decides what’s halal in Singapore?",
        body: [
          "The Islamic Religious Council of Singapore — MUIS — is the sole body that issues halal certification here. MUIS audits the whole operation: ingredients, suppliers, storage, preparation and even cleaning. An establishment that passes gets a MUIS halal certificate, which it must display and renew.",
          "You can check any establishment on the official MUIS HalalSG register. If it’s not listed, it isn’t MUIS-certified — regardless of any signage.",
        ],
      },
      {
        h2: "“No pork, no lard” is not the same as halal",
        body: [
          "Plenty of eateries put up a “no pork, no lard” sign. That’s a helpful signal, but it’s self-declared and only covers those two ingredients. It says nothing about alcohol in sauces, non-halal chicken or beef, shared fryers, or cross-contamination.",
          "If certification matters to you, treat “no pork, no lard” and “Muslim-owned” as softer signals and confirm the MUIS certificate for the specific outlet.",
        ],
      },
      {
        h2: "How Humble Halal’s halal-confidence score works",
        body: [
          "Because the real world is more nuanced than a yes/no, every listing on Humble Halal shows a halal-confidence score from 0–100. MUIS-certified places score highest, followed by admin-verified and Muslim-owned, then self-declared “halal-friendly” or “no pork no lard”. It’s a quick way to judge how confident you can be before you go — but the official MUIS register is always the final word.",
        ],
      },
      {
        h2: "Common haram ingredients to watch for",
        body: [
          "Beyond pork, a handful of everyday ingredients can quietly make a dish non-halal. The usual culprits are alcohol used in cooking, gelatine or rennet from non-halal sources, lard and animal shortening, and meat that simply wasn’t slaughtered the Islamic way. This is why “it looks meat-free” or “there’s no pork” isn’t the whole story.",
        ],
        bullets: [
          "Pork and all derivatives — bacon, ham, lard, pork gelatine",
          "Alcohol in cooking — mirin, Shaoxing/cooking wine, rum or liqueur in desserts",
          "Gelatine & rennet — common in jelly, marshmallows, mousse and some cheeses",
          "Non-halal beef or chicken — even at a “no pork” stall",
          "Emulsifiers & enzymes (e.g. E471, L-cysteine) that can be animal-derived",
        ],
      },
      {
        h2: "Halal-certified, Muslim-owned or “halal-friendly”?",
        body: [
          "These three labels get used loosely but mean very different things. MUIS halal-certified is the only official verification — the kitchen, ingredients and supply chain have been audited. Muslim-owned tells you about the owner, not necessarily the certification. “Halal-friendly” or “no pork, no lard” is a self-declared courtesy that nobody has checked.",
          "None of these are wrong to consider — they simply sit at different levels of confidence, which is exactly what the halal-confidence score is built to capture.",
        ],
      },
      {
        h2: "Is seafood or vegetarian food automatically halal?",
        body: [
          "Most seafood is considered halal by the majority of scholars, and plant-based food is halal in itself. But “the ingredient is halal” doesn’t always mean “the dish is halal”. A vegetarian plate can still be cooked with cooking wine, and seafood can share fryers or woks with non-halal items.",
          "If certification matters to you, the safest move is still to check the specific outlet on HalalSG rather than assume from the menu category alone.",
        ],
      },
    ],
    faq: [
      { q: "What does haram mean?", a: "Haram is Arabic for “forbidden” — the opposite of halal. For food, the main haram items are pork and its derivatives, alcohol, and meat not slaughtered according to Islamic rites, along with anything contaminated by them." },
      { q: "Is alcohol in food haram?", a: "Yes. Alcohol is haram, and that includes alcohol used in cooking such as mirin, cooking wine or rum in desserts. A dish can contain no pork yet still be non-halal because of alcohol in the sauce or marinade — MUIS-certified kitchens are audited for this." },
      { q: "Is seafood halal?", a: "Most seafood is considered halal by the majority of scholars. How it is prepared still matters, though — shared fryers, cooking wine or non-halal sides can affect a dish. When in doubt, check the outlet on MUIS HalalSG." },
      { q: "Is “no pork no lard” halal?", a: "No. “No pork, no lard” is self-declared and only means those two ingredients aren’t used. It is not MUIS halal certification, which verifies the whole kitchen, ingredients and supply chain. Always confirm on the MUIS HalalSG register." },
      { q: "How do I know if a restaurant is halal in Singapore?", a: "Look it up on the official MUIS HalalSG register at halal.muis.gov.sg, or check for a valid, current MUIS halal certificate displayed at the outlet. On Humble Halal, the halal-confidence score and badges summarise this at a glance." },
      { q: "Is Muslim-owned the same as halal-certified?", a: "Not necessarily. A Muslim-owned business may not hold a MUIS halal certificate. Muslim-owned is a trust signal; MUIS certification is the official verification." },
    ],
    related: ["how-to-check-muis-halal-certification", "best-halal-restaurants-singapore-2026"],
    dropcap: true,
    pullQuote: "“No pork, no lard” is a helpful signal — but it is self-declared, and it is not the same as MUIS certification.",
    pullQuoteBy: "The Humble Halal Team",
  },
  {
    slug: "how-to-check-muis-halal-certification",
    title: "MUIS Halal Certification Explained: How to Check if a Place Is Really Halal",
    dek: "What MUIS certification covers, how to read a certificate, and how to verify any eatery on the HalalSG register in under a minute.",
    answer:
      "To check if a place is halal in Singapore, search for it on the official MUIS HalalSG register at halal.muis.gov.sg. A valid MUIS halal certificate names the company, the certified premises and an expiry date. If an outlet isn’t on the register — or the certificate has expired — it is not currently MUIS halal-certified.",
    datePublished: "2026-06-11",
    author: AUTHOR,
    readMins: 8,
    tags: ["MUIS", "How-to", "Guides"],
    sections: [
      {
        h2: "What MUIS halal certification covers",
        body: [
          "MUIS certification isn’t just about avoiding pork. It’s a scheme-based audit covering ingredients and suppliers, storage and preparation areas, utensils, staff hygiene practices and documentation. Different schemes apply to eating establishments, food preparation areas, central kitchens, products and more.",
        ],
        bullets: [
          "The certified entity (company name)",
          "The exact certified premises or outlet address",
          "The certification scheme",
          "A validity / expiry date — certificates must be renewed",
        ],
      },
      {
        h2: "How to verify on HalalSG (step by step)",
        body: [
          "The fastest way is the official register. It’s free and authoritative.",
        ],
        bullets: [
          "Go to halal.muis.gov.sg and open the establishments register",
          "Search by the business or outlet name",
          "Check the certificate is current (not expired) and matches the exact outlet you’re visiting",
          "For chains, confirm the specific branch — not every outlet of a brand is certified",
        ],
      },
      {
        h2: "Common gotchas",
        body: [
          "A brand being certified in another country (say, Malaysia) does not mean the Singapore outlets are. Certification is also outlet-specific — a flagship may be certified while a kiosk isn’t. And a lapsed certificate means the place is not currently certified, even if it was before.",
          "When something looks ambiguous, default to caution and verify at the source.",
        ],
      },
      {
        h2: "The MUIS certification schemes (what they cover)",
        body: [
          "MUIS doesn’t use a single one-size certificate — it certifies under different schemes depending on the type of operation. Knowing which scheme applies helps you read a certificate correctly.",
        ],
        bullets: [
          "Eating Establishment — restaurants, cafés and stalls serving on-site",
          "Food Preparation Area — central kitchens and prep facilities",
          "Product — packaged food products and ingredients",
          "Whole Plant / Endorsement — factory-level and supply endorsements",
          "Storage Facility & Temporary Catering — warehousing and event catering",
        ],
      },
      {
        h2: "Red flags a “halal” claim is weak",
        body: [
          "Most disappointments come down to a few recurring patterns. Treat any of these as a prompt to verify before you order.",
        ],
        bullets: [
          "Only a sign or sticker — no certificate, and nothing on HalalSG",
          "An expired certificate still on display",
          "A certificate from another country presented as if it covers Singapore",
          "“The chain is halal” — but this specific branch isn’t listed",
          "Vague social-media claims with no company name to search",
        ],
      },
      {
        h2: "How Humble Halal records certification",
        body: [
          "Humble Halal is a discovery platform, not a certifier. We deep-link to the official MUIS HalalSG listing as the source of truth and record our own verification status and date alongside it, then summarise everything as a 0–100 halal-confidence score. The official register is always the final word — we just make it faster to act on.",
        ],
      },
    ],
    faq: [
      { q: "What is HalalSG?", a: "HalalSG (halal.muis.gov.sg) is MUIS’s official online register of halal-certified establishments and products in Singapore. It’s the authoritative place to confirm whether a specific outlet currently holds MUIS halal certification." },
      { q: "Can I trust a halal certificate from another country?", a: "Not for Singapore outlets. Certification from another body (for example a Malaysian or overseas authority) does not mean the Singapore branch is MUIS-certified. Always verify the local outlet on MUIS HalalSG." },
      { q: "What if a place lost or didn’t renew its certification?", a: "If a certificate has lapsed or been withdrawn, the outlet is not currently MUIS halal-certified — even if it was before and the old signage remains. The HalalSG register reflects the current status." },
      { q: "How do I check MUIS halal certification?", a: "Search the establishment on the official MUIS HalalSG register at halal.muis.gov.sg. A valid certificate shows the company, certified premises and an expiry date. If it’s not listed or has expired, it isn’t currently certified." },
      { q: "Does a MUIS certificate expire?", a: "Yes. MUIS halal certificates are valid for a fixed period and must be renewed. Always check the certificate is current, not just present." },
      { q: "Is every outlet of a halal-certified chain also halal?", a: "No. MUIS certification is outlet-specific. Confirm the exact branch you’re visiting on HalalSG, as some outlets of a brand may not be certified." },
    ],
    related: ["what-is-halal-singapore", "best-halal-restaurants-singapore-2026"],
    dropcap: true,
    pullQuote: "If an outlet isn’t on the HalalSG register — or the certificate has expired — it is not currently MUIS halal-certified.",
    pullQuoteBy: "The Humble Halal Team",
  },
  {
    slug: "best-halal-restaurants-singapore-2026",
    title: "Best Halal Restaurants in Singapore (2026)",
    dek: "From Nasi Padang heritage to halal steak and fine dining — how to find genuinely great, certified halal restaurants across Singapore.",
    answer:
      "The best halal restaurants in Singapore span Malay and Nasi Padang heritage, Indian-Muslim, Middle Eastern, halal Korean and Japanese, and modern Western and fine dining. To eat with confidence, prioritise MUIS-certified eateries, then sort by neighbourhood and the halal-confidence score on Humble Halal to find top-rated spots near you.",
    datePublished: "2026-06-11",
    author: AUTHOR,
    readMins: 9,
    tags: ["Restaurants", "Food guides", "Best of"],
    sections: [
      {
        h2: "How to choose a great halal restaurant",
        body: [
          "“Best” is part taste, part trust. Start with certification: a MUIS-certified kitchen means you can relax and focus on the food. Then weigh the things that make a meal: recent reviews, signature dishes, prayer space or a mosque nearby, and whether it suits your occasion — a quick weekday lunch versus a family feast.",
        ],
        bullets: [
          "Look for the MUIS Certified badge first",
          "Check the halal-confidence score (0–100) at a glance",
          "Read recent reviews and photos from other diners",
          "Filter by your neighbourhood to cut travel time",
        ],
      },
      {
        h2: "Cuisines worth seeking out",
        body: [
          "Singapore’s halal dining scene is genuinely broad. Nasi Padang and Malay heritage kitchens remain the heart of it, but halal Korean BBQ, Japanese, Middle Eastern grills, modern cafés and even halal steak and fine dining have all grown fast.",
        ],
        bullets: [
          "Malay & Nasi Padang — heritage classics",
          "Indian-Muslim — biryani, murtabak, prata",
          "Halal Korean & Japanese — BBQ, sushi, ramen",
          "Western & fine dining — halal steak, brunch, degustation",
        ],
      },
      {
        h2: "Find them near you",
        body: [
          "Rather than a static list that goes stale, use the directory: browse by category and area, open the map to see what’s nearby, and sort by halal-confidence score. New certified places are added over time, so the “best near me” stays current.",
        ],
      },
      {
        h2: "Halal dining by occasion",
        body: [
          "The “best” restaurant depends on why you’re eating out. A quick certified lunch has different priorities to a birthday dinner or a big family gathering.",
        ],
        bullets: [
          "Date night — halal fine dining, steakhouses and degustation menus",
          "Family feasts — Nasi Padang, zi-char-style and large-table Malay spreads",
          "Quick lunch — Indian-Muslim prata, biryani and economy rice",
          "Groups — halal steamboat and Korean BBQ for cook-your-own fun",
          "Catch-ups — halal cafés for brunch, coffee and dessert",
        ],
      },
      {
        h2: "Halal food by area",
        body: [
          "Halal options are spread across the island, but a few neighbourhoods are especially dense. Use these as starting points, then filter by certification and score.",
        ],
        bullets: [
          "Kampong Glam & Arab Street — Middle Eastern grills, cafés and heritage Malay",
          "Geylang Serai & the east (Tampines, Bedok) — Malay heartland classics",
          "Town & Orchard — halal-certified hotel restaurants and mall dining",
          "Jewel & Changi Airport — certified and Muslim-friendly options for travellers",
          "Heartland malls islandwide — reliable certified chains close to home",
        ],
      },
      {
        h2: "Booking, prayer and Ramadan tips",
        body: [
          "A little planning makes halal dining smoother — especially for groups, special occasions and during the fasting month.",
        ],
        bullets: [
          "Reconfirm the exact outlet on MUIS HalalSG before a big booking",
          "Ask whether there’s a prayer space or a mosque/surau nearby",
          "For Ramadan iftar, book early — popular buffets sell out fast",
          "Weigh halal-confidence and recent reviews together, not just the star rating",
        ],
      },
    ],
    faq: [
      { q: "Which area has the most halal food in Singapore?", a: "Kampong Glam/Arab Street and the Malay heartlands around Geylang Serai and the east (Tampines, Bedok) are especially dense with halal options, but certified restaurants are found islandwide. Filter by area and halal-confidence score to find the best near you." },
      { q: "Are there halal restaurants in town or Orchard?", a: "Yes. Several hotel restaurants and mall eateries in the town and Orchard area are MUIS-certified. Filter by area and certification on Humble Halal, and confirm the specific outlet on MUIS HalalSG." },
      { q: "Do halal restaurants in Singapore have prayer rooms?", a: "Some do, and many are near a mosque or surau. Prayer facilities aren’t guaranteed, so it’s worth checking the listing or calling ahead — especially for longer sittings like buffets." },
      { q: "Are all halal restaurants in Singapore MUIS-certified?", a: "No. Some are MUIS-certified, others are Muslim-owned or self-declared halal-friendly. Humble Halal labels each one and shows a halal-confidence score, and you should confirm certification on MUIS HalalSG." },
      { q: "How do I find the best halal restaurants near me?", a: "Use the area filters or the map on Humble Halal to see halal restaurants by neighbourhood, then sort by halal-confidence score or rating to surface the top-rated, certified options nearby." },
      { q: "Is there halal fine dining in Singapore?", a: "Yes. Singapore has a growing number of halal fine-dining and halal steak restaurants, alongside heritage Malay and Indian-Muslim kitchens. Filter by cuisine and certification to find them." },
    ],
    related: ["halal-buffet-guide-singapore", "what-is-halal-singapore"],
    dropcap: true,
    pullQuote: "“Best” is part taste, part trust — start with certification, then let the food decide.",
    pullQuoteBy: "The Humble Halal Team",
  },
  {
    slug: "halal-buffet-guide-singapore",
    title: "The Complete Halal Buffet Guide Singapore",
    dek: "Hotel spreads, halal steamboat and high tea — how to pick a halal buffet in Singapore and what to check before you book.",
    answer:
      "Singapore has a wide range of halal buffets — hotel international spreads, halal steamboat and BBQ, and halal high tea. Many hotel buffets are MUIS-certified, but always confirm the specific restaurant on the MUIS HalalSG register before booking, since certification is outlet-specific and can change.",
    datePublished: "2026-06-11",
    author: AUTHOR,
    readMins: 6,
    tags: ["Buffet", "Food guides", "Best of"],
    sections: [
      {
        h2: "Types of halal buffet in Singapore",
        bullets: [
          "Hotel international buffets — broad spreads, often MUIS-certified restaurants",
          "Halal steamboat & BBQ — cook-your-own, great for groups",
          "Halal high tea — weekend afternoon spreads",
          "Ramadan iftar buffets — seasonal, very popular during the fasting month",
        ],
      },
      {
        h2: "What to check before you book",
        body: [
          "Buffet certification is specific to the restaurant, not the whole hotel. A hotel can have one MUIS-certified restaurant and other outlets that aren’t. Before paying a deposit, confirm the exact restaurant on HalalSG and check the certificate is current.",
        ],
        bullets: [
          "Confirm the specific restaurant on MUIS HalalSG",
          "Check the certificate hasn’t expired",
          "Ask about prayer facilities for longer sittings",
          "For Ramadan, book early — iftar buffets sell out",
        ],
      },
      {
        h2: "Booking tips",
        body: [
          "Weekends and Ramadan command premium pricing and fill fast. Lunch sittings are usually cheaper than dinner, and many buffets offer child and senior rates. If you’re in a big group, halal steamboat and BBQ buffets tend to be better value and more social than a plated meal.",
        ],
      },
    ],
    faq: [
      { q: "Are halal buffets in Singapore MUIS-certified?", a: "Many hotel buffet restaurants are MUIS-certified, but not all. Certification is restaurant-specific, so confirm the exact outlet on the MUIS HalalSG register before booking." },
      { q: "Is there halal steamboat buffet in Singapore?", a: "Yes. There are several halal steamboat and BBQ buffets, many of which are MUIS-certified or Muslim-owned. Check the halal-confidence score and certification before you go." },
      { q: "When are Ramadan iftar buffets available?", a: "Ramadan iftar buffets run during the fasting month and are extremely popular — book well in advance as the best ones sell out quickly." },
    ],
    related: ["best-halal-restaurants-singapore-2026", "how-to-check-muis-halal-certification"],
  },
  {
    slug: "best-halal-cafes-singapore",
    title: "Best Halal Cafés in Singapore",
    dek: "Specialty coffee, brunch and dessert cafés that are MUIS-certified or Muslim-owned — where to go across Singapore.",
    answer:
      "The best halal cafés in Singapore range from specialty-coffee roasters to all-day brunch spots and dessert cafés, many of them Muslim-owned. Look for the MUIS Certified or Muslim-Owned badge, check the halal-confidence score, and filter by neighbourhood on Humble Halal to find one near you.",
    datePublished: "2026-06-10",
    author: AUTHOR,
    readMins: 5,
    tags: ["Cafés", "Food guides", "Best of"],
    sections: [
      {
        h2: "What makes a great halal café",
        body: ["Coffee culture in Singapore is huge, and the halal café scene has kept pace — third-wave espresso, matcha, brunch plates and elaborate desserts. The trust question is the same as anywhere: is it certified, or Muslim-owned and pork-free?"],
        bullets: [
          "MUIS Certified badge for full certification",
          "Muslim-Owned for community-run cafés",
          "The halal-confidence score at a glance",
          "Prayer space nearby for longer sits",
        ],
      },
      {
        h2: "Styles worth seeking out",
        bullets: [
          "Specialty coffee & roasteries",
          "All-day brunch cafés",
          "Dessert & cake cafés",
          "Traditional kopi & kueh corners",
        ],
      },
      {
        h2: "Find one near you",
        body: ["Rather than a fixed list, browse cafés by area on the directory and sort by halal-confidence or rating — new spots are added over time, so your “near me” stays current."],
      },
    ],
    faq: [
      { q: "Are halal cafés in Singapore MUIS-certified?", a: "Some are MUIS-certified; many are Muslim-owned or self-declared pork-free. Humble Halal labels each café and shows a halal-confidence score — confirm certification on MUIS HalalSG." },
      { q: "How do I find a halal café near me?", a: "Use the area filter or map on Humble Halal, then sort by halal-confidence score or rating to find the best certified or Muslim-owned cafés nearby." },
    ],
    related: ["best-halal-restaurants-singapore-2026", "halal-high-tea-singapore"],
  },
  {
    slug: "halal-high-tea-singapore",
    title: "Halal High Tea in Singapore: Where to Go",
    dek: "Afternoon tea spreads that are halal-friendly — hotel lounges and dessert cafés for a weekend treat.",
    answer:
      "Halal high tea in Singapore is offered at several hotel lounges and dessert cafés, with sweet and savoury spreads. Always confirm the specific restaurant or lounge is MUIS-certified on HalalSG before booking, since certification is venue-specific.",
    datePublished: "2026-06-09",
    author: AUTHOR,
    readMins: 4,
    tags: ["High tea", "Food guides"],
    sections: [
      {
        h2: "What to expect",
        body: ["High tea usually means a tiered spread of finger sandwiches, scones, pastries and cakes, often with free-flow tea or coffee. For halal-conscious diners, the key is whether the kitchen producing it is certified."],
      },
      {
        h2: "Before you book",
        bullets: [
          "Confirm the exact venue on MUIS HalalSG",
          "Check whether it's certified or just pork-free",
          "Weekend slots fill fast — reserve ahead",
          "Ask about prayer facilities for a long sitting",
        ],
      },
    ],
    faq: [
      { q: "Is hotel high tea in Singapore halal?", a: "Some hotel high-tea venues are MUIS-certified, but not all. Certification is venue-specific, so confirm the exact restaurant on MUIS HalalSG before booking." },
      { q: "Where can I find halal high tea?", a: "Search “high tea” and filter by halal status on Humble Halal, or browse halal cafés and restaurants that serve afternoon spreads." },
    ],
    related: ["best-halal-cafes-singapore", "halal-buffet-guide-singapore"],
  },
  {
    slug: "halal-steamboat-hotpot-singapore",
    title: "Halal Steamboat & Hotpot in Singapore",
    dek: "Cook-your-own halal steamboat and hotpot spots — great for groups, with certified broths and meats.",
    answer:
      "There are several halal steamboat and hotpot restaurants in Singapore, many MUIS-certified, offering certified broths, meats and seafood. They're ideal for groups. Check the halal-confidence score and confirm the outlet on MUIS HalalSG before you go.",
    datePublished: "2026-06-08",
    author: AUTHOR,
    readMins: 5,
    tags: ["Steamboat", "Hotpot", "Food guides"],
    sections: [
      {
        h2: "Why steamboat is great for groups",
        body: ["Steamboat (hotpot) is communal by design — a shared simmering broth, plates of raw meat, seafood, vegetables and noodles you cook at the table. For halal diners, the appeal is a fully certified spread with no cross-contamination worries."],
      },
      {
        h2: "What to look for",
        bullets: [
          "MUIS-certified broths and meats",
          "Buffet vs à la carte pricing",
          "Soup bases (tom yum, herbal, mala) — check they're halal",
          "Prayer space for longer meals",
        ],
      },
    ],
    faq: [
      { q: "Is there halal hotpot in Singapore?", a: "Yes — there are several halal steamboat and hotpot restaurants, many MUIS-certified. Check the halal-confidence score and confirm the outlet on MUIS HalalSG." },
      { q: "Is mala hotpot halal?", a: "Some mala and hotpot outlets are MUIS-certified and some are not. Always confirm the specific outlet on HalalSG, as mala broths and ingredients vary." },
    ],
    related: ["halal-buffet-guide-singapore", "best-halal-restaurants-singapore-2026"],
  },
  {
    slug: "halal-sushi-japanese-singapore",
    title: "Halal Sushi & Japanese Food in Singapore",
    dek: "Where to eat halal sushi, ramen and Japanese in Singapore — certified and Muslim-friendly options.",
    answer:
      "Halal sushi and Japanese food in Singapore is served at a growing number of MUIS-certified and Muslim-owned restaurants — sushi, ramen, donburi and teppanyaki without pork, alcohol-based mirin or non-halal meat. Confirm the outlet on MUIS HalalSG before dining.",
    datePublished: "2026-06-07",
    author: AUTHOR,
    readMins: 5,
    tags: ["Japanese", "Sushi", "Food guides"],
    sections: [
      {
        h2: "The halal Japanese challenge",
        body: ["Authentic Japanese cooking often uses mirin, sake and non-halal meat, so certification matters more than usual. Halal Japanese restaurants substitute these with halal alternatives — which is why a MUIS certificate is reassuring."],
      },
      {
        h2: "Dishes to look for",
        bullets: [
          "Sushi & sashimi (halal-sourced)",
          "Ramen with chicken or beef broth",
          "Donburi rice bowls",
          "Teppanyaki & yakiniku",
        ],
      },
    ],
    faq: [
      { q: "Is sushi halal in Singapore?", a: "Sushi is halal when the restaurant is MUIS-certified and avoids alcohol-based seasonings and non-halal ingredients. Several halal sushi restaurants exist in Singapore — confirm on MUIS HalalSG." },
      { q: "Is Japanese food halal?", a: "Japanese food can be halal when prepared without pork, alcohol (mirin/sake) and non-halal meat. Look for MUIS-certified Japanese restaurants on Humble Halal." },
    ],
    related: ["halal-korean-food-singapore", "best-halal-restaurants-singapore-2026"],
  },
  {
    slug: "halal-korean-food-singapore",
    title: "Halal Korean Food in Singapore",
    dek: "Halal Korean BBQ, fried chicken and bibimbap — certified and Muslim-friendly Korean spots in Singapore.",
    answer:
      "Halal Korean food in Singapore includes Korean BBQ, fried chicken, bibimbap and tteokbokki at MUIS-certified and Muslim-owned restaurants. These use halal meat and avoid alcohol-based sauces. Confirm the specific outlet on MUIS HalalSG before dining.",
    datePublished: "2026-06-06",
    author: AUTHOR,
    readMins: 4,
    tags: ["Korean", "Food guides"],
    sections: [
      {
        h2: "Korean food, the halal way",
        body: ["The Korean wave brought K-BBQ, fried chicken and stews to Singapore — and halal versions have followed. The key swaps are halal meat and sauces without rice wine (mirin/soju)."],
      },
      {
        h2: "What to order",
        bullets: ["Korean BBQ (beef, chicken)", "Korean fried chicken", "Bibimbap & stews", "Tteokbokki & street snacks"],
      },
    ],
    faq: [
      { q: "Is Korean BBQ halal in Singapore?", a: "Some Korean BBQ restaurants in Singapore are halal-certified or Muslim-owned, using halal meat and no alcohol. Confirm the specific outlet on MUIS HalalSG before dining." },
      { q: "Is Korean fried chicken halal?", a: "Halal Korean fried chicken is available at certified and Muslim-owned outlets. Check the halal-confidence score and certification on Humble Halal." },
    ],
    related: ["halal-sushi-japanese-singapore", "best-halal-restaurants-singapore-2026"],
  },
  {
    slug: "halal-fine-dining-singapore",
    title: "Halal Fine Dining in Singapore",
    dek: "Special-occasion halal restaurants — degustation, halal steak and elevated dining in Singapore.",
    answer:
      "Halal fine dining in Singapore has grown to include degustation menus, halal steakhouses and elevated modern restaurants that are MUIS-certified or Muslim-owned. They're ideal for celebrations. Confirm certification on MUIS HalalSG and book ahead.",
    datePublished: "2026-06-05",
    author: AUTHOR,
    readMins: 5,
    tags: ["Fine dining", "Food guides"],
    sections: [
      {
        h2: "Halal, elevated",
        body: ["Fine dining used to be a gap for halal diners in Singapore. Not anymore — there are now tasting menus, premium steak and modern restaurants serving celebration-worthy meals, fully halal."],
      },
      {
        h2: "Planning a special meal",
        bullets: ["Confirm the venue on MUIS HalalSG", "Book well ahead for weekends", "Check dress code and set-menu options", "Ask about prayer facilities"],
      },
    ],
    faq: [
      { q: "Is there halal fine dining in Singapore?", a: "Yes — there is a growing number of halal fine-dining restaurants, including degustation and halal steakhouses, that are MUIS-certified or Muslim-owned. Confirm on MUIS HalalSG." },
      { q: "Where can I celebrate with a halal meal?", a: "Filter for fine-dining and certified options on Humble Halal, and sort by rating to find a special-occasion halal restaurant near you." },
    ],
    related: ["halal-steak-singapore", "best-halal-restaurants-singapore-2026"],
  },
  {
    slug: "halal-steak-singapore",
    title: "Where to Find Halal Steak in Singapore",
    dek: "Halal steakhouses and grills in Singapore — wagyu, ribeye and Western grills done the halal way.",
    answer:
      "Halal steak in Singapore is served at MUIS-certified and Muslim-owned steakhouses and Western grills, including wagyu and ribeye options. Because steak places often serve pork and alcohol, always confirm the outlet is certified on MUIS HalalSG.",
    datePublished: "2026-06-04",
    author: AUTHOR,
    readMins: 4,
    tags: ["Steak", "Western", "Food guides"],
    sections: [
      {
        h2: "Halal steak, explained",
        body: ["A great steak comes down to halal-certified beef and a kitchen free of pork and alcohol. Halal steakhouses in Singapore offer everything from affordable hotplate sets to premium wagyu."],
      },
      {
        h2: "What to check",
        bullets: ["MUIS-certified beef", "No pork or bacon on shared grills", "Sauces without alcohol/wine", "Price tier ($–$$$)"],
      },
    ],
    faq: [
      { q: "Is there halal steak in Singapore?", a: "Yes — several halal steakhouses and Western grills serve certified beef, including wagyu. Confirm the outlet is MUIS-certified on HalalSG before dining." },
      { q: "Is wagyu halal?", a: "Wagyu is halal when the beef is halal-slaughtered and the restaurant is certified. Look for MUIS-certified halal steakhouses on Humble Halal." },
    ],
    related: ["halal-fine-dining-singapore", "best-halal-restaurants-singapore-2026"],
  },
  {
    slug: "halal-cakes-bakeries-singapore",
    title: "Halal Cakes & Bakeries in Singapore",
    dek: "Halal birthday cakes, artisanal bakes and bread — certified and Muslim-owned bakeries in Singapore.",
    answer:
      "Halal cakes and bakeries in Singapore include MUIS-certified and Muslim-owned shops for birthday cakes, pastries and bread made without alcohol, lard or non-halal gelatine. For custom cakes, order ahead and confirm the bakery's halal status on MUIS HalalSG.",
    datePublished: "2026-06-03",
    author: AUTHOR,
    readMins: 4,
    tags: ["Bakery", "Cakes", "Food guides"],
    sections: [
      {
        h2: "Why halal status matters for bakes",
        body: ["Cakes and pastries can contain alcohol (in vanilla extract or soaking syrups), lard, or animal gelatine. Halal bakeries substitute these — so certification gives peace of mind, especially for celebrations."],
      },
      {
        h2: "Ordering a halal cake",
        bullets: ["Confirm the bakery on MUIS HalalSG", "Order custom cakes 3–7 days ahead", "Check for nut/allergen info", "Ask about delivery"],
      },
    ],
    faq: [
      { q: "Where can I order a halal birthday cake in Singapore?", a: "Browse halal bakeries on Humble Halal, filter by certified or Muslim-owned, and order custom cakes ahead. Confirm the bakery's status on MUIS HalalSG." },
      { q: "Are bakery cakes halal?", a: "Not all — some contain alcohol, lard or non-halal gelatine. Choose MUIS-certified or clearly Muslim-owned halal bakeries and verify on HalalSG." },
    ],
    related: ["best-halal-cafes-singapore", "how-to-check-muis-halal-certification"],
  },
  {
    slug: "best-halal-breakfast-singapore",
    title: "Best Halal Breakfast Spots in Singapore",
    dek: "From nasi lemak and roti prata to halal brunch — where to start your day across Singapore.",
    answer:
      "The best halal breakfast in Singapore runs from traditional nasi lemak, roti prata and mee rebus to modern café brunch. Most halal breakfast spots are Muslim-owned or MUIS-certified — check the halal-confidence score and open hours on Humble Halal to find one open near you.",
    datePublished: "2026-06-02",
    author: AUTHOR,
    readMins: 4,
    tags: ["Breakfast", "Food guides"],
    sections: [
      { h2: "Traditional vs modern", body: ["Singapore breakfast is a spectrum — heritage hawker plates like nasi lemak, lontong and prata at one end, and all-day café brunch at the other. Both have plenty of halal options."], bullets: ["Nasi lemak & nasi padang", "Roti prata & thosai", "Mee rebus, lontong, mee soto", "Café brunch & big breakfasts"] },
      { h2: "Find one open now", body: ["Use the “Open now” filter and your neighbourhood on Humble Halal — breakfast spots open early, so opening hours matter. Sort by halal-confidence or rating to pick the best."] },
    ],
    faq: [
      { q: "What is a typical halal breakfast in Singapore?", a: "Nasi lemak, roti prata, mee rebus, lontong and kaya toast with kopi are popular halal breakfasts, alongside modern café brunch. Many spots are Muslim-owned or MUIS-certified." },
      { q: "How do I find halal breakfast open near me?", a: "Use the “Open now” filter and area search on Humble Halal, then sort by halal-confidence score or rating." },
    ],
    related: ["best-halal-restaurants-singapore-2026", "best-halal-cafes-singapore"],
  },
  {
    slug: "halal-food-jewel-changi-airport",
    title: "Halal Food at Jewel Changi Airport",
    dek: "Where to find halal food at Jewel Changi Airport — certified and Muslim-friendly options under the Rain Vortex.",
    answer:
      "Jewel Changi Airport has a range of halal food options, including MUIS-certified outlets and Muslim-friendly chains across its dining floors. Look for the MUIS certificate at each outlet, or check the halal-confidence score on Humble Halal before you go.",
    datePublished: "2026-06-01",
    author: AUTHOR,
    readMins: 4,
    tags: ["Malls", "Jewel", "Food guides"],
    sections: [
      { h2: "Dining at Jewel", body: ["Jewel draws huge crowds for the Rain Vortex and gardens — and its food halls and restaurants include several halal choices, from local favourites to international chains."] },
      { h2: "How to be sure", bullets: ["Check for the MUIS certificate at the specific outlet", "Confirm chains outlet-by-outlet on HalalSG", "Pork-free is not the same as certified", "Use the directory to plan before you arrive"] },
    ],
    faq: [
      { q: "Is there halal food at Jewel Changi Airport?", a: "Yes — Jewel has several halal and Muslim-friendly outlets. Look for the MUIS certificate at each outlet, as certification is outlet-specific, and confirm on MUIS HalalSG." },
      { q: "Which outlets at Jewel are halal-certified?", a: "Certification is outlet-specific and can change. Check the displayed MUIS certificate at each outlet or search the outlet on MUIS HalalSG." },
    ],
    related: ["halal-food-bugis-arab-street", "best-halal-restaurants-singapore-2026"],
  },
  {
    slug: "is-it-halal-how-to-tell-singapore",
    title: "Is It Halal? How to Tell in Singapore (Gelatin, Kombucha & More)",
    dek: "A practical guide to checking if a food, ingredient or brand is halal in Singapore — gelatin, kombucha, alcohol in cooking, and more.",
    answer:
      "To tell if something is halal in Singapore, check whether it holds MUIS certification on the HalalSG register, and watch for non-halal ingredients like pork-derived gelatine, alcohol used in cooking, and non-halal meat. When in doubt, treat it as not certified and verify on MUIS HalalSG.",
    datePublished: "2026-05-31",
    author: AUTHOR,
    readMins: 6,
    tags: ["Halal basics", "How-to", "Guides"],
    sections: [
      { h2: "Start with certification", body: ["The fastest, most reliable check is the MUIS HalalSG register. If a food product or eatery is certified, it's listed. If it isn't listed, it isn't MUIS-certified — regardless of any “no pork” signage."] },
      { h2: "Tricky ingredients", bullets: ["Gelatine — often pork-derived; halal versions use beef or fish gelatine", "Alcohol in cooking — mirin, wine and rum can make a dish non-halal even without pork", "Emulsifiers & enzymes — can be animal-derived; certification covers these", "Kombucha & fermented drinks — trace alcohol levels matter; check certification"] },
      { h2: "Is [brand] halal?", body: ["For specific brands, we maintain an Is-it-halal checker that cites the MUIS HalalSG status of popular Singapore food brands. Use it as a starting point, then confirm on the official register."] },
    ],
    faq: [
      { q: "Is gelatin halal?", a: "Gelatine is often pork-derived and therefore not halal, but halal versions made from beef or fish gelatine exist. Check the product's certification or ingredient source." },
      { q: "Is kombucha halal?", a: "Kombucha contains trace alcohol from fermentation; views differ and some products are certified halal while others are not. Check the specific product and certification." },
      { q: "How do I know if a brand is halal?", a: "Check the brand on the MUIS HalalSG register, or use Humble Halal's “Is it halal?” brand checker, which cites each brand's certification status. Always confirm on HalalSG." },
    ],
    related: ["what-is-halal-singapore", "how-to-check-muis-halal-certification"],
    dropcap: true,
    pullQuote: "When something looks ambiguous, treat it as not certified — and verify at the source.",
    pullQuoteBy: "The Humble Halal Team",
  },
  {
    slug: "halal-food-bugis-arab-street",
    title: "Halal Food at Bugis & Arab Street",
    dek: "The halal food heartland — Bugis, Kampong Glam and Arab Street eats, from Middle Eastern grills to local favourites.",
    answer:
      "Bugis, Kampong Glam and Arab Street are among Singapore's best areas for halal food — Middle Eastern grills, Malay heritage kitchens, Turkish, Indian-Muslim and modern cafés, many MUIS-certified or Muslim-owned. Browse the area on Humble Halal and sort by halal-confidence to plan.",
    datePublished: "2026-05-30",
    author: AUTHOR,
    readMins: 5,
    tags: ["Bugis", "Areas", "Food guides"],
    sections: [
      { h2: "A halal food heartland", body: ["Around Kampong Glam, the Sultan Mosque and Arab Street, halal food is everywhere — this is one of the easiest neighbourhoods in Singapore to eat well as a Muslim."] },
      { h2: "What to eat", bullets: ["Middle Eastern grills & mezze", "Turkish kebabs & desserts", "Malay heritage & nasi padang", "Modern halal cafés & dessert spots"] },
    ],
    faq: [
      { q: "Is Arab Street good for halal food?", a: "Yes — Arab Street and Kampong Glam are among Singapore's best areas for halal food, with many Middle Eastern, Turkish, Malay and Muslim-owned options. Confirm certification on MUIS HalalSG." },
      { q: "Where is halal food in Bugis?", a: "Bugis and nearby Kampong Glam / Arab Street have plenty of halal eateries. Browse the area on Humble Halal and sort by halal-confidence score or rating." },
    ],
    related: ["halal-food-jewel-changi-airport", "best-halal-restaurants-singapore-2026"],
  },
  {
    slug: "halal-catering-singapore-guide",
    title: "Halal Catering in Singapore: Costs, Menus & Top Caterers",
    dek: "How to choose a halal caterer for weddings, corporate events and gatherings — what to budget and what to check.",
    answer:
      "Halal catering in Singapore covers buffets, bento sets, live stations and full wedding spreads, from MUIS-certified caterers. Costs vary by menu, headcount and service style. Always confirm the caterer's MUIS certification on HalalSG and book early for peak dates.",
    datePublished: "2026-05-29",
    author: AUTHOR,
    readMins: 6,
    tags: ["Catering", "Events", "Guides"],
    sections: [
      { h2: "Types of halal catering", bullets: ["Buffet & live stations", "Bento / packed meals", "Mini buffet for small gatherings", "Full wedding & event catering"] },
      { h2: "What to budget for", body: ["Pricing depends on menu tier, headcount, delivery, setup and service staff. Get itemised quotes and confirm minimum orders. For weddings and Hari Raya, book months ahead."] },
      { h2: "What to check", bullets: ["MUIS halal certification (on HalalSG)", "Tasting sessions", "Delivery, setup and clearing", "Halal-confidence score & reviews on Humble Halal"] },
    ],
    faq: [
      { q: "How much does halal catering cost in Singapore?", a: "It varies widely by menu, headcount and service style — from a few dollars per head for packed meals to premium per-head pricing for live-station wedding buffets. Get itemised quotes." },
      { q: "How do I find a halal caterer?", a: "Browse halal caterers on Humble Halal, request quotes, and confirm the caterer's MUIS certification on HalalSG. Book early for peak dates like Hari Raya and wedding season." },
    ],
    related: ["halal-buffet-guide-singapore", "best-halal-restaurants-singapore-2026"],
  },
  {
    slug: "ramadan-singapore-2026-guide",
    title: "Ramadan in Singapore 2026: Bazaars, Iftar Buffets & Suhoor",
    dek: "Your guide to Ramadan in Singapore — bazaars, iftar buffets, suhoor spots and breaking fast with the community.",
    answer:
      "During Ramadan in Singapore, the Geylang Serai and other bazaars return with food and shopping, hotels and restaurants offer iftar buffets, and many eateries open late for suhoor. Book iftar buffets early — they sell out — and use Humble Halal's “open now” filter for late-night suhoor.",
    datePublished: "2026-05-28",
    author: AUTHOR,
    readMins: 6,
    tags: ["Ramadan", "Seasonal", "Guides"],
    sections: [
      { h2: "The bazaars", body: ["Ramadan bazaars — most famously at Geylang Serai — fill with food stalls, snacks, drinks and festive shopping in the lead-up to Hari Raya. They're a highlight of the season."] },
      { h2: "Iftar buffets", body: ["Many hotels and restaurants run special iftar (breaking-fast) buffets through the month. These are popular and sell out — book early, and confirm the venue is MUIS-certified."] },
      { h2: "Suhoor & open-late", bullets: ["Use the “Open now” filter late at night", "Look for 24-hour and open-late eateries", "Plan around prayer times", "Check certification before large group bookings"] },
    ],
    faq: [
      { q: "When is the Geylang Serai Ramadan bazaar?", a: "The Geylang Serai bazaar runs through the month of Ramadan each year, in the lead-up to Hari Raya Aidilfitri. Check current-year dates closer to the season." },
      { q: "Where can I find suhoor in Singapore?", a: "Use the “Open now” filter on Humble Halal late at night to find open halal eateries, and look for 24-hour and open-late spots for suhoor." },
    ],
    related: ["halal-buffet-guide-singapore", "best-halal-restaurants-singapore-2026"],
  },
  {
    slug: "halal-dim-sum-singapore",
    title: "Halal Dim Sum in Singapore",
    dek: "Halal dim sum — siew mai, har gow, char siew bao and more, done the halal way in Singapore.",
    answer:
      "Halal dim sum in Singapore is served at MUIS-certified and Muslim-owned restaurants, recreating siew mai, har gow, bao and carrot cake with halal ingredients and no pork. Confirm the outlet on MUIS HalalSG before dining.",
    datePublished: "2026-05-27",
    author: AUTHOR,
    readMins: 4,
    tags: ["Dim sum", "Chinese", "Food guides"],
    sections: [
      { h2: "Dim sum without pork", body: ["Traditional dim sum leans heavily on pork, so halal dim sum restaurants rework the classics with chicken, beef, prawn and vegetable fillings — fully halal, just as moreish."] },
      { h2: "What to order", bullets: ["Chicken/prawn siew mai", "Har gow (prawn dumplings)", "Chicken char siew bao", "Carrot cake & rice rolls"] },
    ],
    faq: [
      { q: "Is there halal dim sum in Singapore?", a: "Yes — several halal dim sum restaurants serve pork-free siew mai, har gow and bao using halal ingredients. Confirm the outlet is MUIS-certified on HalalSG." },
      { q: "Is dim sum halal?", a: "Traditional dim sum often contains pork, so it is not halal unless the restaurant is certified halal and uses halal ingredients. Look for MUIS-certified halal dim sum on Humble Halal." },
    ],
    related: ["halal-steamboat-hotpot-singapore", "best-halal-restaurants-singapore-2026"],
  },
  {
    slug: "muslim-owned-businesses-singapore",
    title: "Muslim-Owned Beauty, Fashion & Services to Support",
    dek: "Beyond food — Muslim-owned beauty salons, modest fashion, home services and more across Singapore.",
    answer:
      "Singapore has a thriving community of Muslim-owned businesses beyond food — halal-friendly beauty salons, modest fashion labels, home services, automotive and professional services. Browse them by category on Humble Halal and look for the Muslim-Owned label.",
    datePublished: "2026-05-26",
    author: AUTHOR,
    readMins: 5,
    tags: ["Muslim-owned", "Community", "Guides"],
    sections: [
      { h2: "Supporting the community", body: ["Choosing Muslim-owned businesses keeps money circulating in the community and supports entrepreneurs. For non-food businesses, MUIS halal certification doesn't apply — the trust signal is Muslim ownership and how the service is run."] },
      { h2: "Categories to explore", bullets: ["Muslimah beauty & hair salons", "Modest fashion & abaya labels", "Home services (renovation, cleaning, aircon)", "Automotive, professional & education services"] },
      { h2: "How we label them", body: ["Non-food businesses on Humble Halal carry a Muslim-Owned or Muslim-Friendly label rather than a MUIS certificate, since certification covers food. The listing tells you how the business describes itself."] },
    ],
    faq: [
      { q: "Do non-food businesses need MUIS halal certification?", a: "No — MUIS halal certification applies to food and beverage. Non-food businesses like salons, fashion and services are listed as Muslim-owned or Muslim-friendly instead." },
      { q: "How do I find Muslim-owned businesses in Singapore?", a: "Browse by category on Humble Halal and filter for Muslim-owned to find beauty, fashion, home services and more run by the community." },
    ],
    related: ["what-is-halal-singapore", "best-halal-restaurants-singapore-2026"],
  },
];

/* ---- Feature image + category, keyed by slug ----
   Unsplash IDs are confirmed-loading (verified over HTTP). */
interface BlogMeta {
  category: BlogCategorySlug;
  image: string;
  imageAlt: string;
  imageCredit?: string;
}

const META: Record<string, BlogMeta> = {
  "what-is-halal-singapore": { category: "halal-basics", image: bimg("1542816417-0983c9c9ad53"), imageAlt: "A mosque in Singapore — understanding what halal means" },
  "how-to-check-muis-halal-certification": { category: "halal-basics", image: bimg("1555992336-fb0d29498b13"), imageAlt: "A Singapore food court where you can check halal certification" },
  "is-it-halal-how-to-tell-singapore": { category: "halal-basics", image: bimg("1466637574441-749b8f19452f"), imageAlt: "Reading ingredients to tell whether food is halal" },
  "best-halal-restaurants-singapore-2026": { category: "restaurants-cafes", image: bimg("1551218808-94e220e084d2"), imageAlt: "A spread of dishes at a halal restaurant in Singapore" },
  "halal-buffet-guide-singapore": { category: "restaurants-cafes", image: bimg("1600628421055-4d30de868b8f"), imageAlt: "A halal buffet line with multiple dishes" },
  "best-halal-cafes-singapore": { category: "restaurants-cafes", image: bimg("1517248135467-4c7edcad34c4"), imageAlt: "Latte art at a halal-friendly café in Singapore" },
  "halal-high-tea-singapore": { category: "restaurants-cafes", image: bimg("1525351484163-7529414344d8"), imageAlt: "A tiered afternoon high-tea stand with pastries" },
  "best-halal-breakfast-singapore": { category: "restaurants-cafes", image: bimg("1533089860892-a7c6f0a88666"), imageAlt: "A traditional halal breakfast plate in Singapore" },
  "halal-steamboat-hotpot-singapore": { category: "cuisines", image: bimg("1519817650390-64a93db51149"), imageAlt: "A bubbling steamboat hotpot with fresh ingredients" },
  "halal-sushi-japanese-singapore": { category: "cuisines", image: bimg("1553621042-f6e147245754"), imageAlt: "A platter of sushi and sashimi" },
  "halal-korean-food-singapore": { category: "cuisines", image: bimg("1577219491135-ce391730fb2c"), imageAlt: "A Korean BBQ grill with side dishes" },
  "halal-fine-dining-singapore": { category: "cuisines", image: bimg("1559847844-5315695dadae"), imageAlt: "A plated fine-dining course" },
  "halal-steak-singapore": { category: "cuisines", image: bimg("1546964124-0cce460f38ef"), imageAlt: "A grilled steak with sear marks" },
  "halal-cakes-bakeries-singapore": { category: "cuisines", image: bimg("1578985545062-69928b1d9587"), imageAlt: "Cakes and pastries at a bakery" },
  "halal-dim-sum-singapore": { category: "cuisines", image: bimg("1496116218417-1a781b1c416c"), imageAlt: "Dim sum dumplings in a steamer" },
  "halal-food-jewel-changi-airport": { category: "areas-malls", image: bimg("1570126618953-d437176e8c79"), imageAlt: "The interior of Changi Airport in Singapore" },
  "halal-food-bugis-arab-street": { category: "areas-malls", image: bimg("1565967511849-76a60a516170"), imageAlt: "A street in the Bugis and Arab Street area of Singapore" },
  "halal-catering-singapore-guide": { category: "seasonal-events", image: bimg("1555244162-803834f70033"), imageAlt: "A catering buffet line at an event" },
  "ramadan-singapore-2026-guide": { category: "seasonal-events", image: bimg("1543007630-9710e4a00a20"), imageAlt: "Dates and a meal for breaking fast during Ramadan" },
  "muslim-owned-businesses-singapore": { category: "community-business", image: bimg("1604719312566-8912e9227c6a"), imageAlt: "A small Muslim-owned business storefront" },
};

export const posts: BlogPost[] = rawPosts.map((p) => {
  const m = META[p.slug];
  if (!m) throw new Error(`blog: missing category/image meta for "${p.slug}" — add it to META in lib/blog.ts`);
  return { ...p, ...m };
});

const BY_SLUG = new Map(posts.map((p) => [p.slug, p]));

export function allPosts(): BlogPost[] {
  return [...posts].sort((a, b) => b.datePublished.localeCompare(a.datePublished));
}

export function getPost(slug: string): BlogPost | undefined {
  return BY_SLUG.get(slug);
}

export function relatedPosts(post: BlogPost, limit = 3): BlogPost[] {
  const picked = (post.related || []).map((s) => BY_SLUG.get(s)).filter(Boolean) as BlogPost[];
  if (picked.length >= limit) return picked.slice(0, limit);
  const rest = posts.filter((p) => p.slug !== post.slug && !picked.includes(p));
  return [...picked, ...rest].slice(0, limit);
}

/** Plain-text word count for reading time / schema. */
export function postWordCount(p: BlogPost): number {
  const parts = [p.answer, p.dek, ...p.sections.flatMap((s) => [s.h2, ...(s.body || []), ...(s.bullets || [])]), ...p.faq.flatMap((f) => [f.q, f.a])];
  return parts.join(" ").split(/\s+/).filter(Boolean).length;
}

/** Posts in a category, newest-first. */
export function postsByCategory(slug: BlogCategorySlug): BlogPost[] {
  return allPosts().filter((p) => p.category === slug);
}

/** The newest post — featured/hero on the index. */
export function featuredPost(): BlogPost {
  return allPosts()[0];
}

/** How many posts a category holds (for chip badges). */
export function categoryPostCount(slug: BlogCategorySlug): number {
  return posts.reduce((n, p) => (p.category === slug ? n + 1 : n), 0);
}
