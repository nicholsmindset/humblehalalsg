/* Humble Halal — drafting queue for the "is [brand] halal?" verdict engine.

   These are brands Singapore Muslims actually search halal status for that the
   file dataset (lib/halal-status.ts) does not yet cover. The verdict-drafts
   cron walks this list, AI-drafts a structured verdict for the next few
   uncovered names (status='pending'), and a human approves in the admin queue
   before anything publishes — the same draft → human-approve pipeline as the
   admin "Draft with AI" button.

   Curation rules:
   - Names people genuinely query with halal intent in Singapore (chains sold
     here, supermarket staples, snacks with gelatine/alcohol/emulsifier
     questions). No obscure one-outlet cafés.
   - A name already covered by lib/halal-status.ts or an existing halal_verdicts
     row is skipped automatically (match by verdictSlug) — safe to leave
     overlaps in this list.
   - This is a static seed; graduate to a `verdict_queue` table when demand
     data (zero-result searches, GSC queries) should drive priority. */

import { verdictSlug } from "./verdicts";

export const VERDICT_QUEUE: readonly string[] = [
  // ── Bubble tea & drinks chains ──
  "Gong Cha",
  "Each A Cup",
  "Tiger Sugar",
  "Mixue",
  "HEYTEA",
  "ChaTraMue",
  "Playmade",
  "R&B Tea",
  "Milksha",
  "Mr Coconut",
  "Boost Juice",
  // ── Coffee, toast & bakery cafés ──
  "Ya Kun Kaya Toast",
  "Han's Café",
  "Hoshino Coffee",
  "Flash Coffee",
  "Dunkin' Donuts",
  "J.CO Donuts",
  "Mister Donut",
  "Auntie Anne's",
  "Duke Bakery",
  "Chin Mee Chin",
  "Rich & Good Cake Shop",
  "Cat & the Fiddle",
  "Baker's Brew",
  // ── Fast food & casual chains ──
  "Long John Silver's",
  "Arnold's Fried Chicken",
  "Nene Chicken",
  "Bonchon",
  "Jinjja Chicken",
  "Pelicana Chicken",
  "Manhattan Fish Market",
  "Marché Mövenpick",
  "Hot Tomato",
  "Ajisen Ramen",
  "Ippudo",
  "Tamoya Udon",
  "Sakae Sushi",
  "Itacho Sushi",
  "Umi Sushi",
  "Maki-San",
  "Gyu-Kaku",
  "Watami",
  "Suki-Ya",
  "Shabu Sai",
  "Paik's Bibim",
  // ── Chinese & seafood restaurants ──
  "Tim Ho Wan",
  "Crystal Jade",
  "Paradise Dynasty",
  "PUTIEN",
  "Canton Paradise",
  "Dian Xiao Er",
  "Soup Restaurant",
  "JUMBO Seafood",
  "No Signboard Seafood",
  // ── Ice cream & dessert ──
  "Ben & Jerry's",
  "Magnum",
  "Wall's",
  "Cornetto",
  "Udders",
  "Birds of Paradise",
  "Creamier",
  "Sunday Folks",
  "llaollao",
  "Yolé",
  // ── Supermarket staples & instant noodles ──
  "Milo",
  "Nutella",
  "Oreo",
  "KitKat",
  "Pringles",
  "Lay's",
  "Twisties",
  "Mamee",
  "Maggi",
  "Indomie",
  "Nissin",
  "Myojo",
  "Koka",
  "Marigold",
  "F&N",
  "Yeo's",
  "Pokka",
  "100 Plus",
  "Red Bull",
  "Nescafé",
  "Oatside",
  "Yakult",
  "Vitagen",
  "Gardenia",
  "Sunshine Bakeries",
  "Massimo",
  // ── Chocolate, sweets & snacks (gelatine / alcohol / emulsifier questions) ──
  "Cadbury",
  "Toblerone",
  "M&M's",
  "Snickers",
  "Twix",
  "Kinder Bueno",
  "Skittles",
  "Starburst",
  "Mentos",
  "Chupa Chups",
  "Ricola",
  "Fisherman's Friend",
  "Werther's Original",
  "Pocky",
  "Hello Panda",
  "Yan Yan",
  "Want Want",
  "Calbee",
  "Jack 'n Jill",
  "Meiji",
];

/** Uncovered queue entries, in curated order. `excludeSlugs` should contain
 * every slug already covered (file brands, aliases, and all halal_verdicts
 * rows regardless of status, so rejected drafts are not endlessly redrafted). */
export function queueCandidates(excludeSlugs: Set<string>): { name: string; slug: string }[] {
  const seen = new Set<string>();
  const out: { name: string; slug: string }[] = [];
  for (const name of VERDICT_QUEUE) {
    const slug = verdictSlug(name);
    if (!slug || seen.has(slug) || excludeSlugs.has(slug)) continue;
    seen.add(slug);
    out.push({ name, slug });
  }
  return out;
}
