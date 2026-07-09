/* Small relative-time helper for freshness signals ("last verified 12 days ago").
   Pure + dependency-free. Returns "" for empty/invalid input. */
export function timeAgo(input?: string | number | Date | null): string {
  if (!input) return "";
  const then = input instanceof Date ? input : new Date(input);
  const ms = then.getTime();
  if (!Number.isFinite(ms)) return "";
  const diff = Date.now() - ms;
  if (diff < 0) return "just now";
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hour${hr === 1 ? "" : "s"} ago`;
  const day = Math.floor(hr / 24);
  if (day === 1) return "yesterday";
  if (day < 30) return `${day} days ago`;
  const mo = Math.floor(day / 30);
  if (mo < 12) return `${mo} month${mo === 1 ? "" : "s"} ago`;
  const yr = Math.floor(day / 365);
  return `${yr} year${yr === 1 ? "" : "s"} ago`;
}
