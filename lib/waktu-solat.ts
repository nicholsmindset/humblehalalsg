/* Humble Halal — Waktu Solat hub (/waktu-solat-singapore) shared data.
   Malay month slugs for the 12 monthly timetable pages + sitemap helper.
   Kept dependency-free (no server-only) so lib/sitemaps.ts can import it. */

export const WAKTU_YEAR = 2026;

export interface WaktuMonth {
  /** URL segment, e.g. "januari-2026". */
  slug: string;
  /** Month number, 1–12. */
  month: number;
  /** Malay month name (the search keyword), e.g. "Januari". */
  ms: string;
  /** English month name for clarity in copy, e.g. "January". */
  en: string;
}

// Malay ↔ English month names (Singapore/Malay convention: Mac, Jun, Julai, Ogos, Disember).
const NAMES: [string, string][] = [
  ["Januari", "January"],
  ["Februari", "February"],
  ["Mac", "March"],
  ["April", "April"],
  ["Mei", "May"],
  ["Jun", "June"],
  ["Julai", "July"],
  ["Ogos", "August"],
  ["September", "September"],
  ["Oktober", "October"],
  ["November", "November"],
  ["Disember", "December"],
];

export const WAKTU_MONTHS: WaktuMonth[] = NAMES.map(([ms, en], i) => ({
  slug: `${ms.toLowerCase()}-${WAKTU_YEAR}`,
  month: i + 1,
  ms,
  en,
}));

export function waktuMonthBySlug(slug: string): WaktuMonth | undefined {
  return WAKTU_MONTHS.find((m) => m.slug === slug);
}

/** Today's date in Singapore time as "YYYY-MM-DD" — for marking the current
    row in a timetable regardless of the server's timezone. */
export function sgTodayISO(): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Singapore",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** All hub + monthly paths, for the sitemap (orchestrator wires this in). */
export function waktuSolatSitemapPaths(): string[] {
  return ["/waktu-solat-singapore", ...WAKTU_MONTHS.map((m) => `/waktu-solat-singapore/${m.slug}`)];
}
