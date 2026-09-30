import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  results: new Map<string, { data: unknown; error: unknown }>(),
}));

vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn(async () => ({ userId: "user-1" })) }));
vi.mock("@/lib/ratelimit", () => ({
  rateLimit: vi.fn(async () => ({ ok: true, retryAfter: 0 })),
  tooMany: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({
  getSupabaseAdmin: () => ({
    from: (table: string) => {
      const query = {
        select: () => query,
        eq: () => query,
        or: () => query,
        maybeSingle: async () => mocks.results.get(table) ?? { data: null, error: null },
      };
      return query;
    },
  }),
}));

import { POST } from "@/app/api/events/upload/route";

function uploadRequest() {
  const form = new FormData();
  form.set("eventId", "event-1");
  form.set("file", new File([new Uint8Array([0xff, 0xd8, 0xff])], "cover.jpg", { type: "image/jpeg" }));
  return new Request("https://example.com/api/events/upload", { method: "POST", body: form });
}

describe("POST /api/events/upload", () => {
  beforeEach(() => {
    mocks.results.clear();
  });

  it("returns a gateway error when the event lookup fails", async () => {
    mocks.results.set("events", { data: null, error: { message: "database unavailable" } });

    const response = await POST(uploadRequest());

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({ ok: false, reason: "lookup_failed" });
  });

  it("returns a gateway error when the profile lookup fails", async () => {
    mocks.results.set("events", { data: { id: "event-1", business_id: null, submitted_by: "other-user" }, error: null });
    mocks.results.set("profiles", { data: null, error: { message: "database unavailable" } });

    const response = await POST(uploadRequest());

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({ ok: false, reason: "lookup_failed" });
  });

  it("returns a gateway error when the ownership lookup fails", async () => {
    mocks.results.set("events", { data: { id: "event-1", business_id: "business-1", submitted_by: "other-user" }, error: null });
    mocks.results.set("profiles", { data: { role: "owner" }, error: null });
    mocks.results.set("businesses", { data: null, error: { message: "database unavailable" } });

    const response = await POST(uploadRequest());

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({ ok: false, reason: "lookup_failed" });
  });
});
