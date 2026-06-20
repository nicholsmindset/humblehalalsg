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
  iata?: string; // nearest airport — powers the "fly there from Singapore" cross-sell (/travel/flights?to=)
  umrah?: boolean;
  landmark?: string; // anchor for "hotels near …"
  blurb: string;
}

export const travelCities: TravelCity[] = [
  {
    slug: "mecca", name: "Mecca", cityName: "Makkah", countryCode: "SA", country: "Saudi Arabia",
    coords: { lat: 21.4225, lng: 39.8262 }, currency: "SAR", iata: "JED", umrah: true, landmark: "Masjid al-Haram",
    blurb: "Hotels near Masjid al-Haram for Umrah and Hajj — walking distance to the Holy Mosque, with prayer facilities and halal dining throughout.",
  },
  {
    slug: "medina", name: "Medina", cityName: "Madinah", countryCode: "SA", country: "Saudi Arabia",
    coords: { lat: 24.4709, lng: 39.6112 }, currency: "SAR", iata: "MED", umrah: true, landmark: "Al-Masjid an-Nabawi",
    blurb: "Stay close to Al-Masjid an-Nabawi in Medina — Muslim-friendly hotels minutes from the Prophet's Mosque, ideal for Umrah and Ziyarah.",
  },
  {
    slug: "istanbul", name: "Istanbul", cityName: "Istanbul", countryCode: "TR", country: "Türkiye",
    coords: { lat: 41.0082, lng: 28.9784 }, currency: "EUR", iata: "IST", landmark: "Sultanahmet",
    blurb: "Muslim-friendly hotels across Istanbul — from Sultanahmet's historic mosques to halal dining on both sides of the Bosphorus.",
  },
  {
    slug: "dubai", name: "Dubai", cityName: "Dubai", countryCode: "AE", country: "United Arab Emirates",
    coords: { lat: 25.2048, lng: 55.2708 }, currency: "AED", iata: "DXB",
    blurb: "Halal-friendly hotels in Dubai — alcohol-free options, prayer rooms and abundant halal dining for families and Muslim travellers.",
  },
  {
    slug: "kuala-lumpur", name: "Kuala Lumpur", cityName: "Kuala Lumpur", countryCode: "MY", country: "Malaysia",
    coords: { lat: 3.139, lng: 101.6869 }, currency: "MYR", iata: "KUL",
    blurb: "Muslim-friendly hotels in Kuala Lumpur — halal food everywhere, surau prayer rooms and easy access to mosques across the city.",
  },
  {
    slug: "singapore", name: "Singapore", cityName: "Singapore", countryCode: "SG", country: "Singapore",
    coords: { lat: 1.3521, lng: 103.8198 }, currency: "SGD",
    blurb: "Muslim-friendly hotels in Singapore — close to MUIS-certified halal dining, mosques and the Kampong Glam district.",
  },
  {
    slug: "bangkok", name: "Bangkok", cityName: "Bangkok", countryCode: "TH", country: "Thailand",
    coords: { lat: 13.7563, lng: 100.5018 }, currency: "THB", iata: "BKK",
    blurb: "Halal-friendly hotels in Bangkok — near halal restaurants, prayer spaces and the city's Muslim neighbourhoods.",
  },
  {
    slug: "jakarta", name: "Jakarta", cityName: "Jakarta", countryCode: "ID", country: "Indonesia",
    coords: { lat: -6.2088, lng: 106.8456 }, currency: "IDR", iata: "CGK",
    blurb: "Muslim-friendly hotels in Jakarta — prayer facilities, halal dining and easy access to Istiqlal Mosque.",
  },
  {
    slug: "london", name: "London", cityName: "London", countryCode: "GB", country: "United Kingdom",
    coords: { lat: 51.5074, lng: -0.1278 }, currency: "GBP", iata: "LHR",
    blurb: "Muslim-friendly hotels in London — near halal restaurants in Edgware Road and Whitechapel, with prayer-friendly options.",
  },
  {
    slug: "seoul", name: "Seoul", cityName: "Seoul", countryCode: "KR", country: "South Korea",
    coords: { lat: 37.5665, lng: 126.978 }, currency: "KRW", iata: "ICN",
    blurb: "Muslim-friendly hotels in Seoul — close to halal restaurants in Itaewon, prayer rooms and the Seoul Central Mosque.",
  },
  {
    slug: "tokyo", name: "Tokyo", cityName: "Tokyo", countryCode: "JP", country: "Japan",
    coords: { lat: 35.6762, lng: 139.6503 }, currency: "JPY", iata: "HND",
    blurb: "Muslim-friendly hotels in Tokyo — near halal dining, prayer spaces and Tokyo Camii, Japan's largest mosque.",
  },
  {
    slug: "osaka", name: "Osaka", cityName: "Osaka", countryCode: "JP", country: "Japan",
    coords: { lat: 34.6937, lng: 135.5023 }, currency: "JPY", iata: "KIX",
    blurb: "Muslim-friendly hotels in Osaka — with halal food nearby, prayer-friendly options and easy access to Osaka Ibaraki Mosque.",
  },
  {
    slug: "hong-kong", name: "Hong Kong", cityName: "Hong Kong", countryCode: "HK", country: "Hong Kong",
    coords: { lat: 22.3193, lng: 114.1694 }, currency: "HKD", iata: "HKG",
    blurb: "Muslim-friendly hotels in Hong Kong — near halal restaurants in Tsim Sha Tsui and the Kowloon Masjid prayer facilities.",
  },
  {
    slug: "taipei", name: "Taipei", cityName: "Taipei", countryCode: "TW", country: "Taiwan",
    coords: { lat: 25.033, lng: 121.5654 }, currency: "TWD", iata: "TPE",
    blurb: "Muslim-friendly hotels in Taipei — close to halal dining and the Taipei Grand Mosque, with prayer-friendly options.",
  },
  {
    slug: "phuket", name: "Phuket", cityName: "Phuket", countryCode: "TH", country: "Thailand",
    coords: { lat: 7.8804, lng: 98.3923 }, currency: "THB", iata: "HKT",
    blurb: "Muslim-friendly hotels in Phuket — near halal seafood, beaches and the island's many mosques, with prayer-friendly stays.",
  },
  {
    slug: "krabi", name: "Krabi", cityName: "Krabi", countryCode: "TH", country: "Thailand",
    coords: { lat: 8.0863, lng: 98.9063 }, currency: "THB", iata: "KBV",
    blurb: "Muslim-friendly hotels in Krabi — a Muslim-majority province with abundant halal food, mosques and prayer-friendly resorts.",
  },
  {
    slug: "hat-yai", name: "Hat Yai", cityName: "Hat Yai", countryCode: "TH", country: "Thailand",
    coords: { lat: 7.0086, lng: 100.4747 }, currency: "THB", iata: "HDY",
    blurb: "Muslim-friendly hotels in Hat Yai — a popular halal-friendly getaway from Singapore with halal dining and mosques throughout.",
  },
  {
    slug: "bali", name: "Bali", cityName: "Denpasar", countryCode: "ID", country: "Indonesia",
    coords: { lat: -8.6705, lng: 115.2126 }, currency: "IDR", iata: "DPS",
    blurb: "Muslim-friendly hotels in Bali — stays with halal dining nearby, prayer facilities and alcohol-free options for families.",
  },
  {
    slug: "ho-chi-minh-city", name: "Ho Chi Minh City", cityName: "Ho Chi Minh City", countryCode: "VN", country: "Vietnam",
    coords: { lat: 10.8231, lng: 106.6297 }, currency: "VND", iata: "SGN",
    blurb: "Muslim-friendly hotels in Ho Chi Minh City — near halal restaurants in District 1 and the Saigon Central Mosque.",
  },
];

const BY_SLUG = new Map(travelCities.map((c) => [c.slug, c]));

export function allTravelCities(): TravelCity[] {
  return travelCities;
}

export function getTravelCity(slug: string): TravelCity | undefined {
  return BY_SLUG.get(slug);
}
