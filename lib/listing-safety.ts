/* Emergency public-safety blocklist.
 *
 * These slugs have been manually confirmed as closed or incompatible with a
 * halal food directory using first-party menus/business pages. The database row
 * is retained for audit history, but the listing must never reach public feeds,
 * detail pages, SEO pages or sitemaps. Removal from this set requires a new,
 * dated halal review with outlet-specific evidence.
 */
export const BLOCKED_FOOD_LISTING_SLUGS = new Set([
  "the-quarters", // Closed; business stated it was not halal certified.
  "prive-keppel-bay", // Licensed restaurant; no verified halal evidence.
  "the-guild", // Young Master brewery restaurant.
  "plentyfull", // Closed/stale restaurant listing.
  "pasta-brava", // Italian restaurant with pork/alcohol menu; no halal evidence.
  "osia-steak-and-seafood-grill-resorts-world", // Official menu lists pork, bacon, cognac and wine sauces.
  "forest-resorts-world", // Closed former RWS restaurant; no current outlet.
  "min-jiang-at-one-north", // Official Chinese restaurant menu includes pork; no halal evidence.
  "golden-mile-complex-thai-cluster", // Not one auditable business; the former complex has closed.
  "symmetry", // Licensed restaurant with pork/alcohol menu; no halal evidence.
]);

export function isBlockedFoodListing(slug: unknown): boolean {
  return BLOCKED_FOOD_LISTING_SLUGS.has(String(slug || "").trim().toLowerCase());
}
