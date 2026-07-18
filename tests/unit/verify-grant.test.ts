import { describe, it, expect } from "vitest";
import { isExpiringSoon, tierAndScore, buildGrantPatch } from "@/lib/verify-grant";
import { halalScore } from "@/lib/halal-score";

/* A halal grant (manual verify OR approving an uploaded cert) must translate to
   the SAME businesses.halal_tier / halal_score whichever admin surface triggers
   it (lib/verify-grant is the single source). A drift here mislabels a business's
   halal trust signal — the core product claim. */

describe("isExpiringSoon", () => {
  it("is true within ~90 days, false beyond, false for missing/garbage", () => {
    const soon = new Date(Date.now() + 30 * 864e5).toISOString();
    const far = new Date(Date.now() + 365 * 864e5).toISOString();
    expect(isExpiringSoon(soon)).toBe(true);
    expect(isExpiringSoon(far)).toBe(false);
    expect(isExpiringSoon(null)).toBe(false);
    expect(isExpiringSoon("not-a-date")).toBe(false);
  });
});

describe("tierAndScore", () => {
  it("MUIS grant → 'muis' tier, matching a direct halalScore computation", () => {
    const { tier, score } = tierAndScore("muis", "MUIS-123", false);
    expect(tier).toBe("muis");
    const expected = halalScore({
      badges: ["muis"], certified: true,
      verify: { certNo: "MUIS-123", verified: null, expires: null, confirms: 0, renewed: false, expiringSoon: false },
    });
    expect(score).toBe(expected.score);
  });

  it("Admin grant → 'admin' tier", () => {
    const { tier } = tierAndScore("admin", "", false);
    expect(tier).toBe("admin");
  });

  it("Revoke → drops back to 'declared'", () => {
    const { tier, score } = tierAndScore("revoke", "MUIS-123", false);
    expect(tier).toBe("declared");
    expect(score).toBe(halalScore({ badges: ["friendly"] }).score);
  });

  it("an expiring cert scores no higher than a fresh one", () => {
    const fresh = tierAndScore("muis", "C1", false).score;
    const expiring = tierAndScore("muis", "C1", true).score;
    expect(expiring).toBeLessThanOrEqual(fresh);
  });
});

describe("buildGrantPatch", () => {
  it("MUIS: records cert number + scheme + expiry and sets last_verified_at", () => {
    const patch = buildGrantPatch({ action: "muis", certNo: "MUIS-9", scheme: "Eating Establishment", expiry: "2999-01-01" });
    expect(patch.muis_cert_no).toBe("MUIS-9");
    expect(patch.muis_scheme).toBe("Eating Establishment");
    expect(patch.muis_expiry).toBe("2999-01-01");
    expect(patch.halal_tier).toBe("muis");
    expect(Number.isFinite(Date.parse(patch.last_verified_at))).toBe(true);
  });

  it("Admin: does not claim a MUIS cert number/scheme", () => {
    const patch = buildGrantPatch({ action: "admin", certNo: "X", scheme: "Y", expiry: "2999-01-01" });
    expect(patch.muis_cert_no).toBeNull();
    expect(patch.muis_scheme).toBeNull();
    expect(patch.halal_tier).toBe("admin");
  });

  it("Revoke: clears all MUIS fields", () => {
    const patch = buildGrantPatch({ action: "revoke", certNo: "C", scheme: "S", expiry: "2999-01-01" });
    expect(patch.muis_cert_no).toBeNull();
    expect(patch.muis_scheme).toBeNull();
    expect(patch.muis_expiry).toBeNull();
    expect(patch.halal_tier).toBe("declared");
  });
});
