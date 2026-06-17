"use client";

/* Khatam tracker — work through all 30 juz of the Qur'an, then start a fresh
   read-through. Counts completed khatams. Local-first; data stays on device. */
import { useLocalState } from "./use-local-state";

const JUZ = Array.from({ length: 30 }, (_, i) => i + 1);

interface KhatamState {
  completed: number;
  current: boolean[]; // 30 juz of the in-progress read-through
}

export function KhatamTracker() {
  const { value, setValue, ready } = useLocalState<KhatamState>("hh_khatam_v1", {
    completed: 0,
    current: Array(30).fill(false),
  });

  const read = value.current.filter(Boolean).length;
  const finished = read === 30;

  const toggle = (i: number) => {
    setValue((prev) => {
      const current = prev.current.slice();
      current[i] = !current[i];
      return { ...prev, current };
    });
  };

  const startNew = () => {
    setValue((prev) => ({ completed: prev.completed + (prev.current.every(Boolean) ? 1 : 0), current: Array(30).fill(false) }));
  };

  return (
    <div className="tracker khatam-tracker">
      <div className="tracker-stats">
        <div className="tracker-stat">
          <span className="tracker-stat-v">{ready ? read : 0}/30</span>
          <span className="tracker-stat-l">Juz this khatam</span>
        </div>
        <div className="tracker-stat">
          <span className="tracker-stat-v">{ready ? value.completed : 0}</span>
          <span className="tracker-stat-l">Khatams done</span>
        </div>
      </div>

      <div className="tracker-bar" aria-hidden="true">
        <span className="tracker-bar-fill" style={{ width: `${(read / 30) * 100}%` }} />
      </div>

      <div className="khatam-grid" role="group" aria-label="Juz">
        {JUZ.map((j, i) => (
          <button
            key={j}
            className={`khatam-juz ${value.current[i] ? "on" : ""}`}
            aria-pressed={value.current[i]}
            aria-label={`Juz ${j}${value.current[i] ? " — read" : ""}`}
            onClick={() => toggle(i)}
          >
            {j}
          </button>
        ))}
      </div>

      {finished && (
        <div className="khatam-done">🎉 Khatam complete — may Allah accept it.</div>
      )}

      <div className="flex g8 center" style={{ justifyContent: "center", marginTop: 6 }}>
        <button className="btn btn-outline btn-sm" onClick={startNew}>
          Start a new khatam
        </button>
      </div>

      <p className="faint" style={{ fontSize: ".82rem", marginTop: 4, textAlign: "center" }}>
        Saved privately on this device only — no account, no upload.
      </p>
    </div>
  );
}
