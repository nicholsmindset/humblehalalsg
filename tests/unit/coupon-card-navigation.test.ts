import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("CouponCard navigation", () => {
  const source = readFileSync(new URL("../../components/coupon-card.tsx", import.meta.url), "utf8");

  it("uses App Router navigation for internal destinations", () => {
    expect(source).toContain('import Link from "next/link"');
    expect(source).toContain('import { useRouter } from "next/navigation"');
    expect(source).toContain("router.push(`/sign-in?redirect=");
    expect(source).not.toContain("window.location.href");
    expect(source).toContain('<Link className="coupon-business"');
  });
});
