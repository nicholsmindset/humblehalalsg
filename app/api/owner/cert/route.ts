import { NextResponse } from "next/server";
import { getServerFlags } from "@/lib/flags";
import { canUse } from "@/lib/plans";
import { rateLimit, tooMany } from "@/lib/ratelimit";

/* Halal Certificate Vault — owner endpoints.

   POST: an authenticated Verified+ owner uploads a halal-cert file (PDF/JPG/PNG)
   for one of their businesses. The file lands in the PRIVATE `certs` bucket and a
   `halal_certs` row is inserted status='pending' for admin review. We never store
   or return a public URL — only short-TTL signed URLs minted with the service role.

   GET: list the caller's own certs, each with a freshly minted ~120s signed URL
   for owner preview.

   Gated by the `certVault` server flag (pilot kill-switch) AND the `cert_upload`
   plan feature (Verified+). Graceful without Supabase: POST returns simulated. */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX = 8 * 1024 * 1024; // ~8MB
const SIGNED_TTL = 120; // seconds — short-lived owner preview links
const ALLOWED: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
};
const isUuid = (s: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

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

export async function POST(req: Request) {
  // Pilot kill-switch — the feature surface is off until explicitly enabled.
  if (!getServerFlags().certVault) {
    return NextResponse.json({ ok: false, reason: "cert_vault_disabled" }, { status: 403 });
  }

  const rl = await rateLimit(req, "owner-cert", 8, 3600);
  if (!rl.ok) return tooMany(rl.retryAfter);

  let file: File | null = null;
  let businessId = "";
  let issuer = "";
  let scheme = "";
  let certNo = "";
  let issuedOn = "";
  let expiresOn = "";
  try {
    const form = await req.formData();
    const f = form.get("file");
    file = f instanceof File ? f : null;
    businessId = String(form.get("businessId") || "").trim();
    issuer = String(form.get("issuer") || "").trim();
    scheme = String(form.get("scheme") || "").trim();
    certNo = String(form.get("cert_no") || "").trim();
    issuedOn = String(form.get("issued_on") || "").trim();
    expiresOn = String(form.get("expires_on") || "").trim();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  if (!file) return NextResponse.json({ ok: false, error: "No file" }, { status: 400 });
  const ext = ALLOWED[file.type];
  if (!ext) return NextResponse.json({ ok: false, error: "PDF, JPG or PNG only" }, { status: 415 });
  if (file.size > MAX) return NextResponse.json({ ok: false, error: "Max 8MB" }, { status: 413 });
  if (!isUuid(businessId)) {
    return NextResponse.json({ ok: false, error: "Missing business" }, { status: 422 });
  }

  const { getSupabaseServer, getSupabaseAdmin, supabaseConfigured } = await import("@/lib/supabase/server");
  // No backend configured (dev/demo) — accept gracefully so the UI works.
  if (!supabaseConfigured) {
    return NextResponse.json({ ok: true, simulated: true });
  }

  // Identity from the cookie-scoped client; ownership + plan from the row.
  const server = await getSupabaseServer();
  if (!server) return NextResponse.json({ ok: false, error: "auth_not_configured" }, { status: 503 });
  const { data: { user } } = await server.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, reason: "unauthenticated" }, { status: 401 });

  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: false, error: "service_unavailable" }, { status: 503 });

  // Confirm the caller owns this business (owner_id OR claimed_by) and read plan.
  const { data: biz } = await db
    .from("businesses")
    .select("id, plan, owner_id, claimed_by")
    .eq("id", businessId)
    .maybeSingle();
  const owns = !!biz && (biz.owner_id === user.id || biz.claimed_by === user.id);
  if (!owns) return NextResponse.json({ ok: false, reason: "not_owner" }, { status: 403 });
  if (!canUse(biz, "cert_upload")) {
    return NextResponse.json({ ok: false, reason: "tier_locked" }, { status: 403 });
  }

  // Store the PATH (never a public URL). Private bucket → service-role only.
  const path = `${businessId}/${crypto.randomUUID()}.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const { error: upErr } = await db.storage
    .from("certs")
    .upload(path, bytes, { contentType: file.type, upsert: false });
  if (upErr) return NextResponse.json({ ok: false, error: "Upload failed" }, { status: 502 });

  const { data: row, error: insErr } = await db
    .from("halal_certs")
    .insert({
      business_id: businessId,
      issuer: issuer || null,
      scheme: scheme || null,
      cert_no: certNo || null,
      issued_on: issuedOn || null,
      expires_on: expiresOn || null,
      file_path: path,
      status: "pending",
    })
    .select("id")
    .maybeSingle();
  if (insErr) {
    // Roll back the orphaned object so storage doesn't drift from the table.
    try { await db.storage.from("certs").remove([path]); } catch { /* best-effort */ }
    return NextResponse.json({ ok: false, error: "Could not save certificate" }, { status: 502 });
  }

  return NextResponse.json({ ok: true, id: row?.id, status: "pending" });
}

export async function GET() {
  const { getSupabaseServer, getSupabaseAdmin, supabaseConfigured } = await import("@/lib/supabase/server");
  if (!supabaseConfigured) return NextResponse.json({ ok: true, simulated: true, certs: [] });

  const server = await getSupabaseServer();
  if (!server) return NextResponse.json({ ok: false, error: "auth_not_configured" }, { status: 503 });
  const { data: { user } } = await server.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, reason: "unauthenticated" }, { status: 401 });

  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: false, error: "service_unavailable" }, { status: 503 });

  // Only the caller's own businesses.
  const { data: owned } = await db
    .from("businesses")
    .select("id")
    .or(`owner_id.eq.${user.id},claimed_by.eq.${user.id}`);
  const ids = (owned || []).map((b) => b.id as string);
  if (!ids.length) return NextResponse.json({ ok: true, certs: [] });

  const { data: certs } = await db
    .from("halal_certs")
    .select("id, business_id, issuer, scheme, cert_no, issued_on, expires_on, file_path, status, review_note, created_at")
    .in("business_id", ids)
    .order("created_at", { ascending: false });

  const out = await Promise.all(
    ((certs as CertRow[]) || []).map(async (c) => {
      let url: string | null = null;
      if (c.file_path) {
        const { data: signed } = await db.storage.from("certs").createSignedUrl(c.file_path, SIGNED_TTL);
        url = signed?.signedUrl || null;
      }
      return {
        id: c.id,
        business_id: c.business_id,
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
