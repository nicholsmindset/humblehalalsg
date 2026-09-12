import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSupabaseAdmin: vi.fn(),
  rateLimit: vi.fn(),
}));

vi.mock("@/lib/ratelimit", () => ({
  rateLimit: mocks.rateLimit,
  tooMany: (retryAfter: number) => new Response(
    JSON.stringify({ ok: false, error: "rate_limited" }),
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  ),
}));

vi.mock("@/lib/supabase/server", () => ({
  getSupabaseAdmin: mocks.getSupabaseAdmin,
}));

import { POST } from "@/app/api/freshness/route";

function request(body: Record<string, unknown>) {
  return new Request("https://example.test/api/freshness", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-real-ip": "203.0.113.10" },
    body: JSON.stringify(body),
  });
}

describe("community freshness route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.rateLimit.mockResolvedValue({ ok: true, retryAfter: 0 });
  });

  it("rate-limits repeated closed reports for the same business", async () => {
    mocks.rateLimit
      .mockResolvedValueOnce({ ok: true, retryAfter: 0 })
      .mockResolvedValueOnce({ ok: false, retryAfter: 86_400 });
    const req = request({ businessId: "business-123", state: "closed" });

    const response = await POST(req);

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("86400");
    expect(mocks.rateLimit).toHaveBeenNthCalledWith(1, req, "freshness", 20, 3600);
    expect(mocks.rateLimit).toHaveBeenNthCalledWith(
      2,
      req,
      "freshness-closed:business-123",
      1,
      86_400,
    );
    expect(mocks.getSupabaseAdmin).not.toHaveBeenCalled();
  });

  it("does not apply the closed-report cooldown to still-here confirmations", async () => {
    const req = request({ businessId: "business-123", state: "here" });

    const response = await POST(req);

    expect(response.status).toBe(200);
    expect(mocks.rateLimit).toHaveBeenCalledTimes(1);
    expect(mocks.rateLimit).toHaveBeenCalledWith(req, "freshness", 20, 3600);
  });
});
