"use client";

/* "Trust at a glance" (mock-up spec) — the explicit 4-row halal-status
   checklist on listing pages: MUIS Certified / Admin Verified / Muslim-Owned /
   Halal-Friendly, each with an honest verified / not-verified state. This is
   deliberately a CHECKLIST, not badges: showing what a place is NOT verified
   for is the trust product. */
import type { Listing } from "@/lib/types";
import { halalSgVerifyUrl } from "@/lib/muis";
import { muisUnbacked } from "@/lib/halal-score";
import { Icon } from "./ui";

interface Row {
  key: string;
  label: string;
  sub: string;
  state: "yes" | "no" | "self";
  href?: string;
  hrefLabel?: string;
}

export function TrustAtAGlance({ item }: { item: Listing }) {
  // A MUIS claim WITHOUT a certificate number on file is unbacked — show it as
  // pending/self-declared, never as a verified "Yes" (lib/halal-score policy).
  const muisClaim = item.certBody === "MUIS";
  const muisPending = muisClaim && muisUnbacked(item);
  const muis = muisClaim && !muisPending;
  const admin = item.certBody === "Humble Halal" || item.badges.includes("admin");
  const owned = item.badges.includes("owned");
  const friendly = item.badges.includes("friendly");

  const rows: Row[] = [
    {
      key: "muis",
      label: "MUIS Certified",
      sub: muis
        ? item.verify?.certNo
          ? `Cert ${item.verify.certNo}`
          : "Holds official MUIS halal certification"
        : muisPending
          ? "Claimed by the business — certificate not yet on file"
          : "No MUIS certificate on record",
      state: muis ? "yes" : muisPending ? "self" : "no",
      href: muisClaim ? halalSgVerifyUrl(item.verify?.certNo, item.name) : undefined,
      hrefLabel: muis ? "view on HalalSG" : "check HalalSG",
    },
    {
      key: "admin",
      label: "Admin Verified",
      sub: admin ? "Documents checked by the Humble Halal team" : "Not yet reviewed by our team",
      state: admin ? "yes" : "no",
    },
    {
      key: "owned",
      label: "Muslim-Owned",
      sub: owned ? "Confirmed Muslim-owned business" : "Ownership not verified",
      state: owned ? "yes" : "no",
    },
    {
      key: "friendly",
      label: "Halal-Friendly",
      sub: friendly
        ? "Self-declared by the business — not a certification"
        : muis || admin
          ? "Superseded by verified status above"
          : "No self-declaration recorded",
      state: friendly ? "self" : "no",
    },
  ];

  return (
    <div className="tg-card" role="list" aria-label="Halal trust status at a glance">
      <div className="tg-head">
        <Icon name="shield-check" size={16} /> Trust at a glance
      </div>
      {rows.map((r) => (
        <div key={r.key} className={`tg-row tg-${r.state}`} role="listitem">
          <span className="tg-state" aria-hidden="true">
            {r.state === "yes" ? <Icon name="check" size={13} /> : r.state === "self" ? "~" : "–"}
          </span>
          <span className="tg-label">{r.label}</span>
          <span className="tg-sub">
            {r.sub}
            {r.href && (
              <>
                {" · "}
                <a href={r.href} target="_blank" rel="noopener noreferrer" className="link-inline">{r.hrefLabel}</a>
              </>
            )}
          </span>
          <span className="tg-verdict">{r.state === "yes" ? "Yes" : r.state === "self" ? (r.key === "muis" ? "Pending" : "Self-declared") : "Not verified"}</span>
        </div>
      ))}
    </div>
  );
}
