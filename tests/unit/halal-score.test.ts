import { describe, it, expect } from "vitest";
import { halalScore, scoreTone } from "../../lib/halal-score";
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
});
