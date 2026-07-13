import "server-only";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin, supabaseConfigured } from "./supabase/server";

export type AdminGate =
  | { ok: true; userId: string }
  | { ok: false; status: number; error: string };

// 5-minute cache of MFA-enrollment lookups so we don't hit the Clerk Backend
// API on every admin request when the session-token claim isn't configured.
const mfaCache = new Map<string, { enrolled: boolean; at: number }>();
const MFA_TTL_MS = 5 * 60 * 1000;

/* Is this admin enrolled in MFA? Primary source is a session-token claim (zero
   API calls) — owner adds `tfa = {{user.two_factor_enabled}}` in Clerk →
   Sessions → session token. Fallback is the Clerk Backend API (cached), which
   FAILS OPEN on error: the role check has already passed, so a Clerk API blip
   must not lock the operator out of their own console. */
async function adminHasMfa(
  userId: string,
  sessionClaims: Record<string, unknown> | null | undefined,
): Promise<boolean> {
  const claim = sessionClaims?.tfa;
  if (claim === true || claim === "true") return true;
  if (claim === false || claim === "false") return false;

  const hit = mfaCache.get(userId);
  if (hit && Date.now() - hit.at < MFA_TTL_MS) return hit.enrolled;
  try {
    const { clerkClient } = await import("@clerk/nextjs/server");
    const user = await (await clerkClient()).users.getUser(userId);
    const enrolled = !!user.twoFactorEnabled;
    mfaCache.set(userId, { enrolled, at: Date.now() });
    return enrolled;
  } catch (e) {
    console.warn("[admin-mfa] enrollment lookup failed — allowing:", e instanceof Error ? e.message : e);
    return true; // fail open
  }
}

/* Confirm the current request is an authenticated admin.
   Identity comes from Clerk (auth().userId); the role is read with the
   service-role client so it never depends on profiles RLS.
   Used by every /api/admin/* mutation and to gate the /admin page.

   MFA: when ADMIN_MFA_ENFORCED=1, admins must have two-factor enrolled or the
   gate returns 403 admin_mfa_required. Env-gated so enabling it can never lock
   an operator out on deploy — flip it ON only after they've enrolled (via the
   UserButton → Manage account → Security). Pass `enforceMfa:false` to let the
   /admin PAGE render (so they can reach the enrollment UI) while API mutations
   stay gated. */
export async function requireAdmin(opts?: { enforceMfa?: boolean }): Promise<AdminGate> {
  const { userId, sessionClaims } = await auth();
  if (!userId) return { ok: false, status: 401, error: "unauthenticated" };

  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, status: 503, error: "service_not_configured" };

  const { data: profile } = await admin.from("profiles").select("role").eq("id", userId).maybeSingle();
  if (profile?.role !== "admin") return { ok: false, status: 403, error: "forbidden" };

  const enforceMfa = opts?.enforceMfa !== false; // default: enforce
  if (enforceMfa && process.env.ADMIN_MFA_ENFORCED === "1") {
    const ok = await adminHasMfa(userId, sessionClaims as Record<string, unknown> | null);
    if (!ok) return { ok: false, status: 403, error: "admin_mfa_required" };
  }

  return { ok: true, userId };
}

/** True only when the backend is live AND the caller is a verified admin.
 *  When the backend isn't configured (no Supabase data layer or no Clerk auth)
 *  we let the console through ONLY outside production, so the mock UI still works
 *  in dev/demo. In production an unconfigured backend denies access (security
 *  audit M1) — never expose the admin console because of a missing/partial env.
 *  MFA is NOT enforced here so the /admin page still renders (letting an admin
 *  reach the enrollment UI); the per-endpoint requireAdmin() gates mutations. */
export async function isAdminOrUnconfigured(): Promise<boolean> {
  const backendReady = supabaseConfigured && !!process.env.CLERK_SECRET_KEY;
  if (!backendReady) return process.env.NODE_ENV !== "production";
  const gate = await requireAdmin({ enforceMfa: false });
  return gate.ok;
}
