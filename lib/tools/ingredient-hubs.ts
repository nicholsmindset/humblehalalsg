/* Category hubs for the ingredient checker (PHASE 6).

   Each hub is a derived grouping over the ingredient dataset — it does NOT add
   new categories to `AdditiveCategory`. A hub is only indexed/sitemapped when it
   has at least HUB_MIN_MEMBERS indexable ingredients, so we never publish an
   empty or thin hub. Membership is restricted to indexable ingredients so every
   link on a hub points to a real detail page. */
import {
  ADDITIVES, indexableIngredients, ingredientQualifies, type Additive,
} from "./ingredients";

/** Minimum indexable members before a hub is indexed + added to the sitemap. */
export const HUB_MIN_MEMBERS = 3;

export interface IngredientHub {
  slug: string;
  /** Card / H1 title. */
  title: string;
  /** <title> tag (keyword-first). */
  metaTitle: string;
  /** Meta description. */
  metaDescription: string;
  /** One-line lead under the H1. */
  intro: string;
  /** Longer explanatory paragraph shown on the hub. */
  about: string;
  /** Membership predicate over an additive. */
  match: (a: Additive) => boolean;
}

export const INGREDIENT_HUBS: IngredientHub[] = [
  {
    slug: "food-colourings",
    title: "Food colourings",
    metaTitle: "Halal Status of Food Colourings & Colour E-numbers",
    metaDescription:
      "Which food-colouring E-numbers are halal, doubtful or best avoided? Compare synthetic dyes and natural colours, from E102 to E129 and carmine (E120).",
    intro: "Halal status of common food-colouring E-numbers — synthetic dyes and natural colours.",
    about:
      "Food colourings add or restore colour to foods and drinks. Most synthetic colours (such as the azo dyes) are made industrially with no animal origin and are generally halal at ingredient level, while a few natural colours — most notably carmine (E120), made from insects — are widely treated as not halal. A colour being generally halal never makes the finished product halal-certified.",
    match: (a) => a.category === "Colour",
  },
  {
    slug: "emulsifiers",
    title: "Emulsifiers & stabilisers",
    metaTitle: "Halal Status of Emulsifiers & Stabiliser E-numbers",
    metaDescription:
      "Are emulsifier E-numbers like E471, lecithin (E322) and gelatine (E441) halal? See which are plant-based, which are source-dependent and how to verify.",
    intro: "Halal status of emulsifier and stabiliser E-numbers — including the source-dependent ones.",
    about:
      "Emulsifiers and stabilisers help fat and water blend and keep textures smooth. Many are source-dependent: the fatty acids in E471, for example, can be plant- or animal-derived, so they are treated as doubtful until the source is confirmed. Gelatine (E441) is animal-derived and needs a halal-certified or plant alternative. Always verify the finished product.",
    match: (a) => a.category === "Emulsifier & stabiliser",
  },
  {
    slug: "preservatives",
    title: "Preservatives",
    metaTitle: "Halal Status of Preservative E-numbers",
    metaDescription:
      "Are preservative E-numbers halal? Most are synthetic or mineral and generally halal — but curing salts used on meat depend on the meat being halal.",
    intro: "Halal status of preservative E-numbers used to keep food safe and fresh.",
    about:
      "Preservatives slow spoilage and protect against harmful bacteria. Most are synthetic or mineral and generally halal at ingredient level. The key caveat is context: curing salts such as sodium nitrite (E250) are halal in themselves but are used on meats — and the meat must itself be halal.",
    match: (a) => a.category === "Preservative",
  },
  {
    slug: "animal-derived",
    title: "Animal-derived ingredients",
    metaTitle: "Animal-Derived Food Additives & Their Halal Status",
    metaDescription:
      "Which food additives are animal- or insect-derived? See ingredients like gelatine (E441) and carmine (E120), why they are treated as not halal, and the alternatives.",
    intro: "Additives derived from animals or insects — and the halal alternatives.",
    about:
      "Some additives are made from animals or insects. These are treated as not halal unless they come from a halal-slaughtered animal or carry recognised halal certification — gelatine (E441) and carmine/cochineal (E120) are the best-known examples. Plant-based and microbial alternatives usually exist.",
    match: (a) => a.originType === "animal" || a.originType === "insect",
  },
  {
    slug: "source-dependent",
    title: "Source-dependent (doubtful) additives",
    metaTitle: "Source-Dependent (Mushbooh) Food Additives — Halal Status",
    metaDescription:
      "Doubtful (mushbooh) additives can be plant- or animal-derived. See ingredients like E471, lecithin (E322) and E631, and how to verify their source.",
    intro: "Additives whose halal status depends on their source — treated as doubtful until confirmed.",
    about:
      "Some additives can be made from either plant or animal sources, and the label rarely says which. In line with the encouragement to avoid the doubtful, these are treated as mushbooh (doubtful) until the source is confirmed — for example E471, lecithin (E322) and disodium inosinate (E631). Look for halal certification or ask the manufacturer.",
    match: (a) => a.status === "mushbooh" || a.originType === "variable",
  },
  {
    slug: "e-numbers",
    title: "E-numbers",
    metaTitle: "Halal E-Numbers List — Is This E-Number Halal?",
    metaDescription:
      "A halal E-numbers guide: look up common food-additive E-numbers, see whether each is halal, doubtful or best avoided, and how to verify products.",
    intro: "A guide to common food-additive E-numbers and their halal status.",
    about:
      "E-numbers are codes for food additives approved for use in many markets. Each has a common origin — synthetic, plant, mineral, microbial or animal — that determines its halal status at ingredient level. Use this hub to jump to the additives we have reviewed in detail.",
    match: (a) => !!a.code,
  },
];

export function getHub(slug: string): IngredientHub | undefined {
  return INGREDIENT_HUBS.find((h) => h.slug === slug);
}

/** Indexable ingredients belonging to a hub (so every link is a real page). */
export function hubMembers(hub: IngredientHub): Additive[] {
  return indexableIngredients().filter(hub.match);
}

/** A hub earns indexing + a sitemap entry only above the member threshold. */
export function hubQualifies(hub: IngredientHub): boolean {
  return hubMembers(hub).length >= HUB_MIN_MEMBERS;
}

/** All hubs that currently meet the threshold — used by the sitemap + index. */
export function indexableHubs(): IngredientHub[] {
  return INGREDIENT_HUBS.filter(hubQualifies);
}

/** Count of ALL matching additives (indexable or not) — for the hub index blurb. */
export function hubTotalCount(hub: IngredientHub): number {
  return ADDITIVES.filter((a) => a.code && hub.match(a) && ingredientQualifies(a)).length;
}
