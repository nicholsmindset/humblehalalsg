import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { rateLimit, tooMany } from "@/lib/ratelimit";

/* Owner-facing sponsor creative upload → ad-creatives bucket under a
   selfserve/{businessId}/ prefix. Mirrors the admin route but requires the
   caller to OWN the business the creative is for; every creative still goes
   through the admin review gate (review_status) before it can serve. */
export const runtime = "nodejs";
const MAX = 4 * 1024 * 1024; // 4MB — banners are small
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

export async function POST(req: Request) {
  const rl = await rateLimit(req, "owner-ad-upload", 15, 3600); if (!rl.ok) return tooMany(rl.retryAfter);

  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, reason: "unauthenticated" }, { status: 401 });
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ ok: false, reason: "not_configured" }, { status: 503 });

  let file: File | null = null;
  let businessId = "";
  try {
    const form = await req.formData();
    const f = form.get("file");
    file = f instanceof File ? f : null;
    businessId = String(form.get("businessId") || "").trim();
  } catch {
    return NextResponse.json({ ok: false, reason: "bad_request" }, { status: 400 });
  }
  if (!file) return NextResponse.json({ ok: false, reason: "no_file" }, { status: 422 });
  if (!ALLOWED.includes(file.type)) return NextResponse.json({ ok: false, reason: "bad_type" }, { status: 415 });
  if (file.size > MAX) return NextResponse.json({ ok: false, reason: "too_large" }, { status: 413 });
  if (!businessId) return NextResponse.json({ ok: false, reason: "business_required" }, { status: 422 });

  const { data: biz } = await sb.from("businesses").select("id, owner_id, claimed_by").eq("id", businessId).maybeSingle();
  if (!biz) return NextResponse.json({ ok: false, reason: "not_found" }, { status: 404 });
  if (biz.owner_id !== userId && biz.claimed_by !== userId) {
    return NextResponse.json({ ok: false, reason: "forbidden" }, { status: 403 });
  }

  const ext = file.type.split("/")[1]?.replace("jpeg", "jpg") || "jpg";
  const path = `selfserve/${businessId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const { error } = await sb.storage.from("ad-creatives").upload(path, bytes, { contentType: file.type });
  if (error) {
    console.error("[owner/ads/upload] storage upload failed:", error.message);
    return NextResponse.json({ ok: false, reason: "upload_failed" }, { status: 500 });
  }

  const { data } = sb.storage.from("ad-creatives").getPublicUrl(path);
  return NextResponse.json({ ok: true, url: data.publicUrl });
}
