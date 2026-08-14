import { describe, expect, it } from "vitest";
import {
  NEWSLETTER_POPUP_DISMISS_COOLDOWN_MS,
  newsletterPopupHandled,
  newsletterPopupStoreValue,
} from "@/lib/newsletter-popup";

describe("newsletter popup frequency", () => {
  const now = Date.UTC(2026, 7, 14, 5);

  it("permanently suppresses subscribers", () => {
    expect(newsletterPopupHandled("subscribed", now)).toBe(true);
  });

  it("suppresses a recent dismissal", () => {
    const dismissedAt = now - NEWSLETTER_POPUP_DISMISS_COOLDOWN_MS + 1;
    expect(newsletterPopupHandled(`dismissed:${dismissedAt}`, now)).toBe(true);
  });

  it("re-enables the popup after 14 days", () => {
    const dismissedAt = now - NEWSLETTER_POPUP_DISMISS_COOLDOWN_MS;
    expect(newsletterPopupHandled(`dismissed:${dismissedAt}`, now)).toBe(false);
  });

  it("re-enables legacy and malformed dismissals for the new offer", () => {
    expect(newsletterPopupHandled("dismissed", now)).toBe(false);
    expect(newsletterPopupHandled("dismissed:nope", now)).toBe(false);
  });

  it("stores dismissals with a timestamp", () => {
    expect(newsletterPopupStoreValue("dismissed", now)).toBe(`dismissed:${now}`);
    expect(newsletterPopupStoreValue("subscribed", now)).toBe("subscribed");
  });
});
