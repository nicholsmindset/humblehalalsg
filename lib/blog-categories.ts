/* Humble Halal — blog category taxonomy. Six curated top-level hubs; every post
   maps to exactly one (see `category` in lib/blog.ts). Kept separate from blog.ts
   so the registry can be imported without pulling the full posts array, mirroring
   the lib/seo-pages.ts split. Dependency direction is one-way: blog.ts imports from
   here, never the reverse. */

export type BlogCategorySlug =
  | "halal-basics"
  | "restaurants-cafes"
  | "cuisines"
  | "areas-malls"
  | "seasonal-events"
  | "community-business"
  | "muslim-travel"
  | "halal-questions"
  | "muslim-services"
  | "prayers-deen";

export interface BlogCategory {
  slug: BlogCategorySlug;
  /** Short label — chip, breadcrumb, card pill. */
  name: string;
  /** Full SEO <title> (used with pageMeta absoluteTitle:true). */
  title: string;
  /** Meta description + on-page intro. */
  description: string;
  heroImage: string;
  heroAlt: string;
  /** One-liner for the index hub chips. */
  blurb: string;
}

/** Unsplash URL builder — confirmed-loading IDs, matches the lib/data.ts IMG() shape. */
export const bimg = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=70`;

export const BLOG_CATEGORIES: BlogCategory[] = [
  {
    slug: "halal-basics",
    name: "Halal Basics",
    title: "Halal Basics: Guides to Halal & MUIS in Singapore",
    description:
      "Start here. Plain-English guides to what halal means, how MUIS certification works, and how to tell if a place in Singapore is really halal.",
    heroImage: bimg("1565557623262-b51c2513a641"),
    heroAlt: "Halal food in Singapore",
    blurb: "What halal means, MUIS certification & how to check.",
  },
  {
    slug: "restaurants-cafes",
    name: "Restaurants & Cafés",
    title: "Best Halal Restaurants & Cafés in Singapore — Guides",
    description:
      "Where to eat: our roundups of the best halal restaurants, cafés, buffets, high tea and breakfast spots across Singapore.",
    heroImage: bimg("1556909114-f6e7ad7d3136"),
    heroAlt: "A plated halal meal at a Singapore restaurant",
    blurb: "Best halal restaurants, cafés, buffets & brunch.",
  },
  {
    slug: "cuisines",
    name: "Cuisines",
    title: "Halal Cuisines in Singapore — Japanese, Korean & More",
    description:
      "Craving something specific? Halal guides by cuisine — Japanese and sushi, Korean BBQ, dim sum, steamboat, steak, fine dining and bakes.",
    heroImage: bimg("1565299624946-b28f40a0ae38"),
    heroAlt: "An overhead spread of varied dishes",
    blurb: "Japanese, Korean, dim sum, steamboat, steak & more.",
  },
  {
    slug: "areas-malls",
    name: "Areas & Malls",
    title: "Halal Food by Area & Mall in Singapore",
    description:
      "Find halal food where you are — neighbourhood and mall guides for Kampong Glam, Bugis, Jewel Changi Airport and beyond.",
    heroImage: bimg("1555921015-5532091f6026"),
    heroAlt: "Singapore shophouses where halal food is found",
    blurb: "Halal eats by neighbourhood and mall.",
  },
  {
    slug: "seasonal-events",
    name: "Seasonal & Events",
    title: "Halal Seasonal Guides & Events in Singapore",
    description:
      "Ramadan bazaars, festive feasts and event catering — seasonal halal guides to help you plan ahead in Singapore.",
    heroImage: bimg("1542838132-92c53300491e"),
    heroAlt: "A festive bazaar food stall in Singapore",
    blurb: "Ramadan, festive feasts & event catering.",
  },
  {
    slug: "community-business",
    name: "Community & Business",
    title: "Muslim-Owned Businesses & Community in Singapore",
    description:
      "Supporting the community — guides to Muslim-owned businesses and the people behind Singapore's halal scene.",
    heroImage: bimg("1581349485608-9469926a8e5e"),
    heroAlt: "A Muslim-owned shop in Singapore",
    blurb: "Muslim-owned businesses & community stories.",
  },
  {
    slug: "muslim-travel",
    name: "Muslim Travel",
    title: "Muslim & Halal Travel Guides from Singapore",
    description:
      "Where to go and how to plan it — halal food, prayer spaces and Muslim-friendly itineraries for JB, the region and beyond, plus umrah from Singapore.",
    heroImage: bimg("1500835556837-99ac94a94552"),
    heroAlt: "A traveller planning a Muslim-friendly trip from Singapore",
    blurb: "Halal food, prayer & itineraries — JB, the region & umrah.",
  },
  {
    slug: "halal-questions",
    name: "Halal Questions",
    title: "Is It Halal? Quick Answers for Singapore",
    description:
      "Straight answers to the halal questions Singaporeans actually search — from popular chains and bakeries to ingredients — with how we checked each one.",
    heroImage: bimg("1504674900247-0877df9cc836"),
    heroAlt: "Checking whether a popular food brand is halal in Singapore",
    blurb: "Is X halal? Quick, checked answers for popular brands.",
  },
  {
    slug: "muslim-services",
    name: "Muslim Services",
    title: "Muslim-Owned Services & Guides in Singapore",
    description:
      "Practical guides to Muslim-owned and Muslim-friendly services in Singapore — halal catering, aqiqah and qurban, Malay wedding vendors and more.",
    heroImage: bimg("1519741497674-611481863552"),
    heroAlt: "A Muslim-owned service provider at work in Singapore",
    blurb: "Catering, aqiqah, qurban & Malay wedding vendors.",
  },
  {
    slug: "prayers-deen",
    name: "Prayers & Deen",
    title: "Prayers, Duas & Deen Guides for Singapore",
    description:
      "Everyday worship, made simple — prayer times, duas (rumi, Arabic & meaning), zakat, qibla and the Deen tools Singaporean Muslims search for.",
    heroImage: bimg("1543007630-9710e4a00a20"),
    heroAlt: "A prayer mat, dates and prayer beads in soft light",
    blurb: "Prayer times, duas, zakat, qibla & Deen tools.",
  },
];

const BY_CAT = new Map<string, BlogCategory>(BLOG_CATEGORIES.map((c) => [c.slug, c]));

export function getCategory(slug: string): BlogCategory | undefined {
  return BY_CAT.get(slug);
}

export function allCategories(): BlogCategory[] {
  return BLOG_CATEGORIES;
}
