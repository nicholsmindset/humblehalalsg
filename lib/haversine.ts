/* Humble Halal — great-circle distance (Haversine) + the Haramain coordinates,
   so we can show "X to the Haram" for Umrah stays. Pure geometry — no API, no key.
   Reuses the Kaaba coordinate from lib/qibla.ts (single source of truth). */
import { KAABA } from "./qibla";

/** Centre of Masjid an-Nabawi (the Prophet's Mosque, Madinah). */
export const MASJID_NABAWI = { lat: 24.4672, lng: 39.6112 };

export interface LatLng {
  lat: number;
  lng: number;
}

/** Metres between two lat/lng points on the Earth's surface (Haversine). */
export function haversineM(a: LatLng, b: LatLng): number {
  const R = 6_371_000; // mean Earth radius, metres
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

export interface Haram {
  key: "makkah" | "madinah";
  name: string;
  coords: LatLng;
}

export const HARAMAIN: Haram[] = [
  { key: "makkah", name: "Masjid al-Haram", coords: KAABA },
  { key: "madinah", name: "Masjid an-Nabawi", coords: MASJID_NABAWI },
];

/** Hotels marketed for Umrah sit within walking/shuttle range of a Haram; beyond
 *  this radius "near the Haram" stops being a meaningful claim, so we return null
 *  (keeps the badge honest for the rest of the world). */
const HARAM_NEAR_RADIUS_M = 6_000;

/** If a point is within ~6 km of one of the Haramain, return that Haram and the
 *  distance in metres; otherwise null. */
export function nearestHaram(coords: LatLng): { haram: Haram; distanceM: number } | null {
  let best: { haram: Haram; distanceM: number } | null = null;
  for (const haram of HARAMAIN) {
    const distanceM = haversineM(coords, haram.coords);
    if (!best || distanceM < best.distanceM) best = { haram, distanceM };
  }
  return best && best.distanceM <= HARAM_NEAR_RADIUS_M ? best : null;
}
