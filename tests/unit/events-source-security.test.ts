import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSupabaseAdmin: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  getSupabaseAdmin: mocks.getSupabaseAdmin,
  supabaseConfigured: true,
}));

import { getGoneEventMeta } from "@/lib/events-source";

describe("getGoneEventMeta", () => {
  beforeEach(() => {
    mocks.getSupabaseAdmin.mockReset();
  });

  it.each([
    "missing,id.gte.0",
    "missing)or(id.gte.0",
    "missing.slug",
    "",
    "a".repeat(65),
  ])("rejects unsafe route references before querying: %s", async (ref) => {
    await expect(getGoneEventMeta(ref)).resolves.toBeNull();
    expect(mocks.getSupabaseAdmin).not.toHaveBeenCalled();
  });
});
