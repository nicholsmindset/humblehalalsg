/* Spreadsheet → directory mapping helpers, ported from scripts/seed-spreadsheet.mjs
   so the admin CSV import (app/api/admin/import) and any future seeding share one
   source of truth. Keep the regexes in sync with the seed script if it evolves. */

export const CAT_IDS = ["restaurants", "cafes", "groceries", "services", "beauty", "fashion", "health"] as const;
export type CatId = (typeof CAT_IDS)[number];

/** Free-text category → canonical cat_id. Unrecognised text falls back to
 *  restaurants (the dominant vertical), matching the seed script. */
export function mapCat(c: string | null | undefined): CatId {
  const s = (c || "").toLowerCase().trim();
  if ((CAT_IDS as readonly string[]).includes(s)) return s as CatId; // already canonical
  if (s.includes("beauty")) return "beauty";
  if (/modest|hijab|prayerwear|apparel|sportswear|fashion/.test(s)) return "fashion";
  if (/grocer|butcher|supermarket|marketplace|frozen|wholesaler|deli/.test(s)) return "groceries";
  if (/home services|service/.test(s)) return "services";
  if (/health|medical|scalp|skincare|haircare/.test(s)) return "health";
  if (/^(café|cafe|dessert|bakery|specialty|themed|rooftop)/.test(s)) return "cafes";
  if (/restaurant|buffet|food hall|food court/.test(s)) return "restaurants";
  if (s.includes("café") || s.includes("cafe")) return "cafes";
  return "restaurants";
}

/** Free-text halal descriptor → a HINT for the admin verification queue.
 *  NEVER grants a verified tier: published rows always start 'declared' and
 *  MUIS/verified status stays single-sourced in /api/admin/verify. */
export function mapHalalHint(d: string | null | undefined): { hint: string | null; attr: string | null } {
  const s = (d || "").toLowerCase();
  if (s.includes("muis")) return { hint: "muis-certified (verify on HalalSG)", attr: null };
  if (s.includes("owned")) return { hint: null, attr: "muslim-owned" };
  if (s.includes("friendly")) return { hint: null, attr: "muslim-friendly" };
  return { hint: null, attr: null };
}

/** Area text — blank out non-areas like "Multiple"/"Online"/"TBD". */
export function mapArea(i: string | null | undefined): string | null {
  const s = (i || "").trim();
  if (!s || /^(multiple|online|tbd)$/i.test(s)) return null;
  return s;
}

/** SG postal code: 6 digits, from an explicit field or embedded in the address. */
export function postalFrom(postal?: string | null, addr?: string | null): string | null {
  return (String(postal || "").match(/\b(\d{6})\b/) || String(addr || "").match(/\b(\d{6})\b/) || [])[1] || null;
}
