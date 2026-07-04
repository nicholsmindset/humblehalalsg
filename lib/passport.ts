/* Humble Halal — Halal Passport points/tiers/badges model (pure, isomorphic).
   Points are summed from the append-only ledger (lib/passport-server reads the
   DB); this module holds only the value tables + derivation helpers so the same
   logic runs on the server and in the client UI. No server imports here. */

export const POINTS = {
  review: 50,
  follow: 10,
  visit: 20,
  checkin: 5,
  referralReferrer: 100,
  referralReferred: 50,
} as const;

export type PassportSource = "review" | "follow" | "visit" | "checkin" | "referral" | "bonus";

export interface Tier {
  key: string;
  label: string;
  min: number;
}

export const TIERS: Tier[] = [
  { key: "explorer", label: "Explorer", min: 0 },
  { key: "regular", label: "Regular", min: 100 },
  { key: "foodie", label: "Foodie", min: 300 },
  { key: "connoisseur", label: "Connoisseur", min: 700 },
  { key: "ambassador", label: "Ambassador", min: 1500 },
];

export interface PassportStats {
  /** Lifetime earned points — drives tier + badges (never lowered by spending). */
  totalPoints: number;
  /** Spendable wallet balance (earned minus redeemed). */
  balance: number;
  reviewCount: number;
  visitCount: number;
  followCount: number;
  streakDays: number;
  qualifiedReferrals: number;
}

export interface BadgeDef {
  key: string;
  label: string;
  icon: string;
  desc: string;
  test: (s: PassportStats) => boolean;
}

export const BADGES: BadgeDef[] = [
  { key: "first_review", label: "First Review", icon: "star", desc: "Wrote your first review", test: (s) => s.reviewCount >= 1 },
  { key: "reviewer_10", label: "Trusted Reviewer", icon: "star", desc: "Wrote 10 reviews", test: (s) => s.reviewCount >= 10 },
  { key: "explorer_5", label: "5 Places Visited", icon: "pin", desc: "Collected stamps at 5 places", test: (s) => s.visitCount >= 5 },
  { key: "explorer_25", label: "City Explorer", icon: "pin", desc: "Collected stamps at 25 places", test: (s) => s.visitCount >= 25 },
  { key: "follower_10", label: "Community Supporter", icon: "heart", desc: "Followed 10 businesses", test: (s) => s.followCount >= 10 },
  { key: "streak_7", label: "7-Day Streak", icon: "sparkles", desc: "Active 7 days in a row", test: (s) => s.streakDays >= 7 },
  { key: "streak_30", label: "30-Day Streak", icon: "sparkles", desc: "Active 30 days in a row", test: (s) => s.streakDays >= 30 },
  { key: "connector_1", label: "Connector", icon: "users", desc: "Referred your first friend", test: (s) => s.qualifiedReferrals >= 1 },
  { key: "ambassador_3", label: "Community Ambassador", icon: "trophy", desc: "Referred 3 friends", test: (s) => s.qualifiedReferrals >= 3 },
];

/** Net balance — the spendable wallet (can go down when points are redeemed). */
export function totalPoints(rows: { delta: number }[]): number {
  return rows.reduce((n, r) => n + r.delta, 0);
}

/** Lifetime EARNED points — sum of positive deltas only. Drives tiers, badges
   and the leaderboard, so spending a reward never demotes you. */
export function earnedPoints(rows: { delta: number }[]): number {
  return rows.reduce((n, r) => n + (r.delta > 0 ? r.delta : 0), 0);
}

export function tierFor(points: number): Tier {
  return [...TIERS].reverse().find((t) => points >= t.min) ?? TIERS[0];
}

export function nextTier(points: number): { tier: Tier; pointsToGo: number } | null {
  const i = TIERS.findIndex((t) => t.key === tierFor(points).key);
  const next = TIERS[i + 1];
  return next ? { tier: next, pointsToGo: next.min - points } : null;
}

export function badgesFor(s: PassportStats): string[] {
  return BADGES.filter((b) => b.test(s)).map((b) => b.key);
}

/** YYYY-MM-DD in Singapore time (SGT, UTC+8) for a Date or ISO string. */
export function sgtDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  // en-CA gives ISO-style YYYY-MM-DD; timeZone shifts to SGT.
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Singapore", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

/** Longest run of consecutive SGT dates ending today (or yesterday, so a
   not-yet-active "today" doesn't reset a live streak). `activeDates` = the
   unique set of YYYY-MM-DD (SGT) the user earned anything. */
export function streakFrom(activeDates: string[], todaySgt: string): number {
  const set = new Set(activeDates);
  if (set.size === 0) return 0;

  const dayMs = 86400000;
  const parse = (s: string) => new Date(s + "T00:00:00Z").getTime();
  const fmt = (ms: number) => new Date(ms).toISOString().slice(0, 10);

  const todayMs = parse(todaySgt);
  const yesterdayMs = todayMs - dayMs;
  // Anchor the streak on the most recent active day (today or yesterday).
  let cursor: number;
  if (set.has(fmt(todayMs))) cursor = todayMs;
  else if (set.has(fmt(yesterdayMs))) cursor = yesterdayMs;
  else return 0;

  let streak = 0;
  while (set.has(fmt(cursor))) {
    streak += 1;
    cursor -= dayMs;
  }
  return streak;
}
