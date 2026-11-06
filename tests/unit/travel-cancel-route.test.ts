import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  cancelBooking: vi.fn(),
  getServerFlags: vi.fn(),
  getSupabaseAdmin: vi.fn(),
  liteapiConfigured: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({ auth: mocks.auth }));
vi.mock("@/lib/feature-flags", () => ({ getServerFlags: mocks.getServerFlags }));
vi.mock("@/lib/liteapi", () => ({
  cancelBooking: mocks.cancelBooking,
  liteapiConfigured: mocks.liteapiConfigured,
}));
vi.mock("@/lib/supabase/server", () => ({ getSupabaseAdmin: mocks.getSupabaseAdmin }));

import { POST } from "@/app/api/travel/cancel/route";

function request() {
  return new Request("https://example.test/api/travel/cancel", {
    method: "POST",
    body: JSON.stringify({ id: "booking_1" }),
  });
}

function adminWithResults(lookup: unknown, update: unknown = { error: null }) {
  const lookupBuilder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue(lookup),
  };
  const updateBuilder = {
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue(update),
  };
  return {
    from: vi.fn()
      .mockReturnValueOnce(lookupBuilder)
      .mockReturnValueOnce(updateBuilder),
  };
}

describe("hotel cancellation route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getServerFlags.mockResolvedValue({ paidHotels: true });
    mocks.auth.mockResolvedValue({ userId: "user_1" });
    mocks.liteapiConfigured.mockReturnValue(true);
    mocks.cancelBooking.mockResolvedValue(undefined);
  });

  it("returns a service error instead of treating a failed lookup as missing", async () => {
    mocks.getSupabaseAdmin.mockReturnValue(adminWithResults({ data: null, error: { message: "offline" } }));

    const response = await POST(request());

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ ok: false, error: "Could not load this booking." });
    expect(mocks.cancelBooking).not.toHaveBeenCalled();
  });

  it("does not report success when the local status update fails", async () => {
    mocks.getSupabaseAdmin.mockReturnValue(adminWithResults(
      { data: { id: "booking_1", liteapi_booking_id: "lite_1", user_id: "user_1", status: "confirmed" }, error: null },
      { error: { message: "write failed" } },
    ));

    const response = await POST(request());

    expect(mocks.cancelBooking).toHaveBeenCalledWith("lite_1");
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      ok: false,
      error: "Cancellation completed, but the booking status could not be updated. Please contact support.",
    });
  });
});
