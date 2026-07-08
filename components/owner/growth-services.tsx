"use client";

/* Owner-facing Growth Partner / Onnifyworks card (growth plan Part 2).
   OWNER SURFACES ONLY — never rendered on consumer pages; the directory's
   consumer trust posture stays agency-free. Copy from
   docs/roadmap/halal-ecosystem-growth.md. */

import { Icon } from "../ui";

export function GrowthServicesCard({ onContact }: { onContact: () => void }) {
  return (
    <div className="card mt20" style={{ padding: 20, display: "flex", gap: 16, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
      <div style={{ flex: 1, minWidth: 240 }}>
        <div className="flex g8 center">
          <span className="attn-ico"><Icon name="trend" size={17} /></span>
          <h3 style={{ fontSize: "1.05rem" }}>Want this handled for you?</h3>
        </div>
        <p className="muted" style={{ fontSize: ".9rem", marginTop: 8, lineHeight: 1.55 }}>
          <strong>Humble Halal Growth Partner</strong> — managed marketing by <strong>Onnifyworks</strong>, our
          in-house growth team. We run the campaigns and send you the enquiries; you run your business.
          From S$299/mo.
        </p>
      </div>
      <button className="btn btn-outline btn-sm" onClick={onContact}>
        Ask about Growth Partner <Icon name="arrow" size={15} />
      </button>
    </div>
  );
}
