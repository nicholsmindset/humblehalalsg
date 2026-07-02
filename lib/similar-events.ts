/* Humble Halal — "similar events" recommendations. Pure scorer, no ML:
   same category is the strongest signal, then same area, date proximity and
   same organiser. Used on the event detail page and reusable by email
   templates (confirmation / post-event follow-ups). Only future, published
   events are candidates — callers pass the public list from getEvents(). */
import type { EventItem } from "./types";

const MS_DAY = 86_400_000;

/** Relevance of `candidate` to `anchor` (higher = more similar; 0 = unrelated). */
export function similarityScore(anchor: EventItem, candidate: EventItem, now = new Date()): number {
  if (candidate.id === anchor.id || candidate.slug === anchor.slug) return 0;

  // Only recommend events that haven't happened yet.
  const when = Date.parse(candidate.dateISO);
  if (!Number.isNaN(when) && when < now.getTime() - MS_DAY) return 0;

  let score = 0;
  if (anchor.catId && candidate.catId === anchor.catId) score += 3;
  if (anchor.area && candidate.area && candidate.area.toLowerCase() === anchor.area.toLowerCase()) score += 2;

  // Date proximity: events within ±14 days of the anchor scale from +2 → 0.
  const a = Date.parse(anchor.dateISO);
  if (!Number.isNaN(a) && !Number.isNaN(when)) {
    const days = Math.abs(when - a) / MS_DAY;
    if (days <= 14) score += 2 - days / 7;
  }

  if (anchor.organiserId && candidate.organiserId === anchor.organiserId) score += 1;
  return score;
}

/** Top-N similar upcoming events for an anchor (default 4). */
export function similarEvents(anchor: EventItem, pool: EventItem[], limit = 4, now = new Date()): EventItem[] {
  return pool
    .map((e) => ({ e, s: similarityScore(anchor, e, now) }))
    .filter(({ s }) => s > 0)
    .sort((x, y) => y.s - x.s || x.e.dateISO.localeCompare(y.e.dateISO))
    .slice(0, limit)
    .map(({ e }) => e);
}
