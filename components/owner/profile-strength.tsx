"use client";

/* Profile-strength ring + checklist — real derived data from the listing's own
   fields; every unfinished item deep-links to the tab that fixes it. */

import { ProgressRing } from "@/components/progress-ring";
import { Icon } from "@/components/ui";
import { strengthScore, type StrengthInput } from "@/lib/profile-strength";

export function ProfileStrengthCard({ input, onGoTab }: { input: StrengthInput; onGoTab: (tab: string) => void }) {
  const { score, checks } = strengthScore(input);
  const pctVal = Math.round(score * 100);
  return (
    <div className="card mt20" style={{ padding: 20, display: "flex", gap: 18, flexWrap: "wrap", alignItems: "center" }}>
      <ProgressRing value={score} size={104} stroke={10} tone={score >= 0.8 ? "emerald" : "gold"} label="Profile strength">
        <strong style={{ fontSize: "1.3rem" }}>{pctVal}%</strong>
      </ProgressRing>
      <div style={{ flex: 1, minWidth: 240 }}>
        <h3 style={{ fontSize: "1.05rem", marginBottom: 2 }}>Profile strength</h3>
        <p className="faint" style={{ fontSize: ".84rem", marginBottom: 10 }}>
          {pctVal >= 80 ? "Your profile is looking strong" : "Complete your profile to earn more views"}
        </p>
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 6 }}>
          {checks.map((c) => (
            <li key={c.key} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: ".86rem" }}>
              <Icon name={c.done ? "check" : "arrow"} size={14} style={{ color: c.done ? "var(--emerald)" : "var(--gold-800)", flex: "none" }} />
              {c.done ? (
                <span>{c.label}</span>
              ) : (
                <button className="link-inline" style={{ font: "inherit", padding: 0, minHeight: 24 }} onClick={() => onGoTab(c.tab)}>
                  {c.label}
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
