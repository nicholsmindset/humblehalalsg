import { beforeEach, describe, expect, it, vi } from "vitest";

const from = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  getSupabaseAdmin: () => ({ from }),
}));
vi.mock("@/lib/data", () => ({ getEvent: () => undefined }));
vi.mock("@/lib/ratelimit", () => ({
  rateLimit: () => Promise.resolve({ ok: true, retryAfter: 0 }),
  tooMany: vi.fn(),
}));
vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }));
vi.mock("@/lib/email", () => ({ sendEmail: vi.fn() }));
vi.mock("@/lib/notify", () => ({ notify: vi.fn() }));

describe("RSVP route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each(["draft", "cancelled", "archived"])(
    "rejects an event with %s status before reserving capacity",
    async (status) => {
      const query = {
        select: vi.fn(),
        or: vi.fn(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            id: "event-1",
            capacity: 100,
            taken: 0,
            business_id: "business-1",
            status,
            title: "Private event",
            date_iso: "2099-01-01",
            ends_at: null,
          },
        }),
      };
      query.select.mockReturnValue(query);
      query.or.mockReturnValue(query);
      from.mockReturnValue(query);

      const { POST } = await import("@/app/api/rsvp/route");
      const response = await POST(
        new Request("https://example.com/api/rsvp", {
          method: "POST",
          body: JSON.stringify({ eventId: "event-1", qty: 1 }),
        }),
      );

      expect(response.status).toBe(404);
      await expect(response.json()).resolves.toEqual({ ok: false, reason: "event_not_found" });
      expect(from).toHaveBeenCalledTimes(1);
      expect(from).toHaveBeenCalledWith("events");
    },
  );
});
