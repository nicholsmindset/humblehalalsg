import { describe, it, expect } from "vitest";
import { tierFor, nextTier, badgesFor, streakFrom, totalPoints, earnedPoints, TIERS, type PassportStats } from "../../lib/passport";
import { QUESTS, weekInfoSgt, questCount, selectQuestsForWeek, QUESTS_PER_WEEK } from "../../lib/passport-quests";

/* The passport point/tier/streak model drives what users see and earn — lock
   the boundaries so a refactor can't silently shift a tier cutoff or break a streak. */

const stats = (o: Partial<PassportStats> = {}): PassportStats => ({
  totalPoints: 0, balance: 0, reviewCount: 0, visitCount: 0, followCount: 0, streakDays: 0, qualifiedReferrals: 0, ...o,
});

describe("totalPoints / earnedPoints", () => {
  it("totalPoints is the net balance (spending lowers it)", () => {
    expect(totalPoints([{ delta: 50 }, { delta: 20 }, { delta: -30 }])).toBe(40);
    expect(totalPoints([])).toBe(0);
  });
  it("earnedPoints is lifetime positive only (spending never lowers tier)", () => {
    expect(earnedPoints([{ delta: 50 }, { delta: 20 }, { delta: -30 }])).toBe(70);
    expect(earnedPoints([{ delta: -30 }])).toBe(0);
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

describe("quests", () => {
  const rows = (n: number, type: string, since: string) =>
    Array.from({ length: n }, (_, i) => ({ source_type: type, source_id: `b${i}`, created_at: since }));

  it("counts distinct qualifying events since the week start", () => {
    const q = QUESTS.find((x) => x.metric === "review")!;
    const since = "2026-07-06T00:00:00.000Z"; // within-week timestamp
    expect(questCount(q, rows(3, "review", since), "2026-07-05T00:00:00.000Z")).toBe(3);
  });
  it("ignores events before the week start and other metrics", () => {
    const q = QUESTS.find((x) => x.metric === "review")!;
    const old = [{ source_type: "review", source_id: "b1", created_at: "2026-06-01T00:00:00.000Z" }];
    const other = [{ source_type: "follow", source_id: "b2", created_at: "2026-07-06T00:00:00.000Z" }];
    expect(questCount(q, [...old, ...other], "2026-07-05T00:00:00.000Z")).toBe(0);
  });
  it("weekInfoSgt returns a Monday weekKey + a since instant", () => {
    const info = weekInfoSgt(new Date("2026-07-08T10:00:00+08:00")); // a Wednesday
    expect(info.weekKey).toBe("2026-07-06"); // Monday
    expect(new Date(info.sinceIso).getTime()).toBeLessThan(new Date("2026-07-08T10:00:00+08:00").getTime());
  });

  it("selectQuestsForWeek is deterministic, sized, and always includes referral", () => {
    const a1 = selectQuestsForWeek("user_abc", "2026-07-06");
    const a2 = selectQuestsForWeek("user_abc", "2026-07-06");
    expect(a1.map((q) => q.id)).toEqual(a2.map((q) => q.id)); // stable within a week
    expect(a1).toHaveLength(QUESTS_PER_WEEK);
    expect(a1.some((q) => q.metric === "referral")).toBe(true); // word-of-mouth always
    expect(new Set(a1.map((q) => q.id)).size).toBe(a1.length); // no dupes
  });
  it("selectQuestsForWeek varies across users / weeks", () => {
    const u1 = selectQuestsForWeek("user_aaa", "2026-07-06").map((q) => q.id).join();
    const u2 = selectQuestsForWeek("user_zzz", "2026-07-06").map((q) => q.id).join();
    const w2 = selectQuestsForWeek("user_aaa", "2026-07-13").map((q) => q.id).join();
    // At least one of the two comparisons should differ (rotation over the pool).
    expect(u1 !== u2 || u1 !== w2).toBe(true);
  });
});
