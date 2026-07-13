import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") await import("./sentry.server.config");
  if (process.env.NEXT_RUNTIME === "edge") await import("./sentry.edge.config");
}

// Auto-captures thrown errors from route handlers, server components and the
// webhooks — the highest-value signal (a webhook/payment 5xx spike surfaces here
// without any per-route code).
export const onRequestError = Sentry.captureRequestError;
