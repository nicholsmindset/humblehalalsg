/* Humble Halal — programmatic SEO landing pages (area × category matrix).
   Each slug resolves to a real filtered listing view + heading/intro copy. */
import { areas, categories, listings } from "./data";
import type { Listing } from "./types";
import type { QA } from "./faq";
import { categoryContent, CATEGORY_PAGE_IDS } from "./category-content";

export interface SeoPage {
  slug: string;
  h1: string;
  intro: string;
  areaId?: string;
  catId?: string;
  areaName?: string;
}

// Categories that make sense as standalone landing pages (across all verticals).
const SEO_CATS = [
  "restaurants", "cafes", "groceries", "beauty", "health", "fashion",
  "services", "automotive", "weddings", "education", "professional", "travel",
];

// only generate a page when it has real content (avoid thin/empty SEO pages)
const countIn = (areaName: string, catId: string) =>
  listings.filter((l) => l.area === areaName && l.catId === catId).length;

function build(): SeoPage[] {
  const pages: SeoPage[] = [];
  for (const a of areas) {
    // "Halal Food in {area}" — all listings in the area
    pages.push({
      slug: `halal-food-in-${a.id}`,
      h1: `Halal Food in ${a.name}`,
      intro: `Discover MUIS-certified and Muslim-owned restaurants, cafés and eateries across ${a.name}, Singapore.`,
      areaId: a.id,
      areaName: a.name,
    });
    // "near {area} MRT"
    pages.push({
      slug: `halal-food-near-${a.id}-mrt`,
      h1: `Halal Food near ${a.name} MRT`,
      intro: `Halal restaurants and Muslim-owned businesses within easy reach of ${a.name} MRT.`,
      areaId: a.id,
      areaName: a.name,
    });
    // "Muslim-owned businesses in {area}"
    pages.push({
      slug: `muslim-owned-businesses-in-${a.id}`,
      h1: `Muslim-Owned Businesses in ${a.name}`,
      intro: `Support Muslim-owned eateries, shops and services across ${a.name}.`,
      areaId: a.id,
      catId: "muslim-owned",
      areaName: a.name,
    });
    // per-category pages (only where there's at least one listing)
    for (const catId of SEO_CATS) {
      const cat = categories.find((c) => c.id === catId);
      if (!cat) continue;
      if (countIn(a.name, catId) < 1) continue;
      pages.push({
        slug: `halal-${cat.id}-in-${a.id}`,
        h1: `Halal ${cat.label} in ${a.name}`,
        intro: `The best halal ${cat.label.toLowerCase()} in ${a.name} — certified and Muslim-friendly options, all in one place.`,
        areaId: a.id,
        catId: cat.id,
        areaName: a.name,
      });
    }
  }

  // Singapore-wide category landing pages (catId, no areaId).
  for (const catId of CATEGORY_PAGE_IDS) {
    const cat = categories.find((c) => c.id === catId);
    if (!cat) continue;
    if (listings.filter((l) => l.catId === catId).length < 1) continue;
    const cc = categoryContent(catId);
    pages.push({
      slug: `halal-${cat.id}-singapore`,
      h1: cc.h1 || `Halal ${cat.label} in Singapore`,
      intro: cc.intro,
      catId: cat.id,
      areaName: "Singapore",
    });
  }
  return pages;
}

/** FAQ items for a SEO page (category-aware) — used for FAQ + FAQPage schema. */
export function seoFaqItems(page: SeoPage): QA[] {
  return categoryContent(page.catId).faq;
}

const PAGES = build();
const BY_SLUG = new Map(PAGES.map((p) => [p.slug, p]));

export function allSeoPages(): SeoPage[] {
  return PAGES;
}

export function getSeoPage(slug: string): SeoPage | undefined {
  return BY_SLUG.get(slug);
}

/** Listings matching a SEO page's area/category filters. */
export function seoListings(page: SeoPage): Listing[] {
  return listings.filter((l) => {
    if (page.areaId) {
      const area = areas.find((a) => a.id === page.areaId);
      if (area && l.area !== area.name) return false;
    }
    if (page.catId && l.catId !== page.catId) return false;
    return true;
  });
}

/** A few related SEO pages (same area, other categories) for internal linking. */
export function relatedSeoPages(page: SeoPage, limit = 5): SeoPage[] {
  return PAGES.filter(
    (p) => p.slug !== page.slug && (p.areaId === page.areaId || p.catId === page.catId),
  ).slice(0, limit);
}
