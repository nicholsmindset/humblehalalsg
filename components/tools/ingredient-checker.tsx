"use client";

/* Ingredient / E-number halal checker. In-memory search + status filter over a
   bounded reference dataset (lib/tools/ingredients). Renders the full list on
   first paint (client-component SSR) so every additive is crawlable, then
   filters live. Verdict UI mirrors /is-halal (.hs-pill / tone classes). */

import { useEffect, useMemo, useState } from "react";
import { Icon } from "../ui";
import { track } from "@/lib/analytics";
import { ADDITIVES, STATUS_META, searchAdditives, type AdditiveStatus } from "@/lib/tools/ingredients";

const FILTERS: { key: AdditiveStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "halal", label: "Halal" },
  { key: "mushbooh", label: "Doubtful" },
  { key: "haram", label: "Avoid" },
];

export function IngredientChecker() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<AdditiveStatus | "all">("all");
  const [open, setOpen] = useState<string>("");

  // Deep-link support (?q=E471 from the is-halal "check another" search) —
  // read client-side on mount so the page itself stays fully static.
  useEffect(() => {
    const q0 = new URLSearchParams(window.location.search).get("q");
    if (q0) setQ(q0);
  }, []);

  const results = useMemo(() => {
    const base = q.trim() ? searchAdditives(q) : ADDITIVES;
    return filter === "all" ? base : base.filter((a) => a.status === filter);
  }, [q, filter]);

  // Debounced search analytics (same idiom as the directory search).
  useEffect(() => {
    const term = q.trim();
    if (!term) return;
    const id = setTimeout(() => track.search(`additive:${term}`, results.length), 700);
    return () => clearTimeout(id);
  }, [q, results.length]);

  const rowKey = (code: string, name: string) => code || name;

  return (
    <div className="ing-checker">
      <div className="notice notice-info" style={{ marginBottom: 16 }}>
        <Icon name="info" size={18} />
        <span>
          This tells you the usual <strong>origin</strong> of an additive — it is general guidance, not certification.
          &ldquo;Doubtful&rdquo; means the source can be animal or plant, so check with the manufacturer. A product using
          only halal additives is still not halal-certified unless it&apos;s on the{" "}
          <a href="/verify" className="link-inline">MUIS HalalSG register</a>.
        </span>
      </div>

      <form className="searchbar" role="search" onSubmit={(e) => e.preventDefault()}>
        <Icon name="search" size={20} className="lead" />
        <input
          type="search" value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Search an E-number or name — e.g. E471, gelatine, carmine…"
          aria-label="Search an additive or E-number"
        />
      </form>

      <div className="pillbar" style={{ marginTop: 12 }}>
        {FILTERS.map((f) => (
          <button
            key={f.key} type="button"
            className={`chip ${filter === f.key ? "active" : ""}`} aria-pressed={filter === f.key}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
        <button type="button" className="chip" onClick={() => window.print()}><Icon name="doc" size={14} /> Print list</button>
      </div>

      <p className="faint" style={{ margin: "14px 0 8px", fontSize: ".84rem" }}>
        {results.length} additive{results.length === 1 ? "" : "s"}{q.trim() ? ` matching “${q.trim()}”` : ""}
      </p>

      {results.length === 0 ? (
        <div className="card" style={{ padding: 22, textAlign: "center" }}>
          <p className="faint">No additive found. Try the E-number (e.g. <strong>E471</strong>) or a common name (e.g. <strong>gelatine</strong>).</p>
        </div>
      ) : (
        <ul className="ing-list" style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {results.map((a) => {
            const m = STATUS_META[a.status];
            const key = rowKey(a.code, a.name);
            const isOpen = open === key;
            return (
              <li key={key} id={a.code || undefined} className="ing-item card" style={{ padding: 0, marginBottom: 8, overflow: "hidden" }}>
                <button
                  type="button" className="ing-row hs-row" aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? "" : key)}
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "13px 15px", background: "none", border: 0, textAlign: "left", cursor: "pointer" }}
                >
                  <span className="hs-row-name" style={{ fontWeight: 600 }}>
                    {a.code && <span style={{ color: "var(--emerald,#0e7a5f)", fontWeight: 700 }}>{a.code}</span>}{a.code ? " · " : ""}{a.name}
                  </span>
                  <span className={`hs-pill hs-${m.tone}`} style={{ flexShrink: 0 }}>{m.verdict}</span>
                </button>
                {isOpen && (
                  <div style={{ padding: "0 15px 14px", borderTop: "1px solid var(--line,#eee)" }}>
                    <p className="hs-answer" style={{ marginTop: 10 }}>{a.origin}</p>
                    {a.note && <p className="faint" style={{ marginTop: 6, fontSize: ".88rem" }}><Icon name="info" size={13} /> {a.note}</p>}
                    <div className="faint" style={{ marginTop: 8, fontSize: ".78rem", textTransform: "uppercase", letterSpacing: ".04em" }}>{a.category} · {m.label}</div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
