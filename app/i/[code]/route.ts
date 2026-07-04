import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { rateLimit, tooMany } from "@/lib/ratelimit";

/* Consumer referral link: /i/[code] → 302 home (or /sign-in?signup=1) and
   stamp an `hh_ref` cookie carrying ONLY the referral code (no PII). LoginScreen
   reads it on signup and passes it through Clerk unsafeMetadata; the Clerk
   webhook credits the referrer. Best-effort click count. Always redirects —
   even flag-off — so a shared link never breaks. Mirrors app/e/[slug]. */

const CODE_RE = /^[a-z0-9]{4,12}$/;

export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const url = new URL(req.url);
  const safe = CODE_RE.test(code) ? code.toLowerCase() : "";
  const signup = url.searchParams.get("signup") === "1";
  const dest = new URL(signup ? "/sign-in?signup=1" : "/", url.origin);

  const rl = await rateLimit(req, "refclick", 60, 3600);
  if (!rl.ok) return tooMany(rl.retryAfter);

  const res = NextResponse.redirect(dest, 302);
  if (safe) {
    // 30-day, code-only cookie (mirrors hh_attr rules — SameSite=Lax, no PII).
    res.headers.append("Set-Cookie", `hh_ref=${safe}; Max-Age=2592000; Path=/; SameSite=Lax`);
    const supa = getSupabaseAdmin();
    if (supa) {
      try { await supa.rpc("increment_referral_click", { p_code: safe }); } catch { /* never block the redirect */ }
    }
  }
  return res;
}
