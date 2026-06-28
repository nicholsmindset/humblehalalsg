"use client";

import { useMemo } from "react";
import { useSession } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseConfigured = !!(url && anon);

/** Anon browser client — NO user token. For public / anon-safe paths only
 *  (e.g. the analytics track_event RPC, which is SECURITY DEFINER). RLS sees no
 *  `sub`, so it cannot read user-scoped rows. Null in mock mode (no keys). */
export function getSupabaseBrowser() {
  if (!url || !anon) return null;
  return createClient(url, anon);
}

/** Browser client scoped to the current Clerk session: attaches the Clerk JWT
 *  as the Supabase access token, so RLS resolves `auth.jwt()->>'sub'` to the
 *  Clerk user id. Use for authed reads (profile role, owner data, admin
 *  dashboard). Returns null in mock mode. Must be called inside ClerkProvider. */
export function useSupabaseBrowser() {
  const { session } = useSession();
  return useMemo(() => {
    if (!url || !anon) return null;
    return createClient(url, anon, {
      async accessToken() {
        return session ? await session.getToken() : null;
      },
    });
  }, [session]);
}
