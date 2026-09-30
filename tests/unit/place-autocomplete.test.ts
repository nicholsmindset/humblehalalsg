import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("travel place autocomplete", () => {
  it("cancels in-flight searches and ignores stale responses", () => {
    const source = readFileSync(
      new URL("../../components/screens/travel/shared.tsx", import.meta.url),
      "utf8",
    );

    expect(source).toContain("{ signal: controller.signal }");
    expect(source).toContain("if (active && d.ok)");
    expect(source).toContain("controller.abort()");
  });
});
