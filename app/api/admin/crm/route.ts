import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { crmSyncConfigured, dispatchCrmOutbox } from "@/lib/crm-sync";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

async function gate() {
  const result = await requireAdmin();
  if (!result.ok) return { response: NextResponse.json({ ok: false, error: result.error }, { status: result.status }) };
  return { userId: result.userId };
}

export async function GET() {
  const access = await gate();
  if (access.response) return access.response;
  const db = getSupabaseAdmin()!;

  const [pending, failed, delivered, latest] = await Promise.all([
    db.from("crm_outbox").select("id", { count: "exact", head: true }).is("processed_at", null),
    db.from("crm_outbox").select("id", { count: "exact", head: true }).is("processed_at", null).not("last_error", "is", null),
    db.from("crm_outbox").select("id", { count: "exact", head: true }).not("processed_at", "is", null),
    db.from("crm_outbox").select("processed_at").not("processed_at", "is", null).order("processed_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  const missingTable = [pending.error, failed.error, delivered.error, latest.error].some(Boolean);
  return NextResponse.json({
    ok: true,
    configured: crmSyncConfigured(),
    migrationReady: !missingTable,
    outbox: {
      pending: pending.count ?? 0,
      failed: failed.count ?? 0,
      delivered: delivered.count ?? 0,
      lastDeliveredAt: latest.data?.processed_at ?? null,
    },
  });
}

export async function POST(req: Request) {
  const access = await gate();
  if (access.response) return access.response;
  const body = await req.json().catch(() => ({})) as { action?: string };
  const db = getSupabaseAdmin()!;

  if (body.action === "bootstrap") {
    const { data, error } = await db.rpc("enqueue_crm_snapshot");
    if (error) return NextResponse.json({ ok: false, error: "snapshot_failed" }, { status: 502 });
    await logAudit(db, { actor: access.userId!, action: "crm.snapshot_enqueued", target: "crm", meta: data ?? {} });
    return NextResponse.json({ ok: true, snapshot: data });
  }

  if (body.action === "sync") {
    try {
      const result = await dispatchCrmOutbox(100);
      await logAudit(db, { actor: access.userId!, action: "crm.sync_requested", target: "crm", meta: result });
      return NextResponse.json({ ok: true, ...result });
    } catch {
      return NextResponse.json({ ok: false, error: "crm_sync_failed" }, { status: 502 });
    }
  }

  return NextResponse.json({ ok: false, error: "invalid_action" }, { status: 400 });
}
