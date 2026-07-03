import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { rateLimit, tooMany } from "@/lib/ratelimit";

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
  if (businessId) {
    const { data } = await admin.from("businesses").select("id, owner_id, claimed_by").eq("id", businessId).maybeSingle();
    if (!data) return NextResponse.json({ ok: false, reason: "not_found" }, { status: 404 });
    if (data.owner_id !== userId && data.claimed_by !== userId) {
      return NextResponse.json({ ok: false, reason: "forbidden" }, { status: 403 });
    }
  }

  // Ensure the bucket exists (idempotent — ignore "already exists").
  try { await admin.storage.createBucket(BUCKET, { public: true }); } catch { /* exists */ }

  const ext = file.type.split("/")[1]?.replace("jpeg", "jpg") || "jpg";
  const path = `${businessId || `wizard/${userId}`}/${randomUUID()}.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const { error } = await admin.storage.from(BUCKET).upload(path, bytes, { contentType: file.type, upsert: false });
  if (error) return NextResponse.json({ ok: false, reason: "upload_failed", detail: error.message }, { status: 500 });

  const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(path);

  // Moderation trail (photos table, 0002) — best-effort; the URL is already
  // public-bucket, this row is how admins find + pull anything reported.
  if (businessId) {
    try {
      await admin.from("photos").insert({ business_id: businessId, url: pub.publicUrl, uploaded_by: userId, status: "pending" });
    } catch { /* table missing or FK drift — never block the upload */ }
  }

  return NextResponse.json({ ok: true, url: pub.publicUrl });
}
