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
  /** Human noun used in result headings and empty states. */
  resultNoun: string;
  /** Singular phrase used in editorial prompts. */
  singularNoun: string;
  /** Heading for category-specific trust or buying guidance. */
  considerationsLabel: string;
}

export const CATEGORY_PRESENTATION: Record<string, CategoryPresentation> = {
  restaurants: {
    directoryLabel: "Halal Restaurants",
    slugBase: "halal-restaurants",
    singaporeSlug: "halal-restaurants-singapore",
    resultNoun: "halal restaurants",
    singularNoun: "a halal restaurant",
    considerationsLabel: "Halal considerations",
  },
  cafes: {
    directoryLabel: "Halal Cafés",
    slugBase: "halal-cafes",
    singaporeSlug: "halal-cafes-singapore",
    resultNoun: "halal cafés",
    singularNoun: "a halal café",
    considerationsLabel: "Halal considerations",
  },
  groceries: {
    directoryLabel: "Halal Groceries",
    slugBase: "halal-groceries",
    singaporeSlug: "halal-groceries-singapore",
    resultNoun: "halal grocers",
    singularNoun: "a halal grocer",
    considerationsLabel: "Halal considerations",
  },
  beauty: {
    directoryLabel: "Muslim-Friendly Beauty",
    slugBase: "muslim-friendly-beauty",
    singaporeSlug: "muslim-friendly-beauty-singapore",
    resultNoun: "Muslim-friendly beauty & grooming providers",
    singularNoun: "a Muslim-friendly beauty or grooming provider",
    considerationsLabel: "Service & product considerations",
  },
  health: {
    directoryLabel: "Muslim-Friendly Health & Medical",
    slugBase: "muslim-friendly-health",
    singaporeSlug: "muslim-friendly-health-singapore",
    resultNoun: "Muslim-friendly health & wellness providers",
    singularNoun: "a Muslim-friendly health or wellness provider",
    considerationsLabel: "Care considerations",
  },
  fashion: {
    directoryLabel: "Modest Fashion",
    slugBase: "modest-fashion",
    singaporeSlug: "modest-fashion-singapore",
    resultNoun: "modest fashion shops & designers",
    singularNoun: "a modest fashion shop or designer",
    considerationsLabel: "Shopping considerations",
  },
  services: {
    directoryLabel: "Muslim-Owned Home Services",
    slugBase: "muslim-owned-home-services",
    singaporeSlug: "muslim-owned-home-services-singapore",
    resultNoun: "Muslim-owned home service providers",
    singularNoun: "a Muslim-owned home service provider",
    considerationsLabel: "Hiring considerations",
  },
  automotive: {
    directoryLabel: "Muslim-Owned Automotive Services",
    slugBase: "muslim-owned-automotive-services",
    singaporeSlug: "muslim-owned-automotive-services-singapore",
    resultNoun: "Muslim-owned automotive service providers",
    singularNoun: "a Muslim-owned automotive service provider",
    considerationsLabel: "Service considerations",
  },
  weddings: {
    directoryLabel: "Malay & Muslim Wedding Vendors",
    slugBase: "muslim-wedding-vendors",
    singaporeSlug: "muslim-wedding-vendors-singapore",
    resultNoun: "Malay & Muslim wedding vendors",
    singularNoun: "a Malay or Muslim wedding vendor",
    considerationsLabel: "Booking considerations",
  },
  education: {
    directoryLabel: "Islamic Education & Tuition",
    slugBase: "islamic-education",
    singaporeSlug: "islamic-education-singapore",
    resultNoun: "Islamic education providers",
    singularNoun: "an Islamic education provider",
    considerationsLabel: "Learning considerations",
  },
  professional: {
    directoryLabel: "Muslim-Owned Professional Services",
    slugBase: "muslim-owned-professional-services",
    singaporeSlug: "muslim-owned-professional-services-singapore",
    resultNoun: "Muslim-owned professional service providers",
    singularNoun: "a Muslim-owned professional service provider",
    considerationsLabel: "Engagement considerations",
  },
  travel: {
    directoryLabel: "Umrah & Muslim-Friendly Travel",
    slugBase: "muslim-friendly-travel",
    singaporeSlug: "muslim-friendly-travel-singapore",
    resultNoun: "Umrah & Muslim-friendly travel providers",
    singularNoun: "an Umrah or Muslim-friendly travel provider",
    considerationsLabel: "Booking considerations",
  },
};

export function categoryDirectoryLabel(catId?: string, fallback = ""): string {
  return (catId && CATEGORY_PRESENTATION[catId]?.directoryLabel) || fallback;
}

export interface CategoryPageTerminology {
  resultNoun: string;
  singularNoun: string;
  considerationsLabel: string;
}

/** Copy-safe terminology for the shared directory template. Food defaults to
 * halal; non-food categories must opt into their precise presentation above. */
export function categoryPageTerminology(
  catId?: string,
  fallbackNoun = "places",
): CategoryPageTerminology {
  const presentation = catId ? CATEGORY_PRESENTATION[catId] : undefined;
  return presentation
    ? {
        resultNoun: presentation.resultNoun,
        singularNoun: presentation.singularNoun,
        considerationsLabel: presentation.considerationsLabel,
      }
    : {
        resultNoun: `halal ${fallbackNoun}`,
        singularNoun: `a halal ${fallbackNoun.replace(/s$/, "")}`,
        considerationsLabel: "Halal considerations",
      };
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
