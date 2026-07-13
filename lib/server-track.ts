import { createHash } from "crypto";

/* Shared server-side conversion forwarding — Meta Conversions API (CAPI) +
 * TikTok Events API. Used by app/api/track (browser-mirrored events) and the
 * Stripe webhook (authoritative purchases). Events carry the same event_id as
 * their browser-pixel twin, so the platforms de-duplicate the two copies.
 *
 * Graceful by design: each platform is skipped unless its token is configured,
 * requests time out after 3s, and nothing here ever throws to the caller. */

const META_GRAPH_VERSION = "v21.0";
const META_PIXEL_ID = process.env.META_PIXEL_ID;
const META_TOKEN = process.env.META_CAPI_ACCESS_TOKEN;
const META_TEST_CODE = process.env.META_TEST_EVENT_CODE || undefined;
const TIKTOK_PIXEL_ID = process.env.TIKTOK_PIXEL_ID;
const TIKTOK_TOKEN = process.env.TIKTOK_EVENTS_ACCESS_TOKEN;
const TIKTOK_TEST_CODE = process.env.TIKTOK_TEST_EVENT_CODE || undefined;

// Our platform-agnostic event → [Meta event_name, TikTok event].
export const SERVER_EVENT_MAP: Record<string, { meta: string; tiktok: string }> = {
  sign_up: { meta: "CompleteRegistration", tiktok: "CompleteRegistration" },
  lead_submit: { meta: "Lead", tiktok: "SubmitForm" },
  contact_click: { meta: "Contact", tiktok: "Contact" },
  newsletter_signup: { meta: "Subscribe", tiktok: "Subscribe" },
  view_listing: { meta: "ViewContent", tiktok: "ViewContent" },
  event_rsvp: { meta: "Lead", tiktok: "SubmitForm" },
  begin_checkout: { meta: "InitiateCheckout", tiktok: "InitiateCheckout" },
  purchase: { meta: "Purchase", tiktok: "CompletePayment" },
};

export type ServerUserData = { email?: string; phone?: string; external_id?: string };

export type ServerEventContext = {
  ip?: string;
  userAgent?: string;
  fbp?: string;
  fbc?: string;
  ttp?: string;
  sourceUrl?: string;
};

/** Extract the analytics context a checkout client sent (lib/analytics
 *  checkoutMeta()) as sanitized Stripe-metadata fields. The webhook reads these
 *  back to attribute the server-side GA4 purchase to the buyer's session. */
export function analyticsSessionMeta(body: Record<string, unknown> | null | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  const g = body && typeof body.ga_client_id === "string" ? body.ga_client_id.replace(/[^\w.-]/g, "").slice(0, 64) : "";
  const s = body && typeof body.hh_session_id === "string" ? body.hh_session_id.replace(/[^\w.-]/g, "").slice(0, 64) : "";
  if (g) out.ga_client_id = g;
  if (s) out.hh_session_id = s;
  return out;
}

const sha256 = (v: string) => createHash("sha256").update(v).digest("hex");
export const normEmail = (e?: string) => (e ? sha256(e.trim().toLowerCase()) : undefined);
export const normPhone = (p?: string) => {
  if (!p) return undefined;
  const digits = p.replace(/[^\d]/g, "");
  return digits ? sha256(digits) : undefined;
};
export const hashId = (v?: string) => (v ? sha256(v.trim().toLowerCase()) : undefined);

/** POST JSON with a hard timeout; resolve to ok=false instead of throwing. */
export async function postJson(url: string, body: unknown, headers: Record<string, string> = {}): Promise<boolean> {
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
      console.debug("[server-track] upstream", r.status, await r.text().catch(() => ""));
    }
    return r.ok;
  } catch (e) {
    if (process.env.NODE_ENV === "development") console.debug("[server-track] fetch failed:", (e as Error).message);
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/** Forward one conversion to Meta CAPI + TikTok Events API (each skipped when
 *  unconfigured). Returns per-platform delivery booleans. */
export async function forwardServerEvent(
  event: string,
  eventId: string,
  opts: { userData?: ServerUserData; customData?: Record<string, unknown>; ctx?: ServerEventContext } = {},
): Promise<{ meta: boolean; tiktok: boolean }> {
  const map = SERVER_EVENT_MAP[event];
  if (!map || !eventId) return { meta: false, tiktok: false };

  const eventTime = Math.floor(Date.now() / 1000);
  const { userData: ud = {}, customData: custom = {}, ctx = {} } = opts;
  const jobs: Promise<boolean>[] = [];

  if (META_PIXEL_ID && META_TOKEN) {
    const user_data: Record<string, unknown> = {
      client_ip_address: ctx.ip,
      client_user_agent: ctx.userAgent,
    };
    const em = normEmail(ud.email); if (em) user_data.em = [em];
    const ph = normPhone(ud.phone); if (ph) user_data.ph = [ph];
    const ext = hashId(ud.external_id); if (ext) user_data.external_id = [ext];
    if (ctx.fbp) user_data.fbp = ctx.fbp;
    if (ctx.fbc) user_data.fbc = ctx.fbc;

    const payload: Record<string, unknown> = {
      data: [
        {
          event_name: map.meta,
          event_time: eventTime,
          event_id: eventId,
          action_source: "website",
          event_source_url: ctx.sourceUrl,
          user_data,
          custom_data: custom,
        },
      ],
    };
    if (META_TEST_CODE) payload.test_event_code = META_TEST_CODE;

    jobs.push(
      postJson(
        `https://graph.facebook.com/${META_GRAPH_VERSION}/${META_PIXEL_ID}/events?access_token=${encodeURIComponent(META_TOKEN)}`,
        payload,
      ),
    );
  }

  if (TIKTOK_PIXEL_ID && TIKTOK_TOKEN) {
    const user: Record<string, unknown> = { ip: ctx.ip, user_agent: ctx.userAgent };
    const em = normEmail(ud.email); if (em) user.email = [em];
    const ph = normPhone(ud.phone); if (ph) user.phone = [ph];
    const ext = hashId(ud.external_id); if (ext) user.external_id = [ext];
    if (ctx.ttp) user.ttp = ctx.ttp;

    const payload: Record<string, unknown> = {
      event_source: "web",
      event_source_id: TIKTOK_PIXEL_ID,
      data: [
        {
          event: map.tiktok,
          event_time: eventTime,
          event_id: eventId,
          user,
          page: ctx.sourceUrl ? { url: ctx.sourceUrl } : undefined,
          properties: custom,
        },
      ],
    };
    if (TIKTOK_TEST_CODE) payload.test_event_code = TIKTOK_TEST_CODE;

    jobs.push(
      postJson("https://business-api.tiktok.com/open_api/v1.3/event/track/", payload, { "Access-Token": TIKTOK_TOKEN }),
    );
  }

  const results = await Promise.allSettled(jobs);
  const ok = (i: number) => results[i]?.status === "fulfilled" && (results[i] as PromiseFulfilledResult<boolean>).value;
  let idx = 0;
  return {
    meta: META_PIXEL_ID && META_TOKEN ? ok(idx++) : false,
    tiktok: TIKTOK_PIXEL_ID && TIKTOK_TOKEN ? ok(idx++) : false,
  };
}
