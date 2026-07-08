/* Shared photo-array sanitizer — coerces an incoming `photos` value into the
   jsonb shape rowToListing reads: an array of { url, caption? } with string
   urls. Anything malformed is dropped. `max` is the caller's gallery limit
   (owner routes pass the plan's galleryMax; admin passes the top-tier cap).
   Factored out of app/api/owner/listing/route.ts so the admin listing editor
   uses the identical rules. */
export function sanitizePhotos(v: unknown, max: number): { url: string; caption?: string }[] {
  if (!Array.isArray(v)) return [];
  const out: { url: string; caption?: string }[] = [];
  for (const p of v) {
    if (!p || typeof p !== "object") continue;
    const url = (p as { url?: unknown }).url;
    if (typeof url !== "string" || !url.trim()) continue;
    const caption = (p as { caption?: unknown }).caption;
    const entry: { url: string; caption?: string } = { url: url.trim() };
    if (typeof caption === "string" && caption.trim()) entry.caption = caption.trim().slice(0, 120);
    out.push(entry);
  }
  return out.slice(0, Math.max(1, max));
}
