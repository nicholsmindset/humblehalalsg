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
        <span className="hc-score" style={{ background: tone }}>{hs.score}</span>
        <span className="hc-label">{hs.label}</span>
        <span className="hc-sub">Halal confidence</span>
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
