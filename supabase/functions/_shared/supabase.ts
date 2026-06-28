// Service-role Supabase client for Edge Functions (Deno). SUPABASE_URL and
// SUPABASE_SERVICE_ROLE_KEY are auto-injected into the function runtime by
// Supabase — no `secrets set` needed for those two. Bypasses RLS; these
// functions are DB-triggered backend workers, not user-facing.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export function admin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
