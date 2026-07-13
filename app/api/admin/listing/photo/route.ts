import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { sniffAllowed, extForType } from "@/lib/file-sniff";

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
  const ext = extForType(sniffed);
  const path = `admin/${crypto.randomUUID()}.${ext}`;
  const { error } = await db.storage.from(BUCKET).upload(path, bytes, { contentType: sniffed, upsert: false });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  const { data: pub } = db.storage.from(BUCKET).getPublicUrl(path);
  return NextResponse.json({ ok: true, url: pub.publicUrl });
}
