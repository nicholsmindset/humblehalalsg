import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  createPortalSession: vi.fn(),
  limit: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({ auth: mocks.auth }));
vi.mock("@/lib/stripe", () => ({
  getStripe: () => ({
    billingPortal: { sessions: { create: mocks.createPortalSession } },
  }),
}));
vi.mock("@/lib/supabase/server", () => ({
  getSupabaseAdmin: () => ({
    from: () => ({
      select() {
        return this;
      },
      or() {
        return this;
      },
      not() {
        return this;
      },
      eq() {
        return this;
      },
      limit: mocks.limit,
    }),
  }),
}));

describe("billing portal route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ userId: "user-1" });
  });

  it("returns 503 when the customer lookup fails", async () => {
    mocks.limit.mockResolvedValue({ data: null, error: { message: "database unavailable" } });

    const { POST } = await import("@/app/api/portal/route");
    const response = await POST(new Request("https://example.com/api/portal", {
      method: "POST",
      body: JSON.stringify({ businessId: "business-1" }),
    }));

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ ok: false, reason: "service_unavailable" });
    expect(mocks.createPortalSession).not.toHaveBeenCalled();
  });

  it("preserves the no-customer response for a successful empty lookup", async () => {
    mocks.limit.mockResolvedValue({ data: [], error: null });

    const { POST } = await import("@/app/api/portal/route");
    const response = await POST(new Request("https://example.com/api/portal", {
      method: "POST",
      body: JSON.stringify({ businessId: "business-1" }),
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: false, reason: "no_customer" });
    expect(mocks.createPortalSession).not.toHaveBeenCalled();
  });
});
