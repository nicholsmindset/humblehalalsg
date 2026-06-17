"use client";

/* Hifz (memorization) tracker — mark the surahs you've memorized and watch your
   progress toward all 114. Local-first; data stays on this device. */
import { SURAHS } from "@/lib/tools/surahs";
import { useLocalState } from "./use-local-state";

export function HifzTracker() {
  const { value: done, setValue, ready } = useLocalState<number[]>("hh_hifz_v1", []);
  const set = new Set(done);
  const count = set.size;
  const pct = Math.round((count / SURAHS.length) * 100);

  const toggle = (n: number) => {
    setValue((prev) => (prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]));
  };

  return (
    <div className="tracker hifz-tracker">
      <div className="tracker-stats">
        <div className="tracker-stat">
          <span className="tracker-stat-v">{ready ? count : 0}/114</span>
          <span className="tracker-stat-l">Surahs memorized</span>
        </div>
        <div className="tracker-stat">
          <span className="tracker-stat-v">{ready ? pct : 0}%</span>
          <span className="tracker-stat-l">Complete</span>
        </div>
      </div>

      <div className="tracker-bar" aria-hidden="true">
        <span className="tracker-bar-fill" style={{ width: `${pct}%` }} />
      </div>

      <ul className="hifz-list">
        {SURAHS.map((s) => {
          const on = set.has(s.n);
          return (
            <li key={s.n}>
              <button className={`hifz-row ${on ? "on" : ""}`} aria-pressed={on} onClick={() => toggle(s.n)}>
                <span className="hifz-num">{s.n}</span>
                <span className="hifz-name">
                  {s.name} <span className="faint">· {s.english}</span>
                </span>
                <span className={`hifz-check ${on ? "on" : ""}`} aria-hidden="true" />
              </button>
            </li>
          );
        })}
      </ul>

      <p className="faint" style={{ fontSize: ".82rem", marginTop: 8, textAlign: "center" }}>
        Saved privately on this device only — no account, no upload.
      </p>
    </div>
  );
}
