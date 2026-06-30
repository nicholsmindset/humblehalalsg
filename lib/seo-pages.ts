/* Humble Halal — programmatic SEO landing pages.
   Dimensions: area × category, malls/venues, cuisines, districts.
   Each slug resolves to a real filtered listing view + heading/intro copy.
   Title/H1/intro formulas are governed by docs/seo/keyword-research.md. */
import { areas, categories, listings } from "./data";
import type { Listing } from "./types";
import type { QA } from "./faq";
import { categoryContent, cuisineContent, CATEGORY_PAGE_IDS } from "./category-content";

/** Bump annually. Used in SEO titles only (keeps visible H1 evergreen). */
export const SEO_YEAR = 2026;

export interface SeoPage {
  slug: string;
  /** SEO <title> (≤60 chars incl. year). Falls back to h1 if absent. */
  title?: string;
  h1: string;
  intro: string;
  areaId?: string;
  catId?: string;
  areaName?: string;
  /** Listing.area names this page matches (area + venue + district pages). */
  areaNames?: string[];
  /** Cuisine keyword fragments matched against listing.cuisine (cuisine pages). */
  cuisineMatch?: string[];
  /** Cuisine id (cuisine pages) — drives cuisine-aware FAQ content. */
  cuisineId?: string;
  kind?: "area" | "area-cat" | "cat" | "venue" | "cuisine" | "mrt" | "muslim-owned";
}

// Categories that make sense as standalone landing pages (across all verticals).
const SEO_CATS = [
  "restaurants", "cafes", "groceries", "beauty", "health", "fashion",
  "services", "automotive", "weddings", "education", "professional", "travel",
];

/* ---- Districts/areas for SEO pages beyond the 6 curated UI `areas`.
   `match` lists Listing.area values to surface (may be empty for districts
   without seeded listings — the page still carries evergreen local content). */
interface SeoArea { id: string; name: string; mrt?: string; match: string[] }
const EXTRA_AREAS: SeoArea[] = [
  { id: "orchard", name: "Orchard", mrt: "Orchard", match: [] },
  { id: "woodlands", name: "Woodlands", mrt: "Woodlands", match: ["Woodlands"] },
  { id: "yishun", name: "Yishun", mrt: "Yishun", match: ["Yishun"] },
  { id: "hougang", name: "Hougang", mrt: "Hougang", match: ["Hougang"] },
  { id: "pasir-ris", name: "Pasir Ris", mrt: "Pasir Ris", match: ["Pasir Ris"] },
  { id: "sengkang", name: "Sengkang", mrt: "Sengkang", match: [] },
  { id: "serangoon", name: "Serangoon", mrt: "Serangoon", match: [] },
  { id: "ang-mo-kio", name: "Ang Mo Kio", mrt: "Ang Mo Kio", match: [] },
  { id: "clementi", name: "Clementi", mrt: "Clementi", match: [] },
  { id: "jurong-east", name: "Jurong East", mrt: "Jurong East", match: ["Jurong"] },
  { id: "sembawang", name: "Sembawang", mrt: "Sembawang", match: [] },
  { id: "punggol", name: "Punggol", mrt: "Punggol", match: [] },
  { id: "arab-street", name: "Arab Street", mrt: "Bugis", match: ["Bugis"] },
  { id: "changi-airport", name: "Changi Airport", mrt: "Changi Airport", match: [] },
  { id: "sentosa", name: "Sentosa", mrt: "HarbourFront", match: [] },
  { id: "novena", name: "Novena", mrt: "Novena", match: [] },
];

/* ---- Malls / venues (KD≈0, high-volume `{venue} halal food` cluster).
   `match` maps the venue to nearby Listing.area values for the listing view. */
interface Venue { id: string; name: string; mrt?: string; match: string[] }
const VENUES: Venue[] = [
  { id: "jewel-changi-airport", name: "Jewel Changi Airport", mrt: "Changi Airport", match: [] },
  { id: "jem", name: "JEM", mrt: "Jurong East", match: ["Jurong"] },
  { id: "vivocity", name: "VivoCity", mrt: "HarbourFront", match: [] },
  { id: "suntec-city", name: "Suntec City", mrt: "Esplanade", match: ["Bugis"] },
  { id: "northpoint-city", name: "Northpoint City", mrt: "Yishun", match: ["Yishun"] },
  { id: "jurong-point", name: "Jurong Point", mrt: "Boon Lay", match: ["Jurong"] },
  { id: "westgate", name: "Westgate", mrt: "Jurong East", match: ["Jurong"] },
  { id: "imm", name: "IMM", mrt: "Jurong East", match: ["Jurong"] },
  { id: "marina-square", name: "Marina Square", mrt: "Esplanade", match: ["Bugis"] },
  { id: "nex", name: "NEX", mrt: "Serangoon", match: [] },
  { id: "funan", name: "Funan", mrt: "City Hall", match: ["Bugis"] },
  { id: "tampines-mall", name: "Tampines Mall", mrt: "Tampines", match: ["Tampines"] },
  { id: "tampines-hub", name: "Our Tampines Hub", mrt: "Tampines", match: ["Tampines"] },
  { id: "bugis-junction", name: "Bugis Junction", mrt: "Bugis", match: ["Bugis"] },
  { id: "causeway-point", name: "Causeway Point", mrt: "Woodlands", match: ["Woodlands"] },
  { id: "plaza-singapura", name: "Plaza Singapura", mrt: "Dhoby Ghaut", match: [] },
  { id: "paya-lebar-quarter", name: "Paya Lebar Quarter", mrt: "Paya Lebar", match: ["Paya Lebar"] },
  { id: "bedok-mall", name: "Bedok Mall", mrt: "Bedok", match: ["Bedok"] },
  { id: "waterway-point", name: "Waterway Point", mrt: "Punggol", match: [] },
];

/* ---- Cuisine / concept pages (validated KD 0–8 demand). `match` fragments
   are tested (lowercased substring) against listing.cuisine + tags. */
interface Cuisine { id: string; label: string; match: string[] }
const CUISINES: Cuisine[] = [
  { id: "sushi", label: "Sushi", match: ["sushi", "japanese"] },
  { id: "japanese", label: "Japanese Food", match: ["japanese", "sushi", "ramen"] },
  { id: "korean", label: "Korean Food", match: ["korean"] },
  { id: "thai", label: "Thai Food", match: ["thai"] },
  { id: "dim-sum", label: "Dim Sum", match: ["dim sum", "chinese"] },
  { id: "steamboat", label: "Steamboat & Hotpot", match: ["steamboat", "hotpot", "mookata", "shabu"] },
  { id: "fine-dining", label: "Fine Dining", match: ["fine dining", "steakhouse", "wagyu", "western"] },
  { id: "high-tea", label: "High Tea", match: ["high tea", "brunch", "café", "cafe"] },
  { id: "western", label: "Western Food", match: ["western", "steakhouse", "burger", "pasta"] },
  { id: "steak", label: "Steak", match: ["steak", "wagyu", "grill"] },
  { id: "bbq", label: "BBQ & Grill", match: ["bbq", "grill", "korean"] },
  { id: "seafood", label: "Seafood", match: ["seafood"] },
  { id: "indian", label: "Indian Food", match: ["indian", "biryani", "prata", "north indian"] },
  { id: "nasi-padang", label: "Nasi Padang", match: ["nasi padang", "minang", "indonesian"] },
  { id: "breakfast", label: "Breakfast & Brunch", match: ["brunch", "breakfast", "café", "cafe"] },
  { id: "dessert", label: "Desserts", match: ["dessert", "kueh", "ice cream", "cake", "chocolate"] },
  { id: "buffet", label: "Buffet", match: ["buffet", "steamboat", "bbq"] },
  { id: "catering", label: "Catering", match: ["catering", "buffet", "event"] },
];

// only generate a category×area page when it has real content.
const countIn = (areaName: string, catId: string) =>
  listings.filter((l) => l.area === areaName && l.catId === catId).length;

function titleArea(name: string) {
  return clip(`Halal Food in ${name} — Best Halal Eats (${SEO_YEAR})`);
}
function titleVenue(name: string) {
  return clip(`Halal Food at ${name} — Where to Eat (${SEO_YEAR})`);
}
/** Trim to ~60 chars on a word boundary for clean SERP titles. */
function clip(s: string, max = 60) {
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  return cut.slice(0, cut.lastIndexOf(" ")).replace(/[—-]\s*$/, "").trim();
}

function build(): SeoPage[] {
  const pages: SeoPage[] = [];

  // ---- Curated UI areas (existing behaviour) ----
  for (const a of areas) {
    pages.push({
      slug: `halal-food-in-${a.id}`,
      title: titleArea(a.name),
      h1: `Halal Food in ${a.name}`,
      intro: `Discover the best halal food in ${a.name}, Singapore — MUIS-certified and Muslim-owned restaurants, cafés and eateries, each with a halal-confidence score, reviews and directions.`,
      areaId: a.id, areaName: a.name, kind: "area",
    });
    pages.push({
      slug: `halal-food-near-${a.id}-mrt`,
      title: clip(`Halal Food near ${a.name} MRT (${SEO_YEAR})`),
      h1: `Halal Food near ${a.name} MRT`,
      intro: `Halal restaurants and Muslim-owned businesses within easy reach of ${a.name} MRT — certified and Muslim-friendly options with reviews and directions.`,
      areaId: a.id, areaName: a.name, kind: "mrt",
    });
    pages.push({
      slug: `muslim-owned-businesses-in-${a.id}`,
      title: clip(`Muslim-Owned Businesses in ${a.name} (${SEO_YEAR})`),
      h1: `Muslim-Owned Businesses in ${a.name}`,
      intro: `Support Muslim-owned eateries, shops and services across ${a.name} — each with a halal-confidence score, reviews and directions.`,
      areaId: a.id, catId: "muslim-owned", areaName: a.name, kind: "muslim-owned",
    });
    for (const catId of SEO_CATS) {
      const cat = categories.find((c) => c.id === catId);
      if (!cat) continue;
      if (countIn(a.name, catId) < 1) continue;
      pages.push({
        slug: `halal-${cat.id}-in-${a.id}`,
        title: clip(`Halal ${cat.label} in ${a.name} (${SEO_YEAR})`),
        h1: `Halal ${cat.label} in ${a.name}`,
        intro: `The best halal ${cat.label.toLowerCase()} in ${a.name}, Singapore — MUIS-certified and Muslim-friendly options in one place, with reviews and directions.`,
        areaId: a.id, catId: cat.id, areaName: a.name, kind: "area-cat",
      });
    }
  }

  // ---- Extra districts (food-level pages with evergreen local content) ----
  for (const d of EXTRA_AREAS) {
    pages.push({
      slug: `halal-food-in-${d.id}`,
      title: titleArea(d.name),
      h1: `Halal Food in ${d.name}`,
      intro: `Discover the best halal food in ${d.name}, Singapore — MUIS-certified and Muslim-owned restaurants, cafés and eateries${d.mrt ? `, all within reach of ${d.mrt}` : ""}, with halal status, reviews and directions.`,
      areaName: d.name, areaNames: d.match, kind: "area",
    });
  }

  // ---- Malls / venues (the `{venue} halal food` cluster) ----
  for (const v of VENUES) {
    pages.push({
      slug: `halal-food-at-${v.id}`,
      title: titleVenue(v.name),
      h1: `Halal Food at ${v.name}`,
      intro: `Find halal food at ${v.name} — MUIS-certified and Muslim-friendly restaurants, cafés and stalls${v.mrt ? `, a short walk from ${v.mrt} MRT` : ""}, with halal status, prayer info and directions.`,
      areaName: v.name, areaNames: v.match, kind: "venue",
    });
  }

  // ---- Cuisine / concept pages (Singapore-wide) ----
  for (const c of CUISINES) {
    pages.push({
      slug: `halal-${c.id}-singapore`,
      title: clip(`Halal ${c.label} Singapore — Best Spots (${SEO_YEAR})`),
      h1: `Halal ${c.label} in Singapore`,
      intro: cuisineContent(c.id).intro,
      cuisineMatch: c.match, cuisineId: c.id, areaName: "Singapore", kind: "cuisine",
    });
  }

  // ---- Singapore-wide category landing pages (catId, no areaId) ----
  for (const catId of CATEGORY_PAGE_IDS) {
    const cat = categories.find((c) => c.id === catId);
    if (!cat) continue;
    if (listings.filter((l) => l.catId === catId).length < 1) continue;
    const cc = categoryContent(catId);
    pages.push({
      slug: `halal-${cat.id}-singapore`,
      title: clip(`Halal ${cat.label} Singapore — Best (${SEO_YEAR})`),
      h1: cc.h1 || `Halal ${cat.label} in Singapore`,
      intro: cc.intro,
      catId: cat.id, areaName: "Singapore", kind: "cat",
    });
  }
  return pages;
}

/** FAQ items for a SEO page (category/cuisine-aware) — used for FAQ + FAQPage schema. */
export function seoFaqItems(page: SeoPage): QA[] {
  if (page.cuisineId) return cuisineContent(page.cuisineId).faq;
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

/** Listings matching a SEO page's area/venue/category/cuisine filters, drawn
 *  from the REAL directory passed in (never the mock seed). */
export function seoListings(page: SeoPage, source: Listing[]): Listing[] {
  return source.filter((l) => {
    if (page.areaNames && page.areaNames.length) {
      if (!page.areaNames.includes(l.area)) return false;
    } else if (page.areaId) {
      const area = areas.find((a) => a.id === page.areaId);
      if (area && l.area !== area.name) return false;
    }
    if (page.cuisineMatch && page.cuisineMatch.length) {
      const hay = `${l.cuisine} ${(l.tags || []).join(" ")}`.toLowerCase();
      if (!page.cuisineMatch.some((m) => hay.includes(m))) return false;
    }
    if (page.catId && l.catId !== page.catId) return false;
    return true;
  });
}

/** A few related SEO pages (same area/venue/category) for internal linking. */
export function relatedSeoPages(page: SeoPage, limit = 6): SeoPage[] {
  const score = (p: SeoPage) => {
    let s = 0;
    if (p.areaId && p.areaId === page.areaId) s += 3;
    if (p.catId && p.catId === page.catId) s += 3;
    if (p.kind === "cuisine" && page.kind === "cuisine") s += 1;
    if (p.kind === "venue" && page.kind === "venue") s += 1;
    if (p.kind === "area" && page.kind === "area") s += 1;
    return s;
  };
  return PAGES.filter((p) => p.slug !== page.slug && score(p) > 0)
    .sort((a, b) => score(b) - score(a))
    .slice(0, limit);
}

/** All venue ids (for sitemap / internal-link hubs). */
export const SEO_VENUE_IDS = VENUES.map((v) => v.id);
export const SEO_CUISINE_IDS = CUISINES.map((c) => c.id);
