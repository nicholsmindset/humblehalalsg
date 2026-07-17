import "server-only";

import { createReader } from "@keystatic/core/reader";
import keystaticConfig from "../keystatic.config";
import { allBrands as legacyBrands, type BrandHalal, type HalalStatus } from "./halal-status";

/* "Is <brand> halal?" entries editable in Keystatic (content/brands/*.json).
   Mirrors lib/cms-blog.ts: a CMS entry with the same slug as a built-in brand
   OVERRIDES it, so the admin can correct a status or add a brand without a
   code change. Reads happen at build/ISR time on the server only. */

const reader = createReader(process.cwd(), keystaticConfig);

async function cmsBrands(): Promise<BrandHalal[]> {
  try {
    const entries = await reader.collections.brands.all();
    return entries.map(({ slug, entry }) => ({
      slug,
      brand: entry.brand,
      category: entry.category,
      status: entry.status as HalalStatus,
      answer: entry.answer,
      source: entry.source || "MUIS HalalSG register + publicly available information",
      lastChecked: entry.lastChecked,
      aliases: entry.aliases.length ? [...entry.aliases] : undefined,
    }));
  } catch {
    // content/brands may not exist yet, or the reader can't run (e.g. no fs) —
    // the built-in dataset stands on its own.
    return [];
  }
}

/** Built-in brands with CMS entries overriding by slug, sorted by brand name. */
export async function allBrandsMerged(): Promise<BrandHalal[]> {
  const merged = new Map(legacyBrands().map((b) => [b.slug, b]));
  for (const b of await cmsBrands()) merged.set(b.slug, b);
  return [...merged.values()].sort((a, b) => a.brand.localeCompare(b.brand));
}

/** Lookup by slug or alias against the merged dataset. */
export async function getBrandMerged(slug: string): Promise<BrandHalal | undefined> {
  const all = await allBrandsMerged();
  return all.find((b) => b.slug === slug) || all.find((b) => b.aliases?.includes(slug));
}

/** Same-category first, then the rest — over the merged dataset. */
export async function relatedBrandsMerged(b: BrandHalal, limit = 6): Promise<BrandHalal[]> {
  const all = await allBrandsMerged();
  const same = all.filter((x) => x.slug !== b.slug && x.category === b.category);
  const rest = all.filter((x) => x.slug !== b.slug && x.category !== b.category);
  return [...same, ...rest].slice(0, limit);
}
