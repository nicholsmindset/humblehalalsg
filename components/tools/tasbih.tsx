"use client";

/* Tasbih (digital misbaha) — local-first. The count, chosen dhikr and target
   live only in this browser (localStorage), matching the "no sign-up, private"
   promise of the Deen Tools suite. No network, no account. */
import { useEffect, useState } from "react";
import { Icon } from "@/components/ui";

const KEY = "hh_tasbih_v1";

const DHIKR = [
  { translit: "SubhanAllah", arabic: "سُبْحَانَ اللَّهِ", meaning: "Glory be to Allah" },
  { translit: "Alhamdulillah", arabic: "الْحَمْدُ لِلَّهِ", meaning: "All praise is for Allah" },
  { translit: "Allahu Akbar", arabic: "اللَّهُ أَكْبَرُ", meaning: "Allah is the Greatest" },
  { translit: "La ilaha illallah", arabic: "لَا إِلَهَ إِلَّا اللَّهُ", meaning: "There is no deity but Allah" },
  { translit: "Astaghfirullah", arabic: "أَسْتَغْفِرُ اللَّهَ", meaning: "I seek Allah's forgiveness" },
];

const TARGETS = [33, 99, 100, 0]; // 0 = unlimited

interface Saved {
  count: number;
  dhikr: number;
  target: number;
}

function load(): Saved {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<Saved>;
      return {
        count: Math.max(0, Number(p.count) || 0),
        dhikr: Math.min(DHIKR.length - 1, Math.max(0, Number(p.dhikr) || 0)),
        target: TARGETS.includes(Number(p.target)) ? Number(p.target) : 33,
      };
    }
  } catch {
    /* storage blocked — fall through to defaults */
  }
  return { count: 0, dhikr: 0, target: 33 };
}

export function TasbihTool() {
  // Start from a deterministic default so SSR + first client render match,
  // then hydrate from localStorage on mount.
  const [count, setCount] = useState(0);
  const [dhikr, setDhikr] = useState(0);
  const [target, setTarget] = useState(33);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const s = load();
    setCount(s.count);
    setDhikr(s.dhikr);
    setTarget(s.target);
    setReady(true);
  }, []);

  // Persist on every change (after the initial hydrate).
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify({ count, dhikr, target }));
    } catch {
      /* ignore */
    }
  }, [count, dhikr, target, ready]);

  const atTarget = target > 0 && count > 0 && count % target === 0;

  const tap = () => {
    setCount((c) => {
      const next = c + 1;
      if (target > 0 && next % target === 0 && typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([30, 40, 30]);
      } else if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(12);
      }
      return next;
    });
  };

  const active = DHIKR[dhikr];
  const rounds = target > 0 ? Math.floor(count / target) : 0;
  const inRound = target > 0 ? count % target : count;

  return (
    <div className="tasbih">
      <div className="tasbih-dhikr" aria-live="polite">
        <div className="tasbih-arabic" lang="ar" dir="rtl">{active.arabic}</div>
        <div className="tasbih-translit">{active.translit}</div>
        <div className="faint tasbih-meaning">{active.meaning}</div>
      </div>

      <div className="pillbar tasbih-presets" role="group" aria-label="Choose dhikr">
        {DHIKR.map((d, i) => (
          <button
            key={d.translit}
            className={`chip ${i === dhikr ? "active" : ""}`}
            aria-pressed={i === dhikr}
            onClick={() => setDhikr(i)}
          >
            {d.translit}
          </button>
        ))}
      </div>

      <button
        className={`tasbih-tap ${atTarget ? "hit" : ""}`}
        onClick={tap}
        aria-label={`Count ${active.translit}. Current count ${count}.`}
      >
        <span className="tasbih-count">{ready ? count : 0}</span>
        <span className="tasbih-tap-hint">Tap to count</span>
      </button>

      <div className="tasbih-meta">
        <div className="tasbih-target" role="group" aria-label="Target per set">
          <span className="faint">Set of</span>
          {TARGETS.map((tg) => (
            <button
              key={tg}
              className={`chip btn-sm ${tg === target ? "active" : ""}`}
              aria-pressed={tg === target}
              onClick={() => setTarget(tg)}
            >
              {tg === 0 ? "∞" : tg}
            </button>
          ))}
        </div>
        {target > 0 && (
          <div className="faint tasbih-rounds">
            {inRound} / {target}
            {rounds > 0 && <> · {rounds} {rounds === 1 ? "set" : "sets"} complete</>}
          </div>
        )}
      </div>

      <div className="flex g8 center tc" style={{ justifyContent: "center" }}>
        <button className="btn btn-outline btn-sm" onClick={() => setCount((c) => Math.max(0, c - 1))}>
          <Icon name="minus" size={16} /> Undo
        </button>
        <button className="btn btn-ghost btn-sm" onClick={() => setCount(0)}>
          <Icon name="refresh" size={16} /> Reset
        </button>
      </div>

      <p className="faint tc" style={{ fontSize: ".82rem", marginTop: 4 }}>
        Saved privately on this device only — no account, no upload.
      </p>
    </div>
  );
}
