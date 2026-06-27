/* Humble Halal — deep, city-specific travel guides for the hotel hubs.
   Replaces the templated FAQ with genuinely useful, evergreen Umrah/Ziyarah
   content for Makkah and Madinah first (others can be added over time). Pure
   in-repo data — rendered on /travel/<slug> and emitted as Article + FAQPage
   JSON-LD. Grounded and honest: we never assert halal certification, and
   anything that changes (visas, permits, prices) is hedged to official sources. */
import type { QA } from "./faq";

export interface GuideSection {
  heading: string;
  body: string[]; // one entry per paragraph
}

export interface CityGuide {
  slug: string;
  /** Short dek shown under the guide heading. */
  intro: string;
  /** Last meaningful content review — feeds Article dateModified. */
  updated: string; // ISO date
  sections: GuideSection[];
  /** City-specific Q&A, merged into the hub FAQ + FAQPage schema. */
  faq: QA[];
}

const MECCA: CityGuide = {
  slug: "mecca",
  intro:
    "What Singaporean and Southeast-Asian pilgrims actually need to decide before booking a stay for Umrah in Makkah — how close to the Haram, when to go, and how to get there.",
  updated: "2026-06-01",
  sections: [
    {
      heading: "How close to Masjid al-Haram should you stay?",
      body: [
        "This is the single biggest decision, because Makkah hotels are priced almost entirely by walking distance to the Holy Mosque. It helps to think in three rough bands. The Clock Tower and Ajyad area sits right on the Haram (roughly 0–500 m): you step out almost into the mataf, prices are highest, and it is the easiest choice for elderly travellers, wheelchair users and the Ramadan rush. The ring within about a kilometre — along Ibrahim Al Khalil Street and the surrounding lanes — is a 10–15 minute walk, much better value, and usually served by frequent hotel shuttles. Further out, Aziziyah (around 4–6 km) is where the budget and long-stay hotels cluster, with shuttles or taxis to the Haram.",
        "Distance matters most in the last ten nights of Ramadan, when the streets immediately around the Haram close to traffic and being able to walk is worth far more than at any other time of year.",
        "On every Makkah hotel page we show the straight-line distance to Masjid al-Haram. Treat it as a floor, not the real journey — actual walking routes, gates and crowd control add time, especially at prayer times.",
      ],
    },
    {
      heading: "When to go for Umrah",
      body: [
        "Umrah can be performed year-round, outside the few days of Hajj. Crowds and prices swing enormously: Ramadan — and the last ten nights above all — is the busiest and most expensive period, with school holidays and the weeks around Hajj close behind. The calmer, cheaper windows are generally the months after Ramadan and the cooler autumn and winter season.",
        "Saudi summers are extremely hot. If your group includes older travellers or young children, the cooler months make the walking, queuing and outdoor waiting considerably easier.",
      ],
    },
    {
      heading: "Getting to Makkah",
      body: [
        "Most pilgrims fly into Jeddah (JED, King Abdulaziz International), about 90 km — roughly 1 to 1.5 hours by road — from Makkah. Madinah (MED) is the other gateway, linked to Makkah by the Haramain high-speed railway in about 2 to 2.5 hours, so many itineraries fly into one holy city and out of the other.",
        "Umrah permits and a growing list of services are handled through Saudi Arabia's official Nusuk app. Visa and entry rules change from season to season, so always confirm the current requirements with your travel agent or the official Saudi channels before you book flights.",
      ],
    },
    {
      heading: "Ziyarah around Makkah",
      body: [
        "Beyond the Haram itself, the usual ziyarah stops include Jabal al-Nour with the Cave of Hira, Jabal Thawr, and the plains of Mina and Arafat that feature in Hajj. Most are visited by arranged car or group tour; check access and timings locally, as some sites have limited facilities.",
      ],
    },
    {
      heading: "Prayer, food and practical tips",
      body: [
        "One thing you do not need to vet in Makkah is whether food is halal — all food sold in Saudi Arabia is halal. Our hotel pages still surface on-site restaurants, prayer rooms and nearby mosques so you can match a stay to how your family likes to eat and pray.",
        "Plan your days around prayer. The five daily prayers at the Haram draw vast crowds, and the mataf and upper floors fill early, especially in Ramadan. Women's prayer areas and step-free routes are signposted, and wheelchairs and electric carts are available at the mosque for those who need them.",
      ],
    },
  ],
  faq: [
    {
      q: "How far from Masjid al-Haram should my hotel be?",
      a: "It depends on budget and mobility. Hotels in the Clock Tower / Ajyad area (about 0–500 m) put you right at the Haram and cost the most — best for elderly or wheelchair travellers and for Ramadan. The ring within roughly 1 km is a 10–15 minute walk with much better value and frequent shuttles. Aziziyah (around 4–6 km) is the budget and long-stay choice with shuttle or taxi access. Every Makkah hotel on Humble Halal shows its straight-line distance to the Holy Mosque.",
    },
    {
      q: "Is all the food in Makkah halal?",
      a: "Yes — all food sold in Saudi Arabia is halal, so you don't need to check certification while you're in Makkah. If you have specific dietary needs, our hotel pages still flag on-site halal dining and nearby restaurants so you can plan ahead.",
    },
    {
      q: "When is the best time for a quieter, more affordable Umrah?",
      a: "Outside Ramadan, Hajj season and school holidays. The months after Ramadan and the cooler autumn–winter period are generally the calmest and least expensive, and the milder weather is much kinder for older pilgrims.",
    },
    {
      q: "How do I get from Jeddah airport to Makkah?",
      a: "Makkah is about 90 km (1–1.5 hours) from Jeddah's King Abdulaziz International Airport by car or transfer. From Madinah, the Haramain high-speed railway reaches Makkah in roughly 2–2.5 hours, which is why many trips fly into one holy city and out of the other.",
    },
    {
      q: "Do I need a special visa or permit for Umrah?",
      a: "Pilgrims generally need an Umrah or eligible visa, and permits are increasingly arranged through Saudi Arabia's official Nusuk app. These rules change between seasons, so confirm the current requirements with your agent or the official Saudi channels before booking — Humble Halal helps you find and book the stay, not the visa.",
    },
  ],
};

const MEDINA: CityGuide = {
  slug: "medina",
  intro:
    "How to choose a stay near Al-Masjid an-Nabawi for Umrah and Ziyarah in Madinah — the Central Zone, the Rawdah permit, the sites to visit, and getting there.",
  updated: "2026-06-01",
  sections: [
    {
      heading: "Where to stay near Al-Masjid an-Nabawi",
      body: [
        "Madinah is simpler than Makkah: almost everyone stays in the Central Zone (Markaziyah), the largely pedestrian ring of hotels around the Prophet's Mosque. Properties immediately facing the mosque (roughly 0–500 m) are the premium choice and the easiest for elderly travellers; the next ring within about a kilometre is comfortably walkable and noticeably better value, since the whole area is flat and built for foot traffic.",
        "Because the Central Zone is so compact, you rarely need a shuttle here — the main trade-off is simply price against how many steps you want between your room and the mosque. Every Madinah hotel page shows its straight-line distance to Al-Masjid an-Nabawi.",
      ],
    },
    {
      heading: "Visiting the Rawdah",
      body: [
        "Praying in the Rawdah — the blessed area between the Prophet's pulpit and his chamber — now requires a free timed permit booked through the official Nusuk app, with separate scheduled slots for men and women. Demand is high, so book your slot as early as you can once your dates are set. As with all Saudi arrangements, the process is updated from time to time, so check Nusuk for the current steps before you travel.",
      ],
    },
    {
      heading: "Ziyarah in Madinah",
      body: [
        "Madinah is rich in ziyarah. Common visits include Masjid Quba — the first mosque in Islam — Masjid al-Qiblatayn, and Mount Uhud with the resting place of the martyrs. The date markets and farms on the city's edges are a popular, relaxed stop. Many of these are an easy short drive from the Central Zone.",
      ],
    },
    {
      heading: "When to go, and getting there",
      body: [
        "As in Makkah, Ramadan and the Hajj season are the busiest and dearest times, while the cooler months are calmer and gentler on older travellers. Prince Mohammad Bin Abdulaziz Airport (MED) is only about 15 km — some 20 minutes — from the Central Zone, which makes Madinah a convenient place to begin or end a trip.",
        "The Haramain high-speed railway links Madinah with Makkah and Jeddah, so a common itinerary is to fly into one holy city, travel between them by train, and fly home from the other.",
      ],
    },
    {
      heading: "Prayer, food and practical tips",
      body: [
        "All food sold in Madinah is halal, so dining is one less thing to vet — our hotel pages still highlight on-site restaurants, prayer rooms and nearby mosques. Plan around the congregational prayers at the Nabawi, which fill the mosque and its courtyards well before the adhan during peak seasons; arrive early for a place inside.",
      ],
    },
  ],
  faq: [
    {
      q: "How close are Madinah hotels to the Prophet's Mosque?",
      a: "Most stays are in the Central Zone (Markaziyah) around Al-Masjid an-Nabawi. Hotels facing the mosque sit roughly 0–500 m away — the premium, easiest-walking option — while the next ring within about a kilometre is still very walkable and better value. The area is flat and largely pedestrian, so a shuttle is rarely needed. Each Madinah hotel page shows its straight-line distance to the mosque.",
    },
    {
      q: "Do I need a permit to pray in the Rawdah?",
      a: "Yes. Praying in the Rawdah now requires a free timed permit booked through the official Nusuk app, with separate slots for men and women. Slots go quickly, so book as soon as your dates are confirmed, and check Nusuk for the latest process before you travel.",
    },
    {
      q: "How far is Madinah airport from the Prophet's Mosque?",
      a: "Prince Mohammad Bin Abdulaziz Airport (MED) is about 15 km — roughly 20 minutes — from the Central Zone, making Madinah a convenient start or end point for an Umrah trip.",
    },
    {
      q: "Can I travel between Makkah and Madinah by train?",
      a: "Yes. The Haramain high-speed railway connects Madinah, Makkah and Jeddah, with the Makkah–Madinah journey taking roughly 2–2.5 hours. Many itineraries fly into one holy city, take the train between them, and fly home from the other.",
    },
  ],
};

const GUIDES: Record<string, CityGuide> = {
  mecca: MECCA,
  medina: MEDINA,
};

/** Deep guide for a city hub, if one exists (Makkah/Madinah today). */
export function getCityGuide(slug: string): CityGuide | undefined {
  return GUIDES[slug];
}

/** City-specific FAQ to merge into the hub FAQ (empty when no guide exists). */
export function cityGuideFaq(slug: string): QA[] {
  return GUIDES[slug]?.faq ?? [];
}
