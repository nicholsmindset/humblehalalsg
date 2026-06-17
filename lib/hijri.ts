/* Humble Halal — Gregorian → Hijri date (tabular Islamic calendar). Pure &
   client-safe. The tabular ("Kuwaiti") algorithm is an arithmetic approximation
   and may differ from the moon-sighted date by ±1 day, so display is always
   qualified with "approx." We use it only to show the Hijri date and flag the
   Ramadan / Hajj seasons for Umrah travellers — never for religious rulings. */

const HIJRI_MONTHS = [
  "Muharram", "Safar", "Rabi al-Awwal", "Rabi al-Thani", "Jumada al-Awwal",
  "Jumada al-Thani", "Rajab", "Shaban", "Ramadan", "Shawwal", "Dhul-Qadah", "Dhul-Hijjah",
];

export interface HijriDate { day: number; month: number; year: number; monthName: string }

function gregorianToJDN(y: number, m: number, d: number): number {
  const a = Math.floor((14 - m) / 12);
  const yy = y + 4800 - a;
  const mm = m + 12 * a - 3;
  return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
}

/** Convert an ISO date (YYYY-MM-DD) to an approximate Hijri date. */
export function toHijri(isoDate: string): HijriDate | null {
  const m0 = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m0) return null;
  const jdn = gregorianToJDN(Number(m0[1]), Number(m0[2]), Number(m0[3]));
  // tabular Islamic calendar epoch (JDN 1948440 = 1 Muharram 1 AH, civil)
  const l0 = jdn - 1948440 + 10632;
  const n = Math.floor((l0 - 1) / 10631);
  let l = l0 - 10631 * n + 354;
  const j = Math.floor((10985 - l) / 5316) * Math.floor((50 * l) / 17719) + Math.floor(l / 5670) * Math.floor((43 * l) / 15238);
  l = l - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
  const month = Math.floor((24 * l) / 709);
  const day = l - Math.floor((709 * month) / 24);
  const year = 30 * n + j - 30;
  if (month < 1 || month > 12) return null;
  return { day, month, year, monthName: HIJRI_MONTHS[month - 1] };
}

/** "12 Ramadan 1447 AH (approx.)" */
export function formatHijri(isoDate: string): string {
  const h = toHijri(isoDate);
  return h ? `${h.day} ${h.monthName} ${h.year} AH (approx.)` : "";
}

/** Month names (1-indexed lookup) for callers that build their own pickers. */
export const HIJRI_MONTH_NAMES = HIJRI_MONTHS;

function jdnToGregorian(jdn: number): { y: number; m: number; d: number } {
  // Fliegel–Van Flandern algorithm (proleptic Gregorian).
  let l = jdn + 68569;
  const n = Math.floor((4 * l) / 146097);
  l = l - Math.floor((146097 * n + 3) / 4);
  const i = Math.floor((4000 * (l + 1)) / 1461001);
  l = l - Math.floor((1461 * i) / 4) + 31;
  const j = Math.floor((80 * l) / 2447);
  const d = l - Math.floor((2447 * j) / 80);
  l = Math.floor(j / 11);
  const m = j + 2 - 12 * l;
  const y = 100 * (n - 49) + i + l;
  return { y, m, d };
}

/** Convert a tabular Hijri date to the Gregorian ISO date (YYYY-MM-DD).
   Inverse of toHijri — same tabular ("Kuwaiti") calendar, so ±1 day vs. a
   moon-sighted date. For display/planning only, never religious rulings. */
export function fromHijri(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 30) return null;
  // Days elapsed in the tabular Islamic calendar since the epoch, then back to JDN.
  const jdn =
    day +
    Math.ceil(29.5 * (month - 1)) +
    (year - 1) * 354 +
    Math.floor((3 + 11 * year) / 30) +
    1948439;
  const g = jdnToGregorian(jdn);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${g.y}-${pad(g.m)}-${pad(g.d)}`;
}

export type HijriSeason = { key: "ramadan" | "hajj" | "dhul-hijjah"; label: string } | null;

/** Flag the Ramadan / Hajj seasons for an ISO date (factual, for travel planning). */
export function hijriSeason(isoDate: string): HijriSeason {
  const h = toHijri(isoDate);
  if (!h) return null;
  if (h.month === 9) return { key: "ramadan", label: "Ramadan" };
  if (h.month === 12 && h.day <= 13) return { key: "hajj", label: "Hajj season" };
  if (h.month === 12) return { key: "dhul-hijjah", label: "Dhul-Hijjah" };
  return null;
}
