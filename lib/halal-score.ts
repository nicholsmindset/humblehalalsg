/* Humble Halal — halal-confidence score + tier ("HalalRank").
   A single, defensible trust signal computed from certification provenance,
   recency/expiry, community confirmations and open reports. Pure + reusable
   on server and client; derived from the existing badge/verify enrichment. */
import type { BadgeKey, Listing, VerifyInfo } from "./types";

export type HalalTier =
  | "muis" // MUIS Certified — official, certificate on file
  | "muis-listed" // On the MUIS HalalSG register per our records; cert not yet on file
  | "admin" // Admin Verified — documents checked by us
  | "community" // Community-confirmed (not certified)
  | "declared" // Self-declared (not certified)
  | "pending" // Verification under review
  | "reported"; // Status recently changed / flagged

export interface HalalScore {
  score: number; // 0–100
  tier: HalalTier;
  label: string;
  blurb: string;
  reasons: string[];
}

const TIER_META: Record<HalalTier, { label: string; base: number; blurb: string }> = {
  muis: { label: "MUIS Certified", base: 90, blurb: "Officially halal-certified by MUIS." },
  "muis-listed": { label: "MUIS-listed", base: 70, blurb: "On the MUIS HalalSG register per our records — shown as fully Certified once the certificate is on file." },
  admin: { label: "Admin Verified", base: 78, blurb: "Documents checked by the Humble Halal team." },
  community: { label: "Community Confirmed", base: 62, blurb: "Confirmed halal by the community — not officially certified." },
  declared: { label: "Self-declared", base: 42, blurb: "Self-declared by the business — not certified." },
  pending: { label: "Pending Verification", base: 34, blurb: "Verification documents under review." },
  reported: { label: "Status changed", base: 26, blurb: "Halal status recently changed — re-confirm before visiting." },
};

interface ScoreInput {
  badges: BadgeKey[];
  certified?: boolean;
  verify?: VerifyInfo;
  statusChanged?: boolean;
  /** Raw `halal_tier` from the DB row. Drives the tier directly so a
   *  community/admin/muis tag is honoured instead of collapsing to
   *  "Self-declared" (which happened when the tier was inferred from badges
   *  alone — 194 MUIS + 28 community listings all showed 42). */
  halalTier?: string;
}

function resolveTier(i: ScoreInput): HalalTier {
  if (i.statusChanged) return "reported";
  const raw = i.halalTier;
  // MUIS: full "Certified" only when a certificate number is on file; otherwise
  // "MUIS-listed" (on the register per our records). Honest, and it upgrades to
  // Certified automatically the moment a cert number is recorded.
  const isMuis = raw === "muis" || i.badges.includes("muis");
  if (isMuis && i.verify?.certNo) return "muis";
  // Admin (we checked the documents) outranks a register-only match, so an
  // admin-backed business isn't masked by an unbacked MUIS claim.
  if (raw === "admin" || i.badges.includes("admin")) return "admin";
  if (isMuis) return "muis-listed";
  if (raw === "pending" || i.badges.includes("pending")) return "pending";
  if (raw === "community") return "community";
  const confirms = i.verify?.confirms ?? 0;
  if (i.badges.some((b) => b === "friendly" || b === "nopork")) {
    return confirms >= 50 ? "community" : "declared";
  }
  if (confirms >= 50) return "community";
  return "declared";
}

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

export function halalScore(i: ScoreInput): HalalScore {
  const tier = resolveTier(i);
  const meta = TIER_META[tier];
  const reasons: string[] = [meta.blurb];
  let score = meta.base;
  const v = i.verify;

  if ((tier === "muis" || tier === "admin") && v?.certNo) {
    score += 4;
    reasons.push(`Certificate on file (${v.certNo}).`);
  }
  if (v?.renewed) {
    score += 3;
    reasons.push("Verification renewed recently.");
  }
  if (v?.expiringSoon) {
    score -= 8;
    reasons.push("Certification expiring soon.");
  }
  const confirms = v?.confirms ?? 0;
  if (confirms > 0) {
    score += Math.min(6, Math.round(confirms / 30));
    reasons.push(`${confirms} community halal confirmations.`);
  }
  if (i.statusChanged) reasons.push("Recently flagged — verify before visiting.");

  return { score: clamp(score), tier, label: meta.label, blurb: meta.blurb, reasons };
}

export function scoreListing(l: Listing): HalalScore {
  return halalScore({
    badges: l.badges,
    certified: l.certified,
    verify: l.verify,
    statusChanged: l.statusChanged,
    halalTier: l.halalTier,
  });
}

/** A listing that CLAIMS MUIS certification but has no certificate number on
    file. We never present a definitive "Verified by MUIS" badge or the official
    confidence score for these — the on-page evidence /verify promises is absent.
    (Admin/own-assertion verification is unaffected — it doesn't claim a MUIS cert.) */
export function muisUnbacked(l: Pick<Listing, "badges" | "verify">): boolean {
  return l.badges.includes("muis") && !l.verify?.certNo;
}

/** Short suffix for list rows / snippets: "MUIS certified" (cert on file),
 *  "MUIS-listed" (on the register per our records, no cert recorded yet), or
 *  null when there's nothing certification-shaped to say. One helper so hub
 *  pages / llms.txt can't drift from the on-page tier. */
export function certSuffix(l: Pick<Listing, "badges" | "verify" | "certified" | "certBody">): string | null {
  if (!l.certified) return null;
  return muisUnbacked(l) ? "MUIS-listed" : `${l.certBody} certified`;
}

/** Colour token for the score ring/badge by tier. */
export function scoreTone(tier: HalalTier): string {
  if (tier === "muis" || tier === "muis-listed") return "var(--emerald)";
  if (tier === "admin") return "var(--gold-700)";
  if (tier === "community") return "var(--emerald-600)";
  if (tier === "reported") return "var(--danger)";
  return "var(--ink-faint)";
}
