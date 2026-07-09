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

/* Circular score ring (mock-up spec) — the at-a-glance "88/100 · High
   Confidence" dial shown in the listing header. Same HalalRank score as the
   chip; the visible tier label keeps FAQPage/AIO copy consistent. */
export function HalalConfidenceRing(props: Props) {
  const hs: HalalScore = props.score ?? scoreListing(props.item);
  const tone = scoreTone(hs.tier);
  const R = 30;
  const C = 2 * Math.PI * R;
  const filled = (Math.max(0, Math.min(100, hs.score)) / 100) * C;
  return (
    <div
      className="hc-ring"
      role="img"
      aria-label={`Halal confidence score ${hs.score} out of 100 — ${hs.label}. ${hs.blurb}`}
      title={hs.blurb}
    >
      <svg viewBox="0 0 72 72" width="72" height="72" aria-hidden="true">
        <circle cx="36" cy="36" r={R} fill="none" stroke="var(--line)" strokeWidth="5" />
        <circle
          cx="36" cy="36" r={R} fill="none"
          stroke={tone} strokeWidth="5" strokeLinecap="round"
          strokeDasharray={`${filled} ${C - filled}`}
          transform="rotate(-90 36 36)"
        />
        <text x="36" y="34" textAnchor="middle" fontSize="19" fontWeight="800" fill="var(--ink)">{hs.score}</text>
        <text x="36" y="47" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="var(--ink-faint)">/100</text>
      </svg>
      <span className="hc-ring-label" style={{ color: tone }}>{hs.label}</span>
    </div>
  );
}
