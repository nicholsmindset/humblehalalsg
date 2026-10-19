import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  afterCallbacks: [] as (() => Promise<void>)[],
  getSupabaseAdmin: vi.fn(),
}));

vi.mock("next/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/server")>();
  return {
    ...actual,
    after: vi.fn((callback: () => Promise<void>) => {
      mocks.afterCallbacks.push(callback);
    }),
  };
});

vi.mock("@/lib/supabase/server", () => ({
  getSupabaseAdmin: mocks.getSupabaseAdmin,
}));

import { GET as getReviewLink } from "@/app/r/[slug]/route";
import { GET as getEventLink } from "@/app/e/[slug]/route";

describe("short-link redirects", () => {
  beforeEach(() => {
    mocks.afterCallbacks.length = 0;
    mocks.getSupabaseAdmin.mockReset();
  });

  it("defers review-link analytics until after returning the redirect", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    mocks.getSupabaseAdmin.mockReturnValue({
      from: vi.fn(() => ({ insert })),
    });

    const response = await getReviewLink(
      new Request("https://humblehalal.sg/r/kampong-cafe", {
        headers: { referer: "https://example.com/review" },
      }),
      { params: Promise.resolve({ slug: "kampong-cafe" }) },
    );

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe(
      "https://humblehalal.sg/business/kampong-cafe?tab=reviews&utm_source=review-link&utm_medium=qr",
    );
    expect(insert).not.toHaveBeenCalled();

    await mocks.afterCallbacks[0]();

    expect(insert).toHaveBeenCalledWith({
      event_type: "page_view",
      listing_slug: "kampong-cafe",
      path: "/r/kampong-cafe",
      referrer: "https://example.com/review",
    });
  });

  it("defers event referral attribution until after returning the redirect", async () => {
    const eventMaybeSingle = vi.fn().mockResolvedValue({ data: { id: "event-id" } });
    const refMaybeSingle = vi.fn().mockResolvedValue({ data: { id: "ref-id" } });
    const rpc = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn((table: string) => {
      if (table === "events") {
        return {
          select: vi.fn(() => ({
            or: vi.fn(() => ({ maybeSingle: eventMaybeSingle })),
          })),
        };
      }
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({ maybeSingle: refMaybeSingle })),
          })),
        })),
      };
    });
    mocks.getSupabaseAdmin.mockReturnValue({ from, rpc });

    const response = await getEventLink(
      new Request("https://humblehalal.sg/e/raya-bazaar?ref=PARTNER-1"),
      { params: Promise.resolve({ slug: "raya-bazaar" }) },
    );

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("https://humblehalal.sg/events/raya-bazaar");
    expect(from).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();

    await mocks.afterCallbacks[0]();

    expect(from).toHaveBeenCalledWith("events");
    expect(from).toHaveBeenCalledWith("event_ref_codes");
    expect(rpc).toHaveBeenCalledWith("increment_ref_click", { p_id: "ref-id" });
  });
});
