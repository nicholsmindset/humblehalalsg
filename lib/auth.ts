import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabase/server";

/* Server-side auth helpers shared by API routes and server components.
   Extracted from the role-check pattern in app/api/settings/route.ts. */

export type AuthResult =
  | { ok: true; userId: string; role: "user" | "owner" | "admin" }
  | { ok: false; reason: "db_not_configured" | "unauthenticated" | "forbidden" };

/** Resolves the signed-in user (request-scoped cookies) and their profile role. */
export async function getAuth(): Promise<AuthResult> {
  const supa = await getSupabaseServer();
  const admin = getSupabaseAdmin();
  if (!supa || !admin) return { ok: false, reason: "db_not_configured" };

  const { data: { user } } = await supa.auth.getUser();
  if (!user) return { ok: false, reason: "unauthenticated" };

  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const role = (profile?.role as "user" | "owner" | "admin" | undefined) ?? "user";
  return { ok: true, userId: user.id, role };
}

/** Like getAuth(), but non-admins come back as forbidden. */
export async function requireAdmin(): Promise<AuthResult> {
  const auth = await getAuth();
  if (auth.ok && auth.role !== "admin") return { ok: false, reason: "forbidden" };
  return auth;
}
