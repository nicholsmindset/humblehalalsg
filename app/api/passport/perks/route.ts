import { NextResponse } from "next/server";
import { randomInt, randomUUID } from "node:crypto";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { rateLimit, tooMany } from "@/lib/ratelimit";
import { getServerFlags } from "@/lib/flags";
import { balanceOf } from "@/lib/passport-server";

/* Consumer perks. GET → active business perks + my vouchers + spendable balance.
   POST { perkId, idempotencyKey } → spend points for a voucher (redeem_perk RPC;
   the owner marks it used at the counter). */
export const dynamic = "force-dynamic";

const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no ambiguous chars
function voucherCode(): string {
  let s = "";
  for (let i = 0; i < 8; i++) s += CODE_CHARS[randomInt(0, CODE_CHARS.length)];
  return `HH-${s.slice(0, 4)}-${s.slice(4)}`;
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

  let body: { perkId?: string; idempotencyKey?: string } = {};
  try { body = (await req.json()) as typeof body; } catch { /* noop */ }
  const perkId = String(body.perkId || "");
  if (!perkId) return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  // Stable idempotency token from the client dedupes a double-submit / network
  // retry (redeem_perk keys the charge on this, not the per-attempt voucher
  // code). Fall back to a fresh token so an older client still works.
  const idemRaw = String(body.idempotencyKey || "");
  const idem = /^[A-Za-z0-9_-]{8,64}$/.test(idemRaw) ? idemRaw : randomUUID();

  // Retry only on a (rare) voucher-code collision — the token keeps the charge
  // idempotent across retries so this never double-charges.
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = voucherCode();
    const { data: result, error } = await db.rpc("redeem_perk", { p_user_id: userId, p_perk_id: perkId, p_code: code, p_idem: idem });
    if (error) continue; // transient — retry
    if (result === "INSUFFICIENT") return NextResponse.json({ ok: false, error: "insufficient" }, { status: 402 });
    if (result === "BLOCKED") return NextResponse.json({ ok: false, error: "unavailable" }, { status: 409 });
    if (result === "DUPLICATE") return NextResponse.json({ ok: false, error: "duplicate" }, { status: 409 });
    if (result === "RETRY") continue; // voucher-code clash → fresh code
    if (result === "") return NextResponse.json({ ok: false, error: "unavailable" }, { status: 409 });
    if (result === code) return NextResponse.json({ ok: true, voucher: code });
  }
  return NextResponse.json({ ok: false, error: "redeem_failed" }, { status: 502 });
}
