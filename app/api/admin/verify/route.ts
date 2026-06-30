import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin, supabaseConfigured } from "@/lib/supabase/server";
import { normalizeCertNo } from "@/lib/muis";
import { buildGrantPatch, isExpiringSoon, tierAndScore, type GrantAction } from "@/lib/verify-grant";
import { revalidatePublic } from "@/lib/revalidate";

/* Admin halal-verification intake.

   Records OUR dated assertion that a business is MUIS-certified / admin-verified
   (cert no, scheme, expiry) and recomputes the halal-confidence score. We never
   copy the MUIS register — the admin verifies on the official HalalSG site and
   records the outcome here.

   Persists via the request-scoped Supabase client so RLS enforces admin-only
   writes. Without Supabase configured it succeeds in "simulated" mode so the
   admin console works in dev. */

type Action = GrantAction;

export async function POST(req: Request) {
  let body: {
    business_id?: string;
    action?: Action;
    certNo?: string;
    scheme?: string;
    expiry?: string;
  } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  const businessId = String(body.business_id || "").trim();
  const action = body.action as Action;
  if (!businessId) {
    return NextResponse.json({ ok: false, error: "Missing business_id" }, { status: 422 });
  }
  if (!["muis", "admin", "revoke"].includes(action)) {
    return NextResponse.json({ ok: false, error: "Invalid action" }, { status: 422 });
  }
  if (action === "muis" && !String(body.certNo || "").trim()) {
    return NextResponse.json({ ok: false, error: "MUIS verification needs a certificate number" }, { status: 422 });
  }

  const certNo = normalizeCertNo(body.certNo);
  const expiry = String(body.expiry || "").trim() || null;
  const scheme = String(body.scheme || "").trim() || null;
  // Expiry within ~90 days lowers the score and flags re-verification.
  const { tier, score } = tierAndScore(action, certNo, isExpiringSoon(expiry));

  // No Supabase configured (dev) — accept gracefully without persisting.
  if (!supabaseConfigured) {
    return NextResponse.json({ ok: true, simulated: true, tier, score });
  }

  // Explicit admin gate — golden-rule-critical path (sets halal_tier/MUIS).
  // Identity comes from cookies; role is checked with the service role. Never
  // rely on RLS alone here (businesses has only an owner update policy).
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });

  // Write with the service role (gate already confirmed admin) so the update
  // isn't blocked by the owner-only RLS policy.
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: false, error: "service_unavailable" }, { status: 503 });

  const patch = buildGrantPatch({ action, certNo, scheme, expiry });

  try {
    const { error } = await db.from("businesses").update(patch).eq("id", businessId);
    if (error) {
      return NextResponse.json({ ok: false, error: "Update failed" }, { status: 502 });
    }
  } catch {
    return NextResponse.json({ ok: false, error: "Update failed" }, { status: 502 });
  }

  // Best-effort audit trail (columns: actor, action, target, meta — see 0004).
  try {
    await db.from("audit_log").insert({
      actor: gate.userId,
      action: action === "revoke" ? "Revoked halal verification" : `Granted ${action === "muis" ? "MUIS Certified" : "Admin Verified"}`,
      target: businessId,
      meta: action === "muis" ? { cert: certNo, expiry: expiry || null, scheme } : {},
    });
  } catch {
    /* audit is best-effort */
  }

  // Cert lifecycle for the freshness/recheck crons.
  try {
    await db.from("verification_log").insert({
      business_id: businessId,
      event: action === "revoke" ? "flagged" : "reverified",
      detail: action === "muis" ? `cert ${certNo}${expiry ? ` · exp ${expiry}` : ""}` : action,
    });
  } catch {
    /* best-effort */
  }

  revalidatePublic();
  return NextResponse.json({ ok: true, tier, score });
}
