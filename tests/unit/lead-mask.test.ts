import { describe, it, expect } from "vitest";
import { maskName, maskEmail, maskPhone } from "@/lib/lead-mask";

/* A business sees only a masked brief until it ACCEPTS a lead (which consumes
   quota); raw name/email/phone must never leak before then (lib/lead-mask).
   These are the PII redaction rules — a regression here exposes a consumer's
   real contact details to every business the lead was fanned out to. */

describe("maskName", () => {
  it("keeps the first name and only a last initial", () => {
    expect(maskName("Ahmad Rahman")).toBe("Ahmad R.");
    expect(maskName("mary jane watson")).toBe("mary W.");
  });

  it("returns a single name unchanged (no initial to add)", () => {
    expect(maskName("Ahmad")).toBe("Ahmad");
  });

  it("falls back to a neutral label for empty / missing names", () => {
    expect(maskName("")).toBe("New enquiry");
    expect(maskName("   ")).toBe("New enquiry");
    expect(maskName(null)).toBe("New enquiry");
    expect(maskName(undefined)).toBe("New enquiry");
  });
});

describe("maskEmail", () => {
  it("reveals only the first char and the domain", () => {
    expect(maskEmail("ahmad@example.com")).toBe("a••••@example.com");
    expect(maskEmail("a@b.com")).toBe("a•••@b.com"); // min 3 dots even for 1-char locals
  });

  it("never exposes the local part", () => {
    const masked = maskEmail("sensitive@humblehalal.sg");
    expect(masked).not.toBeNull();
    expect(masked).not.toContain("sensitive");
    expect(masked).toContain("@humblehalal.sg");
  });

  it("returns null for non-emails", () => {
    expect(maskEmail("notanemail")).toBeNull();
    expect(maskEmail("")).toBeNull();
    expect(maskEmail(null)).toBeNull();
  });
});

describe("maskPhone", () => {
  it("shows only the last three digits, stripping formatting", () => {
    expect(maskPhone("+65 9123 4567")).toBe("•••• 567");
    expect(maskPhone("91234567")).toBe("•••• 567");
  });

  it("fully masks numbers with fewer than four digits", () => {
    expect(maskPhone("123")).toBe("•••• ••••");
  });

  it("never exposes the full number", () => {
    expect(maskPhone("+65 9123 4567")).not.toContain("9123");
  });

  it("returns null for empty / missing phones", () => {
    expect(maskPhone("")).toBeNull();
    expect(maskPhone(null)).toBeNull();
    expect(maskPhone(undefined)).toBeNull();
  });
});
