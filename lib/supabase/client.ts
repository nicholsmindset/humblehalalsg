"use client";

import { useMemo, useRef } from "react";
import { useSession } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseConfigured = !!(url && anon);

/** Anon browser client — NO user token. For public / anon-safe paths only
 *  (e.g. the analytics track_event RPC, which is SECURITY DEFINER). RLS sees no
 *  `sub`, so it cannot read user-scoped rows. Null in mock mode (no keys). */
// Clerk owns auth → disable Supabase's GoTrue session engine (avoids the
// "multiple GoTrueClient instances" warning and any session storage-key clashes).
const NO_GOTRUE = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } } as const;

// Module singleton — the anon client carries no per-request state (no user
// token), so one instance is reused for the tab's lifetime. Previously this
// created a fresh client on every call; analytics `emit()` calls it on every
// tracked event, so each search/filter/click spawned another GoTrueClient under
// the same storage key ("Multiple GoTrueClient instances" warnings that grew
// unbounded with interaction). One instance = one GoTrueClient.
let anonClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseBrowser() {
  if (!url || !anon) return null;
  if (!anonClient) anonClient = createClient(url, anon, NO_GOTRUE);
  return anonClient;
}

/** Browser client scoped to the current Clerk session: attaches the Clerk JWT
 *  as the Supabase access token, so RLS resolves `auth.jwt()->>'sub'` to the
 *  Clerk user id. Use for authed reads (profile role, owner data, admin
 *  dashboard). Returns null in mock mode. Must be called inside ClerkProvider. */
export function useSupabaseBrowser() {
  const { session } = useSession();
  // Latest-session ref: Clerk hands out a NEW session object on every token
  // refresh. Keying the memo on that identity recreated the client every few
  // minutes, which re-fired every downstream fetch effect — and a refetch that
  // raced the rotation could run as `anon` and fail RLS (the intermittent
  // "Failed to load analytics" banner). Key on the stable session id instead
  // and read the live session through the ref.
  const sessionRef = useRef(session);
  sessionRef.current = session;
  const sessionId = session?.id ?? null;
  return useMemo(() => {
    if (!url || !anon) return null;
    return createClient(url, anon, {
      ...NO_GOTRUE,
      async accessToken() {
        return sessionRef.current ? await sessionRef.current.getToken() : null;
      },
    });
    // Recreate only when the session IDENTITY changes (sign-in/out), never on
    // token refresh — sessionRef supplies the live token either way.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);
}
