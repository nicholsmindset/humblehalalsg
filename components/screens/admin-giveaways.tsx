"use client";

/* Admin — Halal Passport giveaways. Create a monthly giveaway and draw a
   weighted-random winner (by entries). */

import { useCallback, useEffect, useState } from "react";
import { Icon } from "../ui";

type Giveaway = {
  id: string; title: string; description: string | null; period_month: string;
  entry_cost: number; status: string; winner_user_id: string | null; entrants: number; entries: number;
};

function thisMonth(): string {
  // Approximate current month label; admin can edit before creating.
  const d = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Singapore", year: "numeric", month: "2-digit" }).format(new Date());
  return d.slice(0, 7); // YYYY-MM
}

export function AdminGiveaways({ toast }: { toast: (m: string) => void }) {
  const [rows, setRows] = useState<Giveaway[] | null>(null);
  const [form, setForm] = useState({ title: "", description: "", entryCost: 50, month: thisMonth() });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try { const d = await (await fetch("/api/admin/giveaway")).json(); setRows(Array.isArray(d.giveaways) ? d.giveaways : []); } catch { setRows([]); }
  }, []);
  useEffect(() => { let alive = true; (async () => { if (alive) await load(); })(); return () => { alive = false; }; }, [load]);

  const create = async () => {
    if (!form.title.trim()) return toast("Add a title");
    setBusy(true);
    try {
      const res = await fetch("/api/admin/giveaway", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "create", ...form }) });
      const d = await res.json();
      if (d.error === "month_exists") toast("A giveaway already exists for that month");
      else if (!res.ok || !d.ok) toast("Couldn't create");
      else { toast("Giveaway created"); setForm((f) => ({ ...f, title: "", description: "" })); await load(); }
    } catch { toast("Couldn't create"); }
    setBusy(false);
  };

  const draw = async (id: string) => {
    if (typeof window !== "undefined" && !window.confirm("Draw a winner now? This closes the giveaway.")) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/giveaway", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "draw", id }) });
      const d = await res.json();
      if (d.error === "no_entries") toast("No entries to draw from");
      else if (!res.ok || !d.ok) toast("Couldn't draw");
      else { toast("Winner drawn 🎉"); await load(); }
    } catch { toast("Couldn't draw"); }
    setBusy(false);
  };

  return (
    <div className="stack g16">
      <div className="card" style={{ padding: 16 }}>
        <h3 style={{ fontSize: "1.1rem", marginBottom: 10 }}>Create a giveaway</h3>
        <div className="grid2" style={{ gap: 10 }}>
          <div className="field"><label htmlFor="g-title">Title</label><input id="g-title" className="input" placeholder="July halal dinner voucher" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} /></div>
          <div className="field"><label htmlFor="g-month">Month (YYYY-MM)</label><input id="g-month" className="input" value={form.month} onChange={(e) => setForm((f) => ({ ...f, month: e.target.value }))} /></div>
        </div>
        <div className="field"><label htmlFor="g-desc">Description</label><input id="g-desc" className="input" placeholder="Win a $50 voucher at a MUIS-certified restaurant" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></div>
        <div className="field" style={{ maxWidth: 200 }}><label htmlFor="g-cost">Entry cost (points)</label><input id="g-cost" type="number" className="input" value={form.entryCost} onChange={(e) => setForm((f) => ({ ...f, entryCost: Number(e.target.value) }))} /></div>
        <button className="btn btn-primary btn-sm" disabled={busy} onClick={create}><Icon name="plus" size={15} /> Create</button>
      </div>

      <h3 style={{ fontSize: "1.1rem" }}>Giveaways</h3>
      {rows === null ? (
        <div className="card" style={{ padding: 24, height: 80, opacity: 0.5 }} aria-busy="true" />
      ) : rows.length === 0 ? (
        <div className="card" style={{ padding: 22, textAlign: "center" }}><p className="faint">No giveaways yet.</p></div>
      ) : (
        rows.map((g) => (
          <div key={g.id} className="card" style={{ padding: 16 }}>
            <div className="flex between center wrap g8">
              <div>
                <div className="flex g8 center"><strong>{g.title}</strong><span className={`pill-tag ${g.status === "open" ? "green" : ""}`}>{g.status}</span></div>
                <div className="faint" style={{ fontSize: ".82rem", marginTop: 2 }}>{g.period_month} · {g.entry_cost} pts/entry · {g.entrants} entrants · {g.entries} entries</div>
                {g.winner_user_id && <div className="faint" style={{ fontSize: ".8rem", marginTop: 2 }}>Winner: {g.winner_user_id}</div>}
              </div>
              {g.status === "open" && <button className="btn btn-gold btn-sm" disabled={busy} onClick={() => draw(g.id)}><Icon name="trophy" size={15} /> Draw winner</button>}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
