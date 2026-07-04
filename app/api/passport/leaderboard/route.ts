import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getServerFlags } from "@/lib/flags";

/* Leaderboard — top members by EARNED points (spending never lowers you), for
   'month' (current SGT month) or 'all'. Names shown only for members who opted
   their passport public; everyone else appears as "A Humble Halal member".
   Also returns the caller's own rank. */
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!getServerFlags().passport) return NextResponse.json({ ok: false, error: "not_enabled" }, { status: 404 });
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: false, error: "service_not_configured" }, { status: 503 });

  const period = new URL(req.url).searchParams.get("period") === "all" ? "all" : "month";
  const { data } = await db.rpc("passport_leaderboard", { p_period: period, p_limit: 25 });
  const board = (data || []).map((r: { rank: number; display_name: string; points: number; is_public: boolean }) => ({
    rank: r.rank, name: r.display_name, points: r.points, isPublic: r.is_public,
  }));

  let me: { rank: number; points: number } | null = null;
  const { userId } = await auth();
  if (userId) {
    try {
      const { data: mine } = await db.rpc("my_passport_rank", { p_user_id: userId, p_period: period });
      const row = Array.isArray(mine) ? mine[0] : mine;
      if (row) me = { rank: row.rank, points: row.points };
    } catch { /* noop */ }
  }

  return NextResponse.json({ ok: true, period, board, me });
}
