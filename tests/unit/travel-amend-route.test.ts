import { beforeEach, describe, expect, it, vi } from "vitest";

const state: {
  booking: { id: string; liteapi_booking_id: string | null; user_id: string; status: string } | null;
  bookingError: { message: string } | null;
} = {
  booking: null,
  bookingError: null,
};

const amendBooking = vi.fn();

vi.mock("@/lib/feature-flags", () => ({
  getServerFlags: () => Promise.resolve({ paidHotels: true }),
}));
vi.mock("@clerk/nextjs/server", () => ({
  auth: () => Promise.resolve({ userId: "user-1" }),
}));
vi.mock("@/lib/liteapi", () => ({
  amendBooking,
  liteapiConfigured: () => true,
}));
vi.mock("@/lib/supabase/server", () => ({
  getSupabaseAdmin: () => ({
    from: () => {
      const query = {
        select: () => query,
        eq: () => query,
        maybeSingle: () => Promise.resolve({ data: state.booking, error: state.bookingError }),
      };
      return query;
    },
  }),
}));

function amendRequest() {
  return new Request("https://example.com/api/travel/amend", {
    method: "POST",
    body: JSON.stringify({ id: "booking-1", firstName: "Nur", lastName: "Aisyah" }),
  });
}

describe("hotel booking amendment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.booking = null;
    state.bookingError = null;
  });

  it("returns a service error when the booking lookup fails", async () => {
    state.bookingError = { message: "database unavailable" };
    const { POST } = await import("@/app/api/travel/amend/route");

    const response = await POST(amendRequest());

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ ok: false, error: "Could not load this booking." });
    expect(amendBooking).not.toHaveBeenCalled();
  });

  it("still reports an absent booking as not found", async () => {
    const { POST } = await import("@/app/api/travel/amend/route");

    const response = await POST(amendRequest());

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ ok: false, error: "Booking not found" });
    expect(amendBooking).not.toHaveBeenCalled();
  });
});
