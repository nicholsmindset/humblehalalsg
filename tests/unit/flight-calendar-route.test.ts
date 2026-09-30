import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/ratelimit", () => ({
  rateLimit: vi.fn().mockResolvedValue({ ok: true }),
  tooMany: vi.fn(),
}));
vi.mock("@/lib/liteapi", () => ({
  liteapiConfigured: () => false,
  searchFlights: vi.fn(),
}));
vi.mock("@/lib/flights", () => ({ normalizeItineraries: vi.fn() }));

describe("flight calendar route", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("filters stale dates using the Singapore calendar day", async () => {
    // August 2 in Singapore, while the server's UTC date is still August 1.
    vi.setSystemTime(new Date("2026-08-01T16:30:00.000Z"));
    const { POST } = await import("@/app/api/travel/flights/calendar/route");

    const response = await POST(new Request("https://example.com/api/travel/flights/calendar", {
      method: "POST",
      body: JSON.stringify({ origin: "SIN", destination: "KUL", date: "2026-08-02" }),
    }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.days.map((day: { date: string }) => day.date)).toEqual([
      "2026-08-01",
      "2026-08-02",
      "2026-08-03",
      "2026-08-04",
      "2026-08-05",
    ]);
  });
});
