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

const CHECKED = "June 2026";
const PUBLIC_INFO = "MUIS HalalSG register + publicly available information";

export const brands: BrandHalal[] = [
  {
    slug: "paris-baguette", brand: "Paris Baguette", category: "Bakery & café", status: "not-certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Paris Baguette is not MUIS halal-certified in Singapore. Its outlets are not listed on the MUIS HalalSG register, and some products may contain alcohol or animal-derived ingredients. Treat it as not halal-certified and confirm the latest status on MUIS HalalSG.",
  },
  {
    slug: "genki-sushi", brand: "Genki Sushi", category: "Sushi restaurant", status: "not-certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Genki Sushi is not MUIS halal-certified in Singapore. It is not on the MUIS HalalSG register and serves items with alcohol-based seasonings. It is not halal-certified — verify on MUIS HalalSG before dining.",
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
    slug: "yoshinoya", brand: "Yoshinoya", category: "Japanese beef bowl", status: "not-certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Yoshinoya is not MUIS halal-certified in Singapore. Its outlets are not on the MUIS HalalSG register and sauces may contain alcohol such as mirin or sake. It is not halal-certified — verify on HalalSG.",
  },
  {
    slug: "sukiya", brand: "Sukiya", category: "Japanese gyudon", status: "no-pork", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Sukiya Singapore states it uses no pork and no lard, but it is not MUIS halal-certified — it is not listed on the MUIS HalalSG register. 'No pork, no lard' is self-declared and is not the same as halal certification; verify on HalalSG.",
  },
  {
    slug: "starbucks", brand: "Starbucks", category: "Coffee chain", status: "not-certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Starbucks Singapore is not MUIS halal-certified. Its outlets are not on the MUIS HalalSG register and some food items contain non-halal ingredients. Most drinks are pork-free, but the chain is not halal-certified — verify on HalalSG.",
  },
  {
    slug: "haidilao", brand: "Haidilao", category: "Hotpot restaurant", status: "not-certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Haidilao is not halal in Singapore. It serves pork and alcohol and is not on the MUIS HalalSG register. It is not suitable for halal-conscious diners.",
  },
  {
    slug: "tim-hortons", brand: "Tim Hortons", category: "Coffee & bakery", status: "not-certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Tim Hortons Singapore is not MUIS halal-certified. Its outlets are not listed on MUIS HalalSG and some items contain non-halal ingredients. Treat it as not halal-certified and verify on HalalSG.",
  },
  {
    slug: "pizza-hut", brand: "Pizza Hut", category: "Pizza restaurant", status: "not-certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Pizza Hut Singapore is not MUIS halal-certified, unlike Pizza Hut in some other countries. SG outlets serve pork toppings and are not on the MUIS HalalSG register. It is not halal-certified.",
  },
  {
    slug: "four-leaves", brand: "Four Leaves", category: "Bakery", status: "not-certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Four Leaves is not MUIS halal-certified in Singapore. Its outlets are not on the MUIS HalalSG register and some products contain non-halal fillings. Verify the latest status on HalalSG.",
  },
  {
    slug: "swee-heng", brand: "Swee Heng", category: "Bakery", status: "not-certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Swee Heng Bakery is not MUIS halal-certified in Singapore — it is not listed on the MUIS HalalSG register. Some products may contain non-halal ingredients; verify on HalalSG before buying.",
  },
  {
    slug: "delifrance", brand: "Délifrance", category: "Bakery & café", status: "not-certified", lastChecked: CHECKED, source: PUBLIC_INFO, aliases: ["delifrance"],
    answer: "Délifrance Singapore is not MUIS halal-certified. Its outlets are not on the MUIS HalalSG register and some items contain non-halal ingredients such as ham or bacon. Treat it as not halal-certified.",
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
    slug: "krispy-kreme", brand: "Krispy Kreme", category: "Doughnuts", status: "not-certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Krispy Kreme Singapore is not MUIS halal-certified. Its outlets are not on the MUIS HalalSG register and doughnuts may contain animal-derived ingredients. Treat it as not halal-certified and verify on HalalSG.",
  },
  {
    slug: "wingstop", brand: "Wingstop", category: "Chicken wings", status: "not-certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Wingstop Singapore is not MUIS halal-certified — it is not listed on the MUIS HalalSG register. Unlike some overseas markets, the SG outlets are not halal-certified; verify on HalalSG before ordering.",
  },
  {
    slug: "killiney-kopitiam", brand: "Killiney Kopitiam", category: "Kopitiam", status: "not-certified", lastChecked: CHECKED, source: PUBLIC_INFO, aliases: ["killiney"],
    answer: "Killiney Kopitiam is not MUIS halal-certified in Singapore. Its outlets are not on the MUIS HalalSG register and the menu includes non-halal items. Verify on HalalSG.",
  },
  {
    slug: "mr-bean", brand: "Mr Bean", category: "Soya & snacks", status: "no-pork", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Mr Bean's soya drinks are plant-based, but Mr Bean is not MUIS halal-certified in Singapore — it is not listed on the MUIS HalalSG register. Treat it as not officially certified and verify on HalalSG.",
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
    slug: "old-chang-kee", brand: "Old Chang Kee", category: "Snacks", status: "not-certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Old Chang Kee is not MUIS halal-certified in Singapore — its outlets are not on the MUIS HalalSG register and some items are not halal. Treat it as not halal-certified and verify on HalalSG.",
  },
  {
    slug: "nandos", brand: "Nando's", category: "Restaurant", status: "not-certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Nando's is not MUIS halal-certified in Singapore — its outlets are not on the MUIS HalalSG register and it serves alcohol. It is not halal-certified; confirm the latest status on HalalSG.",
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
    slug: "famous-amos", brand: "Famous Amos", category: "Bakery", status: "not-certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Famous Amos is not MUIS halal-certified in Singapore — its cookies are not listed on the MUIS HalalSG register. Treat it as not halal-certified and check HalalSG for any updates.",
  },
  {
    slug: "a-w", brand: "A&W", category: "Fast food", status: "not-certified", lastChecked: CHECKED, source: PUBLIC_INFO, aliases: ["aw", "a-and-w"],
    answer: "A&W is not MUIS halal-certified in Singapore. Although it does not serve pork, its outlets are not on the MUIS HalalSG register, so it is not officially halal-certified. Verify on HalalSG before dining.",
  },
  {
    slug: "burger-king", brand: "Burger King", category: "Fast food", status: "not-certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Burger King is not MUIS halal-certified in Singapore. Its outlets are not on the MUIS HalalSG register and the menu includes bacon and other pork items, so it is not halal-certified.",
  },
  {
    slug: "popeyes", brand: "Popeyes", category: "Fast food", status: "not-certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Popeyes is not MUIS halal-certified in Singapore — its outlets are not on the MUIS HalalSG register. Treat it as not halal-certified and confirm the latest status on HalalSG.",
  },
  {
    slug: "mcdonalds", brand: "McDonald's", category: "Fast food", status: "not-certified", lastChecked: CHECKED, source: PUBLIC_INFO, aliases: ["mcdonald", "mcdonalds-singapore"],
    answer: "McDonald's is not MUIS halal-certified in Singapore — unlike in Malaysia, its Singapore outlets are not on the MUIS HalalSG register. Treat it as not halal-certified and verify the latest status on HalalSG.",
  },
  {
    slug: "kfc", brand: "KFC", category: "Fast food", status: "not-certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "KFC is not MUIS halal-certified in Singapore — unlike in Malaysia, its Singapore outlets are not on the MUIS HalalSG register. Treat it as not halal-certified and confirm on HalalSG.",
  },
  {
    slug: "subway", brand: "Subway", category: "Fast food", status: "not-certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Subway is not MUIS halal-certified in Singapore — its outlets are not on the MUIS HalalSG register and serve pork (ham, bacon). It is not halal-certified; verify on HalalSG before ordering.",
  },
  {
    slug: "din-tai-fung", brand: "Din Tai Fung", category: "Restaurant", status: "not-certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Din Tai Fung is not halal in Singapore. Many signature dishes such as xiao long bao contain pork, and its outlets are not on the MUIS HalalSG register. It is not halal-certified.",
  },
  {
    slug: "fish-and-co", brand: "Fish & Co.", category: "Seafood restaurant", status: "not-certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Fish & Co. is not MUIS halal-certified in Singapore — its outlets are not listed on the MUIS HalalSG register and it serves alcohol. Treat it as not halal-certified and verify on HalalSG.",
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
