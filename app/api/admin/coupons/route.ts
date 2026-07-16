import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { revalidatePublic } from "@/lib/revalidate";
import { emailForBusinessOwner } from "@/lib/emails/recipient";
import { couponApprovedEmail } from "@/lib/emails/templates";
import { sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const gate = await requireAdmin(); if (!gate.ok) return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });
  const db = getSupabaseAdmin()!;
  const status = new URL(req.url).searchParams.get("status") || "pending";
  let q = db.from("business_promotions").select("*,businesses(name,slug,plan,status)").order("created_at", { ascending: false }).limit(200);
  if (status !== "all") q = q.eq("status", status);
  const { data, error } = await q;
  return error ? NextResponse.json({ ok: false, error: "query_failed" }, { status: 500 }) : NextResponse.json({ ok: true, promotions: data || [] });
}

export async function PATCH(req: Request) {
  const gate = await requireAdmin(); if (!gate.ok) return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });
  const db = getSupabaseAdmin()!;
  const body = (await req.json().catch(() => ({}))) as { id?: string; action?: string; reason?: string };
  if (!body.id || !["approve","reject","pause"].includes(String(body.action))) return NextResponse.json({ ok: false, error: "bad_request" }, { status: 422 });
  const { data: current } = await db.from("business_promotions").select("id,business_id,title,businesses(name,slug,plan,status)").eq("id", body.id).maybeSingle();
  if (!current) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  const biz = (Array.isArray(current.businesses) ? current.businesses[0] : current.businesses) as { name?: string; slug?: string; plan?: string; status?: string } | null;
  if (body.action === "approve" && (biz?.plan !== "premium" || biz?.status !== "published")) return NextResponse.json({ ok: false, error: "business_not_eligible" }, { status: 409 });
  const status = body.action === "approve" ? "active" : body.action === "reject" ? "rejected" : "paused";
  const { error } = await db.from("business_promotions").update({ status, reviewed_by: gate.userId, reviewed_at: new Date().toISOString(), rejection_reason: status === "rejected" ? String(body.reason || "Needs changes before publication").slice(0,500) : null }).eq("id", body.id);
  if (error) return NextResponse.json({ ok: false, error: "update_failed" }, { status: 500 });
  await logAudit(db, { actor: gate.userId, action: `${status === "active" ? "Approved" : status === "rejected" ? "Rejected" : "Paused"} coupon`, target: body.id, meta: { businessId: current.business_id } });
  revalidatePublic(["/deals", biz?.slug ? `/business/${biz.slug}` : "/explore"]);
  if (status === "active") {
    try {
      const owner = await emailForBusinessOwner(db, current.business_id);
      if (owner.email) { const mail = couponApprovedEmail({ name: owner.name, business: owner.businessName || biz?.name || "your business", title: current.title }); await sendEmail({ to: owner.email, ...mail, template: "coupon-approved", businessId: current.business_id }); }
    } catch { /* email best-effort */ }
  }
  return NextResponse.json({ ok: true, status });
}
