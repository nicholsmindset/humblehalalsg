/* Bundled country list for nationality / passport-issue selects — instant &
   key-less (mirrors lib/airports.ts). ISO 3166-1 alpha-2. Singapore first, then
   Muslim-travel-relevant countries, then the rest alphabetically. */

export interface Country { code: string; name: string }

export const COUNTRIES: Country[] = [
  { code: "SG", name: "Singapore" },
  { code: "MY", name: "Malaysia" },
  { code: "ID", name: "Indonesia" },
  { code: "BN", name: "Brunei" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "QA", name: "Qatar" },
  { code: "KW", name: "Kuwait" },
  { code: "BH", name: "Bahrain" },
  { code: "OM", name: "Oman" },
  { code: "JO", name: "Jordan" },
  { code: "TR", name: "Türkiye" },
  { code: "EG", name: "Egypt" },
  { code: "MA", name: "Morocco" },
  { code: "PK", name: "Pakistan" },
  { code: "BD", name: "Bangladesh" },
  { code: "IN", name: "India" },
  { code: "LK", name: "Sri Lanka" },
  { code: "MV", name: "Maldives" },
  { code: "TH", name: "Thailand" },
  { code: "PH", name: "Philippines" },
  { code: "VN", name: "Vietnam" },
  { code: "KH", name: "Cambodia" },
  { code: "MM", name: "Myanmar" },
  { code: "KR", name: "South Korea" },
  { code: "JP", name: "Japan" },
  { code: "CN", name: "China" },
  { code: "HK", name: "Hong Kong" },
  { code: "TW", name: "Taiwan" },
  { code: "AU", name: "Australia" },
  { code: "NZ", name: "New Zealand" },
  { code: "GB", name: "United Kingdom" },
  { code: "IE", name: "Ireland" },
  { code: "FR", name: "France" },
  { code: "DE", name: "Germany" },
  { code: "NL", name: "Netherlands" },
  { code: "BE", name: "Belgium" },
  { code: "CH", name: "Switzerland" },
  { code: "AT", name: "Austria" },
  { code: "ES", name: "Spain" },
  { code: "PT", name: "Portugal" },
  { code: "IT", name: "Italy" },
  { code: "GR", name: "Greece" },
  { code: "SE", name: "Sweden" },
  { code: "NO", name: "Norway" },
  { code: "DK", name: "Denmark" },
  { code: "FI", name: "Finland" },
  { code: "PL", name: "Poland" },
  { code: "CZ", name: "Czechia" },
  { code: "RU", name: "Russia" },
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "MX", name: "Mexico" },
  { code: "BR", name: "Brazil" },
  { code: "AR", name: "Argentina" },
  { code: "ZA", name: "South Africa" },
  { code: "NG", name: "Nigeria" },
  { code: "KE", name: "Kenya" },
  { code: "ET", name: "Ethiopia" },
  { code: "TZ", name: "Tanzania" },
  { code: "GH", name: "Ghana" },
  { code: "TN", name: "Tunisia" },
  { code: "DZ", name: "Algeria" },
  { code: "LB", name: "Lebanon" },
  { code: "IQ", name: "Iraq" },
  { code: "IR", name: "Iran" },
  { code: "AF", name: "Afghanistan" },
  { code: "NP", name: "Nepal" },
  { code: "UZ", name: "Uzbekistan" },
  { code: "KZ", name: "Kazakhstan" },
];

/** Unicode flag from an ISO alpha-2 code (regional indicator letters). */
export function flagEmoji(code: string): string {
  const c = code.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(c)) return "🏳️";
  return String.fromCodePoint(...[...c].map((ch) => 0x1f1e6 + ch.charCodeAt(0) - 65));
}

export function countryName(code: string): string {
  return COUNTRIES.find((c) => c.code === code.toUpperCase())?.name || code;
}
