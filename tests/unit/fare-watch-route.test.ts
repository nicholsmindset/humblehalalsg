import { beforeEach, describe, expect, it, vi } from "vitest";

const upsert = vi.fn();

vi.mock("@/lib/ratelimit", () => ({
  rateLimit: vi.fn().mockResolvedValue({ ok: true }),
  tooMany: vi.fn(),
}));
vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn().mockResolvedValue({ userId: "user_123" }),
  currentUser: vi.fn().mockResolvedValue({ primaryEmailAddress: { emailAddress: "traveller@example.com" } }),
}));
vi.mock("@/lib/supabase/server", () => ({
  getSupabaseAdmin: () => ({ from: () => ({ upsert }) }),
}));

function request(body: Record<string, unknown>) {
  return new Request("https://example.com/api/travel/flights/watch", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("fare watch route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    upsert.mockResolvedValue({ error: null });
  });

  it.each([
    { body: { origin: "SIN1", destination: "KUL", date: "2026-09-01" }, label: "invalid airport code" },
    { body: { origin: "SIN", destination: "KUL!", date: "2026-09-01" }, label: "invalid destination code" },
    { body: { origin: "SIN", destination: "KUL", date: "2026-02-31" }, label: "impossible calendar date" },
    { body: { origin: "SIN", destination: "KUL", date: "2026-09-01", price: -10 }, label: "negative price" },
    { body: { origin: "SIN", destination: "KUL", date: "2026-09-01", price: "Infinity" }, label: "non-finite price" },
  ])("rejects an $label", async ({ body }) => {
    const { POST } = await import("@/app/api/travel/flights/watch/route");

    const response = await POST(request(body));

    expect(response.status).toBe(422);
    expect(upsert).not.toHaveBeenCalled();
  });

  it("normalizes valid airport codes and persists a positive price", async () => {
    const { POST } = await import("@/app/api/travel/flights/watch/route");

    const response = await POST(request({ origin: " sin ", destination: "kul", date: "2026-09-01", currency: "sgd", price: "123.45" }));

    expect(response.status).toBe(200);
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ origin: "SIN", destination: "KUL", depart_date: "2026-09-01", currency: "SGD", last_price: 123.45 }),
      { onConflict: "email,origin,destination,depart_date" },
    );
  });
});
