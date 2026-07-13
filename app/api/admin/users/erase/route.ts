import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { eraseUserData } from "@/lib/erasure";

/* Admin-triggered right-to-erasure. Runs the same erase routine as the Clerk
   user.deleted webhook (delete reviews/notifications/profile, anonymise
   orders/bookings/leads), then best-effort deletes the Clerk user so the account
   itself is gone (the resulting user.deleted webhook is an idempotent no-op).
   Admin-only + audit-logged inside eraseUserData. */
export async function POST(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });

  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ ok: false, error: "service_not_configured" }, { status: 503 });

  const { userId, email } = (await req.json().catch(() => ({}))) as { userId?: string; email?: string };
  if (!userId) return NextResponse.json({ ok: false, error: "userId required" }, { status: 422 });

  const steps = await eraseUserData(admin, { clerkUserId: userId, email: email ?? null, actor: gate.userId });

  // Best-effort: remove the Clerk account too (idempotent — the webhook no-ops).
  try {
    const { clerkClient } = await import("@clerk/nextjs/server");
    await (await clerkClient()).users.deleteUser(userId);
  } catch (e) {
    console.warn("[admin/users/erase] Clerk deleteUser failed (data already erased):", e instanceof Error ? e.message : e);
  }

  return NextResponse.json({ ok: true, steps });
}
