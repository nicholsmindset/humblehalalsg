import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  getServerFlags: vi.fn(),
  getSupabaseAdmin: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({ auth: mocks.auth }));
vi.mock("@/lib/feature-flags", () => ({ getServerFlags: mocks.getServerFlags }));
vi.mock("@/lib/supabase/server", () => ({ getSupabaseAdmin: mocks.getSupabaseAdmin }));

function queryResult(result: { data: unknown; error: unknown }) {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    or: vi.fn(() => query),
    maybeSingle: vi.fn().mockResolvedValue(result),
  };
  return query;
}

function request() {
  return new Request("https://example.com/api/owner/leads/status", {
    method: "POST",
    body: JSON.stringify({ routeId: "route-1", status: "contacted" }),
  });
}

describe("owner lead status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ userId: "owner-1" });
    mocks.getServerFlags.mockResolvedValue({ leadRouting: true });
  });

  it("reports a database failure during the lead route lookup", async () => {
    const routeLookup = queryResult({ data: null, error: { message: "database unavailable" } });
    mocks.getSupabaseAdmin.mockReturnValue({ from: vi.fn(() => routeLookup) });

    const { POST } = await import("@/app/api/owner/leads/status/route");
    const response = await POST(request());

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({ ok: false, error: "query_failed" });
  });

  it("reports a database failure during the ownership lookup", async () => {
    const routeLookup = queryResult({
      data: { id: "route-1", business_id: "business-1", status: "accepted" },
      error: null,
    });
    const ownershipLookup = queryResult({ data: null, error: { message: "database unavailable" } });
    mocks.getSupabaseAdmin.mockReturnValue({
      from: vi.fn().mockReturnValueOnce(routeLookup).mockReturnValueOnce(ownershipLookup),
    });

    const { POST } = await import("@/app/api/owner/leads/status/route");
    const response = await POST(request());

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({ ok: false, error: "query_failed" });
  });
});
