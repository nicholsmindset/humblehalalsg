import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN && process.env.NODE_ENV === "production",
  tracesSampleRate: 0,
  sendDefaultPii: false,
  ignoreErrors: ["adsbygoogle", /ResizeObserver loop/, "gtag", /Load failed/],
  beforeSend(event) {
    if (event.request) {
      delete event.request.cookies;
      delete event.request.headers;
    }
    if (event.user) event.user = event.user.id ? { id: event.user.id } : {};
    return event;
  },
});
