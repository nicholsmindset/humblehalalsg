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
});
