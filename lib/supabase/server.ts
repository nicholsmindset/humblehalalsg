import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseConfigured = !!(url && anon);

/** Request-scoped server client (respects RLS via the user's cookies). */
export async function getSupabaseServer() {
  if (!url || !anon) return null;
  const cookieStore = await cookies();
  return createServerClient(url, anon, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet) => {
        try {
          toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          /* called from a Server Component — ignore (middleware refreshes) */
        }
      },
    },
  });
}

/** Service-role client (bypasses RLS) — server-only, for webhooks/fulfillment. */
export function getSupabaseAdmin() {
  if (!url || !service) return null;
  return createClient(url, service, { auth: { persistSession: false } });
}
