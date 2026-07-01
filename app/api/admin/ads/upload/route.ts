import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

/* Sponsor creative upload → Supabase Storage `ad-creatives` (public) bucket.
   Admin-only. Mirrors app/api/upload/route.ts. Graceful: without keys (or a
   missing bucket) it returns { simulated:true } so the admin form still shows a
   local object-URL preview in dev. Returns the public URL to store on the
   campaign's image_url. */

export const runtime = "nodejs";
const MAX = 4 * 1024 * 1024; // 4MB — banners are small

export async function POST(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });

  let file: File | null = null;
  try {
    const form = await req.formData();
    const f = form.get("file");
    file = f instanceof File ? f : null;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  if (!file) return NextResponse.json({ ok: false, error: "No file" }, { status: 400 });
  if (!/^image\//.test(file.type)) return NextResponse.json({ ok: false, error: "Images only" }, { status: 415 });
  if (file.size > MAX) return NextResponse.json({ ok: false, error: "Max 4MB" }, { status: 413 });

  try {
    const { getSupabaseAdmin } = await import("@/lib/supabase/server");
    const sb = getSupabaseAdmin();
    if (sb) {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const bytes = new Uint8Array(await file.arrayBuffer());
      const { error } = await sb.storage.from("ad-creatives").upload(path, bytes, { contentType: file.type });
      if (!error) {
        const { data } = sb.storage.from("ad-creatives").getPublicUrl(path);
        return NextResponse.json({ ok: true, simulated: false, url: data.publicUrl });
      }
    }
  } catch {
    /* fall through to simulated */
  }

  return NextResponse.json({ ok: true, simulated: true });
}
