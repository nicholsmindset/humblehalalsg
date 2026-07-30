"use client";

import { useEffect } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";

/* Route-segment error boundary — catches render errors below the root layout.
   Sentry's onRequestError only sees server errors; without this boundary client
   render crashes never reach Sentry and users get Next's unstyled screen.
   Deliberately avoids useApp()/providers — the app context may itself be the
   thing that threw. Styling reuses the global state-screen classes, which are
   available because this renders inside the root layout. */
export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="state-screen">
      <div className="state-card">
        <div className="state-glyph hh-pattern"><span>!</span></div>
        <h1 style={{ fontSize: "1.8rem", marginTop: 20 }}>Something went wrong</h1>
        <p className="muted" style={{ marginTop: 8, maxWidth: 380 }}>
          An unexpected error occurred. Try again, or head back home — the rest of the site is fine.
        </p>
        <div className="flex g10 center" style={{ justifyContent: "center", marginTop: 20 }}>
          <button className="btn btn-primary" onClick={() => unstable_retry()}>Try again</button>
          <Link className="btn btn-outline" href="/">Back home</Link>
        </div>
      </div>
    </div>
  );
}
