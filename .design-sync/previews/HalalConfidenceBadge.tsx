import { HalalConfidenceBadge } from "humblehalalsg";

const muis = {
  score: 94,
  tier: "muis",
  label: "MUIS Certified",
  blurb: "Holds a valid official MUIS halal certificate, with the certificate number on file.",
  reasons: [
    "Holds a valid official MUIS halal certificate, with the certificate number on file.",
    "Certificate on file (MUIS-KH-2024-01839).",
    "Verification renewed recently.",
    "128 community halal confirmations.",
  ],
};

const admin = {
  score: 81,
  tier: "admin",
  label: "Admin Verified",
  blurb: "Documents checked by the Humble Halal team (a trust signal, not MUIS certification).",
  reasons: [
    "Documents checked by the Humble Halal team (a trust signal, not MUIS certification).",
    "Certificate on file (HH-VER-2025-0442).",
    "64 community halal confirmations.",
  ],
};

const community = {
  score: 68,
  tier: "community",
  label: "Community Confirmed",
  blurb: "Confirmed halal by the community — not officially certified.",
  reasons: [
    "Confirmed halal by the community — not officially certified.",
    "83 community halal confirmations.",
  ],
};

const declared = {
  score: 42,
  tier: "declared",
  label: "Self-declared",
  blurb: "Self-declared by the business — not certified.",
  reasons: ["Self-declared by the business — not certified."],
};

const reported = {
  score: 26,
  tier: "reported",
  label: "Status changed",
  blurb: "Halal status recently changed — re-confirm before visiting.",
  reasons: [
    "Halal status recently changed — re-confirm before visiting.",
    "Recently flagged — verify before visiting.",
  ],
};

export const MuisCertified = () => <HalalConfidenceBadge score={muis} />;

export const AdminVerified = () => <HalalConfidenceBadge score={admin} />;

export const CommunityConfirmed = () => <HalalConfidenceBadge score={community} />;

export const SelfDeclared = () => <HalalConfidenceBadge score={declared} />;

export const StatusChanged = () => <HalalConfidenceBadge score={reported} />;
