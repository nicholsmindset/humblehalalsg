import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { signCrmPayload } from "@/lib/crm-signature";

export type CrmOutboxRow = {
  id: string;
  event_type: "upsert" | "delete";
  aggregate_type: "business" | "lead" | "lead_route";
  aggregate_id: string;
  payload: Record<string, unknown>;
  created_at: string;
  attempt_count: number;
};

export type CrmSyncResult = {
  configured: boolean;
  claimed: number;
  delivered: number;
  failed: number;
};

function config() {
  const ingestUrl = (process.env.CONVEX_CRM_INGEST_URL || "").trim();
  const secret = (process.env.CRM_SYNC_SECRET || "").trim();
  return ingestUrl && secret ? { ingestUrl, secret } : null;
}

export function crmSyncConfigured(): boolean {
  return config() !== null;
}

async function deliver(row: CrmOutboxRow, ingestUrl: string, secret: string): Promise<void> {
  const body = JSON.stringify({
    eventId: row.id,
    eventType: row.event_type,
    aggregateType: row.aggregate_type,
    aggregateId: row.aggregate_id,
    occurredAt: row.created_at,
    payload: row.payload,
  });
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const response = await fetch(ingestUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-hh-timestamp": timestamp,
      "x-hh-signature": signCrmPayload(secret, timestamp, body),
      "x-idempotency-key": row.id,
    },
    body,
    cache: "no-store",
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(`convex_${response.status}${message ? `:${message.slice(0, 180)}` : ""}`);
  }
}

export async function dispatchCrmOutbox(limit = 50): Promise<CrmSyncResult> {
  const current = config();
  if (!current) return { configured: false, claimed: 0, delivered: 0, failed: 0 };

  const db = getSupabaseAdmin();
  if (!db) throw new Error("supabase_service_not_configured");

  const { data, error } = await db.rpc("claim_crm_outbox", {
    p_limit: Math.max(1, Math.min(200, Math.floor(limit))),
  });
  if (error) throw new Error(`crm_claim_failed:${error.message}`);

  const rows = (data ?? []) as CrmOutboxRow[];
  let delivered = 0;
  let failed = 0;

  // Small worker pool: fast enough for the one-minute cron while avoiding a
  // burst of hundreds of outbound requests from one serverless invocation.
  for (let offset = 0; offset < rows.length; offset += 8) {
    const batch = rows.slice(offset, offset + 8);
    await Promise.all(batch.map(async (row) => {
      try {
        await deliver(row, current.ingestUrl, current.secret);
        const { error: completeError } = await db.rpc("complete_crm_outbox", { p_id: row.id });
        if (completeError) throw new Error(`crm_complete_failed:${completeError.message}`);
        delivered += 1;
      } catch (error) {
        failed += 1;
        const message = error instanceof Error ? error.message : "delivery_failed";
        await db.rpc("fail_crm_outbox", { p_id: row.id, p_error: message });
      }
    }));
  }

  return { configured: true, claimed: rows.length, delivered, failed };
}
