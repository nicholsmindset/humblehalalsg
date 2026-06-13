/* Humble Halal — curated travel destinations for the halal hotel vertical.
   Phase-1 hubs lead with Umrah intent (Mecca/Medina), then high-intent
   Muslim-travel cities. `cityName`/`countryCode` are the LiteAPI search params;
   the rest drives the SEO hub copy + map. Add cities here to mint new hubs. */

export interface TravelCity {
  slug: string; // /travel/<slug>
  name: string; // display
  cityName: string; // LiteAPI param
  countryCode: string; // ISO 3166-1 alpha-2
  country: string; // display
  coords: { lat: number; lng: number };
  currency: string; // default search currency
  umrah?: boolean;
  landmark?: string; // anchor for "hotels near …"
  blurb: string;
}

export const travelCities: TravelCity[] = [
  {
    slug: "mecca", name: "Mecca", cityName: "Makkah", countryCode: "SA", country: "Saudi Arabia",
    coords: { lat: 21.4225, lng: 39.8262 }, currency: "SAR", umrah: true, landmark: "Masjid al-Haram",
    blurb: "Hotels near Masjid al-Haram for Umrah and Hajj — walking distance to the Holy Mosque, with prayer facilities and halal dining throughout.",
  },
  {
    slug: "medina", name: "Medina", cityName: "Madinah", countryCode: "SA", country: "Saudi Arabia",
    coords: { lat: 24.4709, lng: 39.6112 }, currency: "SAR", umrah: true, landmark: "Al-Masjid an-Nabawi",
    blurb: "Stay close to Al-Masjid an-Nabawi in Medina — Muslim-friendly hotels minutes from the Prophet's Mosque, ideal for Umrah and Ziyarah.",
  },
  {
    slug: "istanbul", name: "Istanbul", cityName: "Istanbul", countryCode: "TR", country: "Türkiye",
    coords: { lat: 41.0082, lng: 28.9784 }, currency: "EUR", landmark: "Sultanahmet",
    blurb: "Muslim-friendly hotels across Istanbul — from Sultanahmet's historic mosques to halal dining on both sides of the Bosphorus.",
  },
  {
    slug: "dubai", name: "Dubai", cityName: "Dubai", countryCode: "AE", country: "United Arab Emirates",
    coords: { lat: 25.2048, lng: 55.2708 }, currency: "AED",
    blurb: "Halal-friendly hotels in Dubai — alcohol-free options, prayer rooms and abundant halal dining for families and Muslim travellers.",
  },
  {
    slug: "kuala-lumpur", name: "Kuala Lumpur", cityName: "Kuala Lumpur", countryCode: "MY", country: "Malaysia",
    coords: { lat: 3.139, lng: 101.6869 }, currency: "MYR",
    blurb: "Muslim-friendly hotels in Kuala Lumpur — halal food everywhere, surau prayer rooms and easy access to mosques across the city.",
  },
  {
    slug: "singapore", name: "Singapore", cityName: "Singapore", countryCode: "SG", country: "Singapore",
    coords: { lat: 1.3521, lng: 103.8198 }, currency: "SGD",
    blurb: "Muslim-friendly hotels in Singapore — close to MUIS-certified halal dining, mosques and the Kampong Glam district.",
  },
  {
    slug: "bangkok", name: "Bangkok", cityName: "Bangkok", countryCode: "TH", country: "Thailand",
    coords: { lat: 13.7563, lng: 100.5018 }, currency: "THB",
    blurb: "Halal-friendly hotels in Bangkok — near halal restaurants, prayer spaces and the city's Muslim neighbourhoods.",
  },
  {
    slug: "jakarta", name: "Jakarta", cityName: "Jakarta", countryCode: "ID", country: "Indonesia",
    coords: { lat: -6.2088, lng: 106.8456 }, currency: "IDR",
    blurb: "Muslim-friendly hotels in Jakarta — prayer facilities, halal dining and easy access to Istiqlal Mosque.",
  },
  {
    slug: "london", name: "London", cityName: "London", countryCode: "GB", country: "United Kingdom",
    coords: { lat: 51.5074, lng: -0.1278 }, currency: "GBP",
    blurb: "Muslim-friendly hotels in London — near halal restaurants in Edgware Road and Whitechapel, with prayer-friendly options.",
  },
];

const BY_SLUG = new Map(travelCities.map((c) => [c.slug, c]));

export function allTravelCities(): TravelCity[] {
  return travelCities;
}

export function getTravelCity(slug: string): TravelCity | undefined {
  return BY_SLUG.get(slug);
}
