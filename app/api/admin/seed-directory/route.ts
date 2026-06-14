import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { listings } from "@/lib/data";
import type { BadgeKey } from "@/lib/types";

/* One-time (re-runnable) seed: upsert the mock directory into Supabase
   `businesses` with slugs that MATCH what the live site renders
   (l.slug = slugify(name)). This is the keystone that lets owner analytics
   (slug→slug join, 0013) and reviews (slug→business_id) attach to real rows —
   without changing how the directory renders. Admin-only; upserts on slug so
   re-running is safe. POST to run. */
export const dynamic = "force-dynamic";

function tierFromBadges(badges: BadgeKey[]): string {
  if (badges.includes("muis")) return "muis";
  if (badges.includes("admin")) return "admin";
  if (badges.includes("pending")) return "pending";
  if (badges.includes("nopork") || badges.includes("friendly")) return "declared";
  return "community";
}

export async function POST() {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });

  const { getSupabaseAdmin } = await import("@/lib/supabase/server");
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ ok: false, error: "service_not_configured" }, { status: 503 });

  const rows = listings.map((l) => {
    const attrs = new Set((l.tags || []).map((t) => t.toLowerCase()));
    if (l.badges.includes("owned")) attrs.add("muslim-owned");
    if (l.prayer) attrs.add("prayer-space");
    if (l.badges.includes("family")) attrs.add("family-friendly");
    if (l.delivery) attrs.add("delivery");
    return {
      slug: l.slug || l.id,
      name: l.name,
      area: l.area,
      cat_id: l.catId,
      subcategory_id: l.cuisine,
      price_level: l.price,
      description: l.blurb,
      featured: l.featured,
      website: l.web || null,
      phone: l.phone || null,
      status: "published",
      halal_tier: tierFromBadges(l.badges),
      attributes: [...attrs],
      socials: { whatsapp: l.wa || "", instagram: l.ig || "" },
      lat: l.coords?.lat ?? null,
      lng: l.coords?.lng ?? null,
      source: "seed",
    };
  });

  const { error, count } = await sb
    .from("businesses")
    .upsert(rows, { onConflict: "slug", count: "exact" });

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, upserted: count ?? rows.length });
}
