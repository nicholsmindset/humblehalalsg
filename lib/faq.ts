/* Answer-first FAQ content — surfaced visibly AND as FAQPage schema.
   Written to be citable by AI answer engines (clear definitions, SG-specific). */
export interface QA {
  q: string;
  a: string;
}

export const HOME_FAQ: QA[] = [
  {
    q: "Is the food listed on Humble Halal halal certified?",
    a: "Not all of it, and we make the difference unmistakable. Listings marked “MUIS Certified” or “Admin Verified” have been officially certified or document-checked. Listings marked “Halal-Friendly” or “No Pork No Lard” are self-declared by the business and are explicitly labelled “not certified.” Always confirm certification on the official MUIS HalalSG register.",
  },
  {
    q: "What does MUIS Certified mean in Singapore?",
    a: "MUIS (Majlis Ugama Islam Singapura) is Singapore’s official Islamic authority and the only body that issues halal certification. A MUIS Certified badge on Humble Halal means the establishment holds a valid MUIS halal certificate, and we link to its HalalSG verification.",
  },
  {
    q: "How do I find halal food near me in Singapore?",
    a: "Open the map view and tap “Near me” to sort halal restaurants, cafés and Muslim-owned businesses by distance from your location. You can also browse by area (Tampines, Bugis, Geylang Serai, Bedok and more) or filter by prayer space, family-friendly and open-now.",
  },
  {
    q: "Is Humble Halal a halal certifier?",
    a: "No. Humble Halal is a discovery and directory platform, not a certifier. We surface official certification status and link to MUIS HalalSG, but we do not issue halal certificates ourselves.",
  },
  {
    q: "Do these places have prayer spaces?",
    a: "Many do. Listings with a prayer space show details such as gender arrangement, wudhu (ablution) facilities, capacity and whether mats or telekung are provided. The prayer-times strip also shows the nearest mosque.",
  },
  {
    q: "Where can I find the best halal food in Singapore?",
    a: "Start with the map to see halal spots near you, or browse by area (Tampines, Bugis, Geylang Serai, Bedok, Jurong and more) and by cuisine — halal buffet, sushi, Korean, fine dining, high tea and Thai all have their own guides. Sort by halal-confidence score and rating to find the best-reviewed options.",
  },
  {
    q: "Does Humble Halal cover halal restaurants and cafés across all of Singapore?",
    a: "Yes. We list MUIS-certified and Muslim-owned restaurants, cafés, groceries and services across the island, from the heartlands to the city — each with halal status, reviews, prayer-space info and directions. New places are added regularly.",
  },
];

export const VERIFY_FAQ: QA[] = [
  {
    q: "What is the difference between MUIS Certified and Halal-Friendly on Humble Halal?",
    a: "MUIS Certified means the business holds an official MUIS halal certificate (we link to HalalSG to verify). Halal-Friendly is a self-declaration by the business that it serves halal-friendly food, and it is explicitly labelled “not certified.” The visual badge styles are deliberately different so the distinction is never ambiguous.",
  },
  {
    q: "What does “Admin Verified” mean?",
    a: "Admin Verified means the Humble Halal team has reviewed supporting documents (such as a business registration or certificate) for a Muslim-owned business that may not carry MUIS certification. It is a trust signal, not a substitute for MUIS halal certification.",
  },
  {
    q: "How often is certification re-checked?",
    a: "Certified listings show a “last verified” date, certificate number and expiry. Where a listing’s halal status has recently changed, we flag it so you can re-confirm before visiting.",
  },
  {
    q: "How can I report an incorrect halal status?",
    a: "Every listing has a “Report incorrect info” option. You can flag a wrong halal status, closed business, wrong hours or changed ownership, and our team reviews it.",
  },
];

export const TRAVEL_FAQ: QA[] = [
  { q: "Are the hotels and flights “halal certified”?", a: "No — Humble Halal is a discovery platform, not a certifier. We surface factual, Muslim-friendly details (prayer rooms, halal dining nearby, alcohol-free options, Muslim-meal flags, prayer-aware layovers, qibla) from each hotel's or airline's own information. Always confirm specifics with the hotel or airline." },
  { q: "Can I book flights and a hotel together?", a: "Yes. Search Muslim-friendly hotels and flights for Umrah, Hajj or everyday Muslim travel, and plan your whole trip in one place. Payment is handled securely by our travel partner." },
  { q: "Do you support Umrah and Hajj?", a: "Yes — use the Jeddah and Madinah presets, see the Hijri date and Ramadan/Hajj-season flags, and pair flights with a Muslim-friendly stay near the Haramain." },
  { q: "When am I charged, and can I cancel?", a: "You're never charged without a confirmed booking, and cancellations follow the hotel's or airline's own policy (shown before you pay). You can manage and cancel eligible bookings in My Trips." },
];

export const BUSINESS_FAQ: QA[] = [
  { q: "How do I list my business?", a: "Create a free listing from the For Business page. You can add your details, photos, opening hours and halal information, then upgrade for a verification review and more visibility." },
  { q: "What does the Verified badge mean?", a: "It means our team has reviewed documentary proof for that business (for example a MUIS certificate or supplier certifications). Self-declared information is shown without a Verified badge. See How we verify for the full badge system." },
  { q: "Can I advertise with Humble Halal?", a: "Yes — see Advertise with us for formats and how to reach Singapore's Muslim community, or email partners@humblehalal.com." },
];
