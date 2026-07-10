"use client";

/* Zakat Fitrah calculator (Singapore). Fitrah is paid per person before the Eid
   prayer. MUIS sets the SG rate annually — 1447H / 2026: $5 (normal) or $8
   (higher grade). Computes on the client; nothing stored. Rates change yearly,
   so we show the year and point users to confirm on the official channel. */
import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui";

const RATE_YEAR = "1447H (2026)";
const RATES = { normal: 5, higher: 8 } as const;
type Grade = keyof typeof RATES;

export function ZakatFitrahTool() {
  const [persons, setPersons] = useState(1);
  const [grade, setGrade] = useState<Grade>("normal");
  const rate = RATES[grade];
  const total = Math.max(0, persons) * rate;

  return (
    <div className="card" style={{ padding: 20, maxWidth: 560 }}>
      <div className="field">
        <label htmlFor="zf-persons">Number of people in your household</label>
        <input
          id="zf-persons" className="input" type="number" min={0} inputMode="numeric"
          value={persons} onChange={(e) => setPersons(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
        />
        <span className="hint">Fitrah is paid on behalf of each person — including dependants and children.</span>
      </div>

      <div className="field" style={{ marginTop: 14 }}>
        <label>Rate · {RATE_YEAR}</label>
        <div className="pillbar">
          <button type="button" className={`chip ${grade === "normal" ? "active" : ""}`} aria-pressed={grade === "normal"} onClick={() => setGrade("normal")}>
            Normal · ${RATES.normal}/person
          </button>
          <button type="button" className={`chip ${grade === "higher" ? "active" : ""}`} aria-pressed={grade === "higher"} onClick={() => setGrade("higher")}>
            Higher grade · ${RATES.higher}/person
          </button>
        </div>
        <span className="hint">The higher rate is voluntary — it corresponds to a better grade of staple rice.</span>
      </div>

      <div className="card" aria-live="polite" style={{ marginTop: 18, padding: 16, background: "var(--emerald-50)", border: "1px solid var(--emerald-100)", display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
        <span style={{ fontWeight: 700 }}>Total Zakat Fitrah due</span>
        <span style={{ fontFamily: "var(--serif)", fontSize: "1.8rem", fontWeight: 800, color: "var(--emerald)" }}>S${total.toFixed(2)}</span>
        <span className="hint" style={{ width: "100%" }}>{Math.max(0, persons)} {persons === 1 ? "person" : "people"} × S${rate}</span>
      </div>

      <p className="faint" style={{ fontSize: ".84rem", marginTop: 14 }}>
        Rates are set by MUIS each year and may change — this uses the {RATE_YEAR} rates. Pay before the Eid prayer via
        an official MUIS channel, and confirm the current rate on{" "}
        <a className="link-inline" href="https://www.zakat.sg" target="_blank" rel="noopener noreferrer">zakat.sg</a>. See also
        the <Link className="link-inline" href="/tools/zakat">Zakat (harta) calculator</Link> for zakat on wealth and the{" "}
        <Link className="link-inline" href="/tools/fidyah">Fidyah calculator</Link>.
      </p>
      <p className="faint" style={{ fontSize: ".8rem", marginTop: 6 }}><Icon name="shield-check" size={12} /> Private — runs in your browser; nothing is saved or sent.</p>
    </div>
  );
}
