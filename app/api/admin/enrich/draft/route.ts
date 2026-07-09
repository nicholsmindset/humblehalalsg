import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { getServerFlags } from "@/lib/feature-flags";
import { categories } from "@/lib/data";
import { EnrichmentSchema, ENRICH_SYSTEM_PROMPT, enrichUserPrompt } from "@/lib/listing-enrich";

/* Admin-triggered AI listing enrichment DRAFT. Rewrites the description + fills
   SEO for one existing business, inserting the result as status='pending'. It
   NEVER writes to the live listing — a human approves via /api/admin/enrich.
   Degrades gracefully when the gateway key or Supabase is absent. */
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!(await getServerFlags()).listingEnrichment) return NextResponse.json({ ok: false, error: "not_enabled" }, { status: 404 });
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });

  let businessId = "";
  try {
    const b = (await req.json()) as { businessId?: string };
    businessId = String(b.businessId || "").trim();
  } catch { return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 }); }
  if (!businessId) return NextResponse.json({ ok: false, error: "missing_business" }, { status: 422 });

  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: false, error: "service_not_configured" }, { status: 503 });

  const { data: biz } = await db
    .from("businesses")
    .select("id, slug, name, cat_id, area, price_level, halal_tier, attributes, description")
    .eq("id", businessId)
    .maybeSingle();
  if (!biz) return NextResponse.json({ ok: false, error: "business_not_found" }, { status: 404 });

  const { aiObject, aiConfigured, AI_MODEL_FAST } = await import("@/lib/ai");
  if (!aiConfigured) return NextResponse.json({ ok: false, error: "ai_not_configured" }, { status: 503 });

  const category = categories.find((c) => c.id === biz.cat_id)?.label || null;
  const source_input = {
    name: biz.name, category, area: biz.area || null, priceLevel: biz.price_level || null,
    halalTier: biz.halal_tier || null, attributes: (biz.attributes as string[]) || [],
    existingDescription: biz.description || null,
  };

  const generated = await aiObject(EnrichmentSchema, {
    model: AI_MODEL_FAST, // rewrite/SEO — the fast model is plenty and cheaper
    system: ENRICH_SYSTEM_PROMPT,
    prompt: enrichUserPrompt(source_input),
  });
  if (!generated) return NextResponse.json({ ok: false, error: "draft_failed" }, { status: 502 });

  // One pending draft per business — supersede any existing pending first.
  await db.from("listing_enrichments").update({ status: "rejected", review_note: "superseded by a newer draft" })
    .eq("business_id", businessId).eq("status", "pending");

  const { data, error } = await db.from("listing_enrichments").insert({
    business_id: businessId,
    business_slug: biz.slug || "",
    business_name: biz.name || "",
    generated,
    source_input,
    model: AI_MODEL_FAST,
    status: "pending",
    drafted_by: "ai",
  }).select("id").maybeSingle();
  if (error) return NextResponse.json({ ok: false, error: "insert_failed", detail: error.message }, { status: 502 });

  await logAudit(db, { actor: gate.userId, action: "Drafted listing enrichment (AI)", target: data?.id, meta: { businessId, slug: biz.slug } });
  return NextResponse.json({ ok: true, id: data?.id, generated });
}
