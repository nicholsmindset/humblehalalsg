/* Humble Halal — pure flight data (NO React, server-importable). The airport
   type, default origin, popular routes, and curated marketing "deals" used by
   the unified /travel landing. Live fares are never embedded here — landing
   cards link into live flight search. flights/shared.tsx re-exports these so
   existing client imports keep working. */

export interface Airport { iata: string; name: string; city: string; country: string }

export const SG_ORIGIN: Airport = { iata: "SIN", name: "Changi", city: "Singapore", country: "Singapore" };

export const POPULAR_ROUTES: (Airport & { tag?: string })[] = [
  { iata: "JED", city: "Jeddah", name: "King Abdulaziz Intl", country: "Saudi Arabia", tag: "Umrah" },
  { iata: "MED", city: "Madinah", name: "Prince Mohammad bin Abdulaziz", country: "Saudi Arabia", tag: "Umrah" },
  { iata: "IST", city: "Istanbul", name: "Istanbul Airport", country: "Türkiye" },
  { iata: "DXB", city: "Dubai", name: "Dubai Intl", country: "United Arab Emirates" },
  { iata: "CAI", city: "Cairo", name: "Cairo Intl", country: "Egypt" },
  { iata: "KUL", city: "Kuala Lumpur", name: "KLIA", country: "Malaysia" },
  { iata: "CGK", city: "Jakarta", name: "Soekarno-Hatta", country: "Indonesia" },
  { iata: "DOH", city: "Doha", name: "Hamad Intl", country: "Qatar" },
];

export interface FlightDeal { from: Airport; to: Airport & { tag?: string } }

/** Curated marketing routes (SG_ORIGIN → POPULAR_ROUTES) for the landing deals /
 *  destination rails. No live fares — cards link into live flight search. */
export function curatedFlightDeals(): FlightDeal[] {
  return POPULAR_ROUTES.map((to) => ({ from: SG_ORIGIN, to }));
}
