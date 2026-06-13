/* Humble Halal — rough per-passenger CO₂ estimate for a flight itinerary. Pure &
   client-safe. This is an ESTIMATE for awareness only (always labelled "est."):
   derived from in-air segment time, not airline fuel data. Method: flight distance
   ≈ cruise speed × airborne hours, then a standard economy emission factor + a
   fixed take-off/landing penalty per segment. */

import type { FlightItinerary, FlightLeg } from "./flights";

const CRUISE_KMH = 780;          // typical jet cruise
const TAXI_CLIMB_MIN = 30;       // not counted as cruise distance
const KG_PER_KM = 0.102;         // economy class, per passenger
const SEGMENT_LTO_KG = 18;       // landing/take-off cycle penalty per segment

function legSegmentsMinutes(leg: FlightLeg): number {
  // prefer real per-segment airborne time; fall back to the leg duration
  const segSum = leg.segments.reduce((a, s) => a + (s.durationMin || 0), 0);
  return segSum > 0 ? segSum : leg.durationMin;
}

/** Estimated CO₂ in kg per passenger for the whole itinerary (all legs). */
export function estimateCO2(it: FlightItinerary): number {
  let kg = 0;
  for (const leg of it.legs) {
    const airborneMin = Math.max(0, legSegmentsMinutes(leg) - TAXI_CLIMB_MIN * leg.segments.length);
    const km = (airborneMin / 60) * CRUISE_KMH;
    kg += km * KG_PER_KM + leg.segments.length * SEGMENT_LTO_KG;
  }
  return Math.round(kg);
}

/** Short label, e.g. "~620 kg CO₂ est." */
export function co2Label(it: FlightItinerary): string {
  return `~${estimateCO2(it)} kg CO₂ est.`;
}
