"use client";

/* Humble Halal — Halal Confidence badge.
   Surfaces the existing HalalRank score (lib/halal-score) as a band-coloured chip
   with the score + label and an expandable "Why this score" panel listing the
   reasons. Accepts a Listing (computes via scoreListing) or a precomputed
   { score, tier, label, reasons } so it's reusable on SEO/halal pages too. */
import { useId, useState } from "react";
import type { Listing } from "@/lib/types";
import { scoreListing, scoreTone, type HalalScore } from "@/lib/halal-score";
import { Icon } from "./ui";

type Props =
  | { item: Listing; score?: never }
  | { item?: never; score: HalalScore };

export function HalalConfidenceBadge(props: Props) {
  const hs: HalalScore = props.score ?? scoreListing(props.item);
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const tone = scoreTone(hs.tier);

  return (
    <div className="hc-badge">
      <button
        type="button"
        className="hc-chip"
        style={{ borderColor: tone }}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="hc-score" style={{ background: tone, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name={badgeIcon(hs.tier)} size={15} />
        </span>
        <span className="hc-label">{hs.label}</span>
        <span className="hc-sub">Halal verification</span>
        <Icon name="chevron" size={16} className={`hc-caret ${open ? "up" : ""}`} />
      </button>
      {open && (
        <div className="hc-panel" id={panelId} role="region" aria-label="Why this halal-confidence score">
          <p className="hc-blurb">{hs.blurb}</p>
          {hs.reasons.length > 0 && (
            <ul className="hc-reasons">
              {hs.reasons.map((r, i) => (
                <li key={i}><Icon name="check" size={14} /> {r}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

/** Tier → header/badge icon. A shield for certified/register tiers, a check for
 *  community/self-declared, a warning for a changed status. */
function badgeIcon(tier: HalalScore["tier"]): string {
  if (tier === "muis" || tier === "muis-listed" || tier === "admin") return "shield-check";
  if (tier === "reported") return "warning";
  return "check";
}

/* Listing-header trust badge. Leads with the tier LABEL (not a 0–100 number):
   a small number next to the word "halal" reads as "42% halal / barely halal",
   which unfairly undersells genuinely-halal-but-uncertified places. The label
   ("MUIS Certified" / "Community Confirmed" / "Self-declared") is honest and
   clear; the numeric score lives only in the expandable "why" panel/tooltip. */
export function HalalConfidenceRing(props: Props) {
  const hs: HalalScore = props.score ?? scoreListing(props.item);
  const tone = scoreTone(hs.tier);
  return (
    <div
      className="hc-ring"
      role="img"
      aria-label={`Halal verification: ${hs.label}. ${hs.blurb}`}
      title={hs.blurb}
    >
      <span
        aria-hidden="true"
        style={{
          width: 52, height: 52, borderRadius: "50%", background: tone, color: "#fff",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
        }}
      >
        <Icon name={badgeIcon(hs.tier)} size={26} />
      </span>
      <span className="hc-ring-label" style={{ color: tone }}>{hs.label}</span>
    </div>
  );
}
