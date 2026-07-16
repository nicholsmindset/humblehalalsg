import { describe, expect, it } from "vitest";
import { signCrmPayload } from "@/lib/crm-signature";

describe("CRM webhook signature", () => {
  it("signs timestamp and exact body with HMAC-SHA256", () => {
    expect(signCrmPayload("secret", "1712345678", '{"eventId":"abc"}')).toBe(
      "c18be5fb1397ccfc6e1ed58b982534e74c4b98060bfa0d31daebfa0918bfe7c4",
    );
  });

  it("changes when timestamp or payload changes", () => {
    const original = signCrmPayload("secret", "100", "body");
    expect(signCrmPayload("secret", "101", "body")).not.toBe(original);
    expect(signCrmPayload("secret", "100", "body ")).not.toBe(original);
  });
});
