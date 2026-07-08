import { describe, it, expect } from "vitest";
import { tierFor, nextTier, badgesFor, streakFrom, totalPoints, TIERS, type PassportStats } from "../../lib/passport";

/* The passport point/tier/streak model drives what users see and earn — lock
   the boundaries so a refactor can't silently shift a tier cutoff or break a streak. */

const stats = (o: Partial<PassportStats> = {}): PassportStats => ({
  totalPoints: 0, reviewCount: 0, visitCount: 0, followCount: 0, streakDays: 0, qualifiedReferrals: 0, ...o,
});

describe("totalPoints", () => {
  it("sums the ledger deltas", () => {
    expect(totalPoints([{ delta: 50 }, { delta: 20 }, { delta: 5 }])).toBe(75);
    expect(totalPoints([])).toBe(0);
  });
});

describe("tierFor / nextTier", () => {
  it("maps points to the highest tier reached", () => {
    expect(tierFor(0).key).toBe("explorer");
    expect(tierFor(99).key).toBe("explorer");
    expect(tierFor(100).key).toBe("regular");
    expect(tierFor(300).key).toBe("foodie");
    expect(tierFor(699).key).toBe("foodie");
    expect(tierFor(700).key).toBe("connoisseur");
    expect(tierFor(5000).key).toBe("ambassador");
  });
  it("reports points to the next tier, null at the top", () => {
    expect(nextTier(0)).toEqual({ tier: TIERS[1], pointsToGo: 100 });
    expect(nextTier(250)?.pointsToGo).toBe(50); // 300 - 250 → foodie
    expect(nextTier(1500)).toBeNull();
  });
});

describe("badgesFor", () => {
  it("awards badges when thresholds are met", () => {
    expect(badgesFor(stats({ reviewCount: 1 }))).toContain("first_review");
    expect(badgesFor(stats({ reviewCount: 10 }))).toContain("reviewer_10");
    expect(badgesFor(stats({ visitCount: 5 }))).toContain("explorer_5");
    expect(badgesFor(stats({ streakDays: 7 }))).toContain("streak_7");
    expect(badgesFor(stats({ qualifiedReferrals: 3 }))).toContain("ambassador_3");
    expect(badgesFor(stats())).toEqual([]);
  });
});

describe("streakFrom", () => {
  it("counts consecutive days ending today", () => {
    expect(streakFrom(["2026-07-04", "2026-07-03", "2026-07-02"], "2026-07-04")).toBe(3);
  });
  it("keeps the streak alive if today isn't active yet but yesterday was", () => {
    expect(streakFrom(["2026-07-03", "2026-07-02"], "2026-07-04")).toBe(2);
  });
  it("resets when the last active day is older than yesterday", () => {
    expect(streakFrom(["2026-07-01"], "2026-07-04")).toBe(0);
  });
  it("ignores gaps", () => {
    expect(streakFrom(["2026-07-04", "2026-07-02", "2026-07-01"], "2026-07-04")).toBe(1);
  });
  it("returns 0 for no activity", () => {
    expect(streakFrom([], "2026-07-04")).toBe(0);
  });
});
