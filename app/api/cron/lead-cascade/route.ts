import { NextResponse } from "next/server";
import { authorizeCron } from "@/lib/cron";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getServerFlags } from "@/lib/feature-flags";
import { advanceLeadCascade } from "@/lib/lead-routing";

/* Daily backstop for the exclusive-lead cascade: expire overdue 24h holds and
   route each lead to the next vendor in rotation. The same advance also runs
   opportunistically (after()) on the intake/inbox/admin hot paths, so with any
   traffic hops move on time — this cron guarantees zero-traffic days still
   advance. CRON_SECRET-guarded; race-safe (conditional-update claims). */
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!authorizeCron(req)) return NextResponse.json({ ok: false }, { status: 401 });
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: true, simulated: true });
  const { leadRouting } = await getServerFlags();
  if (!leadRouting) return NextResponse.json({ ok: true, skipped: "leadRouting off" });

  const { advanced, exhausted } = await advanceLeadCascade(db, 200);
  try { await db.from("cron_runs").insert({ job: "lead-cascade", ok: true, notes: `advanced ${advanced}, exhausted ${exhausted}` }); } catch { /* best-effort */ }
  return NextResponse.json({ ok: true, advanced, exhausted });
}
