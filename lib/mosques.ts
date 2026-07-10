/* Mosque slug + lookup helpers. Slugs derive from the mosque name
   ("Masjid Sultan" → "masjid-sultan") so URLs read naturally and match
   "masjid [name]" search intent. */
import { mosques } from "./data";
import type { Mosque } from "./types";

export function mosqueSlug(m: Mosque): string {
  return m.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const BY_SLUG = new Map(mosques.map((m) => [mosqueSlug(m), m]));

export function mosqueBySlug(slug: string): Mosque | undefined {
  return BY_SLUG.get(slug);
}

export function allMosques(): Mosque[] {
  return mosques;
}
