import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { halalScore } from "@/lib/halal-score";
import { normalizeCertNo } from "@/lib/muis";

/* Admin halal-verification intake.

   Records OUR dated assertion that a business is MUIS-certified / admin-verified
   (cert no, scheme, expiry) and recomputes the halal-confidence score. We never
   copy the MUIS register — the admin verifies on the official HalalSG site and
   records the outcome here.

   Persists via the request-scoped Supabase client so RLS enforces admin-only
   writes. Without Supabase configured it succeeds in "simulated" mode so the
   admin console works in dev. */

type Action = "muis" | "admin" | "revoke";

function tierAndScore(action: Action, certNo: string, expiringSoon: boolean) {
  if (action === "revoke") {
    return { tier: "declared", score: halalScore({ badges: ["friendly"] }).score };
  }
  const badge = action === "muis" ? "muis" : "admin";
  const { score, tier } = halalScore({
    badges: [badge],
    certified: true,
    verify: { certNo: certNo || null, verified: null, expires: null, confirms: 0, renewed: false, expiringSoon },
  });
  return { tier, score };
}

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
  // Expiry within ~90 days lowers the score and flags re-verification.
  const expiringSoon = !!expiry && (() => {
    const t = Date.parse(expiry);
    return Number.isFinite(t) && t - Date.now() < 90 * 24 * 60 * 60 * 1000;
  })();
  const { tier, score } = tierAndScore(action, certNo, expiringSoon);

  // No Supabase configured (dev) — accept gracefully without persisting.
  const db = await getSupabaseServer();
  if (!db) {
    return NextResponse.json({ ok: true, simulated: true, tier, score });
  }

  // RLS enforces that only an authenticated admin can update businesses.
  const patch =
    action === "revoke"
      ? { muis_cert_no: null, muis_scheme: null, muis_expiry: null, halal_tier: tier, halal_score: score, last_verified_at: new Date().toISOString() }
      : { muis_cert_no: action === "muis" ? certNo : null, muis_scheme: action === "muis" ? String(body.scheme || "").trim() || null : null, muis_expiry: expiry, halal_tier: tier, halal_score: score, last_verified_at: new Date().toISOString() };

  try {
    const { error } = await db.from("businesses").update(patch).eq("id", businessId);
    if (error) {
      return NextResponse.json({ ok: false, error: "Not authorised or update failed" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ ok: false, error: "Update failed" }, { status: 502 });
  }

  // Best-effort audit trail (don't fail the response if the table differs).
  try {
    await db.from("audit_log").insert({
      action: action === "revoke" ? "Revoked halal verification" : `Granted ${action === "muis" ? "MUIS Certified" : "Admin Verified"}`,
      business_id: businessId,
      detail: action === "muis" ? `cert ${certNo}${expiry ? ` · exp ${expiry}` : ""}` : null,
    });
  } catch {
    /* audit is best-effort */
  }

  return NextResponse.json({ ok: true, tier, score });
}
