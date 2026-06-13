"use client";

import { createContext, useContext, useMemo } from "react";
import { listings as mockListings } from "@/lib/data";
import type { Listing } from "@/lib/types";

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

// Default value = the mock seed, so screens work even outside a provider.
const mockValue = build(mockListings);
const DirectoryContext = createContext<DirectoryValue>(mockValue);

export function DirectoryProvider({ listings, children }: { listings?: Listing[]; children: React.ReactNode }) {
  const value = useMemo(() => (listings && listings.length ? build(listings) : mockValue), [listings]);
  return <DirectoryContext.Provider value={value}>{children}</DirectoryContext.Provider>;
}

export function useDirectory(): DirectoryValue {
  return useContext(DirectoryContext);
}
