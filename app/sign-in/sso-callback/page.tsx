"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

/* OAuth (Google) landing route for the custom sign-in flow. Clerk completes the
   SSO handshake here and then redirects home. Replaces the old Supabase
   /auth/callback exchangeCodeForSession route. Kept public in proxy.ts. */
export default function SSOCallbackPage() {
  return (
    <div style={{ display: "grid", placeItems: "center", minHeight: "60vh", color: "var(--ink-soft, #667)" }}>
      <p>Signing you in…</p>
      <AuthenticateWithRedirectCallback
        signInForceRedirectUrl="/"
        signUpForceRedirectUrl="/"
      />
    </div>
  );
}
