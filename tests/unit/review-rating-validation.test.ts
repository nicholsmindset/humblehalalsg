import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  rateLimit: vi.fn(),
  getSupabaseAdmin: vi.fn(),
}));

vi.mock("@/lib/ratelimit", () => ({
  rateLimit: mocks.rateLimit,
  tooMany: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  getSupabaseAdmin: mocks.getSupabaseAdmin,
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

import { POST as submitBusinessReview } from "@/app/api/reviews/route";
import { POST as submitEventReview } from "@/app/api/events/[id]/reviews/route";

const reviewRequest = (body: Record<string, unknown>) => new Request("https://example.test/api/reviews", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

describe("review rating validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.rateLimit.mockResolvedValue({ ok: true, retryAfter: 0 });
    mocks.getSupabaseAdmin.mockReturnValue(null);
  });

  it("rejects a fractional business review rating", async () => {
    const response = await submitBusinessReview(reviewRequest({
      businessSlug: "example",
      rating: 4.5,
      text: "Good food",
    }));

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({ ok: false });
  });

  it("rejects a fractional event review rating", async () => {
    const response = await submitEventReview(
      reviewRequest({ rating: 4.5, text: "Good event" }),
      { params: Promise.resolve({ id: "example-event" }) },
    );

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({ ok: false });
  });

  it("continues accepting integer ratings", async () => {
    const businessResponse = await submitBusinessReview(reviewRequest({
      businessSlug: "example",
      rating: 4,
      text: "Good food",
    }));
    const eventResponse = await submitEventReview(
      reviewRequest({ rating: 5, text: "Good event" }),
      { params: Promise.resolve({ id: "example-event" }) },
    );

    expect(businessResponse.status).toBe(200);
    expect(eventResponse.status).toBe(200);
  });
});
