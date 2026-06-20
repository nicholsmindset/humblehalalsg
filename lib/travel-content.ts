/* Humble Halal — canonical /travel landing FAQ. Pure data (no React) so the
   server page can emit FAQPage JSON-LD that EXACTLY matches the visible FAQ
   rendered by components/screens/travel/promo.tsx. Golden rule: we surface
   facts and never assert halal certification. */
import type { QA } from "./faq";

export const TRAVEL_LANDING_FAQ: QA[] = [
  {
    q: "What makes a hotel or flight “Muslim-friendly” on Humble Halal?",
    a: "For stays we surface prayer rooms, halal dining on-site or nearby, alcohol-free options, women-only facilities and mosque proximity, plus prayer times and the qibla. For flights we flag Muslim meals (MOML) available on request, alcohol-free cabins and prayer-room layovers. Every detail comes from the provider's own information — always confirm with the hotel or airline.",
  },
  {
    q: "Are these hotels and flights halal-certified?",
    a: "No. Humble Halal is a discovery platform, not a certifier — we never assert that a hotel or flight is “halal”. Where you see a Verified badge our team has reviewed the listing; everything else is the provider's own declaration, which you should confirm directly.",
  },
  {
    q: "Can I filter for prayer rooms or alcohol-free stays?",
    a: "Yes. After you search stays you can filter by prayer room, halal food (on-site or nearby), alcohol-free, women-only facilities and near-a-mosque to find a hotel that fits your needs.",
  },
  {
    q: "Do you have Umrah hotels and flights?",
    a: "Yes. Our Umrah hub gathers Muslim-friendly hotels near Masjid al-Haram in Mecca and Al-Masjid an-Nabawi in Medina, plus live flights from Singapore to Jeddah and Medina, alongside an answer-first Umrah guide. We help you find and book the parts — we are not a licensed Umrah agent.",
  },
  {
    q: "Which destinations have Muslim-friendly hotels?",
    a: "We cover high-intent Muslim-travel cities including Bangkok, Seoul, Tokyo, Osaka, Hong Kong, Taipei, Kuala Lumpur, Bali, Phuket, Istanbul, Dubai and more — each with a guide to Muslim-friendly hotels in that city, and flights to get there.",
  },
  {
    q: "Can I book flights and a hotel together?",
    a: "Yes. Search flights for your Umrah, Hajj or Muslim-travel journey and pair them with a Muslim-friendly stay, so your whole trip is planned in one place. Most hotel rates also offer free cancellation.",
  },
  {
    q: "How is Humble Halal different from a halal travel agency?",
    a: "We're a discovery and booking platform, not an agency — you compare and book Muslim-friendly hotels and flights directly, with the Muslim-first details (prayer, halal dining, alcohol-free, qibla) surfaced for you, and a team that checks listings rather than only an algorithm.",
  },
];
