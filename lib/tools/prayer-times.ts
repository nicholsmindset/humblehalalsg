import "server-only";
import { PRAYER_METHODS } from "./prayer-methods";

/* Global prayer times via the Aladhan API (free, keyless), cached for a day —
   the same source/pattern as lib/prayer-times.ts (Singapore), generalised to any
   location and calculation method. Returns null on failure so the client can
   show a friendly message. English prayer names for an international audience. */

export interface PrayerTime { name: string; time: string; mins: number; isPrayer: boolean }
export interface PrayerTimesResult {
  date: string;
  hijri: string;
  timezone: string;
  methodName: string;
  times: PrayerTime[];
}

const NAMES: [string, string, boolean][] = [
  ["Fajr", "Fajr", true],
  ["Sunrise", "Sunrise", false],
  ["Dhuhr", "Dhuhr", true],
  ["Asr", "Asr", true],
  ["Maghrib", "Maghrib", true],
  ["Isha", "Isha", true],
];

function parse(raw: string): { time: string; mins: number } {
  const hm = String(raw).trim().split(" ")[0]; // strip any "(+08)" suffix
  const [hS, mS] = hm.split(":");
  const h = Number(hS) || 0;
  const m = Number(mS) || 0;
  const ampm = h < 12 ? "AM" : "PM";
  const hh = ((h + 11) % 12) + 1;
  return { time: `${hh}:${String(m).padStart(2, "0")} ${ampm}`, mins: h * 60 + m };
}

export async function getPrayerTimesFor(
  lat: number,
  lng: number,
  method: number,
): Promise<PrayerTimesResult | null> {
  try {
    const url = `https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lng}&method=${method}`;
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    const json = await res.json();
    const timings = json?.data?.timings as Record<string, string> | undefined;
    if (!timings) return null;
    const times: PrayerTime[] = NAMES.map(([key, name, isPrayer]) => {
      const p = parse(timings[key] || "");
      return { name, time: p.time, mins: p.mins, isPrayer };
    });
    const h = json?.data?.date?.hijri;
    const hijri = h ? `${h.day} ${h.month?.en || ""} ${h.year} AH`.trim() : "";
    const methodName = PRAYER_METHODS.find((m) => m.id === method)?.name || "Default";
    return {
      date: json?.data?.date?.readable || "Today",
      hijri,
      timezone: json?.data?.meta?.timezone || "",
      methodName,
      times,
    };
  } catch {
    return null;
  }
}
