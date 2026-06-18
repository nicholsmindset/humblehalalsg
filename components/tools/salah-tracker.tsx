"use client";

/* Salah tracker — log the five daily prayers and keep a streak. All data lives
   on this device only (local-first), no account. */
import { Icon } from "@/components/ui";
import { useLocalState } from "./use-local-state";

const PRAYERS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
type DayLog = Record<string, boolean[]>; // dateKey -> [5 booleans]

function dateKey(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function shiftDay(d: Date, days: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

export function SalahTracker() {
  const { value: log, setValue, ready } = useLocalState<DayLog>("hh_salah_v1", {});

  const today = new Date();
  const tKey = dateKey(today);
  const todayArr = log[tKey] ?? [false, false, false, false, false];
  const doneToday = todayArr.filter(Boolean).length;

  const toggle = (i: number) => {
    setValue((prev) => {
      const arr = (prev[tKey] ?? [false, false, false, false, false]).slice();
      arr[i] = !arr[i];
      return { ...prev, [tKey]: arr };
    });
  };

  // Streak: consecutive fully-complete days ending today (or yesterday if today
  // isn't complete yet).
  const allDone = (k: string) => (log[k] ?? []).filter(Boolean).length === 5;
  let streak = 0;
  let cursor = allDone(tKey) ? today : shiftDay(today, -1);
  while (allDone(dateKey(cursor))) {
    streak++;
    cursor = shiftDay(cursor, -1);
  }

  // Last 7 days completion (oldest → today).
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = shiftDay(today, i - 6);
    const k = dateKey(d);
    return { k, label: d.toLocaleDateString("en", { weekday: "narrow" }), done: (log[k] ?? []).filter(Boolean).length };
  });

  return (
    <div className="tracker salah-tracker">
      <div className="tracker-stats">
        <div className="tracker-stat">
          <span className="tracker-stat-v">{ready ? doneToday : 0}/5</span>
          <span className="tracker-stat-l">Today</span>
        </div>
        <div className="tracker-stat">
          <span className="tracker-stat-v">{ready ? streak : 0}</span>
          <span className="tracker-stat-l">Day streak</span>
        </div>
      </div>

      <div className="salah-grid">
        {PRAYERS.map((p, i) => (
          <button
            key={p}
            className={`salah-cell ${todayArr[i] ? "on" : ""}`}
            aria-pressed={todayArr[i]}
            onClick={() => toggle(i)}
          >
            <Icon name={todayArr[i] ? "check" : "mosque"} size={20} />
            <span>{p}</span>
          </button>
        ))}
      </div>

      <div className="tracker-week" aria-hidden="true">
        {last7.map((d) => (
          <div key={d.k} className="tracker-week-cell">
            <span className={`tracker-dot d${d.done >= 5 ? "full" : d.done > 0 ? "part" : "none"}`} />
            <span className="faint">{d.label}</span>
          </div>
        ))}
      </div>

      <p className="faint" style={{ fontSize: ".82rem", marginTop: 4, textAlign: "center" }}>
        Saved privately on this device only — no account, no upload.
      </p>
    </div>
  );
}
