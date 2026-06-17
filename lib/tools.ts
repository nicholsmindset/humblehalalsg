/* Humble Halal — Deen Tools catalog.
   The single source of truth for the /tools hub + nav. Ported from the
   "Deen Hustle" tools suite and rebuilt natively for SEO + cross-sell.
   Add an entry here when a tool ships; the hub renders from this list so
   there are never dead links. Keep `live: true` only for routes that exist. */

export type ToolCategory = "Worship" | "Calculators" | "Knowledge" | "Finders";

export interface Tool {
  slug: string; // route segment under /tools
  title: string; // card + H1 title
  blurb: string; // one-line description
  icon: string; // Icon name from components/ui.tsx
  category: ToolCategory;
  /** Local-only, no sign-up — surfaced as a reassurance chip on cards. */
  privateLocal?: boolean;
  /** Cross-link to an existing surface (e.g. the verified directory) instead of
      a dedicated /tools/<slug> page. Keeps us from rebuilding what we already
      have, and routes traffic into the core product. */
  href?: string;
  live: boolean;
}

/** The destination for a tool card: an explicit cross-link, else /tools/<slug>. */
export function toolHref(t: Tool): string {
  return t.href ?? `/tools/${t.slug}`;
}

export const TOOLS: Tool[] = [
  {
    slug: "tasbih",
    title: "Tasbih Counter",
    blurb: "A digital misbaha for dhikr — counts stay on your device.",
    icon: "crescent",
    category: "Worship",
    privateLocal: true,
    live: true,
  },
  {
    slug: "duas",
    title: "Dua Library",
    blurb: "Authentic everyday duas by occasion, with sources.",
    icon: "bookmark",
    category: "Worship",
    live: true,
  },
  {
    slug: "99-names",
    title: "99 Names of Allah",
    blurb: "Al-Asma ul-Husna — Arabic, transliteration and meaning.",
    icon: "sparkles",
    category: "Knowledge",
    live: true,
  },
  {
    slug: "date-converter",
    title: "Hijri Date Converter",
    blurb: "Convert between Hijri and Gregorian dates.",
    icon: "calendar",
    category: "Calculators",
    live: true,
  },
  {
    slug: "zakat",
    title: "Zakat Calculator",
    blurb: "Work out the 2.5% due on your zakatable wealth.",
    icon: "dollar",
    category: "Calculators",
    live: true,
  },
  {
    slug: "qibla",
    title: "Qibla Compass",
    blurb: "Find the direction of prayer from where you are.",
    icon: "near",
    category: "Worship",
    privateLocal: true,
    live: true,
  },
  // Finders cross-link into the core product — we already have a MUIS-verified
  // directory and a mosque directory, so we route here rather than rebuild.
  {
    slug: "halal-food",
    title: "Halal Food Near You",
    blurb: "Browse the MUIS-verified halal directory.",
    icon: "utensils",
    category: "Finders",
    href: "/explore",
    live: true,
  },
  {
    slug: "mosque-finder",
    title: "Mosque Finder",
    blurb: "Find masjids near you across Singapore.",
    icon: "mosque",
    category: "Finders",
    href: "/mosques",
    live: true,
  },
];

export const CATEGORY_ORDER: ToolCategory[] = ["Worship", "Calculators", "Knowledge", "Finders"];

/** Live tools grouped by category, in display order. */
export function toolsByCategory(): { category: ToolCategory; items: Tool[] }[] {
  return CATEGORY_ORDER.map((category) => ({
    category,
    items: TOOLS.filter((t) => t.live && t.category === category),
  })).filter((g) => g.items.length);
}

export function getTool(slug: string): Tool | undefined {
  return TOOLS.find((t) => t.slug === slug && t.live);
}
