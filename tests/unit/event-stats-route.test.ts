import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.fn();
const getSupabaseAdmin = vi.fn();

vi.mock("@clerk/nextjs/server", () => ({ auth }));
vi.mock("@/lib/supabase/server", () => ({ getSupabaseAdmin }));

type QueryResult = { data: unknown; error: { message: string } | null };

function createAdmin(failTable?: "orders" | "tickets" | "ticket_tiers") {
  const resultFor = (table: string): QueryResult => ({
    data: [],
    error: table === failTable ? { message: `${table} unavailable` } : null,
  });

  return {
    from(table: string) {
      const query = {
        select: () => query,
        eq: () => query,
        or: () => query,
        limit: () => Promise.resolve(resultFor(table)),
        order: () => Promise.resolve(resultFor(table)),
        maybeSingle: () => {
          if (table === "events") {
            return Promise.resolve({
              data: {
                id: "event-1",
                title: "Community Dinner",
                slug: "community-dinner",
                status: "published",
                capacity: 100,
                is_free: false,
                date_iso: "2026-10-10",
                business_id: null,
                submitted_by: "user-1",
                display: {},
              },
              error: null,
            });
          }
          if (table === "profiles") {
            return Promise.resolve({ data: { role: "owner" }, error: null });
          }
          return Promise.resolve(resultFor(table));
        },
      };
      return query;
    },
  };
}

describe("event stats route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.mockResolvedValue({ userId: "user-1" });
  });

  it.each(["orders", "tickets", "ticket_tiers"] as const)(
    "returns a gateway error when the %s query fails",
    async (table) => {
      getSupabaseAdmin.mockReturnValue(createAdmin(table));
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
      const { GET } = await import("@/app/api/events/[id]/stats/route");

      const response = await GET(
        new Request("https://example.com/api/events/event-1/stats"),
        { params: Promise.resolve({ id: "event-1" }) },
      );

      expect(response.status).toBe(502);
      await expect(response.json()).resolves.toEqual({ ok: false, reason: "query_failed" });
      consoleError.mockRestore();
    },
  );

  it("returns empty metrics when all stats queries succeed", async () => {
    getSupabaseAdmin.mockReturnValue(createAdmin());
    const { GET } = await import("@/app/api/events/[id]/stats/route");

    const response = await GET(
      new Request("https://example.com/api/events/event-1/stats"),
      { params: Promise.resolve({ id: "event-1" }) },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      tickets: { issued: 0, checkedIn: 0 },
      attendance: { booked: 0 },
      sales: { grossCents: 0 },
    });
  });
});
