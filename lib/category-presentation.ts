/** Human and URL language for directory category landing pages.
 *
 * "Halal" describes food, ingredients, preparation, or certification. For
 * non-food businesses we use the actual trust signal instead: Muslim-owned,
 * Muslim-friendly, modest, Islamic, or the plain service name.
 */
export interface CategoryPresentation {
  directoryLabel: string;
  slugBase: string;
  singaporeSlug: string;
}

export const CATEGORY_PRESENTATION: Record<string, CategoryPresentation> = {
  restaurants: {
    directoryLabel: "Halal Restaurants",
    slugBase: "halal-restaurants",
    singaporeSlug: "halal-restaurants-singapore",
  },
  cafes: {
    directoryLabel: "Halal Cafés",
    slugBase: "halal-cafes",
    singaporeSlug: "halal-cafes-singapore",
  },
  groceries: {
    directoryLabel: "Halal Groceries",
    slugBase: "halal-groceries",
    singaporeSlug: "halal-groceries-singapore",
  },
  beauty: {
    directoryLabel: "Muslim-Friendly Beauty",
    slugBase: "muslim-friendly-beauty",
    singaporeSlug: "muslim-friendly-beauty-singapore",
  },
  health: {
    directoryLabel: "Muslim-Friendly Health & Medical",
    slugBase: "muslim-friendly-health",
    singaporeSlug: "muslim-friendly-health-singapore",
  },
  fashion: {
    directoryLabel: "Modest Fashion",
    slugBase: "modest-fashion",
    singaporeSlug: "modest-fashion-singapore",
  },
  services: {
    directoryLabel: "Muslim-Owned Home Services",
    slugBase: "muslim-owned-home-services",
    singaporeSlug: "muslim-owned-home-services-singapore",
  },
  automotive: {
    directoryLabel: "Muslim-Owned Automotive Services",
    slugBase: "muslim-owned-automotive-services",
    singaporeSlug: "muslim-owned-automotive-services-singapore",
  },
  weddings: {
    directoryLabel: "Malay & Muslim Wedding Vendors",
    slugBase: "muslim-wedding-vendors",
    singaporeSlug: "muslim-wedding-vendors-singapore",
  },
  education: {
    directoryLabel: "Islamic Education & Tuition",
    slugBase: "islamic-education",
    singaporeSlug: "islamic-education-singapore",
  },
  professional: {
    directoryLabel: "Muslim-Owned Professional Services",
    slugBase: "muslim-owned-professional-services",
    singaporeSlug: "muslim-owned-professional-services-singapore",
  },
  travel: {
    directoryLabel: "Umrah & Muslim-Friendly Travel",
    slugBase: "muslim-friendly-travel",
    singaporeSlug: "muslim-friendly-travel-singapore",
  },
};

export function categoryDirectoryLabel(catId?: string, fallback = ""): string {
  return (catId && CATEGORY_PRESENTATION[catId]?.directoryLabel) || fallback;
}

export const CATEGORY_URL_MIGRATIONS = Object.entries(CATEGORY_PRESENTATION)
  .filter(([catId]) => !["restaurants", "cafes", "groceries"].includes(catId))
  .map(([catId, value]) => ({
    catId,
    oldSlug: `halal-${catId}-singapore`,
    newSlug: value.singaporeSlug,
    oldAreaBase: `halal-${catId}`,
    newAreaBase: value.slugBase,
  }));
