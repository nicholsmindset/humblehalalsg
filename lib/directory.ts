/* Humble Halal — directory data source. Single seam between the mock seed data
   (lib/data.ts) and Supabase `businesses`. Returns the existing `Listing` shape
   so every screen works unchanged. Falls back to the mock whenever Supabase is
   not configured OR returns no published rows (so the site is never empty during
   early seeding). Server-only. */
import "server-only";
import { listings as mockListings, categories } from "./data";
import type { Listing, BadgeKey } from "./types";
import type { WeekHours } from "./hours";
import { slugify } from "./slug";
import { supabaseConfigured, getSupabaseAdmin } from "./supabase/server";

const catLabel = (id: string) => categories.find((c) => c.id === id)?.label || "Muslim-Owned";

type Row = Record<string, unknown>;
const str = (v: unknown) => (v == null ? "" : String(v));
const num = (v: unknown, d = 0) => (typeof v === "number" ? v : Number(v) || d);

/** Map a Supabase `businesses` row → the app's Listing shape. Best-effort:
 *  unknown/missing columns degrade gracefully. Refine to match your seed. */
export function rowToListing(r: Row): Listing {
  const catId = str(r.cat_id || r.category_id) || "restaurants";
  const tags: string[] = Array.isArray(r.attributes) ? (r.attributes as string[]) : [];
  const tier = str(r.halal_tier);
  const badges: BadgeKey[] = [];
  if (tier === "muis") badges.push("muis");
  else if (tier === "admin") badges.push("admin");
  if (tags.some((t) => /owned|muslim/i.test(t))) badges.push("owned");
  if (tags.some((t) => /family/i.test(t))) badges.push("family");
  if (badges.length === 0) badges.push("friendly");

  const photos = Array.isArray(r.photos) ? (r.photos as { url?: string }[]) : [];
  const oh = Array.isArray(r.opening_hours) ? (r.opening_hours as { open?: string; close?: string }[]) : [];
  const hoursWeek: WeekHours | undefined =
    oh.length === 7 ? oh.map((d) => (d?.open && d?.close ? { open: d.open, close: d.close } : null)) : undefined;
  const socials = (r.socials && typeof r.socials === "object" ? r.socials : {}) as Record<string, string>;
  const certified = tier === "muis" || tier === "admin";

  return {
    id: str(r.id),
    slug: str(r.slug) || slugify(str(r.name)),
    name: str(r.name),
    cat: catLabel(catId),
    catId,
    cuisine: str(r.cuisine || r.subcategory_id),
    area: str(r.area),
    price: str(r.price_level) || "$$",
    rating: num(r.rating, 4.5),
    reviews: num(r.review_count, 0),
    badges,
    blurb: str(r.description),
    img: "",
    tone: "emerald",
    open: true,
    distance: "",
    prayer: tags.some((t) => /prayer/i.test(t)),
    delivery: tags.some((t) => /delivery/i.test(t)),
    featured: !!r.featured,
    hours: "",
    phone: str(r.phone),
    wa: str(r.whatsapp || socials.whatsapp),
    ig: str(r.instagram || socials.instagram),
    web: str(r.website),
    address: str(r.address),
    tags,
    image: photos[0]?.url || undefined,
    coords: r.lat != null && r.lng != null ? { lat: num(r.lat), lng: num(r.lng) } : undefined,
    hoursWeek,
    certified,
    certBody: tier === "muis" ? "MUIS" : tier === "admin" ? "Humble Halal" : null,
    verify: {
      certNo: str(r.muis_cert_no) || null,
      verified: r.last_verified_at ? str(r.last_verified_at) : null,
      expires: r.muis_expiry ? str(r.muis_expiry) : null,
      confirms: num(r.confirm_count, 0),
      renewed: false,
    },
  };
}

/** Real review ratings keyed by slug (from v_business_ratings, 0013). Empty
 *  until businesses are seeded + reviews published. */
async function ratingsBySlug(
  sb: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
): Promise<Map<string, { rating: number; count: number }>> {
  const out = new Map<string, { rating: number; count: number }>();
  try {
    const { data } = await sb.from("v_business_ratings").select("*");
    for (const r of (data as Row[]) || []) {
      const slug = str(r.listing_slug);
      if (slug) out.set(slug, { rating: num(r.avg_rating), count: num(r.review_count) });
    }
  } catch {
    /* view missing (pre-0013) → no overlay */
  }
  return out;
}

/** All published listings — from Supabase when configured, else the mock seed.
 *  Real review ratings are overlaid by slug regardless of base source, so cards
 *  show live numbers as soon as reviews exist (mock rating is the fallback). */
export async function getDirectory(): Promise<Listing[]> {
  if (!supabaseConfigured) return mockListings;
  try {
    const sb = getSupabaseAdmin();
    if (!sb) return mockListings;
    const { data, error } = await sb.from("businesses").select("*").eq("status", "published").limit(2000);
    const fromDb = !error && data && data.length > 0;
    // Clone the mock array so the rating overlay never mutates shared module state.
    const base: Listing[] = fromDb ? (data as Row[]).map(rowToListing) : mockListings.map((l) => ({ ...l }));
    const ratings = await ratingsBySlug(sb);
    if (ratings.size) {
      for (const l of base) {
        const r = ratings.get(l.slug || "");
        if (r) { l.rating = r.rating; l.reviews = r.count; }
      }
    }
    return base;
  } catch {
    return mockListings;
  }
}

export async function getListingBySlug(slug: string): Promise<Listing | undefined> {
  const all = await getDirectory();
  return all.find((l) => l.slug === slug) || all.find((l) => l.id === slug);
}
