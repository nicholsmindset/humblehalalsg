/* Halal Passport — rewards catalogue (code-defined digital perks, v1).
   Redeeming spends points (a negative ledger delta) via the redeem_reward RPC.
   Business-backed perks (real discounts) layer on later as new entries + a
   redemption-verification flow. Pure/isomorphic. */

export interface Reward {
  id: string;
  title: string;
  desc: string;
  cost: number;
  icon: string;
  /** false = one-time unlock (dedupe redeem:<id>); true = repeatable. */
  repeatable?: boolean;
  /** side-effect the redeem route applies (kept honest + deliverable in v1). */
  effect?: "member_badge" | "spotlight" | "early_access";
}

export const REWARDS: Reward[] = [
  { id: "member_badge", title: "Verified Member badge", desc: "A permanent badge on your passport that says you're an active member.", cost: 150, icon: "badge-check", effect: "member_badge" },
  { id: "early_access", title: "Early-access pass", desc: "Get new area & Ramadan guides in your inbox before everyone else.", cost: 120, icon: "mail", effect: "early_access" },
  { id: "spotlight", title: "Leaderboard spotlight", desc: "Get a ⭐ next to your name on the leaderboard for 30 days.", cost: 300, icon: "star", effect: "spotlight" },
];

export function rewardById(id: string): Reward | undefined {
  return REWARDS.find((r) => r.id === id);
}
