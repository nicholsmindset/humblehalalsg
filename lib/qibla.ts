/* Humble Halal — Qibla direction. Pure great-circle bearing from any point to the
   Kaaba (Masjid al-Haram, Makkah). Factual geometry — no API, no key. */

export const KAABA = { lat: 21.4225, lng: 39.8262 };

/** Initial compass bearing (0–360°, clockwise from true north) toward the Kaaba. */
export function qiblaBearing(lat: number, lng: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;
  const φ1 = toRad(lat);
  const φ2 = toRad(KAABA.lat);
  const Δλ = toRad(KAABA.lng - lng);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/** 16-point compass label for a bearing (e.g. "NW"). */
export function compassLabel(bearing: number): string {
  const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  return dirs[Math.round(bearing / 22.5) % 16];
}
