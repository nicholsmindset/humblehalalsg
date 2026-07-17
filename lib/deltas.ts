/* Period-over-period deltas for dashboard KPI cards.
 * Policy: a delta is shown ONLY when a real prior-period value exists —
 * pctChange returns null (not 0) when the comparison is meaningless, and
 * StatCard hides the badge entirely on null. No fake "0%" chips. */

/** Percentage change from prev → cur, or null when prev is 0/invalid. */
export function pctChange(cur: number, prev: number): number | null {
  if (!Number.isFinite(cur) || !Number.isFinite(prev) || prev <= 0) return null;
  return ((cur - prev) / prev) * 100;
}

/** "+18%" / "-4%" / "0%" — callers pass a non-null pctChange result. */
export function formatDelta(pct: number): string {
  const rounded = Math.round(pct);
  return `${rounded > 0 ? "+" : ""}${rounded}%`;
}
