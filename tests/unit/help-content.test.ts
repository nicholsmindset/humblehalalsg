import { describe, it, expect } from "vitest";
import { HELP, helpByKey, helpForTab } from "@/lib/help-content";
import { FLAG_ENV } from "@/lib/flags";

describe("help-content", () => {
  it("every entry has non-empty copy and a valid category", () => {
    const cats = ["Getting started", "Features", "For businesses", "Travel", "Trust & verification"];
    for (const h of HELP) {
      expect(h.key, "key").toBeTruthy();
      expect(h.label, `${h.key} label`).toBeTruthy();
      expect(h.what.length, `${h.key} what`).toBeGreaterThan(0);
      expect(h.how.length, `${h.key} how`).toBeGreaterThan(0);
      expect(cats).toContain(h.faqCategory);
      expect(h.audience.length, `${h.key} audience`).toBeGreaterThan(0);
    }
  });

  it("keys are unique", () => {
    const keys = HELP.map((h) => h.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("every referenced flag exists in FLAG_ENV", () => {
    for (const h of HELP) {
      if (h.flag) expect(Object.keys(FLAG_ENV), `${h.key} flag`).toContain(h.flag);
    }
  });

  it("lookups work", () => {
    expect(helpByKey("passport")?.label).toBe("Halal Passport");
    expect(helpForTab("user", "passport")?.key).toBe("passport");
    expect(helpByKey("nope")).toBeUndefined();
  });

  // Accuracy invariants — the copy must match how the feature actually works
  // (audit found drift: passport omitted the business mechanic; semantic-search
  // described a directory search that doesn't exist; cert-vault omitted the plan).
  it("passport help serves both diners and businesses and explains the QR stamp", () => {
    const p = helpByKey("passport")!;
    expect(p.audience).toEqual(expect.arrayContaining(["user", "business"]));
    const text = (p.what + p.how.join(" ") + p.faqs.map((f) => f.q + f.a).join(" ")).toLowerCase();
    expect(text).toContain("qr");
    expect(text).toContain("stamp");
  });

  it("cert-vault help states the Verified+ plan requirement", () => {
    const c = helpByKey("cert-vault")!;
    expect((c.how.join(" ") + c.faqs.map((f) => f.a).join(" "))).toMatch(/verified/i);
  });

  it("semantic-search help is scoped to travel/hotels, not directory search", () => {
    const s = helpByKey("semantic-search")!;
    const text = (s.what + s.how.join(" ")).toLowerCase();
    expect(text).toContain("hotel");
    expect(text).not.toContain("explore or the map");
    expect(s.faqCategory).toBe("Travel");
  });
});
