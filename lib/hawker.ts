/* Humble Halal — Hawker Finder data seam. A hawker STALL is a `businesses` row
   (all trust/score/badge/map machinery reused via lib/directory); this module
   adds the thin `hawker_centres` entity + helpers to group stalls by centre.
   Server-only. Empty arrays when Supabase is unconfigured (clean empty states). */
import "server-only";
import { cache } from "react";
import { supabaseConfigured, getSupabaseAdmin } from "./supabase/server";
import { rowToListing } from "./directory";
import type { Listing } from "./types";

export interface HawkerCentre {
  id: string;               // slug
  name: string;
  address?: string;
  region?: string;
  lat?: number | null;
  lng?: number | null;
  nearestMrt?: string;
  hours?: string;
  blurb?: string;
  source?: string;
}

type Row = Record<string, unknown>;
const str = (v: unknown) => (v == null ? "" : String(v));
const numOrNull = (v: unknown) => (typeof v === "number" ? v : v == null ? null : Number(v) || null);

function rowToCentre(r: Row): HawkerCentre {
  return {
    id: str(r.id),
    name: str(r.name),
    address: str(r.address) || undefined,
    region: str(r.region) || undefined,
    lat: numOrNull(r.lat),
    lng: numOrNull(r.lng),
    nearestMrt: str(r.nearest_mrt) || undefined,
    hours: str(r.hours) || undefined,
    blurb: str(r.blurb) || undefined,
    source: str(r.source) || undefined,
  };
}

/** All hawker centres, region-then-name ordered. Memoized per request. */
export const getHawkerCentres = cache(async (): Promise<HawkerCentre[]> => {
  if (!supabaseConfigured) return [];
  try {
    const sb = getSupabaseAdmin();
    if (!sb) return [];
    const { data, error } = await sb.from("hawker_centres").select("*").order("region", { ascending: true }).order("name", { ascending: true });
    if (error || !data) return [];
    return (data as Row[]).map(rowToCentre);
  } catch { return []; }
});

export async function getHawkerCentre(slug: string): Promise<HawkerCentre | null> {
  return (await getHawkerCentres()).find((c) => c.id === slug) || null;
}

/** Published stalls for a centre, as the standard Listing shape (reuses rowToListing). */
export async function getStallsForCentre(centreId: string): Promise<Listing[]> {
  if (!supabaseConfigured) return [];
  try {
    const sb = getSupabaseAdmin();
    if (!sb) return [];
    const { data, error } = await sb
      .from("businesses")
      .select("*")
      .eq("hawker_centre_id", centreId)
      .eq("status", "published")
      .limit(200);
    if (error || !data) return [];
    return (data as Row[]).map(rowToListing);
  } catch { return []; }
}

/** Count of published stalls per centre id (for the finder list). One query. */
export async function getStallCounts(): Promise<Record<string, number>> {
  if (!supabaseConfigured) return {};
  try {
    const sb = getSupabaseAdmin();
    if (!sb) return {};
    const { data } = await sb.from("businesses").select("hawker_centre_id").eq("status", "published").not("hawker_centre_id", "is", null).limit(5000);
    const out: Record<string, number> = {};
    for (const r of (data as Row[]) || []) { const id = str(r.hawker_centre_id); if (id) out[id] = (out[id] || 0) + 1; }
    return out;
  } catch { return {}; }
}

// Region grouping for the /hawker finder (mirrors PRAYER_CATEGORIES).
export const HAWKER_REGIONS: { id: string; label: string; blurb: string }[] = [
  { id: "Central", label: "Central", blurb: "City-fringe and central hawker centres." },
  { id: "East", label: "East", blurb: "Halal-dense centres out east." },
  { id: "North-East", label: "North-East", blurb: "Serangoon, Hougang and around." },
  { id: "North", label: "North", blurb: "Woodlands, Yishun and the north." },
  { id: "West", label: "West", blurb: "Jurong, Clementi and the west." },
];

export function centresByRegion(centres: HawkerCentre[], region: string): HawkerCentre[] {
  return centres.filter((c) => (c.region || "Other") === region);
}
