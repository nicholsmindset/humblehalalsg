import { NextResponse } from "next/server";
import { rateLimit, tooMany } from "@/lib/ratelimit";
import { forwardServerEvent, SERVER_EVENT_MAP, type ServerUserData } from "@/lib/server-track";

/* Phase-2 server-side conversions — Meta Conversions API (CAPI) + TikTok
 * Events API (shared logic in lib/server-track.ts; the Stripe webhook uses the
 * same helpers for authoritative purchases).
 *
 * The browser posts a conversion here with the SAME event_id it sent to the
 * browser pixel (see lib/analytics.ts → postServerEvent), so Meta/TikTok
 * de-duplicate the browser + server copies. PII is hashed (SHA-256) server-side;
 * IP / user-agent / fbp / fbc / ttp are read from the request so match quality
 * holds even when no email is available.
 *
 * Graceful by design (project convention): each platform is skipped unless its
 * token is configured, the handler never throws into the client, and it always
 * returns 200 so a tracking failure can never break a user flow. */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  event?: string;
  event_id?: string;
  event_source_url?: string;
  user_data?: ServerUserData;
  custom_data?: Record<string, unknown>;
};

/** Read a cookie value from the raw Cookie header. */
function cookie(name: string, header: string | null): string | undefined {
  if (!header) return undefined;
  const m = header.match(new RegExp("(?:^|; )" + name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "=([^;]*)"));
  return m ? decodeURIComponent(m[1]) : undefined;
}

function clientIp(req: Request): string | undefined {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || undefined;
}

export async function POST(req: Request) {
  const rl = await rateLimit(req, "track", 120, 3600);
  if (!rl.ok) return tooMany(rl.retryAfter);

  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  const event = String(body.event || "");
  if (!event || !SERVER_EVENT_MAP[event] || !body.event_id) {
    // Unknown/unmapped event — accept silently so the client never retries.
    return NextResponse.json({ ok: true, forwarded: { meta: false, tiktok: false } });
  }

  const cookieHeader = req.headers.get("cookie");
  const forwarded = await forwardServerEvent(event, body.event_id, {
    userData: body.user_data,
    customData: body.custom_data,
    ctx: {
      ip: clientIp(req),
      userAgent: req.headers.get("user-agent") || undefined,
      fbp: cookie("_fbp", cookieHeader),
      fbc: cookie("_fbc", cookieHeader),
      ttp: cookie("_ttp", cookieHeader),
      sourceUrl: body.event_source_url,
    },
  });

  return NextResponse.json({ ok: true, forwarded });
}
