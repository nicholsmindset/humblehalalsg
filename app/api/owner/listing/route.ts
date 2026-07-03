import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { revalidatePublic } from "@/lib/revalidate";
import { galleryMax } from "@/lib/plans";
import { sanitizeAttributes } from "@/lib/attributes";

/* Owner self-service listing editor. GET returns the editable fields for a
   business the caller owns; PATCH updates a whitelist of fields. Ownership is
   enforced server-side (owner_id OR claimed_by === Clerk userId) before any
   read/write — the service-role client is only used after that check. */
export const dynamic = "force-dynamic";

// Fields a claimed owner may edit. Excludes name/halal_tier/status/featured/plan
// (identity + trust + billing stay admin-controlled). `attributes` is vetted
// against the fixed amenity vocabulary (lib/attributes) — no free-form tags.
const EDITABLE = ["phone", "website", "address", "postal", "description", "price_level", "opening_hours", "socials", "photos", "attributes"] as const;

// Coerce an incoming `photos` value into the jsonb shape rowToListing reads:
// an array of { url, caption? } with string urls. Anything malformed is dropped.
// `max` is the caller's plan gallery limit (lib/plans galleryMax: 3/15/20/30).
function sanitizePhotos(v: unknown, max: number): { url: string; caption?: string }[] {
  if (!Array.isArray(v)) return [];
  const out: { url: string; caption?: string }[] = [];
  for (const p of v) {
    if (!p || typeof p !== "object") continue;
    const url = (p as { url?: unknown }).url;
    if (typeof url !== "string" || !url.trim()) continue;
    const caption = (p as { caption?: unknown }).caption;
    const entry: { url: string; caption?: string } = { url: url.trim() };
    if (typeof caption === "string" && caption.trim()) entry.caption = caption.trim().slice(0, 120);
    out.push(entry);
  }
  return out.slice(0, Math.max(1, max));
}

type Db = NonNullable<ReturnType<typeof getSupabaseAdmin>>;
async function ownership(db: Db, id: string, userId: string) {
  const { data } = await db.from("businesses").select("id, slug, owner_id, claimed_by, plan").eq("id", id).maybeSingle();
  if (!data) return { row: null as null, owns: false };
  return { row: data, owns: data.owner_id === userId || data.claimed_by === userId };
}

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: false, error: "service_not_configured" }, { status: 503 });

  const id = new URL(req.url).searchParams.get("id") || "";
  const { row, owns } = await ownership(db, id, userId);
  if (!row) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  if (!owns) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });

  const { data, error } = await db
    .from("businesses")
    .select("id, slug, name, area, cat_id, plan, phone, website, address, postal, description, price_level, opening_hours, socials, photos, attributes")
    .eq("id", id)
    .single();
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, business: data });
}

export async function PATCH(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: false, error: "service_not_configured" }, { status: 503 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const id = String(body.id || "");
  const { row, owns } = await ownership(db, id, userId);
  if (!row) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  if (!owns) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });

  const patch: Record<string, unknown> = {};
  for (const k of EDITABLE) {
    if (!(k in body)) continue;
    if (k === "photos") { patch.photos = sanitizePhotos(body.photos, galleryMax(row.plan)); continue; }
    if (k === "attributes") { patch.attributes = sanitizeAttributes(body.attributes); continue; }
    patch[k] = body[k] === "" ? null : body[k];
  }
  if (!Object.keys(patch).length) return NextResponse.json({ ok: false, error: "no_fields" }, { status: 400 });

  const { error } = await db.from("businesses").update(patch).eq("id", id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  revalidatePublic([`/business/${row.slug}`]);
  return NextResponse.json({ ok: true });
}
