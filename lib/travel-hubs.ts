/* Humble Halal — SEO derivations for /travel/[city] hubs.
   Mirrors lib/seo-pages.ts: turns the curated cities into titled, FAQ-rich hub
   pages with internal links. Pure data — the live hotel grid is fetched in the
   server page via lib/liteapi. */
import { allTravelCities, getTravelCity, type TravelCity } from "./travel-locations";
import { cityGuideFaq } from "./travel-guides";
import type { QA } from "./faq";

export interface TravelHub extends TravelCity {
  h1: string;
  title: string;
}

function h1For(c: TravelCity): string {
  if (c.umrah && c.landmark) return `Hotels near ${c.landmark} — ${c.name} for Umrah`;
  return `Muslim-Friendly Hotels in ${c.name}`;
}

export function toHub(c: TravelCity): TravelHub {
  return {
    ...c,
    h1: h1For(c),
    title: c.umrah ? `${c.name} Umrah hotels — Muslim-friendly stays` : `Muslim-friendly hotels in ${c.name}, ${c.country}`,
  };
}

export function allTravelHubs(): TravelHub[] {
  return allTravelCities().map(toHub);
}

export function getTravelHub(slug: string): TravelHub | undefined {
  const c = getTravelCity(slug);
  return c ? toHub(c) : undefined;
}

/** FAQ items for a hub (drives the on-page FAQ + FAQPage schema / GEO answers).
 *  General hub questions first, then any deep city-specific Q&A (Makkah/Madinah). */
export function travelHubFaq(c: TravelCity): QA[] {
  const near = c.landmark ? `near ${c.landmark}` : `in ${c.name}`;
  return [
    {
      q: `Are there Muslim-friendly hotels ${near}?`,
      a: `Yes. We surface hotels ${near} in ${c.name} that offer Muslim-friendly facilities such as prayer rooms, halal dining nearby, alcohol-free options and qibla direction. Each hotel shows which facilities it has, and verified listings are checked by our team.`,
    },
    {
      q: `How do you decide a hotel is "Muslim-friendly"?`,
      a: `We read each hotel's own published facilities and description to flag features like prayer rooms, halal food and alcohol-free policies, then a team member verifies the badge. Humble Halal is a discovery platform, not a certifier — always confirm specific halal requirements with the hotel directly.`,
    },
    {
      q: c.umrah
        ? `Which hotels are closest to ${c.landmark}?`
        : `Where should Muslim travellers stay in ${c.name}?`,
      a: c.umrah
        ? `Use the map and the "near ${c.landmark}" filter to find the closest stays. Walking distance to the Mosque is the main consideration for most pilgrims, alongside prayer facilities and halal dining.`
        : `Look for areas with halal dining and mosques close by. Filter by prayer room, halal food nearby and alcohol-free to match your needs, and check the map for proximity to what matters to you.`,
    },
    ...cityGuideFaq(c.slug),
  ];
}

/** A few other hubs for internal linking. */
export function relatedHubs(slug: string, limit = 4): TravelHub[] {
  return allTravelHubs().filter((h) => h.slug !== slug).slice(0, limit);
}
