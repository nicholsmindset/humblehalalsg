/* Humble Halal — factual airline Muslim-meal reference for the flights moat.
   Most airlines serve a Muslim Meal (special meal code MOML) when requested in
   advance; some carriers are alcohol-free / serve halal by default. This data is
   factual guidance only — it never certifies a specific flight as "halal". Always
   request the meal with the airline and confirm. Carriers not listed fall back to
   the generic "request a Muslim meal (MOML)" guidance. */

export interface AirlineMeal {
  code: string; // marketing IATA code
  name: string;
  muslimMealOnRequest: boolean; // MOML available when requested
  alcoholFree?: boolean; // cabin service is alcohol-free
  note?: string;
}

const RAW: AirlineMeal[] = [
  // Gulf / Middle East — Muslim meal standard, several alcohol-free
  { code: "SV", name: "Saudia", muslimMealOnRequest: true, alcoholFree: true, note: "Halal catering; alcohol-free cabin" },
  { code: "EK", name: "Emirates", muslimMealOnRequest: true, note: "Muslim meal (MOML) on request" },
  { code: "EY", name: "Etihad Airways", muslimMealOnRequest: true, note: "Muslim meal (MOML) on request" },
  { code: "QR", name: "Qatar Airways", muslimMealOnRequest: true, note: "Muslim meal (MOML) on request" },
  { code: "GF", name: "Gulf Air", muslimMealOnRequest: true },
  { code: "WY", name: "Oman Air", muslimMealOnRequest: true },
  { code: "KU", name: "Kuwait Airways", muslimMealOnRequest: true, alcoholFree: true, note: "Alcohol-free cabin" },
  { code: "RJ", name: "Royal Jordanian", muslimMealOnRequest: true },
  { code: "ME", name: "Middle East Airlines", muslimMealOnRequest: true },
  { code: "TK", name: "Turkish Airlines", muslimMealOnRequest: true, note: "Muslim meal (MOML) on request" },
  { code: "MS", name: "EgyptAir", muslimMealOnRequest: true, alcoholFree: true, note: "Alcohol-free cabin" },
  { code: "AT", name: "Royal Air Maroc", muslimMealOnRequest: true },
  // SE Asia
  { code: "MH", name: "Malaysia Airlines", muslimMealOnRequest: true, alcoholFree: false, note: "Halal-certified catering" },
  { code: "OD", name: "Batik Air Malaysia", muslimMealOnRequest: true },
  { code: "AK", name: "AirAsia", muslimMealOnRequest: true, note: "Halal-certified meals" },
  { code: "GA", name: "Garuda Indonesia", muslimMealOnRequest: true, note: "Halal-certified catering" },
  { code: "JT", name: "Lion Air", muslimMealOnRequest: true },
  { code: "BI", name: "Royal Brunei", muslimMealOnRequest: true, alcoholFree: true, note: "Halal catering; alcohol-free cabin" },
  { code: "SQ", name: "Singapore Airlines", muslimMealOnRequest: true, note: "Muslim meal (MOML) on request" },
  { code: "TR", name: "Scoot", muslimMealOnRequest: true, note: "Muslim meal available to pre-order" },
  { code: "TG", name: "Thai Airways", muslimMealOnRequest: true },
  // South Asia
  { code: "PK", name: "Pakistan Intl", muslimMealOnRequest: true, alcoholFree: true, note: "Halal catering; alcohol-free cabin" },
  { code: "BG", name: "Biman Bangladesh", muslimMealOnRequest: true, alcoholFree: true },
  { code: "UL", name: "SriLankan Airlines", muslimMealOnRequest: true },
  { code: "AI", name: "Air India", muslimMealOnRequest: true },
  { code: "6E", name: "IndiGo", muslimMealOnRequest: true },
  // East Asia
  { code: "KE", name: "Korean Air", muslimMealOnRequest: true, note: "Muslim meal (MOML) on request" },
  { code: "OZ", name: "Asiana Airlines", muslimMealOnRequest: true },
  { code: "NH", name: "ANA", muslimMealOnRequest: true },
  { code: "JL", name: "Japan Airlines", muslimMealOnRequest: true },
  { code: "CX", name: "Cathay Pacific", muslimMealOnRequest: true },
  { code: "BR", name: "EVA Air", muslimMealOnRequest: true },
  { code: "CI", name: "China Airlines", muslimMealOnRequest: true },
  { code: "MU", name: "China Eastern", muslimMealOnRequest: true, note: "Muslim meal (MOML) on request" },
  { code: "CZ", name: "China Southern", muslimMealOnRequest: true },
  { code: "MF", name: "Xiamen Airlines", muslimMealOnRequest: true },
  { code: "CA", name: "Air China", muslimMealOnRequest: true },
  // Europe / others
  { code: "BA", name: "British Airways", muslimMealOnRequest: true },
  { code: "LH", name: "Lufthansa", muslimMealOnRequest: true },
  { code: "AF", name: "Air France", muslimMealOnRequest: true },
  { code: "KL", name: "KLM", muslimMealOnRequest: true },
  { code: "QF", name: "Qantas", muslimMealOnRequest: true },
];

const BY_CODE = new Map(RAW.map((a) => [a.code, a]));

export function airlineMeal(code?: string): AirlineMeal | undefined {
  return code ? BY_CODE.get(code.toUpperCase()) : undefined;
}
