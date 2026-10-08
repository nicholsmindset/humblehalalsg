import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  getSupabaseAdmin: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({ auth: mocks.auth }));
vi.mock("@/lib/supabase/server", () => ({ getSupabaseAdmin: mocks.getSupabaseAdmin }));

import { GET, PATCH } from "@/app/api/owner/listing/route";

function adminWithOwnershipResult(result: unknown) {
  const builder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue(result),
  };
  return { from: vi.fn().mockReturnValue(builder) };
}

describe("owner listing route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ userId: "user_1" });
  });

  it.each([
    ["GET", () => GET(new Request("https://example.test/api/owner/listing?id=business_1"))],
    ["PATCH", () => PATCH(new Request("https://example.test/api/owner/listing", {
      method: "PATCH",
      body: JSON.stringify({ id: "business_1", phone: "12345678" }),
    }))],
  ])("returns a service error when the %s ownership lookup fails", async (_method, callRoute) => {
    mocks.getSupabaseAdmin.mockReturnValue(adminWithOwnershipResult({
      data: null,
      error: { message: "database unavailable" },
    }));

    const response = await callRoute();

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ ok: false, error: "load_failed" });
  });
});
