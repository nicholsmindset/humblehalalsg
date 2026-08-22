import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Clerk prebuilt UI configuration", () => {
  it("does not disable the UI bundle needed by UserButton", () => {
    const layout = readFileSync(new URL("../../app/layout.tsx", import.meta.url), "utf8");

    expect(layout).not.toContain("prefetchUI={false}");
  });
});
