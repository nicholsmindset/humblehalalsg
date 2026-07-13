import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // Dark until a DSN is set — no network, no overhead in dev/preview.
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN && process.env.NODE_ENV === "production",
  tracesSampleRate: 0, // errors only — protect the free-tier event quota
  sendDefaultPii: false,
  ignoreErrors: ["adsbygoogle", /ResizeObserver loop/, "gtag", /Load failed/],
  beforeSend(event) {
    // Strip request PII — cookies/headers can carry the Clerk session.
    if (event.request) {
      delete event.request.cookies;
      delete event.request.headers;
    }
    if (event.user) event.user = event.user.id ? { id: event.user.id } : {};
    return event;
  },
});
