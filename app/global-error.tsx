"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

/* Last-resort boundary — active only when the root layout itself throws, so it
   replaces the layout entirely: it must render its own <html>/<body> and carry
   its own inline styles (no global CSS or providers exist here). */
export default function GlobalError({
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
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#f7f6f2", color: "#1d2b2a", minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
        <div style={{ textAlign: "center", maxWidth: 460 }}>
          <h1 style={{ fontSize: "1.8rem", margin: "0 0 8px" }}>Something went wrong</h1>
          <p style={{ opacity: 0.7, margin: "0 0 20px" }}>An unexpected error occurred. Please try again.</p>
          <button onClick={() => unstable_retry()} style={{ background: "#12525B", color: "#fff", border: 0, borderRadius: 10, padding: "10px 18px", fontWeight: 600, cursor: "pointer", marginRight: 10 }}>Try again</button>
          {/* Plain <a> on purpose: the root layout (and with it the app's client
              runtime state) just crashed — recover via a full document load, not
              client navigation. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/" style={{ color: "#12525B", fontWeight: 600 }}>Back home</a>
        </div>
      </body>
    </html>
  );
}
