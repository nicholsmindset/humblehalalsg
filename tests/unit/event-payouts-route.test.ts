import { beforeEach, describe, expect, it, vi } from "vitest";

const lte = vi.fn();

vi.mock("@/lib/cron", () => ({ authorizeCron: () => true }));
vi.mock("@/lib/stripe", () => ({ getStripe: () => ({}) }));
vi.mock("@/lib/email", () => ({ sendEmail: vi.fn() }));
vi.mock("@/lib/emails/recipient", () => ({ emailForBusinessOwner: vi.fn() }));
vi.mock("@/lib/emails/templates", () => ({ payoutSentEmail: vi.fn() }));
vi.mock("@/lib/notify", () => ({ notify: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({
  getSupabaseAdmin: () => ({
    from: (table: string) => {
      if (table === "orders") {
        const query = {
          select: () => query,
          eq: () => query,
          is: () => query,
          lte,
        };
        lte.mockReturnValue({ limit: vi.fn().mockResolvedValue({ data: [] }) });
        return query;
      }
      return { insert: vi.fn().mockResolvedValue({ error: null }) };
    },
  }),
}));

describe("event payout cron", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  it("checks payout eligibility using the Singapore calendar date", async () => {
    vi.setSystemTime(new Date("2026-08-01T16:30:00.000Z"));
    const { GET } = await import("@/app/api/cron/event-payouts/route");

    const response = await GET(new Request("https://example.com/api/cron/event-payouts"));

    expect(response.status).toBe(200);
    expect(lte).toHaveBeenCalledWith("payout_due", "2026-08-02");
  });
});
