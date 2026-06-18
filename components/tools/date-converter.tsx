"use client";

/* Hijri ↔ Gregorian converter. Reuses the shared tabular-calendar helpers in
   lib/hijri.ts (toHijri / fromHijri) — no duplicate calendar maths. The tabular
   ("Kuwaiti") calendar can differ from a moon-sighted date by ±1 day, so output
   is always qualified "approx." and is for planning, never religious rulings. */
import { useEffect, useState } from "react";
import { Icon } from "@/components/ui";
import { toHijri, fromHijri, HIJRI_MONTH_NAMES } from "@/lib/hijri";

type Mode = "g2h" | "h2g";

function todayIso(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function prettyGregorian(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return "";
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export function DateConverterTool() {
  const [mode, setMode] = useState<Mode>("g2h");
  const [greg, setGreg] = useState("");
  const [hYear, setHYear] = useState(1447);
  const [hMonth, setHMonth] = useState(1);
  const [hDay, setHDay] = useState(1);

  // Default the Gregorian input to today after mount (avoids SSR/client mismatch).
  useEffect(() => {
    setGreg(todayIso());
    const h = toHijri(todayIso());
    if (h) {
      setHYear(h.year);
      setHMonth(h.month);
      setHDay(h.day);
    }
  }, []);

  const hijriOut = greg ? toHijri(greg) : null;
  const gregOut = fromHijri(hYear, hMonth, hDay);

  return (
    <div className="dateconv">
      <div className="pillbar" role="group" aria-label="Conversion direction">
        <button className={`chip ${mode === "g2h" ? "active" : ""}`} aria-pressed={mode === "g2h"} onClick={() => setMode("g2h")}>
          Gregorian → Hijri
        </button>
        <button className={`chip ${mode === "h2g" ? "active" : ""}`} aria-pressed={mode === "h2g"} onClick={() => setMode("h2g")}>
          Hijri → Gregorian
        </button>
      </div>

      {mode === "g2h" ? (
        <div className="dateconv-body">
          <div className="field">
            <label htmlFor="dc-greg">Gregorian date</label>
            <input
              id="dc-greg"
              className="input"
              type="date"
              value={greg}
              onChange={(e) => setGreg(e.target.value)}
            />
            <button className="btn btn-soft btn-sm" style={{ alignSelf: "flex-start" }} onClick={() => setGreg(todayIso())}>
              <Icon name="calendar" size={15} /> Today
            </button>
          </div>
          <div className="dateconv-out" aria-live="polite">
            <span className="faint">Hijri date (approx.)</span>
            {hijriOut ? (
              <>
                <strong className="dateconv-result">
                  {hijriOut.day} {hijriOut.monthName} {hijriOut.year} AH
                </strong>
                <span className="dateconv-arabic" lang="ar" dir="rtl">
                  {hijriOut.day} {hijriOut.monthName} {hijriOut.year} هـ
                </span>
              </>
            ) : (
              <span className="muted">Pick a date</span>
            )}
          </div>
        </div>
      ) : (
        <div className="dateconv-body">
          <div className="dateconv-hijri-inputs">
            <div className="field">
              <label htmlFor="dc-hd">Day</label>
              <input id="dc-hd" className="input" type="number" min={1} max={30} value={hDay} onChange={(e) => setHDay(Math.min(30, Math.max(1, Number(e.target.value) || 1)))} />
            </div>
            <div className="field f1">
              <label htmlFor="dc-hm">Month</label>
              <select id="dc-hm" className="select" value={hMonth} onChange={(e) => setHMonth(Number(e.target.value))}>
                {HIJRI_MONTH_NAMES.map((name, i) => (
                  <option key={name} value={i + 1}>
                    {i + 1}. {name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="dc-hy">Year (AH)</label>
              <input id="dc-hy" className="input" type="number" min={1} max={2000} value={hYear} onChange={(e) => setHYear(Math.max(1, Number(e.target.value) || 1))} />
            </div>
          </div>
          <div className="dateconv-out" aria-live="polite">
            <span className="faint">Gregorian date (approx.)</span>
            {gregOut ? (
              <strong className="dateconv-result">{prettyGregorian(gregOut)}</strong>
            ) : (
              <span className="muted">Enter a valid Hijri date</span>
            )}
          </div>
        </div>
      )}

      <p className="faint" style={{ fontSize: ".82rem", marginTop: 4 }}>
        Uses the tabular (arithmetic) Islamic calendar — it can differ from the moon-sighted date by about a day.
        For dates and planning only; confirm religious observances with your local moon-sighting authority.
      </p>
    </div>
  );
}
