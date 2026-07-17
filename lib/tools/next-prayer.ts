/* Pure next-prayer/countdown math for the tools-hub prayer widget.
 * Times come as minutes-since-midnight (PrayerRow.mins from lib/prayer-times).
 * Handles the Isyak→Subuh rollover: after the last prayer, the next is
 * tomorrow's first prayer (approximated with today's Subuh time). */

export interface NextPrayerInfo {
  name: string;
  time: string;
  /** minutes until it starts */
  minsUntil: number;
  /** 0..1 — fraction of the current interval that has elapsed */
  progress: number;
}

export function nextPrayerInfo(
  times: { name: string; time: string; mins: number }[],
  nowMins: number,
): NextPrayerInfo | null {
  // Callers pass the daily prayer rows (Syuruk/sunrise filtered by the caller
  // if it shouldn't count as a "next prayer").
  const rows = times.filter((t) => Number.isFinite(t.mins));
  if (!rows.length) return null;
  const sorted = [...rows].sort((a, b) => a.mins - b.mins);
  const next = sorted.find((t) => t.mins > nowMins);
  const DAY = 24 * 60;
  if (next) {
    const idx = sorted.indexOf(next);
    const prevMins = idx === 0 ? sorted[sorted.length - 1].mins - DAY : sorted[idx - 1].mins;
    const span = Math.max(1, next.mins - prevMins);
    return {
      name: next.name,
      time: next.time,
      minsUntil: next.mins - nowMins,
      progress: Math.min(1, Math.max(0, (nowMins - prevMins) / span)),
    };
  }
  // Past the last prayer today → next is tomorrow's first.
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const span = Math.max(1, first.mins + DAY - last.mins);
  return {
    name: first.name,
    time: first.time,
    minsUntil: first.mins + DAY - nowMins,
    progress: Math.min(1, Math.max(0, (nowMins - last.mins) / span)),
  };
}

export function formatCountdown(minsUntil: number): string {
  const h = Math.floor(minsUntil / 60);
  const m = Math.round(minsUntil % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
