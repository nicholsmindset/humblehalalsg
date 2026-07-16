import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { sniffAllowed, extForType } from "@/lib/file-sniff";
import { createHash } from "crypto";
import sharp from "sharp";

/* Admin listing-photo upload → the same public "business-photos" bucket the
   owner upload uses (app/api/owner/photos), minus the ownership check and the
   moderation row — admin uploads are trusted. Returns the public URL; the
   caller adds it to the listing's photos via PATCH /api/admin/listing. */
const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const BUCKET = "business-photos";

export async function POST(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: false, error: "service_not_configured" }, { status: 503 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ ok: false, error: "missing_file" }, { status: 400 });
  if (!ALLOWED.includes(file.type)) return NextResponse.json({ ok: false, error: "bad_type" }, { status: 422 });
  if (file.size > MAX_BYTES) return NextResponse.json({ ok: false, error: "too_large" }, { status: 413 });

  try { await db.storage.createBucket(BUCKET, { public: true }); } catch { /* exists */ }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const sniffed = sniffAllowed(bytes, ALLOWED);
  if (!sniffed) return NextResponse.json({ ok: false, error: "bad_type" }, { status: 415 });
  let width: number | null = null, height: number | null = null;
  try { const meta = await sharp(bytes).metadata(); width = meta.width || null; height = meta.height || null; } catch { return NextResponse.json({ ok: false, error: "bad_type" }, { status: 415 }); }
  if (!width || !height || width < 800 || height < 600) return NextResponse.json({ ok: false, error: "too_small", width, height }, { status: 422 });
  const contentHash = createHash("sha256").update(bytes).digest("hex");
  const ext = extForType(sniffed);
  const path = `admin/${crypto.randomUUID()}.${ext}`;
  const { error } = await db.storage.from(BUCKET).upload(path, bytes, { contentType: sniffed, upsert: false });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  const { data: pub } = db.storage.from(BUCKET).getPublicUrl(path);
  const businessId = String(form?.get("businessId") || "");
  if (businessId) {
    try {
      const { count } = await db.from("photos").select("id", { count: "exact", head: true }).eq("business_id", businessId).neq("status", "rejected");
      await db.from("photos").insert({ business_id: businessId, url: pub.publicUrl, status: "approved", role: (count || 0) === 0 ? "cover" : "gallery", source: "admin_upload", rights_confirmed: true, sort_order: count || 0, width, height, content_hash: contentHash, reviewed_by: gate.userId, reviewed_at: new Date().toISOString() });
    } catch { /* projection still saves through the admin listing editor */ }
  }
  return NextResponse.json({ ok: true, url: pub.publicUrl, width, height });
}
