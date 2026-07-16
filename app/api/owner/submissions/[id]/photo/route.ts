import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { rateLimit, tooMany } from "@/lib/ratelimit";
import { sniffAllowed, extForType } from "@/lib/file-sniff";

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const rl = await rateLimit(req, "pending-listing-photo", 20, 3600); if (!rl.ok) return tooMany(rl.retryAfter);
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, reason: "unauthenticated" }, { status: 401 });
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: false, reason: "not_configured" }, { status: 503 });
  const { data: row } = await db.from("staging_businesses").select("id, submitted_by, raw, review_status").eq("id", id).maybeSingle();
  if (!row) return NextResponse.json({ ok: false, reason: "not_found" }, { status: 404 });
  const raw = (row.raw && typeof row.raw === "object" ? row.raw : {}) as Record<string, unknown>;
  const { data: profile } = await db.from("profiles").select("role").eq("id", userId).maybeSingle();
  if (profile?.role !== "admin" && String(row.submitted_by || raw.submitted_by || "") !== userId) return NextResponse.json({ ok: false, reason: "forbidden" }, { status: 403 });
  if (!["new", "reviewing"].includes(String(row.review_status))) return NextResponse.json({ ok: false, reason: "not_editable" }, { status: 409 });
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ ok: false, reason: "no_file" }, { status: 422 });
  if (file.size > MAX_BYTES) return NextResponse.json({ ok: false, reason: "too_large" }, { status: 413 });
  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = sniffAllowed(bytes, ALLOWED);
  if (!type) return NextResponse.json({ ok: false, reason: "bad_type" }, { status: 415 });
  try { await db.storage.createBucket("business-photos", { public: true }); } catch { /* exists */ }
  const path = `pending/${id}/${randomUUID()}.${extForType(type)}`;
  const { error } = await db.storage.from("business-photos").upload(path, bytes, { contentType: type, upsert: false });
  if (error) return NextResponse.json({ ok: false, reason: "upload_failed" }, { status: 500 });
  const { data } = db.storage.from("business-photos").getPublicUrl(path);
  return NextResponse.json({ ok: true, url: data.publicUrl });
}
