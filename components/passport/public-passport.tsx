/* Server component — the public shareable passport card (non-PII aggregates). */
import Link from "next/link";
import { Icon } from "../ui";

type Row = { display_name: string; total_points: number; visit_count: number; review_count: number; follow_count: number; joined_month: string };

export function PublicPassport({ row, tier, badges }: { row: Row; tier: string; badges: { key: string; label: string; icon: string }[] }) {
  return (
    <div className="screen-in hh-page">
      <div className="hh-wrap" style={{ maxWidth: 560, paddingTop: 32, paddingBottom: 48 }}>
        <div className="card" style={{ padding: 24, textAlign: "center" }}>
          <div className="eyebrow" style={{ color: "var(--emerald,#0e7a5f)" }}>HALAL PASSPORT</div>
          <h1 style={{ fontSize: "1.6rem", marginTop: 8 }}>{row.display_name}</h1>
          <div style={{ display: "inline-block", marginTop: 8, fontSize: ".9rem", fontWeight: 700, color: "var(--emerald,#0e7a5f)", background: "var(--emerald-50,#e7f3ee)", borderRadius: 999, padding: "5px 16px" }}>{tier}</div>
          <div style={{ fontSize: "2.6rem", fontWeight: 800, color: "var(--emerald,#0e7a5f)", marginTop: 14 }}>{row.total_points}</div>
          <div className="faint" style={{ fontSize: ".82rem" }}>points · member since {row.joined_month}</div>

          <div className="flex g16 center" style={{ marginTop: 18, justifyContent: "center", flexWrap: "wrap" }}>
            <Stat label="Places visited" val={row.visit_count} />
            <Stat label="Reviews" val={row.review_count} />
            <Stat label="Following" val={row.follow_count} />
          </div>

          {badges.length > 0 && (
            <div className="flex g8 center" style={{ marginTop: 18, flexWrap: "wrap", justifyContent: "center" }}>
              {badges.map((b) => (
                <span key={b.key} className="flex g6 center" style={{ fontSize: ".8rem", fontWeight: 600, background: "var(--gold-50,#fbf3df)", color: "var(--gold,#b8860b)", borderRadius: 999, padding: "5px 12px" }}>
                  <Icon name={b.icon} size={13} /> {b.label}
                </span>
              ))}
            </div>
          )}
        </div>
        <p className="tc" style={{ marginTop: 18 }}>
          <Link className="btn btn-primary" href="/passport">Start your own Halal Passport →</Link>
        </p>
      </div>
    </div>
  );
}

function Stat({ label, val }: { label: string; val: number }) {
  return (
    <div style={{ minWidth: 80 }}>
      <div style={{ fontSize: "1.3rem", fontWeight: 800 }}>{val}</div>
      <div className="faint" style={{ fontSize: ".76rem" }}>{label}</div>
    </div>
  );
}
