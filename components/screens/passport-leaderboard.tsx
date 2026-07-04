"use client";

/* Halal Passport leaderboard — top members by earned points (month / all-time).
   Names appear only for members who made their passport public. */

import { useCallback, useEffect, useState } from "react";
import { useApp } from "../app-context";
import { Icon } from "../ui";

type Board = { rank: number; name: string; points: number; isPublic: boolean }[];

export function LeaderboardScreen() {
  const { navigate } = useApp();
  const [period, setPeriod] = useState<"month" | "all">("month");
  const [board, setBoard] = useState<Board | null>(null);
  const [me, setMe] = useState<{ rank: number; points: number } | null>(null);

  const load = useCallback(async () => {
    setBoard(null);
    try {
      const d = await (await fetch(`/api/passport/leaderboard?period=${period}`)).json();
      if (d.ok) { setBoard(d.board); setMe(d.me); }
      else setBoard([]);
    } catch { setBoard([]); }
  }, [period]);

  useEffect(() => { let alive = true; (async () => { if (alive) await load(); })(); return () => { alive = false; }; }, [load]);

  const medal = (r: number) => (r === 1 ? "🥇" : r === 2 ? "🥈" : r === 3 ? "🥉" : `${r}`);

  return (
    <div className="screen-in hh-page">
      <div className="hh-wrap" style={{ maxWidth: 640, paddingTop: 28, paddingBottom: 48 }}>
        <div className="flex g6 center faint" style={{ fontSize: ".82rem", fontWeight: 600, marginBottom: 10 }}>
          <button className="link-inline" onClick={() => navigate("passport")} style={{ background: "none", border: 0, cursor: "pointer", padding: 0 }}>Passport</button>
          <span>›</span><span style={{ color: "var(--ink)" }}>Leaderboard</span>
        </div>
        <h1 style={{ fontSize: "clamp(1.6rem,4vw,2.2rem)" }}>Leaderboard</h1>
        <p className="muted" style={{ marginTop: 6 }}>The most active members of Singapore&apos;s halal community. Make your passport public to show your name.</p>

        <div className="flex g8" style={{ marginTop: 16 }}>
          <button className={`chip ${period === "month" ? "active" : ""}`} aria-pressed={period === "month"} onClick={() => setPeriod("month")}>This month</button>
          <button className={`chip ${period === "all" ? "active" : ""}`} aria-pressed={period === "all"} onClick={() => setPeriod("all")}>All time</button>
        </div>

        {me && (
          <div className="card" style={{ padding: "12px 16px", marginTop: 14, background: "var(--emerald-50,#e7f3ee)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span><strong>You</strong> · rank #{me.rank}</span>
            <span style={{ fontWeight: 700, color: "var(--emerald,#0e7a5f)" }}>{me.points} pts</span>
          </div>
        )}

        {board === null ? (
          <div className="card" style={{ height: 200, opacity: 0.5, marginTop: 14 }} aria-busy="true" />
        ) : board.length === 0 ? (
          <div className="card" style={{ padding: 24, textAlign: "center", marginTop: 14 }}><p className="faint">No rankings yet — start earning points to appear here.</p></div>
        ) : (
          <ul className="stack g6" style={{ listStyle: "none", padding: 0, margin: "14px 0 0" }}>
            {board.map((r) => (
              <li key={r.rank} className="flex between center" style={{ padding: "11px 15px", background: r.rank <= 3 ? "var(--gold-50,#fbf3df)" : "var(--wash,#f8f6f0)", borderRadius: 10 }}>
                <span className="flex g10 center">
                  <span style={{ width: 30, textAlign: "center", fontWeight: 800, fontSize: r.rank <= 3 ? "1.1rem" : ".9rem" }}>{medal(r.rank)}</span>
                  <span style={{ fontWeight: 600 }}>{r.name}{!r.isPublic && <Icon name="lock" size={11} style={{ marginLeft: 5, opacity: 0.5 }} />}</span>
                </span>
                <span style={{ fontWeight: 700, color: "var(--emerald,#0e7a5f)" }}>{r.points}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
