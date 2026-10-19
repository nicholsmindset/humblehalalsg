import { afterEach, describe, expect, it, vi } from "vitest";

const { minRates } = vi.hoisted(() => ({
  minRates: vi.fn(),
}));

vi.mock("@/lib/liteapi", () => ({
  liteapiConfigured: () => true,
  minRates,
}));
vi.mock("@/lib/ratelimit", () => ({
  rateLimit: () => Promise.resolve({ ok: true }),
  tooMany: vi.fn(),
}));

import { POST } from "@/app/api/travel/min-rates/route";

afterEach(() => {
  vi.clearAllMocks();
});

const request = (adults: unknown) => new Request("https://humblehalal.sg/api/travel/min-rates", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    hotelIds: ["hotel-1"],
    checkin: "2026-09-10",
    checkout: "2026-09-12",
    adults,
  }),
});

describe("POST /api/travel/min-rates", () => {
  it.each([
    [2.7, 3],
    [0, 1],
    [99, 8],
    ["not-a-number", 2],
  ])("normalizes adult occupancy %j to %i", async (input, expected) => {
    minRates.mockResolvedValue({});

    const response = await POST(request(input));

    expect(response.status).toBe(200);
    expect(minRates).toHaveBeenCalledWith(
      ["hotel-1"],
      "2026-09-10",
      "2026-09-12",
      "SG",
      "USD",
      expected,
    );
  });
});
