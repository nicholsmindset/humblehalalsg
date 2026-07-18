/* Humble Halal — "Is [brand] halal?" answer dataset.

   ACCURACY POLICY (read before editing):
   - MUIS HalalSG is the single source of truth. We never assert a brand is
     "halal" without certification, and we never call a MUIS-certified brand
     "not halal" — both directions destroy trust. Statuses below were
     re-verified against brand statements and SG press in July 2026.
   - "no pork / no lard" is self-declared and is NOT halal certification.
   - Every entry carries a `lastChecked` date; statuses change — re-verify.
   - Admins can override or add entries in Keystatic ("Is-it-halal brands");
     a CMS entry with the same slug wins (lib/cms-brands.ts).
   These statuses reflect publicly available information as of `lastChecked`. */

export type HalalStatus = "certified" | "partial" | "no-pork" | "not-certified" | "unknown";

export interface BrandFaqItem { q: string; a: string }
export interface BrandAlternative {
  label: string; // "Old Chang Kee (certified since 2005)"
  slug?: string; // links to /is-halal/<slug> when it's a sibling brand page
  note?: string; // optional one-liner shown under the label
}

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
  /** Optional brand logo (CMS upload → /brands/…); shown in the page header. */
  logo?: string;
  /* Curated depth (all optional — pages degrade to per-status defaults from
     lib/halal-status-content.ts when absent, so CMS-added brands never render thin). */
  certifiedSince?: string; // "1992" — certified/partial only; extra details-table row
  whyStatus?: string[]; // 2–3 bullets: why this verdict
  watchFor?: string[]; // 2–4 items: what to check before ordering
  alternatives?: BrandAlternative[]; // 2–4 halal-certified siblings
  faqs?: BrandFaqItem[]; // curated FAQs (merged with per-status defaults)
  explainer?: string; // per-brand override lead for the status explainer
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
    answer: "Yes — all Paris Baguette outlets in Singapore are MUIS halal-certified as of February 2026, after operating no-pork, no-lard since 2021. Certification is per-premises and renewable, so confirm the specific outlet on the MUIS HalalSG register.",
  },
  {
    slug: "genki-sushi", brand: "Genki Sushi", category: "Sushi restaurant", status: "no-pork", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Genki Sushi Singapore is not MUIS halal-certified. The chain states its menu uses no pork and no lard, but some sauces contain mirin and it cannot guarantee against cross-contamination. 'No pork, no lard' is self-declared and is not halal certification — verify on MUIS HalalSG.",
  },
  {
    slug: "saizeriya", brand: "Saizeriya", category: "Italian restaurant", status: "not-certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Saizeriya is not halal in Singapore. The menu includes pork and wine, and its outlets are not on the MUIS HalalSG register. It is not suitable for halal-conscious diners.",
  },
  {
    slug: "breadtalk", brand: "BreadTalk", category: "Bakery", status: "not-certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "BreadTalk is not MUIS halal-certified in Singapore — its own FAQ confirms it holds no halal certification, and some products contain non-halal fillings such as pork floss. Treat it as not halal-certified and check MUIS HalalSG.",
  },
  {
    slug: "chateraise", brand: "Chateraise", category: "Japanese dessert & bakery", status: "not-certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Chateraise is not MUIS halal-certified in Singapore. It is not on the MUIS HalalSG register and some items contain alcohol (such as wine-based desserts) or gelatine of unverified origin. Verify on MUIS HalalSG before purchasing.",
  },
  {
    slug: "yoshinoya", brand: "Yoshinoya", category: "Japanese beef bowl", status: "certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Yes — Yoshinoya Singapore has been MUIS halal-certified since December 2024, covering its outlets islandwide. As certification is per-premises and renewable, confirm the specific outlet's current certificate on the MUIS HalalSG register before dining.",
  },
  {
    slug: "sukiya", brand: "Sukiya", category: "Japanese gyudon", status: "certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Yes — Sukiya's Singapore outlets have been MUIS halal-certified since May 2023, so its gyudon beef bowls and sides are halal. Certification is per-premises and renewable — confirm the outlet's current status on the MUIS HalalSG register.",
  },
  {
    slug: "starbucks", brand: "Starbucks", category: "Coffee chain", status: "not-certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Starbucks Singapore is not MUIS halal-certified, and in May 2026 MUIS confirmed it had received no certification application from the chain. Most drinks are pork-free, but some food items contain non-halal ingredients. Verify the latest status on MUIS HalalSG.",
  },
  {
    slug: "haidilao", brand: "Haidilao", category: "Hotpot restaurant", status: "not-certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Haidilao is not halal in Singapore. It serves pork and alcohol and is not on the MUIS HalalSG register. It is not suitable for halal-conscious diners.",
  },
  {
    slug: "tim-hortons", brand: "Tim Hortons", category: "Coffee & bakery", status: "certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Yes — Tim Hortons Singapore received MUIS halal certification in February 2026, covering all of its restaurants islandwide after a full supply-chain and kitchen audit. Certificates are renewed periodically, so confirm the outlet's current listing on the MUIS HalalSG register.",
  },
  {
    slug: "pizza-hut", brand: "Pizza Hut", category: "Pizza restaurant", status: "certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Yes — Pizza Hut Singapore is MUIS halal-certified, with a menu adapted for certification (chicken ham and beef pepperoni instead of pork). Certification is per-outlet and renewable, so confirm the specific outlet on the MUIS HalalSG register before ordering.",
  },
  {
    slug: "four-leaves", brand: "Four Leaves", category: "Bakery", status: "not-certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Four Leaves is not MUIS halal-certified in Singapore — it is not on the MUIS HalalSG register and some products contain non-halal fillings such as pork floss. Verify the latest status on MUIS HalalSG.",
  },
  {
    slug: "swee-heng", brand: "Swee Heng", category: "Bakery", status: "certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Yes — Swee Heng Bakery, including its Swee Heng 1989 Classic outlets, is MUIS halal-certified in Singapore. Certification is per-premises and renewable, so confirm the specific outlet's current certificate on the MUIS HalalSG register before buying.",
  },
  {
    slug: "delifrance", brand: "Délifrance", category: "Bakery & café", status: "certified", lastChecked: CHECKED, source: PUBLIC_INFO, aliases: ["delifrance"],
    answer: "Yes — Délifrance Singapore's retail outlets have been MUIS halal-certified islandwide since March 2019. Certification is per-premises and renewable, so confirm the specific outlet's current certificate on the MUIS HalalSG register.",
  },
  {
    slug: "tiong-bahru-bakery", brand: "Tiong Bahru Bakery", category: "Bakery & café", status: "not-certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Tiong Bahru Bakery is not MUIS halal-certified in Singapore. It is not on the MUIS HalalSG register and its menu includes pork-based items. It is not suitable for halal-conscious diners; verify on MUIS HalalSG.",
  },
  {
    slug: "bengawan-solo", brand: "Bengawan Solo", category: "Kueh & cakes", status: "not-certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Bengawan Solo is not MUIS halal-certified in Singapore and has confirmed it has not applied. Its kueh use no pork, lard or meat, but some cakes contain rum-based syrup, so it is not halal-certified. Check individual products and verify on MUIS HalalSG.",
  },
  {
    slug: "jacks-place", brand: "Jack's Place", category: "Western steakhouse", status: "not-certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Jack's Place is not halal in Singapore — it serves pork and bacon dishes and alcohol, and is not on the MUIS HalalSG register. Its parent group runs the separately halal-certified Eatzi Gourmet brand as its Muslim-friendly alternative.",
  },
  {
    slug: "krispy-kreme", brand: "Krispy Kreme", category: "Doughnuts", status: "certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Yes — Krispy Kreme Singapore has been MUIS halal-certified since 2013, so its doughnuts and drinks are halal. Certification is per-premises and renewable — confirm the specific store's current certificate on the MUIS HalalSG register.",
  },
  {
    slug: "wingstop", brand: "Wingstop", category: "Chicken wings", status: "certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Yes — Wingstop's Singapore outlets are MUIS halal-certified, covering its wings, sauces and sides. Certification is per-premises and renewable, so confirm the specific outlet's current certificate on the MUIS HalalSG register before ordering.",
  },
  {
    slug: "killiney-kopitiam", brand: "Killiney Kopitiam", category: "Kopitiam", status: "partial", lastChecked: CHECKED, source: PUBLIC_INFO, aliases: ["killiney"],
    answer: "Partly — most Killiney Kopitiam outlets are not MUIS halal-certified, but selected operations are: the Tanah Merah Ferry Terminal outlets, its halal concept Kedai Killiney Kopi, and certain packaged retail products. Check the specific outlet or product on the MUIS HalalSG register.",
  },
  {
    slug: "mr-bean", brand: "Mr Bean", category: "Soya & snacks", status: "certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Yes — Mr Bean has been MUIS halal-certified since June 2022, covering its Singapore outlets and their soya drinks and snacks. Certification is renewable, so confirm the specific outlet's current certificate on the MUIS HalalSG register.",
  },
  {
    slug: "haribo", brand: "Haribo", category: "Gummy sweets", status: "partial", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "It depends on the pack. Standard Haribo (made in Germany) contains pork-derived gelatine and is not halal. Haribo also produces halal-certified ranges (made in Turkey with beef gelatine) that are sold in Singapore — buy only packs carrying a halal mark and check each pack.",
  },
  {
    slug: "jollibee", brand: "Jollibee", category: "Fast food", status: "certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Yes — Jollibee's Singapore outlets are MUIS halal-certified, so its fried chicken, burgers and rice meals are halal. Certification is per outlet and can change, so confirm the specific Jollibee outlet on the MUIS HalalSG register before dining.",
  },
  {
    slug: "pepper-lunch", brand: "Pepper Lunch", category: "Japanese restaurant", status: "certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Yes — Pepper Lunch's Singapore restaurants and express outlets have been MUIS halal-certified since February 2021, so its sizzling beef, chicken and salmon plates are halal. Always confirm the specific outlet's certificate on the MUIS HalalSG register, as statuses can change.",
  },
  {
    slug: "koi", brand: "KOI Thé", category: "Bubble tea", status: "no-pork", lastChecked: CHECKED, source: PUBLIC_INFO, aliases: ["koi-the"],
    answer: "KOI Thé is not MUIS halal-certified in Singapore. KOI has stated its ingredients are plant- or dairy-based with no alcohol or animal gelatine, but that is self-declared and not halal certification. Verify the latest status on MUIS HalalSG before ordering.",
  },
  {
    slug: "liho", brand: "LiHO TEA", category: "Bubble tea", status: "no-pork", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "LiHO TEA is not MUIS halal-certified in Singapore. The chain has said its outlets use no pork, lard or meat products, but some ingredients come from suppliers that are not halal-certified. Self-declarations are not certification — verify on MUIS HalalSG.",
  },
  {
    slug: "old-chang-kee", brand: "Old Chang Kee", category: "Snacks", status: "certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Yes — Old Chang Kee has been MUIS halal-certified since 2005, covering its products, outlets and central kitchens, so its curry puffs and snacks are halal. Certification is renewable — confirm the current listing on the MUIS HalalSG register.",
  },
  {
    slug: "nandos", brand: "Nando's", category: "Restaurant", status: "certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Yes — Nando's Singapore outlets are MUIS halal-certified, so its flame-grilled peri-peri chicken is halal. Certification is per-premises and renewable, so confirm the specific outlet's current certificate on the MUIS HalalSG register before dining.",
  },
  {
    slug: "shake-shack", brand: "Shake Shack", category: "Burgers", status: "not-certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Shake Shack is not MUIS halal-certified in Singapore and has said it does not intend to be. The menu includes non-halal beef hot dogs, bacon and alcohol, so it is not suitable for halal-conscious diners.",
  },
  {
    slug: "awfully-chocolate", brand: "Awfully Chocolate", category: "Bakery", status: "not-certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Awfully Chocolate is not MUIS halal-certified in Singapore — the brand itself says so because some products contain alcohol, although no pork or lard is used. Check the specific product before buying and verify on MUIS HalalSG.",
  },
  {
    slug: "chocolate-origin", brand: "Chocolate Origin", category: "Bakery", status: "partial", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Partly — Chocolate Origin holds MUIS halal certification for specific products, including its signature chocolate cake, but its outlets themselves are not halal-certified premises. Look for the halal mark on the specific product and verify on the MUIS HalalSG register.",
  },
  {
    slug: "famous-amos", brand: "Famous Amos", category: "Bakery", status: "certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Yes — Famous Amos Singapore has been MUIS halal-certified across its outlets since November 2022, so its freshly baked cookies are halal. Certification is renewable — confirm the current listing on the MUIS HalalSG register.",
  },
  {
    slug: "a-w", brand: "A&W", category: "Fast food", status: "certified", lastChecked: CHECKED, source: PUBLIC_INFO, aliases: ["aw", "a-and-w"],
    answer: "Yes — A&W Singapore has been MUIS halal-certified since November 2020, and it was Singapore's first halal-certified fast-food chain back in 1992. Certification is per-outlet and renewable, so confirm the specific outlet on the MUIS HalalSG register.",
  },
  {
    slug: "burger-king", brand: "Burger King", category: "Fast food", status: "certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Yes — Burger King Singapore is MUIS halal-certified chain-wide; it serves no pork, and items like turkey bacon replace pork ingredients. Certification is per-outlet and renewable, so confirm the specific outlet on the MUIS HalalSG register.",
  },
  {
    slug: "popeyes", brand: "Popeyes", category: "Fast food", status: "certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Yes — Popeyes Singapore is MUIS halal-certified across its outlets, covering its fried chicken, sauces and sides. Certification is per-outlet and renewable, so confirm the specific outlet's current certificate on the MUIS HalalSG register.",
  },
  {
    slug: "mcdonalds", brand: "McDonald's", category: "Fast food", status: "certified", lastChecked: CHECKED, source: PUBLIC_INFO, aliases: ["mcdonald", "mcdonalds-singapore"],
    answer: "Yes — every McDonald's restaurant in Singapore is MUIS halal-certified, and has been since 1992; this covers McCafé and dessert kiosks too. Certificates are renewed periodically, so you can confirm any outlet's current status on the MUIS HalalSG register.",
  },
  {
    slug: "kfc", brand: "KFC", category: "Fast food", status: "certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Yes — KFC Singapore's outlets are MUIS halal-certified, with certificates displayed per premises, so its fried chicken and sides are halal. Certification is renewable — confirm the specific outlet's current status on the MUIS HalalSG register.",
  },
  {
    slug: "subway", brand: "Subway", category: "Fast food", status: "certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Yes — Subway Singapore has been MUIS halal-certified since August 2018, when it dropped pork products chain-wide (deli meats are poultry-based). Certification is per-outlet and renewable, so confirm the specific outlet on the MUIS HalalSG register.",
  },
  {
    slug: "din-tai-fung", brand: "Din Tai Fung", category: "Restaurant", status: "not-certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Din Tai Fung is not halal in Singapore. Many signature dishes such as xiao long bao contain pork, and its outlets are not on the MUIS HalalSG register. Its Muslim-friendly 'DIN' concept exists only in Malaysia. It is not halal-certified.",
  },
  {
    slug: "fish-and-co", brand: "Fish & Co.", category: "Seafood restaurant", status: "certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Yes — Fish & Co. Singapore is MUIS halal-certified (it regained certification in September 2018 after a brief lapse), so its seafood platters and pastas are halal. Certification is per-premises and renewable — confirm the outlet on the MUIS HalalSG register.",
  },
  // Blueprint AIO-engine targets (Keyword Master Plan, Is-X-Halal tab).
  {
    slug: "mos-burger", brand: "MOS Burger", category: "Fast food", status: "no-pork", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "MOS Burger Singapore is not MUIS halal-certified — it is not on the MUIS HalalSG register. Menu guides indicate no pork or lard is used, but that is not halal certification and cross-handling is unverified. Verify the latest status on MUIS HalalSG.",
    aliases: ["mos"],
  },
  {
    slug: "chagee", brand: "CHAGEE", category: "Tea & beverages", status: "not-certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "CHAGEE is not MUIS halal-certified in Singapore — its outlets are not on the MUIS HalalSG register. CHAGEE holds JAKIM halal certification in Malaysia, but that does not extend to Singapore outlets. Confirm the latest status on MUIS HalalSG.",
    aliases: ["bawang chaji", "chagee tea"],
  },
  {
    slug: "cedele", brand: "Cedele", category: "Bakery & café", status: "no-pork", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Cedele is not MUIS halal-certified in Singapore. Its menu uses no pork or lard, but the chain has not applied for halal certification, so ingredient sourcing and handling are unverified. 'No pork, no lard' is not certification — verify on MUIS HalalSG.",
  },
  {
    slug: "emicakes", brand: "Emicakes", category: "Cake shop", status: "no-pork", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Emicakes is not MUIS halal-certified — its own FAQ confirms this. The chain states it uses no pork, lard or alcohol in its products and processes, but that is self-declared and not halal certification. Verify the latest status on the MUIS HalalSG register.",
    aliases: ["emi cakes"],
  },

  // ── Batch added July 2026 from search-demand research; each status verified
  //    against publicly available information. Certification is per-premises and
  //    renewable — the answers direct users to the MUIS HalalSG register.
  {
    slug: "dominos", brand: "Domino's Pizza", category: "Pizza restaurant", status: "certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Yes — Domino's Pizza outlets in Singapore are MUIS halal-certified and appear on the MUIS HalalSG register of certified eating establishments. Certification is per-premises and renewable, so confirm the specific outlet on the register before ordering.",
    aliases: ["dominos pizza", "domino's", "domino pizza"],
  },
  {
    slug: "potato-corner", brand: "Potato Corner", category: "Snacks", status: "certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Yes — Potato Corner Singapore is MUIS halal-certified, so its flavoured fries are suitable for Muslim diners. Certification is per-premises and renewable and applies to listed outlets, so confirm the specific location on the MUIS HalalSG register before ordering.",
    aliases: ["potato corner fries"],
  },
  {
    slug: "coffee-bean", brand: "The Coffee Bean & Tea Leaf", category: "Coffee chain", status: "certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Yes — The Coffee Bean & Tea Leaf states its food and beverages in Singapore are MUIS halal-certified, and its outlets appear on the MUIS HalalSG register. Certification is per-premises and renewable, so confirm the specific outlet on the register before ordering.",
    aliases: ["coffee bean", "coffee bean and tea leaf", "cbtl"],
  },
  {
    slug: "twelve-cupcakes", brand: "Twelve Cupcakes", category: "Cake shop", status: "not-certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Twelve Cupcakes is not confirmed as MUIS halal-certified. Public sources conflict and its status appears to have changed, with reports that an earlier certification has lapsed, so do not assume it is halal. Always check the current listing on the official MUIS HalalSG register before ordering.",
    aliases: ["12 cupcakes"],
  },
  {
    slug: "primadeli", brand: "PrimaDeli", category: "Bakery", status: "certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Yes — PrimaDeli is MUIS halal-certified in Singapore, so its cakes, buns and pastries are suitable for Muslim customers. Certification is per-premises and renewable, so confirm the specific outlet on the MUIS HalalSG register before ordering.",
    aliases: ["prima deli"],
  },
  {
    slug: "polar-puffs-cakes", brand: "Polar Puffs & Cakes", category: "Bakery", status: "certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Yes — Polar Puffs & Cakes is MUIS halal-certified in Singapore, so its puffs, cakes and pastries are suitable for Muslim customers. Certification is per-premises and renewable, so confirm the specific outlet on the MUIS HalalSG register before ordering.",
    aliases: ["polar puffs", "polar cakes", "polar"],
  },
  {
    slug: "neo-garden", brand: "Neo Garden Catering", category: "Catering", status: "certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Yes — Neo Garden Catering is MUIS halal-certified in Singapore, so its buffet and event catering is suitable for Muslim functions. Certification is renewable, so confirm the current status on the MUIS HalalSG register (or ask for the halal certificate) before booking.",
    aliases: ["neo garden catering", "neo group catering"],
  },
  {
    slug: "monster-curry", brand: "Monster Curry", category: "Japanese restaurant", status: "not-certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Monster Curry is not MUIS halal-certified, so it is best avoided if you require certification. Its sister brand, Monster Planet, runs a separate MUIS halal-certified Japanese-curry menu — look for Monster Planet outlets and confirm them on the MUIS HalalSG register.",
    aliases: ["monster curry singapore"],
  },
  {
    slug: "sushiro", brand: "Sushiro", category: "Sushi restaurant", status: "not-certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Sushiro is not MUIS halal-certified in Singapore. Although much of its conveyor-belt menu is seafood, the outlets are not certified and items may involve non-halal ingredients or cross-contact, so it cannot be treated as halal. Choose a MUIS-certified sushi option and verify on the HalalSG register.",
    aliases: ["sushiro singapore"],
  },
  {
    slug: "fun-toast", brand: "Fun Toast", category: "Kopitiam", status: "not-certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Fun Toast is not MUIS halal-certified. Recent public information indicates the kopitiam chain does not hold MUIS certification, so it should not be assumed halal. If you need certified food, choose a listed halal kopitiam and verify the outlet on the MUIS HalalSG register.",
    aliases: ["fun toast singapore"],
  },
  {
    slug: "ferrero-rocher", brand: "Ferrero Rocher", category: "Snacks", status: "not-certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Ferrero Rocher sold in Singapore is not MUIS halal-certified. Some Ferrero products made in Muslim-majority countries carry halal certification from other bodies, so check the packaging for a recognised halal mark and the ingredients. When in doubt, treat uncertified imports as not halal-certified.",
    aliases: ["ferrero", "ferrero rocher chocolate"],
  },
  {
    slug: "takagi-ramen", brand: "Takagi Ramen", category: "Japanese restaurant", status: "not-certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Takagi Ramen is not MUIS halal-certified. Its ramen commonly uses pork-based broth and pork chashu, so it is not suitable for Muslim diners. For halal ramen in Singapore, choose a MUIS-certified outlet and verify it on the HalalSG register.",
    aliases: ["takagi ramen singapore"],
  },
  // ── v3 brand fan-out (keyword-research-v3) — statuses verified against MUIS
  //    HalalSG + public brand statements, July 2026. Re-verify per outlet. ──
  {
    slug: "pastamania", brand: "PastaMania", category: "Italian restaurant", status: "certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Yes — every PastaMania outlet in Singapore is MUIS halal-certified, covering its pasta, pizza, baked rice and desserts. Certification is per-premises and renewable, so confirm the specific outlet on the MUIS HalalSG register.",
    aliases: ["pasta mania", "pastamania singapore"],
  },
  {
    slug: "poulet", brand: "Poulet", category: "French rotisserie restaurant", status: "certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Yes — all Poulet outlets in Singapore have been MUIS halal-certified since November 2020, so its signature French roast chicken and sides are halal. Certification is per-premises and renewable — confirm the outlet on the MUIS HalalSG register.",
    aliases: ["poulet singapore", "poulet french"],
  },
  {
    slug: "soup-spoon", brand: "The Soup Spoon", category: "Soup & café chain", status: "certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Yes — all The Soup Spoon (and Soup Spoon Union) outlets in Singapore have been MUIS halal-certified since June 2019, with alcohol-containing soups reformulated. Certification is per-premises and renewable — confirm the outlet on the MUIS HalalSG register.",
    aliases: ["the soup spoon", "soup spoon union", "soupspoon"],
  },
  {
    slug: "namu-bulgogi", brand: "Namu Bulgogi", category: "Korean BBQ restaurant", status: "certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Yes — Namu Bulgogi is MUIS halal-certified and bills itself as Singapore's first halal Korean oakwood smoke-grill, with outlets including Tampines 1, Hillion Mall and Northpoint City. Certification is per-premises and renewable — confirm the outlet on the MUIS HalalSG register.",
    aliases: ["namu bulgogi", "namu korean", "namu bbq"],
  },
  {
    slug: "sushi-tei", brand: "Sushi Tei", category: "Japanese restaurant", status: "no-pork", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Sushi Tei is not MUIS halal-certified in Singapore. The chain states it serves no pork and no lard, but it is not on the MUIS HalalSG register and some items may use mirin or sake. 'No pork, no lard' is self-declared and is not halal certification — verify on MUIS HalalSG.",
    aliases: ["sushi tei singapore"],
  },
  {
    slug: "oriental-kopi", brand: "Oriental Kopi", category: "Malaysian kopitiam & café", status: "no-pork", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Oriental Kopi's Singapore outlets are not MUIS halal-certified — only its Malaysian outlets hold JAKIM certification, which does not apply here. The Singapore menu is stated to be pork-free, but it is not on the MUIS HalalSG register, so treat it as no-pork, not certified, and verify on MUIS HalalSG.",
    aliases: ["oriental kopi singapore", "oriental kopi bugis"],
  },
  {
    slug: "ikea", brand: "IKEA", category: "Swedish restaurant & café", status: "partial", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Partly — it depends on the store. IKEA Tampines runs a MUIS halal-certified restaurant line (Line 3) serving halal meatballs and mains, while stores such as IKEA Alexandra do not offer halal-certified food. Check the specific store and confirm the current certificate on the MUIS HalalSG register.",
    aliases: ["ikea restaurant", "ikea menu", "ikea tampines", "ikea meatballs"],
  },
  {
    slug: "astons", brand: "Astons", category: "Western steakhouse", status: "not-certified", lastChecked: CHECKED, source: PUBLIC_INFO,
    answer: "Astons Specialities is not halal — its menu includes pork and alcohol and its outlets are not MUIS-certified. For a halal alternative, the same group runs ANDES by Astons, a separate halal-certified steak-and-Western brand — confirm ANDES outlets on the MUIS HalalSG register.",
    aliases: ["astons specialities", "aston", "andes by astons"],
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
