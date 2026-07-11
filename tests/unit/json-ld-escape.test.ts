import { describe, it, expect } from "vitest";
import { serializeJsonLd } from "../../components/seo/json-ld";

/* Stored-XSS regression: JSON-LD is inlined into a <script> via
   dangerouslySetInnerHTML, and owner-editable fields (listing description →
   blurb) flow into it. A raw JSON.stringify lets `</script>…` break out; prod
   CSP has no script-src to catch it. serializeJsonLd must escape the break-out
   chars while keeping the JSON semantically intact. */
describe("serializeJsonLd — XSS-safe JSON-LD serialization", () => {
  const payload = { description: "Nasi</script><img src=x onerror=alert(1)>&stuff" };
  const out = serializeJsonLd(payload);

  it("emits no raw </script> or angle brackets that could break out", () => {
    expect(out.includes("</script>")).toBe(false);
    expect(out.includes("<")).toBe(false);
    expect(out.includes(">")).toBe(false);
    expect(out.includes("&")).toBe(false);
  });

  it("escapes to the \\uXXXX forms", () => {
    expect(out).toContain("\\u003c"); // <
    expect(out).toContain("\\u003e"); // >
    expect(out).toContain("\\u0026"); // &
  });

  it("stays valid JSON that round-trips to the original string", () => {
    // The browser's JSON.parse decodes \uXXXX back to the original chars.
    const parsed = JSON.parse(out) as { description: string };
    expect(parsed.description).toBe(payload.description);
  });

  it("escapes the JS line/paragraph separators U+2028/U+2029", () => {
    const LS = String.fromCharCode(0x2028);
    const PS = String.fromCharCode(0x2029);
    const sep = serializeJsonLd({ x: `a${LS}b${PS}c` });
    expect(sep.includes(LS)).toBe(false);
    expect(sep.includes(PS)).toBe(false);
    expect(sep).toContain("\\u2028");
    expect(sep).toContain("\\u2029");
  });
});
