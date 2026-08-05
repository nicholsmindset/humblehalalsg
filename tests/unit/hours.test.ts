import { describe, expect, it } from "vitest";
import { isOpenNow, openStatus, type WeekHours } from "@/lib/hours";

describe("isOpenNow", () => {
  it("does not treat today's future overnight shift as open after midnight", () => {
    const week: WeekHours = [
      null,
      { open: "18:00", close: "02:00" },
      null,
      null,
      null,
      null,
      null,
    ];

    // Tuesday 1:00 AM in Singapore, before Tuesday's 6:00 PM opening.
    expect(isOpenNow(week, new Date("2026-08-03T17:00:00.000Z"))).toBe(false);
  });
});

describe("openStatus", () => {
  it("reports the previous day's closing time during an overnight spill", () => {
    const week: WeekHours = [
      { open: "18:00", close: "02:00" },
      { open: "09:00", close: "17:00" },
      null,
      null,
      null,
      null,
      null,
    ];

    // Tuesday 1:00 AM in Singapore: still inside Monday's overnight hours.
    const status = openStatus(week, new Date("2026-08-03T17:00:00.000Z"));

    expect(status).toEqual({ open: true, label: "Open · closes 2 AM" });
  });
});
