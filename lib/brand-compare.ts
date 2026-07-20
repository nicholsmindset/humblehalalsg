/* Humble Halal — curated "X vs Y: which is halal?" comparison pairs.

   ACCURACY POLICY (same as lib/halal-status.ts — read before editing):
   - Pairs are HAND-CURATED, same-category only, and both sides must exist in
     the merged brand dataset (lib/cms-brands.ts) or the pair silently drops.
     The curation list IS the indexation gate — never generate a cartesian
     product of brands.
   - The comparative summary is derived from the two statuses; it never asserts
     more than each brand's own checked status does, and every page points to
     the MUIS HalalSG register. */

import { STATUS_META, type BrandHalal } from "./halal-status";
import { allBrandsMerged } from "./cms-brands";

/* [primary, secondary] — primary first (the more-searched brand). Same
   category, and most pairs contrast a certified brand with an uncertified
   sibling, which is the comparison shoppers actually search for. */
const PAIRS: readonly [string, string][] = [
  // Bakeries
  ["breadtalk", "swee-heng"],
  ["breadtalk", "four-leaves"],
  ["four-leaves", "primadeli"],
  ["swee-heng", "primadeli"],
  ["polar-puffs-cakes", "four-leaves"],
  ["awfully-chocolate", "chocolate-origin"],
  // Bakery cafés
  ["paris-baguette", "delifrance"],
  ["paris-baguette", "tiong-bahru-bakery"],
  ["cedele", "paris-baguette"],
  // Fast food & burgers
  ["mcdonalds", "kfc"],
  ["burger-king", "mcdonalds"],
  ["mos-burger", "burger-king"],
  ["shake-shack", "mos-burger"],
  ["texas-chicken", "kfc"],
  ["popeyes", "texas-chicken"],
  ["jollibee", "popeyes"],
  ["4fingers", "chir-chir"],
  // Japanese
  ["yoshinoya", "sukiya"],
  ["genki-sushi", "sushiro"],
  ["sushi-tei", "sushi-express"],
  ["sushi-tei", "genki-sushi"],
  ["pepper-lunch", "yoshinoya"],
  // Bubble tea & coffee
  ["koi", "liho"],
  ["chagee", "koi"],
  ["starbucks", "coffee-bean"],
  ["tim-hortons", "starbucks"],
  ["luckin-coffee", "starbucks"],
  // Pizza & Italian
  ["pizza-hut", "dominos"],
  ["saizeriya", "pastamania"],
  // Western steakhouses
  ["astons", "andes-by-astons"],
  ["collins", "el-fuego"],
  ["jacks-place", "astons"],
  // Hotpot & BBQ
  ["haidilao", "beauty-in-the-pot"],
  ["seoul-garden", "haidilao"],
  // Kopitiam
  ["toast-box", "fun-toast"],
  ["killiney-kopitiam", "toast-box"],
];

export interface ComparePair {
  pairSlug: string;
  a: BrandHalal;
  b: BrandHalal;
}

export function comparePairSlug(a: string, b: string): string {
  return `${a}-vs-${b}`;
}

/** All resolvable pairs — one merged-dataset read for the whole list. A pair
 * with a missing side (e.g. a renamed slug) drops silently, so no dead
 * comparison page can ever ship. */
export async function allComparePairs(): Promise<ComparePair[]> {
  const bySlug = new Map((await allBrandsMerged()).map((b) => [b.slug, b]));
  const out: ComparePair[] = [];
  for (const [sa, sb] of PAIRS) {
    const a = bySlug.get(sa);
    const b = bySlug.get(sb);
    if (a && b) out.push({ pairSlug: comparePairSlug(sa, sb), a, b });
  }
  return out;
}

/** Lookup one pair by its pair slug ("breadtalk-vs-swee-heng"). */
export async function getComparePair(pairSlug: string): Promise<ComparePair | null> {
  const pairs = await allComparePairs();
  return pairs.find((p) => p.pairSlug === pairSlug) ?? null;
}

const isCertified = (b: BrandHalal) => b.status === "certified";

/** Deterministic comparative answer (the featured-snippet unit). Derived
 * strictly from the two checked statuses — never asserts beyond them. */
export function compareSummary(a: BrandHalal, b: BrandHalal): string {
  const la = STATUS_META[a.status].label;
  const lb = STATUS_META[b.status].label;
  const remind = "Certification is per-premises and can change — always confirm the specific outlet on the official MUIS HalalSG register.";
  if (isCertified(a) && isCertified(b)) {
    return `Both ${a.brand} and ${b.brand} are MUIS halal-certified in Singapore, so both are suitable for halal-conscious diners. ${remind}`;
  }
  if (isCertified(a) !== isCertified(b)) {
    const yes = isCertified(a) ? a : b;
    const no = isCertified(a) ? b : a;
    const noLabel = STATUS_META[no.status].label;
    return `${yes.brand} is MUIS halal-certified in Singapore; ${no.brand} is not — its status is “${noLabel}”. For certified assurance, choose ${yes.brand}. ${remind}`;
  }
  return `Neither ${a.brand} (${la}) nor ${b.brand} (${lb}) is fully MUIS halal-certified in Singapore. Check each answer below for what that means in practice, and see the certified alternatives we list. ${remind}`;
}
