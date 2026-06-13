/* Humble Halal — factual airport prayer-facility reference for the flights moat.
   Powers prayer-aware layovers (is there a musalla? is the layover long enough to
   pray?) and qibla/prayer-time calc at stops & destinations. Coordinates are the
   airport's published location; `prayerRoom` reflects publicly documented prayer/
   multifaith facilities. This is factual reference data — it never asserts a hotel
   or business is "halal". Where unsure, an airport is simply omitted (we show
   nothing rather than guess). */

export interface AirportAmenity {
  iata: string;
  city: string;
  lat: number;
  lng: number;
  countryCode: string;
  prayerRoom: boolean;
  musalla?: string; // short factual note on the prayer facility / location
}

const RAW: AirportAmenity[] = [
  // ── SE Asia ──
  { iata: "SIN", city: "Singapore", lat: 1.3644, lng: 103.9915, countryCode: "SG", prayerRoom: true, musalla: "Prayer rooms in every terminal (Changi)" },
  { iata: "KUL", city: "Kuala Lumpur", lat: 2.7456, lng: 101.7099, countryCode: "MY", prayerRoom: true, musalla: "Surau in all terminals, with wudu facilities" },
  { iata: "CGK", city: "Jakarta", lat: -6.1256, lng: 106.6559, countryCode: "ID", prayerRoom: true, musalla: "Musala throughout the terminals" },
  { iata: "DPS", city: "Bali", lat: -8.7482, lng: 115.1672, countryCode: "ID", prayerRoom: true, musalla: "Musala in domestic & international areas" },
  { iata: "BKK", city: "Bangkok", lat: 13.69, lng: 100.7501, countryCode: "TH", prayerRoom: true, musalla: "Prayer rooms (Suvarnabhumi)" },
  { iata: "DMK", city: "Bangkok", lat: 13.9126, lng: 100.6068, countryCode: "TH", prayerRoom: true },
  { iata: "BWN", city: "Bandar Seri Begawan", lat: 4.9442, lng: 114.9283, countryCode: "BN", prayerRoom: true, musalla: "Surau on site" },
  // ── Gulf & Middle East ──
  { iata: "DXB", city: "Dubai", lat: 25.2532, lng: 55.3657, countryCode: "AE", prayerRoom: true, musalla: "Prayer rooms in every concourse, with wudu" },
  { iata: "AUH", city: "Abu Dhabi", lat: 24.433, lng: 54.6511, countryCode: "AE", prayerRoom: true, musalla: "Prayer rooms throughout" },
  { iata: "DOH", city: "Doha", lat: 25.2731, lng: 51.6081, countryCode: "QA", prayerRoom: true, musalla: "Prayer rooms (Hamad Intl), with wudu" },
  { iata: "KWI", city: "Kuwait City", lat: 29.2266, lng: 47.9689, countryCode: "KW", prayerRoom: true, musalla: "Mosque & prayer rooms" },
  { iata: "BAH", city: "Manama", lat: 26.2708, lng: 50.6336, countryCode: "BH", prayerRoom: true },
  { iata: "MCT", city: "Muscat", lat: 23.5933, lng: 58.2844, countryCode: "OM", prayerRoom: true, musalla: "Prayer rooms with wudu" },
  { iata: "AMM", city: "Amman", lat: 31.7226, lng: 35.9932, countryCode: "JO", prayerRoom: true },
  { iata: "BEY", city: "Beirut", lat: 33.8209, lng: 35.4884, countryCode: "LB", prayerRoom: true },
  // ── Umrah / Hajj corridor ──
  { iata: "JED", city: "Jeddah", lat: 21.6796, lng: 39.1565, countryCode: "SA", prayerRoom: true, musalla: "Mosques & prayer halls; Hajj Terminal nearby" },
  { iata: "MED", city: "Madinah", lat: 24.5534, lng: 39.705, countryCode: "SA", prayerRoom: true, musalla: "Prayer halls; ~15 km from Masjid an-Nabawi" },
  { iata: "RUH", city: "Riyadh", lat: 24.9576, lng: 46.6988, countryCode: "SA", prayerRoom: true, musalla: "Mosques in each terminal" },
  { iata: "DMM", city: "Dammam", lat: 26.4712, lng: 49.7979, countryCode: "SA", prayerRoom: true, musalla: "Grand mosque on site" },
  // ── Türkiye / N Africa ──
  { iata: "IST", city: "Istanbul", lat: 41.2753, lng: 28.7519, countryCode: "TR", prayerRoom: true, musalla: "Large mosque + prayer rooms (Istanbul Airport)" },
  { iata: "SAW", city: "Istanbul", lat: 40.8986, lng: 29.3092, countryCode: "TR", prayerRoom: true, musalla: "Mescit (prayer room) on site" },
  { iata: "CAI", city: "Cairo", lat: 30.1219, lng: 31.4056, countryCode: "EG", prayerRoom: true },
  { iata: "CMN", city: "Casablanca", lat: 33.3675, lng: -7.5898, countryCode: "MA", prayerRoom: true },
  // ── South Asia ──
  { iata: "DEL", city: "Delhi", lat: 28.5562, lng: 77.1, countryCode: "IN", prayerRoom: true, musalla: "Multi-faith prayer rooms" },
  { iata: "BOM", city: "Mumbai", lat: 19.0896, lng: 72.8656, countryCode: "IN", prayerRoom: true },
  { iata: "KHI", city: "Karachi", lat: 24.9065, lng: 67.1608, countryCode: "PK", prayerRoom: true, musalla: "Masjid on site" },
  { iata: "LHE", city: "Lahore", lat: 31.5216, lng: 74.4036, countryCode: "PK", prayerRoom: true, musalla: "Masjid on site" },
  { iata: "ISB", city: "Islamabad", lat: 33.5491, lng: 72.8258, countryCode: "PK", prayerRoom: true, musalla: "Masjid on site" },
  { iata: "DAC", city: "Dhaka", lat: 23.8433, lng: 90.3978, countryCode: "BD", prayerRoom: true, musalla: "Prayer rooms with wudu" },
  { iata: "CMB", city: "Colombo", lat: 7.1808, lng: 79.8841, countryCode: "LK", prayerRoom: true },
  { iata: "MLE", city: "Malé", lat: 4.1918, lng: 73.5291, countryCode: "MV", prayerRoom: true, musalla: "Prayer rooms on site" },
  // ── East Asia ──
  { iata: "HKG", city: "Hong Kong", lat: 22.308, lng: 113.9185, countryCode: "HK", prayerRoom: true, musalla: "Multi-faith prayer rooms" },
  { iata: "ICN", city: "Seoul", lat: 37.4602, lng: 126.4407, countryCode: "KR", prayerRoom: true, musalla: "Prayer rooms with wudu in both terminals" },
  { iata: "NRT", city: "Tokyo", lat: 35.772, lng: 140.3929, countryCode: "JP", prayerRoom: true, musalla: "Prayer rooms with wudu" },
  { iata: "HND", city: "Tokyo", lat: 35.5494, lng: 139.7798, countryCode: "JP", prayerRoom: true, musalla: "Prayer rooms with wudu" },
  { iata: "KIX", city: "Osaka", lat: 34.4347, lng: 135.244, countryCode: "JP", prayerRoom: true },
  { iata: "PVG", city: "Shanghai", lat: 31.1443, lng: 121.8083, countryCode: "CN", prayerRoom: true },
  { iata: "PEK", city: "Beijing", lat: 40.0799, lng: 116.6031, countryCode: "CN", prayerRoom: true },
  { iata: "CAN", city: "Guangzhou", lat: 23.3924, lng: 113.2988, countryCode: "CN", prayerRoom: true },
  { iata: "TPE", city: "Taipei", lat: 25.0777, lng: 121.2328, countryCode: "TW", prayerRoom: true, musalla: "Prayer rooms with wudu" },
  // ── Europe ──
  { iata: "LHR", city: "London", lat: 51.47, lng: -0.4543, countryCode: "GB", prayerRoom: true, musalla: "Multi-faith prayer rooms in every terminal" },
  { iata: "LGW", city: "London", lat: 51.1537, lng: -0.1821, countryCode: "GB", prayerRoom: true },
  { iata: "CDG", city: "Paris", lat: 49.0097, lng: 2.5479, countryCode: "FR", prayerRoom: true, musalla: "Multi-faith prayer rooms" },
  { iata: "FRA", city: "Frankfurt", lat: 50.0379, lng: 8.5622, countryCode: "DE", prayerRoom: true, musalla: "Prayer rooms with wudu" },
  { iata: "AMS", city: "Amsterdam", lat: 52.3105, lng: 4.7683, countryCode: "NL", prayerRoom: true, musalla: "Meditation centre / prayer space" },
  { iata: "MAD", city: "Madrid", lat: 40.4983, lng: -3.5676, countryCode: "ES", prayerRoom: true },
  // ── Americas / Oceania / Africa ──
  { iata: "JFK", city: "New York", lat: 40.6413, lng: -73.7781, countryCode: "US", prayerRoom: true, musalla: "Interfaith prayer rooms" },
  { iata: "LAX", city: "Los Angeles", lat: 33.9416, lng: -118.4085, countryCode: "US", prayerRoom: true, musalla: "Interfaith chapels / prayer rooms" },
  { iata: "SYD", city: "Sydney", lat: -33.9399, lng: 151.1753, countryCode: "AU", prayerRoom: true, musalla: "Prayer rooms / reflection rooms" },
  { iata: "PER", city: "Perth", lat: -31.9385, lng: 115.9672, countryCode: "AU", prayerRoom: true },
  { iata: "JNB", city: "Johannesburg", lat: -26.1392, lng: 28.246, countryCode: "ZA", prayerRoom: true, musalla: "Prayer rooms with wudu" },
];

const BY_IATA = new Map(RAW.map((a) => [a.iata, a]));

export function airportAmenity(iata: string): AirportAmenity | undefined {
  return BY_IATA.get((iata || "").toUpperCase());
}

/** A layover is "comfortable to pray" when it leaves enough time after transit. */
export const PRAYER_LAYOVER_MIN = 75;
