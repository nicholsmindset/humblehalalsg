"use client";

/* Islamic inheritance (Faraid) calculator UI. Uses the verified pure function in
   lib/tools/faraid.ts (unit-tested against textbook cases). Scope is limited to
   spouse + parents + children with 'awl/radd and the 'Umariyyatayn case — other
   heirs (siblings, grandparents, etc.) and bequests/debts are out of scope, so
   the disclaimers below are essential. Computes on the client; nothing stored. */
import { useMemo, useState } from "react";
import { Icon } from "@/components/ui";
import { computeFaraid, type Heirs } from "@/lib/tools/faraid";

export function InheritanceTool() {
  const [spouse, setSpouse] = useState<Heirs["spouse"]>("none");
  const [father, setFather] = useState(false);
  const [mother, setMother] = useState(false);
  const [sons, setSons] = useState(0);
  const [daughters, setDaughters] = useState(0);
  const [estate, setEstate] = useState("");

  const result = useMemo(
    () => computeFaraid({ spouse, father, mother, sons, daughters }),
    [spouse, father, mother, sons, daughters],
  );
  const estateNum = Math.max(0, Number(estate) || 0);
  const anyHeir = spouse !== "none" || father || mother || sons > 0 || daughters > 0;

  const stepper = (label: string, value: number, set: (n: number) => void, id: string) => (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="inh-stepper">
        <button type="button" className="btn btn-outline btn-sm" onClick={() => set(Math.max(0, value - 1))} aria-label={`Fewer ${label}`}><Icon name="minus" size={15} /></button>
        <input id={id} className="input" type="number" min={0} value={value} onChange={(e) => set(Math.max(0, Number(e.target.value) || 0))} />
        <button type="button" className="btn btn-outline btn-sm" onClick={() => set(value + 1)} aria-label={`More ${label}`}><Icon name="plus" size={15} /></button>
      </div>
    </div>
  );

  return (
    <div className="inheritance">
      <div className="inh-inputs">
        <div className="field">
          <label htmlFor="inh-spouse">Surviving spouse</label>
          <select id="inh-spouse" className="select" value={spouse} onChange={(e) => setSpouse(e.target.value as Heirs["spouse"])}>
            <option value="none">None</option>
            <option value="husband">Husband</option>
            <option value="wife">Wife</option>
          </select>
        </div>
        {stepper("Sons", sons, setSons, "inh-sons")}
        {stepper("Daughters", daughters, setDaughters, "inh-daughters")}
        <label className="inh-check">
          <input type="checkbox" checked={father} onChange={(e) => setFather(e.target.checked)} /> Father alive
        </label>
        <label className="inh-check">
          <input type="checkbox" checked={mother} onChange={(e) => setMother(e.target.checked)} /> Mother alive
        </label>
        <div className="field">
          <label htmlFor="inh-estate">Estate value (optional)</label>
          <input id="inh-estate" className="input" type="number" min={0} inputMode="decimal" placeholder="e.g. 100000" value={estate} onChange={(e) => setEstate(e.target.value)} />
          <span className="hint">After debts and any bequest (up to 1/3).</span>
        </div>
      </div>

      <div className="inh-result card" aria-live="polite">
        {!anyHeir ? (
          <p className="muted">Add at least one heir to see the distribution.</p>
        ) : result.shares.length === 0 ? (
          <p className="muted">No fixed or residuary share applies to these heirs in this simplified model.</p>
        ) : (
          <>
            <div className="tbl-scroll">
              <table className="tbl inh-table">
                <thead><tr><th>Heir</th><th>Share</th>{estateNum > 0 && <th>Amount</th>}</tr></thead>
                <tbody>
                  {result.shares.map((s) => (
                    <tr key={s.heir}>
                      <td><strong>{s.heir}</strong><div className="faint" style={{ fontSize: ".78rem" }}>{s.basis}</div></td>
                      <td>{(s.fraction * 100).toFixed(2)}%</td>
                      {estateNum > 0 && <td>{(s.fraction * estateNum).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {result.note && <p className="faint inh-note"><Icon name="info" size={14} /> {result.note}</p>}
          </>
        )}
      </div>

      <div className="inh-disclaimer">
        <strong>Educational only — not a fatwa.</strong> This simplified calculator covers a spouse, parents,
        sons and daughters (with proportional reduction (awl), return of surplus (radd) and the Umariyyatayn
        case). It does <em>not</em> handle siblings,
        grandparents, grandchildren, multiple wives, bequests, debts, or other situations. Distribute a real
        estate only with a qualified faraid specialist.
      </div>
    </div>
  );
}
