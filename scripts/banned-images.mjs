/* Single source of truth for banned stock-photo IDs.
 *
 * These Unsplash photos were seeded as category placeholders and later banned
 * as off-brand / haram-adjacent for a halal-trust directory. Audit + cleanup
 * scripts import this list; tests/unit/no-banned-images.test.ts fails the
 * build if the raw IDs appear anywhere else in the repo.
 */
export const BANNED_IMAGE_IDS = [
  "1487412947147-5cebf100ffc2", // glamour model (former PIC.beauty placeholder)
  "1604503468506-a8da13d82791", // raw-meat butcher joint (former PIC.butcher placeholder)
];

export const isBannedImageUrl = (url) =>
  typeof url === "string" && BANNED_IMAGE_IDS.some((id) => url.includes(id));
