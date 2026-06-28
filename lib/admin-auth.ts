import "server-only";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin, supabaseConfigured } from "./supabase/server";

export type AdminGate =
  | { ok: true; userId: string }
  | { ok: false; status: number; error: string };

/* Confirm the current request is an authenticated admin.
   Identity comes from Clerk (auth().userId); the role is read with the
   service-role client so it never depends on profiles RLS.
   Used by every /api/admin/* mutation and to gate the /admin page. */
export async function requireAdmin(): Promise<AdminGate> {
  const { userId } = await auth();
  if (!userId) return { ok: false, status: 401, error: "unauthenticated" };

  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, status: 503, error: "service_not_configured" };

  const { data: profile } = await admin.from("profiles").select("role").eq("id", userId).maybeSingle();
  if (profile?.role !== "admin") return { ok: false, status: 403, error: "forbidden" };

  return { ok: true, userId };
}

/** True only when the backend is live AND the caller is a verified admin.
 *  When the backend isn't configured (no Supabase data layer or no Clerk auth)
 *  we let the console through ONLY outside production, so the mock UI still works
 *  in dev/demo. In production an unconfigured backend denies access (security
 *  audit M1) — never expose the admin console because of a missing/partial env. */
export async function isAdminOrUnconfigured(): Promise<boolean> {
  const backendReady = supabaseConfigured && !!process.env.CLERK_SECRET_KEY;
  if (!backendReady) return process.env.NODE_ENV !== "production";
  const gate = await requireAdmin();
  return gate.ok;
}
