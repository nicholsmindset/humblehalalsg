import { afterEach, describe, expect, it, vi } from "vitest";

const { getPrayerTimesFor } = vi.hoisted(() => ({
  getPrayerTimesFor: vi.fn(),
}));

vi.mock("@/lib/tools/prayer-times", () => ({ getPrayerTimesFor }));

import { GET } from "@/app/api/tools/prayer-times/route";

afterEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/tools/prayer-times", () => {
  it("accepts legacy requests without passing an explicit date", async () => {
    getPrayerTimesFor.mockResolvedValue(null);

    const response = await GET(new Request(
      "https://humblehalal.sg/api/tools/prayer-times?lat=1.3521&lng=103.8198&method=11",
    ));

    expect(response.status).toBe(200);
    expect(getPrayerTimesFor).toHaveBeenCalledWith(1.3521, 103.8198, 11);
  });
});
