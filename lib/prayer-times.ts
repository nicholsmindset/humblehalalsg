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
  const display = `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")}`; // 24h → 12h, no AM/PM
  return { time: display, mins: h * 60 + m };
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
