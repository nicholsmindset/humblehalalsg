/* Humble Halal — directory taxonomy (categories + areas) source.
   MERGES the static seed (HHData.categories / HHData.areas in lib/data.ts) with
   admin-editable rows in Supabase (directory_categories / directory_areas, 0038):
     • a DB row OVERRIDES the matching static id (label/icon/tone/sort)
     • a DB row with a NEW id is APPENDED
     • a row flipped active=false HIDES that id (static or new) from browse
   When Supabase isn't configured, or the tables are empty/missing, the static
   seed is returned verbatim — so nothing changes until an admin edits something.
   Server-only. */
import "server-only";
import { cache } from "react";
import { categories as staticCategories, areas as staticAreas } from "./data";
import type { Category, Area } from "./types";
import { supabaseConfigured, getSupabaseAdmin } from "./supabase/server";

type Row = Record<string, unknown>;
const str = (v: unknown) => (v == null ? "" : String(v));
const num = (v: unknown, d = 0) => (typeof v === "number" ? v : Number(v) || d);
const unsplash = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=75`;

const AREA_IMAGE_FALLBACKS: Record<string, string> = {
  "kampong-glam": unsplash("1555921015-5532091f6026"),
  "arab-street": unsplash("1555921015-5532091f6026"),
  bugis: unsplash("1565967511849-76a60a516170"),
  tampines: unsplash("1555921015-5532091f6026"),
  "race-course-road": unsplash("1565967511849-76a60a516170"),
  geylang: unsplash("1565967511849-76a60a516170"),
  "geylang-serai": unsplash("1565967511849-76a60a516170"),
  islandwide: unsplash("1518684079-3c830dcef090"),
  "tanjong-pagar": unsplash("1518684079-3c830dcef090"),
  bedok: unsplash("1555921015-5532091f6026"),
  jurong: unsplash("1414235077428-338989a2e8c0"),
  "paya-lebar": unsplash("1565967511849-76a60a516170"),
};

const areaImageFor = (id: string, name: string, existing?: string) => {
  if (existing) return existing;
  const key = (id || name).trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const nameKey = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return AREA_IMAGE_FALLBACKS[key] || AREA_IMAGE_FALLBACKS[nameKey] || AREA_IMAGE_FALLBACKS.islandwide;
};

// Static sort baseline: preserve authored order so untouched items stay put.
const catOrder = new Map(staticCategories.map((c, i) => [c.id, i]));
const areaOrder = new Map(staticAreas.map((a, i) => [a.id, i]));

/** Categories = static seed overlaid with admin edits. */
export const getCategories = cache(async (): Promise<Category[]> => {
  const rows = await fetchRows("directory_categories");
  if (!rows) return staticCategories;

  const overrides = new Map<string, Row>();
  const inactive = new Set<string>();
  for (const r of rows) {
    const id = str(r.id);
    if (!id) continue;
    if (r.active === false) { inactive.add(id); continue; }
    overrides.set(id, r);
  }

  // Static items (unless hidden), with overrides applied in place.
  const merged: Array<Category & { _sort: number }> = [];
  for (const c of staticCategories) {
    if (inactive.has(c.id)) continue;
    const o = overrides.get(c.id);
    merged.push({
      id: c.id,
      label: o ? str(o.label) || c.label : c.label,
      icon: o ? str(o.icon) || c.icon : c.icon,
      _sort: o && o.sort != null ? num(o.sort, 100) : (catOrder.get(c.id) ?? 100),
    });
    overrides.delete(c.id); // consumed
  }
  // Brand-new admin categories (ids not in the static seed).
  for (const o of overrides.values()) {
    merged.push({
      id: str(o.id),
      label: str(o.label) || str(o.id),
      icon: str(o.icon) || "store",
      _sort: num(o.sort, 100),
    });
  }
  merged.sort((a, b) => a._sort - b._sort);
  return merged.map(({ _sort, ...c }) => c);
});

/** Areas = static seed overlaid with admin edits. Static keeps its imagery/count/
 *  coords; overrides can change name/tone (and re-sort). */
export const getAreas = cache(async (): Promise<Area[]> => {
  const rows = await fetchRows("directory_areas");
  if (!rows) return staticAreas;

  const overrides = new Map<string, Row>();
  const inactive = new Set<string>();
  for (const r of rows) {
    const id = str(r.id);
    if (!id) continue;
    if (r.active === false) { inactive.add(id); continue; }
    overrides.set(id, r);
  }

  const merged: Array<Area & { _sort: number }> = [];
  for (const a of staticAreas) {
    if (inactive.has(a.id)) continue;
    const o = overrides.get(a.id);
    const name = o ? str(o.name) || a.name : a.name;
    merged.push({
      ...a,
      name,
      tone: o ? str(o.tone) || a.tone : a.tone,
      image: areaImageFor(a.id, name, a.image),
      _sort: o && o.sort != null ? num(o.sort, 100) : (areaOrder.get(a.id) ?? 100),
    });
    overrides.delete(a.id);
  }
  for (const o of overrides.values()) {
    const id = str(o.id);
    const name = str(o.name) || id;
    merged.push({
      id,
      name,
      count: 0,
      tone: str(o.tone) || "emerald",
      image: areaImageFor(id, name),
      _sort: num(o.sort, 100),
    });
  }
  merged.sort((a, b) => a._sort - b._sort);
  return merged.map(({ _sort, ...a }) => a);
});

/** Read all rows (incl. inactive) with the service-role client so the merge can
 *  honour active=false. Returns null when the backend isn't wired or the table
 *  is missing/empty → callers fall back to the static seed. */
async function fetchRows(table: "directory_categories" | "directory_areas"): Promise<Row[] | null> {
  if (!supabaseConfigured) return null;
  try {
    const sb = getSupabaseAdmin();
    if (!sb) return null;
    const { data, error } = await sb.from(table).select("*").limit(2000);
    if (error || !data || data.length === 0) return null;
    return data as Row[];
  } catch {
    return null;
  }
}