import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase/server";

/* Recent admin actions for the Audit log tab. Admin-gated read of audit_log. */
export async function GET(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });

  const limit = Math.min(100, Math.max(1, Number(new URL(req.url).searchParams.get("limit")) || 40));
  const admin = getSupabaseAdmin()!;
  const { data, error } = await admin
    .from("audit_log")
    .select("id, action, target, meta, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return NextResponse.json({ ok: false, error: "query_failed" }, { status: 502 });
  return NextResponse.json({ ok: true, items: data ?? [] });
}
