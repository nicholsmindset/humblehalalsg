/* Humble Halal — Malay (Bahasa Melayu) translation pairs.
   Registry of the standalone /ms/* pages and their English counterparts.
   Single source of truth for the hreflang-lite setup: each page in a pair
   declares the same `languages` map via pageMeta (en-SG + ms + x-default→EN),
   and the sitemap can consume this list to emit both URLs. No i18n routing —
   these are ordinary static routes with fully-Malay content. */

export interface MsPage {
  /** Malay page route (under /ms/). */
  path: string;
  /** English counterpart route. */
  enPath: string;
}

export const MS_PAGES: MsPage[] = [
  { path: "/ms/ramadan", enPath: "/ramadan" },
  { path: "/ms/hari-raya", enPath: "/hari-raya" },
  { path: "/ms/masjid-singapura", enPath: "/mosques" },
  { path: "/ms/makanan-halal-singapura", enPath: "/halal-food-singapore" },
];
