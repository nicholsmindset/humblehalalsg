/* Owner-editable amenity vocabulary for businesses.attributes (text[]).
   These exact strings are what the public detail page, explore filters and
   rowToListing badge/flag matching already understand (prayer/family/delivery/
   owned substrings). Deliberately EXCLUDES certification claims ("Halal-
   certified" etc.) — halal status is derived from admin-reviewed evidence
   (halal_tier), never self-asserted (MUIS compliance posture). "Muslim-owned"
   stays: the platform surfaces it as an explicit self-declaration. */

export const ATTRIBUTE_OPTIONS = [
  "Muslim-owned",
  "Prayer space",
  "Family friendly",
  "Delivery",
  "Takeaway",
  "Dine-in",
  "Outdoor seating",
  "Wheelchair accessible",
  "Wifi",
  "Open late",
  "Vegetarian options",
  "Private rooms",
  "By appointment",
  "Parking nearby",
] as const;

export type AttributeOption = (typeof ATTRIBUTE_OPTIONS)[number];

const OPTION_SET = new Set<string>(ATTRIBUTE_OPTIONS);

/** Allow-list an incoming attributes value: known options only, deduped,
    capped. Unknown/legacy values already on the row are preserved by callers
    that merge — this only vets what an owner submits. */
export function sanitizeAttributes(v: unknown, max = 20): string[] {
  if (!Array.isArray(v)) return [];
  const out: string[] = [];
  for (const a of v) {
    if (typeof a !== "string") continue;
    const val = a.trim();
    if (!OPTION_SET.has(val) || out.includes(val)) continue;
    out.push(val);
    if (out.length >= max) break;
  }
  return out;
}
