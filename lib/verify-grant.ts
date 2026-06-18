import { halalScore } from "@/lib/halal-score";

/* Single source of truth for how an admin grant translates into the
   businesses.halal_tier / halal_score (+ MUIS fields) update.

   Used by BOTH /api/admin/verify (manual cert intake) and /api/admin/cert
   (approving an uploaded cert) so the halal score is computed exactly once,
   the same way, regardless of which surface triggered the grant. Pure +
   isomorphic — no Supabase imports here. */

export type GrantAction = "muis" | "admin" | "revoke";

/** True when an expiry date is within ~90 days (lowers the score, flags re-verify). */
export function isExpiringSoon(expiry: string | null | undefined): boolean {
  if (!expiry) return false;
  const t = Date.parse(expiry);
  return Number.isFinite(t) && t - Date.now() < 90 * 24 * 60 * 60 * 1000;
}

/** Resolve the halal tier + score for an admin grant. Mirrors /api/admin/verify. */
export function tierAndScore(
  action: GrantAction,
  certNo: string,
  expiringSoon: boolean,
): { tier: string; score: number } {
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

export interface GrantPatch {
  muis_cert_no: string | null;
  muis_scheme: string | null;
  muis_expiry: string | null;
  halal_tier: string;
  halal_score: number;
  last_verified_at: string;
}

/** Build the exact businesses-row patch for a grant (single-sourced with verify). */
export function buildGrantPatch(args: {
  action: GrantAction;
  certNo: string;
  scheme: string | null;
  expiry: string | null;
}): GrantPatch {
  const { action, certNo, scheme, expiry } = args;
  const { tier, score } = tierAndScore(action, certNo, isExpiringSoon(expiry));
  const now = new Date().toISOString();
  if (action === "revoke") {
    return { muis_cert_no: null, muis_scheme: null, muis_expiry: null, halal_tier: tier, halal_score: score, last_verified_at: now };
  }
  return {
    muis_cert_no: action === "muis" ? certNo || null : null,
    muis_scheme: action === "muis" ? scheme || null : null,
    muis_expiry: expiry || null,
    halal_tier: tier,
    halal_score: score,
    last_verified_at: now,
  };
}
