/* Deterministic daily rotation — delivers the Featured-tier "homepage
   rotation" promise: every featured business gets homepage time, with the
   order reshuffling once a day. Seeded (not Math.random) so server render
   and client hydration agree, and so the order is stable within a day. */

/** Today's date key in Singapore time (YYYY-MM-DD). */
export function sgDateKey(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Singapore" }).format(now);
}

/** Small string hash (FNV-1a) → 32-bit seed. */
function hashSeed(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Fisher–Yates with a mulberry32 PRNG — same seed, same order. */
export function seededShuffle<T>(items: readonly T[], seed: string): T[] {
  let a = hashSeed(seed);
  const rand = () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Daily rotation: shuffle keyed on the SG date (+ an optional salt). */
export function dailyRotate<T>(items: readonly T[], salt = ""): T[] {
  return seededShuffle(items, sgDateKey() + salt);
}
