"use client";

/* Fidyah calculator (Singapore). Fidyah compensates fasts a person is
   permanently unable to make up (e.g. chronic illness, old age) — one meal fed
   to the needy per missed day. MUIS SG rate 2026: $4.00 per day. Computes on
   the client; nothing stored. Rate changes yearly — confirm on the MUIS site. */
import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui";

const RATE_YEAR = "2026";
const RATE_PER_DAY = 4; // MUIS Singapore fidyah rate, 2026 (confirm on muis.gov.sg)

export function FidyahTool() {
  const [days, setDays] = useState(0);
  const total = Math.max(0, days) * RATE_PER_DAY;

  return (
    <div className="card" style={{ padding: 20, maxWidth: 560 }}>
      <div className="field">
        <label htmlFor="fd-days">Number of fasts you are unable to make up</label>
        <input
          id="fd-days" className="input" type="number" min={0} inputMode="numeric"
          value={days} onChange={(e) => setDays(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
        />
        <span className="hint">Count the days of fasting you genuinely cannot replace — e.g. due to chronic illness or old age.</span>
      </div>

      <div className="card" aria-live="polite" style={{ marginTop: 18, padding: 16, background: "var(--emerald-50)", border: "1px solid var(--emerald-100)", display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
        <span style={{ fontWeight: 700 }}>Total Fidyah due</span>
        <span style={{ fontFamily: "var(--serif)", fontSize: "1.8rem", fontWeight: 800, color: "var(--emerald)" }}>S${total.toFixed(2)}</span>
        <span className="hint" style={{ width: "100%" }}>{Math.max(0, days)} {days === 1 ? "day" : "days"} × S${RATE_PER_DAY} (rate for {RATE_YEAR})</span>
      </div>

      <p className="faint" style={{ fontSize: ".84rem", marginTop: 14 }}>
        Fidyah is for fasts that <strong>cannot</strong> be made up. If you are simply making up (qada') missed fasts you
        are able to fast later, fidyah is generally not required — check your situation with a knowledgeable person. The
        MUIS SG rate for {RATE_YEAR} is S${RATE_PER_DAY}/day and changes yearly; confirm and pay via{" "}
        <a className="link-inline" href="https://www.zakat.sg" target="_blank" rel="noopener noreferrer">zakat.sg</a> or MUIS. See also the{" "}
        <Link className="link-inline" href="/tools/zakat-fitrah">Zakat Fitrah calculator</Link>.
      </p>
      <p className="faint" style={{ fontSize: ".8rem", marginTop: 6 }}><Icon name="shield-check" size={12} /> Private — runs in your browser; nothing is saved or sent.</p>
    </div>
  );
}
