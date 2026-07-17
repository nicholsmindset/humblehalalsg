import { describe, it, expect } from "vitest";
import { strengthScore } from "../../lib/profile-strength";

const FULL = { photosCount: 5, descriptionLength: 200, hasHours: true, hasContact: true, hasWebsite: true, verified: true };

describe("profile strength", () => {
  it("full profile scores 100%", () => {
    expect(strengthScore(FULL).score).toBe(1);
  });
  it("empty profile scores 0% with all checks actionable", () => {
    const r = strengthScore({ photosCount: 0, descriptionLength: 0, hasHours: false, hasContact: false, hasWebsite: false, verified: false });
    expect(r.score).toBe(0);
    expect(r.checks.every((c) => !c.done)).toBe(true);
    expect(r.checks.every((c) => c.tab)).toBeTruthy();
  });
  it("photo check labels remaining count", () => {
    const r = strengthScore({ ...FULL, photosCount: 1 });
    const photo = r.checks.find((c) => c.key === "photos")!;
    expect(photo.done).toBe(false);
    expect(photo.label).toContain("2 more photo");
  });
});
