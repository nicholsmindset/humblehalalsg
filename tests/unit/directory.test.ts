import { describe, expect, it } from "vitest";
import { isMuisExpiryCurrent } from "@/lib/directory";

describe("directory certificate expiry", () => {
  it("uses the Singapore calendar date at the UTC day boundary", () => {
    const earlyMorningSG = new Date("2026-08-05T17:00:00.000Z");

    expect(isMuisExpiryCurrent("2026-08-05", earlyMorningSG)).toBe(false);
    expect(isMuisExpiryCurrent("2026-08-06", earlyMorningSG)).toBe(true);
  });

  it("treats a missing expiry as current for legacy records", () => {
    expect(isMuisExpiryCurrent("", new Date("2026-08-05T17:00:00.000Z"))).toBe(true);
  });
});
