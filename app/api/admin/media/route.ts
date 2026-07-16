import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { revalidatePublic } from "@/lib/revalidate";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const gate = await requireAdmin(); if (!gate.ok) return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });
  const db = getSupabaseAdmin()!; const view = new URL(req.url).searchParams.get("view") || "quality";
  let q = db.from("photos").select("id,business_id,url,caption,alt_text,role,source,rights_confirmed,status,width,height,sort_order,created_at,rejection_reason,businesses(name,slug)").order("created_at", { ascending: false }).limit(250);
  if (view === "pending") q = q.eq("status", "pending");
  else if (view === "rejected") q = q.eq("status", "rejected");
  else if (view === "quality") q = q.eq("status", "approved").or("width.is.null,height.is.null,width.lt.1200,height.lt.900,rights_confirmed.eq.false");
  const { data, error } = await q;
  return error ? NextResponse.json({ ok: false, error: "query_failed" }, { status: 500 }) : NextResponse.json({ ok: true, media: data || [] });
}

export async function PATCH(req: Request) {
  const gate = await requireAdmin(); if (!gate.ok) return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });
  const db = getSupabaseAdmin()!; const body = (await req.json().catch(() => ({}))) as { id?: string; action?: string; reason?: string; caption?: string; altText?: string };
  const { data: row } = await db.from("photos").select("id,business_id,url,businesses(slug)").eq("id", String(body.id || "")).maybeSingle();
  if (!row) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  if (body.action === "edit") {
    await db.from("photos").update({ caption: String(body.caption || "").slice(0,120) || null, alt_text: String(body.altText || "").slice(0,180) || null }).eq("id", row.id);
  } else if (body.action === "approve" || body.action === "reject") {
    await db.from("photos").update({ status: body.action === "approve" ? "approved" : "rejected", rejection_reason: body.action === "reject" ? String(body.reason || "Image does not meet our listing standards").slice(0,500) : null, reviewed_by: gate.userId, reviewed_at: new Date().toISOString() }).eq("id", row.id);
    if (body.action === "reject") {
      const { data: b } = await db.from("businesses").select("photos").eq("id", row.business_id).maybeSingle();
      const photos = Array.isArray(b?.photos) ? b.photos.filter((p: { url?: string }) => p?.url !== row.url) : [];
      await db.from("businesses").update({ photos }).eq("id", row.business_id);
    }
  } else return NextResponse.json({ ok: false, error: "bad_action" }, { status: 422 });
  await logAudit(db, { actor: gate.userId, action: `media_${body.action}`, target: row.id, meta: { businessId: row.business_id } });
  const biz = (Array.isArray(row.businesses) ? row.businesses[0] : row.businesses) as { slug?: string } | null;
  revalidatePublic([biz?.slug ? `/business/${biz.slug}` : "/explore"]);
  return NextResponse.json({ ok: true });
}
