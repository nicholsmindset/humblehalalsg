"use client";

/* Admin — Halal verdicts review queue. Draft a verdict with the AI, then review
   the pending queue and approve/reject. Approving publishes to /is-halal/[slug]
   (a 'halal' verdict is blocked unless it cites an official source — enforced
   server-side). NEVER auto-publishes. */

import { useCallback, useEffect, useState } from "react";
import { Icon } from "../ui";

type Verdict = {
  id: string; slug: string; name: string; page_type: string;
  verdict: string; confidence: string; verdict_label: string | null; cert_status: string | null;
  one_line_answer: string | null; confidence_explainer: string | null;
  why_verdict: string[]; ingredient_table: { name: string; status: string; note?: string }[];
  official_sources: { body: string; claim: string; url: string }[];
  alternatives: string[]; date_reviewed: string | null;
};

const TONE: Record<string, string> = { halal: "green", likely: "amber", mashbooh: "amber", depends: "amber", haram: "red" };

export function AdminVerdicts({ toast }: { toast: (m: string) => void }) {
  const [rows, setRows] = useState<Verdict[] | null>(null);
  const [busy, setBusy] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [form, setForm] = useState({ pageType: "brand", name: "", ingredientList: "", knownCertifications: "", manufacturingCountries: "" });

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/verdicts?status=pending");
      const d = await res.json();
      setRows(Array.isArray(d.verdicts) ? d.verdicts : []);
    } catch { setRows([]); }
  }, []);

  useEffect(() => { let alive = true; (async () => { if (alive) await load(); })(); return () => { alive = false; }; }, [load]);

  const draft = async () => {
    if (!form.name.trim()) return toast("Enter a brand/ingredient name");
    setDrafting(true);
    try {
      const res = await fetch("/api/admin/verdicts/draft", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const d = await res.json();
      if (!res.ok || !d.ok) {
        toast(d.error === "ai_not_configured" ? "AI gateway not configured" : d.error === "not_enabled" ? "Enable HALAL_VERDICTS_ENABLED first" : "Draft failed");
      } else {
        toast(`Drafted: ${d.verdict} (${d.confidence})`);
        setForm((f) => ({ ...f, name: "", ingredientList: "" }));
        await load();
      }
    } catch { toast("Draft failed"); }
    setDrafting(false);
  };

  const act = async (id: string, action: "approve" | "reject") => {
    setBusy(id);
    try {
      const res = await fetch("/api/admin/verdicts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, action }) });
      const d = await res.json();
      if (res.status === 409 && d.error === "compliance_blocked") toast(d.reason || "Blocked: cite a source for a halal verdict");
      else if (!res.ok || !d.ok) toast("Action failed");
      else { toast(action === "approve" ? "Approved & published" : "Rejected"); await load(); }
    } catch { toast("Action failed"); }
    setBusy("");
  };

  return (
    <div className="stack g16">
      <div className="notice notice-warn">
        <span><strong>Human-in-the-loop:</strong> AI drafts; nothing publishes until you approve. A “halal” verdict is blocked unless it cites an official certification source. Every page carries the MUIS-verify disclaimer.</span>
      </div>

      {/* Draft form */}
      <div className="card" style={{ padding: 16 }}>
        <h3 style={{ fontSize: "1.1rem", marginBottom: 10 }}>Draft a verdict</h3>
        <div className="grid2" style={{ gap: 10 }}>
          <div className="field">
            <label htmlFor="v-type">Type</label>
            <select id="v-type" className="select" value={form.pageType} onChange={(e) => setForm((f) => ({ ...f, pageType: e.target.value }))}>
              <option value="brand">Brand / product</option>
              <option value="ingredient">Ingredient</option>
              <option value="enumber">E-number</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="v-name">Name</label>
            <input id="v-name" className="input" placeholder="e.g. Oreo, gelatin, E120" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
        </div>
        <div className="field">
          <label htmlFor="v-ing">Ingredient list <span className="hint">(paste off the packet — optional)</span></label>
          <textarea id="v-ing" className="textarea" rows={3} value={form.ingredientList} onChange={(e) => setForm((f) => ({ ...f, ingredientList: e.target.value }))} />
        </div>
        <div className="grid2" style={{ gap: 10 }}>
          <div className="field">
            <label htmlFor="v-cert">Known certifications</label>
            <input id="v-cert" className="input" placeholder="e.g. MUI Indonesia, or none" value={form.knownCertifications} onChange={(e) => setForm((f) => ({ ...f, knownCertifications: e.target.value }))} />
          </div>
          <div className="field">
            <label htmlFor="v-country">Manufacturing countries</label>
            <input id="v-country" className="input" placeholder="e.g. Indonesia, India" value={form.manufacturingCountries} onChange={(e) => setForm((f) => ({ ...f, manufacturingCountries: e.target.value }))} />
          </div>
        </div>
        <button className="btn btn-primary btn-sm" disabled={drafting} onClick={draft}><Icon name="sparkles" size={15} /> {drafting ? "Drafting…" : "Draft with AI"}</button>
      </div>

      {/* Pending queue */}
      <h3 style={{ fontSize: "1.1rem" }}>Pending review</h3>
      {rows === null ? (
        <div className="card" style={{ padding: 24, height: 90, opacity: 0.5 }} aria-busy="true" />
      ) : rows.length === 0 ? (
        <div className="card" style={{ padding: 22, textAlign: "center" }}><p className="faint">No verdicts pending. Draft one above.</p></div>
      ) : (
        rows.map((v) => (
          <div key={v.id} className="card" style={{ padding: 16 }}>
            <div className="flex between center wrap g8">
              <div className="flex g8 center">
                <strong>{v.name}</strong>
                <span className={`pill-tag ${TONE[v.verdict] || "amber"}`}>{v.verdict_label || v.verdict}</span>
                <span className="faint" style={{ fontSize: ".78rem" }}>{v.confidence} confidence · {v.cert_status}</span>
              </div>
              <code style={{ fontSize: ".78rem", color: "var(--ink-soft,#5b6d64)" }}>/is-halal/{v.slug}</code>
            </div>
            {v.one_line_answer && <p className="muted" style={{ marginTop: 8, fontSize: ".9rem" }}>{v.one_line_answer}</p>}
            {v.official_sources.length > 0 ? (
              <p className="faint" style={{ marginTop: 6, fontSize: ".82rem" }}><Icon name="shield-check" size={13} /> {v.official_sources.length} cited source{v.official_sources.length === 1 ? "" : "s"}</p>
            ) : v.verdict === "halal" ? (
              <p className="field-error" style={{ marginTop: 6, fontSize: ".82rem" }}><Icon name="warning" size={13} /> No source cited — a halal verdict cannot be approved</p>
            ) : null}
            <details style={{ marginTop: 8 }}>
              <summary className="faint" style={{ fontSize: ".82rem", cursor: "pointer" }}>Full draft — review before approving</summary>
              <div className="stack g6" style={{ marginTop: 8, fontSize: ".85rem" }}>
                {v.why_verdict.length > 0 && (
                  <div><strong>Why:</strong>{v.why_verdict.map((p, i) => <p key={i} className="muted" style={{ marginTop: 2 }}>{p}</p>)}</div>
                )}
                {v.confidence_explainer && <p className="faint"><strong>Confidence:</strong> {v.confidence_explainer}</p>}
                {v.ingredient_table.length > 0 && (
                  <div><strong>Ingredients:</strong>
                    <ul className="faint" style={{ marginTop: 4, paddingLeft: 18 }}>
                      {v.ingredient_table.map((r, i) => <li key={i}>{r.name} — {r.status}{r.note ? ` (${r.note})` : ""}</li>)}
                    </ul>
                  </div>
                )}
                {v.official_sources.length > 0 && (
                  <div><strong>Sources:</strong>
                    <ul className="faint" style={{ marginTop: 4, paddingLeft: 18 }}>
                      {v.official_sources.map((s, i) => <li key={i}>{s.body}: {s.claim}{s.url ? ` (${s.url})` : ""}</li>)}
                    </ul>
                  </div>
                )}
                {v.alternatives.length > 0 && <p className="faint"><strong>Alternatives:</strong> {v.alternatives.join(", ")}</p>}
              </div>
            </details>
            <div className="flex g8 wrap" style={{ marginTop: 12 }}>
              <button className="btn btn-primary btn-sm" disabled={busy === v.id} onClick={() => act(v.id, "approve")}><Icon name="check" size={15} /> Approve &amp; publish</button>
              <button className="btn btn-ghost btn-sm" disabled={busy === v.id} onClick={() => act(v.id, "reject")}>Reject</button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
