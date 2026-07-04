/* Halal Passport — weekly quests (code-defined, reset Monday SGT). Progress is
   computed from the points ledger within the current week; completing a quest
   awards a one-off bonus (idempotent by quest + week). Pure/isomorphic. */

import { sgtDate, type PassportSource } from "./passport";

export interface Quest {
  id: string;
  title: string;
  desc: string;
  metric: Extract<PassportSource, "review" | "visit" | "follow" | "referral">;
  target: number;
  bonus: number;
}

export const QUESTS: Quest[] = [
  { id: "review2", title: "Share the word", desc: "Write 2 reviews this week", metric: "review", target: 2, bonus: 40 },
  { id: "visit3", title: "Out and about", desc: "Collect 3 stamps this week", metric: "visit", target: 3, bonus: 50 },
  { id: "follow2", title: "Show some love", desc: "Follow 2 halal businesses", metric: "follow", target: 2, bonus: 20 },
  { id: "refer1", title: "Bring a friend", desc: "Get a friend to join and take action", metric: "referral", target: 1, bonus: 60 },
];

/** Monday-00:00-SGT of the current week: a stable weekKey + the UTC instant to
   filter ledger rows from. weekKey (Monday's date) is also the dedupe suffix. */
export function weekInfoSgt(now: Date): { weekKey: string; sinceIso: string } {
  const today = sgtDate(now); // YYYY-MM-DD (SGT)
  const base = new Date(today + "T00:00:00Z"); // midnight UTC of that SGT calendar date (weekday math)
  const offset = (base.getUTCDay() + 6) % 7; // days since Monday
  const monday = new Date(base.getTime() - offset * 86400000).toISOString().slice(0, 10);
  return { weekKey: monday, sinceIso: new Date(monday + "T00:00:00+08:00").toISOString() };
}

/** Distinct qualifying events for a quest since the week start. */
export function questCount(quest: Quest, rows: { source_type: string; source_id: string | null; created_at: string }[], sinceIso: string): number {
  const ids = new Set<string>();
  rows.forEach((r, i) => {
    if (r.source_type === quest.metric && r.created_at >= sinceIso) ids.add(r.source_id ?? `row-${i}`);
  });
  return ids.size;
}
