"use client";

/* Ramadan fasting tracker — mark each of the 30 days you fasted. Local-first;
   data stays on this device. */
import { useLocalState } from "./use-local-state";

const DAYS = Array.from({ length: 30 }, (_, i) => i + 1);

export function RamadanTracker() {
  const { value: fasted, setValue, ready } = useLocalState<boolean[]>(
    "hh_ramadan_v1",
    Array(30).fill(false),
  );

  const count = fasted.filter(Boolean).length;

  const toggle = (i: number) => {
    setValue((prev) => {
      const arr = prev.slice();
      arr[i] = !arr[i];
      return arr;
    });
  };

  return (
    <div className="tracker ramadan-tracker">
      <div className="tracker-stats">
        <div className="tracker-stat">
          <span className="tracker-stat-v">{ready ? count : 0}/30</span>
          <span className="tracker-stat-l">Days fasted</span>
        </div>
      </div>

      <div className="tracker-bar" aria-hidden="true">
        <span className="tracker-bar-fill" style={{ width: `${(count / 30) * 100}%` }} />
      </div>

      <div className="ramadan-grid" role="group" aria-label="Ramadan days">
        {DAYS.map((d, i) => (
          <button
            key={d}
            className={`ramadan-day ${fasted[i] ? "on" : ""}`}
            aria-pressed={fasted[i]}
            aria-label={`Day ${d}${fasted[i] ? " — fasted" : ""}`}
            onClick={() => toggle(i)}
          >
            {d}
          </button>
        ))}
      </div>

      <div className="flex g8 center" style={{ justifyContent: "center", marginTop: 6 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => setValue(Array(30).fill(false))}>
          Reset
        </button>
      </div>

      <p className="faint" style={{ fontSize: ".82rem", marginTop: 4, textAlign: "center" }}>
        For your own record — saved on this device only. Make up (qada) any missed obligatory fasts.
      </p>
    </div>
  );
}
