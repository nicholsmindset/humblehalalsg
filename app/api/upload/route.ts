import { NextResponse } from "next/server";

/* Photo upload → Supabase Storage `business-photos` bucket + a pending `photos`
   row for moderation. Graceful: without keys it returns simulated (the client
   can still show a local object-URL preview). */

export const runtime = "nodejs";
const MAX = 6 * 1024 * 1024; // 6MB
const isUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

export async function POST(req: Request) {
  let file: File | null = null;
  let businessId = "";
  try {
    const form = await req.formData();
    const f = form.get("file");
    file = f instanceof File ? f : null;
    businessId = String(form.get("businessId") || "");
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  if (!file) return NextResponse.json({ ok: false, error: "No file" }, { status: 400 });
  if (!/^image\//.test(file.type)) return NextResponse.json({ ok: false, error: "Images only" }, { status: 415 });
  if (file.size > MAX) return NextResponse.json({ ok: false, error: "Max 6MB" }, { status: 413 });

  try {
    const { getSupabaseAdmin } = await import("@/lib/supabase/server");
    const sb = getSupabaseAdmin();
    if (sb) {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
      const path = `${businessId || "misc"}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const bytes = new Uint8Array(await file.arrayBuffer());
      const { error } = await sb.storage.from("business-photos").upload(path, bytes, { contentType: file.type });
      if (!error) {
        const { data } = sb.storage.from("business-photos").getPublicUrl(path);
        try {
          await sb.from("photos").insert({ business_id: isUuid(businessId) ? businessId : null, url: data.publicUrl, status: "pending" });
        } catch {
          /* photo row optional */
        }
        return NextResponse.json({ ok: true, simulated: false, url: data.publicUrl });
      }
    }
  } catch {
    /* fall through to simulated */
  }

  return NextResponse.json({ ok: true, simulated: true });
}
