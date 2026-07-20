import "server-only";

/* Humble Halal — real Singapore prayer times.
   Source: Aladhan API with method=11 (Majlis Ugama Islam Singapura / MUIS),
   Singapore coordinates. Cached for a day. Falls back to null on any failure so
   callers can degrade to the mock seed. Names use the Singapore (Malay)
   convention: Subuh, Syuruk, Zohor, Asar, Maghrib, Isyak. */

export interface PrayerRow { name: string; time: string; mins: number }
export interface PrayerData { date: string; hijri: string; times: PrayerRow[] }

const SG = { lat: 1.3521, lng: 103.8198, method: 11 }; // method 11 = MUIS Singapore

// Aladhan timing key → Singapore display name
const MAP: [string, string][] = [
  ["Fajr", "Subuh"],
  ["Sunrise", "Syuruk"],
  ["Dhuhr", "Zohor"],
  ["Asr", "Asar"],
  ["Maghrib", "Maghrib"],
  ["Isha", "Isyak"],
];

/** "HH:MM" (24h, may carry a " (+08)" suffix) → { time: "h:mm", mins }. */
function parse(raw: string): { time: string; mins: number } {
  const hm = String(raw).trim().split(" ")[0]; // strip "(+08)"
  const [hStr, mStr] = hm.split(":");
  const h = Number(hStr) || 0;
  const m = Number(mStr) || 0;
  const display = `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`; // 24h → 12h with am/pm
  return { time: display, mins: h * 60 + m };
}

/** One day in a monthly MUIS-method timetable. All times are display strings
    ("5:44 am"); a missing timing renders as "—" — never a fabricated 12:00 am. */
export interface CalendarDay {
  day: number; // day of month, 1-31
  dateISO: string; // "2026-01-05"
  hijri: string; // "16 Rajab 1447" (Aladhan English transliteration)
  imsak: string;
  subuh: string;
  syuruk: string;
  zohor: string;
  asar: string;
  maghrib: string;
  isyak: string;
}

/** Display time or an honest em-dash when the API omitted the timing. */
function fmt(raw: string | undefined): string {
  return raw ? parse(raw).time : "—";
}

/** Full month of Singapore prayer times (MUIS method=11 via Aladhan
    /v1/calendar). Cached for a day, like getPrayerTimes. Returns null on any
    failure so pages can degrade to a "temporarily unavailable" state. */
export async function getPrayerCalendar(year: number, month: number): Promise<CalendarDay[] | null> {
  try {
    const url = `https://api.aladhan.com/v1/calendar/${year}/${month}?latitude=${SG.lat}&longitude=${SG.lng}&method=${SG.method}`;
    const res = await fetch(url, { next: { revalidate: 86400 } }); // refresh daily
    if (!res.ok) return null;
    const json = await res.json();
    const days = json?.data;
    if (!Array.isArray(days) || days.length === 0) return null;
    const rows: CalendarDay[] = [];
    for (const d of days) {
      const t = (d?.timings ?? {}) as Record<string, string>;
      const g = d?.date?.gregorian;
      const h = d?.date?.hijri;
      const dayNum = Number(g?.day);
      if (!dayNum) continue; // skip malformed rows rather than guess
      const [dd, mm, yyyy] = String(g?.date || "").split("-"); // Aladhan: "DD-MM-YYYY"
      rows.push({
        day: dayNum,
        dateISO: yyyy && mm && dd ? `${yyyy}-${mm}-${dd}` : "",
        hijri: h ? `${h.day} ${h.month?.en || ""} ${h.year}`.trim() : "",
        imsak: fmt(t.Imsak),
        subuh: fmt(t.Fajr),
        syuruk: fmt(t.Sunrise),
        zohor: fmt(t.Dhuhr),
        asar: fmt(t.Asr),
        maghrib: fmt(t.Maghrib),
        isyak: fmt(t.Isha),
      });
    }
    return rows.length ? rows : null;
  } catch {
    return null;
  }
}

export async function getPrayerTimes(): Promise<PrayerData | null> {
  try {
    const url = `https://api.aladhan.com/v1/timings?latitude=${SG.lat}&longitude=${SG.lng}&method=${SG.method}`;
    const res = await fetch(url, { next: { revalidate: 86400 } }); // refresh daily
    if (!res.ok) return null;
    const json = await res.json();
    const timings = json?.data?.timings as Record<string, string> | undefined;
    if (!timings) return null;
    const times: PrayerRow[] = MAP.map(([key, name]) => {
      const p = parse(timings[key] || "");
      return { name, time: p.time, mins: p.mins };
    });
    const h = json?.data?.date?.hijri;
    const hijri = h ? `${h.day} ${h.month?.en || ""} ${h.year}`.trim() : "";
    return { date: json?.data?.date?.readable || "Today", hijri, times };
  } catch {
    return null;
  }
}
