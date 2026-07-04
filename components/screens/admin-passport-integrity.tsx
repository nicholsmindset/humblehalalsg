"use client";

/* Admin — Passport integrity. Detective control over the loyalty economy:
   accounts ranked by recent earning velocity with a source breakdown, plus
   actions to freeze a suspected farmer (blocks further earning) and claw back
   farmed points. Complements the preventative controls (signed collect tokens,
   award-on-approval reviews, daily caps). */

import { useCallback, useEffect, useState } from "react";

type Row = {
  user_id: string; name: string | null; email: string | null;
  earned_recent: number; earned_total: number; balance: number;
  review_ct: number; visit_ct: number; follow_ct: number; save_ct: number; referral_ct: number;
  redeem_ct: number; last_earn: string | null; blocked: boolean;
};

// Heuristic worth-a-look flag (not a verdict) for the reviewer's eye.
function suspicious(r: Row): boolean {
  return r.earned_recent >= 400 || r.visit_ct >= 25 || r.follow_ct + r.save_ct >= 50;
}

export function AdminPassportIntegrity({ toast }: { toast: (m: string) => void }) {
  const [days, setDays] = useState(7);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    setRows(null);
    try {
      const d = await (await fetch(`/api/admin/passport?days=${days}`)).json();
      setRows(Array.isArray(d.accounts) ? d.accounts : []);
    } catch { setRows([]); }
  }, [days]);
  useEffect(() => { let alive = true; (async () => { if (alive) await load(); })(); return () => { alive = false; }; }, [load]);

  const act = async (userId: string, action: "block" | "unblock" | "adjust", extra?: { points?: number; reason?: string }) => {
    setBusy(userId);
    try {
      const res = await fetch("/api/admin/passport", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, action, ...extra }) });
      if (!res.ok) toast("Action failed"); else { toast(action === "adjust" ? "Points adjusted" : action === "block" ? "Account frozen" : "Account unfrozen"); await load(); }
    } catch { toast("Action failed"); }
    setBusy("");
  };

  const clawback = (r: Row) => {
    if (typeof window === "undefined") return;
    const raw = window.prompt(`Claw back how many points from ${r.name || r.email || r.user_id}? (balance ${r.balance}). Enter a positive number to remove.`);
    const n = Math.round(Number(raw));
    if (!n || n <= 0) return;
    void act(r.user_id, "adjust", { points: -n, reason: "Clawback (farming)" });
  };

  return (
    <div className="stack g14">
      <div className="notice notice-info">
        <span><strong>Detective view.</strong> Accounts by points earned in the window. The preventative controls (signed collect QR, review points on approval, daily caps) stop most farming — this catches what slips through. Freezing blocks further earning; clawback removes farmed points.</span>
      </div>

      <div className="flex g8">
        {[7, 30].map((d) => (
          <button key={d} className={`chip ${days === d ? "active" : ""}`} aria-pressed={days === d} onClick={() => setDays(d)}>Last {d} days</button>
        ))}
      </div>

      {rows === null ? (
        <div className="card" style={{ padding: 24, height: 120, opacity: 0.5 }} aria-busy="true" />
      ) : rows.length === 0 ? (
        <div className="card" style={{ padding: 22, textAlign: "center" }}><p className="faint">No passport activity yet.</p></div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="tbl" style={{ width: "100%", fontSize: ".86rem" }}>
            <thead><tr>
              <th style={{ textAlign: "left" }}>Member</th><th>Earned ({days}d)</th><th>Lifetime</th><th>Balance</th>
              <th>Reviews</th><th>Visits</th><th>Follows</th><th>Saves</th><th>Refs</th><th>Redeems</th><th></th>
            </tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.user_id} style={suspicious(r) && !r.blocked ? { background: "var(--gold-50,#fbf3df)" } : undefined}>
                  <td style={{ textAlign: "left" }}>
                    <div style={{ fontWeight: 600 }}>{r.name || "—"} {r.blocked && <span className="pill-tag red">frozen</span>} {suspicious(r) && !r.blocked && <span className="pill-tag amber">review</span>}</div>
                    <div className="faint" style={{ fontSize: ".76rem" }}>{r.email || r.user_id}</div>
                  </td>
                  <td style={{ textAlign: "center", fontWeight: 700 }}>{r.earned_recent}</td>
                  <td style={{ textAlign: "center" }}>{r.earned_total}</td>
                  <td style={{ textAlign: "center" }}>{r.balance}</td>
                  <td style={{ textAlign: "center" }}>{r.review_ct}</td>
                  <td style={{ textAlign: "center" }}>{r.visit_ct}</td>
                  <td style={{ textAlign: "center" }}>{r.follow_ct}</td>
                  <td style={{ textAlign: "center" }}>{r.save_ct}</td>
                  <td style={{ textAlign: "center" }}>{r.referral_ct}</td>
                  <td style={{ textAlign: "center" }}>{r.redeem_ct}</td>
                  <td>
                    <div className="flex g6 wrap" style={{ justifyContent: "flex-end" }}>
                      <button className="btn btn-ghost btn-sm" disabled={busy === r.user_id} onClick={() => clawback(r)}>Clawback</button>
                      {r.blocked
                        ? <button className="btn btn-soft btn-sm" disabled={busy === r.user_id} onClick={() => act(r.user_id, "unblock")}>Unfreeze</button>
                        : <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} disabled={busy === r.user_id} onClick={() => act(r.user_id, "block", { reason: "Suspected farming" })}>Freeze</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
