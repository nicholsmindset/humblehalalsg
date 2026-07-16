import { NextResponse } from "next/server";
import { authorizeCron } from "@/lib/cron";
import { dispatchCrmOutbox } from "@/lib/crm-sync";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!authorizeCron(req)) return NextResponse.json({ ok: false }, { status: 401 });

  try {
    const result = await dispatchCrmOutbox(100);
    const db = getSupabaseAdmin();
    if (db) {
      await db.from("cron_runs").insert({
        job: "crm-sync",
        ok: result.failed === 0,
        notes: result.configured
          ? `claimed ${result.claimed}, delivered ${result.delivered}, failed ${result.failed}`
          : "Convex CRM not configured",
      });
    }
    return NextResponse.json({ ok: result.failed === 0, ...result });
  } catch (error) {
    console.error("[crm-sync]", error instanceof Error ? error.message : error);
    return NextResponse.json({ ok: false, error: "crm_sync_failed" }, { status: 502 });
  }
}
