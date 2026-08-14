export const NEWSLETTER_POPUP_DISMISS_COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000;

/** Subscribers stay suppressed permanently. A dismissal gets a respectful
 *  14-day cooldown; legacy untimestamped dismissals become eligible for the
 *  new planner offer instead of hiding it forever. */
export function newsletterPopupHandled(value: string | null, now = Date.now()): boolean {
  if (value === "subscribed") return true;
  if (!value?.startsWith("dismissed:")) return false;

  const dismissedAt = Number(value.slice("dismissed:".length));
  return Number.isFinite(dismissedAt)
    && dismissedAt > 0
    && now - dismissedAt < NEWSLETTER_POPUP_DISMISS_COOLDOWN_MS;
}

export function newsletterPopupStoreValue(value: "dismissed" | "subscribed", now = Date.now()): string {
  return value === "subscribed" ? value : `dismissed:${now}`;
}
