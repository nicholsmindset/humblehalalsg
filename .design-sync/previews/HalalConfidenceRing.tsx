import { HalalConfidenceRing } from "humblehalalsg";

const muis = {
  score: 94,
  tier: "muis",
  label: "MUIS Certified",
  blurb: "Holds a valid official MUIS halal certificate, with the certificate number on file.",
  reasons: ["Certificate on file (MUIS-KH-2024-01839)."],
};

const admin = {
  score: 81,
  tier: "admin",
  label: "Admin Verified",
  blurb: "Documents checked by the Humble Halal team (a trust signal, not MUIS certification).",
  reasons: ["Documents checked by the Humble Halal team."],
};

const community = {
  score: 68,
  tier: "community",
  label: "Community Confirmed",
  blurb: "Confirmed halal by the community — not officially certified.",
  reasons: ["83 community halal confirmations."],
};

const declared = {
  score: 42,
  tier: "declared",
  label: "Self-declared",
  blurb: "Self-declared by the business — not certified.",
  reasons: ["Self-declared by the business — not certified."],
};

export const MuisCertified = () => (
  <div style={{ maxWidth: 160 }}>
    <HalalConfidenceRing score={muis} />
  </div>
);

export const AdminVerified = () => (
  <div style={{ maxWidth: 160 }}>
    <HalalConfidenceRing score={admin} />
  </div>
);

export const CommunityConfirmed = () => (
  <div style={{ maxWidth: 160 }}>
    <HalalConfidenceRing score={community} />
  </div>
);

export const SelfDeclared = () => (
  <div style={{ maxWidth: 160 }}>
    <HalalConfidenceRing score={declared} />
  </div>
);
