/* Humble Halal — editorial blog. Typed posts (no CMS yet) rendered as
   server HTML with BlogPosting + FAQPage schema. Each post leads with an
   answer-first TL;DR (AI-Overview unit) and links into the directory. */

import { bimg, type BlogCategorySlug } from "./blog-categories";

export interface BlogSection {
  h2: string;
  body?: string[];
  bullets?: string[];
  /** Curated first-party and directory links shown as compact action chips. */
  links?: { label: string; href: string }[];
  /** Optional consent-gated TikTok video for a place or story section. */
  socialUrl?: string;
  socialLabel?: string;
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
  /** Optional link to a CMS Authors entry (lib/blog-authors) for byline + schema. */
  authorId?: string;
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
  /** Lead vertical (lib/lead-verticals id, e.g. "catering") — when set, the
      post renders the subtle inline lead-capture teaser (flag-gated). */
  leadVertical?: string;
  /** Optional per-post SEO overrides (CMS). Empty → sensible defaults:
      metaTitle→title, metaDescription→dek, canonical→self, index unless noindex,
      socialImage→hero image. */
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  noindex?: boolean;
  socialImage?: string;
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
    dateModified: "2026-07-06",
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
    dateModified: "2026-07-06",
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
      { q: "Can I check halal certification online for free?", a: "Yes. The MUIS HalalSG register at halal.muis.gov.sg is free and open to the public — search any establishment or product to see its current certification. You don’t need an account, and it is the authoritative source, so there is no need to pay for a third-party check." },
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
    dateModified: "2026-07-06",
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
      "Singapore has a wide range of halal buffets — hotel international spreads, halal steamboat and BBQ, seafood lines and halal high tea. Many hotel buffets are MUIS-certified, but always confirm the specific restaurant on the MUIS HalalSG register before booking, since certification is outlet-specific and can change.",
    datePublished: "2026-06-11",
    dateModified: "2026-07-06",
    author: AUTHOR,
    readMins: 7,
    tags: ["Buffet", "Food guides", "Best of"],
    sections: [
      { h2: "Singapore’s halal buffet scene",
        body: ["Few cities do buffets like Singapore, and the halal choice is wide: hotel international spreads, cook-your-own steamboat and BBQ, elegant high tea, seafood lines and — during the fasting month — some of the best iftar buffets in the region. The catch is that “halal buffet” covers everything from a fully MUIS-certified hotel restaurant to a self-declared spread, so it pays to know exactly what you are booking.",
               "This guide walks through the main types, what they typically cost, how to match one to your occasion, and — most importantly — how to confirm a buffet is genuinely halal before you put down a deposit."] },
      { h2: "Types of halal buffet in Singapore",
        body: ["Buffets fall into a few broad families, each with its own vibe and price point. Knowing which one you want narrows the search quickly, whether you are feeding a big group or planning a quiet weekend treat."],
        bullets: ["Hotel international buffets — broad spreads, often MUIS-certified restaurants",
                  "Halal steamboat & BBQ — cook-your-own, great for groups",
                  "Halal high tea — weekend afternoon spreads, lighter bites",
                  "Seafood buffets — crab, prawn and grill-heavy lines",
                  "Ramadan iftar buffets — seasonal, very popular during the fasting month",
                  "Buffet catering — the spread brought to your event or office"] },
      { h2: "What to check before you book",
        body: ["Buffet certification is specific to the restaurant, not the whole hotel. A hotel can run one MUIS-certified restaurant while its other outlets are not certified at all, so the building being famous tells you nothing on its own. Before paying a deposit, confirm the exact restaurant on the MUIS HalalSG register and check the certificate is current — certification is outlet-specific and expires."],
        bullets: ["Confirm the specific restaurant on MUIS HalalSG",
                  "Check the certificate hasn’t expired",
                  "Read the halal-confidence score on the listing",
                  "Ask about prayer facilities for longer sittings",
                  "For Ramadan, book early — iftar buffets sell out"] },
      { h2: "Price tiers: lunch, dinner and weekends",
        body: ["Buffet pricing follows a predictable pattern. Lunch sittings are typically cheaper than dinner, and weekdays undercut weekends; Ramadan and festive periods command the highest prices and fill the fastest. Most buffets offer reduced child and senior rates, and larger groups often unlock better per-head value — so it is worth asking about both when you enquire."],
        bullets: ["Lunch — usually the cheapest sitting",
                  "Dinner & weekends — premium pricing, busier",
                  "Ramadan & festive — highest demand, book weeks ahead",
                  "Child, senior and group rates — ask when booking"] },
      { h2: "Choosing a buffet by occasion",
        body: ["The “best” buffet depends on the occasion. Birthdays and family gatherings suit a broad international spread or a social steamboat table; corporate events and larger parties often lean on buffet catering brought to the venue; and a relaxed weekend catch-up is exactly what high tea is for. For big groups, cook-your-own steamboat and BBQ tend to be better value and more fun than a plated meal."],
        bullets: ["Birthdays & family — international spreads or steamboat",
                  "Corporate & large events — buffet catering on-site",
                  "Casual catch-ups — halal high tea",
                  "Ramadan — iftar buffets with the family, booked early"] },
      { h2: "Verify it, then plan on Humble Halal",
        body: ["Whatever the occasion, the same trust rule applies: certified, Muslim-owned and “no pork, no lard” are three different things, and only MUIS certification is official. Every listing on Humble Halal shows a halal-confidence score out of 100 so you can weigh assurance at a glance, and the “Is it halal?” checker helps when you are eyeing a specific hotel or brand.",
               "From there, browse the directory by area and category, open the map to find buffets near you, and shortlist a few before you call to book — then reconfirm the exact outlet on the MUIS HalalSG register for peace of mind."],
        bullets: ["Compare halal-confidence scores across shortlisted buffets",
                  "Use area and category filters to find one nearby",
                  "Confirm the exact restaurant on MUIS HalalSG",
                  "Check reviews and photos before booking a big table"] },
    ],
    faq: [
      { q: "Are halal buffets in Singapore MUIS-certified?", a: "Many hotel buffet restaurants are MUIS-certified, but not all. Certification is restaurant-specific, so a certified hotel outlet can sit beside non-certified ones. Confirm the exact restaurant on the MUIS HalalSG register before booking, and read its halal-confidence score." },
      { q: "Is there halal steamboat buffet in Singapore?", a: "Yes. There are several halal steamboat and BBQ buffets, many of which are MUIS-certified or Muslim-owned. They are usually better value and more social for big groups than a plated meal. Check the halal-confidence score and certification before you go." },
      { q: "When are Ramadan iftar buffets available?", a: "Ramadan iftar buffets run during the fasting month and are extremely popular — book weeks in advance, as the best ones sell out quickly and command premium festive pricing." },
      { q: "How much does a halal buffet cost in Singapore?", a: "It varies widely by type and timing. Lunch sittings are typically cheaper than dinner, and weekdays undercut weekends, while Ramadan and festive buffets are the priciest. Most offer child and senior rates, and groups can often negotiate better per-head value." },
      { q: "Can I get halal buffet catering for an event?", a: "Yes — buffet catering brings the spread to your office, home or event venue and is popular for corporate functions and large family gatherings. Apply the same checks: confirm the caterer’s MUIS certification on HalalSG and read its halal-confidence score." },
      { q: "What is the best halal buffet in Singapore?", a: "There is no single winner — the best halal buffet is the certified one that fits your occasion, group size and budget. Compare halal-confidence scores on Humble Halal, match the type to your event, and reconfirm the exact outlet on MUIS HalalSG before booking." },
    ],
    related: ["best-halal-restaurants-singapore-2026", "how-to-check-muis-halal-certification"],
    dropcap: true,
    pullQuote: "“A hotel’s name means nothing on its own — certification is outlet-specific, so always check the exact restaurant.”",
    pullQuoteBy: "The Humble Halal Team",
  },
  {
    slug: "best-halal-cafes-singapore",
    title: "Best Halal Cafés in Singapore",
    dek: "Specialty coffee, brunch and dessert cafés that are MUIS-certified or Muslim-owned — where to go, and how to tell them apart.",
    answer:
      "The best halal cafés in Singapore range from specialty-coffee roasters to all-day brunch spots and dessert cafés, many of them Muslim-owned. Look for the MUIS Certified or Muslim-Owned badge, check the halal-confidence score, and filter by neighbourhood on Humble Halal to find one near you. Confirm any certification claim on the MUIS HalalSG register.",
    datePublished: "2026-06-10",
    dateModified: "2026-07-06",
    author: AUTHOR,
    readMins: 7,
    tags: ["Cafés", "Food guides", "Best of"],
    sections: [
      { h2: "What makes a great halal café",
        body: ["Coffee culture in Singapore is huge, and the halal café scene has kept pace — third-wave espresso, matcha, all-day brunch and elaborate desserts. The trust question is the same as anywhere: is it certified, or Muslim-owned and pork-free? Both can be lovely; only one is officially verified."],
        bullets: ["MUIS Certified badge for full certification",
                  "Muslim-Owned for community-run cafés",
                  "The halal-confidence score at a glance",
                  "A prayer space or surau nearby for longer sits"] },
      { h2: "Certified, Muslim-owned or just pork-free?",
        body: ["Cafés are where the halal-confidence nuance matters most, because many lovely spots are self-declared rather than certified. MUIS-certified means the whole kitchen and supply chain have been checked. Muslim-owned usually means pork-free and community-run, but it isn’t the same as certification. “No pork, no lard” is a self-declaration only.",
               "The everyday café pitfalls are worth knowing: bacon and ham on brunch plates, alcohol in desserts like tiramisu and rum cake, gelatine in cheesecakes and mousses, and the occasional boozy affogato. A certified café clears all of these."] },
      { h2: "Café styles worth seeking out",
        body: ["The halal café scene isn’t one thing — it runs from serious coffee to serious cake. Knowing the styles helps you pick the right spot for the mood."],
        bullets: ["Specialty coffee & roasteries — single-origin espresso and pour-over",
                  "All-day brunch cafés — big plates, eggs and good bread",
                  "Dessert & cake cafés — layer cakes, tarts and matcha bakes",
                  "Traditional kopi & kueh corners — heritage coffee and local snacks"] },
      { h2: "Brunch, coffee and what to order",
        body: ["For brunch, the halal-friendly classics travel well: shakshuka, big breakfasts with chicken sausage and beef bacon, pancake stacks, and avocado toast with eggs done every way. On the coffee side, expect flat whites, cold brew, matcha and increasingly good decaf.",
               "Many of these cafés double as work-friendly spaces — reliable Wi-Fi, plug points and a corner table for a slow afternoon. If you’re planning to linger, a quieter neighbourhood spot often beats a bustling town café."] },
      { h2: "Find one by area",
        body: ["Halal cafés are spread right across the island, from heartland gems to town roasteries. Rather than travel blind, start from your neighbourhood and let the directory surface what’s close."],
        bullets: ["Kampong Glam & Arab Street — photogenic cafés and dessert spots",
                  "The east (Tampines, Bedok, Geylang Serai) — heartland brunch favourites",
                  "Town & Orchard — roasteries and mall cafés",
                  "Near an MRT — easy to reach for a group catch-up"] },
      { h2: "How to check before you go",
        body: ["With so many self-declared cafés, a quick check pays off. Certification is outlet-specific and expires, so confirm the exact café rather than trusting a chain’s reputation. On Humble Halal, each café carries a halal-confidence score and a clear label — certified, Muslim-owned or self-declared."],
        bullets: ["Confirm the café on the MUIS HalalSG register if it claims certification",
                  "Check the label — certified, Muslim-owned or self-declared pork-free",
                  "Watch brunch menus for bacon, ham and boozy desserts",
                  "Weigh the halal-confidence score with recent reviews"] },
      { h2: "Find your café near you",
        body: ["Rather than a fixed list that goes stale, browse cafés by area on the directory and sort by halal-confidence or rating — new spots are added over time, so your “near me” stays current. Open the map to see what’s within walking distance, use the “Open now” filter for a spontaneous coffee, and try the “Is it halal?” checker when a brand is unfamiliar."] },
    ],
    faq: [
      { q: "Are halal cafés in Singapore MUIS-certified?", a: "Some are MUIS-certified; many are Muslim-owned or self-declared pork-free. Humble Halal labels each café and shows a halal-confidence score — confirm any certification claim on the MUIS HalalSG register before you visit." },
      { q: "How do I find a halal café near me?", a: "Use the area filter or map on Humble Halal, then sort by the halal-confidence score or rating to find the best certified or Muslim-owned cafés nearby. The “Open now” filter helps when you want a coffee right away." },
      { q: "Is a Muslim-owned café the same as MUIS-certified?", a: "Not quite. Muslim-owned usually means the café is pork-free and community-run, which many diners trust — but MUIS certification is a separate, official check of the whole kitchen and supply chain. Certified sits highest on the halal-confidence score." },
      { q: "Can café desserts contain alcohol?", a: "Yes — tiramisu, rum cake, boozy affogato and some liqueur-laced bakes are common culprits, and gelatine in cheesecakes or mousses can be non-halal. A certified café avoids all of these; with a self-declared spot, it’s worth asking." },
      { q: "Where can I find halal brunch in Singapore?", a: "Browse all-day brunch cafés on Humble Halal, filter by halal status and neighbourhood, and sort by the halal-confidence score. Expect halal-friendly classics like shakshuka, big breakfasts with chicken sausage and beef bacon, and eggs done every way." },
    ],
    related: ["best-halal-restaurants-singapore-2026", "halal-high-tea-singapore"],
    dropcap: true,
    pullQuote: "“Muslim-owned and pork-free can be wonderful — but certified is the only label that’s been officially checked.”",
    pullQuoteBy: "The Humble Halal Team",
  },
  {
    slug: "halal-high-tea-singapore",
    title: "Halal High Tea in Singapore: Where to Go",
    dek: "Afternoon tea spreads that are halal-friendly — hotel lounges, dessert cafés and high-tea buffets, with the dessert nuances to watch.",
    answer:
      "Halal high tea in Singapore is served at hotel lounges, dessert cafés and dedicated high-tea buffets, with tiered savoury bites and sweets over free-flow tea and coffee. Watch for alcohol in desserts and pork gelatine in mousses and jellies. Certification is venue-specific, so confirm the exact lounge or café on the MUIS HalalSG register before booking.",
    datePublished: "2026-06-09",
    dateModified: "2026-07-06",
    author: AUTHOR,
    readMins: 7,
    tags: ["High tea", "Food guides"],
    sections: [
      { h2: "The weekend treat, explained",
        body: ["High tea is one of Singapore’s favourite weekend indulgences — a tiered spread of finger sandwiches, scones, pastries and cakes, usually with free-flow tea or coffee, stretched over a lazy afternoon. It’s as much about the setting and the catch-up as the food.",
               "For halal-conscious diners, the pleasure comes with one question: is the kitchen producing all this certified, or simply pork-free? The answer decides whether you can fully relax into the occasion."] },
      { h2: "What makes a high tea halal",
        body: ["Sweets are where the surprises hide. Alcohol shows up in more desserts than people expect — rum-soaked sponges, sherry trifle, liqueur truffles and even some vanilla extracts. Gelatine in mousses, panna cotta and jellies can be pork-derived, and pastries may use non-halal shortening.",
               "On the savoury tier, watch for ham, bacon and non-halal cold cuts in the finger sandwiches. A certified kitchen has cleared all of this; a “no pork” label alone has not."],
        bullets: ["Alcohol in desserts — rum sponge, sherry trifle, liqueur truffles",
                  "Pork gelatine in mousses, panna cotta and jellies",
                  "Ham, bacon or non-halal cold cuts in finger sandwiches",
                  "Non-halal shortening or lard in pastries and scones"] },
      { h2: "Where high tea happens",
        body: ["Halal-friendly high tea comes in a few formats, and each suits a different mood — and budget. Knowing them helps you set expectations before you book."],
        bullets: ["Hotel lounges — polished settings, tiered stands, refined service",
                  "Dessert & patisserie cafés — cake-forward spreads in a relaxed room",
                  "High-tea buffets — free-flow spreads with more variety and volume",
                  "Kampong Glam & town cafés — cosy, photogenic afternoon spots"] },
      { h2: "What’s on the tiers",
        body: ["A classic high tea runs sweet and savoury together. The bottom tier usually holds finger sandwiches and savoury bites; the middle, warm scones with jam and cream; the top, a parade of pastries, tarts and cakes. Free-flow tea, coffee and sometimes mocktails round it out.",
               "Portions are dainty by design — the idea is to graze across many small things rather than fill up on one. Come a little hungry and pace yourself through the tiers."] },
      { h2: "By occasion and budget",
        body: ["High tea shines for gentle, sit-down occasions, and the format flexes to the group. Weekend and festive slots carry a premium and fill fast, so match the venue to the moment and book ahead."],
        bullets: ["Birthdays & bridal showers — a pretty, sharing-friendly celebration",
                  "Catch-ups — a relaxed setting for a long, unhurried chat",
                  "$$ — dessert cafés and patisserie spreads",
                  "$$$ — hotel-lounge sets and premium buffets, with a weekend premium"] },
      { h2: "How to verify the venue",
        body: ["Certification is venue-specific — a hotel holding a certificate for its main restaurant doesn’t mean its lounge high tea is covered, and certificates expire. Before you book, confirm the exact outlet yourself. Every listing on Humble Halal shows a halal-confidence score — highest for MUIS-certified, then admin-verified or Muslim-owned, then self-declared “no pork, no lard”."],
        bullets: ["Confirm the specific lounge or café on the MUIS HalalSG register",
                  "Check whether it’s certified or only self-declared pork-free",
                  "Ask if the high tea is prepared in the certified kitchen",
                  "Weigh the halal-confidence score with recent reviews and photos"] },
      { h2: "Plan your high tea with Humble Halal",
        body: ["Rather than a fixed list, browse the directory: search cafés and restaurants that serve afternoon spreads, filter by halal status and area, and sort by the halal-confidence score or rating. The map shows what’s near you, and the “Is it halal?” checker helps with an unfamiliar brand.",
               "For a long, leisurely sitting, it’s worth asking whether there’s a prayer space or a mosque nearby — and for weekends or festive periods, reserve early, because the best slots go quickly."] },
    ],
    faq: [
      { q: "Is hotel high tea in Singapore halal?", a: "Some hotel high-tea venues are MUIS-certified, but not all. Certification is venue-specific — a hotel’s main restaurant may be certified while its lounge is not — so confirm the exact outlet on the MUIS HalalSG register before booking." },
      { q: "Can high-tea desserts contain alcohol?", a: "Yes — this is the most common pitfall. Rum-soaked sponges, sherry trifle, liqueur truffles and some vanilla extracts all contain alcohol. A certified kitchen uses halal alternatives, so certification is the surest way to avoid it." },
      { q: "Is the gelatine in mousses and jellies halal?", a: "Not always — gelatine in mousses, panna cotta and jellies can be pork-derived. Certified venues use halal or plant-based gelatine, while a self-declared pork-free café may not have verified its supply. Check the halal-confidence label first." },
      { q: "Where can I find halal high tea?", a: "Search “high tea” and filter by halal status on Humble Halal, or browse halal cafés and restaurants that serve afternoon spreads. Sort by the halal-confidence score or rating, and use the map to find one near you." },
      { q: "How much does halal high tea cost?", a: "Dessert cafés and patisserie spreads sit at the more affordable end, while hotel-lounge sets and premium high-tea buffets cost more, especially at weekends. Check the venue for current per-person pricing, and book early for weekend and festive slots." },
    ],
    related: ["best-halal-cafes-singapore", "halal-buffet-guide-singapore"],
    dropcap: true,
    pullQuote: "“At high tea the surprises hide in the sweets — a certified kitchen is what lets you reach for the top tier.”",
    pullQuoteBy: "The Humble Halal Team",
  },
  {
    slug: "halal-steamboat-hotpot-singapore",
    title: "Halal Steamboat & Hotpot in Singapore",
    dek: "Cook-your-own halal steamboat and hotpot spots — great for groups, with certified broths and meats.",
    answer:
      "There are several halal steamboat and hotpot restaurants in Singapore, many MUIS-certified, offering certified broths, meats and seafood. They’re ideal for groups. Check the halal-confidence score and confirm the outlet on MUIS HalalSG before you go.",
    datePublished: "2026-06-08",
    dateModified: "2026-07-06",
    author: AUTHOR,
    readMins: 7,
    tags: ["Steamboat", "Hotpot", "Food guides"],
    sections: [
      { h2: "Why steamboat is made for groups",
        body: ["Steamboat — hotpot to some — is communal by design: a shared simmering broth in the middle of the table, plates of raw meat, seafood, vegetables, tofu and noodles that everyone cooks to their own liking. For halal diners the appeal is simple. At a fully certified steamboat restaurant, every plate on the table is accounted for, so there are no cross-contamination worries and no quiet non-halal ingredient hiding in the spread.",
               "It is also relaxed, unhurried and easy to scale from a family of four to a big birthday table — which is why steamboat is such a popular pick for celebrations, reunions and cold-aircon weeknights."] },
      { h2: "Soup bases, and the mala question",
        body: ["Half the fun of steamboat is the broth, and most places let you split the pot into two or more bases. The flavour of a base does not by itself make a meal halal — what matters is the stock and seasonings used — but it helps to know the usual line-up so you can order with confidence.",
               "Mala deserves a special mention. Some mala and steamboat outlets are MUIS-certified and many are not, and mala pastes vary widely in what goes into them. If mala is the reason you are going, confirm the specific outlet is certified rather than assuming — both the broth and the meats need to check out."],
        bullets: ["Herbal & collagen — long-simmered chicken or bone broths",
                  "Tom yum — tangy, spicy Thai-style base",
                  "Mala — numbing Sichuan chilli; confirm the outlet is certified",
                  "Tomato & laksa — milder, kid-friendly options",
                  "Clear superior stock — simple and versatile"] },
      { h2: "What makes the broth and meat halal",
        body: ["Beyond the obvious no-pork rule, two things decide whether a steamboat is truly halal: the broth and the meat supply. Some stocks are built on non-halal bones or pork-based flavourings, and a splash of Shaoxing cooking wine or mirin in the base is common in non-certified kitchens. The beef, chicken, lamb and processed items should all come from halal sources too.",
               "A MUIS-certified steamboat restaurant has verified all of this end to end, which is exactly why certification is worth prioritising for a meal where so many different ingredients land in one shared pot."],
        bullets: ["Broth stock — no pork bones or pork-based flavourings",
                  "No Shaoxing wine, mirin or rice wine in the base",
                  "Meat & poultry — halal-slaughtered, not just “no pork”",
                  "Processed items — meatballs, fish cake, dumplings, luncheon meat",
                  "Dipping sauces — watch for any containing alcohol"] },
      { h2: "Buffet vs à la carte — and BBQ crossover",
        body: ["Steamboat comes in two pricing models, and the right one depends on your group. All-you-can-eat buffets reward big appetites and long, social dinners, while à la carte suits smaller tables that would rather order a few quality plates. Many halal steamboat restaurants also run a grill built into the same table — a Korean-BBQ-style crossover — so you can boil and barbecue at once."],
        bullets: ["Buffet — best value for hungry groups and celebrations",
                  "À la carte — better for two to four diners",
                  "Steamboat + BBQ combo — boil and grill at one table",
                  "Watch time limits and per-head minimums on buffets"] },
      { h2: "Booking, groups and prayer",
        body: ["Steamboat is a long meal, so a little planning pays off. For weekends, eve-of-holiday nights and Ramadan, book ahead — the best halal steamboat spots fill fast with large tables. If your group prays, ask whether there is a surau or prayer space nearby, since you may be seated for a couple of hours. And reconfirm the exact outlet is certified before you commit a deposit, as certification is outlet-specific and can lapse."] },
      { h2: "Verify it, then find one near you",
        body: ["Because steamboat pulls together so many ingredients, it is a meal where the halal-confidence score really earns its keep. On Humble Halal, every listing shows that score out of 100, with MUIS-certified at the top, then Muslim-owned or admin-verified, then self-declared. Use it to shortlist, then confirm the specific outlet on the MUIS HalalSG register.",
               "To find one near you, browse the halal directory by cuisine and area, open the map to see what is close, and filter for what is open now — handy when a steamboat craving strikes late."],
        bullets: ["Check the halal-confidence score (0–100) first",
                  "Confirm the exact outlet on MUIS HalalSG",
                  "Use the map and area filters to find steamboat nearby",
                  "Read recent reviews before booking a big table"] },
    ],
    faq: [
      { q: "Is there halal steamboat in Singapore?", a: "Yes — there are several halal steamboat and hotpot restaurants, many MUIS-certified, offering certified broths, meats and seafood. Check the halal-confidence score on Humble Halal and confirm the specific outlet on the MUIS HalalSG register before you go." },
      { q: "Is mala hotpot halal?", a: "Some mala and hotpot outlets are MUIS-certified and some are not. Mala pastes and broths vary widely, so never assume — confirm the specific outlet on HalalSG. If mala is your reason for going, the broth and the meats both need to check out." },
      { q: "What makes a steamboat broth halal?", a: "The stock must avoid pork bones and pork-based flavourings, and the base must not contain Shaoxing cooking wine, mirin or rice wine. In a MUIS-certified restaurant this is all verified, which is why certification matters most for a shared-pot meal." },
      { q: "How do I find halal steamboat near me?", a: "Browse the halal directory on Humble Halal by cuisine and area, open the map to see what is close, and sort by halal-confidence score or rating. Filter for “Open now” if the craving is late, then confirm the outlet on MUIS HalalSG." },
      { q: "Is halal steamboat buffet good value for groups?", a: "Usually, yes. All-you-can-eat steamboat and BBQ buffets tend to be more social and better value than a plated meal for a big, hungry group. Watch for time limits and per-head minimums, and book ahead for weekends and festive nights." },
    ],
    related: ["halal-buffet-guide-singapore", "best-halal-restaurants-singapore-2026"],
    dropcap: true,
    pullQuote: "“With so many ingredients hitting one shared pot, certification is what lets you relax and just enjoy the meal.”",
    pullQuoteBy: "The Humble Halal Team",
  },
  {
    slug: "halal-sushi-japanese-singapore",
    title: "Halal Sushi & Japanese Food in Singapore",
    dek: "Where to eat halal sushi, ramen, donburi and teppanyaki in Singapore — from MUIS-certified kitchens to Muslim-owned favourites.",
    answer:
      "Halal sushi and Japanese food in Singapore is served at a growing number of MUIS-certified and Muslim-owned restaurants — sushi, ramen, donburi and teppanyaki made without pork, alcohol-based mirin or non-halal meat. Because Japanese cooking hides alcohol and pork in its base flavours, always confirm the specific outlet on the MUIS HalalSG register before dining.",
    datePublished: "2026-06-07",
    dateModified: "2026-07-06",
    author: AUTHOR,
    readMins: 7,
    tags: ["Japanese", "Sushi", "Food guides"],
    sections: [
      { h2: "Why halal Japanese food keeps growing",
        body: ["Japanese food has become one of Singapore’s favourite cuisines — but authentic recipes lean on ingredients that are quietly off-limits for Muslim diners. That tension is exactly why the halal Japanese scene has grown so fast: dedicated kitchens now recreate sushi, ramen and teppanyaki using halal-certified meat and alcohol-free seasonings, so you can order freely rather than interrogating every dish.",
               "For a cuisine this ingredient-sensitive, certification does more work than usual. A valid MUIS certificate tells you the whole kitchen — sauces, stocks and supply chain included — has been checked, not just that pork is off the menu."] },
      { h2: "What makes Japanese food halal — or not",
        body: ["The challenge with Japanese cooking is that alcohol and pork are woven into its base flavours, not added on top. Mirin (sweet rice wine), sake and cooking rice wine appear in glazes, teriyaki and simmered dishes; dashi stock and ramen broth can hide non-halal ingredients; and pork shows up as chashu, in gyoza fillings and in tonkotsu broth.",
               "Halal Japanese kitchens swap these out — alcohol-free mirin substitutes, chicken or beef broth in place of tonkotsu, and halal-slaughtered meat throughout — which is why a certificate is so reassuring. Shared fryers and grills are the other detail worth checking at part-halal outlets."],
        bullets: ["Mirin, sake & cooking rice wine — in glazes, teriyaki and simmered dishes",
                  "Tonkotsu (pork-bone) ramen broth — look for chicken or beef broth instead",
                  "Chashu, gyoza and some dumplings — traditionally pork",
                  "Dashi and ready-made sauces — can carry non-halal or alcohol-based ingredients",
                  "Naturally brewed soy sauce and shared fryers — worth checking at non-certified spots"] },
      { h2: "What to order with confidence",
        body: ["Once you’re at a certified or trusted Muslim-owned outlet, the full menu opens up. The best halal Japanese places cover the classics you’d hope for, from a proper sushi counter to a sizzling teppanyaki grill.",
               "If you’re new to the cuisine, a donburi rice bowl or a chicken katsu set is an easy, wallet-friendly start; from there, work up to omakase-style sushi and premium grills."],
        bullets: ["Sushi & sashimi — with halal-sourced fish and seafood",
                  "Ramen — rich chicken or beef broth versions",
                  "Donburi rice bowls — beef gyudon, chicken teriyaki, tempura",
                  "Teppanyaki & yakiniku — grilled halal beef, chicken and seafood",
                  "Tempura & katsu — chicken or beef katsu with tonkatsu-style sauce",
                  "Sides & sweets — edamame, agedashi tofu, matcha and mochi"] },
      { h2: "By budget and occasion",
        body: ["Halal Japanese spans a wide price range, so there’s something for a weekday craving and for a celebration. As a rough guide, a casual donburi or ramen bowl typically runs in the low-teens, mid-range sushi sets and yakiniku sit higher, and teppanyaki counters or omakase-style experiences are the splurge tier."],
        bullets: ["Everyday — donburi bowls, ramen and katsu sets, typically wallet-friendly",
                  "Groups & families — yakiniku and teppanyaki for cook-and-share fun",
                  "Date night — a quiet sushi counter or a premium wagyu-style grill",
                  "Travellers & town — certified options around the airport, Jewel and Orchard"] },
      { h2: "How to verify it’s genuinely halal",
        body: ["Because Japanese cooking is so seasoning-heavy, this is a cuisine where you want to check rather than assume. Certification in Singapore is outlet-specific and expires, so a chain being halal at one mall doesn’t guarantee every branch is."],
        bullets: ["Search the specific outlet on the MUIS HalalSG register (halal.muis.gov.sg)",
                  "Check the halal-confidence score on Humble Halal — certified scores highest",
                  "Remember: MUIS-certified isn’t the same as Muslim-owned or self-declared “no pork”",
                  "At non-certified spots, ask about the broth, the mirin and shared fryers"] },
      { h2: "Plan your Japanese meal on Humble Halal",
        body: ["Rather than guessing, use the directory to line up your next meal. Browse the halal Japanese listings, filter by area to find a spot near your MRT stop, and open the map to see what’s close by. The “Open now” filter is handy for a late-night ramen run, and the “Is it halal?” checker helps when you’re weighing up a brand you’ve spotted elsewhere.",
               "Because new certified places are added over time and every listing carries a halal-confidence score, the directory stays current in a way a fixed top-ten list never can."] },
    ],
    faq: [
      { q: "Is sushi halal in Singapore?", a: "Sushi is halal when the restaurant is MUIS-certified and avoids alcohol-based seasonings and non-halal ingredients. Several halal sushi restaurants operate across Singapore, using halal-sourced fish and seafood. Confirm the specific outlet on the MUIS HalalSG register before dining." },
      { q: "Is Japanese food halal?", a: "Japanese food can be halal when it’s prepared without pork, alcohol (mirin and sake) and non-halal meat. Certified kitchens use alcohol-free seasonings and halal-slaughtered meat throughout. Look for MUIS-certified Japanese restaurants, and check the halal-confidence score on Humble Halal." },
      { q: "Is mirin halal?", a: "Traditional mirin is a sweet rice wine and contains alcohol, so it isn’t halal. Halal Japanese kitchens use alcohol-free mirin substitutes to get the same sweetness in glazes and teriyaki. If a dish is glazed or simmered at a non-certified outlet, it’s worth asking what was used." },
      { q: "Is ramen halal in Singapore?", a: "Classic tonkotsu ramen is made from pork bones, so it isn’t halal. Halal ramen shops use chicken or beef broth instead and swap chashu for halal meat. Confirm the outlet is MUIS-certified on HalalSG rather than assuming from the menu photos alone." },
      { q: "Is Japanese soy sauce halal?", a: "Some naturally brewed Japanese soy sauces develop a small amount of alcohol during fermentation, which is why certification matters. MUIS-certified restaurants use approved sauces, so you don’t have to judge each bottle yourself. At non-certified spots, this is one detail worth checking." },
      { q: "How much does halal Japanese food cost in Singapore?", a: "It varies widely. A casual donburi or ramen bowl typically sits in the low-teens, mid-range sushi sets and yakiniku cost more, and teppanyaki or omakase-style meals are the splurge tier. Use the area and category filters on Humble Halal to find options that suit your budget." },
    ],
    related: ["halal-korean-food-singapore", "best-halal-restaurants-singapore-2026"],
    dropcap: true,
    pullQuote: "“Japanese cooking hides alcohol and pork in its base flavours — which is why certification matters more here, not less.”",
    pullQuoteBy: "The Humble Halal Team",
  },
  {
    slug: "halal-korean-food-singapore",
    title: "Halal Korean Food in Singapore",
    dek: "Halal Korean BBQ, fried chicken, bibimbap and army stew — from MUIS-certified grills to Muslim-owned favourites across Singapore.",
    answer:
      "Halal Korean food in Singapore includes Korean BBQ, fried chicken, bibimbap, army stew and tteokbokki at MUIS-certified and Muslim-owned restaurants. These use halal-slaughtered meat and avoid alcohol-based sauces such as soju, mirin and some gochujang. Because certification is outlet-specific, confirm the exact branch on the MUIS HalalSG register before dining.",
    datePublished: "2026-06-06",
    dateModified: "2026-07-06",
    author: AUTHOR,
    readMins: 7,
    tags: ["Korean", "Korean BBQ", "Food guides"],
    sections: [
      { h2: "Korean food, the halal way",
        body: ["The Korean wave brought K-BBQ, crispy fried chicken and bubbling army stew to Singapore, and Muslim diners no longer have to watch from the sidelines. A growing set of halal-certified and Muslim-owned Korean restaurants now serve the full spread, using halal meat and alcohol-free sauces so the whole table can dig in.",
               "Korean cooking is meat-forward and sauce-driven, which is where certification earns its keep — it confirms both the protein and the seasonings have been checked, not just that pork is absent."] },
      { h2: "What makes Korean food halal — or not",
        body: ["Two things decide whether a Korean dish is halal: the meat and the marinade. Pork appears in samgyeopsal (pork belly) and some stew bases, so halal kitchens centre beef, chicken and lamb instead. The subtler issue is alcohol — soju, mirin and rice wine often go into marinades, sauces and stews, and some gochujang (red chilli paste) is fermented with alcohol.",
               "Certified Korean restaurants use halal-slaughtered meat and alcohol-free versions of these staples. At self-declared spots, the marinade and the shared grill are the details worth asking about."],
        bullets: ["Pork — samgyeopsal and some stew bases; look for beef, chicken or lamb",
                  "Soju, mirin & rice wine — common in marinades, sauces and stews",
                  "Gochujang & gochugaru sauces — some are fermented with alcohol",
                  "Shared grills and banchan — worth checking at non-certified outlets"] },
      { h2: "What to order",
        body: ["At a certified Korean spot, the greatest hits are all on the table. Start with the barbecue, then work through the fried chicken, rice bowls and stews Korea is loved for.",
               "Milder dishes like bibimbap and japchae balance out the spicier plates, so there’s something for every heat tolerance around the table."],
        bullets: ["Korean BBQ — marinated bulgogi and galbi (beef), chicken and lamb",
                  "Korean fried chicken — soy-garlic and sweet-spicy yangnyeom",
                  "Bibimbap — rice, vegetables and halal beef or chicken with an egg",
                  "Army stew (budae jjigae) — halal sausage and ramyeon in a spicy broth",
                  "Tteokbokki & street snacks — chewy rice cakes, kimbap, hotteok",
                  "Japchae — glass noodles stir-fried with vegetables and beef"] },
      { h2: "Great for groups — and every budget",
        body: ["Cook-your-own Korean BBQ is one of the best group meals in the halal scene: everyone grills at the table, the orders keep flowing, and it easily stretches to a birthday or a big family night. As a rough guide, fried chicken and rice bowls are the everyday tier, all-you-can-eat barbecue sits mid-range per head, and premium marbled-beef grills are the treat."],
        bullets: ["Groups & celebrations — all-you-can-eat K-BBQ for cook-and-share fun",
                  "Everyday — fried chicken, bibimbap and tteokbokki on a budget",
                  "Date night — a premium marbled-beef grill or a quieter stew house",
                  "Families — mild bibimbap and japchae alongside the spicier dishes"] },
      { h2: "How to verify it’s genuinely halal",
        body: ["Korean barbecue chains sometimes run both halal and non-halal outlets, so the branch matters as much as the brand. Certification in Singapore is outlet-specific and expires — always check the exact location before you book a big table."],
        bullets: ["Look up the specific outlet on the MUIS HalalSG register (halal.muis.gov.sg)",
                  "Check the halal-confidence score on Humble Halal — MUIS-certified scores highest",
                  "Remember: Muslim-owned or “no pork” isn’t the same as MUIS certification",
                  "At non-certified spots, ask about the marinades, sauces and shared grill"] },
      { h2: "Find halal Korean near you on Humble Halal",
        body: ["Skip the guesswork and use the directory. Browse the halal Korean listings, filter by neighbourhood to find a grill near your MRT line, and open the map to see what’s nearby before you head out. The “Open now” filter helps for a late fried-chicken craving, and the “Is it halal?” checker is there when a friend recommends a brand you’re unsure about.",
               "With a halal-confidence score on every listing and new certified places added over time, you get an up-to-date picture rather than a list that quietly goes stale."] },
    ],
    faq: [
      { q: "Is Korean BBQ halal in Singapore?", a: "Some Korean BBQ restaurants in Singapore are halal-certified or Muslim-owned, using halal-slaughtered meat and no alcohol in their marinades. Because chains sometimes run both halal and non-halal branches, confirm the specific outlet on the MUIS HalalSG register before booking." },
      { q: "Is Korean fried chicken halal?", a: "Halal Korean fried chicken is available at certified and Muslim-owned outlets that use halal chicken and alcohol-free sauces. The glaze is the thing to watch, as some sauces can contain alcohol. Check the halal-confidence score and certification on Humble Halal." },
      { q: "Is gochujang halal?", a: "Gochujang (Korean red chilli paste) is a fermented product, and some versions develop or include alcohol, so it isn’t automatically halal. Certified Korean restaurants use approved, alcohol-free versions. If you’re cooking at home, check the label for a halal certification mark." },
      { q: "Is soju halal?", a: "No. Soju is a Korean alcoholic drink, so it is haram and not halal. It also turns up in some marinades and stews, which is one reason certification matters at Korean restaurants — a MUIS certificate confirms alcohol has been kept out of the cooking too." },
      { q: "Is tteokbokki halal?", a: "Tteokbokki (spicy rice cakes) can be halal when made with a halal-approved gochujang sauce and no non-halal add-ins such as pork-based fish cake or sausage. At a certified outlet you can order it freely. Elsewhere, ask what goes into the sauce and toppings." },
      { q: "Where can I find halal Korean food in Singapore?", a: "Browse the halal Korean listings on Humble Halal, filter by area to find a spot near you, and sort by the halal-confidence score. Options range from certified BBQ grills to Muslim-owned fried-chicken and stew houses across the island." },
    ],
    related: ["halal-sushi-japanese-singapore", "best-halal-restaurants-singapore-2026"],
    dropcap: true,
    pullQuote: "“With Korean food, two things decide halal or not — the meat and the marinade.”",
    pullQuoteBy: "The Humble Halal Team",
  },
  {
    slug: "halal-fine-dining-singapore",
    title: "Halal Fine Dining in Singapore",
    dek: "Special-occasion halal restaurants — degustation, halal steak and elevated dining, with mocktail pairings and how to verify each venue.",
    answer:
      "Halal fine dining in Singapore now spans modern European tasting menus, Japanese omakase-style counters, Middle Eastern grills and elevated modern Malay — at MUIS-certified or Muslim-owned restaurants built for celebrations. Expect degustation sets with juice or mocktail pairings instead of wine. Always confirm the specific outlet on the MUIS HalalSG register and book well ahead.",
    datePublished: "2026-06-05",
    dateModified: "2026-07-06",
    author: AUTHOR,
    readMins: 7,
    tags: ["Fine dining", "Food guides"],
    sections: [
      { h2: "Halal, elevated",
        body: ["Fine dining used to be the one gap halal diners in Singapore couldn’t quite fill. That has changed. There are now tasting menus, premium halal steakhouses and modern restaurants serving celebration-worthy meals that are fully halal — either MUIS-certified or Muslim-owned and pork-free.",
               "The appeal is simple: a special occasion without the mental maths. When the kitchen is certified, you can stop scanning the menu for hidden pitfalls and focus on the food, the company and the moment."] },
      { h2: "What makes fine dining halal",
        body: ["At the high end, the risks are subtler than a pork dish on the menu. The classic pitfalls are alcohol used in the kitchen and at the table — wine reductions, brandy flambé, sake and mirin in Japanese courses, and liqueur folded into desserts. A pork-free menu is not automatically an alcohol-free one.",
               "This is why certification matters more, not less, as the cooking gets fancier. A MUIS-certified kitchen has been checked end to end — ingredients, supply chain and preparation — so the elegant sauce isn’t hiding a splash of wine."],
        bullets: ["Wine or brandy in reductions, sauces and flambé",
                  "Sake and mirin in Japanese tasting courses",
                  "Liqueur, rum or alcohol-based extracts in desserts",
                  "Gelatine or rennet in mousses, panna cotta and cheeses",
                  "Non-halal beef or charcuterie on a tasting set"] },
      { h2: "Cuisines that go fine-dining halal",
        body: ["Elevated halal dining isn’t one style — it spans several kitchens that have each found a fine-dining register. Knowing the cuisine helps you match the restaurant to the occasion and to the palates at your table."],
        bullets: ["Modern European — degustation menus, plated courses, refined technique",
                  "Japanese — omakase-style counters with halal-friendly sushi and wagyu",
                  "Middle Eastern — premium grills, mezze and charcoal cooking",
                  "Modern Malay & Nusantara — heritage flavours reworked for a tasting format",
                  "Halal steakhouses — dry-aged cuts and wagyu as the centrepiece"] },
      { h2: "By occasion",
        body: ["The right room depends on why you’re celebrating. A proposal wants a quiet corner and a view; a corporate dinner wants a private space and a set menu that runs to time. Matching the venue to the occasion is half the planning."],
        bullets: ["Anniversaries & date night — intimate degustation, counter seating",
                  "Proposals — a private table, a skyline view, a discreet dessert moment",
                  "Birthdays — sharing-friendly menus and space for a small group",
                  "Corporate & business dinners — private rooms and fixed set menus"] },
      { h2: "What to expect on the night",
        body: ["Elevated halal restaurants usually run set or degustation menus rather than long à la carte lists — several small, considered courses building to a finish. In place of wine pairings, expect thoughtful juice, tea or mocktail pairings designed to match each course.",
               "Prices vary widely. As a rough guide, an elevated set dinner typically runs from the mid-double-digits per head at the accessible end to well into the hundreds for premium omakase or wagyu-led menus. Confirm the format, number of courses and dress code when you book."] },
      { h2: "How to verify before you book",
        body: ["Certification is outlet-specific and it expires, so a group’s flagship being certified doesn’t guarantee its newest spin-off is. Before a milestone booking, take a minute to confirm the exact restaurant yourself. On Humble Halal, every listing carries a halal-confidence score — highest for MUIS-certified, then admin-verified or Muslim-owned, then self-declared “no pork, no lard”."],
        bullets: ["Search the outlet on the MUIS HalalSG register (halal.muis.gov.sg)",
                  "Check the certificate is current — it expires and must be renewed",
                  "Confirm it covers the specific branch, not just the brand",
                  "Weigh the halal-confidence score alongside recent reviews"] },
      { h2: "Plan it with Humble Halal",
        body: ["Rather than chase a list that dates quickly, use the directory. Filter for fine-dining and certified options, sort by the halal-confidence score or rating, and open the map to see what’s near your celebration. The “Is it halal?” checker helps when you’re unsure about a brand.",
               "A last word on logistics: book weekends and festive dates well ahead, ask whether there’s a prayer space or a surau nearby for a long sitting, and reconfirm the menu format if anyone at your table has other dietary needs."] },
    ],
    faq: [
      { q: "Is there halal fine dining in Singapore?", a: "Yes — there is a growing number of halal fine-dining restaurants, including degustation menus, omakase-style counters and halal steakhouses, that are MUIS-certified or Muslim-owned. Because certification is outlet-specific, confirm the exact venue on the MUIS HalalSG register before you book." },
      { q: "What should I check at a halal fine-dining restaurant?", a: "The subtle risks at the high end are alcohol and non-halal meat — wine in sauces, sake or mirin in Japanese courses, liqueur in desserts, and charcuterie on tasting sets. A MUIS-certified kitchen has cleared all of these, which is why certification matters more as the cooking gets fancier." },
      { q: "Do halal fine-dining restaurants offer wine pairings?", a: "No — certified and Muslim-owned fine-dining restaurants don’t serve alcohol. Instead, many offer thoughtful juice, tea or mocktail pairings designed to match each course of a degustation menu, so you still get the pairing experience without the wine." },
      { q: "How much does halal fine dining cost in Singapore?", a: "It spans a wide range. An elevated set dinner typically starts in the mid-double-digits per head at the accessible end and climbs into the hundreds for premium omakase or wagyu-led menus. Confirm the exact set price and number of courses when you reserve." },
      { q: "Where can I celebrate a special occasion with a halal meal?", a: "Filter for fine-dining and certified options on Humble Halal, sort by rating or the halal-confidence score, and open the map to find a special-occasion halal restaurant near you. Book early for weekends and festive dates." },
    ],
    related: ["halal-steak-singapore", "best-halal-restaurants-singapore-2026"],
    dropcap: true,
    pullQuote: "“A celebration meal should feel effortless — start with certification, and let the occasion carry the rest.”",
    pullQuoteBy: "The Humble Halal Team",
  },
  {
    slug: "halal-steak-singapore",
    title: "Where to Find Halal Steak in Singapore",
    dek: "Halal steakhouses and grills in Singapore — wagyu, ribeye and Western grills done the halal way, plus how to verify each outlet.",
    answer:
      "Halal steak in Singapore is served at MUIS-certified and Muslim-owned steakhouses and Western grills, from affordable hotplate sets to dry-aged ribeye and wagyu. The details matter: halal-slaughtered beef, no pork or bacon on shared grills, and no wine or alcohol in sauces and marinades. Always confirm the outlet on the MUIS HalalSG register.",
    datePublished: "2026-06-04",
    dateModified: "2026-07-06",
    author: AUTHOR,
    readMins: 7,
    tags: ["Steak", "Western", "Food guides"],
    sections: [
      { h2: "Halal steak, explained",
        body: ["A great steak comes down to two things: certified halal beef and a kitchen kept free of pork and alcohol. The good news is that Singapore’s halal steak scene now covers the full range — from wallet-friendly hotplate sets in the heartlands to dry-aged premium cuts and wagyu in town.",
               "Steakhouses deserve a little extra care, though, because Western grills are one of the cuisines most likely to also serve pork and wine. That doesn’t make them off-limits — it makes certification the first thing to check."] },
      { h2: "What actually makes a steak halal",
        body: ["The beef itself must be halal-slaughtered, but the kitchen around it matters just as much. On a shared grill or hotplate, bacon and pork can cross-contaminate the surface. In the sauces, red wine, brandy and port turn up in classic reductions, and butter or marinades can be spiked with alcohol.",
               "A MUIS-certified steakhouse has been checked on all of this — the meat’s source, the grill, the sauces and the store cupboard — which is why a certificate beats a “no pork” sign on the door."],
        bullets: ["Halal-slaughtered, certified beef — not just “no pork”",
                  "No bacon or pork sharing the grill or hotplate",
                  "No red wine, port or brandy in sauces and reductions",
                  "No alcohol in marinades, basting butter or peppercorn sauce"] },
      { h2: "Cuts and grades, decoded",
        body: ["Part of the fun of a steakhouse is choosing your cut — leaner or richer, everyday or special. Here’s the shorthand, all of it halal when the beef is certified and the kitchen is clean."],
        bullets: ["Ribeye — richly marbled and forgiving, a crowd favourite",
                  "Sirloin — firmer and beefy, a solid everyday choice",
                  "Tenderloin (fillet) — the leanest and most tender cut",
                  "Wagyu — graded by marbling; buttery and priced to match",
                  "Tomahawk — a bone-in ribeye built for sharing and photos"] },
      { h2: "From hotplate sets to premium wagyu",
        body: ["Halal steak spans a wide price range, and knowing the tiers helps you plan. At the accessible end, hotplate and sizzling-plate sets in the heartlands keep things affordable and filling. In the middle sit dedicated grills with quality imported beef, and at the top are dry-aged and wagyu-led steakhouses for a splurge."],
        bullets: ["$ — hotplate and sizzling-plate sets, often with sides included",
                  "$$ — dedicated halal grills with imported ribeye and sirloin",
                  "$$$ — dry-aged cuts, premium wagyu grades and tomahawks",
                  "Occasions — weekday treat, date night or a birthday splurge"] },
      { h2: "Sides, sauces and the little things",
        body: ["The steak is only half the plate. Most halal steakhouses do the familiar sides well — truffle or shoestring fries, mash, grilled vegetables and creamy mushroom or black-pepper sauce. The one thing worth a quick question is whether any sauce is wine-based; a certified kitchen will have a halal version, but it never hurts to confirm.",
               "Doneness is down to you — from rare to well-done — and a good grill will cook to order. For groups, sharing a large cut like a tomahawk with a spread of sides is often better value than a steak each."] },
      { h2: "How to verify before you go",
        body: ["Because Western grills so often serve pork and alcohol elsewhere on the menu, verifying the specific outlet is especially worth it. Certification is outlet-specific and expires. On Humble Halal, each listing shows a halal-confidence score — highest for MUIS-certified, then admin-verified or Muslim-owned, then self-declared “no pork, no lard”."],
        bullets: ["Confirm the outlet on the MUIS HalalSG register (halal.muis.gov.sg)",
                  "Check the certificate is current and covers that branch",
                  "Prefer certified grills for peace of mind on shared surfaces",
                  "Read recent reviews for notes on sauces and cross-contamination"] },
      { h2: "Find halal steak near you",
        body: ["Skip the static list and use the directory. Filter for steakhouses and Western grills, sort by the halal-confidence score or rating, and open the map to find one near you — the “Open now” filter helps when a craving strikes. New certified grills are added over time, so your options stay fresh.",
               "Whether it’s a quick weeknight sizzle or a wagyu celebration, starting from certification means the only decision left is how you like it cooked."] },
    ],
    faq: [
      { q: "Is there halal steak in Singapore?", a: "Yes — several halal steakhouses and Western grills serve certified beef, from affordable hotplate sets to wagyu. Because grills often handle pork and alcohol too, confirm the outlet is MUIS-certified on HalalSG before dining." },
      { q: "Is wagyu halal?", a: "Wagyu is halal when the beef is halal-slaughtered and the restaurant is certified — the marbling and grade don’t affect its halal status, only the slaughter and the kitchen do. Look for MUIS-certified halal steakhouses on Humble Halal." },
      { q: "Can steak sauces be non-halal?", a: "Yes — classic steak sauces and reductions often use red wine, port or brandy, and some basting butters contain alcohol. A MUIS-certified kitchen uses halal versions; if in doubt, ask the outlet to confirm the sauce is alcohol-free." },
      { q: "What’s the difference between a halal and a “no pork” steakhouse?", a: "“No pork” only means pork isn’t on the menu — it says nothing about the beef’s slaughter or wine in the sauces. MUIS certification verifies the whole chain, from the meat’s source to the grill and store cupboard. Certified is the only official assurance." },
      { q: "How much does halal steak cost in Singapore?", a: "It ranges widely. Hotplate and sizzling-plate sets sit at the affordable end, dedicated grills with imported cuts are mid-range, and dry-aged or premium wagyu steaks are a splurge. Check the outlet’s menu for current prices before you go." },
    ],
    related: ["halal-fine-dining-singapore", "best-halal-restaurants-singapore-2026"],
    dropcap: true,
    pullQuote: "“With Western grills, certification isn’t fussy — it’s what keeps the shared hotplate honest.”",
    pullQuoteBy: "The Humble Halal Team",
  },
  {
    slug: "halal-cakes-bakeries-singapore",
    title: "Halal Cakes & Bakeries in Singapore",
    dek: "Halal birthday cakes, custom bakes, artisanal bread and pastries — how to order with confidence from certified and Muslim-owned bakeries.",
    answer:
      "Halal cakes and bakeries in Singapore include MUIS-certified and Muslim-owned shops making birthday cakes, pastries and bread without alcohol, lard or non-halal gelatine. For custom cakes, order several days ahead, confirm allergens, and verify the bakery’s halal status on the MUIS HalalSG register — home-based and self-declared bakes aren’t the same as certified.",
    datePublished: "2026-06-03",
    dateModified: "2026-07-06",
    author: AUTHOR,
    readMins: 6,
    tags: ["Bakery", "Cakes", "Food guides"],
    sections: [
      { h2: "Why halal status matters for bakes",
        body: ["Cakes and pastries hide more non-halal risks than most food. Vanilla extract and soaking syrups can carry alcohol; buttercreams and pastry can use lard or animal shortening; and mousses, jellies and fondant often rely on animal gelatine. A halal bakery substitutes these deliberately, which is why certification gives real peace of mind for celebrations — you’re not left guessing about a single ingredient in a shared cake."] },
      { h2: "The ingredients to watch",
        body: ["When a bakery isn’t certified, these are the details worth asking about. Certification covers all of them at once, but if you’re weighing a Muslim-owned or home-based baker, a few direct questions clear things up quickly."],
        bullets: ["Alcohol — in vanilla extract, rum-soaked sponges and soaking syrups",
                  "Lard & animal shortening — in some pastry, cookies and buttercream",
                  "Gelatine — in mousse, jelly layers, marshmallow and some fondant",
                  "Rennet — in cheesecakes made with certain cheeses",
                  "Emulsifiers (e.g. E471) — can be animal-derived unless certified"] },
      { h2: "Types of halal bakes",
        body: ["Halal bakeries in Singapore cover far more than birthday sponges. From artisanal sourdough to delicate viennoiserie and traditional kueh, the range is wide — handy whether you need a showpiece cake or a simple loaf."],
        bullets: ["Custom celebration cakes — birthdays, weddings and themed designs",
                  "Artisanal bread & sourdough — everyday loaves and specialty bakes",
                  "Pastries & viennoiserie — croissants, tarts and pastries",
                  "Kueh & traditional bakes — local favourites and festive treats",
                  "Dessert tables & cupcakes — for parties and corporate events"] },
      { h2: "Ordering a custom cake",
        body: ["Custom work needs lead time. Most bakeries ask for several days’ notice — longer for tiered or heavily decorated cakes — and many take a deposit to secure your date. Confirm the practical details early so nothing surprises you on collection day: delivery options, allergen handling, and whether the design you want is achievable within your budget and timeline."],
        bullets: ["Order custom cakes 3–7 days ahead — more for tiered designs",
                  "Expect a deposit to confirm the booking",
                  "Ask about nut and other allergen handling",
                  "Confirm delivery or self-collection and timing"] },
      { h2: "Bakes by occasion",
        body: ["Different celebrations call for different bakes, and telling the baker the occasion helps them advise on size, design and lead time. A child’s birthday, an aqiqah, a wedding dessert table and a corporate order all have their own rhythms — and the busier ones, like weddings and festive periods, need the earliest booking."] },
      { h2: "Verify, then order on Humble Halal",
        body: ["Because certification is outlet-specific and expires, confirm the exact bakery on the MUIS HalalSG register rather than assuming from a shopfront sign. On Humble Halal you can browse halal bakeries, filter by certified or Muslim-owned, and check each shop’s halal-confidence score before you enquire — then order your custom cake ahead with the details confirmed in writing."] },
    ],
    faq: [
      { q: "Where can I order a halal birthday cake in Singapore?", a: "Browse halal bakeries on Humble Halal, filter by certified or Muslim-owned, and compare halal-confidence scores. Order custom cakes several days ahead and confirm the bakery’s status on the MUIS HalalSG register before you commit." },
      { q: "Are bakery cakes automatically halal?", a: "No. Some contain alcohol in vanilla or soaking syrups, lard in the pastry, or non-halal gelatine in mousse and fondant. Choose MUIS-certified or clearly Muslim-owned halal bakeries and verify on HalalSG." },
      { q: "How far ahead should I order a custom halal cake?", a: "Usually 3–7 days for standard designs, and longer for tiered or heavily decorated cakes. Many bakeries take a deposit to secure your date, so book early for weekends and festive periods." },
      { q: "Is a home-based halal bakery as safe as a certified one?", a: "Home-based bakers can be genuinely halal, but they’re self-declared rather than MUIS-certified. If certification matters for your event, ask directly about alcohol, gelatine and shortening, or choose a certified bakery for full assurance." },
      { q: "Can halal bakeries cater to allergies?", a: "Many can accommodate nut or other allergen requirements, but always confirm when ordering — especially for shared celebration cakes. Ask how they handle cross-contamination alongside your halal requirements." },
    ],
    related: ["best-halal-cafes-singapore", "how-to-check-muis-halal-certification"],
    dropcap: true,
    pullQuote: "“A cake is shared by everyone at the table — which is exactly why the ingredients deserve a second look.”",
    pullQuoteBy: "The Humble Halal Team",
  },
  {
    slug: "best-halal-breakfast-singapore",
    title: "Best Halal Breakfast Spots in Singapore",
    dek: "Ten verified halal and Muslim-owned breakfast and brunch spots, with current addresses, opening times and what to order.",
    answer:
      "For an early halal breakfast, start with All Things Delicious, Penny University, Small Batch or The Tree Café at 100AM. Weekend brunch standouts include The Secret Garden, Pancake & Waffle Place and Good Bites. Every place below was checked against a current first-party website or live venue source in July 2026; halal claims and outlet details are stated separately so you can choose with confidence.",
    datePublished: "2026-06-02",
    dateModified: "2026-07-16",
    author: AUTHOR,
    readMins: 13,
    tags: ["Breakfast", "Brunch", "Food guides", "Best of"],
    sections: [
      {
        h2: "How we chose these 10 breakfast spots",
        body: [
          "A useful breakfast list has to do more than repeat popular café names. We checked that each venue is operating, matched the address to a current outlet source, confirmed that it genuinely serves breakfast or brunch, and separated MUIS certification from Muslim-owned or halal-friendly claims. Opening hours and menus can still change, so use the links below and check again before a special trip.",
          "The ranking balances food, breakfast relevance, trust signals, location and variety. It includes early openers, weekend-only brunches and a few late-morning choices for readers who use “breakfast” and “brunch” interchangeably.",
        ],
        bullets: [
          "MUIS-certified means the specific operation says it holds official Singapore halal certification",
          "Muslim-owned is an ownership and trust signal, not the same as MUIS certification",
          "Halal-friendly is the venue’s own description and should be treated as self-declared",
        ],
      },
      {
        h2: "1. All Things Delicious — Arab Street",
        body: [
          "All Things Delicious is the strongest all-rounder on this list: it opens early, serves brunch all day and operates from a characterful Kampong Gelam shophouse. The bakery-café states that all its facilities and products are MUIS halal-certified, so it pairs a high-confidence halal signal with a genuinely breakfast-led menu.",
          "Go for shakshouka, brioche French toast, pastries or one of the substantial all-day brunch plates. It is especially convenient for a breakfast before exploring Sultan Mosque, Haji Lane and the rest of Kampong Gelam.",
        ],
        bullets: [
          "34 Arab Street, #01-01, Singapore 199733",
          "+65 6291 4252",
          "Daily, 8am–10pm; the venue says it closes on the last Monday of each month",
          "Halal status: MUIS halal-certified, according to the business",
        ],
        links: [
          { label: "View directory listing", href: "/business/all-things-delicious" },
          { label: "Official website", href: "https://restaurant.allthingsdelicious.sg/" },
          { label: "Instagram", href: "https://www.instagram.com/allthingsdelicioussg/" },
          { label: "TikTok", href: "https://www.tiktok.com/@allthingsdelicioussg" },
        ],
        socialUrl: "https://www.tiktok.com/@allthingsdelicioussg/video/7528376445261958407",
        socialLabel: "All Things Delicious on Arab Street",
      },
      {
        h2: "2. Penny University — Jalan Klapa",
        body: [
          "Penny University has moved on from the old East Coast address found in many older roundups. Its current flagship is at Jalan Klapa, where the specialty coffeehouse serves brunch from 8am to 4pm alongside a serious coffee programme.",
          "The menu covers Turkish eggs, several eggs Benedict variations, a Builder’s Breakfast, French toast, Moroccan baked eggs and chicken and waffles. This is the pick for diners who care as much about the coffee as the plate.",
        ],
        bullets: [
          "17 Jalan Klapa, Singapore 199329",
          "Second outlet: Wisma Geylang Serai, 1 Engku Aman Turn, #01-06, Singapore 408528",
          "Brunch is served from 8am–4pm; confirm each outlet’s closing time before visiting",
          "Halal status: presented as a halal specialty coffee and brunch café by the business",
        ],
        links: [
          { label: "View directory listing", href: "/business/penny-university-jalan-klapa" },
          { label: "Official website", href: "https://www.pennyuniversitysg.com/" },
          { label: "Brunch menu", href: "https://www.pennyuniversitysg.com/menu?menu=brunch" },
        ],
        socialUrl: "https://www.tiktok.com/@pennyuniversitysg/video/7453106439209454866",
        socialLabel: "Penny University brunch",
      },
      {
        h2: "3. Small Batch — Singapore Botanic Gardens",
        body: [
          "Small Batch earns its place for setting as much as food. It sits beside Jacob Ballas Children’s Garden and opens at 8am, making it an easy pairing with a morning walk or a family visit to the gardens.",
          "The Build Your Own Board lets you assemble eggs, proteins, vegetables and something sweet instead of committing to a fixed big breakfast. The Black Hole Group describes Small Batch as halal-friendly; that is a self-declared status rather than a MUIS certification claim.",
        ],
        bullets: [
          "1H Cluny Road, #01-K1, Jacob Ballas Children’s Garden, Singapore 259604",
          "ask@batch.sg",
          "Tuesday–Friday, 8am–5pm; Saturday–Sunday, 8am–6pm; closed Monday except public holidays",
          "Halal status: halal-friendly, according to the business",
        ],
        links: [
          { label: "View directory listing", href: "/business/small-batch-botanic-gardens" },
          { label: "Official website", href: "https://www.batch.sg/" },
        ],
      },
      {
        h2: "4. The Secret Garden by Zeekri — Baghdad Street",
        body: [
          "The Secret Garden is the refined weekend choice: a floral French-inspired brasserie with a dedicated Saturday and Sunday brunch menu. The Garden Breakfast, French omelette, smoked salmon eggs Benedict, Croque Madame and buckwheat French Fold make this one of the more distinctive halal brunch menus in Kampong Gelam.",
          "The restaurant identifies itself as a Muslim-owned establishment certified by the Singapore Malay Chamber of Commerce and Industry. That is not the same scheme as MUIS halal certification, so we label it Muslim-owned rather than MUIS-certified.",
        ],
        bullets: [
          "19 Baghdad Street, #01-19, Singapore 199658",
          "+65 6980 3330; reservations +65 9189 5663; info@tsgbyzeekri.com",
          "Pastry and coffee daily from 9am; weekend brunch Saturday–Sunday, 9am–12.30pm",
          "Halal status: Muslim-owned; SMCCI Muslim-Owned Establishment listing stated by the business",
        ],
        links: [
          { label: "View directory listing", href: "/business/the-secret-garden-by-zeekri" },
          { label: "Official website", href: "https://www.tsgbyzeekri.com/" },
          { label: "Brunch menu", href: "https://www.tsgbyzeekri.com/menu" },
          { label: "Social links", href: "https://linktr.ee/tsgbyzeekri" },
        ],
      },
      {
        h2: "5. Pancake & Waffle Place — Kandahar Street",
        body: [
          "Pancake & Waffle Place is built for a proper weekend breakfast rather than a token brunch section. Its Saturday and Sunday breakfast menu lets you choose pancakes or waffles with sambal baked beans, Florentine eggs, beef sausage and beef bacon, country fried chicken, Turkish eggs or kaya and soft-boiled eggs.",
          "The restaurant states that it is 100% Muslim-owned and serves halal food. It is also close enough to Sultan Mosque to work naturally into a Kampong Gelam morning.",
        ],
        bullets: [
          "56 Kandahar Street, Singapore 198904",
          "+65 6518 9368; WhatsApp +65 8453 0523",
          "Weekend breakfast Saturday–Sunday, 9am–12pm; venue open noon–10pm weekdays and 9am–10pm weekends",
          "Halal status: 100% Muslim-owned, according to the business",
        ],
        links: [
          { label: "View directory listing", href: "/business/pancake-and-waffle-place" },
          { label: "Official website", href: "https://www.pancakeandwaffleplace.com.sg/" },
        ],
      },
      {
        h2: "6. Good Bites — Bishan Sports Hall",
        body: [
          "Good Bites is the heartland option with unusually long hours. On weekends it opens at 9am and serves brunch plates such as a full breakfast-style waffle, chicken and waffles, pasta, burgers and desserts; it then stays open into the early morning for the supper crowd.",
          "The venue is commonly presented as halal-certified, but certification is outlet-specific and changes over time. Check the displayed certificate or HalalSG listing if you require current MUIS confirmation.",
        ],
        bullets: [
          "5 Bishan Street 14, #03-01, Bishan Sports Hall, Singapore 579783",
          "+65 6970 0233; hello@goodbites.com.sg",
          "Monday–Friday, 11am–5am; Saturday–Sunday and public holidays, 9am–5am; last order is earlier",
          "Halal status: venue is presented as halal-certified; verify the current outlet record before visiting",
        ],
        links: [
          { label: "View directory listing", href: "/business/good-bites-bishan" },
          { label: "Official website", href: "https://www.goodbites.com.sg/" },
          { label: "Instagram", href: "https://www.instagram.com/goodbitessg/" },
        ],
      },
      {
        h2: "7. The Tree Café — 100AM Mall",
        body: [
          "For this guide, choose The Tree Café at 100AM rather than the better-known Century Square branch: 100AM is the outlet with a dedicated 8am to 10am breakfast menu. It is a practical CBD option for local breakfast dishes before work, while the wider menu continues into the day.",
          "The brand says its outlets are halal-certified except 100AM, which is pending certification. That makes this specific breakfast outlet a lower-confidence choice until the certification is complete, and the distinction matters.",
        ],
        bullets: [
          "100 Tras Street, #01-01, 100AM Mall, Singapore 079027",
          "+65 8027 1776; thetreecafesg@gmail.com",
          "Breakfast menu, 8am–10am; main opening hours listed as 11am–9.30pm",
          "Halal status: 100AM pending certification, according to the brand; other listed outlets are stated as certified",
        ],
        links: [
          { label: "View directory listing", href: "/business/the-tree-cafe-100am" },
          { label: "Official website", href: "https://www.thetreecafesg.com/" },
          { label: "Instagram", href: "https://www.instagram.com/thetreecafesg/" },
          { label: "TikTok", href: "https://www.tiktok.com/@thetreecafesg" },
        ],
      },
      {
        h2: "8. Wooly’s Bagels — Arab Street",
        body: [
          "Wooly’s is a strong late-breakfast choice when you want something portable and filling. The Muslim-owned bagel shop is known for oversized combinations such as the GTFBagel with chicken ham, scrambled egg, hash brown and truffle mayonnaise, plus an otah bagel with egg and coconut chilli mayonnaise.",
          "It opens at 10.30am, so this is brunch rather than an early start. The Arab Street location also makes it an easy alternative when the traditional breakfast window has already passed.",
        ],
        bullets: [
          "27 Arab Street, Singapore 199726",
          "Daily, 10.30am–8.30pm",
          "Halal status: Muslim-owned",
          "Best for: filled bagels, takeaway brunch and Kampong Gelam café hopping",
        ],
        links: [
          { label: "View directory listing", href: "/business/woolys-bagels-arab-street" },
          { label: "Instagram", href: "https://www.instagram.com/woolysbagels/" },
        ],
      },
      {
        h2: "9. Fika Swedish Café & Bistro — Beach Road",
        body: [
          "Fika brings something different to the list: Muslim-owned Swedish food in a cosy two-storey shophouse. Swedish pancakes, waffles, pastries and coffee make sense for a late breakfast, while the meatballs and savoury Scandinavian plates suit a more substantial brunch.",
          "The café opens at 11am, so do not choose it for an early morning meal. Fika’s official site states that it is owned and operated by Muslims.",
        ],
        bullets: [
          "257 Beach Road, Singapore 199539",
          "+65 6396 9096; info@fikacafe.com",
          "Sunday–Thursday, 11am–9pm; Friday–Saturday, 11am–10pm",
          "Halal status: Muslim-owned, according to the business",
        ],
        links: [
          { label: "View directory listing", href: "/business/fika-swedish-cafe-beach-road" },
          { label: "Official website", href: "https://www.fikacafe.com/" },
          { label: "Instagram", href: "https://www.instagram.com/fikacafesg/" },
        ],
      },
      {
        h2: "10. The Malayan Council — Bussorah Street",
        body: [
          "The Malayan Council is the indulgent late-brunch entry. It is better known for Malay-Western comfort food, large sharing plates and cakes than for an early breakfast service, but the Bussorah branch works for groups that want their first meal closer to lunchtime.",
          "The restaurant describes itself as halal dining, and the current Bussorah outlet opens at 11am. Choose this for a substantial group meal, not coffee at sunrise.",
        ],
        bullets: [
          "71 Bussorah Street, Singapore 199484",
          "Daily, 11am–11pm",
          "Halal status: presented as halal dining by the business",
          "Best for: generous fusion plates, group brunch and cakes",
        ],
        links: [
          { label: "View directory listing", href: "/business/the-malayan-council-bussorah" },
          { label: "Official website", href: "https://themalayancouncil.sg/" },
          { label: "Instagram", href: "https://www.instagram.com/themalayancouncil.sg/" },
        ],
      },
    ],
    faq: [
      { q: "What is the best early halal breakfast café in Singapore?", a: "All Things Delicious opens at 8am daily, Penny University serves brunch from 8am, and Small Batch opens at 8am from Tuesday to Sunday. The Tree Café at 100AM advertises an 8am–10am breakfast menu, but says that outlet’s halal certification is pending." },
      { q: "Which halal breakfast places are open on weekends?", a: "All Things Delicious, Penny University, Small Batch, The Secret Garden, Pancake & Waffle Place and Good Bites all serve breakfast or brunch on weekends. Check same-day hours before travelling because public-holiday and private-event schedules can change." },
      { q: "Which breakfast spots are MUIS halal-certified?", a: "All Things Delicious explicitly states that its facilities and products are MUIS halal-certified. Other entries may be Muslim-owned, self-described as halal or halal-friendly, or pending outlet certification. Always confirm the exact outlet on the official HalalSG register when current MUIS certification is important to you." },
      { q: "Is Muslim-owned the same as MUIS halal-certified?", a: "No. Muslim-owned identifies the ownership of a business; MUIS certification is an official audit and certificate for a specific operation or outlet. Both are useful signals, but they should not be presented as interchangeable." },
      { q: "Where can I get halal pancakes or waffles for breakfast?", a: "Pancake & Waffle Place serves a dedicated breakfast menu from 9am to noon on Saturdays and Sundays. Good Bites also serves weekend brunch and chicken and waffles, while Fika offers Swedish pancakes and waffles from 11am." },
      { q: "How current are the addresses and hours in this guide?", a: "The venue details were checked against current first-party websites or live venue sources on 16 July 2026. Restaurants can still change hours, menus and certification, so follow the official link and verify again before a special journey." },
    ],
    related: ["best-halal-restaurants-singapore-2026", "best-halal-cafes-singapore"],
    dropcap: true,
    pullQuote: "“A useful breakfast guide tells you not only what to order, but which outlet, what time and what its halal claim actually means.”",
    pullQuoteBy: "The Humble Halal Team",
  },
  {
    slug: "halal-food-jewel-changi-airport",
    title: "Halal Food at Jewel Changi Airport",
    dek: "Where to find halal food at Jewel Changi Airport and across the terminals — certified and Muslim-friendly options, plus prayer rooms and travel tips.",
    answer:
      "Jewel Changi Airport and the four terminals have plenty of halal and Muslim-friendly food — local hawker-style stalls, fast-food chains, cafés and international restaurants. Because certification is outlet-specific, look for the MUIS certificate at each outlet, confirm it on the MUIS HalalSG register, or check the halal-confidence score on Humble Halal before you go.",
    datePublished: "2026-06-01",
    dateModified: "2026-07-06",
    author: AUTHOR,
    readMins: 7,
    tags: ["Malls", "Jewel", "Food guides", "Changi"],
    sections: [
      { h2: "Eating halal at Jewel and the Changi terminals",
        body: ["Jewel sits between the terminals, wrapped around the Rain Vortex, and its dining floors are some of the busiest in Singapore. It is also genuinely easy to eat halal here — the food halls, casual chains and sit-down restaurants include a good spread of certified and Muslim-friendly choices.",
               "Getting there is simple: the Changi Airport MRT station and the Jewel link bridges connect the terminals, so you can graze at Jewel before check-in or on a layover. Just remember the split between landside (public) areas anyone can visit and the transit zone past immigration — once you are airside, you are limited to that terminal’s outlets, so plan your meal around where you actually are."] },
      { h2: "What to eat, by type",
        body: ["The halal options at Jewel and the terminals fall into a few broad buckets. Knowing the type helps you set expectations on price and how to verify — a certified local stall is a different proposition from an international chain that certifies branch by branch."],
        bullets: ["Local hawker-style — nasi lemak, chicken rice, laksa and Malay economy rice at the food halls",
                  "Fast-food & quick chains — burgers, fried chicken and rice bowls, often certified at some branches only",
                  "Cafés & bakeries — coffee, cakes and light bites where you should still check the certificate",
                  "International & sit-down — Middle Eastern, Japanese, Korean and Western, verified outlet by outlet"] },
      { h2: "Certified vs pork-free at the airport",
        body: ["The single most useful habit at any airport mall is to separate MUIS-certified from merely pork-free. A “no pork, no lard” sign is self-declared — it tells you two ingredients are absent, not that the whole kitchen, supply chain and utensils are certified. Certification is also outlet-specific: a chain can be certified at one location and not at another, so the brand name alone is never proof.",
               "Certified is the only official verification in Singapore. Where an outlet is not certified but is Muslim-owned or admin-verified, that still carries weight — it simply sits lower than certified on the halal-confidence score, and the choice is yours."],
        bullets: ["Look for the physical MUIS certificate displayed at the specific outlet",
                  "Treat “pork-free” and “Muslim-friendly” as helpful signals, not certification",
                  "Verify chains outlet-by-outlet — one branch being certified does not cover the airport branch",
                  "Check the halal-confidence score (0–100) on Humble Halal before you commit"] },
      { h2: "Prayer rooms across the terminals",
        body: ["Changi Airport makes prayer straightforward: each terminal has dedicated Muslim prayer rooms, so you can pray comfortably before a flight or during a layover. They are signposted within the terminals, and the transit areas have their own facilities for passengers who have already cleared immigration.",
               "If you are meeting family landside at Jewel, it is worth checking the terminal directory on arrival so you know the nearest room — handy when you are timing prayer around boarding or a meal."] },
      { h2: "For travellers and families",
        body: ["Airport eating is usually against the clock, and a little planning removes the stress — especially with children, an early flight or a tight connection."],
        bullets: ["Before a flight — shortlist a certified outlet near your gate or terminal in advance",
                  "Families — food halls suit fussy eaters and give everyone a certified choice in one spot",
                  "Layovers — stay landside at Jewel for the widest halal spread, airside for speed",
                  "Suhoor or odd hours — check the “Open now” filter, as airport trading hours vary by outlet"] },
      { h2: "Plan it with Humble Halal",
        body: ["Rather than wander the dining floors hoping for a certificate, plan before you arrive. Browse the halal directory on Humble Halal, filter by the Jewel and Changi area, and open the map to see what is near your terminal. Sort by halal-confidence score to lead with certified outlets, use the “Open now” filter for early or late flights, and check the “Is it halal?” brand checker if you are unsure about a particular chain — so your first meal of the trip is one you can trust."] },
    ],
    faq: [
      { q: "Is there halal food at Jewel Changi Airport?", a: "Yes — Jewel and the terminals have several halal and Muslim-friendly outlets, from local hawker-style stalls to chains and sit-down restaurants. Certification is outlet-specific, so look for the MUIS certificate at each outlet and confirm it on the MUIS HalalSG register." },
      { q: "Which outlets at Changi Airport are halal-certified?", a: "Certification is outlet-specific and can change over time. Check the displayed MUIS certificate at the specific outlet, or search that outlet on the MUIS HalalSG register. On Humble Halal you can sort by halal-confidence score to lead with certified options." },
      { q: "Is there halal food in the transit area past immigration?", a: "Yes, each terminal’s transit zone has its own outlets, but once you are airside you can only use that terminal’s options. For the widest halal spread, eat landside at Jewel before you clear immigration." },
      { q: "Are there prayer rooms at Changi Airport?", a: "Yes — each terminal has dedicated Muslim prayer rooms, both landside and in the transit areas. They are signposted within the terminals, so check the terminal directory on arrival for the nearest one." },
      { q: "Is a “pork-free” outlet at the airport the same as halal?", a: "No. “Pork-free” or “no pork, no lard” is self-declared and only means those ingredients are absent. It is not MUIS certification, which verifies the whole kitchen and supply chain. Always confirm the specific outlet on MUIS HalalSG." },
    ],
    related: ["halal-food-bugis-arab-street", "best-halal-restaurants-singapore-2026"],
    dropcap: true,
    pullQuote: "“At an airport the brand name is never proof — certification is outlet-specific, so check the certificate at that door.”",
    pullQuoteBy: "The Humble Halal Team",
  },
  {
    slug: "is-it-halal-how-to-tell-singapore",
    title: "Is It Halal? How to Tell in Singapore (Gelatin & More)",
    dek: "A practical guide to checking if a food, ingredient or brand is halal in Singapore — certification, labels, gelatine, kombucha, alcohol in cooking, and more.",
    answer:
      "To tell if something is halal in Singapore, check whether it holds MUIS certification on the HalalSG register, and watch for non-halal ingredients like pork-derived gelatine, alcohol used in cooking, and non-halal meat. When in doubt, treat it as not certified and verify on MUIS HalalSG. For popular brands, start with Humble Halal’s “Is it halal?” checker.",
    datePublished: "2026-05-31",
    dateModified: "2026-07-06",
    author: AUTHOR,
    readMins: 7,
    tags: ["Halal basics", "How-to", "Guides"],
    sections: [
      { h2: "Start with certification",
        body: ["The fastest, most reliable check is the MUIS HalalSG register. If a food product or eatery is certified, it’s listed there. If it isn’t listed, it isn’t MUIS-certified — regardless of any “no pork” signage or a Muslim-sounding name. Certification is outlet-specific and expires, so check the exact business or product rather than assuming a brand is halal everywhere it appears."] },
      { h2: "Reading labels & E-numbers",
        body: ["For packaged food, the ingredient list is your next best tool. A few additives are commonly animal-derived and worth a closer look, though many are plant- or synthetic-sourced too — which is exactly why certification, which traces the actual source, beats guessing from a label alone."],
        bullets: ["E471 (mono- and diglycerides) — can be animal- or plant-derived",
                  "L-cysteine (E920) — a dough conditioner, sometimes animal-sourced",
                  "Gelatine — often pork-derived unless stated as beef or fish",
                  "Rennet — in some cheeses, can be non-halal animal enzyme",
                  "“Emulsifier”, “enzyme” or “shortening” with no source named"] },
      { h2: "The tricky ingredients",
        body: ["Beyond pork itself, a handful of ingredients quietly make a dish non-halal even at a “no pork” stall. Alcohol in cooking is the big one — mirin, Shaoxing and cooking wine, rum in desserts, and vanilla extract can all carry it. Fermented drinks like kombucha contain trace alcohol and views differ, so certification settles it. Non-halal meat, broth and stock, and animal-derived emulsifiers or enzymes round out the list."],
        bullets: ["Alcohol in cooking — mirin, cooking wine, rum, some vanilla extract",
                  "Kombucha & fermented drinks — trace alcohol; check certification",
                  "Soy sauce — some varieties are brewed with added alcohol",
                  "Non-halal meat, broth or stock — even without any pork",
                  "Cross-contamination — shared fryers, grills and utensils"] },
      { h2: "Eating out vs packaged products",
        body: ["The two situations call for slightly different habits. For packaged products, read the label and look for the MUIS mark or an approved overseas certification recognised by MUIS. For eateries, the register is what counts — a certified outlet has been assessed end to end, while a “Muslim-owned” or “no pork, no lard” place is self-declared. Remember the nuance: MUIS-certified is not the same as Muslim-owned, which is not the same as self-declared halal-friendly."] },
      { h2: "Is [brand] halal? Using the checker",
        body: ["For specific brands and products, Humble Halal maintains an “Is it halal?” checker that cites the MUIS HalalSG status of popular Singapore food brands. Use it as a fast starting point, then confirm on the official register — because a brand can be certified for some products or outlets and not others. To search HalalSG directly, look up the exact company or product name and check the certificate is current."] },
      { h2: "When in doubt, default to not certified",
        body: ["If a label is ambiguous, a dish’s cooking method is unclear, or a place only claims “no pork, no lard”, the safest call is to treat it as not certified until you can verify. This isn’t about being difficult — it’s the same principle MUIS certification is built on: verify the source rather than assume. On Humble Halal, the halal-confidence score (0–100) makes that judgement quicker, ranking MUIS-certified highest, then admin-verified or Muslim-owned, then self-declared."] },
    ],
    faq: [
      { q: "Is gelatin halal?", a: "Gelatine is often pork-derived and therefore not halal, but halal versions made from beef or fish gelatine exist. Check the product’s certification or the stated source — if it just says “gelatine” with no source, treat it as unverified." },
      { q: "Is kombucha halal?", a: "Kombucha contains trace alcohol from fermentation, and scholarly views differ. Some products are certified halal and others are not, so check the specific product and its certification rather than assuming." },
      { q: "Is vanilla extract halal?", a: "Traditional vanilla extract is made with alcohol, which can make a bake non-halal. Halal bakeries use alcohol-free vanilla or vanilla paste. For packaged goods, check the ingredient list or look for certification." },
      { q: "Is soy sauce halal?", a: "Many soy sauces are fine, but some are brewed with added alcohol or list it among the ingredients. Check the label for alcohol content, or choose a MUIS-certified soy sauce to be sure." },
      { q: "Is cheese halal?", a: "It depends on the rennet used. Cheese made with non-halal animal rennet isn’t halal, while cheese using microbial or halal rennet is. Look for certification or a clearly stated rennet source." },
      { q: "How do I know if a brand is halal?", a: "Check the brand on the MUIS HalalSG register, or start with Humble Halal’s “Is it halal?” checker, which cites each brand’s certification status. Certification can be product- or outlet-specific, so always confirm the current certificate on HalalSG." },
    ],
    related: ["what-is-halal-singapore", "how-to-check-muis-halal-certification"],
    dropcap: true,
    pullQuote: "“When something looks ambiguous, treat it as not certified — and verify at the source.”",
    pullQuoteBy: "The Humble Halal Team",
  },
  {
    slug: "halal-food-bugis-arab-street",
    title: "Halal Food at Bugis & Arab Street",
    dek: "The halal food heartland — Bugis, Kampong Glam, Arab Street and Haji Lane, from Middle Eastern grills to Malay heritage and modern cafés.",
    answer:
      "Bugis, Kampong Glam and Arab Street are among Singapore’s best areas for halal food — Middle Eastern grills, Turkish kebabs, Malay heritage kitchens, Indian-Muslim classics, shisha cafés and modern dessert spots, many MUIS-certified or Muslim-owned. From Bugis MRT it is a short walk. Browse the area on Humble Halal and sort by halal-confidence score to plan.",
    datePublished: "2026-05-30",
    dateModified: "2026-07-06",
    author: AUTHOR,
    readMins: 7,
    tags: ["Bugis", "Areas", "Food guides", "Kampong Glam"],
    sections: [
      { h2: "A halal food heartland — and how to get there",
        body: ["Around Kampong Glam, the Sultan Mosque and Arab Street, halal food is everywhere. This is one of the easiest neighbourhoods in Singapore to eat well as a Muslim — heritage Malay kitchens sit beside Middle Eastern grills, Turkish dessert counters and photogenic cafés along Haji Lane and Bussorah Street.",
               "Getting there is easy: Bugis MRT puts you a few minutes’ walk from the arch into Kampong Glam, with the mosque as your landmark. From there the streets are compact and walkable, so you can wander from a grill house to a coffee spot without hopping on transport — ideal for grazing across an afternoon or evening."] },
      { h2: "What to eat, by type",
        body: ["The joy of this area is range. Within a few streets you can move from a charcoal grill to a Malay rice spread to baklava and coffee, and much of it is either certified or Muslim-owned. Knowing the type helps you set expectations and check the right things."],
        bullets: ["Middle Eastern grills & mezze — kebabs, shawarma, hummus and grilled meats",
                  "Turkish kebabs & baklava — döner, pide and syrup-soaked desserts",
                  "Malay heritage & nasi padang — heartland classics and generous rice spreads",
                  "Indian-Muslim — biryani, murtabak and prata for a hearty, quick meal",
                  "Shisha cafés & modern dessert spots — late-night lounging and photogenic sweets"] },
      { h2: "Certified vs Muslim-owned here",
        body: ["Kampong Glam is heavily Muslim-owned, which is reassuring — but Muslim-owned and MUIS-certified are not the same thing. Certification verifies the whole kitchen, ingredients and supply chain; ownership tells you who runs the place. Both are meaningful, and certified simply sits highest on the halal-confidence score.",
               "Watch the usual quiet culprits even at a Muslim-owned spot: alcohol used in cooking, gelatine in desserts, or non-halal meat at a café that is not certified. When in doubt, ask, and confirm the specific outlet rather than assuming the whole street is uniform."],
        bullets: ["Certified — look for the displayed MUIS certificate at that outlet",
                  "Muslim-owned — a strong signal, but verify how the food is prepared",
                  "Modern cafés — check desserts and sauces for alcohol or gelatine",
                  "Confirm the specific outlet on the MUIS HalalSG register before a big meal"] },
      { h2: "Prayer at Sultan Mosque and nearby",
        body: ["Few food areas make prayer this convenient. The Sultan Mosque anchors Kampong Glam and is an easy stop between meals, with smaller suraus and prayer spaces dotted around the district. That makes the area especially comfortable for long, unhurried visits — a grill dinner, a walk, prayer, then dessert and coffee without needing to travel."] },
      { h2: "By occasion — dates, groups and Ramadan",
        body: ["The “right” spot depends on why you are out. Kampong Glam flexes from a quiet two-person dinner to a big group feast, and it comes alive during the fasting month."],
        bullets: ["Date night — atmospheric grills and dessert cafés along the quieter lanes",
                  "Groups & family — Malay rice spreads and mezze platters built for sharing",
                  "Ramadan — the nearby Geylang Serai bazaar and iftar crowds make evenings buzz; book ahead",
                  "Casual hangs — shisha cafés and coffee spots for lingering after a meal"] },
      { h2: "Plan it with Humble Halal",
        body: ["Instead of relying on a static list, plan with the directory. Browse the Bugis and Kampong Glam area on Humble Halal, filter by cuisine, and open the map to see grills, cafés and heritage kitchens clustered around the mosque. Sort by halal-confidence score to lead with certified outlets, use the “Open now” filter for late-night dessert runs, and check the “Is it halal?” brand checker if you are unsure — so every stop on your Arab Street crawl is one you can trust."] },
    ],
    faq: [
      { q: "Is Arab Street good for halal food?", a: "Yes — Arab Street and Kampong Glam are among Singapore’s best areas for halal food, with many Middle Eastern, Turkish, Malay and Muslim-owned options. Certification is still outlet-specific, so confirm the outlet on the MUIS HalalSG register." },
      { q: "Where is halal food in Bugis?", a: "Bugis sits right next to Kampong Glam and Arab Street, a short walk from Bugis MRT, where halal eateries are dense. Browse the area on Humble Halal and sort by halal-confidence score or rating to plan your route." },
      { q: "Is all the food in Kampong Glam halal?", a: "Not automatically. The area is heavily Muslim-owned, but Muslim-owned is not the same as MUIS-certified, and some cafés are neither. Check the certificate at the specific outlet and watch desserts and sauces for alcohol or gelatine." },
      { q: "Is there a mosque nearby for prayers?", a: "Yes — the Sultan Mosque anchors Kampong Glam, with smaller suraus and prayer spaces around the district. That makes it easy to pray between meals during a long visit." },
      { q: "Is Kampong Glam good during Ramadan?", a: "Very — evenings buzz with iftar crowds, and the nearby Geylang Serai Ramadan bazaar adds to the atmosphere. Popular spots fill up fast, so arrive early or book ahead for breaking fast." },
    ],
    related: ["halal-food-jewel-changi-airport", "best-halal-restaurants-singapore-2026"],
    dropcap: true,
    pullQuote: "“Kampong Glam is heavily Muslim-owned — but Muslim-owned and MUIS-certified are not the same thing, so it still pays to check.”",
    pullQuoteBy: "The Humble Halal Team",
  },
  {
    slug: "halal-catering-singapore-guide",
    title: "Halal Catering in Singapore: Costs, Menus & Caterers",
    dek: "How to choose a halal caterer for weddings, corporate events and gatherings — service styles, what to budget, and exactly what to check before you book.",
    answer:
      "Halal catering in Singapore spans buffets, live stations, mini-buffets, bento sets and full wedding spreads from MUIS-certified caterers. Costs vary by menu tier, headcount and service style. Always confirm the caterer’s MUIS certification on the HalalSG register, request itemised quotes, and book months ahead for Hari Raya and wedding season.",
    datePublished: "2026-05-29",
    dateModified: "2026-07-06",
    author: AUTHOR,
    readMins: 8,
    tags: ["Catering", "Events", "Guides"],
    sections: [
      { h2: "Why halal catering needs its own checklist",
        body: ["Ordering food for a crowd raises the stakes: you’re vouching for every guest at the table. A caterer that runs a certified kitchen has been assessed by MUIS across ingredients, storage, preparation and the whole supply chain — not just the headline dishes. That matters most for large orders, where one non-halal sauce, stock or dessert can affect a hundred plates.",
               "This guide keeps things evergreen and practical: the service styles on offer, what different events need, ballpark budgets, and the questions that separate a confident booking from a stressful one. On Humble Halal, every caterer carries a halal-confidence score (0–100) so you can see verification status at a glance before you enquire."] },
      { h2: "Service styles: buffet, mini-buffet, bento and more",
        body: ["Most caterers offer several formats, and the right one depends on your headcount, venue and how hands-on you want to be. Buffets and live stations suit celebrations; packed meals and bento sets suit offices and tight timelines; canapés work for receptions and networking. Confirm the caterer is certified for the format you choose, since some run separate menus for different services."],
        bullets: ["Buffet & live stations — showpiece spreads with satay, prata or carving stations",
                  "Mini-buffet — a scaled-down buffet for smaller home gatherings",
                  "Bento & packed meals — individually portioned, ideal for offices and events",
                  "Canapés & finger food — receptions, launches and networking sessions",
                  "Full wedding & kenduri catering — large-table Malay spreads with setup and staff"] },
      { h2: "Halal catering by event type",
        body: ["What you need shifts with the occasion. A wedding wants abundance and flow; a corporate lunch wants punctuality and clean packaging; a tahlil or aqiqah wants respectful, fuss-free service. Tell the caterer the event type upfront — experienced halal caterers will steer portions, menu and setup accordingly."],
        bullets: ["Weddings & kenduri — Nasi Padang-style spreads, live stations, generous portions",
                  "Corporate & office lunch — bento sets or mini-buffets delivered on a tight schedule",
                  "Birthdays & aqiqah — buffets or packed meals scaled to family and friends",
                  "Funerals & tahlil — simple, prompt, respectful catering with minimal setup",
                  "Hari Raya open house — rolling buffets that hold well as guests come and go"] },
      { h2: "What to budget for",
        body: ["Pricing depends on menu tier, headcount and service style. As a rough guide, packed meals and bento sets typically sit at the lower end per head, mini-buffets in the middle, and live-station or wedding buffets at the top. Most caterers set a minimum headcount or minimum spend, so small orders can cost more per person than you’d expect.",
               "Beyond the food, ask what’s included and what’s extra: delivery, setup and clearing, service staff, chafing dishes or live-station equipment, and GST. An itemised quote makes it easy to compare caterers fairly rather than being drawn in by a low per-head number that excludes the essentials."],
        bullets: ["Per-head food cost by tier (packed meal → mini-buffet → live-station buffet)",
                  "Minimum headcount or minimum order value",
                  "Delivery, setup, clearing and any service-staff charges",
                  "Equipment — chafing dishes, live-station gear, disposables",
                  "GST and any peak-date or weekend surcharge"] },
      { h2: "How to choose your caterer",
        body: ["Trust first, taste second. Confirm the caterer’s MUIS certification on the HalalSG register — certification is outlet-specific and expires, so check the exact business rather than assuming. From there, weigh reviews, portion sizes, whether a tasting is offered, and the halal-confidence score. Remember the nuance: MUIS-certified is not the same as Muslim-owned, which is not the same as a self-declared “no pork, no lard” kitchen."],
        bullets: ["Confirm MUIS certification for the specific caterer on HalalSG",
                  "Check the halal-confidence score and recent reviews on Humble Halal",
                  "Ask for a tasting for weddings and large bookings",
                  "Clarify portion sizes per pax so you don’t under-order",
                  "Prefer certified over “no pork, no lard” when serving mixed guests"] },
      { h2: "Questions to ask before you book",
        body: ["A few pointed questions save a lot of event-day worry. Good caterers answer them without hesitation, and their responses tell you how organised the operation really is."],
        bullets: ["Is your MUIS certification current, and under which entity name?",
                  "What’s the final headcount deadline and cancellation policy?",
                  "Are delivery, setup, clearing and staff included in the quote?",
                  "How far in advance do I need to confirm for my date?",
                  "Can you cater for allergies or other dietary needs alongside the main menu?"] },
      { h2: "Booking peak dates and requesting quotes",
        body: ["Hari Raya, the wedding season and long weekends are when good caterers fill up first — popular dates can go months ahead, so lock yours in early and reconfirm the details closer to the day. Rather than chasing phone numbers, browse halal caterers on Humble Halal, filter by area and certification, compare halal-confidence scores, and request quotes from a shortlist in one place. Get everything itemised in writing before you commit."] },
    ],
    faq: [
      { q: "How much does halal catering cost in Singapore?", a: "It varies widely by menu, headcount and service style. Packed meals and bento sets typically sit at the lower end per head, while live-station and wedding buffets are premium. Always request an itemised quote covering food, delivery, setup, staff and GST." },
      { q: "How do I find a halal caterer?", a: "Browse halal caterers on Humble Halal, filter by area and certification, and compare halal-confidence scores. Shortlist a few, request quotes, and confirm each caterer’s MUIS certification on the HalalSG register before booking." },
      { q: "Is halal corporate catering different from event catering?", a: "The food can be similar, but corporate orders lean towards bento sets or mini-buffets delivered on a tight schedule with clean packaging, while event catering favours buffets and live stations with setup and service staff. Tell the caterer the event type so they scale it correctly." },
      { q: "How far ahead should I book halal catering?", a: "For everyday orders, a week or two is usually enough. For weddings, Hari Raya and peak weekends, book months ahead — popular caterers and dates sell out early. Reconfirm the final headcount and details closer to the event." },
      { q: "Is a “no pork, no lard” caterer the same as halal-certified?", a: "No. “No pork, no lard” is self-declared and only speaks to those two ingredients. MUIS certification verifies the whole kitchen, ingredients and supply chain. When serving mixed guests, prefer a MUIS-certified caterer and confirm on HalalSG." },
      { q: "Do halal caterers charge for delivery and setup?", a: "Often, yes — delivery, setup, clearing, service staff and equipment can be billed separately from the per-head food price, along with GST. Ask for an itemised quote so you can compare caterers on a like-for-like basis." },
    ],
    related: ["halal-buffet-guide-singapore", "best-halal-restaurants-singapore-2026"],
    dropcap: true,
    pullQuote: "“Trust first, taste second — confirm the certification for the exact caterer, then let the menu win you over.”",
    pullQuoteBy: "The Humble Halal Team",
  },
  {
    slug: "ramadan-singapore-2026-guide",
    title: "Ramadan in Singapore 2026: Bazaars, Iftar & Suhoor",
    dek: "Your guide to Ramadan in Singapore — bazaars, iftar buffets, suhoor spots, terawih at the mosque, and breaking fast with the community.",
    answer:
      "During Ramadan in Singapore, the Geylang Serai and neighbourhood bazaars return with food and festive shopping, hotels and restaurants run iftar buffets, and many eateries open late for suhoor. Book iftar buffets early — they sell out — and use Humble Halal’s “Open now” filter for late-night suhoor. Check current-year dates closer to the season.",
    datePublished: "2026-05-28",
    dateModified: "2026-07-06",
    author: AUTHOR,
    readMins: 7,
    tags: ["Ramadan", "Seasonal", "Guides"],
    sections: [
      { h2: "What to expect for Ramadan 2026",
        body: ["Ramadan is the Islamic month of fasting from dawn to sunset, and in Singapore it reshapes the food calendar for a few weeks. Expect bustling bazaars, special iftar menus, later opening hours and fuller mosques for nightly terawih prayers. The exact dates shift each year with the lunar calendar — Ramadan 2026 is expected around late February into March, but always check current-year dates closer to the season, as they depend on the moon sighting.",
               "Whether you’re fasting or simply joining friends to break fast, a little planning goes a long way. The most popular buffets and bazaar weekends get busy fast, so the earlier you sort your bookings, the smoother the month feels."] },
      { h2: "The bazaars",
        body: ["Ramadan bazaars are a highlight of the season. The most famous fills Geylang Serai with rows of food stalls, festive snacks, drinks and Hari Raya shopping in the lead-up to Aidilfitri, but smaller neighbourhood bazaars pop up across the heartlands too. They’re a great place to gather food for iftar, though certification varies stall to stall — look for MUIS certificates or clearly Muslim-run stalls if that matters to you."],
        bullets: ["Geylang Serai — the largest bazaar, food plus festive shopping",
                  "Neighbourhood bazaars across the heartlands and near MRT hubs",
                  "Trending snacks, grilled meats, drinks and traditional kueh",
                  "Baju Raya, decor and gifts as Hari Raya approaches"] },
      { h2: "Iftar & buka puasa buffets",
        body: ["Many hotels and restaurants run special iftar (buka puasa) buffets through the month, from mid-range spreads to lavish hotel feasts. They’re popular and sell out, so book early — especially for weekends and larger groups. Price tiers vary widely, so decide your budget first, then confirm the venue holds a valid MUIS certificate before you reserve, since seasonal pop-ups aren’t always certified."],
        bullets: ["Book early — weekend and group slots go first",
                  "Compare price tiers before committing",
                  "Confirm the venue’s MUIS certification on HalalSG",
                  "Check timing so food is served right at the break of fast"] },
      { h2: "Suhoor & open-late spots",
        body: ["Suhoor is the pre-dawn meal before the fast begins, and plenty of eateries stay open late or around the clock to serve it. Rather than guessing what’s still open at 3am, use the “Open now” filter on Humble Halal to find late-night halal options near you, and check the halal-confidence score before a big group booking."],
        bullets: ["Use the “Open now” filter late at night",
                  "Look for 24-hour and open-late eateries",
                  "Plan routes around MRT and night-bus timings",
                  "Check certification and score before large group orders"] },
      { h2: "Prayer & terawih at the mosque",
        body: ["Ramadan nights come alive at the mosque, where congregations gather for terawih prayers after Isyak. Many diners plan iftar around a nearby mosque or surau so they can eat, pray and continue their evening without rushing. When choosing where to break fast, it’s worth asking whether a venue has a prayer space or sits close to a mosque — a small detail that makes the evening flow."] },
      { h2: "Getting ready for Hari Raya",
        body: ["The final stretch of Ramadan turns towards Hari Raya Aidilfitri. This is peak season for halal caterers, cookie bakers and open-house spreads, so anything you need — catering, celebration cakes, festive cookies or baju — is best sorted well ahead, as good caterers and bakeries fill their calendars first. Browse halal caterers and bakeries on Humble Halal, compare halal-confidence scores, and lock in your orders before the last-minute rush."] },
    ],
    faq: [
      { q: "When is Ramadan 2026 in Singapore?", a: "Ramadan 2026 is expected to fall around late February into March, but the exact dates depend on the lunar calendar and moon sighting. Always confirm current-year dates closer to the season rather than relying on a fixed date." },
      { q: "When is the Geylang Serai Ramadan bazaar?", a: "The Geylang Serai bazaar runs through the month of Ramadan each year, in the lead-up to Hari Raya Aidilfitri. Check current-year dates closer to the season, as they follow the Islamic calendar." },
      { q: "Where can I find suhoor in Singapore?", a: "Use the “Open now” filter on Humble Halal late at night to find open halal eateries near you, and look for 24-hour and open-late spots. Check the halal-confidence score before booking for a large group." },
      { q: "Do I need to book iftar buffets in advance?", a: "Yes — popular iftar and buka puasa buffets sell out, especially on weekends and for larger groups. Book early, compare price tiers, and confirm the venue’s MUIS certification on the HalalSG register before you reserve." },
      { q: "Are Ramadan bazaar stalls halal-certified?", a: "Not all of them. Certification varies stall to stall, and seasonal pop-ups aren’t always MUIS-certified. Look for displayed MUIS certificates or clearly Muslim-run stalls if certification is important to you." },
    ],
    related: ["halal-buffet-guide-singapore", "best-halal-restaurants-singapore-2026"],
    dropcap: true,
    pullQuote: "“The earlier you sort your bookings, the more the month feels like community — not a scramble.”",
    pullQuoteBy: "The Humble Halal Team",
  },
  {
    slug: "halal-dim-sum-singapore",
    title: "Halal Dim Sum in Singapore",
    dek: "Halal dim sum — siew mai, har gow, chicken char siew bao and carrot cake, done the halal way at certified spots across Singapore.",
    answer:
      "Halal dim sum in Singapore is served at MUIS-certified and Muslim-owned restaurants that recreate siew mai, har gow, bao and carrot cake with halal ingredients and no pork. Traditional dim sum leans heavily on pork and lard, so certification really matters here. Confirm the specific outlet on the MUIS HalalSG register before dining.",
    datePublished: "2026-05-27",
    dateModified: "2026-07-06",
    author: AUTHOR,
    readMins: 7,
    tags: ["Dim sum", "Chinese", "Food guides"],
    sections: [
      { h2: "Yum cha, the halal way",
        body: ["Dim sum is one of Singapore’s great weekend rituals — a table crowded with little steamer baskets, endless pots of tea and no rush to leave. The catch for Muslim diners is that the classics lean heavily on pork, from char siew to lard-enriched pastry. Halal dim sum restaurants fix that, rebuilding the whole trolley with chicken, beef, prawn and vegetable fillings so you can order basket after basket with confidence.",
               "Because so many components are house-made, a MUIS certificate is reassuring here — it covers the fillings, the pastry and the kitchen, not just a single dish."] },
      { h2: "Why traditional dim sum isn’t halal — and how kitchens rework it",
        body: ["Traditional dim sum is built around pork. Char siew (barbecued pork) fills the fluffy bao, minced pork forms the base of siew mai, and lard or pork stock enriches doughs and fillings for that signature richness. Some sauces and soups also carry a splash of Shaoxing (Chinese cooking wine).",
               "Halal kitchens rework each classic — chicken char siew for the bao, chicken or prawn siew mai, and vegetable oils in place of lard — keeping the texture and flavour while dropping the pork and alcohol entirely."],
        bullets: ["Char siew bao — traditionally barbecued pork; halal versions use chicken",
                  "Siew mai — usually minced pork; reworked with chicken, prawn or beef",
                  "Lard & pork stock — swapped for vegetable oils and halal stocks",
                  "Shaoxing (cooking wine) — in some sauces and soups; left out entirely"] },
      { h2: "What to order",
        body: ["A good halal yum cha covers all the greatest hits — steamed, fried, savoury and sweet. Order a spread to share, then keep the pots of tea coming.",
               "Mix a few steamed baskets with something pan-fried and a sweet to finish, and you’ve got a proper spread for the table."],
        bullets: ["Chicken or prawn siew mai — the trolley staple",
                  "Har gow — plump steamed prawn dumplings",
                  "Chicken char siew bao — soft, fluffy barbecue buns",
                  "Chee cheong fun — silky rice rolls with prawn or char siew",
                  "Carrot cake & radish cake — pan-fried, savoury and moreish",
                  "Lo mai kai & egg tarts — glutinous chicken rice and a sweet finish"] },
      { h2: "Weekend brunch, families and halal Chinese crossover",
        body: ["Dim sum is made for a leisurely weekend brunch, and it’s a family-friendly one — small portions mean fussy eaters and grandparents can all find something they like. Many halal dim sum spots sit inside broader halal Chinese or zi char kitchens, so you can round the meal out with fried rice, noodles and claypot dishes."],
        bullets: ["Weekend yum cha — a relaxed late-morning brunch with tea",
                  "Families — small, shareable portions suit all ages",
                  "Groups — order widely and pass the baskets around",
                  "Halal Chinese crossover — pair with zi char fried rice, noodles and greens"] },
      { h2: "How to verify it’s genuinely halal",
        body: ["With so much pork in the traditional versions, dim sum is a dish where verification really matters. Certification in Singapore is outlet-specific and expires, so confirm the exact restaurant rather than assuming a group or mall food court is fully halal."],
        bullets: ["Check the specific outlet on the MUIS HalalSG register (halal.muis.gov.sg)",
                  "Look at the halal-confidence score on Humble Halal — certified scores highest",
                  "Remember: “no pork” or Muslim-owned isn’t the same as MUIS certification",
                  "At non-certified spots, ask about the fillings, stock and cooking wine"] },
      { h2: "Find halal dim sum on Humble Halal",
        body: ["When a dim sum craving hits, let the directory point the way. Browse the halal dim sum and Chinese listings, filter by area to find a spot near you, and open the map to plan a weekend outing. The “Open now” filter is useful for catching yum cha hours, and the “Is it halal?” checker helps when you’re unsure about a brand.",
               "Every listing shows a halal-confidence score, and new certified places are added over time — so your go-to for baskets and bao stays up to date."] },
    ],
    faq: [
      { q: "Is there halal dim sum in Singapore?", a: "Yes — several halal dim sum restaurants serve pork-free siew mai, har gow, bao and carrot cake using halal ingredients. Many sit within broader halal Chinese or zi char kitchens. Confirm the outlet is MUIS-certified on the HalalSG register before dining." },
      { q: "Is dim sum halal?", a: "Traditional dim sum often contains pork and lard, so it isn’t halal unless the restaurant is certified halal and uses halal ingredients throughout. The safe move is to look for MUIS-certified halal dim sum rather than assuming from the menu. Check the listing on Humble Halal." },
      { q: "Is char siew halal?", a: "Traditional char siew is barbecued pork, so it isn’t halal. Halal kitchens recreate the sweet-savoury flavour using chicken char siew for bao and rice rolls. If it’s labelled simply as char siew at a non-certified spot, assume it’s pork unless told otherwise." },
      { q: "Is har gow halal?", a: "Har gow are prawn dumplings, so the filling itself contains no pork. It’s still only halal if the whole kitchen is certified — shared steamers, stocks and pastry can involve non-halal ingredients. Order har gow with confidence at a MUIS-certified halal dim sum restaurant." },
      { q: "What is halal dim sum made of?", a: "Halal dim sum swaps pork for chicken, beef, prawn and vegetable fillings, and uses vegetable oils instead of lard. Expect chicken or prawn siew mai, chicken char siew bao, har gow, carrot cake and egg tarts — the same classics, reworked to be fully halal." },
      { q: "Where can I find halal dim sum in Singapore?", a: "Browse the halal dim sum and Chinese listings on Humble Halal, filter by neighbourhood, and sort by the halal-confidence score to find certified spots near you. New certified places are added over time, so the directory stays current." },
    ],
    related: ["halal-steamboat-hotpot-singapore", "best-halal-restaurants-singapore-2026"],
    dropcap: true,
    pullQuote: "“Halal kitchens keep the texture and the tea ritual — they just swap the pork for chicken, prawn and vegetables.”",
    pullQuoteBy: "The Humble Halal Team",
  },
  {
    slug: "muslim-owned-businesses-singapore",
    title: "Muslim-Owned Beauty, Fashion & Services to Support",
    dek: "Beyond food — Muslim-owned beauty salons, modest fashion, home services, home-based businesses and more across Singapore.",
    answer:
      "Singapore has a thriving community of Muslim-owned businesses beyond food — Muslim-friendly beauty salons, modest fashion labels, home services, automotive, tuition and events. For non-food businesses, MUIS certification does not apply, so the trust signal is Muslim ownership and how the service is run. Browse them by category on Humble Halal and look for the Muslim-Owned label.",
    datePublished: "2026-05-26",
    dateModified: "2026-07-16",
    author: AUTHOR,
    readMins: 7,
    tags: ["Muslim-owned", "Community", "Guides", "Services"],
    sections: [
      { h2: "Why support Muslim-owned businesses",
        body: ["Choosing Muslim-owned businesses keeps money circulating in the community and supports entrepreneurs who often started small. Many are home-based businesses — the quiet backbone of the community economy — run from a spare room, a kitchen or a converted corner of the flat, alongside a day job or family responsibilities.",
               "For food, MUIS certification is the gold standard. But most of these businesses are not food, and for them certification simply does not apply — the meaningful signal is who owns and runs the business, and how they run it."] },
      { h2: "Categories to explore",
        body: ["The range is wider than most people expect. Beyond the obvious beauty and fashion labels, there is a deep bench of home services, professional help and lifestyle businesses run by the community — many bookable directly and increasingly listed in one place."],
        bullets: ["Muslimah beauty & hair salons — including private, women-only and home-based studios",
                  "Modest fashion — abaya, hijab and modest-wear labels, many independent and local",
                  "Home services — renovation, cleaning, aircon servicing and handyman work",
                  "Automotive — workshops, servicing and car grooming",
                  "Tuition & education — academic tuition, Quran and enrichment classes",
                  "Events & photography — weddings, akikah, catering coordination and videography",
                  "Health & wellness — confinement care, massage, cupping and fitness"] },
      { h2: "Muslim-owned vs Muslim-friendly — how we label",
        body: ["Non-food businesses on Humble Halal carry a Muslim-Owned or Muslim-Friendly label rather than a MUIS certificate, because MUIS certification covers food and beverage. Muslim-Owned means the business is owned and run by members of the community; Muslim-Friendly means it caters thoughtfully to Muslim customers without necessarily being Muslim-owned.",
               "The listing tells you how the business describes itself, and the halal-confidence score is weighted for that context — so you can choose with the same clarity you would when picking where to eat, even though certification is not part of the picture here."] },
      { h2: "How to choose well",
        body: ["Without a certificate to lean on, a little judgement goes a long way. The good news is that the signals are the same ones you already use for any service — reputation, clarity and how the business communicates."],
        bullets: ["Read recent reviews and look at real work, not just polished promo photos",
                  "Check how the service is run — women-only hours, privacy, and clear pricing",
                  "For home-based businesses, confirm the setup and etiquette before booking",
                  "Message with your specific needs and see how promptly and clearly they reply"] },
      { h2: "Home-based businesses — a quiet backbone",
        body: ["Home-based businesses (HBBs) deserve a special mention. Many of the community’s best salons, bakes, tailors and tutors operate this way, offering a personal, often more affordable service than a shopfront. They can be harder to discover precisely because they do not have a storefront — which is exactly why a directory helps.",
               "Treat an HBB as you would any small business: agree on scope and price up front, respect that it is someone’s home, and leave an honest review afterwards so the next customer benefits from your experience."] },
      { h2: "Find them — and get listed — on Humble Halal",
        body: ["To support the community, browse by category on Humble Halal and filter for Muslim-Owned to surface beauty, fashion, home services, education and more. Open the map to find businesses near you, read the reviews, and use the labels to understand exactly what each listing offers before you reach out."],
        bullets: ["Filter by category and the Muslim-Owned label to browse the community",
                  "Use the map to find services close to your neighbourhood",
                  "Run a business? Add your listing so customers can find and review you",
                  "Leave honest reviews to help others choose with confidence"] },
    ],
    faq: [
      { q: "Do non-food businesses need MUIS halal certification?", a: "No — MUIS halal certification applies to food and beverage. Non-food businesses like salons, fashion and home services are listed as Muslim-owned or Muslim-friendly instead, since certification does not cover them." },
      { q: "How do I find Muslim-owned businesses in Singapore?", a: "Browse by category on Humble Halal and filter for the Muslim-Owned label to find beauty, fashion, home services, education and more run by the community. Open the map to see options near you." },
      { q: "What is the difference between Muslim-owned and Muslim-friendly?", a: "Muslim-owned means the business is owned and run by members of the community. Muslim-friendly means it caters thoughtfully to Muslim customers without necessarily being Muslim-owned. The listing shows which label applies." },
      { q: "Are home-based businesses safe to book?", a: "Yes, many of the community’s best services are home-based. Treat them like any small business: check reviews, agree on scope and price up front, confirm the setup, and respect that it is someone’s home." },
      { q: "How do I list my Muslim-owned business?", a: "You can add your business to Humble Halal so customers can find and review it. Choose the right category and the Muslim-Owned label, and describe clearly how your service is run." },
    ],
    related: ["what-is-halal-singapore", "best-halal-restaurants-singapore-2026"],
    dropcap: true,
    pullQuote: "“For non-food businesses there is no certificate to lean on — the trust signal is Muslim ownership and how the service is run.”",
    pullQuoteBy: "The Humble Halal Team",
  },
  {
    slug: "malay-wedding-cost-singapore",
    title: "How Much Does a Malay Wedding Cost in Singapore? (2026 Budget Guide)",
    dek: "A realistic 2026 breakdown of what a Malay wedding in Singapore costs — from the akad nikah to the sanding — with vendor-by-vendor price ranges and where couples actually save.",
    answer:
      "A Malay wedding in Singapore typically costs S$15,000–S$45,000 for 500–1,000 guests, depending on venue (void deck vs ballroom), catering per head, the bridal package and the pelamin. A void-deck kenduri can land under S$15,000; a hotel or community-club ballroom sanding runs S$25,000–S$45,000+. Book catering, venue and the bridal package first — they set 70% of the budget.",
    datePublished: "2026-07-12",
    author: AUTHOR,
    readMins: 8,
    tags: ["Weddings", "Budgeting", "Malay wedding"],
    sections: [
      {
        h2: "The short answer: what a Malay wedding costs in 2026",
        body: [
          "Most couples in Singapore spend between S$15,000 and S$45,000 on a Malay wedding, and the single biggest lever is the venue. A void-deck or community-space kenduri with home-style catering can come in under S$15,000. A community-club or hotel ballroom sanding — with a full bridal package, a bigger pelamin and photography/videography — pushes S$25,000 to S$45,000 and beyond.",
          "The number that matters most is cost per guest. Malay weddings are famously generous with the guest list — 800 to 1,200 is common — so even a small change in the per-head catering rate moves the total by thousands.",
        ],
        bullets: [
          "Void-deck kenduri (500–800 guests): S$8,000–S$15,000",
          "Community-club hall sanding (600–1,000 guests): S$18,000–S$30,000",
          "Hotel / premium ballroom (400–700 guests): S$30,000–S$45,000+",
          "Solemnisation-only (akad nikah + small majlis): S$3,000–S$8,000",
        ],
      },
      {
        h2: "Where the money actually goes",
        body: [
          "Three vendors set roughly 70% of a Malay wedding budget: catering, the venue, and the bridal package (baju, make-up, and often the pelamin). Lock these first — everything else fits around them.",
        ],
        bullets: [
          "Catering: S$9–S$18 per guest (buffet or bufet berlauk) — usually the largest single line",
          "Venue: free–S$1,500 for a void deck; S$2,000–S$8,000 for a hall or ballroom",
          "Bridal package (baju nikah + sanding, make-up, hair): S$2,500–S$8,000",
          "Pelamin / dais: S$1,200–S$5,000 depending on scale and flowers",
          "Photography + videography: S$1,500–S$4,500",
          "Hantaran, dulang, doorgifts and kompang: S$1,000–S$3,000 combined",
        ],
      },
      {
        h2: "Where couples save without cutting the celebration",
        body: [
          "You don't need to trim the guest list to control the budget. The couples who spend well tend to make a few deliberate swaps: a weekday or Sunday-afternoon slot instead of a Saturday evening, a void deck or community club instead of a hotel, and a package vendor who bundles baju, make-up and pelamin rather than booking each separately.",
          "Getting three quotes per vendor is the highest-return hour you'll spend — Malay wedding pricing varies widely, and a good vendor will happily tailor a package to your budget if you ask early.",
        ],
        bullets: [
          "Book 9–12 months ahead — the best-value vendors go first",
          "Ask for package deals (baju + make-up + pelamin from one vendor)",
          "Off-peak dates and daytime slots cut venue and catering rates",
          "Confirm the caterer's halal status up front (MUIS-certified or clearly Muslim-run)",
        ],
      },
    ],
    faq: [
      { q: "How much does a Malay wedding cost in Singapore in 2026?", a: "Most range from S$15,000 to S$45,000 for 500–1,000 guests. A void-deck kenduri can be under S$15,000; a hotel-ballroom sanding runs S$30,000–S$45,000 or more. Catering per head and the venue drive the total." },
      { q: "What is the cheapest way to hold a Malay wedding?", a: "A void-deck or community-space kenduri with a Muslim-run caterer, an off-peak daytime slot, and a bundled bridal package (baju + make-up + pelamin) keeps most weddings under S$15,000 without shrinking the guest list." },
      { q: "How far in advance should I book wedding vendors?", a: "Nine to twelve months for catering, venue and the bridal package — they set most of the budget and the popular, good-value vendors book out first. Get three quotes for each." },
      { q: "How do I make sure the caterer is halal?", a: "Ask whether they're MUIS-certified or a Muslim-owned/-run kitchen, and confirm it before you pay a deposit. Humble Halal lists halal caterers and Muslim-owned wedding vendors you can compare." },
    ],
    related: ["muslim-owned-businesses-singapore", "halal-catering-singapore-guide"],
    dropcap: true,
    pullQuote: "“The couples who spend well don't cut the guest list — they make three deliberate swaps: the date, the venue, and a bundled bridal package.”",
    pullQuoteBy: "The Humble Halal Team",
    leadVertical: "weddings",
  },

  /* ===== Cluster expansion batch 1 (2026-07) — see docs/seo/keyword-research-v2.md ===== */

  {
    slug: "halal-food-johor-bahru-guide",
    title: "Halal Food in Johor Bahru: A Singaporean's Day-Trip Guide (2026)",
    dek: "Where to eat halal in JB on a day trip from Singapore — City Square, malls, buffets and local musts, with how to be sure a stall is genuinely halal.",
    answer:
      "Johor Bahru is very easy for halal eating: the majority of local Malay and Muslim-Indian stalls are halal, and big malls like City Square, Mid Valley Southkey and Paradigm have clearly signed halal outlets and JAKIM-certified chains. Look for the JAKIM halal logo or a Muslim-run stall, avoid outlets serving pork or alcohol, and you can eat well all day for a fraction of Singapore prices.",
    datePublished: "2026-07-14",
    author: AUTHOR,
    readMins: 9,
    tags: ["Johor Bahru", "Travel", "Halal food"],
    sections: [
      {
        h2: "Is it easy to find halal food in JB?",
        body: [
          "Yes — arguably easier than in many parts of Singapore. Johor is a Malay-Muslim-majority state, so a large share of hawker stalls, kopitiams and mall outlets are halal or Muslim-run. Malaysia's national halal authority is JAKIM, and its logo is the one to look for on certified outlets.",
          "As always, certification beats assumption. A stall run by a Muslim family serving Malay food is a strong signal; a chain with a displayed JAKIM certificate is stronger still. Skip any outlet that also serves pork or alcohol unless it clearly operates a separate halal-certified line.",
        ],
        bullets: [
          "Look for the JAKIM halal logo (Malaysia's equivalent of MUIS)",
          "Malay, Muslim-Indian and mamak stalls are usually halal — confirm if unsure",
          "Avoid outlets serving pork or alcohol without separate certification",
          "When in doubt, ask: “Ada sijil halal?” (Do you have a halal certificate?)",
        ],
      },
      {
        h2: "City Square & the JB Sentral cluster",
        body: [
          "Most Singaporeans start at Johor Bahru City Square — it is a two-minute walk from the CIQ checkpoint, so it is the natural first stop. The mall and the surrounding JB Sentral area are packed with halal options, from food-court local fare to certified chains.",
          "It gets crowded on weekends and public holidays. If you want a relaxed meal, go early or push a little further out to the quieter malls listed below.",
        ],
        bullets: [
          "City Square food court — mixed halal stalls, quick and cheap",
          "Certified chains — many Malaysian halal F&B brands have outlets here",
          "Dessert & bubble tea — plenty of Muslim-friendly options for an afternoon break",
        ],
      },
      {
        h2: "Beyond City Square: quieter malls & buffets",
        body: [
          "If you are driving or taking Grab, the malls a little further from the checkpoint are less packed and just as halal-friendly. Mid Valley Southkey, Paradigm Mall and KSL City all have strong halal line-ups, and JB is well known for value halal buffets — hotpot, Korean BBQ and steamboat at prices well below Singapore.",
        ],
        bullets: [
          "Mid Valley Southkey — large, modern, many halal outlets",
          "Paradigm Mall — family-friendly with a good food selection",
          "Halal buffets — steamboat, mookata and Korean BBQ are JB favourites",
        ],
      },
      {
        h2: "Local dishes worth crossing for",
        body: [
          "Beyond the malls, JB rewards anyone willing to eat like a local. Look for Johor specialities and classic Malay hawker fare — much of it halal and hard to find at the same price back home.",
        ],
        bullets: [
          "Nasi lemak and mee rebus at Muslim-run kopitiams",
          "Roti canai and murtabak at mamak stalls",
          "Satay, lok lok and grilled seafood in the evenings",
          "Cendol, ABC and durian in season for dessert",
        ],
      },
      {
        h2: "Planning your day trip",
        body: [
          "Sort out the crossing before you sort out lunch — the checkpoint, not the food, is the part that goes wrong. Our JB transport guide covers Woodlands vs Tuas, the bus and train options, and when to avoid the jams. Then browse Singapore-side halal spots for the trip back.",
        ],
        links: [
          { label: "Crossing to JB: checkpoints & transport →", href: "/blog/crossing-to-johor-bahru-checkpoints-transport" },
          { label: "Browse the halal directory", href: "/halal" },
          { label: "Is it halal? brand checker", href: "/is-halal" },
        ],
      },
    ],
    faq: [
      { q: "Is most food in Johor Bahru halal?", a: "A large share is. Johor is a Malay-Muslim-majority state, so many stalls and mall outlets are halal or Muslim-run. Look for the JAKIM halal logo or a Muslim-run stall, and avoid outlets serving pork or alcohol without separate certification." },
      { q: "Where is the best halal food near JB City Square?", a: "City Square itself, two minutes from the CIQ checkpoint, has a food court and several certified halal chains. For a quieter meal, Mid Valley Southkey, Paradigm Mall and KSL City all have strong halal line-ups a short Grab ride away." },
      { q: "Is there a good halal buffet in JB?", a: "Yes — JB is known for value halal buffets including steamboat, mookata and Korean BBQ, usually well below Singapore prices. Confirm the outlet displays JAKIM certification or is clearly Muslim-run before booking." },
      { q: "How do I know a JB stall is really halal?", a: "Look for the JAKIM halal certificate on display, a Muslim-run kitchen, and no pork or alcohol on the menu. If it is not clear, ask “Ada sijil halal?” — most outlets are happy to confirm." },
    ],
    related: ["crossing-to-johor-bahru-checkpoints-transport", "halal-catering-singapore-guide"],
    dropcap: true,
  },

  {
    slug: "crossing-to-johor-bahru-checkpoints-transport",
    title: "Crossing to Johor Bahru: Checkpoints & Transport Guide (2026)",
    dek: "Woodlands vs Tuas, bus, train, car and Grab — how to cross from Singapore to JB with less queuing, plus prayer and halal-food tips for the trip.",
    answer:
      "There are two land crossings from Singapore to Johor Bahru: the Woodlands Causeway (via Woodlands Checkpoint) and the Tuas Second Link (via Tuas Checkpoint). Woodlands is closest to JB city and City Square; Tuas is better for west-side destinations and driving. The KTM Shuttle Tebrau train from Woodlands to JB Sentral is the fastest way to skip the jam, but tickets sell out fast. Avoid peak hours — early mornings, Friday evenings and the eve of public holidays.",
    datePublished: "2026-07-13",
    author: AUTHOR,
    readMins: 8,
    tags: ["Johor Bahru", "Travel", "Transport"],
    sections: [
      {
        h2: "The two crossings: Woodlands vs Tuas",
        body: [
          "Singapore connects to Johor by two land crossings. The Woodlands Causeway feeds Woodlands Checkpoint in the north and lands you closest to JB city centre — City Square and JB Sentral are right there. The Tuas Second Link feeds Tuas Checkpoint in the west and is better if you are driving to Legoland, the west of Johor, or want to avoid Causeway congestion.",
        ],
        bullets: [
          "Woodlands Checkpoint — closest to JB city, City Square, JB Sentral",
          "Tuas Checkpoint (Second Link) — better for west Johor and driving",
          "Both can jam badly at peak times — timing matters more than which one",
        ],
      },
      {
        h2: "By train: the KTM Shuttle Tebrau",
        body: [
          "The five-minute Shuttle Tebrau train from Woodlands CIQ to JB Sentral is the single fastest way across — you clear both immigration points at the stations, not in a bus queue. The catch is availability: tickets are released in advance and popular slots sell out quickly, especially weekends and holidays.",
        ],
        bullets: [
          "Book early via KTMB's official channel — slots open weeks ahead",
          "Clears the jam entirely when you get a ticket",
          "JB Sentral connects directly to City Square mall",
        ],
      },
      {
        h2: "By bus, car & Grab",
        body: [
          "Public buses (such as the causeway cross-border services) are the cheapest option, but you disembark to clear immigration and re-board, which adds time at peak hours. Driving gives flexibility but means Vehicle Entry Permit and toll considerations, plus parking in JB. Cross-border Grab and private-hire options exist but can be pricier and subject to their own rules.",
        ],
        bullets: [
          "Bus — cheapest; expect to queue at immigration on both sides",
          "Car — flexible; plan for VEP, tolls and JB parking",
          "Grab / private hire — convenient but check current cross-border rules",
        ],
      },
      {
        h2: "When to go (and when not to)",
        body: [
          "The difference between a smooth crossing and a two-hour crawl is almost entirely timing. Weekday mornings before the work rush and mid-afternoon lulls are easiest. The worst windows are Friday and Saturday evenings, Sunday nights heading back, and the eve of any public holiday.",
        ],
        bullets: [
          "Best: weekday mid-morning or mid-afternoon",
          "Worst: Fri/Sat evenings, Sun nights, eve of public holidays",
          "Check live checkpoint traffic before you leave",
        ],
      },
      {
        h2: "Prayer & halal food on the way",
        body: [
          "There are surau (prayer rooms) at the checkpoints and inside JB Sentral and City Square, so you can pray shortly after crossing. Once you are through, JB is easy for halal eating — start with our day-trip food guide.",
        ],
        links: [
          { label: "Halal food in Johor Bahru: day-trip guide →", href: "/blog/halal-food-johor-bahru-guide" },
          { label: "Find mosques & prayer spaces", href: "/mosques" },
        ],
      },
    ],
    faq: [
      { q: "Should I use Woodlands or Tuas checkpoint for JB?", a: "Use Woodlands if you are heading to JB city, City Square or JB Sentral — it is the closest. Use Tuas (Second Link) for west Johor, Legoland or if you are driving and want to avoid Causeway congestion. Timing affects the queue more than the choice of crossing." },
      { q: "What is the fastest way to cross to JB?", a: "The KTM Shuttle Tebrau train from Woodlands CIQ to JB Sentral — about five minutes and you skip the vehicle jam. Book early through KTMB's official channel because popular slots sell out weeks ahead." },
      { q: "When is the JB checkpoint least crowded?", a: "Weekday mid-mornings and mid-afternoons are easiest. Avoid Friday and Saturday evenings, Sunday nights on the way back, and the eve of public holidays, when queues can stretch to hours." },
      { q: "Is there a prayer room at the checkpoints?", a: "Yes. There are surau at the Singapore and JB checkpoints, and prayer spaces inside JB Sentral and City Square, so you can pray soon after crossing." },
    ],
    related: ["halal-food-johor-bahru-guide", "ramadan-singapore-2026-guide"],
  },

  {
    slug: "umrah-from-singapore-guide",
    title: "Umrah from Singapore: Packages, Visa & Vaccination (2026 Guide)",
    dek: "A practical guide to performing umrah from Singapore — how packages work, the Saudi visa, the required meningitis vaccination, costs and how to choose an agent.",
    answer:
      "To perform umrah from Singapore you book through a travel agent offering an umrah package, which typically bundles flights, hotels in Makkah and Madinah, transport and a guide. You need a Saudi umrah visa (arranged by the agent or via the official Nusuk platform) and the mandatory meningococcal (ACWY) vaccination, available at polyclinics and GPs. Package prices vary widely by hotel distance to the Haram and season; book early for Ramadan and school holidays.",
    datePublished: "2026-07-15",
    author: AUTHOR,
    readMins: 9,
    tags: ["Umrah", "Travel", "Guides"],
    sections: [
      {
        h2: "What umrah involves",
        body: [
          "Umrah is the non-mandatory pilgrimage to Makkah that can be performed at any time of year, unlike Hajj which falls on fixed dates. The core rites — entering ihram, tawaf around the Kaaba, sa'i between Safa and Marwah, and cutting the hair — can be completed in a few hours, but most trips combine umrah with several days in Makkah and a visit to the Prophet's Mosque in Madinah.",
        ],
        bullets: [
          "Can be done any time of year (Ramadan is the busiest and most rewarding)",
          "Most Singapore packages run 9–14 days, covering Makkah and Madinah",
          "Not the same as Hajj — see our note on the difference below",
        ],
      },
      {
        h2: "How umrah packages work",
        body: [
          "Almost everyone from Singapore travels on a package through a licensed umrah travel agent. The package usually bundles return flights, hotels in both holy cities, ground transport, a muttawif (guide) and sometimes ziarah (visits to historical sites). The single biggest price driver is how close your hotel is to the Haram — walking distance costs more; a short shuttle ride costs less.",
        ],
        bullets: [
          "Bundled: flights, hotels, transport, guide, often meals",
          "Price driver: hotel distance to the Haram, and the season",
          "Ramadan and June/December school holidays are the most expensive",
        ],
      },
      {
        h2: "Visa & the Nusuk platform",
        body: [
          "Umrah requires a Saudi umrah visa. Most Singapore travellers have this handled by their agent, but visas can also be issued through Saudi Arabia's official Nusuk app/platform. Passport validity and other entry requirements apply, so confirm the current rules with your agent well before departure.",
        ],
        bullets: [
          "Agent-arranged visa is the norm for package travellers",
          "Nusuk is the official Saudi platform for umrah permits and services",
          "Check passport validity and current entry rules early",
        ],
      },
      {
        h2: "The meningitis vaccination (required)",
        body: [
          "Saudi Arabia requires proof of meningococcal (ACWY) vaccination for pilgrims. In Singapore this is available at polyclinics and many GP clinics; get it at least the recommended number of days before travel so the certificate is valid on arrival. Keep the vaccination certificate with your travel documents.",
        ],
        bullets: [
          "Meningococcal ACWY vaccine is mandatory for umrah",
          "Available at polyclinics and GP clinics in Singapore",
          "Get it early — the certificate must be valid on arrival",
        ],
      },
      {
        h2: "Choosing an agent & preparing",
        body: [
          "Pick a licensed agent with a clear itinerary, transparent hotel names (so you can check the distance to the Haram yourself) and good reviews from recent pilgrims. Attend an umrah course if you are a first-timer — several are run in Singapore and they walk you through the rites and the du'a. Then plan the practical side, including any Madinah ziarah.",
        ],
        links: [
          { label: "Explore Madinah & Makkah travel guides", href: "/travel/medina" },
          { label: "Browse Muslim-owned services", href: "/halal" },
        ],
      },
    ],
    faq: [
      { q: "How much does umrah cost from Singapore?", a: "It varies widely by hotel distance to the Haram, airline and season. Ramadan and school-holiday departures are the most expensive. Compare packages on what is actually bundled — flights, hotel star rating and distance, transport and guide — rather than headline price alone." },
      { q: "What vaccination do I need for umrah?", a: "The meningococcal (ACWY) vaccination is mandatory. In Singapore you can get it at polyclinics and many GP clinics. Have it done early enough that the certificate is valid on arrival, and keep the certificate with your documents." },
      { q: "Do I need a visa for umrah, and how do I get it?", a: "Yes, a Saudi umrah visa is required. Most Singapore travellers have their agent arrange it as part of the package; visas and services can also be handled through Saudi Arabia's official Nusuk platform. Confirm current requirements with your agent." },
      { q: "What is the difference between umrah and Hajj?", a: "Hajj is the obligatory pilgrimage performed on fixed dates in Dhul-Hijjah and is one of the five pillars of Islam. Umrah is a non-obligatory pilgrimage with fewer rites that can be performed at any time of year." },
    ],
    related: ["ramadan-singapore-2026-guide", "halal-food-johor-bahru-guide"],
    dropcap: true,
  },

  {
    slug: "halal-mala-singapore",
    title: "Halal Mala in Singapore: Where to Get Your Mala Xiang Guo Fix",
    dek: "Mala is one of Singapore's favourite flavours — here's how to find genuinely halal mala xiang guo and hotpot, and how to tell if a stall is really halal.",
    answer:
      "Halal mala is widely available in Singapore through Muslim-run stalls and MUIS-certified outlets that serve mala xiang guo (dry stir-fried) and mala hotpot. Because classic mala stalls often share woks with non-halal meat, look for a dedicated halal-certified or Muslim-owned stall rather than assuming — check for the MUIS certificate or the Muslim-Owned label, and confirm there's no pork or lard in the base.",
    datePublished: "2026-07-16",
    author: AUTHOR,
    readMins: 7,
    tags: ["Mala", "Cuisines", "Halal food"],
    sections: [
      {
        h2: "Is mala halal?",
        body: [
          "Mala itself — the numbing-spicy Sichuan seasoning of chillies and peppercorns — is just a spice blend, so the flavour is not the issue. What matters is the meat, the stock and the wok. Many mainstream mala stalls cook pork and non-halal meat in the same equipment, which is why you should seek out a stall that is specifically halal-certified or Muslim-run.",
        ],
        bullets: [
          "The spice blend is fine — the meat, stock and shared woks are the concern",
          "Look for a MUIS certificate or the Muslim-Owned label",
          "Confirm no pork, lard or non-halal broth in the base",
        ],
      },
      {
        h2: "Mala xiang guo vs mala hotpot",
        body: [
          "Mala comes two main ways. Mala xiang guo is the dry, wok-tossed version where you pick your ingredients by weight and choose your spice and numbness level — quick, portable and the more common halal format. Mala hotpot (malatang or steamboat-style) simmers everything in a spicy broth, so the stock's halal status matters as much as the ingredients.",
        ],
        bullets: [
          "Xiang guo — dry stir-fry, pick-your-own ingredients, choose spice level",
          "Hotpot / malatang — simmered in broth; check the broth is halal",
          "Both let you control heat: xiao la (mild) to da la (very spicy)",
        ],
      },
      {
        h2: "How to find a halal mala stall",
        body: [
          "Halal mala has boomed, so you have options — but verify each one. The Humble Halal directory lets you filter for MUIS-certified and Muslim-owned outlets, and you can open the map to find the closest. If a stall can't show certification and isn't clearly Muslim-run, treat it as unconfirmed.",
        ],
        links: [
          { label: "Find halal mala & steamboat near you", href: "/halal" },
          { label: "Halal steamboat & hotpot guide", href: "/blog/halal-steamboat-hotpot-singapore" },
        ],
      },
      {
        h2: "Ordering tips",
        body: [
          "Mala is priced by weight, so it is easy to overshoot. Grab a basket, keep an eye on how much you pile in, and tell the stall your spice and numbness level. Popular halal-friendly picks include lotus root, enoki, fishball, chicken, luncheon-style halal meat, cabbage and instant noodles.",
        ],
        bullets: [
          "Priced by weight — pace yourself when filling the basket",
          "State your level: xiao la (mild), zhong la (medium), da la (spicy)",
          "Crowd-pleasers: lotus root, enoki, fishball, chicken, cabbage, noodles",
        ],
      },
    ],
    faq: [
      { q: "Is mala halal in Singapore?", a: "Mala can be halal when it is cooked by a MUIS-certified or Muslim-run stall using halal meat, stock and dedicated equipment. Because many mainstream stalls share woks with pork and non-halal meat, look for certification or the Muslim-Owned label rather than assuming." },
      { q: "Where can I find halal mala xiang guo?", a: "Halal mala xiang guo is available at Muslim-owned and MUIS-certified stalls across Singapore. Use the Humble Halal directory to filter for halal outlets and open the map to find the nearest one." },
      { q: "Is mala hotpot halal?", a: "It can be, but the broth matters as much as the ingredients. For hotpot or malatang, confirm the base stock is halal and that no pork or non-halal meat shares the pot — a certified or Muslim-run outlet is the safe choice." },
      { q: "What does mala taste like?", a: "Mala is a numbing-and-spicy Sichuan flavour: dried chillies bring the heat while Sichuan peppercorns create a tingling numbness. You can usually choose your spice and numbness level, from mild (xiao la) to very spicy (da la)." },
    ],
    related: ["halal-steamboat-hotpot-singapore", "halal-korean-bbq-singapore"],
    dropcap: true,
  },

  {
    slug: "halal-mookata-singapore",
    title: "Halal Mookata in Singapore: The Best Thai BBQ Steamboat Spots",
    dek: "Mookata — the Thai grill-and-steamboat combo — is a halal-friendly favourite. Here's how it works, what to order, and how to find a genuinely halal mookata.",
    answer:
      "Halal mookata is easy to find in Singapore, with many Muslim-owned and MUIS-certified outlets serving the Thai grill-and-steamboat combo. Mookata pairs a domed charcoal grill with a moat of broth for steamboat, so you cook marinated meats, seafood and vegetables at your table. Look for a MUIS certificate or the Muslim-Owned label and confirm the marinades and broth are halal.",
    datePublished: "2026-07-16",
    author: AUTHOR,
    readMins: 7,
    tags: ["Mookata", "Cuisines", "Halal food"],
    sections: [
      {
        h2: "What is mookata?",
        body: [
          "Mookata (Thai for “pork” + “skillet”, though halal versions swap the pork) is a communal Thai-style barbecue. A dome-shaped pan sits over hot charcoal: you grill marinated meats on the raised centre while a moat of broth around the edge doubles as steamboat for vegetables, seafood and noodles. Fat from the grill drips into the broth and flavours it as you go.",
        ],
        bullets: [
          "Grill on top, steamboat in the moat — two ways to cook at once",
          "Charcoal-heated dome pan gives that smoky char",
          "Halal outlets use halal meats, marinades and broth (no pork)",
        ],
      },
      {
        h2: "Is mookata halal?",
        body: [
          "The format is naturally suited to halal dining — plenty of Singapore mookata outlets are Muslim-owned or MUIS-certified. The things to verify are the marinated meats, the sauces and the broth, since traditional Thai versions centre on pork. A certified or clearly Muslim-run outlet removes the guesswork.",
        ],
        bullets: [
          "Look for the MUIS certificate or the Muslim-Owned label",
          "Confirm marinades, dipping sauces and broth are halal",
          "Halal mookata typically features chicken, beef and seafood",
        ],
      },
      {
        h2: "What to order",
        body: [
          "Most mookata places do a set for sharing, which is the easiest way to start. Beyond the marinated meats, load the broth with vegetables and seafood, and don't skip the signature Thai dips.",
        ],
        bullets: [
          "Marinated chicken, beef and lamb for the grill",
          "Prawns, squid, fishball and crabstick for the steamboat",
          "Vegetables, tofu, mushrooms and glass noodles in the broth",
          "Thai seafood dip (nam jim) and chilli sauce on the side",
        ],
      },
      {
        h2: "Finding halal mookata near you",
        body: [
          "Halal mookata is spread across the island, from heartland coffeeshops to dedicated restaurants. Filter the directory for halal outlets and open the map to find the nearest table — and if you love the steamboat side, our hotpot guide has more.",
        ],
        links: [
          { label: "Find halal mookata near you", href: "/halal" },
          { label: "Halal steamboat & hotpot guide", href: "/blog/halal-steamboat-hotpot-singapore" },
        ],
      },
    ],
    faq: [
      { q: "Is mookata halal in Singapore?", a: "Many mookata outlets in Singapore are Muslim-owned or MUIS-certified and serve fully halal sets. Because traditional Thai mookata centres on pork, look for the MUIS certificate or the Muslim-Owned label and confirm the marinades and broth are halal." },
      { q: "What is the difference between mookata and steamboat?", a: "Mookata combines both: a domed grill in the centre for barbecuing meats and a surrounding moat of broth that works like steamboat for vegetables and seafood. Plain steamboat only simmers ingredients in broth, with no grill." },
      { q: "What do you eat with halal mookata?", a: "Grill marinated chicken, beef and lamb on top while cooking prawns, squid, fishball, vegetables and glass noodles in the broth. Thai seafood dip (nam jim) and chilli sauce are the classic accompaniments." },
      { q: "Where can I find halal mookata near me?", a: "Halal mookata is available across Singapore in coffeeshops and dedicated restaurants. Use the Humble Halal directory to filter for halal outlets and open the map to find the closest one." },
    ],
    related: ["halal-steamboat-hotpot-singapore", "halal-korean-bbq-singapore"],
  },

  {
    slug: "halal-korean-bbq-singapore",
    title: "Halal Korean BBQ in Singapore: Where to Grill Halal Samgyeopsal Style",
    dek: "Korean BBQ, minus the pork and alcohol — here's how to find genuinely halal KBBQ in Singapore and what to order for the full grill-at-your-table experience.",
    answer:
      "Halal Korean BBQ is available in Singapore at Muslim-owned and MUIS-certified restaurants that serve marinated beef and chicken (in place of pork) grilled at your table, with the full spread of banchan side dishes. Look for the MUIS certificate or the Muslim-Owned label, and confirm the marinades and sauces contain no mirin, rice wine or other alcohol.",
    datePublished: "2026-07-17",
    author: AUTHOR,
    readMins: 7,
    tags: ["Korean", "Cuisines", "Halal food"],
    sections: [
      {
        h2: "Can Korean BBQ be halal?",
        body: [
          "Yes — with two swaps. Traditional Korean BBQ leans on pork (samgyeopsal) and often uses alcohol-based marinades and soups, so halal KBBQ replaces the pork with beef, chicken and seafood and uses alcohol-free seasoning. The tabletop-grill experience, the banchan and the lettuce wraps all stay exactly the same.",
        ],
        bullets: [
          "Pork is swapped for marinated beef, chicken and seafood",
          "Marinades and stews must be free of mirin, soju and rice wine",
          "Look for the MUIS certificate or the Muslim-Owned label",
        ],
      },
      {
        h2: "What to order",
        body: [
          "Halal KBBQ menus keep all the fun of grilling at the table. Order a mix of marinated and plain cuts, then build lettuce wraps with rice, ssamjang and kimchi. Many outlets do a buffet, which is the best-value way to try everything.",
        ],
        bullets: [
          "Bulgogi (marinated beef) and dak-galbi (spicy chicken)",
          "Beef short rib (galbi) and chicken for the grill",
          "Banchan — kimchi, pickles, beansprouts — usually free-flow",
          "Wrap it: lettuce, rice, ssamjang and grilled meat",
        ],
      },
      {
        h2: "Halal KBBQ buffet vs à la carte",
        body: [
          "If you want to eat a lot and try many cuts, a halal KBBQ buffet is the move — a fixed price for free-flow meat and sides. À la carte suits smaller appetites or a specific craving. Either way, confirm the outlet's halal status before you go.",
        ],
        bullets: [
          "Buffet — best value for groups and big eaters",
          "À la carte — lighter, order exactly what you want",
          "Check certification first — some KBBQ chains are not halal",
        ],
      },
      {
        h2: "Find halal Korean BBQ near you",
        body: [
          "Halal Korean food has grown fast in Singapore, from fried chicken to full KBBQ. Filter the directory for halal outlets, and see our wider Korean guide for stews, bibimbap and fried chicken too.",
        ],
        links: [
          { label: "Find halal Korean BBQ near you", href: "/halal" },
          { label: "Halal Korean food guide", href: "/blog/halal-korean-food-singapore" },
        ],
      },
    ],
    faq: [
      { q: "Is Korean BBQ halal in Singapore?", a: "It can be. Halal Korean BBQ restaurants swap pork for beef, chicken and seafood and use alcohol-free marinades, and several in Singapore are Muslim-owned or MUIS-certified. Confirm the certificate or Muslim-Owned label before dining, as many mainstream KBBQ chains are not halal." },
      { q: "What do you eat at halal Korean BBQ?", a: "Grill marinated beef (bulgogi, galbi) and chicken (dak-galbi) at the table, wrap them in lettuce with rice and ssamjang, and enjoy free-flow banchan like kimchi and pickled sides. Many outlets offer a buffet." },
      { q: "Is there a halal Korean BBQ buffet?", a: "Yes, several halal-certified and Muslim-owned outlets in Singapore run Korean BBQ buffets with free-flow marinated meats and side dishes. Use the directory to find one near you and check its halal status first." },
      { q: "Why isn't all Korean BBQ halal?", a: "Traditional Korean BBQ features pork (samgyeopsal) and frequently uses alcohol-based marinades and soups such as mirin, soju or rice wine. Halal versions remove both, which is why certification matters." },
    ],
    related: ["halal-korean-food-singapore", "halal-mookata-singapore"],
  },

  {
    slug: "halal-western-food-singapore",
    title: "Halal Western Food in Singapore: Steaks, Burgers & Brunch",
    dek: "From juicy burgers to sizzling steaks and all-day brunch — here's where to find halal Western food in Singapore, and how to be sure it's genuinely halal.",
    answer:
      "Halal Western food is easy to find in Singapore, from MUIS-certified steakhouses and burger joints to Muslim-owned cafés doing all-day brunch. Because Western menus often include pork (bacon, ham) and alcohol, look for a MUIS certificate or the Muslim-Owned label and check that meats are halal and dishes are cooked without wine or pork stock.",
    datePublished: "2026-07-17",
    author: AUTHOR,
    readMins: 7,
    tags: ["Western", "Cuisines", "Halal food"],
    sections: [
      {
        h2: "Is Western food halal-friendly?",
        body: [
          "Western food covers a lot of ground — steaks, burgers, pasta, brunch — and much of it is naturally halal-friendly once you remove pork and alcohol. The classic pitfalls are bacon and ham, pork-based stocks, and wine used in sauces and cooking. A certified or Muslim-run kitchen handles all of that for you.",
        ],
        bullets: [
          "Watch for pork (bacon, ham) and alcohol in sauces",
          "Halal steakhouses use halal-slaughtered beef and lamb",
          "Look for the MUIS certificate or the Muslim-Owned label",
        ],
      },
      {
        h2: "Halal steak",
        body: [
          "Steak is one of the strongest halal Western categories in Singapore, with dedicated halal steakhouses serving proper cuts — ribeye, sirloin, tenderloin — with the usual sides. If a good steak is what you're after, we have a full guide.",
        ],
        links: [
          { label: "Halal steak in Singapore: full guide", href: "/blog/halal-steak-singapore" },
        ],
        bullets: [
          "Dedicated halal steakhouses across the island",
          "Ribeye, sirloin and tenderloin with classic sides",
          "Great for date nights and celebrations",
        ],
      },
      {
        h2: "Halal burgers & comfort food",
        body: [
          "Burgers, wings, pasta and mac-and-cheese are café staples, and plenty of Muslim-owned spots do them well. Many popular fast-food and casual chains are also MUIS-certified — but not all, so it is still worth a quick check for the ones that aren't.",
        ],
        bullets: [
          "Smashed and gourmet burgers at Muslim-owned cafés",
          "Wings, fries, pasta and mains for the whole table",
          "Some chains are certified; verify the ones that aren't",
        ],
      },
      {
        h2: "Halal brunch & cafés",
        body: [
          "All-day brunch — big breakfasts, pancakes, eggs and good coffee — is a booming halal category. Our breakfast and café guides go deeper, and you can filter the directory for Western and café outlets near you.",
        ],
        links: [
          { label: "Best halal cafés in Singapore", href: "/blog/best-halal-cafes-singapore" },
          { label: "Best halal breakfast in Singapore", href: "/blog/best-halal-breakfast-singapore" },
          { label: "Browse the halal directory", href: "/halal" },
        ],
      },
    ],
    faq: [
      { q: "Is Western food halal in Singapore?", a: "Much of it is available halal. Look for MUIS-certified or Muslim-owned steakhouses, burger joints and cafés. The things to check are pork items like bacon and ham, pork-based stocks, and wine used in cooking — a certified or Muslim-run kitchen avoids all three." },
      { q: "Where can I find halal steak in Singapore?", a: "There are dedicated halal steakhouses across Singapore serving ribeye, sirloin and tenderloin with classic sides. See our halal steak guide for specifics, or filter the Humble Halal directory for halal Western outlets." },
      { q: "Are fast-food burger chains halal in Singapore?", a: "Some are MUIS-certified and some are not, and it can vary by outlet. Check each brand's certification before ordering — our “Is it halal?” brand checker and roundups cover the popular chains." },
      { q: "Is there halal Western brunch in Singapore?", a: "Yes — all-day halal brunch is popular, with Muslim-owned cafés serving big breakfasts, pancakes, eggs and coffee. Our halal café and breakfast guides list where to go." },
    ],
    related: ["halal-steak-singapore", "best-halal-cafes-singapore"],
  },

  {
    slug: "is-it-halal-popular-chains-singapore",
    title: "Is It Halal? Popular Food Chains in Singapore, Checked (2026)",
    dek: "Is MOS Burger halal? Genki Sushi? Yoshinoya? A plain-English roundup of Singapore's most-searched chains — and how to verify each one yourself.",
    answer:
      "Some popular chains in Singapore are MUIS-certified halal (including several outlets of well-known Japanese and fast-food brands), while others are not, and status can differ by outlet. Always confirm using the official MUIS HalalSG register or the certificate displayed in-store rather than a “no pork” sign. Below we cover the chains Singaporeans search for most and how to check each one.",
    datePublished: "2026-07-18",
    author: AUTHOR,
    readMins: 8,
    tags: ["Is it halal", "Brands", "Halal basics"],
    sections: [
      {
        h2: "How to check any chain yourself",
        body: [
          "Before the specifics, the method: a chain is only officially halal if it holds a valid MUIS halal certificate for that outlet. Certification can vary between branches of the same brand, and menus change, so the reliable check is the MUIS HalalSG register or the certificate on display — never just a “no pork, no lard” sign, which is self-declared.",
        ],
        links: [
          { label: "Is it halal? brand checker", href: "/is-halal" },
          { label: "How to check MUIS halal certification", href: "/blog/how-to-check-muis-halal-certification" },
        ],
        bullets: [
          "Official = valid MUIS certificate for that specific outlet",
          "Status can differ by branch — check the one you're visiting",
          "“No pork, no lard” is self-declared, not certification",
        ],
      },
      {
        h2: "Japanese chains people ask about",
        body: [
          "Japanese food is the most-searched halal-check category in Singapore. Brands like MOS Burger, Genki Sushi, Sukiya and Yoshinoya come up constantly. Several have MUIS-certified outlets, but because certification and menus vary, verify the specific outlet before you order.",
        ],
        bullets: [
          "MOS Burger, Genki Sushi, Sukiya, Yoshinoya, Pepper Lunch — frequently searched",
          "Some outlets are certified; confirm the branch you're at",
          "Our brand checker tracks halal status where available",
        ],
      },
      {
        h2: "Fast food & casual chains",
        body: [
          "Beyond Japanese, the other big cluster is Western fast food and casual dining — the “is it halal” questions around burger, pizza, chicken and grill chains. Some are certified island-wide, some at selected outlets, and some not at all.",
        ],
        bullets: [
          "Burger, pizza, fried-chicken and grill chains vary widely",
          "A brand can be certified in one country and not another",
          "Check the Singapore outlet's certificate, not overseas status",
        ],
      },
      {
        h2: "When a chain isn't certified",
        body: [
          "If a chain has no MUIS certification for its Singapore outlets, treat it as not halal even if it avoids pork — cross-contamination, non-halal meat and alcohol in sauces are all possible. Use the directory to find a certified alternative for the same craving.",
        ],
        links: [
          { label: "Browse MUIS-certified & Muslim-owned places", href: "/halal" },
          { label: "Is it halal? brand checker", href: "/is-halal" },
        ],
      },
    ],
    faq: [
      { q: "Is MOS Burger halal in Singapore?", a: "MOS Burger has had MUIS-certified outlets in Singapore, but certification can vary by branch and over time. Confirm the specific outlet on the MUIS HalalSG register or check the certificate displayed in-store before ordering." },
      { q: "Is Genki Sushi halal?", a: "Some Genki Sushi outlets in Singapore have been MUIS-certified, but status can differ by location. Verify the branch you plan to visit on the official MUIS register or via the displayed certificate rather than assuming." },
      { q: "How can I tell if a chain is really halal?", a: "Check for a valid MUIS halal certificate for that specific outlet, using the MUIS HalalSG register or the certificate on display. A “no pork, no lard” sign is self-declared and does not mean the outlet is certified." },
      { q: "Does halal status differ between outlets of the same chain?", a: "Yes. A brand can have some MUIS-certified outlets and others that are not, and certification can change. Always check the specific branch you are visiting." },
    ],
    related: ["is-it-halal-bakeries-cafes-singapore", "how-to-check-muis-halal-certification"],
    dropcap: true,
  },

  {
    slug: "is-it-halal-bakeries-cafes-singapore",
    title: "Is It Halal? Bakeries & Café Chains in Singapore, Checked (2026)",
    dek: "Is Paris Baguette halal? BreadTalk? Cedele? Four Leaves? A clear roundup of Singapore's most-searched bakeries and cafés — and how to verify each one.",
    answer:
      "Bakery and café halal status in Singapore is mixed: some chains hold MUIS certification for their products or outlets, while others are not certified and may use alcohol (in vanilla essence, rum-soaked items) or non-halal gelatine and emulsifiers. Confirm via the MUIS HalalSG register or the certificate in-store — a “no pork” sign is not enough for baked goods.",
    datePublished: "2026-07-18",
    author: AUTHOR,
    readMins: 8,
    tags: ["Is it halal", "Bakery", "Halal basics"],
    sections: [
      {
        h2: "Why bakeries need extra checking",
        body: [
          "Baked goods have halal pitfalls that aren't obvious. Alcohol can appear in flavourings (some vanilla essences, rum-soaked cakes and liqueur fillings), while gelatine, emulsifiers and some fats can be animal-derived and non-halal. That's why, even more than with savoury food, a bakery needs proper certification rather than a “no pork” assurance.",
        ],
        bullets: [
          "Alcohol hides in flavourings and some cake fillings",
          "Gelatine and emulsifiers may be non-halal",
          "Certification matters more than a “no pork” sign here",
        ],
      },
      {
        h2: "The chains people search for",
        body: [
          "The most-searched bakery and café halal questions in Singapore are Paris Baguette, BreadTalk, Cedele, Four Leaves, Swee Heng and Tiong Bahru Bakery, plus dessert names like Awfully Chocolate. Status varies — some carry MUIS certification for products or outlets, others don't — so check each specifically.",
        ],
        bullets: [
          "Paris Baguette, BreadTalk, Cedele, Four Leaves, Swee Heng — top searches",
          "Some are certified for products/outlets; others are not",
          "Check the specific outlet or product line, not the brand name alone",
        ],
      },
      {
        h2: "Coffee chains & cafés",
        body: [
          "Café questions — Starbucks, Coffee Bean, Tiong Bahru Bakery and the like — usually come down to the food menu rather than the drinks. Plain coffee and tea are generally fine; the check is on cakes, pastries and any items with alcohol-based flavouring or non-halal gelatine.",
        ],
        bullets: [
          "Plain coffee and tea are generally not the concern",
          "Check cakes, pastries and cream fillings",
          "Muslim-owned cafés remove the guesswork — filter for them",
        ],
      },
      {
        h2: "Finding certified bakes & desserts",
        body: [
          "For celebration cakes and everyday bakes you can trust, use the directory to filter for MUIS-certified and Muslim-owned bakeries, and see our cakes-and-bakeries guide for where to order.",
        ],
        links: [
          { label: "Halal cakes & bakeries in Singapore", href: "/blog/halal-cakes-bakeries-singapore" },
          { label: "Is it halal? brand checker", href: "/is-halal" },
          { label: "Browse the halal directory", href: "/halal" },
        ],
      },
    ],
    faq: [
      { q: "Is Paris Baguette halal in Singapore?", a: "Paris Baguette's halal status in Singapore should be confirmed per outlet and product on the MUIS HalalSG register or via the certificate in-store. Bakeries can use alcohol-based flavourings or non-halal gelatine, so certification — not a “no pork” sign — is the reliable check." },
      { q: "Is BreadTalk halal?", a: "BreadTalk's certification can vary by product line and outlet, so verify on the official MUIS register or the in-store certificate. Some items or outlets may be certified while others are not." },
      { q: "Why do bakeries need certification if there's no pork?", a: "Because baked goods can contain alcohol in flavourings and fillings, and non-halal gelatine, emulsifiers or fats — none of which a “no pork” sign covers. MUIS certification checks the full ingredient and process chain." },
      { q: "Where can I find guaranteed halal cakes?", a: "Filter the Humble Halal directory for MUIS-certified and Muslim-owned bakeries, or see our halal cakes and bakeries guide for celebration cakes and everyday bakes you can order with confidence." },
    ],
    related: ["is-it-halal-popular-chains-singapore", "halal-cakes-bakeries-singapore"],
  },

  {
    slug: "aqiqah-singapore-guide",
    title: "Aqiqah in Singapore: A Simple Guide for New Parents (2026)",
    dek: "What aqiqah is, when to do it, how many sheep, and how aqiqah packages work in Singapore — a plain-English guide for new Muslim parents.",
    answer:
      "Aqiqah is the sunnah of sacrificing sheep or goat to celebrate a new baby, traditionally on the seventh day after birth — two animals for a boy and one for a girl, with the meat cooked and shared. In Singapore, most families use an aqiqah service or provider that handles the sacrifice (often overseas) and delivers cooked food or arranges a kenduri, so parents can fulfil the sunnah without managing it themselves.",
    datePublished: "2026-07-15",
    author: AUTHOR,
    readMins: 7,
    tags: ["Aqiqah", "Community", "Muslim services"],
    sections: [
      {
        h2: "What is aqiqah?",
        body: [
          "Aqiqah is a recommended act (sunnah) performed to give thanks for the birth of a child. It involves sacrificing a sheep or goat, with the meat prepared and distributed to family, neighbours and those in need. It is traditionally paired with naming the baby and shaving the head, and giving the weight of the hair in silver to charity.",
        ],
        bullets: [
          "A sunnah to celebrate and give thanks for a newborn",
          "Meat is cooked and shared, including with those in need",
          "Often paired with naming and the hair-shaving custom",
        ],
      },
      {
        h2: "When and how many animals",
        body: [
          "The recommended time is the seventh day after birth, though it can be done later if needed. The commonly cited sunnah is two sheep or goats for a boy and one for a girl — but scholars note that one for a boy is also acceptable if that is what a family can manage. Your provider or a religious teacher can advise on your situation.",
        ],
        bullets: [
          "Recommended on the 7th day; can be done later",
          "Two animals for a boy, one for a girl (one for a boy is also accepted)",
          "Ask a provider or asatizah if you're unsure",
        ],
      },
      {
        h2: "How aqiqah services work in Singapore",
        body: [
          "Because livestock sacrifice isn't practical in Singapore, most families book an aqiqah package. Providers typically arrange the sacrifice (frequently overseas, where the meat is also distributed to those in need) and then deliver cooked food to your home or cater a small kenduri. Packages differ in what's included, so compare carefully.",
        ],
        bullets: [
          "Provider arranges the sacrifice, often overseas with local distribution",
          "You receive cooked food delivery or a catered kenduri in Singapore",
          "Compare packages on animals, portions, menu and distribution",
        ],
      },
      {
        h2: "Choosing an aqiqah provider",
        body: [
          "Look for a Muslim-owned provider with clear pricing, transparency on where and how the sacrifice is done, and good reviews. Confirm the food is halal-catered, whether distribution to the needy is included, and the delivery date around your baby's seventh day. Browse Muslim-owned services and halal caterers to compare.",
        ],
        links: [
          { label: "Browse Muslim-owned businesses & services", href: "/blog/muslim-owned-businesses-singapore" },
          { label: "Halal catering in Singapore", href: "/blog/halal-catering-singapore-guide" },
          { label: "Find services in the directory", href: "/halal" },
        ],
      },
    ],
    faq: [
      { q: "What is aqiqah?", a: "Aqiqah is the sunnah of sacrificing a sheep or goat to give thanks for a newborn, with the meat cooked and shared, including with those in need. It is traditionally done on the seventh day after birth alongside naming the baby." },
      { q: "How many sheep for aqiqah, boy vs girl?", a: "The commonly cited sunnah is two sheep or goats for a boy and one for a girl. Scholars also accept one animal for a boy if that is what a family can afford, so ask a provider or religious teacher about your situation." },
      { q: "When should aqiqah be done?", a: "The recommended time is the seventh day after the baby's birth, though it can be performed later if the seventh day isn't possible. Many Singapore providers schedule the cooked-food delivery or kenduri around that date." },
      { q: "How does aqiqah work in Singapore?", a: "Most families book an aqiqah package: the provider arranges the sacrifice (often overseas, with the meat distributed to those in need) and delivers cooked food or caters a kenduri in Singapore. Compare packages on the number of animals, menu and what distribution is included." },
    ],
    related: ["muslim-owned-businesses-singapore", "halal-catering-singapore-guide"],
    dropcap: true,
  },
];

/* ---- Feature image + category, keyed by slug ----
   Unsplash IDs are confirmed-loading (verified over HTTP). */
interface BlogMeta {
  category: BlogCategorySlug;
  image: string;
  imageAlt: string;
  imageCredit?: string;
  /** Lead vertical id (lib/lead-verticals) — enables the inline capture teaser. */
  leadVertical?: string;
}

const META: Record<string, BlogMeta> = {
  "what-is-halal-singapore": { category: "halal-basics", image: "/blog/what-is-halal-singapore.webp", imageAlt: "Muslim family reading Islamic guidelines beside MUIS halal-certified groceries in Singapore" },
  "how-to-check-muis-halal-certification": { category: "halal-basics", image: "/blog/how-to-check-muis-halal-certification.webp", imageAlt: "Checking a restaurant's MUIS halal certificate on a phone outside a Singapore eatery" },
  "is-it-halal-how-to-tell-singapore": { category: "halal-basics", image: "/blog/is-it-halal-how-to-tell-singapore.webp", imageAlt: "Using a magnifying glass to check a snack's ingredient list for halal status in Singapore" },
  "best-halal-restaurants-singapore-2026": { category: "restaurants-cafes", image: "/blog/best-halal-restaurants-singapore-2026.webp", imageAlt: "Couple dining at a halal fine-dining restaurant with a Marina Bay view in Singapore" },
  "halal-buffet-guide-singapore": { category: "restaurants-cafes", image: "/blog/halal-buffet-guide-singapore.webp", imageAlt: "Family at a halal buffet line with a wide spread of dishes in Singapore", leadVertical: "catering" },
  "best-halal-cafes-singapore": { category: "restaurants-cafes", image: "/blog/best-halal-cafes-singapore.webp", imageAlt: "Latte art, brunch plates and cake on a marble table at a halal-friendly café in Singapore" },
  "halal-high-tea-singapore": { category: "restaurants-cafes", image: "/blog/halal-high-tea-singapore.webp", imageAlt: "Tiered high-tea stand of scones, pastries and sandwiches at a halal-friendly Singapore hotel", leadVertical: "catering" },
  "best-halal-breakfast-singapore": { category: "restaurants-cafes", image: "/blog/best-halal-breakfast-singapore.webp", imageAlt: "Halal breakfast spread of kaya toast, soft-boiled eggs, teh tarik and pancakes in Singapore" },
  "halal-steamboat-hotpot-singapore": { category: "cuisines", image: "/blog/halal-steamboat-hotpot-singapore.webp", imageAlt: "Halal steamboat hotpot with sliced meat, seafood and vegetables in Singapore" },
  "halal-sushi-japanese-singapore": { category: "cuisines", image: "/blog/halal-sushi-japanese-singapore.webp", imageAlt: "Platter of halal-friendly sushi and sashimi at a Japanese restaurant in Singapore" },
  "halal-korean-food-singapore": { category: "cuisines", image: "/blog/halal-korean-food-singapore.webp", imageAlt: "Halal Korean spread of bibimbap, fried chicken, tteokbokki and stew at a Singapore restaurant" },
  "halal-fine-dining-singapore": { category: "cuisines", image: "/blog/halal-fine-dining-singapore.webp", imageAlt: "Plated halal fine-dining beef course at an elegant Singapore restaurant" },
  "halal-steak-singapore": { category: "cuisines", image: "/blog/halal-steak-singapore.webp", imageAlt: "Grilled halal steak sliced to show a medium centre at a Singapore steakhouse" },
  "halal-cakes-bakeries-singapore": { category: "cuisines", image: "/blog/halal-cakes-bakeries-singapore.webp", imageAlt: "Display of halal celebration cakes, macarons and pastries at a Singapore bakery", leadVertical: "catering" },
  "halal-dim-sum-singapore": { category: "cuisines", image: "/blog/halal-dim-sum-singapore.webp", imageAlt: "Bamboo steamers of halal dim sum — har gow, siew mai and buns — with tea in Singapore" },
  "halal-food-jewel-changi-airport": { category: "areas-malls", image: "/blog/halal-food-jewel-changi-airport.webp", imageAlt: "Halal local dishes served in front of the Rain Vortex waterfall at Jewel Changi Airport" },
  "halal-food-bugis-arab-street": { category: "areas-malls", image: "/blog/halal-food-bugis-arab-street.webp", imageAlt: "Halal street-food spread with Sultan Mosque and Kampong Glam shophouses behind in Singapore" },
  "halal-catering-singapore-guide": { category: "seasonal-events", image: "/blog/halal-catering-singapore-guide.webp", imageAlt: "Halal catering buffet with chafing dishes and satay set up at a Singapore event", leadVertical: "catering" },
  "ramadan-singapore-2026-guide": { category: "seasonal-events", image: bimg("1543007630-9710e4a00a20"), imageAlt: "Dates and a meal for breaking fast during Ramadan" },
  "muslim-owned-businesses-singapore": { category: "community-business", image: "/blog/muslim-owned-businesses-singapore.webp", imageAlt: "Hijabi shopkeeper serving a customer at a Muslim-owned beauty and fashion store in Singapore" },
  "malay-wedding-cost-singapore": { category: "community-business", image: bimg("1519741497674-611481863552"), imageAlt: "Elegantly set Malay wedding reception table with floral pelamin decor in Singapore", leadVertical: "weddings" },
  "halal-food-johor-bahru-guide": { category: "muslim-travel", image: bimg("1504674900247-0877df9cc836"), imageAlt: "Halal spread at a Johor Bahru food court on a day trip from Singapore" },
  "crossing-to-johor-bahru-checkpoints-transport": { category: "muslim-travel", image: bimg("1500835556837-99ac94a94552"), imageAlt: "The road crossing from Singapore to Johor Bahru" },
  "umrah-from-singapore-guide": { category: "muslim-travel", image: bimg("1543007630-9710e4a00a20"), imageAlt: "Dates and preparations for an umrah pilgrimage from Singapore" },
  "halal-mala-singapore": { category: "cuisines", image: bimg("1565299624946-b28f40a0ae38"), imageAlt: "Halal mala xiang guo with vegetables and sliced meat in Singapore" },
  "halal-mookata-singapore": { category: "cuisines", image: bimg("1556909114-f6e7ad7d3136"), imageAlt: "Halal mookata Thai barbecue steamboat cooking at a table in Singapore" },
  "halal-korean-bbq-singapore": { category: "cuisines", image: bimg("1565557623262-b51c2513a641"), imageAlt: "Halal Korean BBQ with marinated beef and banchan side dishes in Singapore" },
  "halal-western-food-singapore": { category: "cuisines", image: bimg("1556909114-f6e7ad7d3136"), imageAlt: "Halal Western steak and sides plated at a Singapore restaurant" },
  "is-it-halal-popular-chains-singapore": { category: "halal-questions", image: bimg("1504674900247-0877df9cc836"), imageAlt: "Checking whether popular food chains are halal in Singapore" },
  "is-it-halal-bakeries-cafes-singapore": { category: "halal-questions", image: bimg("1565299624946-b28f40a0ae38"), imageAlt: "Checking whether popular bakeries and cafés are halal in Singapore" },
  "aqiqah-singapore-guide": { category: "muslim-services", image: bimg("1519741497674-611481863552"), imageAlt: "A family kenduri table for an aqiqah celebration in Singapore" },
};

const builtPosts: BlogPost[] = rawPosts.map((p) => {
  const m = META[p.slug];
  if (!m) throw new Error(`blog: missing category/image meta for "${p.slug}" — add it to META in lib/blog.ts`);
  return { ...p, ...m };
});

// Only these slugs render publicly. Adding a slug here publishes that post; any
// new draft left in rawPosts stays hidden until it is listed. This gates the hub,
// post pages, category counts, related posts, sitemap and static params in one place.
const PUBLISHED_SLUGS = new Set<string>([
  "what-is-halal-singapore",
  "how-to-check-muis-halal-certification",
  "best-halal-restaurants-singapore-2026",
  "halal-buffet-guide-singapore",
  "best-halal-cafes-singapore",
  "halal-high-tea-singapore",
  "halal-steamboat-hotpot-singapore",
  "halal-sushi-japanese-singapore",
  "halal-korean-food-singapore",
  "halal-fine-dining-singapore",
  "halal-steak-singapore",
  "halal-cakes-bakeries-singapore",
  "best-halal-breakfast-singapore",
  "halal-food-jewel-changi-airport",
  "is-it-halal-how-to-tell-singapore",
  "halal-food-bugis-arab-street",
  "halal-catering-singapore-guide",
  "ramadan-singapore-2026-guide",
  "halal-dim-sum-singapore",
  "muslim-owned-businesses-singapore",
  "malay-wedding-cost-singapore",
  "halal-food-johor-bahru-guide",
  "crossing-to-johor-bahru-checkpoints-transport",
  "umrah-from-singapore-guide",
  "halal-mala-singapore",
  "halal-mookata-singapore",
  "halal-korean-bbq-singapore",
  "halal-western-food-singapore",
  "is-it-halal-popular-chains-singapore",
  "is-it-halal-bakeries-cafes-singapore",
  "aqiqah-singapore-guide",
]);

export const posts: BlogPost[] = builtPosts.filter((p) => PUBLISHED_SLUGS.has(p.slug));

const BY_SLUG = new Map(posts.map((p) => [p.slug, p]));

export function allPosts(): BlogPost[] {
  return [...posts].sort((a, b) => b.datePublished.localeCompare(a.datePublished));
}

export function getPost(slug: string): BlogPost | undefined {
  return BY_SLUG.get(slug);
}

const BY_SLUG_ALL = new Map(builtPosts.map((p) => [p.slug, p]));

/** Any authored post by slug — including ones not in PUBLISHED_SLUGS. Lets a
 *  gone /blog/<slug> recover its category for a relevant 301 (lib/gone-redirects). */
export function getAnyPost(slug: string): BlogPost | undefined {
  return BY_SLUG_ALL.get(slug);
}

export function relatedPosts(post: BlogPost, limit = 3): BlogPost[] {
  const picked = (post.related || []).map((s) => BY_SLUG.get(s)).filter(Boolean) as BlogPost[];
  if (picked.length >= limit) return picked.slice(0, limit);
  // Pad the shortfall with the NEWEST posts, not raw authored-array order.
  const rest = allPosts().filter((p) => p.slug !== post.slug && !picked.includes(p));
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
