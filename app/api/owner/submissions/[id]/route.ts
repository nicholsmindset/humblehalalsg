import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

const TEXT_FIELDS = ["desc", "phone", "whatsapp", "cat", "address", "region", "town", "postal", "halal", "certNo"] as const;
const clean = (value: unknown, max = 2000) => String(value ?? "").trim().slice(0, max);
const photos = (value: unknown) => Array.isArray(value)
  ? value.map((item) => typeof item === "string" ? item : (item && typeof item === "object" ? (item as { url?: unknown }).url : ""))
    .filter((url): url is string => typeof url === "string" && /^https?:\/\//.test(url)).slice(0, 6).map((url) => ({ url }))
  : [];

async function access(id: string) {
  const { userId } = await auth();
  if (!userId) return { response: NextResponse.json({ ok: false, reason: "unauthenticated" }, { status: 401 }) };
  const db = getSupabaseAdmin();
  if (!db) return { response: NextResponse.json({ ok: false, reason: "not_configured" }, { status: 503 }) };
  const { data: row } = await db.from("staging_businesses").select("*").eq("id", id).maybeSingle();
  if (!row) return { response: NextResponse.json({ ok: false, reason: "not_found" }, { status: 404 }) };
  const raw = (row.raw && typeof row.raw === "object" ? row.raw : {}) as Record<string, unknown>;
  const { data: profile } = await db.from("profiles").select("role").eq("id", userId).maybeSingle();
  const isAdmin = profile?.role === "admin";
  const submittedBy = String(row.submitted_by || raw.submitted_by || "");
  if (!isAdmin && submittedBy !== userId) return { response: NextResponse.json({ ok: false, reason: "forbidden" }, { status: 403 }) };
  if (!["new", "reviewing"].includes(String(row.review_status))) {
    return { response: NextResponse.json({ ok: false, reason: "not_editable" }, { status: 409 }) };
  }
  return { db, row, raw, userId, isAdmin };
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await access(id);
  if (a.response) return a.response;
  const { row, raw, isAdmin } = a;
  return NextResponse.json({
    ok: true,
    submission: {
      id: row.id, name: row.name || "", desc: raw.desc || raw.description || "", phone: raw.phone || "",
      whatsapp: raw.whatsapp || "", cat: row.category_suggested || raw.cat || "", address: row.address || raw.address || "",
      region: raw.region || "", town: raw.town || "", postal: row.postal || raw.postal || "", halal: raw.halal || "",
      certNo: raw.certNo || "", photoUrls: photos(raw.photos).map((p) => p.url), reviewStatus: row.review_status,
    },
    canModerate: isAdmin,
  });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await access(id);
  if (a.response) return a.response;
  const { db, row, raw, userId, isAdmin } = a;
  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ ok: false, reason: "bad_request" }, { status: 400 });

  const nextRaw: Record<string, unknown> = { ...raw };
  for (const field of TEXT_FIELDS) if (field in body) nextRaw[field] = clean(body[field], field === "desc" ? 2000 : 300);
  if ("photoUrls" in body || "photos" in body) nextRaw.photos = photos(body.photoUrls ?? body.photos);
  if ("lat" in body && Number.isFinite(Number(body.lat))) nextRaw.lat = Number(body.lat);
  if ("lng" in body && Number.isFinite(Number(body.lng))) nextRaw.lng = Number(body.lng);

  const name = clean(body.name ?? row.name, 160);
  if (name.length < 2) return NextResponse.json({ ok: false, reason: "name_required" }, { status: 422 });
  const patch = {
    name,
    address: clean(body.address ?? row.address, 300) || null,
    postal: clean(body.postal ?? row.postal, 20) || null,
    category_suggested: clean(body.cat ?? row.category_suggested, 100) || null,
    lat: Number.isFinite(Number(body.lat ?? row.lat)) ? Number(body.lat ?? row.lat) : null,
    lng: Number.isFinite(Number(body.lng ?? row.lng)) ? Number(body.lng ?? row.lng) : null,
    raw: nextRaw,
    review_status: "reviewing",
  };
  const { error } = await db.from("staging_businesses").update(patch).eq("id", id);
  if (error) return NextResponse.json({ ok: false, reason: "update_failed" }, { status: 500 });
  await logAudit(db, { actor: userId, action: isAdmin ? "Admin edited pending listing" : "Owner edited pending listing", target: id, meta: { fields: Object.keys(body) } });
  return NextResponse.json({ ok: true, status: "reviewing" });
}
