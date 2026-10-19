import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  aiObject: vi.fn(),
  searchFlights: vi.fn(),
}));

vi.mock("@/lib/feature-flags", () => ({
  getServerFlags: vi.fn().mockResolvedValue({ aiConcierge: true }),
}));

vi.mock("@/lib/ratelimit", () => ({
  rateLimit: vi.fn().mockResolvedValue({ ok: true }),
  tooMany: vi.fn(),
}));

vi.mock("@/lib/ai", () => ({
  aiConfigured: true,
  AI_MODEL_FAST: "test-model",
  aiObject: mocks.aiObject,
}));

vi.mock("@/lib/liteapi", () => ({
  liteapiConfigured: () => true,
  searchAirports: vi.fn(),
  searchFlights: mocks.searchFlights,
}));

vi.mock("@/lib/flights", () => ({
  normalizeItineraries: vi.fn(() => []),
}));

import { POST } from "@/app/api/travel/flights/ai-search/route";

describe("AI flight search route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.aiObject.mockResolvedValue({
      answer: "Let's find flights for your family.",
      origin: "SIN",
      destination: "JED",
      date: "2026-10-01",
      returnDate: null,
      tripType: "one",
      adults: 2,
      children: 1,
      infants: 1,
      cabin: "economy",
      nonStop: false,
    });
    mocks.searchFlights.mockResolvedValue([]);
  });

  it("forwards infants extracted from the AI request to the flight provider", async () => {
    const response = await POST(new Request("https://example.test/api/travel/flights/ai-search", {
      method: "POST",
      body: JSON.stringify({ query: "SIN to JED for two adults, one child and one infant" }),
    }));

    expect(response.status).toBe(200);
    expect(mocks.searchFlights).toHaveBeenCalledWith(expect.objectContaining({
      adults: 2,
      children: 1,
      infants: 1,
    }));
  });
});
