import { beforeEach, describe, expect, it, vi } from "vitest";

const gte = vi.fn();
const lt = vi.fn();

vi.mock("@/lib/cron", () => ({ authorizeCron: () => true }));
vi.mock("@/lib/liteapi", () => ({
  liteapiConfigured: () => true,
  searchFlights: vi.fn(),
}));
vi.mock("@/lib/flights", () => ({ normalizeItineraries: vi.fn(() => []) }));
vi.mock("@/lib/email", () => ({ sendEmail: vi.fn() }));
vi.mock("@/lib/emails/templates", () => ({ fareAlertEmail: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({
  getSupabaseAdmin: () => ({
    from: (table: string) => {
      if (table === "fare_watches") {
        const selectQuery = {
          select: () => selectQuery,
          eq: () => selectQuery,
          gte,
          order: () => selectQuery,
          limit: vi.fn().mockResolvedValue({ data: [] }),
        };
        const updateQuery = {
          lt,
          eq: vi.fn().mockResolvedValue({ error: null }),
        };
        return {
          ...selectQuery,
          update: () => updateQuery,
        };
      }
      return { insert: vi.fn().mockResolvedValue({ error: null }) };
    },
  }),
}));

describe("fare alert cron", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.useFakeTimers();
    gte.mockImplementation(() => ({
      order: () => ({ limit: vi.fn().mockResolvedValue({ data: [] }) }),
    }));
    lt.mockImplementation(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) }));
  });

  it("checks and expires watches using the Singapore calendar date", async () => {
    vi.setSystemTime(new Date("2026-08-01T16:30:00.000Z"));
    const { GET } = await import("@/app/api/cron/fare-alerts/route");

    const response = await GET(new Request("https://example.com/api/cron/fare-alerts"));

    expect(response.status).toBe(200);
    expect(gte).toHaveBeenCalledWith("depart_date", "2026-08-02");
    expect(lt).toHaveBeenCalledWith("depart_date", "2026-08-02");
  });
});
