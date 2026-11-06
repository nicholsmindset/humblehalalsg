import { afterEach, describe, expect, it, vi } from "vitest";

const { getSupabaseAdmin } = vi.hoisted(() => ({
  getSupabaseAdmin: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({ getSupabaseAdmin }));

import { GET as getBadge } from "@/app/api/badge/[slug]/route";
import { GET as getSticker } from "@/app/api/sticker/[slug]/route";

afterEach(() => {
  vi.clearAllMocks();
});

function mockBusinessLookup(result: { data: unknown; error: unknown }) {
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    maybeSingle: vi.fn().mockResolvedValue(result),
  };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  getSupabaseAdmin.mockReturnValue({ from: vi.fn().mockReturnValue(query) });
}

describe("public listing SVG routes", () => {
  it.each([
    ["badge", getBadge],
    ["sticker", getSticker],
  ])("returns 503 when the %s business lookup fails", async (path, handler) => {
    mockBusinessLookup({ data: null, error: { message: "database unavailable" } });

    const response = await handler(
      new Request(`https://humblehalal.sg/api/${path}/example-business`),
      { params: Promise.resolve({ slug: "example-business" }) },
    );

    expect(response.status).toBe(503);
    await expect(response.text()).resolves.toBe("Not available");
    expect(response.headers.get("Cache-Control")).toBeNull();
  });
});
