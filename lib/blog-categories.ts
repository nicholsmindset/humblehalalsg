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


export const BLOG_CATEGORIES: BlogCategory[] = [
  {
    slug: "halal-basics",
    name: "Halal Basics",
    title: "Halal Basics: Guides to Halal & MUIS in Singapore",
    description:
      "Start here. Plain-English guides to what halal means, how MUIS certification works, and how to tell if a place in Singapore is really halal.",
    heroImage: "/blog/cat-halal-basics.webp",
    heroAlt: "Halal Basics — guides from Humble Halal Singapore",
    blurb: "What halal means, MUIS certification & how to check.",
  },
  {
    slug: "restaurants-cafes",
    name: "Restaurants & Cafés",
    title: "Best Halal Restaurants & Cafés in Singapore — Guides",
    description:
      "Where to eat: our roundups of the best halal restaurants, cafés, buffets, high tea and breakfast spots across Singapore.",
    heroImage: "/blog/cat-restaurants-cafes.webp",
    heroAlt: "Halal Restaurants & Cafés — guides from Humble Halal Singapore",
    blurb: "Best halal restaurants, cafés, buffets & brunch.",
  },
  {
    slug: "cuisines",
    name: "Cuisines",
    title: "Halal Cuisines in Singapore — Japanese, Korean & More",
    description:
      "Craving something specific? Halal guides by cuisine — Japanese and sushi, Korean BBQ, dim sum, steamboat, steak, fine dining and bakes.",
    heroImage: "/blog/cat-cuisines.webp",
    heroAlt: "Halal Cuisines — guides from Humble Halal Singapore",
    blurb: "Japanese, Korean, dim sum, steamboat, steak & more.",
  },
  {
    slug: "areas-malls",
    name: "Areas & Malls",
    title: "Halal Food by Area & Mall in Singapore",
    description:
      "Find halal food where you are — neighbourhood and mall guides for Kampong Glam, Bugis, Jewel Changi Airport and beyond.",
    heroImage: "/blog/cat-areas-malls.webp",
    heroAlt: "Halal Food by Area & Mall — guides from Humble Halal Singapore",
    blurb: "Halal eats by neighbourhood and mall.",
  },
  {
    slug: "seasonal-events",
    name: "Seasonal & Events",
    title: "Halal Seasonal Guides & Events in Singapore",
    description:
      "Ramadan bazaars, festive feasts and event catering — seasonal halal guides to help you plan ahead in Singapore.",
    heroImage: "/blog/cat-seasonal-events.webp",
    heroAlt: "Seasonal & Events — guides from Humble Halal Singapore",
    blurb: "Ramadan, festive feasts & event catering.",
  },
  {
    slug: "community-business",
    name: "Community & Business",
    title: "Muslim-Owned Businesses & Community in Singapore",
    description:
      "Supporting the community — guides to Muslim-owned businesses and the people behind Singapore's halal scene.",
    heroImage: "/blog/cat-community-business.webp",
    heroAlt: "Community & Business — guides from Humble Halal Singapore",
    blurb: "Muslim-owned businesses & community stories.",
  },
  {
    slug: "muslim-travel",
    name: "Muslim Travel",
    title: "Muslim & Halal Travel Guides from Singapore",
    description:
      "Where to go and how to plan it — halal food, prayer spaces and Muslim-friendly itineraries for JB, the region and beyond, plus umrah from Singapore.",
    heroImage: "/blog/cat-muslim-travel.webp",
    heroAlt: "Muslim Travel — guides from Humble Halal Singapore",
    blurb: "Halal food, prayer & itineraries — JB, the region & umrah.",
  },
  {
    slug: "halal-questions",
    name: "Halal Questions",
    title: "Is It Halal? Quick Answers for Singapore",
    description:
      "Straight answers to the halal questions Singaporeans actually search — from popular chains and bakeries to ingredients — with how we checked each one.",
    heroImage: "/blog/cat-halal-questions.webp",
    heroAlt: "Is It Halal? Quick Answers — guides from Humble Halal Singapore",
    blurb: "Is X halal? Quick, checked answers for popular brands.",
  },
  {
    slug: "muslim-services",
    name: "Muslim Services",
    title: "Muslim-Owned Services & Guides in Singapore",
    description:
      "Practical guides to Muslim-owned and Muslim-friendly services in Singapore — halal catering, aqiqah and qurban, Malay wedding vendors and more.",
    heroImage: "/blog/cat-muslim-services.webp",
    heroAlt: "Muslim Services — guides from Humble Halal Singapore",
    blurb: "Catering, aqiqah, qurban & Malay wedding vendors.",
  },
  {
    slug: "prayers-deen",
    name: "Prayers & Deen",
    title: "Prayers, Duas & Deen Guides for Singapore",
    description:
      "Everyday worship, made simple — prayer times, duas (rumi, Arabic & meaning), zakat, qibla and the Deen tools Singaporean Muslims search for.",
    heroImage: "/blog/cat-prayers-deen.webp",
    heroAlt: "Prayers & Deen — guides from Humble Halal Singapore",
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
