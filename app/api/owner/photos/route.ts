import { NextResponse } from "next/server";
import { createHash, randomUUID } from "crypto";
import sharp from "sharp";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { rateLimit, tooMany } from "@/lib/ratelimit";
import { galleryMax } from "@/lib/plans";
import { sniffAllowed, extForType } from "@/lib/file-sniff";

/* Business listing photo upload → Supabase Storage (public bucket
   "business-photos"). Replaces the two wrong paths that existed before:
   the orphaned unauthenticated /api/upload (deleted) and listing photos
   piggy-backing on the event-photos bucket via /api/events/upload.

   Auth required. When businessId is supplied the caller must own it
   (owner_id OR claimed_by) — otherwise the file lands under a per-user
   wizard/ prefix for add-listing drafts. Each upload also drops a pending
   row into the `photos` moderation table (best-effort) so admins can sweep
   creatives that shouldn't be public. */
const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const BUCKET = "business-photos";

export async function POST(req: Request) {
  const rl = await rateLimit(req, "owner-photos", 20, 3600); if (!rl.ok) return tooMany(rl.retryAfter);

  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, reason: "unauthenticated" }, { status: 401 });
  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ ok: false, reason: "not_configured" }, { status: 503 });

  let form: FormData;
  try { form = await req.formData(); } catch { return NextResponse.json({ ok: false, reason: "bad_request" }, { status: 400 }); }
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ ok: false, reason: "no_file" }, { status: 422 });
  if (!ALLOWED.includes(file.type)) return NextResponse.json({ ok: false, reason: "bad_type" }, { status: 422 });
  if (file.size > MAX_BYTES) return NextResponse.json({ ok: false, reason: "too_large" }, { status: 413 });

  const businessId = String(form.get("businessId") || "").trim();
  const rightsConfirmed = form.get("rightsConfirmed") === "true";
  if (businessId) {
    if (!rightsConfirmed) return NextResponse.json({ ok: false, reason: "rights_required" }, { status: 422 });
    const { data } = await admin.from("businesses").select("id, owner_id, claimed_by, plan, photos").eq("id", businessId).maybeSingle();
    if (!data) return NextResponse.json({ ok: false, reason: "not_found" }, { status: 404 });
    if (data.owner_id !== userId && data.claimed_by !== userId) {
      return NextResponse.json({ ok: false, reason: "forbidden" }, { status: 403 });
    }
    // Enforce the plan's gallery cap at UPLOAD time, not only on listing save —
    // otherwise over-cap files pile up orphaned in storage (audit O10). The
    // listing PATCH still applies sanitizePhotos(galleryMax) as the final gate.
    const max = galleryMax(data.plan);
    let moderated = 0;
    try { const { count } = await admin.from("photos").select("id", { count: "exact", head: true }).eq("business_id", businessId).neq("status", "rejected"); moderated = count || 0; } catch { /* pre-0074 */ }
    const current = Math.max(Array.isArray(data.photos) ? data.photos.length : 0, moderated);
    if (current >= max) return NextResponse.json({ ok: false, reason: "gallery_full", max }, { status: 409 });
  }

  // Ensure the bucket exists (idempotent — ignore "already exists").
  try { await admin.storage.createBucket(BUCKET, { public: true }); } catch { /* exists */ }

  const bytes = new Uint8Array(await file.arrayBuffer());
  // Authoritative type check: sniff the real bytes, don't trust the declared
  // file.type — store with the detected content-type + extension.
  const sniffed = sniffAllowed(bytes, ALLOWED);
  if (!sniffed) return NextResponse.json({ ok: false, reason: "bad_type" }, { status: 415 });
  let width: number | null = null, height: number | null = null;
  try { const meta = await sharp(bytes).metadata(); width = meta.width || null; height = meta.height || null; } catch { return NextResponse.json({ ok: false, reason: "bad_type" }, { status: 415 }); }
  if (businessId && (!width || !height || width < 800 || height < 600)) return NextResponse.json({ ok: false, reason: "too_small", width, height }, { status: 422 });
  const contentHash = createHash("sha256").update(bytes).digest("hex");
  if (businessId) {
    try { const { data: duplicate } = await admin.from("photos").select("id").eq("business_id", businessId).eq("content_hash", contentHash).maybeSingle(); if (duplicate) return NextResponse.json({ ok: false, reason: "duplicate" }, { status: 409 }); } catch { /* pre-0074 */ }
  }
  const ext = extForType(sniffed);
  const path = `${businessId || `wizard/${userId}`}/${randomUUID()}.${ext}`;
  const { error } = await admin.storage.from(BUCKET).upload(path, bytes, { contentType: sniffed, upsert: false });
  if (error) {
    console.error("[owner/photos] storage upload failed:", error.message);
    return NextResponse.json({ ok: false, reason: "upload_failed" }, { status: 500 });
  }

  const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(path);

  // Moderation trail (photos table, 0002) — best-effort; the URL is already
  // public-bucket, this row is how admins find + pull anything reported.
  if (businessId) {
    try {
      const { count } = await admin.from("photos").select("id", { count: "exact", head: true }).eq("business_id", businessId).neq("status", "rejected");
      await admin.from("photos").insert({ business_id: businessId, url: pub.publicUrl, uploaded_by: userId, status: "approved", role: (count || 0) === 0 ? "cover" : "gallery", source: "owner_upload", rights_confirmed: true, sort_order: count || 0, width, height, content_hash: contentHash, reviewed_at: new Date().toISOString() });
    } catch { /* table missing or FK drift — never block the upload */ }
  }

  return NextResponse.json({ ok: true, url: pub.publicUrl, width, height });
}
