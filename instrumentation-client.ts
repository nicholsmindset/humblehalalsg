import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // Dark until a DSN is set — no widget, no network in dev/preview.
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN && process.env.NODE_ENV === "production",
  tracesSampleRate: 0, // errors only
  sendDefaultPii: false,
  // Browser noise we never want to page on: ad scripts, extensions, GTM.
  ignoreErrors: [
    "adsbygoogle",
    /ResizeObserver loop/,
    "gtag",
    "Load failed",
    /chrome-extension/,
    /moz-extension/,
  ],
  beforeSend(event) {
    if (event.user) event.user = event.user.id ? { id: event.user.id } : {};
    return event;
  },
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
