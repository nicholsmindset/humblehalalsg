import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { rateLimit, tooMany } from "@/lib/ratelimit";

/* Event cover-photo upload → Supabase Storage (public bucket "event-photos").
   Auth required. Returns the public URL stored in the event's display.img.
   Degrades to { ok:false } when storage isn't configured so the wizard can
   continue without a photo. */
const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const BUCKET = "event-photos";

export async function POST(req: Request) {
  const rl = await rateLimit(req, "event-upload", 30, 3600); if (!rl.ok) return tooMany(rl.retryAfter);

  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, reason: "unauthenticated" }, { status: 401 });
  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ ok: false, reason: "not_configured" }, { status: 503 });

  let form: FormData;
  try { form = await req.formData(); } catch { return NextResponse.json({ ok: false, reason: "bad_request" }, { status: 400 }); }
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ ok: false, reason: "no_file" }, { status: 422 });
  if (!ALLOWED.includes(file.type)) return NextResponse.json({ ok: false, reason: "bad_type" }, { status: 422 });
  if (file.size > MAX_BYTES) return NextResponse.json({ ok: false, reason: "too_large" }, { status: 422 });

  // Ensure the bucket exists (idempotent — ignore "already exists").
  try { await admin.storage.createBucket(BUCKET, { public: true }); } catch { /* exists */ }

  const ext = file.type.split("/")[1]?.replace("jpeg", "jpg") || "jpg";
  const path = `${userId}/${randomUUID()}.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const { error } = await admin.storage.from(BUCKET).upload(path, bytes, { contentType: file.type, upsert: false });
  if (error) return NextResponse.json({ ok: false, reason: "upload_failed", detail: error.message }, { status: 500 });

  const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(path);
  return NextResponse.json({ ok: true, url: pub.publicUrl });
}
