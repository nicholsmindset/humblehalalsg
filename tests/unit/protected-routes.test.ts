import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { protectedRouteRedirect } from "@/proxy";

describe("protected route redirects", () => {
  it("sends signed-out owner visitors to login and preserves the requested path", () => {
    const response = protectedRouteRedirect(
      new NextRequest("https://www.humblehalal.com/owner?tab=leads"),
      null,
    );

    expect(response?.status).toBe(307);
    expect(response?.headers.get("location")).toBe(
      "https://www.humblehalal.com/login?next=%2Fowner%3Ftab%3Dleads",
    );
  });

  it("does not redirect authenticated or public requests", () => {
    expect(
      protectedRouteRedirect(new NextRequest("https://www.humblehalal.com/owner"), "user_123"),
    ).toBeNull();
    expect(
      protectedRouteRedirect(new NextRequest("https://www.humblehalal.com/explore"), null),
    ).toBeNull();
  });
});
