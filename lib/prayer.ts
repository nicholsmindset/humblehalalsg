import "server-only";

/* Humble Halal — prayer times for any hotel location. Uses the free, key-less
   Aladhan API (accurate timezone + DST + calculation method). Factual worship
   data — not a halal assertion. Best-effort: returns null on any failure so the
   hotel page still renders. Umm al-Qura for Saudi Arabia, Muslim World League
   elsewhere. */

export interface PrayerTimesResult {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string; // = iftar
  isha: string;
  timezone: string;
  method: string;
}

const pad = (n: number) => String(n).padStart(2, "0");
const clean = (s: unknown) => String(s || "").split(" ")[0]; // strip any "(+03)" suffix

export async function getPrayerTimes(
  lat: number,
  lng: number,
  countryCode?: string,
  date: Date = new Date(),
): Promise<PrayerTimesResult | null> {
  const method = countryCode?.toUpperCase() === "SA" ? 4 : 3; // 4=Umm al-Qura, 3=MWL
  const dd = `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()}`;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(`https://api.aladhan.com/v1/timings/${dd}?latitude=${lat}&longitude=${lng}&method=${method}`, {
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (!res.ok) return null;
    const j = (await res.json()) as { data?: { timings?: Record<string, string>; meta?: { timezone?: string } } };
    const tm = j?.data?.timings;
    if (!tm) return null;
    return {
      fajr: clean(tm.Fajr),
      sunrise: clean(tm.Sunrise),
      dhuhr: clean(tm.Dhuhr),
      asr: clean(tm.Asr),
      maghrib: clean(tm.Maghrib),
      isha: clean(tm.Isha),
      timezone: j.data?.meta?.timezone || "",
      method: method === 4 ? "Umm al-Qura" : "Muslim World League",
    };
  } catch {
    return null;
  }
}
