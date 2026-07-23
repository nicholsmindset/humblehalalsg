// Browser-safe @clerk/nextjs stand-in for the DS bundle. The claude.ai/design
// environment has no Clerk keys, so every consumer sees a loaded, signed-out
// session — components render their public state instead of crashing.
import * as React from "react";

export function ClerkProvider({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}

export function useUser() {
  return { isLoaded: true, isSignedIn: false, user: null } as const;
}

export function useAuth() {
  return {
    isLoaded: true,
    isSignedIn: false,
    userId: null,
    sessionId: null,
    orgId: null,
    getToken: async () => null,
    signOut: async () => {},
  } as const;
}

export function useSession() {
  return { isLoaded: true, isSignedIn: false, session: null } as const;
}

export function useClerk() {
  return {
    openSignIn: () => {},
    openSignUp: () => {},
    signOut: async () => {},
    redirectToSignIn: async () => {},
  };
}

export function useSignIn() {
  return { isLoaded: false, signIn: undefined, setActive: undefined } as const;
}

export function useSignUp() {
  return { isLoaded: false, signUp: undefined, setActive: undefined } as const;
}

export function SignedIn(_props: { children?: React.ReactNode }) {
  return null; // stub session is always signed out
}

export function SignedOut({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}

export function SignInButton({ children }: { children?: React.ReactNode }) {
  return <>{children ?? <button type="button">Sign in</button>}</>;
}

export function SignUpButton({ children }: { children?: React.ReactNode }) {
  return <>{children ?? <button type="button">Sign up</button>}</>;
}

export function UserButton(_props: Record<string, unknown>) {
  return (
    <span
      aria-label="Account"
      style={{
        display: "inline-block",
        width: 28,
        height: 28,
        borderRadius: "50%",
        background: "var(--emerald-100, #DCE9EA)",
        border: "1px solid var(--line-strong, #DED7C7)",
      }}
    />
  );
}
