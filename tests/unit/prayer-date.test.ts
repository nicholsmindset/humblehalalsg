import { afterEach, describe, expect, it, vi } from "vitest";
import { aladhanDatePath, localDateISO } from "../../lib/tools/prayer-date";
import { getPrayerTimesFor } from "../../lib/tools/prayer-times";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("localDateISO", () => {
  it("formats the calendar date in the runtime's local timezone", () => {
    expect(localDateISO(new Date(2026, 6, 28, 23, 30))).toBe("2026-07-28");
  });
});

describe("aladhanDatePath", () => {
  it("converts an ISO calendar date for Aladhan's dated endpoint", () => {
    expect(aladhanDatePath("2026-07-28")).toBe("28-07-2026");
  });

  it("rejects impossible or malformed calendar dates", () => {
    expect(aladhanDatePath("2026-02-30")).toBeNull();
    expect(aladhanDatePath("28-07-2026")).toBeNull();
  });
});

describe("getPrayerTimesFor", () => {
  it("uses Aladhan's undated endpoint when no date is supplied", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { timings: {} } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await getPrayerTimesFor(1.3521, 103.8198, 11);

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.aladhan.com/v1/timings?latitude=1.3521&longitude=103.8198&method=11",
      { next: { revalidate: 86400 } },
    );
  });

  it("keys the upstream request to the user's calendar date", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          timings: {
            Fajr: "05:30",
            Sunrise: "06:45",
            Dhuhr: "13:00",
            Asr: "16:30",
            Maghrib: "19:20",
            Isha: "20:30",
          },
          date: { readable: "28 Jul 2026", hijri: { day: "13", month: { en: "Safar" }, year: "1448" } },
          meta: { timezone: "Asia/Singapore" },
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await getPrayerTimesFor(1.3521, 103.8198, 11, "2026-07-28");

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/timings/28-07-2026?"),
      { next: { revalidate: 86400 } },
    );
  });
});
