import { describe, it, expect } from "vitest";
import { VerdictSchema, verdictBlocksApproval, verdictSlug, VERDICT_META, VERDICTS } from "../../lib/verdicts";

/* The verdict engine is compliance-sensitive: a 'halal' verdict must never
   publish without a cited official source, and the structured payload must
   validate before it can be approved. These lock those invariants. */

const base = {
  h1: "Is Oreo Halal in Singapore?",
  verdict: "likely" as const,
  confidence: "medium" as const,
  verdict_label: "Likely halal",
  cert_status: "No MUIS cert",
  one_line_answer: "No haram ingredients found, but no Singapore certification — likely halal with conditions.",
  why_verdict: ["Ingredients are plant-based.", "No SG certification means confirm the source."],
  confidence_explainer: "No certification to confirm against, so not high confidence.",
  ingredient_table: [{ name: "Wheat flour", status: "halal" as const, note: "Plant-based" }],
  look_for: [{ icon: "✅", text: "MUI Indonesia logo → safe" }],
  alternatives: [],
  official_sources: [],
  scholarly_views: [],
  internal_links: { related_checks: ["cadbury"], cross_sell: [] },
  faq_jsonld_answer: "Oreo has no known haram ingredients but is not MUIS-certified in Singapore.",
};

describe("VerdictSchema", () => {
  it("accepts a well-formed verdict", () => {
    expect(VerdictSchema.safeParse(base).success).toBe(true);
  });
  it("rejects an unknown verdict value", () => {
    expect(VerdictSchema.safeParse({ ...base, verdict: "kosher" }).success).toBe(false);
  });
  it("rejects a bad confidence value", () => {
    expect(VerdictSchema.safeParse({ ...base, confidence: "very-high" }).success).toBe(false);
  });
  it("every verdict value has display metadata", () => {
    for (const v of VERDICTS) expect(VERDICT_META[v]).toBeTruthy();
  });
  it("rejects an official source with a javascript: URL (XSS guard)", () => {
    const evil = { ...base, official_sources: [{ body: "MUIS", claim: "x", url: "javascript:alert(1)" }] };
    expect(VerdictSchema.safeParse(evil).success).toBe(false);
  });
  it("rejects other dangerous URL schemes on a source", () => {
    for (const url of ["data:text/html,<script>1</script>", " vbscript:msgbox", "file:///etc/passwd"]) {
      expect(VerdictSchema.safeParse({ ...base, official_sources: [{ body: "X", claim: "y", url }] }).success).toBe(false);
    }
  });
  it("still accepts an https official source", () => {
    const ok = { ...base, official_sources: [{ body: "MUIS", claim: "certifies", url: "https://halal.muis.gov.sg/x" }] };
    expect(VerdictSchema.safeParse(ok).success).toBe(true);
  });
});

describe("verdictBlocksApproval — the compliance gate", () => {
  it("blocks a 'halal' verdict with no cited source", () => {
    expect(verdictBlocksApproval({ verdict: "halal", official_sources: [] })).toBeTruthy();
  });
  it("blocks a 'halal' verdict whose source has no real URL", () => {
    expect(verdictBlocksApproval({ verdict: "halal", official_sources: [{ body: "MUIS", claim: "x", url: "" }] })).toBeTruthy();
  });
  it("allows a 'halal' verdict with a cited https source", () => {
    expect(verdictBlocksApproval({ verdict: "halal", official_sources: [{ body: "MUIS", claim: "certifies", url: "https://halal.muis.gov.sg/x" }] })).toBeNull();
  });
  it("never blocks non-halal verdicts", () => {
    for (const v of ["likely", "mashbooh", "depends", "haram"] as const) {
      expect(verdictBlocksApproval({ verdict: v, official_sources: [] })).toBeNull();
    }
  });
});

describe("verdictSlug", () => {
  it("slugifies names consistently", () => {
    expect(verdictSlug("Oreo")).toBe("oreo");
    expect(verdictSlug("Ben & Jerry's")).toBe("ben-and-jerry-s");
    expect(verdictSlug("E471")).toBe("e471");
  });
});
