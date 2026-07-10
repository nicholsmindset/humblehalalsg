"use client";

/* "Trust at a glance" (mock-up spec, v2) — a compact single row of four mini
   status cards: MUIS Certified / Admin Verified / Muslim-Owned / Halal-Friendly.
   The listing page is about the BUSINESS, so trust reads as a quick positive
   summary, not a wall of "Not verified" rows — unverified states say
   "Not enough info" with the detail one tap away (ⓘ tooltip), and the honest
   distinction is never dropped: an unbacked MUIS claim shows "Pending",
   never "Certified". */
import type { Listing } from "@/lib/types";
import { halalSgVerifyUrl } from "@/lib/muis";
import { muisUnbacked } from "@/lib/halal-score";
import { Icon } from "./ui";

interface Cell {
  key: string;
  icon: string;
  label: string;
  state: "yes" | "pending" | "info";
  verdict: string;
  tip: string;
  href?: string;
}

export function TrustAtAGlance({ item }: { item: Listing }) {
  const muisClaim = item.certBody === "MUIS";
  const muisPending = muisClaim && muisUnbacked(item);
  const muis = muisClaim && !muisPending;
  const admin = item.certBody === "Humble Halal" || item.badges.includes("admin");
  const owned = item.badges.includes("owned");
  const friendly = item.badges.includes("friendly");

  const cells: Cell[] = [
    {
      key: "muis",
      icon: "shield-check",
      label: "MUIS Certified",
      state: muis ? "yes" : muisPending ? "pending" : "info",
      verdict: muis ? "Certified" : muisPending ? "Pending" : "Not enough info",
      tip: muis
        ? `Holds official MUIS halal certification${item.verify?.certNo ? ` (cert ${item.verify.certNo})` : ""} — verify on HalalSG.`
        : muisPending
          ? "Claimed by the business but the certificate isn't on file yet — we only show the badge once it is. Check HalalSG."
          : "No MUIS certificate on record for this business.",
      href: muisClaim ? halalSgVerifyUrl(item.verify?.certNo, item.name) : undefined,
    },
    {
      key: "admin",
      icon: "badge-check",
      label: "Admin Verified",
      state: admin ? "yes" : "info",
      verdict: admin ? "Verified" : "Not enough info",
      tip: admin
        ? "Documents checked by the Humble Halal team (a trust signal, not MUIS certification)."
        : "Not yet reviewed by the Humble Halal team.",
    },
    {
      key: "owned",
      icon: "store",
      label: "Muslim-Owned",
      state: owned ? "yes" : "info",
      verdict: owned ? "Yes" : "Not enough info",
      tip: owned ? "Confirmed Muslim-owned business." : "Ownership hasn't been verified.",
    },
    {
      key: "friendly",
      icon: "heart",
      label: "Halal-Friendly",
      state: friendly ? "yes" : "info",
      verdict: friendly ? "Self-declared" : "Not enough info",
      tip: friendly
        ? "Self-declared by the business — not a certification."
        : muis || admin
          ? "Superseded by the verified status."
          : "No self-declaration recorded.",
    },
  ];

  return (
    <section className="tg2" aria-label="Halal trust status at a glance">
      <div className="tg2-head">
        <Icon name="shield-check" size={16} />
        <strong>Trust at a glance</strong>
        <span className="muted">Based on verification checks and community feedback.</span>
      </div>
      <div className="tg2-row" role="list">
        {cells.map((c) => {
          const inner = (
            <>
              <span className={`tg2-ico tg2-${c.state}`}><Icon name={c.icon} size={16} /></span>
              <span className="tg2-label">{c.label}</span>
              <span className={`tg2-verdict tg2-v-${c.state}`}>
                {c.verdict}
                {c.state === "yes" ? <Icon name="check" size={11} /> : <span aria-hidden="true" className="tg2-i">i</span>}
              </span>
            </>
          );
          return c.href ? (
            <a key={c.key} role="listitem" className="tg2-cell" href={c.href} target="_blank" rel="noopener noreferrer" title={`${c.tip} Opens HalalSG.`}>
              {inner}
            </a>
          ) : (
            <span key={c.key} role="listitem" className="tg2-cell" title={c.tip} tabIndex={0} aria-label={`${c.label}: ${c.verdict}. ${c.tip}`}>
              {inner}
            </span>
          );
        })}
      </div>
    </section>
  );
}
