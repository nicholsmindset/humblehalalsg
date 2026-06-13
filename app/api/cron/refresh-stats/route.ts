import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { authorizeCron } from "@/lib/cron";

/* B3 — recompute directory stats + bust ISR caches so homepage numbers stay
   honest and category×area pages flip indexable at the listings threshold.
   Graceful without keys. */
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!authorizeCron(req)) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  let stats: unknown = null;
  try {
    const { getSupabaseAdmin } = await import("@/lib/supabase/server");
    const sb = getSupabaseAdmin();
    if (sb) {
      const { data } = await sb.rpc("get_directory_stats");
      stats = data ?? null;
      await sb.from("cron_runs").insert({ job: "refresh-stats", ok: true, notes: "stats recomputed" });
    }
  } catch {
    /* graceful */
  }
  // Always bust the key surfaces (cheap, safe even on mock).
  try {
    revalidatePath("/");
    revalidatePath("/halal");
    revalidatePath("/explore");
  } catch {
    /* ignore */
  }
  return NextResponse.json({ ok: true, simulated: stats === null, stats });
}
