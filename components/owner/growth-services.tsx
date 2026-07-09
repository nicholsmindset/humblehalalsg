"use client";

/* Owner-facing Growth Partner / Onnifyworks card (growth plan Part 2).
   OWNER SURFACES ONLY — never rendered on consumer pages; the directory's
   consumer trust posture stays agency-free. Copy from
   docs/roadmap/halal-ecosystem-growth.md. */

import { Icon } from "../ui";

export function GrowthServicesCard({ onContact }: { onContact: () => void }) {
  return (
    <div className="growth-card mt20">
      <div style={{ flex: 1, minWidth: 240 }}>
        <div className="flex g10 center">
          <span className="growth-card-ico"><Icon name="trend" size={18} /></span>
          <div>
            <span className="eyebrow" style={{ color: "var(--gold)" }}>Managed growth</span>
            <h3 style={{ fontSize: "1.2rem", marginTop: 3 }}>Want this handled for you?</h3>
          </div>
        </div>
        <p className="muted" style={{ fontSize: ".9rem", marginTop: 8, lineHeight: 1.55 }}>
          <strong>Humble Halal Growth Partner</strong> — managed marketing by <strong>Onnifyworks</strong>, our
          in-house growth team. We run the campaigns and send you the enquiries; you run your business.
          From S$299/mo.
        </p>
      </div>
      <button className="btn btn-gold" onClick={onContact}>
        Start 3-step intake <Icon name="arrow" size={15} />
      </button>
    </div>
  );
}
