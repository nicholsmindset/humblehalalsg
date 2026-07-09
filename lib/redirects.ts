/* Humble Halal — routing-layer redirect + rewrite map (flat-URL migration).
   Consumed by next.config.ts redirects()/rewrites() — the ONLY safe place for
   redirects in this app: page-level redirect()/notFound() stream soft 200s.
   Order matters: specific legacy fixes first, then alias variants, then the
   pattern rules that migrate the whole /halal/* place + cuisine sets.
   Keep this file pure data + tiny builders (it is imported at build time). */

interface Redirect {
  source: string;
  destination: string;
  permanent: boolean;
}

/* Legacy /halal slugs that shipped truncated or renamed. Destinations point
   DIRECTLY at the final flat URL — never chain a 301 through another 301. */
const LEGACY_HALAL_REDIRECTS: Redirect[] = [
  { source: "/halal/halal-food-in-marine", destination: "/halal-food/marine-parade", permanent: true },
  { source: "/halal/halal-cafes-in-marine", destination: "/halal-food/marine-parade", permanent: true },
  { source: "/halal/halal-food-in-sultan", destination: "/halal-food/kampong-glam", permanent: true },
  { source: "/halal/halal-restaurants-in-sultan", destination: "/halal-food/kampong-glam", permanent: true },
  { source: "/halal/halal-food-in-botanic", destination: "/halal-food/botanic-gardens", permanent: true },
  { source: "/halal/halal-restaurants-in-botanic", destination: "/halal-food/botanic-gardens", permanent: true },
];

/* Blueprint keyword-slug variants → our canonical location ids. These are
   ENTRY aliases (exact-match keyword URLs from the SEO master plan) — the
   canonical page keeps the existing id, which holds the indexed equity. */
const LOCATION_ALIASES: Array<[from: string, to: string]> = [
  ["northpoint", "northpoint-city"],
  ["jewel-changi", "jewel-changi-airport"],
  ["nex-serangoon", "nex"],
  ["our-tampines-hub", "tampines-hub"],
  ["paya-lebar-plq", "paya-lebar-quarter"],
  ["arab-street-kampong-glam", "arab-street"],
  ["suntec", "suntec-city"],
  ["geylang-serai", "geylang"],
];

/* Blueprint cuisine-slug variants → our canonical top-level cuisine pages. */
const CUISINE_ALIASES: Array<[from: string, to: string]> = [
  ["halal-korean-food-singapore", "halal-korean-singapore"],
  ["halal-japanese-sushi-singapore", "halal-sushi-singapore"],
  ["halal-hotpot-steamboat-singapore", "halal-steamboat-singapore"],
  ["halal-hotpot-singapore", "halal-steamboat-singapore"],
  ["halal-western-food-singapore", "halal-western-singapore"],
  ["halal-thai-food-singapore", "halal-thai-singapore"],
  ["halal-cafe-singapore", "halal-cafes-singapore"],
  ["halal-restaurant-singapore", "halal-restaurants-singapore"],
];

export function seoRedirects(): Redirect[] {
  return [
    ...LEGACY_HALAL_REDIRECTS,
    ...LOCATION_ALIASES.map(([from, to]) => ({
      source: `/halal-food/${from}`,
      destination: `/halal-food/${to}`,
      permanent: true,
    })),
    ...CUISINE_ALIASES.map(([from, to]) => ({
      source: `/${from}`,
      destination: `/${to}`,
      permanent: true,
    })),
    // ---- Pattern rules: migrate the whole legacy /halal/* URL space ----
    // Area + venue location pages → /halal-food/[location]
    { source: "/halal/halal-food-in-:loc", destination: "/halal-food/:loc", permanent: true },
    { source: "/halal/halal-food-at-:loc", destination: "/halal-food/:loc", permanent: true },
    // Cuisine + Singapore-wide category pages → top level
    { source: "/halal/:slug(halal-[a-z0-9\\-]+-singapore)", destination: "/:slug", permanent: true },
  ];
}

/* One rewrite serves EVERY top-level cuisine/category URL from the existing
   /halal/[slug] prerender (pure prefix strip; slugs are literally
   `halal-{id}-singapore`). afterFiles ⇒ any real folder (e.g. the
   /halal-food-singapore pillar) wins over this rule automatically, and a
   rewrite never re-enters the redirects phase, so the companion 301 above
   cannot loop. */
export function seoRewrites() {
  return {
    afterFiles: [
      { source: "/:slug(halal-[a-z0-9\\-]+-singapore)", destination: "/halal/:slug" },
    ],
  };
}
