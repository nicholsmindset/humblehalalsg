import "server-only";
import type { getSupabaseAdmin } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

type Admin = NonNullable<ReturnType<typeof getSupabaseAdmin>>;

export type EraseResult = Array<{ step: string; count?: number; error?: string }>;

/* GDPR / PDPA right-to-erasure for a deleted (or admin-erased) user.

   Retention policy:
   - DELETE (true erasure): profiles row, notifications, authored reviews,
     + FK-cascaded rows (follows, passport_points, event_rsvps…).
   - ANONYMISE (keep the row, strip PII): orders and hotel_bookings are financial
     records retained ~5 years for SG accounting/audit — we redact name/email and
     stamp redacted_at but keep amounts / Stripe ids / status. leads (consumer
     quote requests) are redacted by email.

   Each step runs in isolation so one failure never aborts the rest; the profile
   is deleted LAST (before that its id is the join key for anonymisation). The
   whole routine is idempotent — re-running finds nothing to change. */
export async function eraseUserData(
  admin: Admin,
  opts: { clerkUserId: string; email?: string | null; actor?: string },
): Promise<EraseResult> {
  const { clerkUserId } = opts;
  const now = new Date().toISOString();
  const steps: EraseResult = [];
  const run = async (step: string, fn: () => Promise<number | null | undefined>) => {
    try {
      steps.push({ step, count: (await fn()) ?? undefined });
    } catch (e) {
      steps.push({ step, error: e instanceof Error ? e.message : String(e) });
    }
  };

  // Resolve the email (needed for leads erasure) BEFORE the profile is deleted.
  let email = opts.email ?? null;
  if (!email) {
    try {
      const { data } = await admin.from("profiles").select("email").eq("id", clerkUserId).maybeSingle();
      email = (data?.email as string) ?? null;
    } catch { /* best-effort */ }
  }

  // ── Anonymise financial / booking records (retain, strip PII) ──────────────
  await run("orders_anonymised", async () => {
    const { data } = await admin
      .from("orders")
      .update({ buyer_email: null, buyer_name: "Redacted", redacted_at: now })
      .eq("buyer_user_id", clerkUserId)
      .select("id");
    return data?.length ?? 0;
  });
  await run("hotel_bookings_anonymised", async () => {
    const { data } = await admin
      .from("hotel_bookings")
      .update({ guest_email: null, redacted_at: now })
      .eq("user_id", clerkUserId)
      .select("id");
    return data?.length ?? 0;
  });
  if (email) {
    await run("leads_anonymised", async () => {
      const { data } = await admin
        .from("leads")
        .update({ name: "Redacted", email: null, phone: null })
        .eq("email", email)
        .select("id");
      return data?.length ?? 0;
    });
  }

  // ── Delete authored content + notifications ────────────────────────────────
  await run("reviews_deleted", async () => {
    const { data } = await admin.from("reviews").delete().eq("user_id", clerkUserId).select("id");
    return data?.length ?? 0;
  });
  await run("notifications_deleted", async () => {
    // notifications.user_id is text with NO FK (0033) — cascade can't reach it.
    const { data } = await admin.from("notifications").delete().eq("user_id", clerkUserId).select("id");
    return data?.length ?? 0;
  });

  // ── Profile LAST — FK cascades purge follows / passport / rsvps ────────────
  await run("profile_deleted", async () => {
    const { data } = await admin.from("profiles").delete().eq("id", clerkUserId).select("id");
    return data?.length ?? 0;
  });

  await logAudit(admin, {
    actor: opts.actor ?? "clerk-webhook",
    action: "user.erased",
    target: clerkUserId,
    meta: { steps, email_present: !!email },
  });

  return steps;
}
