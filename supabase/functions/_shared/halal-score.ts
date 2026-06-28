// Halal-confidence score + tier — DENO COPY of lib/halal-score.ts (keep in sync;
// lib/halal-score.ts is the canonical TS source). Self-contained: badge/verify
// shapes inlined so there's no @/lib/types import.

export type HalalTier = "muis" | "admin" | "community" | "declared" | "pending" | "reported";

export interface HalalScore {
  score: number;
  tier: HalalTier;
  label: string;
  blurb: string;
  reasons: string[];
}

export type BadgeKey = string;
export interface VerifyInfo {
  certNo?: string | null;
  renewed?: boolean;
  expiringSoon?: boolean;
  confirms?: number;
}
export interface ScoreInput {
  badges: BadgeKey[];
  certified?: boolean;
  verify?: VerifyInfo;
  statusChanged?: boolean;
}

const TIER_META: Record<HalalTier, { label: string; base: number; blurb: string }> = {
  muis: { label: "MUIS Certified", base: 90, blurb: "Officially halal-certified by MUIS." },
  admin: { label: "Admin Verified", base: 78, blurb: "Documents checked by the Humble Halal team." },
  community: { label: "Community Confirmed", base: 62, blurb: "Confirmed halal by the community — not officially certified." },
  declared: { label: "Self-declared", base: 42, blurb: "Self-declared by the business — not certified." },
  pending: { label: "Pending Verification", base: 34, blurb: "Verification documents under review." },
  reported: { label: "Status changed", base: 26, blurb: "Halal status recently changed — re-confirm before visiting." },
};

function resolveTier(i: ScoreInput): HalalTier {
  if (i.statusChanged) return "reported";
  if (i.badges.includes("muis") && i.verify?.certNo) return "muis";
  if (i.badges.includes("admin")) return "admin";
  if (i.badges.includes("pending")) return "pending";
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

  if ((tier === "muis" || tier === "admin") && v?.certNo) { score += 4; reasons.push(`Certificate on file (${v.certNo}).`); }
  if (v?.renewed) { score += 3; reasons.push("Verification renewed recently."); }
  if (v?.expiringSoon) { score -= 8; reasons.push("Certification expiring soon."); }
  const confirms = v?.confirms ?? 0;
  if (confirms > 0) { score += Math.min(6, Math.round(confirms / 30)); reasons.push(`${confirms} community halal confirmations.`); }
  if (i.statusChanged) reasons.push("Recently flagged — verify before visiting.");

  return { score: clamp(score), tier, label: meta.label, blurb: meta.blurb, reasons };
}
