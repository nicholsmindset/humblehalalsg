import "server-only";
import { getSupabaseServer, getSupabaseAdmin, supabaseConfigured } from "./supabase/server";

export type AdminGate =
  | { ok: true; userId: string }
  | { ok: false; status: number; error: string };

/* Confirm the current request is an authenticated admin.
   Identity comes from the cookie-scoped server client (auth.getUser); the role
   is read with the service-role client so it never depends on profiles RLS.
   Used by every /api/admin/* mutation and to gate the /admin page. */
export async function requireAdmin(): Promise<AdminGate> {
  const server = await getSupabaseServer();
  if (!server) return { ok: false, status: 503, error: "auth_not_configured" };

  const { data: { user } } = await server.auth.getUser();
  if (!user) return { ok: false, status: 401, error: "unauthenticated" };

  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, status: 503, error: "service_not_configured" };

  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") return { ok: false, status: 403, error: "forbidden" };

  return { ok: true, userId: user.id };
}

/** True only when the backend is live AND the caller is a verified admin.
 *  When Supabase isn't configured (dev/demo) we let the console through so the
 *  mock UI still works locally. */
export async function isAdminOrUnconfigured(): Promise<boolean> {
  if (!supabaseConfigured) return true;
  const gate = await requireAdmin();
  return gate.ok;
}
