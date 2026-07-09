import { describe, it, expect } from "vitest";
import { deriveIntent } from "@/lib/beehiiv";

describe("beehiiv deriveIntent", () => {
  it("maps sources to coarse intents", () => {
    expect(deriveIntent("tool:zakat")).toBe("deen");
    expect(deriveIntent("umrah")).toBe("travel");
    expect(deriveIntent("event")).toBe("events");
    expect(deriveIntent("ramadan")).toBe("seasonal");
    expect(deriveIntent("advertise")).toBe("owner");
    expect(deriveIntent("footer")).toBe("general");
    expect(deriveIntent("popup")).toBe("foodie");
  });
});
