import { beforeEach, describe, expect, it, vi } from "vitest";

const getEvent = vi.fn();

vi.mock("@/lib/ratelimit", () => ({
  rateLimit: vi.fn().mockResolvedValue({ ok: true }),
  tooMany: vi.fn(),
}));
vi.mock("@/lib/data", () => ({ getEvent }));
vi.mock("@/lib/events-source", () => ({ rowToEvent: vi.fn() }));
vi.mock("@/lib/stripe", () => ({
  getStripe: () => null,
  STATEMENT_SUFFIX: "HUMBLEHALAL",
}));
vi.mock("@/lib/supabase/server", () => ({ getSupabaseAdmin: () => null }));
vi.mock("@/lib/seo", () => ({ SITE: { url: "https://example.com" } }));

describe("donation route", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    getEvent.mockReturnValue({ id: "event-1", slug: "event-1", title: "Charity", donationEnabled: true });
  });

  it.each([
    ["fractional cents", 100.5],
    ["numeric strings", "100"],
    ["amounts below the minimum", 99],
    ["amounts above the maximum", 500_001],
  ])("rejects %s", async (_label, amountCents) => {
    const { POST } = await import("@/app/api/donate/route");
    const response = await POST(new Request("https://example.com/api/donate", {
      method: "POST",
      body: JSON.stringify({ eventId: "event-1", amountCents }),
    }));

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({ ok: false, reason: "bad_amount" });
    expect(getEvent).not.toHaveBeenCalled();
  });

  it("accepts whole cent amounts within the configured bounds", async () => {
    const { POST } = await import("@/app/api/donate/route");
    const response = await POST(new Request("https://example.com/api/donate", {
      method: "POST",
      body: JSON.stringify({ eventId: "event-1", amountCents: 12_345 }),
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, simulated: true });
    expect(getEvent).toHaveBeenCalledWith("event-1");
  });
});
