import { describe, it, expect } from "vitest";
import {
  isPostLive,
  postSchedule,
  scheduledDueOn,
  scheduledDueBy,
  nextQueuedSlots,
} from "../../lib/content-calendar";

describe("isPostLive — the blog publish gate", () => {
  it("published posts are always live, regardless of date", () => {
    expect(isPostLive("published", "2030-01-01", "2026-07-18")).toBe(true);
    expect(isPostLive("published", undefined, "2026-07-18")).toBe(true);
  });
  it("scheduled posts are hidden before their date", () => {
    expect(isPostLive("scheduled", "2026-07-26", "2026-07-18")).toBe(false);
  });
  it("scheduled posts go live on and after their date", () => {
    expect(isPostLive("scheduled", "2026-07-26", "2026-07-26")).toBe(true);
    expect(isPostLive("scheduled", "2026-07-26", "2026-08-01")).toBe(true);
  });
  it("draft posts are never live", () => {
    expect(isPostLive("draft", "2020-01-01", "2026-07-18")).toBe(false);
  });
});

describe("postSchedule integrity", () => {
  it("has unique slugs", () => {
    const slugs = postSchedule.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
  it("is ordered by ascending publishDate, one post per day from 2026-07-26", () => {
    expect(postSchedule[0].publishDate).toBe("2026-07-26");
    for (let i = 1; i < postSchedule.length; i++) {
      expect(postSchedule[i].publishDate > postSchedule[i - 1].publishDate).toBe(true);
    }
    const dates = new Set(postSchedule.map((p) => p.publishDate));
    expect(dates.size).toBe(postSchedule.length);
  });
  it("marks exactly the five seeded launch posts", () => {
    const seeded = postSchedule.filter((p) => p.status === "seeded").map((p) => p.slug);
    expect(seeded).toContain("waktu-solat-singapore");
    expect(seeded.length).toBe(5);
  });
});

describe("schedule helpers", () => {
  it("scheduledDueOn finds the post for a given date", () => {
    expect(scheduledDueOn("2026-07-26").map((p) => p.slug)).toEqual(["waktu-solat-singapore"]);
    expect(scheduledDueOn("2026-07-19")).toEqual([]);
  });
  it("scheduledDueBy is cumulative", () => {
    expect(scheduledDueBy("2026-07-25").length).toBe(0);
    expect(scheduledDueBy("2026-07-30").length).toBe(5);
  });
  it("nextQueuedSlots returns queued slots only", () => {
    const n = nextQueuedSlots(3);
    expect(n.length).toBe(3);
    expect(n.every((p) => p.status === "queued")).toBe(true);
  });
});
