/* Humble Halal — structured opening hours + real "open now" (Singapore time).
   Week is indexed 0=Mon … 6=Sun. A day is a range or null (closed). Handles
   overnight ranges (close < open) and "opens tomorrow" messaging. */

export interface HoursRange {
  open: string; // "09:00"
  close: string; // "21:30"
}
export type WeekHours = (HoursRange | null)[]; // length 7, Mon→Sun

export const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function toMin(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/** "21:30" → "9:30 PM" */
export function fmt12(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const ap = h < 12 ? "AM" : "PM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${h12} ${ap}` : `${h12}:${String(m).padStart(2, "0")} ${ap}`;
}

/** Current Singapore weekday index (0=Mon) + minutes since midnight. */
function sgParts(date: Date): { day: number; mins: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Singapore",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value || "";
  const day = DAY_LABELS.indexOf(get("weekday"));
  const hour = parseInt(get("hour"), 10) % 24;
  const minute = parseInt(get("minute"), 10);
  return { day: day < 0 ? 0 : day, mins: hour * 60 + minute };
}

/** Current Singapore weekday index (0=Mon … 6=Sun). */
export function sgTodayIdx(date: Date = new Date()): number {
  return sgParts(date).day;
}

function inRange(mins: number, r: HoursRange): boolean {
  const o = toMin(r.open);
  const c = toMin(r.close);
  if (c > o) return mins >= o && mins < c; // same-day
  return mins >= o || mins < c; // overnight
}

export function isOpenNow(week: WeekHours | undefined, date: Date = new Date()): boolean {
  if (!week || week.length !== 7) return false;
  const { day, mins } = sgParts(date);
  const today = week[day];
  if (today && inRange(mins, today)) return true;
  // overnight spill from yesterday
  const y = week[(day + 6) % 7];
  if (y && toMin(y.close) <= toMin(y.open) && mins < toMin(y.close)) return true;
  return false;
}

/** { open, label } — e.g. "Open · closes 9:30 PM" / "Closed · opens 9:00 AM Tue". */
export function openStatus(
  week: WeekHours | undefined,
  date: Date = new Date(),
): { open: boolean; label: string } {
  if (!week || week.length !== 7) return { open: false, label: "Hours not listed" };
  const { day, mins } = sgParts(date);
  if (isOpenNow(week, date)) {
    const today = week[day];
    const close = today && toMin(today.close) > mins ? today.close : today?.close;
    return { open: true, label: close ? `Open · closes ${fmt12(close)}` : "Open now" };
  }
  // find next opening within 7 days
  for (let i = 0; i < 7; i++) {
    const d = (day + i) % 7;
    const r = week[d];
    if (!r) continue;
    if (i === 0 && mins < toMin(r.open)) {
      return { open: false, label: `Closed · opens ${fmt12(r.open)}` };
    }
    if (i > 0) {
      const when = i === 1 ? "tomorrow" : DAY_LABELS[d];
      return { open: false, label: `Closed · opens ${fmt12(r.open)} ${when}` };
    }
  }
  return { open: false, label: "Closed" };
}

/** Deterministic, category-shaped week hours for seed/mock listings. */
export function deriveWeekHours(catId: string, seed = 0): WeekHours {
  const r = (o: string, c: string): HoursRange => ({ open: o, close: c });
  const v = seed % 3; // small variation in closing time
  const closeEve = ["21:00", "21:30", "22:00"][v];
  switch (catId) {
    case "cafes":
      return [r("08:00", closeEve), r("08:00", closeEve), r("08:00", closeEve), r("08:00", closeEve), r("08:00", "23:00"), r("08:00", "23:00"), r("09:00", "22:00")];
    case "restaurants":
      return [r("11:00", closeEve), r("11:00", closeEve), r("11:00", closeEve), r("11:00", closeEve), r("11:00", "23:00"), r("11:00", "23:00"), r("11:00", closeEve)];
    case "groceries":
      return Array(7).fill(r("09:00", "21:00"));
    case "beauty":
      return [null, r("10:00", "20:00"), r("10:00", "20:00"), r("10:00", "20:00"), r("10:00", "21:00"), r("10:00", "21:00"), r("10:00", "18:00")];
    case "health":
      return [r("09:00", "18:00"), r("09:00", "18:00"), r("09:00", "18:00"), r("09:00", "18:00"), r("09:00", "18:00"), r("09:00", "13:00"), null];
    case "services":
    case "professional":
    case "automotive":
      return [r("09:00", "18:00"), r("09:00", "18:00"), r("09:00", "18:00"), r("09:00", "18:00"), r("09:00", "18:00"), r("09:00", "13:00"), null];
    default:
      return Array(7).fill(r("10:00", closeEve));
  }
}
