import { describe, expect, it } from "vitest";
import { cookie } from "@/app/api/track/route";

describe("tracking cookie parsing", () => {
  it("decodes the requested cookie", () => {
    expect(cookie("_fbc", "session=abc; _fbc=fb.1%2Fcampaign; _ttp=token")).toBe("fb.1/campaign");
  });

  it("ignores malformed percent-encoding", () => {
    expect(cookie("_fbc", "_fbc=invalid%ZZ; _ttp=token")).toBeUndefined();
  });
});
