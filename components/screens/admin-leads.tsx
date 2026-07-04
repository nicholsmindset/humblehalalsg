"use client";

/* Admin lead pipeline — the beta control surface for the lead marketplace.
   Lists incoming quote requests with a matched-vendor preview, a one-click
   Route action, and spam/close. Coverage gaps (fewer than 3 matches) are
   flagged so the team knows which verticals/areas to pitch. */

import { useCallback, useEffect, useState } from "react";
import { Icon } from "../ui";

type Candidate = { id: string; name: string; plan: string | null; hasQuota: boolean };
type AdminLead = {
  id: string; name: string | null; vertical: string; verticalId: string | null;
  area: string | null; budget: string | null; when: string | null; details: string | null;
  status: string; consent: boolean; createdAt: string; sourceSlug: string | null;
  routes: { business_id: string; status: string }[];
  match: { count: number; gap: boolean; candidates: Candidate[] } | null;
};

const FILTERS: [string, string][] = [["new", "New"], ["routed", "Routed"], ["contacted", "In progress"], ["", "All"]];

export function AdminLeads({ toast }: { toast: (m: string) => void }) {
  const [status, setStatus] = useState("new");
  const [leads, setLeads] = useState<AdminLead[] | null>(null);
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    setLeads(null);
    try {
      const res = await fetch(`/api/admin/leads?status=${status}`);
      const d = await res.json();
      setLeads(Array.isArray(d.leads) ? d.leads : []);
    } catch { setLeads([]); }
  }, [status]);

  useEffect(() => { let alive = true; (async () => { if (alive) await load(); })(); return () => { alive = false; }; }, [load]);

  const act = async (id: string, action: string) => {
    setBusy(id);
    try {
      const res = await fetch("/api/admin/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, action }) });
      const d = await res.json();
      if (!res.ok || !d.ok) {
        toast(d.error === "no_consent" ? "Lead has no contact consent" : d.error === "no_matches" ? "No matching subscribed vendors" : "Action failed");
      } else {
        toast(action === "route" ? `Routed to ${d.routed} vendor${d.routed === 1 ? "" : "s"}` : action === "spam" ? "Marked spam" : "Closed");
        await load();
      }
    } catch { toast("Action failed"); }
    setBusy("");
  };

  if (leads === null) return <div className="card" style={{ padding: 24, height: 120, opacity: 0.5 }} aria-busy="true" />;

  return (
    <div className="stack g14">
      <div className="flex g8 wrap">
        {FILTERS.map(([v, l]) => (
          <button key={v} className={`chip ${status === v ? "active" : ""}`} aria-pressed={status === v} onClick={() => setStatus(v)}>{l}</button>
        ))}
      </div>

      {leads.length === 0 ? (
        <div className="card" style={{ padding: 28, textAlign: "center" }}>
          <p className="faint">No leads in this view.</p>
        </div>
      ) : (
        leads.map((l) => (
          <div key={l.id} className="card" style={{ padding: 16 }}>
            <div className="flex between center wrap g8">
              <div>
                <div className="flex g8 center">
                  <strong>{l.vertical}</strong>
                  {!l.consent && <span className="pill-tag red">No consent</span>}
                  {l.match?.gap && <span className="pill-tag amber">Coverage gap</span>}
                </div>
                <div className="faint" style={{ fontSize: ".82rem", marginTop: 2 }}>{[l.name, l.area, l.budget, l.when].filter(Boolean).join(" · ") || "—"}</div>
              </div>
              <span className="faint" style={{ fontSize: ".78rem" }}>{new Date(l.createdAt).toLocaleDateString("en-SG", { day: "numeric", month: "short" })}</span>
            </div>

            {l.details && <p className="muted" style={{ marginTop: 8, fontSize: ".88rem" }}>{l.details}</p>}

            {/* Matched-vendor preview (new leads) */}
            {l.match && (
              <div className="card" style={{ marginTop: 10, padding: "10px 12px", background: "var(--wash,#f8f6f0)" }}>
                {l.match.count > 0 ? (
                  <>
                    <div className="faint" style={{ fontSize: ".8rem", marginBottom: 6 }}>Would route to {l.match.count}:</div>
                    <div className="flex g6 wrap">
                      {l.match.candidates.map((c) => (
                        <span key={c.id} className="pill-tag" title={c.plan || "free"}>{c.name}{c.hasQuota ? " ✓" : ""}</span>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="faint" style={{ fontSize: ".82rem" }}>No subscribed vendors match this vertical/area yet — a pitch opportunity.</div>
                )}
              </div>
            )}

            {/* Routed vendors (already-routed leads) */}
            {!l.match && l.routes.length > 0 && (
              <div className="faint" style={{ fontSize: ".82rem", marginTop: 8 }}>
                Routed to {l.routes.length} · {l.routes.filter((r) => ["accepted", "contacted", "won"].includes(r.status)).length} accepted
              </div>
            )}

            <div className="flex g8 wrap" style={{ marginTop: 12 }}>
              {(l.status === "new" || l.status === "reviewing") && (
                <button className="btn btn-primary btn-sm" disabled={busy === l.id || !l.consent || (l.match?.count ?? 0) === 0} onClick={() => act(l.id, "route")}>
                  <Icon name="megaphone" size={15} /> Route to vendors
                </button>
              )}
              <button className="btn btn-ghost btn-sm" disabled={busy === l.id} onClick={() => act(l.id, "spam")}>Spam</button>
              <button className="btn btn-ghost btn-sm" disabled={busy === l.id} onClick={() => act(l.id, "close")}>Close</button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
