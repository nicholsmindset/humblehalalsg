import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin, getSupabaseServer } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

/* Passport integrity (admin). GET ?days= → accounts ranked by recent earning
   velocity (the farming signal) with a source breakdown + blocked flag. POST:
   - block / unblock  → freeze/unfreeze a user's earning (award_points honours it)
   - adjust           → a corrective ledger entry (negative = claw back farmed
     points; positive = goodwill).
   Admin-gated; the read RPC self-checks is_admin() via the JWT-scoped client. */
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });
  const server = await getSupabaseServer(); // carries the Clerk JWT so is_admin() resolves
  if (!server) return NextResponse.json({ ok: false, error: "service_not_configured" }, { status: 503 });

  const days = Math.min(90, Math.max(1, Number(new URL(req.url).searchParams.get("days")) || 7));
  const { data, error } = await server.rpc("admin_passport_integrity", { p_days: days, p_limit: 100 });
  if (error) return NextResponse.json({ ok: false, error: "query_failed", detail: error.message }, { status: 502 });
  return NextResponse.json({ ok: true, days, accounts: data || [] });
}

export async function POST(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: false, error: "service_not_configured" }, { status: 503 });

  let b: { userId?: string; action?: string; points?: number; reason?: string } = {};
  try { b = (await req.json()) as typeof b; } catch { return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 }); }
  const userId = String(b.userId || "");
  if (!userId) return NextResponse.json({ ok: false, error: "missing_user" }, { status: 400 });

  if (b.action === "block") {
    const { error } = await db.from("passport_blocks").upsert({ user_id: userId, reason: String(b.reason || "").slice(0, 200) || null, blocked_by: gate.userId }, { onConflict: "user_id" });
    if (error) return NextResponse.json({ ok: false, error: "block_failed" }, { status: 502 });
    await logAudit(db, { actor: gate.userId, action: "Blocked passport account", target: userId, meta: { reason: b.reason } });
    return NextResponse.json({ ok: true, blocked: true });
  }
  if (b.action === "unblock") {
    const { error } = await db.from("passport_blocks").delete().eq("user_id", userId);
    if (error) return NextResponse.json({ ok: false, error: "unblock_failed" }, { status: 502 });
    await logAudit(db, { actor: gate.userId, action: "Unblocked passport account", target: userId });
    return NextResponse.json({ ok: true, blocked: false });
  }
  if (b.action === "adjust") {
    const delta = Math.round(Number(b.points) || 0);
    if (!delta) return NextResponse.json({ ok: false, error: "bad_points" }, { status: 422 });
    const { error } = await db.from("passport_points").insert({
      user_id: userId, delta, reason: String(b.reason || "Admin adjustment").slice(0, 120),
      source_type: "admin_adjust", source_id: gate.userId, dedupe_key: `admin_adjust:${randomUUID()}`,
    });
    if (error) return NextResponse.json({ ok: false, error: "adjust_failed" }, { status: 502 });
    await logAudit(db, { actor: gate.userId, action: "Adjusted passport points", target: userId, meta: { delta, reason: b.reason } });
    return NextResponse.json({ ok: true, delta });
  }
  return NextResponse.json({ ok: false, error: "bad_action" }, { status: 400 });
}
