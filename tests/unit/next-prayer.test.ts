import { describe, it, expect } from "vitest";
import { nextPrayerInfo, formatCountdown } from "../../lib/tools/next-prayer";

const TIMES = [
  { name: "Subuh", time: "5:42 am", mins: 5 * 60 + 42 },
  { name: "Zohor", time: "1:12 pm", mins: 13 * 60 + 12 },
  { name: "Asar", time: "4:45 pm", mins: 16 * 60 + 45 },
  { name: "Maghrib", time: "7:18 pm", mins: 19 * 60 + 18 },
  { name: "Isyak", time: "8:31 pm", mins: 20 * 60 + 31 },
];

describe("nextPrayerInfo", () => {
  it("finds the next prayer mid-day", () => {
    const n = nextPrayerInfo(TIMES, 14 * 60)!; // 2pm
    expect(n.name).toBe("Asar");
    expect(n.minsUntil).toBe(2 * 60 + 45);
    expect(n.progress).toBeGreaterThan(0);
    expect(n.progress).toBeLessThan(1);
  });
  it("rolls over past Isyak to tomorrow's Subuh", () => {
    const n = nextPrayerInfo(TIMES, 22 * 60)!; // 10pm
    expect(n.name).toBe("Subuh");
    expect(n.minsUntil).toBe(2 * 60 + (5 * 60 + 42)); // to midnight + to 5:42
  });
  it("handles pre-dawn (before Subuh) via the wrapped previous interval", () => {
    const n = nextPrayerInfo(TIMES, 3 * 60)!; // 3am
    expect(n.name).toBe("Subuh");
    expect(n.minsUntil).toBe(2 * 60 + 42);
    expect(n.progress).toBeGreaterThan(0);
    expect(n.progress).toBeLessThan(1);
  });
  it("returns null for empty input", () => {
    expect(nextPrayerInfo([], 600)).toBeNull();
  });
});

describe("formatCountdown", () => {
  it("formats hours+minutes and minutes-only", () => {
    expect(formatCountdown(138)).toBe("2h 18m");
    expect(formatCountdown(45)).toBe("45m");
  });
});
