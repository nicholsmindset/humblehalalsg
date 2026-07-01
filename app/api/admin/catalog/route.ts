import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { slugify } from "@/lib/slug";
import { categories as staticCategories, areas as staticAreas } from "@/lib/data";

/* Admin taxonomy management — directory categories & areas (0038).
   All routes are requireAdmin-gated and write with the service role (RLS on
   directory_categories / directory_areas allows no public write). These rows
   overlay the static seed via lib/catalog.ts:
     GET    → { categories:[...rows], areas:[...rows] }  (all rows, incl. inactive)
     POST   { kind:'category'|'area', ...fields }        → insert (id slugified from label/name)
     PATCH  { kind, id, ...fields }                      → update label/name/icon/tone/sort/active
     DELETE { kind, id }                                 → soft delete (active=false)

   PATCH/DELETE UPSERT (not update) so an admin can override/hide a STATIC-seed id
   that has no DB row yet. Because label/name are NOT NULL, we seed those required
   columns from the static defaults when creating the row. */

const TABLE = { category: "directory_categories", area: "directory_areas" } as const;
type Kind = keyof typeof TABLE;

const isKind = (v: unknown): v is Kind => v === "category" || v === "area";
const str = (v: unknown) => (v == null ? "" : String(v).trim());

// Required-column defaults for an upsert that may be creating a brand-new row
// for a static-seed id (label/name NOT NULL). Falls back to the id itself.
function requiredDefaults(kind: Kind, id: string): Record<string, unknown> {
  if (kind === "category") {
    const s = staticCategories.find((c) => c.id === id);
    return { label: s?.label || id, icon: s?.icon || "store" };
  }
  const s = staticAreas.find((a) => a.id === id);
  return { name: s?.name || id, tone: s?.tone || "emerald" };
}

export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });

  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: false, error: "service_unavailable" }, { status: 503 });

  try {
    const [cats, areas] = await Promise.all([
      db.from("directory_categories").select("*").order("sort", { ascending: true }),
      db.from("directory_areas").select("*").order("sort", { ascending: true }),
    ]);
    if (cats.error || areas.error) return NextResponse.json({ ok: false, error: "read_failed" }, { status: 502 });
    return NextResponse.json({ ok: true, categories: cats.data ?? [], areas: areas.data ?? [] });
  } catch {
    return NextResponse.json({ ok: false, error: "read_failed" }, { status: 502 });
  }
}

export async function POST(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 }); }

  const kind = body.kind;
  if (!isKind(kind)) return NextResponse.json({ ok: false, error: "invalid_kind" }, { status: 422 });

  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: false, error: "service_unavailable" }, { status: 503 });

  const sortRaw = Number(body.sort);
  const sort = Number.isFinite(sortRaw) ? Math.trunc(sortRaw) : 100;

  let row: Record<string, unknown>;
  if (kind === "category") {
    const label = str(body.label);
    if (!label) return NextResponse.json({ ok: false, error: "missing_label" }, { status: 422 });
    const id = str(body.id) || slugify(label);
    if (!id) return NextResponse.json({ ok: false, error: "invalid_id" }, { status: 422 });
    row = { id, label, icon: str(body.icon) || "store", sort, active: true };
  } else {
    const name = str(body.name);
    if (!name) return NextResponse.json({ ok: false, error: "missing_name" }, { status: 422 });
    const id = str(body.id) || slugify(name);
    if (!id) return NextResponse.json({ ok: false, error: "invalid_id" }, { status: 422 });
    row = { id, name, tone: str(body.tone) || "emerald", sort, active: true };
  }

  try {
    const { data, error } = await db.from(TABLE[kind]).insert(row).select("*").single();
    if (error) {
      const dup = error.code === "23505";
      return NextResponse.json({ ok: false, error: dup ? "duplicate_id" : "insert_failed" }, { status: dup ? 409 : 502 });
    }
    await audit(db, gate.userId, `Add ${kind}`, str(row.id), row);
    return NextResponse.json({ ok: true, kind, row: data });
  } catch {
    return NextResponse.json({ ok: false, error: "insert_failed" }, { status: 502 });
  }
}

export async function PATCH(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 }); }

  const kind = body.kind;
  if (!isKind(kind)) return NextResponse.json({ ok: false, error: "invalid_kind" }, { status: 422 });
  const id = str(body.id);
  if (!id) return NextResponse.json({ ok: false, error: "missing_id" }, { status: 422 });

  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: false, error: "service_unavailable" }, { status: 503 });

  // Only accept the editable fields; ignore id changes (id is the stable key).
  const patch: Record<string, unknown> = {};
  if (kind === "category") {
    if (body.label !== undefined) patch.label = str(body.label);
    if (body.icon !== undefined) patch.icon = str(body.icon);
  } else {
    if (body.name !== undefined) patch.name = str(body.name);
    if (body.tone !== undefined) patch.tone = str(body.tone);
  }
  if (body.sort !== undefined) {
    const s = Number(body.sort);
    if (Number.isFinite(s)) patch.sort = Math.trunc(s);
  }
  if (body.active !== undefined) patch.active = !!body.active;

  if (Object.keys(patch).length === 0) return NextResponse.json({ ok: false, error: "no_fields" }, { status: 422 });

  try {
    // Upsert so an admin can override a static id that has no DB row yet.
    // Seed required NOT NULL columns from the static default (patch wins).
    const upsertRow = { ...requiredDefaults(kind, id), id, active: true, ...patch };
    const { data, error } = await db.from(TABLE[kind]).upsert(upsertRow).select("*").single();
    if (error) return NextResponse.json({ ok: false, error: "update_failed" }, { status: 502 });
    await audit(db, gate.userId, `Update ${kind}`, id, patch);
    return NextResponse.json({ ok: true, kind, row: data });
  } catch {
    return NextResponse.json({ ok: false, error: "update_failed" }, { status: 502 });
  }
}

export async function DELETE(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 }); }

  const kind = body.kind;
  if (!isKind(kind)) return NextResponse.json({ ok: false, error: "invalid_kind" }, { status: 422 });
  const id = str(body.id);
  if (!id) return NextResponse.json({ ok: false, error: "missing_id" }, { status: 422 });

  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: false, error: "service_unavailable" }, { status: 503 });

  try {
    // Soft delete — upsert active=false so even a static-seed id (no row yet)
    // becomes hidden from the merged browse lists. Seed required columns.
    const upsertRow = { ...requiredDefaults(kind, id), id, active: false };
    const { data, error } = await db.from(TABLE[kind]).upsert(upsertRow).select("*").single();
    if (error) return NextResponse.json({ ok: false, error: "delete_failed" }, { status: 502 });
    await audit(db, gate.userId, `Hide ${kind}`, id, { active: false });
    return NextResponse.json({ ok: true, kind, row: data });
  } catch {
    return NextResponse.json({ ok: false, error: "delete_failed" }, { status: 502 });
  }
}

async function audit(
  db: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
  actor: string,
  action: string,
  target: string,
  meta: Record<string, unknown>,
) {
  try {
    await db.from("audit_log").insert({ actor, action, target, meta });
  } catch {
    /* audit is best-effort */
  }
}
