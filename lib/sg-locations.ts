/* Singapore regions → towns/planning areas, for the listing location picker.
   Coordinates are area centroids — used to (a) populate the cascading
   Region → Town selectors and (b) snap a picked address/map-pin to the
   nearest town so both fields auto-fill. */
import type { LatLng } from "./types";
import { haversineKm } from "./geo";

export type Region = "Central" | "East" | "North-East" | "North" | "West";

export const REGIONS: Region[] = ["Central", "East", "North-East", "North", "West"];

export interface Town {
  id: string;
  name: string;
  region: Region;
  coords: LatLng;
}

export const towns: Town[] = [
  // ---- Central ----
  { id: "city", name: "City / Downtown", region: "Central", coords: { lat: 1.284, lng: 103.851 } },
  { id: "bugis", name: "Bugis / Rochor", region: "Central", coords: { lat: 1.3005, lng: 103.856 } },
  { id: "little-india", name: "Little India", region: "Central", coords: { lat: 1.3066, lng: 103.8495 } },
  { id: "chinatown", name: "Chinatown / Outram", region: "Central", coords: { lat: 1.283, lng: 103.843 } },
  { id: "tiong-bahru", name: "Tiong Bahru / Bukit Merah", region: "Central", coords: { lat: 1.285, lng: 103.827 } },
  { id: "tanjong-pagar", name: "Tanjong Pagar", region: "Central", coords: { lat: 1.276, lng: 103.843 } },
  { id: "orchard", name: "Orchard", region: "Central", coords: { lat: 1.304, lng: 103.832 } },
  { id: "novena", name: "Novena / Newton", region: "Central", coords: { lat: 1.319, lng: 103.843 } },
  { id: "balestier", name: "Balestier", region: "Central", coords: { lat: 1.327, lng: 103.847 } },
  { id: "toa-payoh", name: "Toa Payoh", region: "Central", coords: { lat: 1.334, lng: 103.85 } },
  { id: "bishan", name: "Bishan", region: "Central", coords: { lat: 1.35, lng: 103.848 } },
  { id: "geylang", name: "Geylang", region: "Central", coords: { lat: 1.314, lng: 103.887 } },
  { id: "kallang", name: "Kallang", region: "Central", coords: { lat: 1.311, lng: 103.871 } },
  { id: "queenstown", name: "Queenstown", region: "Central", coords: { lat: 1.294, lng: 103.805 } },
  { id: "bukit-timah", name: "Bukit Timah", region: "Central", coords: { lat: 1.329, lng: 103.802 } },
  { id: "telok-blangah", name: "Telok Blangah", region: "Central", coords: { lat: 1.275, lng: 103.818 } },
  { id: "pasir-panjang", name: "Pasir Panjang", region: "Central", coords: { lat: 1.276, lng: 103.791 } },
  // ---- East ----
  { id: "tampines", name: "Tampines", region: "East", coords: { lat: 1.353, lng: 103.945 } },
  { id: "bedok", name: "Bedok", region: "East", coords: { lat: 1.324, lng: 103.93 } },
  { id: "pasir-ris", name: "Pasir Ris", region: "East", coords: { lat: 1.372, lng: 103.949 } },
  { id: "changi", name: "Changi", region: "East", coords: { lat: 1.35, lng: 103.989 } },
  { id: "geylang-serai", name: "Geylang Serai / Eunos", region: "East", coords: { lat: 1.319, lng: 103.903 } },
  { id: "paya-lebar", name: "Paya Lebar", region: "East", coords: { lat: 1.318, lng: 103.892 } },
  { id: "marine-parade", name: "Marine Parade", region: "East", coords: { lat: 1.302, lng: 103.905 } },
  { id: "siglap", name: "Siglap", region: "East", coords: { lat: 1.311, lng: 103.93 } },
  { id: "kembangan", name: "Kembangan", region: "East", coords: { lat: 1.321, lng: 103.913 } },
  // ---- North-East ----
  { id: "ang-mo-kio", name: "Ang Mo Kio", region: "North-East", coords: { lat: 1.369, lng: 103.846 } },
  { id: "hougang", name: "Hougang", region: "North-East", coords: { lat: 1.371, lng: 103.892 } },
  { id: "kovan", name: "Kovan", region: "North-East", coords: { lat: 1.36, lng: 103.885 } },
  { id: "serangoon", name: "Serangoon", region: "North-East", coords: { lat: 1.355, lng: 103.873 } },
  { id: "sengkang", name: "Sengkang", region: "North-East", coords: { lat: 1.391, lng: 103.895 } },
  { id: "punggol", name: "Punggol", region: "North-East", coords: { lat: 1.403, lng: 103.909 } },
  // ---- North ----
  { id: "yishun", name: "Yishun", region: "North", coords: { lat: 1.429, lng: 103.835 } },
  { id: "woodlands", name: "Woodlands", region: "North", coords: { lat: 1.436, lng: 103.786 } },
  { id: "sembawang", name: "Sembawang", region: "North", coords: { lat: 1.449, lng: 103.82 } },
  { id: "admiralty", name: "Admiralty", region: "North", coords: { lat: 1.44, lng: 103.801 } },
  { id: "canberra", name: "Canberra", region: "North", coords: { lat: 1.446, lng: 103.829 } },
  { id: "mandai", name: "Mandai", region: "North", coords: { lat: 1.41, lng: 103.812 } },
  // ---- West ----
  { id: "jurong-east", name: "Jurong East", region: "West", coords: { lat: 1.333, lng: 103.742 } },
  { id: "jurong-west", name: "Jurong West", region: "West", coords: { lat: 1.34, lng: 103.705 } },
  { id: "taman-jurong", name: "Taman Jurong", region: "West", coords: { lat: 1.335, lng: 103.72 } },
  { id: "boon-lay", name: "Boon Lay", region: "West", coords: { lat: 1.345, lng: 103.712 } },
  { id: "clementi", name: "Clementi", region: "West", coords: { lat: 1.315, lng: 103.765 } },
  { id: "teban-gardens", name: "Teban Gardens", region: "West", coords: { lat: 1.321, lng: 103.743 } },
  { id: "bukit-batok", name: "Bukit Batok", region: "West", coords: { lat: 1.349, lng: 103.75 } },
  { id: "bukit-panjang", name: "Bukit Panjang", region: "West", coords: { lat: 1.379, lng: 103.762 } },
  { id: "choa-chu-kang", name: "Choa Chu Kang", region: "West", coords: { lat: 1.385, lng: 103.744 } },
  { id: "lim-chu-kang", name: "Lim Chu Kang", region: "West", coords: { lat: 1.43, lng: 103.717 } },
  { id: "tuas", name: "Tuas", region: "West", coords: { lat: 1.321, lng: 103.656 } },
];

/** Towns within a region (alphabetical), for the cascading select. */
export function townsInRegion(region: string): Town[] {
  return towns.filter((t) => t.region === region).sort((a, b) => a.name.localeCompare(b.name));
}

/** Nearest town centroid to a coordinate — used to auto-fill region + town
 *  after an address pick or a map-pin drag. */
export function nearestTown(coords: LatLng): Town {
  let best = towns[0];
  let bestKm = Infinity;
  for (const t of towns) {
    const km = haversineKm(coords, t.coords);
    if (km < bestKm) {
      bestKm = km;
      best = t;
    }
  }
  return best;
}

/** Approximate geographic centre of Singapore (map default before a pin is set). */
export const SG_CENTER: LatLng = { lat: 1.3521, lng: 103.8198 };
