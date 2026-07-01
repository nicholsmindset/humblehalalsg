"use client";

import { createContext, useContext, useMemo } from "react";
import type { Listing, Category, Area } from "@/lib/types";
import { categories as staticCategories, areas as staticAreas } from "@/lib/data";

interface DirectoryValue {
  listings: Listing[];
  byId: Map<string, Listing>;
  bySlug: Map<string, Listing>;
  /** Resolve a listing by slug or id (mirrors the old getListing()). */
  get: (idOrSlug: string) => Listing | undefined;
}

function build(listings: Listing[]): DirectoryValue {
  const byId = new Map(listings.map((l) => [l.id, l]));
  const bySlug = new Map(listings.map((l) => [l.slug || "", l]));
  return { listings, byId, bySlug, get: (x) => bySlug.get(x) || byId.get(x) };
}

// Default value = EMPTY, so screens outside a provider show a clean empty state
// (never fabricated data). The DirectoryProvider is always fed real
// getDirectory() data in app/layout.tsx.
const emptyValue = build([]);
const DirectoryContext = createContext<DirectoryValue>(emptyValue);

// ── Catalog (merged categories + areas) ─────────────────────────────────────
// Server-merged (lib/catalog.ts: static seed overlaid with admin edits) and
// passed down alongside the directory. Falls back to the static seed so screens
// rendered outside the provider (or before it's fed) still work unchanged.
interface CatalogValue {
  categories: Category[];
  areas: Area[];
}
const staticCatalog: CatalogValue = { categories: staticCategories, areas: staticAreas };
const CatalogContext = createContext<CatalogValue>(staticCatalog);

export function DirectoryProvider({
  listings,
  categories,
  areas,
  children,
}: {
  listings?: Listing[];
  categories?: Category[];
  areas?: Area[];
  children: React.ReactNode;
}) {
  const value = useMemo(() => (listings && listings.length ? build(listings) : emptyValue), [listings]);
  const catalog = useMemo<CatalogValue>(
    () => ({
      categories: categories && categories.length ? categories : staticCategories,
      areas: areas && areas.length ? areas : staticAreas,
    }),
    [categories, areas],
  );
  return (
    <DirectoryContext.Provider value={value}>
      <CatalogContext.Provider value={catalog}>{children}</CatalogContext.Provider>
    </DirectoryContext.Provider>
  );
}

export function useDirectory(): DirectoryValue {
  return useContext(DirectoryContext);
}

/** Merged directory taxonomy (categories + areas). Use this instead of the raw
 *  HHData.categories / HHData.areas on browse surfaces so admin-added/edited
 *  categories and areas show up. */
export function useCatalog(): CatalogValue {
  return useContext(CatalogContext);
}
