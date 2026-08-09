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
  // Launch audit 2026-08-09: current official menus/sites directly contradict
  // the listing's halal claim. Re-entry requires outlet-specific evidence.
  "din-tai-fung-paragon", // Official menu includes pork dishes.
  "ramen-keisuke-tonkotsu-king", // Official menu states pork broth/chashu and beer.
  "soup-restaurant", // Official current menu includes pork dishes.
  "da-paolo-gastronomia", // Official menu includes pork/ham/bacon and alcohol.
  "greenwood-fish-market", // Official site says not halal-certified; serves wine.
  "origin-grill-shangri-la", // Official menu includes pork/alcohol.
  "sushi-tei-halal-outlets", // Generic outlet claim conflicts with current group menu.
  "ps-cafe-dempsey", // Exact outlet sells alcohol and serves pork.
  // Stale/phantom identities or conflicts with the project's own status record.
  "cedele",
  "foodcanvas-national-gallery",
  "sushiro-singapore-halal",
  // Imported sources resolve to businesses in other countries/industries.
  "bali-kitchen",
  "banana-leaf-curry-east-coast",
  "elitas",
  "laundry-gallery",
  "sultan-restaurant",
  "the-pit-room",
  // Wrong-geography source matches: keep hidden until the Singapore identity is
  // verified against an official local business page and HalalSG.
  "blu-grill",
  "daily-grind",
  "kampong-chicken-house",
  "madinah-spice-kitchen",
  "oriental-kitchen",
  "sapore",
]);

export function isBlockedFoodListing(slug: unknown): boolean {
  return BLOCKED_FOOD_LISTING_SLUGS.has(String(slug || "").trim().toLowerCase());
}
