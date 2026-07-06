/* Humble Halal — relevant 301 targets for gone content.
   When a business is suspended, an event finishes/cancels, or a post is
   unpublished, the route resolves a target here and issues a permanent redirect
   (permanentRedirect → 308) instead of a 404, so we keep the ranking/link equity
   Google already gave the URL. Targets are computed LIVE from the entity's own
   category/area; `redirects` (Supabase) is the durable backstop for hard-deletes
   and hand-authored redirects. Server-only (pulls the service-role client). */
import "server-only";
import { allSeoPages } from "@/lib/seo-pages";
import { eventSeoPageForArea, getEventSeoPage, eventSeoPath } from "@/lib/event-seo-pages";
import type { BlogCategorySlug } from "@/lib/blog-categories";
import { getSupabaseAdmin } from "@/lib/supabase/server";

/* Built once from the SEO page registry (no internal exports needed):
   area display-name → areaId, and the set of pages that actually exist. */
const areaNameToId = new Map<string, string>();
const seoSlugs = new Set<string>();
for (const p of allSeoPages()) {
  seoSlugs.add(p.slug);
  if (p.kind === "area" && p.areaId) {
    if (p.areaName) areaNameToId.set(p.areaName.toLowerCase(), p.areaId);
    for (const n of p.areaNames ?? []) areaNameToId.set(n.toLowerCase(), p.areaId);
  }
}

/** Most relevant /halal URL for a (possibly gone) business, by its category +
 *  free-text area. Tiers: cat×area → area → cat-singapore → the directory. */
export function businessRedirectTarget(catId?: string, area?: string): string {
  const areaId = area ? areaNameToId.get(area.trim().toLowerCase()) : undefined;
  const cat = catId?.trim() || undefined;
  const candidates: string[] = [];
  if (cat === "muslim-owned") {
    if (areaId) candidates.push(`muslim-owned-businesses-in-${areaId}`);
  } else if (cat) {
    if (areaId) candidates.push(`halal-${cat}-in-${areaId}`);
  }
  if (areaId) candidates.push(`halal-food-in-${areaId}`);
  if (cat && cat !== "muslim-owned") candidates.push(`halal-${cat}-singapore`);
  for (const s of candidates) if (seoSlugs.has(s)) return `/halal/${s}`;
  return "/halal";
}

/** Most relevant /events hub for a finished/cancelled event (category first,
 *  then area, then the events home). */
export function eventRedirectTarget(catId?: string, area?: string): string {
  if (catId) {
    const c = getEventSeoPage("category", catId);
    if (c) return eventSeoPath(c);
  }
  const a = eventSeoPageForArea(area);
  if (a) return eventSeoPath(a);
  return "/events";
}

/** A gone blog post 301s to its category hub. */
export function blogRedirectTarget(category: BlogCategorySlug): string {
  return `/blog/category/${category}`;
}

/** Best-effort upsert of a durable redirect row (service-role). Never throws —
 *  the live resolver still covers the entity even if this write fails. */
export async function recordRedirect(fromPath: string, toPath: string, kind: string): Promise<void> {
  const db = getSupabaseAdmin();
  if (!db || !fromPath || !toPath || fromPath === toPath) return;
  try {
    await db.from("redirects").upsert({ from_path: fromPath, to_path: toPath, kind }, { onConflict: "from_path" });
  } catch {
    /* durable row is best-effort */
  }
}

/** Remove a durable redirect (e.g. a suspended business is restored). */
export async function clearRedirect(fromPath: string): Promise<void> {
  const db = getSupabaseAdmin();
  if (!db) return;
  try {
    await db.from("redirects").delete().eq("from_path", fromPath);
  } catch {
    /* best-effort */
  }
}
