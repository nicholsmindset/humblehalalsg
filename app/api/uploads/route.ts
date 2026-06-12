import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { simulatedOr503 } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";

/* Issues a signed upload URL for the private `uploads` bucket so submission
   forms can attach photos / proof documents without exposing storage keys. */

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
export const MAX_BYTES = 5 * 1024 * 1024; // 5MB

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

export async function POST(req: Request) {
  if (!rateLimit(req, { key: "uploads", limit: 20, windowMs: 60_000 })) {
    return NextResponse.json({ ok: false, error: "Too many uploads" }, { status: 429 });
  }

  const body = (await req.json().catch(() => ({}))) as { contentType?: string; size?: number };
  const contentType = String(body.contentType || "");
  const size = Number(body.size) || 0;

  if (!ALLOWED_TYPES.has(contentType)) {
    return NextResponse.json(
      { ok: false, error: "Only JPEG, PNG, WebP or PDF files are accepted" },
      { status: 422 },
    );
  }
  if (size <= 0 || size > MAX_BYTES) {
    return NextResponse.json({ ok: false, error: "File must be under 5MB" }, { status: 422 });
  }

  const db = getSupabaseAdmin();
  if (!db) return simulatedOr503({ path: null, uploadUrl: null });

  const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${EXT[contentType]}`;
  try {
    const { data, error } = await db.storage.from("uploads").createSignedUploadUrl(path);
    if (error || !data) {
      return NextResponse.json({ ok: false, error: "Could not prepare upload" }, { status: 502 });
    }
    return NextResponse.json({ ok: true, path: data.path, uploadUrl: data.signedUrl, token: data.token });
  } catch {
    return NextResponse.json({ ok: false, error: "Could not prepare upload" }, { status: 502 });
  }
}
