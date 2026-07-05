import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { revalidatePublic } from "@/lib/revalidate";
import { logAudit } from "@/lib/audit";
import { sanitizeAttributes } from "@/lib/attributes";
import { sanitizePhotos } from "@/lib/photos";

/* Admin listing management — the takedown/correction surface the moderation
   queues lacked (they only act on staging rows and reports; nothing could
   edit or remove an already-published business).

   - GET  ?all=1        → every business regardless of status (the admin list
                          must show suspended rows, which getDirectory filters)
   - GET  ?id=…         → one full row for the editor
   - PATCH {id, fields} → whitelisted field edit. Includes identity fields
                          (name/cat_id/area) the owner route deliberately
                          excludes. NEVER halal/trust fields — those stay
                          single-sourced in /api/admin/verify (lib/verify-grant)
                          — and never status/plan (suspend action / Stripe).
   - POST {id, action: suspend|restore, reason?} → reversible takedown via
                          status='suspended' (0002's enum; every public read
                          path already filters it). Audited with the reason.

   All writes use the service-role client — the 0029 guard trigger pins
   status/trust columns for RLS-bound roles, and service-role is exempt. */
export const dynamic = "force-dynamic";

// Owner-editable fields plus identity (name/category/area). Excludes
// halal_tier/muis_*/status/featured/plan by design — see header.
const ADMIN_EDITABLE = [
  "name", "cat_id", "area",
  "phone", "website", "address", "postal", "description", "price_level",
  "opening_hours", "socials", "photos", "attributes",
] as const;

// Admin edits aren't plan-capped like owner edits; use the top-tier cap.
const ADMIN_GALLERY_MAX = 30;

const LIST_COLS = "id, slug, name, cat_id, area, plan, status, halal_tier, featured, created_at";
const ROW_COLS = `${LIST_COLS}, phone, website, address, postal, description, price_level, opening_hours, socials, photos, attributes, owner_id, claimed_by`;

export async function GET(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: false, error: "service_not_configured" }, { status: 503 });

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (id) {
    const { data, error } = await db.from("businesses").select(ROW_COLS).eq("id", id).maybeSingle();
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    return NextResponse.json({ ok: true, business: data });
  }

  const { data, error } = await db
    .from("businesses")
    .select(LIST_COLS)
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, businesses: data ?? [] });
}

export async function PATCH(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: false, error: "service_not_configured" }, { status: 503 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const id = String(body.id || "");
  if (!id) return NextResponse.json({ ok: false, error: "missing_id" }, { status: 400 });

  const { data: row } = await db.from("businesses").select("id, slug, name").eq("id", id).maybeSingle();
  if (!row) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

  const patch: Record<string, unknown> = {};
  for (const k of ADMIN_EDITABLE) {
    if (!(k in body)) continue;
    if (k === "photos") { patch.photos = sanitizePhotos(body.photos, ADMIN_GALLERY_MAX); continue; }
    if (k === "attributes") { patch.attributes = sanitizeAttributes(body.attributes); continue; }
    if (k === "name") {
      const name = String(body.name ?? "").trim();
      if (!name) return NextResponse.json({ ok: false, error: "name_required" }, { status: 400 });
      patch.name = name.slice(0, 120);
      continue;
    }
    patch[k] = body[k] === "" ? null : body[k];
  }
  if (!Object.keys(patch).length) return NextResponse.json({ ok: false, error: "no_fields" }, { status: 400 });

  const { error } = await db.from("businesses").update(patch).eq("id", id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  await logAudit(db, {
    actor: gate.userId,
    action: "listing_admin_edit",
    target: id,
    meta: { slug: row.slug, fields: Object.keys(patch) },
  });
  revalidatePublic([`/business/${row.slug}`]);
  return NextResponse.json({ ok: true });
}

export async function POST(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: false, error: "service_not_configured" }, { status: 503 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const id = String(body.id || "");
  const action = String(body.action || "");
  const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 500) : "";
  if (!id || (action !== "suspend" && action !== "restore")) {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  const { data: row } = await db.from("businesses").select("id, slug, name, status").eq("id", id).maybeSingle();
  if (!row) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

  const nextStatus = action === "suspend" ? "suspended" : "published";
  if (row.status === nextStatus) return NextResponse.json({ ok: true, status: nextStatus, unchanged: true });

  const { error } = await db.from("businesses").update({ status: nextStatus }).eq("id", id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  await logAudit(db, {
    actor: gate.userId,
    action: action === "suspend" ? "listing_suspend" : "listing_restore",
    target: id,
    meta: { slug: row.slug, name: row.name, reason: reason || null },
  });
  // The listing disappears from (or returns to) every published surface.
  revalidatePublic([`/business/${row.slug}`, "/explore", "/halal"]);
  return NextResponse.json({ ok: true, status: nextStatus });
}
