import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin, supabaseConfigured } from "@/lib/supabase/server";
import { normalizeCertNo } from "@/lib/muis";
import { buildGrantPatch } from "@/lib/verify-grant";
import { revalidatePublic } from "@/lib/revalidate";

/* Halal Certificate Vault — admin review endpoints.

   GET: list pending (and recently reviewed) certs across all businesses, each
   with a short-TTL signed URL for admin preview (private bucket → service-role
   only; never a public URL).

   POST { certId, action:'approve'|'reject', review_note? }:
   - approve → copies issuer/scheme/cert_no/expiry onto the business and re-runs
     the SAME grant path as /api/admin/verify (buildGrantPatch) so the halal
     score/tier + MUIS fields stay single-sourced. Cert status → 'approved'.
   - reject → cert status → 'rejected' with the review note. No business change.

   Admin-gated identically to /api/admin/verify. Graceful without Supabase. */

export const dynamic = "force-dynamic";

const SIGNED_TTL = 120; // seconds — short-lived admin preview links

type Action = "approve" | "reject";

type CertRow = {
  id: string;
  business_id: string;
  issuer: string | null;
  scheme: string | null;
  cert_no: string | null;
  issued_on: string | null;
  expires_on: string | null;
  file_path: string | null;
  status: string;
  review_note: string | null;
  created_at: string;
};

export async function GET() {
  if (!supabaseConfigured) return NextResponse.json({ ok: true, simulated: true, certs: [] });

  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });

  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: false, error: "service_unavailable" }, { status: 503 });

  // Pending first, then the most recent reviewed ones for context.
  const { data: certs } = await db
    .from("halal_certs")
    .select("id, business_id, issuer, scheme, cert_no, issued_on, expires_on, file_path, status, review_note, created_at")
    .in("status", ["pending", "approved", "rejected"])
    .order("status", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(100);

  const list = (certs as CertRow[]) || [];
  // Resolve business names for display in one round-trip.
  const bizIds = Array.from(new Set(list.map((c) => c.business_id)));
  const names = new Map<string, string>();
  if (bizIds.length) {
    const { data: biz } = await db.from("businesses").select("id, name").in("id", bizIds);
    for (const b of biz || []) names.set(b.id as string, (b.name as string) || "");
  }

  const out = await Promise.all(
    list.map(async (c) => {
      let url: string | null = null;
      if (c.file_path) {
        const { data: signed } = await db.storage.from("certs").createSignedUrl(c.file_path, SIGNED_TTL);
        url = signed?.signedUrl || null;
      }
      return {
        id: c.id,
        business_id: c.business_id,
        business_name: names.get(c.business_id) || null,
        issuer: c.issuer,
        scheme: c.scheme,
        cert_no: c.cert_no,
        issued_on: c.issued_on,
        expires_on: c.expires_on,
        status: c.status,
        review_note: c.review_note,
        created_at: c.created_at,
        url,
      };
    }),
  );

  return NextResponse.json({ ok: true, certs: out });
}

export async function POST(req: Request) {
  let body: { certId?: string; action?: Action; review_note?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  const certId = String(body.certId || "").trim();
  const action = body.action as Action;
  const reviewNote = String(body.review_note || "").trim() || null;
  if (!certId) return NextResponse.json({ ok: false, error: "Missing certId" }, { status: 422 });
  if (!["approve", "reject"].includes(action)) {
    return NextResponse.json({ ok: false, error: "Invalid action" }, { status: 422 });
  }

  // No Supabase configured (dev) — accept gracefully without persisting.
  if (!supabaseConfigured) {
    return NextResponse.json({ ok: true, simulated: true, status: action === "approve" ? "approved" : "rejected" });
  }

  // Same explicit admin gate as /api/admin/verify (golden-rule-critical path).
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });

  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: false, error: "service_unavailable" }, { status: 503 });

  const { data: cert } = await db
    .from("halal_certs")
    .select("id, business_id, issuer, scheme, cert_no, expires_on, status")
    .eq("id", certId)
    .maybeSingle();
  if (!cert) return NextResponse.json({ ok: false, error: "Certificate not found" }, { status: 404 });

  const reviewedAt = new Date().toISOString();
  const newStatus = action === "approve" ? "approved" : "rejected";

  // Update the cert row (service role bypasses RLS; gate already confirmed admin).
  const { error: cErr } = await db
    .from("halal_certs")
    .update({ status: newStatus, review_note: reviewNote, reviewed_by: gate.userId, reviewed_at: reviewedAt, updated_at: reviewedAt })
    .eq("id", certId);
  if (cErr) return NextResponse.json({ ok: false, error: "Update failed" }, { status: 502 });

  let tier: string | undefined;
  let score: number | undefined;

  if (action === "approve") {
    // Copy cert meta onto the business + re-run the SAME grant path as verify so
    // the halal score/tier stays single-sourced (lib/verify-grant).
    const certNo = normalizeCertNo(cert.cert_no || undefined);
    const grantAction = certNo ? "muis" : "admin";
    const patch = buildGrantPatch({
      action: grantAction,
      certNo,
      scheme: (cert.scheme as string | null) || null,
      expiry: (cert.expires_on as string | null) || null,
    });
    tier = patch.halal_tier;
    score = patch.halal_score;
    const { error: bErr } = await db.from("businesses").update(patch).eq("id", cert.business_id);
    if (bErr) return NextResponse.json({ ok: false, error: "Update failed" }, { status: 502 });
  }

  // Best-effort audit trail (mirrors /api/admin/verify).
  try {
    await db.from("audit_log").insert({
      actor: gate.userId,
      action: action === "approve" ? "Approved halal certificate" : "Rejected halal certificate",
      target: cert.business_id,
      meta: { certId, cert: cert.cert_no || null, expiry: cert.expires_on || null, note: reviewNote },
    });
  } catch {
    /* audit is best-effort */
  }

  // Cert lifecycle for the freshness/recheck crons.
  try {
    await db.from("verification_log").insert({
      business_id: cert.business_id,
      event: action === "approve" ? "reverified" : "flagged",
      detail: action === "approve" ? `cert approved${cert.cert_no ? ` · ${cert.cert_no}` : ""}` : `cert rejected${reviewNote ? ` · ${reviewNote}` : ""}`,
    });
  } catch {
    /* best-effort */
  }

  // Approving a cert changes the business's halal tier/score → refresh public pages.
  if (action === "approve") revalidatePublic();

  return NextResponse.json({ ok: true, status: newStatus, tier, score });
}
