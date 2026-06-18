/* Shared (client-safe) list of Aladhan prayer-time calculation methods.
   Lives apart from lib/tools/prayer-times.ts (which is server-only) so the
   client picker and the route validator can share one source of truth. */

export interface PrayerMethod { id: number; name: string }

export const PRAYER_METHODS: PrayerMethod[] = [
  { id: 3, name: "Muslim World League" },
  { id: 2, name: "ISNA (North America)" },
  { id: 4, name: "Umm al-Qura (Makkah)" },
  { id: 5, name: "Egyptian General Authority" },
  { id: 1, name: "University of Karachi" },
  { id: 8, name: "Gulf Region" },
  { id: 13, name: "Diyanet (Turkey)" },
  { id: 11, name: "MUIS (Singapore)" },
];

export const DEFAULT_METHOD = 3; // Muslim World League — a sensible global default
