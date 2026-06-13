import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

/* Best-effort admin audit trail. Columns match supabase/migrations/0004
   (actor, action, target, meta). Never throws — auditing must not break the
   action it records. */
export async function logAudit(
  admin: SupabaseClient,
  entry: { actor?: string | null; action: string; target?: string | null; meta?: Record<string, unknown> },
): Promise<void> {
  try {
    await admin.from("audit_log").insert({
      actor: entry.actor ?? null,
      action: entry.action,
      target: entry.target ?? null,
      meta: entry.meta ?? {},
    });
  } catch {
    /* audit is best-effort */
  }
}
