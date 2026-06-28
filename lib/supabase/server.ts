import "server-only";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseConfigured = !!(url && anon);

/** Request-scoped server client. Identity comes from Clerk: the current
 *  session's JWT is attached as the Supabase access token, so RLS enforces
 *  `auth.jwt()->>'sub' = <clerk user id>`. Returns a token-less anon client for
 *  signed-out requests (RLS then sees no `sub`). Null in mock mode (no keys). */
export async function getSupabaseServer() {
  if (!url || !anon) return null;
  return createClient(url, anon, {
    // Clerk owns auth → don't run Supabase's GoTrue session engine.
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    async accessToken() {
      return (await auth()).getToken();
    },
  });
}

/** Service-role client (bypasses RLS) — server-only, for webhooks/cron/fulfillment. */
export function getSupabaseAdmin() {
  if (!url || !service) return null;
  return createClient(url, service, { auth: { persistSession: false } });
}
