import { beforeEach, describe, expect, it, vi } from "vitest";

const rpc = vi.fn();
const update = vi.fn();

const chainTo = <T>(result: T) => {
  const chain = {
    eq: vi.fn(() => chain),
    or: vi.fn(() => chain),
    select: vi.fn(() => chain),
    maybeSingle: vi.fn().mockResolvedValue(result),
  };
  return chain;
};

vi.mock("@clerk/nextjs/server", () => ({ auth: () => ({ userId: "admin-1" }) }));
vi.mock("@/lib/email", () => ({ sendEmail: vi.fn().mockResolvedValue({ ok: true }) }));
vi.mock("@/lib/emails/templates", () => ({
  joinApprovedEmail: () => ({ subject: "Approved", html: "Approved" }),
  joinDeclinedEmail: () => ({ subject: "Declined", html: "Declined" }),
}));
vi.mock("@/lib/supabase/server", () => ({
  getSupabaseAdmin: () => ({
    rpc,
    from: (table: string) => {
      if (table === "events") {
        return chainTo({ data: { id: "event-1", business_id: null, submitted_by: "owner-1", title: "Dinner", capacity: 10, taken: 8 } });
      }
      if (table === "profiles") return chainTo({ data: { role: "admin" } });
      if (table === "tickets") return { insert: vi.fn().mockResolvedValue({ error: null }) };
      if (table === "orders") {
        const selected = chainTo({ data: { id: "order-1", event_id: "event-1", qty: 2, status: "pending", amount_cents: 0, buyer_email: "guest@example.com" } });
        return {
          select: selected.select,
          update: (value: unknown) => {
            update(value);
            return chainTo({ data: { id: "order-1" }, error: null });
          },
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    },
  }),
}));

describe("event join request approval", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rpc.mockImplementation((name: string) => Promise.resolve(name === "reserve_event_capacity"
      ? { data: true, error: null }
      : { data: null, error: null }));
  });

  it("reserves capacity atomically instead of incrementing after a read check", async () => {
    const { POST } = await import("@/app/api/events/[id]/requests/route");
    const response = await POST(
      new Request("https://example.com/api/events/event-1/requests", {
        method: "POST",
        body: JSON.stringify({ orderId: "order-1", action: "approve" }),
      }),
      { params: Promise.resolve({ id: "event-1" }) },
    );

    expect(response.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith("reserve_event_capacity", { p_event_id: "event-1", p_qty: 2 });
    expect(rpc).not.toHaveBeenCalledWith("increment_event_taken", expect.anything());
    expect(update).toHaveBeenCalledWith({ status: "confirmed" });
  });
});
