"use client";

/* Countdowns to the major Islamic dates, computed from the tabular Hijri
   calendar (lib/hijri — reused, not reimplemented). Dates are arithmetic
   approximations (±1 day) and the real observance depends on moon sighting, so
   everything is labelled "approx." Computed client-side so the countdown is
   always current. */
import { useEffect, useState } from "react";
import { toHijri, fromHijri } from "@/lib/hijri";

interface EventDef { name: string; month: number; day: number; note?: string }
const EVENTS: EventDef[] = [
  { name: "Islamic New Year", month: 1, day: 1, note: "1 Muharram" },
  { name: "Day of Ashura", month: 1, day: 10, note: "10 Muharram" },
  { name: "Isra & Mi'raj", month: 7, day: 27, note: "27 Rajab (commonly observed)" },
  { name: "First of Ramadan", month: 9, day: 1, note: "Start of fasting" },
  { name: "Laylat al-Qadr", month: 9, day: 27, note: "Sought in the last 10 nights" },
  { name: "Eid al-Fitr", month: 10, day: 1, note: "1 Shawwal" },
  { name: "Day of Arafah", month: 12, day: 9, note: "9 Dhul-Hijjah" },
  { name: "Eid al-Adha", month: 12, day: 10, note: "10 Dhul-Hijjah" },
];

function todayIso(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
function daysFromToday(iso: string, todayIsoStr: string): number {
  const a = new Date(todayIsoStr + "T00:00:00");
  const b = new Date(iso + "T00:00:00");
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}
function pretty(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

interface Computed { name: string; note?: string; date: string; days: number }

export function IslamicCalendar() {
  const [today, setToday] = useState<{ hijri: string; events: Computed[] } | null>(null);

  useEffect(() => {
    const tIso = todayIso();
    const tH = toHijri(tIso);
    const H = tH?.year ?? 1447;
    const computed: (Computed | null)[] = EVENTS.map((e) => {
      let g = fromHijri(H, e.month, e.day);
      if (!g) return null;
      if (daysFromToday(g, tIso) < 0) g = fromHijri(H + 1, e.month, e.day) || g;
      const out: Computed = { name: e.name, note: e.note, date: g, days: daysFromToday(g, tIso) };
      return out;
    });
    const events = computed
      .filter((x): x is Computed => x !== null)
      .sort((a, b) => a.days - b.days);
    setToday({ hijri: tH ? `${tH.day} ${tH.monthName} ${tH.year} AH` : "", events });
  }, []);

  if (!today) return <p className="muted">Loading the Islamic calendar…</p>;

  return (
    <div className="islamic-cal">
      <div className="islamic-cal-today">
        <span className="faint">Today (approx.)</span>
        <strong>{today.hijri}</strong>
      </div>
      <div className="islamic-cal-grid">
        {today.events.map((e) => (
          <div key={e.name} className={`islamic-cal-card card ${e.days <= 7 ? "soon" : ""}`}>
            <div className="islamic-cal-name">{e.name}</div>
            {e.note && <div className="faint islamic-cal-note">{e.note}</div>}
            <div className="islamic-cal-date">≈ {pretty(e.date)}</div>
            <div className="islamic-cal-days">
              {e.days === 0 ? "Today" : e.days === 1 ? "Tomorrow" : `in ${e.days} days`}
            </div>
          </div>
        ))}
      </div>
      <p className="faint" style={{ fontSize: ".82rem", marginTop: 4 }}>
        Dates use the arithmetic (tabular) calendar and can differ by about a day. Actual dates of Ramadan,
        Eid and other observances depend on the moon sighting announced by your local authority.
      </p>
    </div>
  );
}
