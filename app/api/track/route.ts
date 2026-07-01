import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { rateLimit, tooMany } from "@/lib/ratelimit";

/* Phase-2 server-side conversions — Meta Conversions API (CAPI) + TikTok Events API.
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

const META_GRAPH_VERSION = "v21.0";
const META_PIXEL_ID = process.env.META_PIXEL_ID;
const META_TOKEN = process.env.META_CAPI_ACCESS_TOKEN;
const META_TEST_CODE = process.env.META_TEST_EVENT_CODE || undefined;
const TIKTOK_PIXEL_ID = process.env.TIKTOK_PIXEL_ID;
const TIKTOK_TOKEN = process.env.TIKTOK_EVENTS_ACCESS_TOKEN;
const TIKTOK_TEST_CODE = process.env.TIKTOK_TEST_EVENT_CODE || undefined;

// Our platform-agnostic event → [Meta event_name, TikTok event].
const EVENT_MAP: Record<string, { meta: string; tiktok: string }> = {
  sign_up: { meta: "CompleteRegistration", tiktok: "CompleteRegistration" },
  lead_submit: { meta: "Lead", tiktok: "SubmitForm" },
  contact_click: { meta: "Contact", tiktok: "Contact" },
  newsletter_signup: { meta: "Subscribe", tiktok: "Subscribe" },
  view_listing: { meta: "ViewContent", tiktok: "ViewContent" },
  event_rsvp: { meta: "Lead", tiktok: "SubmitForm" },
  purchase: { meta: "Purchase", tiktok: "CompletePayment" },
};

type UserData = { email?: string; phone?: string; external_id?: string };
type Body = {
  event?: string;
  event_id?: string;
  event_source_url?: string;
  user_data?: UserData;
  custom_data?: Record<string, unknown>;
};

const sha256 = (v: string) => createHash("sha256").update(v).digest("hex");
const normEmail = (e?: string) => (e ? sha256(e.trim().toLowerCase()) : undefined);
const normPhone = (p?: string) => {
  if (!p) return undefined;
  const digits = p.replace(/[^\d]/g, "");
  return digits ? sha256(digits) : undefined;
};
const hashId = (v?: string) => (v ? sha256(v.trim().toLowerCase()) : undefined);

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

/** POST JSON with a hard timeout; resolve to ok=false instead of throwing. */
async function post(url: string, body: unknown, headers: Record<string, string> = {}): Promise<boolean> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 3000);
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    if (!r.ok && process.env.NODE_ENV === "development") {
      console.debug("[track] upstream", r.status, await r.text().catch(() => ""));
    }
    return r.ok;
  } catch (e) {
    if (process.env.NODE_ENV === "development") console.debug("[track] fetch failed:", (e as Error).message);
    return false;
  } finally {
    clearTimeout(timer);
  }
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
  const map = EVENT_MAP[event];
  if (!event || !map || !body.event_id) {
    // Unknown/unmapped event — accept silently so the client never retries.
    return NextResponse.json({ ok: true, forwarded: { meta: false, tiktok: false } });
  }

  const eventTime = Math.floor(Date.now() / 1000);
  const ip = clientIp(req);
  const ua = req.headers.get("user-agent") || undefined;
  const cookieHeader = req.headers.get("cookie");
  const fbp = cookie("_fbp", cookieHeader);
  const fbc = cookie("_fbc", cookieHeader);
  const ttp = cookie("_ttp", cookieHeader);
  const url = body.event_source_url;
  const ud = body.user_data || {};
  const custom = body.custom_data || {};

  const jobs: Promise<boolean>[] = [];

  // ── Meta CAPI ──────────────────────────────────────────────────────────────
  if (META_PIXEL_ID && META_TOKEN) {
    const user_data: Record<string, unknown> = {
      client_ip_address: ip,
      client_user_agent: ua,
    };
    const em = normEmail(ud.email); if (em) user_data.em = [em];
    const ph = normPhone(ud.phone); if (ph) user_data.ph = [ph];
    const ext = hashId(ud.external_id); if (ext) user_data.external_id = [ext];
    if (fbp) user_data.fbp = fbp;
    if (fbc) user_data.fbc = fbc;

    const payload: Record<string, unknown> = {
      data: [
        {
          event_name: map.meta,
          event_time: eventTime,
          event_id: body.event_id,
          action_source: "website",
          event_source_url: url,
          user_data,
          custom_data: custom,
        },
      ],
    };
    if (META_TEST_CODE) payload.test_event_code = META_TEST_CODE;

    jobs.push(
      post(
        `https://graph.facebook.com/${META_GRAPH_VERSION}/${META_PIXEL_ID}/events?access_token=${encodeURIComponent(META_TOKEN)}`,
        payload,
      ),
    );
  }

  // ── TikTok Events API ───────────────────────────────────────────────────────
  if (TIKTOK_PIXEL_ID && TIKTOK_TOKEN) {
    const user: Record<string, unknown> = { ip, user_agent: ua };
    const em = normEmail(ud.email); if (em) user.email = [em];
    const ph = normPhone(ud.phone); if (ph) user.phone = [ph];
    const ext = hashId(ud.external_id); if (ext) user.external_id = [ext];
    if (ttp) user.ttp = ttp;

    const payload: Record<string, unknown> = {
      event_source: "web",
      event_source_id: TIKTOK_PIXEL_ID,
      data: [
        {
          event: map.tiktok,
          event_time: eventTime,
          event_id: body.event_id,
          user,
          page: url ? { url } : undefined,
          properties: custom,
        },
      ],
    };
    if (TIKTOK_TEST_CODE) payload.test_event_code = TIKTOK_TEST_CODE;

    jobs.push(
      post("https://business-api.tiktok.com/open_api/v1.3/event/track/", payload, { "Access-Token": TIKTOK_TOKEN }),
    );
  }

  const results = await Promise.allSettled(jobs);
  const ok = (i: number) => results[i]?.status === "fulfilled" && (results[i] as PromiseFulfilledResult<boolean>).value;

  // Order matches the push order: Meta first (if configured), then TikTok.
  let idx = 0;
  const metaForwarded = META_PIXEL_ID && META_TOKEN ? ok(idx++) : false;
  const tiktokForwarded = TIKTOK_PIXEL_ID && TIKTOK_TOKEN ? ok(idx++) : false;

  return NextResponse.json({ ok: true, forwarded: { meta: metaForwarded, tiktok: tiktokForwarded } });
}
