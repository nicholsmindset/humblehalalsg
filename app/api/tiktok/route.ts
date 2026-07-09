import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { rateLimit, tooMany } from "@/lib/ratelimit";
import { getServerFlags } from "@/lib/feature-flags";
import { parseTikTokUrl } from "@/lib/tiktok";

/* Public TikTok submission intake ("Feature your TikTok"). Anyone can submit a
   TikTok URL about a listing; it lands in tiktok_submissions as status='pending'
   for AI classification + human review. Rate-limited + honeypot. Graceful:
   simulates when Supabase isn't configured. Flag-gated. */
export const dynamic = "force-dynamic";

const isUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
const MAX_BODY_BYTES = 16 * 1024;

export async function POST(req: Request) {
  if (!(await getServerFlags()).tiktokUgc) return NextResponse.json({ ok: false, error: "not_enabled" }, { status: 404 });
  const rl = await rateLimit(req, "tiktok", 6, 3600); if (!rl.ok) return tooMany(rl.retryAfter);
  const len = Number(req.headers.get("content-length") || 0);
  if (len > MAX_BODY_BYTES) return NextResponse.json({ ok: false, error: "Payload too large" }, { status: 413 });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 }); }
  if (body?.website) return NextResponse.json({ ok: true, simulated: true }); // honeypot

  const parsed = parseTikTokUrl(String(body?.url || ""));
  if (!parsed.valid) return NextResponse.json({ ok: false, error: "Enter a valid TikTok video link (e.g. https://www.tiktok.com/@creator/video/…)." }, { status: 422 });

  const emailRaw = String(body?.email || "").trim().slice(0, 200);
  const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw) ? emailRaw : null;
  const note = String(body?.note || "").trim().slice(0, 600) || null;
  const bid = String(body?.businessId || "");
  let claimedBusinessId = isUuid(bid) ? bid : null;
  const businessSlug = String(body?.businessSlug || "").trim().slice(0, 120);

  const { userId } = await auth();

  try {
    const { getSupabaseAdmin } = await import("@/lib/supabase/server");
    const sb = getSupabaseAdmin();
    if (sb) {
      // Resolve a slug (from a listing's "Feature your video" link) → business id.
      if (!claimedBusinessId && businessSlug) {
        const { data: biz } = await sb.from("businesses").select("id").eq("slug", businessSlug).maybeSingle();
        if (biz) claimedBusinessId = String(biz.id);
      }
      // Dedupe: if this URL is already live (pending/approved), accept idempotently.
      const { data: existing } = await sb
        .from("tiktok_submissions").select("id, status")
        .eq("url", parsed.canonical).in("status", ["pending", "approved"]).maybeSingle();
      if (existing) return NextResponse.json({ ok: true, simulated: false, queued: true, duplicate: true });

      const { error } = await sb.from("tiktok_submissions").insert({
        url: parsed.canonical,
        video_id: parsed.videoId || null,
        handle: parsed.handle || null,
        submitter_email: email,
        claimed_business_id: claimedBusinessId,
        note,
        raw: { submitted_by: userId || null, short: parsed.short, ua: String(req.headers.get("user-agent") || "").slice(0, 200) },
        source: "self",
        status: "pending",
      });
      if (!error) return NextResponse.json({ ok: true, simulated: false, queued: true });
    }
  } catch { /* fall through to simulated */ }

  return NextResponse.json({ ok: true, simulated: true });
}
