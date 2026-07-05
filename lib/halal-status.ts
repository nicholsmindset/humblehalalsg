/* Humble Halal — "Is [brand] halal?" answer dataset.

   ACCURACY POLICY (read before editing):
   - MUIS HalalSG is the single source of truth. We never assert a brand is
     "halal" without certification. Default to "not officially MUIS-certified"
     and direct users to verify on the register.
   - "no pork / no lard" is self-declared and is NOT halal certification.
   - Every entry carries a `lastChecked` date; statuses change — re-verify.
   These statuses reflect publicly available information as of `lastChecked`. */

export type HalalStatus = "certified" | "partial" | "no-pork" | "not-certified" | "unknown";

export interface BrandHalal {
  slug: string;
  brand: string;
  category: string;
  status: HalalStatus;
  /** 40–60 word direct answer (the AI-Overview / featured-snippet unit). */
  answer: string;
  source: string;
  lastChecked: string; // human-readable, e.g. "June 2026"
  aliases?: string[];
}

export const STATUS_META: Record<HalalStatus, { label: string; verdict: string; tone: string }> = {
  certified: { label: "MUIS halal-certified", verdict: "Yes", tone: "yes" },
  partial: { label: "Some outlets/items certified", verdict: "Partly", tone: "warn" },
  "no-pork": { label: "No pork — but not MUIS-certified", verdict: "Not certified", tone: "warn" },
  "not-certified": { label: "Not MUIS halal-certified", verdict: "No", tone: "no" },
  unknown: { label: "Status unconfirmed", verdict: "Unconfirmed", tone: "warn" },
};

const CHECKED = "July 2026";
const PUBLIC_INFO = "MUIS HalalSG register + publicly available information";

export const brands: BrandHalal[] = [
  {
    slug: "paris-baguette", brand: "Paris Baguette", category: "Bakery & café", status: "certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Yes — Paris Baguette is MUIS halal-certified in Singapore, certified across all its outlets in February 2026. Its breads, pastries and cakes are halal. Certification is per outlet and can change, so confirm the specific Paris Baguette outlet on the MUIS HalalSG register before buying.",
  },
  {
    slug: "genki-sushi", brand: "Genki Sushi", category: "Sushi restaurant", status: "partial", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Genki Sushi is MUIS halal-certified at selected Singapore outlets only — such as JEM, Bugis Junction and Westgate — not chain-wide. Certified outlets are on the MUIS HalalSG register; others are not halal. Always confirm the specific Genki Sushi outlet on the MUIS HalalSG register before dining.",
  },
  {
    slug: "saizeriya", brand: "Saizeriya", category: "Italian restaurant", status: "not-certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Saizeriya is not halal in Singapore. The menu includes pork and wine, and its outlets are not on the MUIS HalalSG register. It is not suitable for halal-conscious diners.",
  },
  {
    slug: "breadtalk", brand: "BreadTalk", category: "Bakery", status: "not-certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "BreadTalk is not MUIS halal-certified in Singapore. Its outlets are not listed on MUIS HalalSG and some products contain non-halal fillings such as pork floss. Treat it as not halal-certified and check HalalSG.",
  },
  {
    slug: "chateraise", brand: "Chateraise", category: "Japanese dessert & bakery", status: "not-certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Chateraise is not MUIS halal-certified in Singapore. It is not on the MUIS HalalSG register and some items may contain alcohol or animal-derived gelatine. Verify on MUIS HalalSG before purchasing.",
  },
  {
    slug: "yoshinoya", brand: "Yoshinoya", category: "Japanese beef bowl", status: "certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Yes — Yoshinoya is MUIS halal-certified in Singapore, certified across almost all its outlets since late 2024. Its gyudon beef bowls and sides are halal. Certification is per outlet and can change, so confirm the specific Yoshinoya outlet on the MUIS HalalSG register before dining.",
  },
  {
    slug: "sukiya", brand: "Sukiya", category: "Japanese gyudon", status: "certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Yes — Sukiya is now MUIS halal-certified in Singapore. Its outlets earned MUIS certification, so the gyudon beef bowls, curry rice and yakitori bowls are halal. Certification is per outlet and can change, so confirm the specific Sukiya outlet on the MUIS HalalSG register before dining.",
  },
  {
    slug: "starbucks", brand: "Starbucks", category: "Coffee chain", status: "not-certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Starbucks is not MUIS halal-certified in Singapore. MUIS confirmed in May 2026 that Starbucks has not applied for certification, after in-store signage wrongly implied a 'halal transition'. Most drinks are pork-free, but the chain is not halal-certified — verify on the MUIS HalalSG register.",
  },
  {
    slug: "haidilao", brand: "Haidilao", category: "Hotpot restaurant", status: "not-certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Haidilao is not halal in Singapore. It serves pork and alcohol and is not on the MUIS HalalSG register. It is not suitable for halal-conscious diners.",
  },
  {
    slug: "tim-hortons", brand: "Tim Hortons", category: "Coffee & bakery", status: "certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Yes — Tim Hortons is MUIS halal-certified in Singapore, certified across all its outlets islandwide in February 2026. Its coffee, iced drinks, sandwiches and baked treats are halal. Certification can change, so confirm the specific Tim Hortons outlet on the MUIS HalalSG register before ordering.",
  },
  {
    slug: "pizza-hut", brand: "Pizza Hut", category: "Pizza restaurant", status: "unknown", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Pizza Hut's MUIS halal status in Singapore is unconfirmed. Some halal directories list its outlets as certified (with chicken ham replacing pork), but we could not verify this on the official MUIS HalalSG register. Confirm the specific Pizza Hut outlet on the MUIS HalalSG register before ordering.",
  },
  {
    slug: "four-leaves", brand: "Four Leaves", category: "Bakery", status: "not-certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Four Leaves is not MUIS halal-certified in Singapore. Its outlets are not on the MUIS HalalSG register and some products contain non-halal fillings. Verify the latest status on HalalSG.",
  },
  {
    slug: "swee-heng", brand: "Swee Heng", category: "Bakery", status: "certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Yes — Swee Heng is MUIS halal-certified in Singapore. The bakery sources its ingredients from halal-certified suppliers and its outlets are on the MUIS HalalSG register, so its breads and cakes are halal. Certification can change, so confirm the specific outlet on the MUIS HalalSG register.",
  },
  {
    slug: "delifrance", brand: "Délifrance", category: "Bakery & café", status: "certified", lastChecked: CHECKED, source: PUBLIC_INFO, aliases: ["delifrance"],
    answer: "Yes — Délifrance is MUIS halal-certified in Singapore; its franchised outlets here are on the MUIS HalalSG register, so its pastries, breads and sandwiches are halal and the local menu is pork-free. Certification is per outlet and can change, so confirm the specific Délifrance outlet on the MUIS HalalSG register.",
  },
  {
    slug: "tiong-bahru-bakery", brand: "Tiong Bahru Bakery", category: "Bakery & café", status: "not-certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Tiong Bahru Bakery is not MUIS halal-certified in Singapore. It is not on the MUIS HalalSG register and some items may contain alcohol or non-halal ingredients. Verify on HalalSG.",
  },
  {
    slug: "bengawan-solo", brand: "Bengawan Solo", category: "Kueh & cakes", status: "not-certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Bengawan Solo is not MUIS halal-certified in Singapore. While its traditional kueh are pork-free, the brand is not listed on the MUIS HalalSG register, so it is not officially halal-certified. Verify on HalalSG.",
  },
  {
    slug: "jacks-place", brand: "Jack's Place", category: "Western steakhouse", status: "not-certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Jack's Place is not halal in Singapore. It serves pork and bacon and is not on the MUIS HalalSG register. It is not suitable for halal-conscious diners.",
  },
  {
    slug: "krispy-kreme", brand: "Krispy Kreme", category: "Doughnuts", status: "certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Yes — Krispy Kreme is MUIS halal-certified in Singapore, certified across all its SG stores. Its doughnuts and drinks are halal. Certification is per outlet and can change, so confirm the specific Krispy Kreme outlet on the MUIS HalalSG register before buying.",
  },
  {
    slug: "wingstop", brand: "Wingstop", category: "Chicken wings", status: "certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Yes — Wingstop is MUIS halal-certified in Singapore. Its outlets are on the MUIS HalalSG register, so the chicken wings, tenders and sides are halal. Certification is per outlet and can change, so confirm the specific Wingstop outlet on the MUIS HalalSG register before ordering.",
  },
  {
    slug: "killiney-kopitiam", brand: "Killiney Kopitiam", category: "Kopitiam", status: "partial", lastChecked: CHECKED, source: PUBLIC_INFO, aliases: ["killiney"],
    answer: "Killiney Kopitiam is MUIS halal-certified at selected Singapore outlets only — most locations are not, as they serve pork items such as char siew. Its separate 'Kedai Killiney Kopi' concept is halal-certified. Always confirm the specific Killiney outlet on the MUIS HalalSG register before dining.",
  },
  {
    slug: "mr-bean", brand: "Mr Bean", category: "Soya & snacks", status: "certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Yes — Mr Bean is MUIS halal-certified in Singapore, certified across all its outlets islandwide since 2022. Its soya milk, pancakes, soy porridge and snacks are halal. Certification can change, so confirm the specific Mr Bean outlet on the MUIS HalalSG register before buying.",
  },
  {
    slug: "haribo", brand: "Haribo", category: "Gummy sweets", status: "not-certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Most Haribo gummy sweets sold in Singapore are not halal — they typically contain pork-derived gelatine. Haribo makes halal-certified ranges in some countries, so always check the specific pack; standard Haribo is not halal.",
  },
  {
    slug: "jollibee", brand: "Jollibee", category: "Fast food", status: "certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Yes — Jollibee's Singapore outlets are MUIS halal-certified, so its fried chicken, burgers and rice meals are halal. Certification is per outlet and can change, so confirm the specific Jollibee outlet on the MUIS HalalSG register before dining.",
  },
  {
    slug: "pepper-lunch", brand: "Pepper Lunch", category: "Japanese restaurant", status: "certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Yes — Pepper Lunch is MUIS halal-certified in Singapore, so its sizzling beef, chicken and salmon plates are halal. Always confirm the specific outlet's certificate on the MUIS HalalSG register, as statuses can change.",
  },
  {
    slug: "koi", brand: "KOI Thé", category: "Bubble tea", status: "not-certified", lastChecked: CHECKED, source: PUBLIC_INFO, aliases: ["koi-the"],
    answer: "KOI Thé is not MUIS halal-certified in Singapore — its outlets are not listed on the MUIS HalalSG register. Without certification it is not officially halal, even if many ingredients may be permissible. Verify on HalalSG before ordering.",
  },
  {
    slug: "liho", brand: "LiHO TEA", category: "Bubble tea", status: "not-certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "LiHO TEA is not MUIS halal-certified in Singapore and is not listed on the MUIS HalalSG register. Treat it as not halal-certified and check HalalSG for the latest status before ordering.",
  },
  {
    slug: "old-chang-kee", brand: "Old Chang Kee", category: "Snacks", status: "certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Yes — Old Chang Kee is MUIS halal-certified in Singapore. Its products, outlets and central kitchens have been MUIS-certified since 2005, so the curry puffs and snacks are halal. Certification can change, so confirm the specific Old Chang Kee outlet on the MUIS HalalSG register.",
  },
  {
    slug: "nandos", brand: "Nando's", category: "Restaurant", status: "certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Yes — Nando's is MUIS halal-certified in Singapore, and unlike some overseas outlets it does not serve alcohol here. Its flame-grilled PERi-PERi chicken is halal. Certification is per outlet and can change, so confirm the specific Nando's outlet on the MUIS HalalSG register before dining.",
  },
  {
    slug: "shake-shack", brand: "Shake Shack", category: "Burgers", status: "not-certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Shake Shack is not MUIS halal-certified in Singapore. Its outlets are not on the MUIS HalalSG register and the menu includes pork and alcohol, so it is not suitable for halal-conscious diners.",
  },
  {
    slug: "awfully-chocolate", brand: "Awfully Chocolate", category: "Bakery", status: "not-certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Awfully Chocolate is not MUIS halal-certified in Singapore. Some cakes contain alcohol and its outlets are not on the MUIS HalalSG register. Treat it as not halal-certified and check the specific product before buying.",
  },
  {
    slug: "chocolate-origin", brand: "Chocolate Origin", category: "Bakery", status: "not-certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Chocolate Origin is not listed as MUIS halal-certified in Singapore. Without certification on the MUIS HalalSG register, treat it as not halal-certified and verify the latest status before buying.",
  },
  {
    slug: "famous-amos", brand: "Famous Amos", category: "Bakery", status: "certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Yes — Famous Amos is MUIS halal-certified in Singapore, certified across all its outlets since 2022. Its cookies are halal. Certification can change, so confirm the specific Famous Amos outlet on the MUIS HalalSG register before buying.",
  },
  {
    slug: "a-w", brand: "A&W", category: "Fast food", status: "certified", lastChecked: CHECKED, source: PUBLIC_INFO, aliases: ["aw", "a-and-w"],
    answer: "Yes — A&W is MUIS halal-certified in Singapore. Its outlets have been on the MUIS HalalSG register since 2020, so the Coney dogs, curly fries and Root Beer floats are halal. Certification is per outlet and can change, so confirm the specific A&W outlet on the MUIS HalalSG register.",
  },
  {
    slug: "burger-king", brand: "Burger King", category: "Fast food", status: "unknown", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Burger King's MUIS halal status in Singapore is unconfirmed. Several halal directories list its outlets as MUIS-certified, but we could not verify this on the official MUIS HalalSG register, and Burger King's menu globally includes pork. Confirm the specific outlet on the MUIS HalalSG register before ordering.",
  },
  {
    slug: "popeyes", brand: "Popeyes", category: "Fast food", status: "certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Yes — Popeyes is MUIS halal-certified in Singapore. Its outlets are on the MUIS HalalSG register, so the Louisiana fried chicken, sandwiches and sides are halal. Certification is per outlet and can change, so confirm the specific Popeyes outlet on the MUIS HalalSG register before ordering.",
  },
  {
    slug: "mcdonalds", brand: "McDonald's", category: "Fast food", status: "certified", lastChecked: CHECKED, source: PUBLIC_INFO, aliases: ["mcdonald", "mcdonalds-singapore"],
    answer: "Yes — McDonald's is MUIS halal-certified in Singapore and has been since 1992. All its outlets, McCafés and dessert kiosks are on the MUIS HalalSG register, so the full menu is halal. Certification can change, so you can still confirm any outlet on the MUIS HalalSG register.",
  },
  {
    slug: "kfc", brand: "KFC", category: "Fast food", status: "certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Yes — KFC is MUIS halal-certified in Singapore and has been since the 1990s. All its outlets are on the MUIS HalalSG register, so its fried chicken and sides are halal. Certification can change, so you can still confirm any outlet on the MUIS HalalSG register.",
  },
  {
    slug: "subway", brand: "Subway", category: "Fast food", status: "certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Yes — Subway is MUIS halal-certified in Singapore. It stopped serving pork and certified its outlets with MUIS in 2018, so the sandwiches, wraps and salads are halal. Certification is per outlet and can change, so confirm the specific Subway outlet on the MUIS HalalSG register.",
  },
  {
    slug: "din-tai-fung", brand: "Din Tai Fung", category: "Restaurant", status: "not-certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Din Tai Fung is not halal in Singapore. Many signature dishes such as xiao long bao contain pork, and its outlets are not on the MUIS HalalSG register. It is not halal-certified.",
  },
  {
    slug: "fish-and-co", brand: "Fish & Co.", category: "Seafood restaurant", status: "certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Yes — Fish & Co. is MUIS halal-certified in Singapore. Its outlets are on the MUIS HalalSG register, so the seafood platters, fish and chips and pasta are halal. Certification is per outlet and can change, so confirm the specific Fish & Co. outlet on the MUIS HalalSG register.",
  },
  {
    slug: "texas-chicken", brand: "Texas Chicken", category: "Fast food", status: "certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Yes — Texas Chicken is MUIS halal-certified in Singapore. All its outlets are on the MUIS HalalSG register, so its fried chicken and honey-butter biscuits are halal. Certification is per outlet and can change, so confirm the specific Texas Chicken outlet on the MUIS HalalSG register before ordering.",
  },
  {
    slug: "long-john-silvers", brand: "Long John Silver's", category: "Fast food", status: "certified", lastChecked: CHECKED, source: PUBLIC_INFO, aliases: ["ljs", "long-john-silver"],
    answer: "Yes — Long John Silver's is MUIS halal-certified in Singapore. Its outlets are on the MUIS HalalSG register, so its battered fish, chicken and sides are halal. Certification is per outlet and can change, so confirm the specific Long John Silver's outlet on the MUIS HalalSG register before ordering.",
  },
  {
    slug: "swensens", brand: "Swensen's", category: "Western restaurant", status: "certified", lastChecked: CHECKED, source: PUBLIC_INFO, aliases: ["swensen", "swensens-unlimited"],
    answer: "Yes — Swensen's is MUIS halal-certified in Singapore, including its Swensen's Unlimited buffet outlets. Its Western mains, ice cream and desserts are halal. Certification is per outlet and can change, so confirm the specific Swensen's outlet on the MUIS HalalSG register before dining.",
  },
  {
    slug: "4fingers", brand: "4Fingers", category: "Fast food", status: "certified", lastChecked: CHECKED, source: PUBLIC_INFO, aliases: ["4-fingers", "four-fingers", "4fingers-crispy-chicken"],
    answer: "Yes — 4Fingers Crispy Chicken is MUIS halal-certified in Singapore. All its outlets are on the MUIS HalalSG register, so its Korean-style fried chicken, rice bowls and sides are halal. Certification is per outlet and can change, so confirm the specific 4Fingers outlet on the MUIS HalalSG register.",
  },
  {
    slug: "pastamania", brand: "PastaMania", category: "Italian restaurant", status: "certified", lastChecked: CHECKED, source: PUBLIC_INFO, aliases: ["pasta-mania"],
    answer: "Yes — PastaMania is MUIS halal-certified in Singapore. Every outlet is on the MUIS HalalSG register, so its pasta, pizza and baked rice are halal. Certification is per outlet and can change, so confirm the specific PastaMania outlet on the MUIS HalalSG register before dining.",
  },
  {
    slug: "sarpinos", brand: "Sarpino's Pizzeria", category: "Pizza restaurant", status: "certified", lastChecked: CHECKED, source: PUBLIC_INFO, aliases: ["sarpino", "sarpinos-pizzeria"],
    answer: "Yes — Sarpino's Pizzeria is MUIS halal-certified in Singapore. Its outlets are on the MUIS HalalSG register, so its pizzas, pastas and sides are halal. Certification is per outlet and can change, so confirm the specific Sarpino's outlet on the MUIS HalalSG register before ordering.",
  },
  {
    slug: "encik-tan", brand: "Encik Tan", category: "Kopitiam", status: "certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Yes — Encik Tan is MUIS halal-certified in Singapore. Its halal food-atrium outlets are on the MUIS HalalSG register, serving local favourites such as Hainanese curry rice, laksa and wanton noodles. Certification is per outlet and can change, so confirm the specific Encik Tan outlet on the MUIS HalalSG register.",
  },
  {
    slug: "stuffd", brand: "Stuff'd", category: "Fast food", status: "certified", lastChecked: CHECKED, source: PUBLIC_INFO, aliases: ["stuff-d", "stuffd-burrito"],
    answer: "Yes — Stuff'd is MUIS halal-certified in Singapore. Its outlets are on the MUIS HalalSG register, so its burritos, kebabs and bowls are halal. Certification is per outlet and can change, so confirm the specific Stuff'd outlet on the MUIS HalalSG register before ordering.",
  },
  {
    slug: "manhattan-fish-market", brand: "The Manhattan Fish Market", category: "Seafood restaurant", status: "certified", lastChecked: CHECKED, source: PUBLIC_INFO, aliases: ["the-manhattan-fish-market", "tmfm"],
    answer: "Yes — The Manhattan Fish Market is MUIS halal-certified in Singapore. Its outlets are on the MUIS HalalSG register, so its grilled and fried seafood platters are halal. Certification is per outlet and can change, so confirm the specific outlet on the MUIS HalalSG register before dining.",
  },
  {
    slug: "llaollao", brand: "llaollao", category: "Frozen yogurt & dessert", status: "certified", lastChecked: CHECKED, source: PUBLIC_INFO, aliases: ["llao-llao"],
    answer: "Yes — llaollao is MUIS halal-certified in Singapore. Its frozen-yogurt menu is on the MUIS HalalSG register, so its froyo, toppings and sauces are halal. Certification is per outlet and can change, so confirm the specific llaollao outlet on the MUIS HalalSG register.",
  },
  {
    slug: "toast-box", brand: "Toast Box", category: "Bakery & café", status: "not-certified", lastChecked: CHECKED, source: PUBLIC_INFO, aliases: ["toastbox"],
    answer: "Toast Box is not MUIS halal-certified in Singapore — its outlets are not on the MUIS HalalSG register. While its kaya toast and local drinks are popular, the chain is not officially halal-certified; verify on the MUIS HalalSG register before buying.",
  },
  {
    slug: "gong-cha", brand: "Gong Cha", category: "Bubble tea", status: "not-certified", lastChecked: CHECKED, source: PUBLIC_INFO, aliases: ["gongcha"],
    answer: "Gong Cha is not MUIS halal-certified in Singapore. Although many of its ingredients are individually halal-certified, its outlets are not on the MUIS HalalSG register, so it is not officially halal-certified. Verify on the MUIS HalalSG register before ordering.",
  },
  {
    slug: "sushi-tei", brand: "Sushi Tei", category: "Sushi restaurant", status: "not-certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Sushi Tei is not MUIS halal-certified in Singapore. Its outlets are not on the MUIS HalalSG register and it uses alcohol-based Japanese seasonings such as mirin and sake. It is not halal-certified — verify on the MUIS HalalSG register.",
  },
  {
    slug: "mos-burger", brand: "MOS Burger", category: "Fast food", status: "not-certified", lastChecked: CHECKED, source: PUBLIC_INFO, aliases: ["mosburger", "mos"],
    answer: "MOS Burger is not MUIS halal-certified in Singapore. Although its Singapore outlets do not serve pork or lard, they are not on the MUIS HalalSG register, so the chain is not officially halal-certified. 'No pork' is not the same as certification — verify on the MUIS HalalSG register.",
  },
  {
    slug: "collins", brand: "Collin's", category: "Western restaurant", status: "not-certified", lastChecked: CHECKED, source: PUBLIC_INFO, aliases: ["collins-grille", "collin"],
    answer: "Collin's (COLLIN'S® Grille) is not MUIS halal-certified in Singapore — its main outlets serve pork and alcohol and are not on the MUIS HalalSG register. Its separate 'El Fuego by Collin's' concept is halal-certified. Confirm the specific brand and outlet on the MUIS HalalSG register.",
  },
  {
    slug: "boost-juice", brand: "Boost Juice", category: "Juice & smoothies", status: "not-certified", lastChecked: CHECKED, source: PUBLIC_INFO, aliases: ["boost", "boost-juice-bars"],
    answer: "Boost Juice is not MUIS halal-certified in Singapore. Although its smoothies are plant-based and its suppliers' ingredients may be halal, its outlets are not on the MUIS HalalSG register, so the chain is not officially halal-certified. Verify on the MUIS HalalSG register before ordering.",
  },
];

const BY_SLUG = new Map(brands.map((b) => [b.slug, b]));

export function allBrands(): BrandHalal[] {
  return brands;
}

export function getBrand(slug: string): BrandHalal | undefined {
  return BY_SLUG.get(slug) || brands.find((b) => b.aliases?.includes(slug));
}

export function relatedBrands(b: BrandHalal, limit = 6): BrandHalal[] {
  const same = brands.filter((x) => x.slug !== b.slug && x.category === b.category);
  const rest = brands.filter((x) => x.slug !== b.slug && x.category !== b.category);
  return [...same, ...rest].slice(0, limit);
}
