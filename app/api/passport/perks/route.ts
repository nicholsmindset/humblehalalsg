import { NextResponse } from "next/server";
import { randomInt } from "node:crypto";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { rateLimit, tooMany } from "@/lib/ratelimit";
import { getServerFlags } from "@/lib/flags";

/* Consumer perks. GET → active business perks + my vouchers + spendable balance.
   POST { perkId } → spend points for a voucher (redeem_perk RPC; the owner marks
   it used at the counter). */
export const dynamic = "force-dynamic";

type Db = NonNullable<ReturnType<typeof getSupabaseAdmin>>;

const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no ambiguous chars
function voucherCode(): string {
  let s = "";
  for (let i = 0; i < 8; i++) s += CODE_CHARS[randomInt(0, CODE_CHARS.length)];
  return `HH-${s.slice(0, 4)}-${s.slice(4)}`;
}
async function balanceOf(db: Db, userId: string): Promise<number> {
  const { data } = await db.from("passport_points").select("delta").eq("user_id", userId).limit(2000);
  return (data || []).reduce((n, r) => n + (r.delta as number), 0);
}

export async function GET() {
  if (!getServerFlags().passport) return NextResponse.json({ ok: true, enabled: false });
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: false, error: "service_not_configured" }, { status: 503 });

  const [{ data: perks }, { data: vouchers }, balance] = await Promise.all([
    db.from("business_perks").select("id, title, description, terms, points_cost, businesses(name, slug)").eq("active", true).order("points_cost", { ascending: true }).limit(60),
    db.from("perk_redemptions").select("voucher_code, title, status, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(20),
    balanceOf(db, userId),
  ]);

  const shaped = (perks || []).map((p) => {
    const biz = (Array.isArray(p.businesses) ? p.businesses[0] : p.businesses) as { name?: string; slug?: string } | null;
    return { id: p.id, title: p.title, description: p.description, terms: p.terms, cost: p.points_cost, business: biz?.name || "A halal business", slug: biz?.slug || null };
  });
  return NextResponse.json({ ok: true, enabled: true, balance, perks: shaped, vouchers: vouchers || [] });
}

export async function POST(req: Request) {
  if (!getServerFlags().passport) return NextResponse.json({ ok: false, error: "not_enabled" }, { status: 404 });
  const rl = await rateLimit(req, "perk", 20, 3600); if (!rl.ok) return tooMany(rl.retryAfter);
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: false, error: "service_not_configured" }, { status: 503 });

  let perkId = "";
  try { perkId = String(((await req.json()) as { perkId?: string }).perkId || ""); } catch { /* noop */ }
  if (!perkId) return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });

  // Retry a couple of times on the (rare) voucher-code collision.
  for (let attempt = 0; attempt < 4; attempt++) {
    const code = voucherCode();
    const { data: result } = await db.rpc("redeem_perk", { p_user_id: userId, p_perk_id: perkId, p_code: code });
    if (result === "INSUFFICIENT") return NextResponse.json({ ok: false, error: "insufficient" }, { status: 402 });
    if (result === code) return NextResponse.json({ ok: true, voucher: code });
    if (result === "") {
      // '' = unknown/withdrawn perk OR a duplicate/code clash; probe which.
      const { data: perk } = await db.from("business_perks").select("id, active").eq("id", perkId).maybeSingle();
      if (!perk || !perk.active) return NextResponse.json({ ok: false, error: "unavailable" }, { status: 409 });
      // else assume a code clash → retry with a fresh code.
    }
  }
  return NextResponse.json({ ok: false, error: "redeem_failed" }, { status: 502 });
}
