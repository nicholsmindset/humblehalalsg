import { describe, it, expect } from "vitest";
import { sniffFileType, sniffAllowed, extForType } from "../../lib/file-sniff";

const bytes = (...b: number[]) => new Uint8Array(b);
const pad = (head: number[], len = 16) => {
  const a = new Uint8Array(len);
  a.set(head);
  return a;
};

describe("sniffFileType", () => {
  it("detects JPEG", () => expect(sniffFileType(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe("image/jpeg"));
  it("detects PNG", () => expect(sniffFileType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))).toBe("image/png"));
  it("detects WEBP (RIFF….WEBP)", () =>
    expect(sniffFileType(pad([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]))).toBe("image/webp"));
  it("detects AVIF (ftyp avif)", () =>
    expect(sniffFileType(pad([0, 0, 0, 0, 0x66, 0x74, 0x79, 0x70, 0x61, 0x76, 0x69, 0x66]))).toBe("image/avif"));
  it("detects PDF", () => expect(sniffFileType(bytes(0x25, 0x50, 0x44, 0x46, 0x2d))).toBe("application/pdf"));

  it("rejects an EXE (MZ) masquerading as an image", () =>
    expect(sniffFileType(bytes(0x4d, 0x5a, 0x90, 0x00))).toBeNull());
  it("rejects an ELF binary", () =>
    expect(sniffFileType(bytes(0x7f, 0x45, 0x4c, 0x46))).toBeNull());
  it("rejects HTML/script bytes", () =>
    expect(sniffFileType(bytes(0x3c, 0x21, 0x44, 0x4f))).toBeNull()); // "<!DO"
  it("rejects too-short input", () => expect(sniffFileType(bytes(0xff, 0xd8))).toBeNull());
});

describe("sniffAllowed", () => {
  it("returns the type when allowed", () =>
    expect(sniffAllowed(bytes(0xff, 0xd8, 0xff), ["image/jpeg", "image/png"])).toBe("image/jpeg"));
  it("returns null when the real type isn't in the allowlist", () =>
    expect(sniffAllowed(bytes(0x25, 0x50, 0x44, 0x46), ["image/jpeg", "image/png"])).toBeNull()); // pdf not allowed
  it("returns null for unrecognised bytes even if the caller allows everything", () =>
    expect(sniffAllowed(bytes(0x4d, 0x5a), ["image/jpeg"])).toBeNull());
});

describe("extForType", () => {
  it("maps to canonical extensions", () => {
    expect(extForType("image/jpeg")).toBe("jpg");
    expect(extForType("image/png")).toBe("png");
    expect(extForType("image/webp")).toBe("webp");
    expect(extForType("image/avif")).toBe("avif");
    expect(extForType("application/pdf")).toBe("pdf");
  });
});
