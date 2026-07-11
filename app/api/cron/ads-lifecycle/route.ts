import { NextResponse } from "next/server";
import { authorizeCron } from "@/lib/cron";
import { getSupabaseAdmin } from "@/lib/supabase/server";

/* Daily ad-campaign lifecycle (audit streams-P1-2/P2-8). Two transitions the
   date-window filters used to fake but nothing ever wrote:
     scheduled → active  once starts_on arrives (approved creatives only) — so
                         tracking and admin views reflect reality;
     scheduled/active/paused → ended  once ends_on passes — so a finished
                         campaign stops counting as "booked revenue" and can't
                         serve again if its dates are edited.
   Insert-only state moves; never touches draft or review_status.
   CRON_SECRET-guarded; safe to rerun. */
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!authorizeCron(req)) return NextResponse.json({ ok: false }, { status: 401 });
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: true, simulated: true });

  const today = new Date().toISOString().slice(0, 10);

  const { data: started } = await db
    .from("ad_campaigns")
    .update({ status: "active" })
    .eq("status", "scheduled")
    .eq("review_status", "approved")
    .lte("starts_on", today)
    .or(`ends_on.is.null,ends_on.gte.${today}`)
    .select("id");

  const { data: ended } = await db
    .from("ad_campaigns")
    .update({ status: "ended" })
    .in("status", ["scheduled", "active", "paused"])
    .lt("ends_on", today)
    .select("id");

  const activated = started?.length || 0;
  const finished = ended?.length || 0;
  try { await db.from("cron_runs").insert({ job: "ads-lifecycle", ok: true, notes: `activated ${activated}, ended ${finished}` }); } catch { /* best-effort */ }
  return NextResponse.json({ ok: true, activated, ended: finished });
}
