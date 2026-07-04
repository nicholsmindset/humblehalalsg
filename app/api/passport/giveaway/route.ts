import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { rateLimit, tooMany } from "@/lib/ratelimit";
import { getServerFlags } from "@/lib/flags";
import { balanceOf } from "@/lib/passport-server";

/* Monthly giveaway. GET → the current open giveaway + my entries + total +
   spendable balance. POST → buy one entry (spends points via enter_giveaway). */
export const dynamic = "force-dynamic";

type Db = NonNullable<ReturnType<typeof getSupabaseAdmin>>;

async function currentGiveaway(db: Db) {
  const { data } = await db.from("giveaways").select("id, title, description, entry_cost, status, period_month").eq("status", "open").order("period_month", { ascending: false }).limit(1).maybeSingle();
  return data;
}

export async function GET() {
  if (!getServerFlags().passport) return NextResponse.json({ ok: true, enabled: false });
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: false, error: "service_not_configured" }, { status: 503 });

  const g = await currentGiveaway(db);
  if (!g) return NextResponse.json({ ok: true, giveaway: null });

  const [{ data: mine }, { count: totalEntrants }, balance] = await Promise.all([
    db.from("giveaway_entries").select("entries").eq("giveaway_id", g.id).eq("user_id", userId).maybeSingle(),
    db.from("giveaway_entries").select("user_id", { count: "exact", head: true }).eq("giveaway_id", g.id),
    balanceOf(db, userId),
  ]);
  return NextResponse.json({
    ok: true,
    giveaway: { id: g.id, title: g.title, description: g.description, entryCost: g.entry_cost, month: g.period_month },
    myEntries: (mine?.entries as number) || 0,
    entrants: totalEntrants || 0,
    balance,
  });
}

export async function POST(req: Request) {
  if (!getServerFlags().passport) return NextResponse.json({ ok: false, error: "not_enabled" }, { status: 404 });
  const rl = await rateLimit(req, "giveaway", 30, 3600); if (!rl.ok) return tooMany(rl.retryAfter);
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: false, error: "service_not_configured" }, { status: 503 });

  const g = await currentGiveaway(db);
  if (!g) return NextResponse.json({ ok: false, error: "no_giveaway" }, { status: 404 });

  const { data: result } = await db.rpc("enter_giveaway", { p_user_id: userId, p_giveaway_id: g.id, p_dedupe: `enter:${g.id}:${randomUUID()}` });
  if (result === "insufficient") return NextResponse.json({ ok: false, error: "insufficient" }, { status: 402 });
  if (result === "closed") return NextResponse.json({ ok: false, error: "closed" }, { status: 409 });
  if (result === "blocked") return NextResponse.json({ ok: false, error: "unavailable" }, { status: 409 });
  if (result !== "ok") return NextResponse.json({ ok: false, error: "enter_failed" }, { status: 502 });
  return NextResponse.json({ ok: true });
}
