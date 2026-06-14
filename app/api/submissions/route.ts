import { NextResponse } from "next/server";
import { rateLimit, tooMany } from "@/lib/ratelimit";

/* Unified submission intake for add-listing, suggest-a-business and claim flows.
   Graceful-degradation: validates + accepts now (so the UI shows a real
   "submitted for review" state), and is the single point to route into the
   Supabase moderation queues (staging_businesses / suggestions / claims) once
   the backend is wired. */

const KINDS = ["listing", "suggest", "claim"] as const;
type Kind = (typeof KINDS)[number];
const isUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

export async function POST(req: Request) {
  const rl = await rateLimit(req, "submissions", 8, 3600); if (!rl.ok) return tooMany(rl.retryAfter);
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  if (body?.website) return NextResponse.json({ ok: true, simulated: true }); // honeypot

  const kind = String(body?.kind || "") as Kind;
  if (!KINDS.includes(kind)) {
    return NextResponse.json({ ok: false, error: "Unknown submission type" }, { status: 422 });
  }

  // light per-kind validation
  const name = String(body?.name || "").trim();
  if ((kind === "listing" || kind === "suggest") && name.length < 2) {
    return NextResponse.json({ ok: false, error: "A business name is required." }, { status: 422 });
  }
  if (kind === "claim" && !body?.businessId && name.length < 2) {
    return NextResponse.json({ ok: false, error: "Tell us which business you're claiming." }, { status: 422 });
  }

  try {
    const { getSupabaseAdmin } = await import("@/lib/supabase/server");
    const sb = getSupabaseAdmin();
    if (sb) {
      let table: string;
      let row: Record<string, unknown>;
      if (kind === "listing") {
        table = "staging_businesses";
        row = {
          name,
          slug: String(body?.slug || "") || null,
          address: String(body?.address || "") || null,
          postal: String(body?.postal || "") || null,
          category_suggested: String(body?.cat || body?.category || "") || null,
          source: "owner",
          raw: body,
          review_status: "new",
        };
      } else if (kind === "suggest") {
        table = "suggestions";
        row = {
          name,
          area: String(body?.area || "") || null,
          category: String(body?.category || "") || null,
          note: String(body?.note || body?.why || "") || null,
        };
      } else {
        table = "claims";
        const bid = String(body?.businessId || "");
        row = {
          business_id: isUuid(bid) ? bid : null,
          role: String(body?.role || "") || null,
          message: String(body?.message || "") || null,
          status: "pending",
        };
      }
      const { error } = await sb.from(table).insert(row);
      if (!error) return NextResponse.json({ ok: true, simulated: false, queued: true });
    }
  } catch {
    /* fall through to simulated */
  }

  return NextResponse.json({ ok: true, simulated: true });
}
