/* Halal Passport — weekly quests (code-defined, reset Monday SGT). Progress is
   computed from the points ledger within the current week; completing a quest
   awards a one-off bonus (idempotent by quest + week). Pure/isomorphic. */

import { sgtDate, type PassportSource } from "./passport";

export interface Quest {
  id: string;
  title: string;
  desc: string;
  metric: Extract<PassportSource, "review" | "visit" | "follow" | "referral" | "checkin">;
  target: number;
  bonus: number;
}

/* The full pool. Each user sees a PERSONALISED subset each week
   (selectQuestsForWeek) — stable within the week, varying by user + week, so
   quests feel fresh and tailored rather than a fixed global checklist. */
export const QUESTS: Quest[] = [
  { id: "review1", title: "First impressions", desc: "Write a review this week", metric: "review", target: 1, bonus: 25 },
  { id: "review2", title: "Share the word", desc: "Write 2 reviews this week", metric: "review", target: 2, bonus: 45 },
  { id: "visit2", title: "Out and about", desc: "Collect 2 stamps this week", metric: "visit", target: 2, bonus: 35 },
  { id: "visit3", title: "Explorer", desc: "Collect 3 stamps this week", metric: "visit", target: 3, bonus: 55 },
  { id: "follow2", title: "Show some love", desc: "Follow 2 halal businesses", metric: "follow", target: 2, bonus: 20 },
  { id: "checkin3", title: "Keep the habit", desc: "Check in 3 days this week", metric: "checkin", target: 3, bonus: 25 },
  { id: "refer1", title: "Bring a friend", desc: "Invite a friend who joins & takes action", metric: "referral", target: 1, bonus: 60 },
];

export const QUESTS_PER_WEEK = 3;

/* Deterministic per-(user, week) selection — no randomness (would break
   idempotency) and no mid-week churn. A stable hash of userId+weekKey rotates
   the pool; the referral quest is always kept (the word-of-mouth driver). */
function hash(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h >>> 0;
}

export function selectQuestsForWeek(userId: string, weekKey: string, count = QUESTS_PER_WEEK): Quest[] {
  const referral = QUESTS.filter((q) => q.metric === "referral").slice(0, 1);
  const rest = QUESTS.filter((q) => q.metric !== "referral");
  const start = hash(`${userId}:${weekKey}`) % rest.length;
  const rotated = [...rest.slice(start), ...rest.slice(0, start)];
  const need = Math.max(0, count - referral.length);
  return [...referral, ...rotated.slice(0, need)].slice(0, count);
}

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
