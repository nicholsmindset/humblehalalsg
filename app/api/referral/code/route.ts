import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { rateLimit, tooMany } from "@/lib/ratelimit";
import { getServerFlags } from "@/lib/flags";

/* Returns (or mints) the caller's referral code + share link + live counts.
   One code per user. Codes are lowercase [a-z0-9]{6}, collision-checked. */
export const dynamic = "force-dynamic";

const ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789"; // no ambiguous chars

function genCode(seed: number): string {
  // Deterministic-ish from a rotating seed; retried on unique violation.
  let s = seed >>> 0;
  let out = "";
  for (let i = 0; i < 6; i++) {
    s = (s * 1103515245 + 12345) >>> 0;
    out += ALPHABET[s % ALPHABET.length];
  }
  return out;
}

export async function GET(req: Request) {
  if (!getServerFlags().passport) return NextResponse.json({ ok: false, error: "not_enabled" }, { status: 404 });
  const rl = await rateLimit(req, "refcode", 10, 3600); if (!rl.ok) return tooMany(rl.retryAfter);
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: false, error: "service_not_configured" }, { status: 503 });

  const existing = await db.from("referral_codes").select("code, clicks, signups").eq("owner_user_id", userId).maybeSingle();
  if (existing.data) {
    const c = existing.data;
    return NextResponse.json({ ok: true, code: c.code, url: `/i/${c.code}`, clicks: c.clicks, signups: c.signups });
  }

  // Mint — retry a few times on the unlikely unique-collision.
  let baseSeed = 0;
  for (let i = 0; i < userId.length; i++) baseSeed = (baseSeed * 31 + userId.charCodeAt(i)) >>> 0;
  for (let attempt = 0; attempt < 6; attempt++) {
    const code = genCode(baseSeed + attempt * 7919);
    const { error } = await db.from("referral_codes").insert({ owner_user_id: userId, code });
    if (!error) return NextResponse.json({ ok: true, code, url: `/i/${code}`, clicks: 0, signups: 0 });
    // 23505 unique_violation → could be a re-run (owner already has a row) or a code clash.
    const again = await db.from("referral_codes").select("code, clicks, signups").eq("owner_user_id", userId).maybeSingle();
    if (again.data) {
      const c = again.data;
      return NextResponse.json({ ok: true, code: c.code, url: `/i/${c.code}`, clicks: c.clicks, signups: c.signups });
    }
  }
  return NextResponse.json({ ok: false, error: "mint_failed" }, { status: 502 });
}
