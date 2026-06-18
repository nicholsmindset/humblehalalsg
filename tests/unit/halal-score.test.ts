import { describe, it, expect } from "vitest";
import { halalScore, scoreTone, muisUnbacked } from "../../lib/halal-score";
import { halalSgVerifyUrl } from "../../lib/muis";
import type { BadgeKey } from "../../lib/types";

const b = (...x: BadgeKey[]) => x;

describe("halalScore — the trust signal", () => {
  it("MUIS cert on file scores highest tier", () => {
    const r = halalScore({ badges: b("muis"), verify: { certNo: "MUIS-1", confirms: 0, verified: null, expires: null, renewed: false } });
    expect(r.tier).toBe("muis");
    expect(r.score).toBe(94); // base 90 + 4 cert
  });

  it("admin tier without cert uses base", () => {
    expect(halalScore({ badges: b("admin") }).score).toBe(78);
  });

  it("statusChanged overrides everything → reported", () => {
    const r = halalScore({ badges: b("muis"), statusChanged: true });
    expect(r.tier).toBe("reported");
    expect(r.score).toBe(26);
  });

  it("pending badge → pending tier", () => {
    expect(halalScore({ badges: b("pending") }).tier).toBe("pending");
  });

  it("self-declared promotes to community only with enough confirmations", () => {
    expect(halalScore({ badges: b("friendly"), verify: { confirms: 10 } as never }).tier).toBe("declared");
    expect(halalScore({ badges: b("friendly"), verify: { confirms: 60 } as never }).tier).toBe("community");
  });

  it("expiring-soon penalises the score", () => {
    const ok = halalScore({ badges: b("muis"), verify: { certNo: "X", confirms: 0 } as never }).score;
    const soon = halalScore({ badges: b("muis"), verify: { certNo: "X", confirms: 0, expiringSoon: true } as never }).score;
    expect(soon).toBeLessThan(ok);
  });

  it("score is always clamped to 0–100", () => {
    const r = halalScore({ badges: b("muis"), verify: { certNo: "X", renewed: true, confirms: 9999 } as never });
    expect(r.score).toBeLessThanOrEqual(100);
    expect(r.score).toBeGreaterThanOrEqual(0);
  });

  it("scoreTone maps tiers to colour tokens", () => {
    expect(scoreTone("muis")).toContain("emerald");
    expect(scoreTone("reported")).toContain("danger");
  });

  // Audit #1 — a MUIS claim with no certificate number on file must NOT be
  // presented as officially certified (no evidence = no definitive badge/score).
  it("MUIS claim WITHOUT a cert number is downgraded (not the muis tier)", () => {
    const r = halalScore({ badges: b("muis") });
    expect(r.tier).not.toBe("muis");
    expect(r.tier).toBe("declared");
    expect(r.score).toBeLessThan(90);
  });

  it("an admin-backed MUIS claim with no cert still resolves to admin (own assertion)", () => {
    expect(halalScore({ badges: b("muis", "admin") }).tier).toBe("admin");
  });
});

describe("muisUnbacked — evidence gate", () => {
  it("true only for a MUIS claim with no cert number", () => {
    expect(muisUnbacked({ badges: b("muis"), verify: undefined })).toBe(true);
    expect(muisUnbacked({ badges: b("muis"), verify: { certNo: "MUIS-1" } as never })).toBe(false);
    expect(muisUnbacked({ badges: b("admin"), verify: undefined })).toBe(false);
    expect(muisUnbacked({ badges: b("friendly"), verify: undefined })).toBe(false);
  });
});

describe("halalSgVerifyUrl — register deep-link", () => {
  it("prefers the certificate number when present", () => {
    expect(halalSgVerifyUrl("muis-abc-1", "Some Cafe")).toContain("keyword=MUIS-ABC-1");
  });
  it("falls back to the business name when no cert", () => {
    expect(halalSgVerifyUrl(null, "Some Cafe")).toContain("keyword=Some%20Cafe");
  });
});
