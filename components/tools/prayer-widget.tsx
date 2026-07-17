"use client";

/* Live prayer-times widget for the tools hub hero. Same data source as the
   chrome PrayerStrip (/api/prayer-times — MUIS method, cached daily). Degrades
   to a plain link card when the API is unavailable — never fake times. */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui";
import { ProgressRing } from "@/components/progress-ring";
import { formatCountdown, nextPrayerInfo } from "@/lib/tools/next-prayer";

interface PrayerRow { name: string; time: string; mins: number }
interface PrayerData { ok: boolean; date?: string; hijri?: string; times?: PrayerRow[] }

const NON_PRAYER = new Set(["syuruk", "sunrise"]);

export function PrayerWidget() {
  const [data, setData] = useState<PrayerData | null>(null);
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/prayer-times")
      .then((r) => r.json())
      .then((j) => { if (alive) setData(j); })
      .catch(() => { if (alive) setData({ ok: false }); });
    const tick = () => {
      const d = new Date();
      setNow(d.getHours() * 60 + d.getMinutes());
    };
    tick();
    const id = setInterval(tick, 30_000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  const prayers = useMemo(
    () => (data?.times || []).filter((t) => !NON_PRAYER.has(t.name.toLowerCase())),
    [data],
  );
  const next = useMemo(
    () => (now != null && prayers.length ? nextPrayerInfo(prayers, now) : null),
    [prayers, now],
  );

  // API degraded or still loading with nothing to show → honest link card.
  if (data && (!data.ok || !prayers.length)) {
    return (
      <aside className="tools-hero-panel" aria-label="Prayer times">
        <div className="tools-panel-head">
          <span className="tool-card-ico"><Icon name="clock" size={20} /></span>
          <div>
            <strong>Prayer times</strong>
            <p>Accurate daily times for Singapore.</p>
          </div>
        </div>
        <Link href="/tools/prayer-times" className="btn btn-primary btn-block">Open prayer times</Link>
      </aside>
    );
  }

  return (
    <aside className="tools-hero-panel tools-prayer-widget" aria-label="Today's prayer times">
      <div className="tools-panel-head">
        <div>
          <strong>Today</strong>
          <p>Singapore{data?.hijri ? ` · ${data.hijri}` : ""}</p>
        </div>
        {next && (
          <ProgressRing value={next.progress} size={72} stroke={6} label={`Time until ${next.name}`}>
            <span className="tools-ring-count">{formatCountdown(next.minsUntil)}</span>
            <span className="tools-ring-sub">until {next.name}</span>
          </ProgressRing>
        )}
      </div>
      {next && (
        <p className="tools-next-line">
          Next prayer — <strong>{next.name}</strong> at <strong>{next.time}</strong>
        </p>
      )}
      <div className="tools-times-row" role="list">
        {prayers.map((t) => (
          <div key={t.name} role="listitem" className={`tools-time ${next?.name === t.name ? "on" : ""}`}>
            <span>{t.name}</span>
            <strong>{t.time}</strong>
          </div>
        ))}
      </div>
      <div className="flex g8 wrap" style={{ marginTop: 12 }}>
        <Link href="/tools/prayer-times" className="btn btn-soft btn-sm"><Icon name="calendar" size={14} /> Open prayer times</Link>
        <Link href="/tools/qibla" className="btn btn-soft btn-sm"><Icon name="near" size={14} /> Find qibla</Link>
      </div>
    </aside>
  );
}
