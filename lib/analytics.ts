"use client";

// First-party event tracker. Writes through the SECURITY DEFINER track_event()
// RPC (the only write path the anon key has — see 0010_analytics.sql).
//
// Graceful by design (matches the "Supabase last" project convention): when the
// backend isn't configured, getSupabaseBrowser() returns null and every call is
// a silent no-op, so the UI works identically in mock mode. Calls are
// fire-and-forget and never throw into the UI.

import { getSupabaseBrowser } from "./supabase/client";

// --- GTM dataLayer bridge -------------------------------------------------
// The site pushes platform-agnostic events into one dataLayer; Google Tag
// Manager translates each into GA4 / Meta / TikTok / LinkedIn / Ads tags.
// Every track.* method mirrors its Supabase write into a dataLayer.push so
// there is a single source of truth. No-op during SSR.
declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

function dl(payload: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(payload);
}

/** Per-event id — used now as the browser pixel eventID/event_id and reused
 *  by Phase-2 server events (Meta CAPI / TikTok Events API) for de-duplication. */
export function newEventId(): string {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  } catch {
    /* fall through */
  }
  return `e_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
}

// --- Phase-2 server-side bridge -------------------------------------------
// Forwards a conversion to /api/track (Meta CAPI + TikTok Events API) with the
// SAME event_id already sent to the browser pixel, so the platforms de-dupe the
// two copies. OFF unless NEXT_PUBLIC_SERVER_EVENTS==="1"; fire-and-forget with
// keepalive so it survives navigation and never blocks or throws into the UI.
type ServerUserData = { email?: string; phone?: string; external_id?: string };

function postServerEvent(
  event: string,
  eventId: string,
  opts: { user_data?: ServerUserData; custom_data?: Record<string, unknown> } = {},
) {
  if (typeof window === "undefined") return;
  if (process.env.NEXT_PUBLIC_SERVER_EVENTS !== "1") return; // Phase-2 opt-in
  try {
    const clean = opts.user_data && Object.values(opts.user_data).some(Boolean) ? opts.user_data : undefined;
    void fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        event,
        event_id: eventId,
        event_source_url: window.location.href,
        user_data: clean,
        custom_data: opts.custom_data,
      }),
    }).catch(() => {});
  } catch {
    /* never break UX */
  }
}

export type LeadAction =
  | "enquiry_form"
  | "whatsapp"
  | "call"
  | "website"
  | "directions"
  | "shortlist";

const SESSION_KEY = "hh_sid";

/** Stable per-browser-session id (sessionStorage). Null during SSR. */
function sessionId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    let sid = window.sessionStorage.getItem(SESSION_KEY);
    if (!sid) {
      sid =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
      window.sessionStorage.setItem(SESSION_KEY, sid);
    }
    return sid;
  } catch {
    return null; // private mode / storage blocked → untracked, never crash
  }
}

type EventArgs = {
  p_event_type: string;
  p_session_id: string | null;
  p_lead_action_type?: string | null;
  p_listing_slug?: string | null;
  p_category?: string | null;
  p_query?: string | null;
  p_path?: string | null;
  p_referrer?: string | null;
};

function emit(args: Partial<EventArgs> & { p_event_type: string }) {
  const sb = getSupabaseBrowser();
  if (!sb || typeof window === "undefined") return; // mock mode → no-op
  const payload: EventArgs = {
    p_session_id: sessionId(),
    p_path: window.location.pathname,
    p_referrer: document.referrer || null,
    ...args,
  };
  // fire-and-forget; swallow all errors so analytics never affects UX
  void sb.rpc("track_event", payload).then(({ error }) => {
    if (error && process.env.NODE_ENV === "development") {
      console.debug("[analytics] track_event failed:", error.message);
    }
  });
}

/** Optional listing metadata for richer GA4/Meta ViewContent params. */
type ListingMeta = { name?: string; area?: string; certified?: boolean };

export const track = {
  pageView(path?: string) {
    emit({ p_event_type: "page_view", ...(path ? { p_path: path } : {}) });
    dl({
      event: "page_view",
      page_path: path ?? (typeof window !== "undefined" ? window.location.pathname : undefined),
      page_location: typeof window !== "undefined" ? window.location.href : undefined,
      page_title: typeof document !== "undefined" ? document.title : undefined,
    });
  },
  impression(slug: string, category?: string) {
    emit({ p_event_type: "impression", p_listing_slug: slug, p_category: category ?? null });
  },
  listingView(slug: string, category?: string, meta?: ListingMeta) {
    emit({ p_event_type: "listing_view", p_listing_slug: slug, p_category: category ?? null });
    dl({
      event: "view_listing",
      listing_id: slug,
      listing_category: category ?? undefined,
      listing_name: meta?.name,
      listing_area: meta?.area,
      listing_certified: meta?.certified,
    });
  },
  search(query: string) {
    if (!query.trim()) return;
    emit({ p_event_type: "search", p_query: query });
    dl({ event: "search", search_term: query });
  },
  leadAction(type: LeadAction, slug: string, category?: string) {
    emit({
      p_event_type: "lead_action",
      p_lead_action_type: type,
      p_listing_slug: slug,
      p_category: category ?? null,
    });
    // Map the mixed lead-action bucket to the right dataLayer event so GTM can
    // route each correctly: contact clicks → contact_click, an on-listing
    // enquiry → lead_submit, a shortlist/save → save_listing (engagement).
    if (type === "enquiry_form") {
      const eventId = newEventId();
      dl({ event: "lead_submit", lead_type: "enquiry", listing_id: slug, listing_category: category ?? undefined, event_id: eventId });
      postServerEvent("lead_submit", eventId, { custom_data: { lead_type: "enquiry", content_ids: [slug], content_category: category } });
    } else if (type === "shortlist") {
      dl({ event: "save_listing", listing_id: slug, listing_category: category ?? undefined });
    } else {
      const eventId = newEventId();
      dl({ event: "contact_click", contact_method: type, listing_id: slug, listing_category: category ?? undefined, event_id: eventId });
      postServerEvent("contact_click", eventId, { custom_data: { contact_method: type, content_ids: [slug], content_category: category } });
    }
  },
  // Newsletter opt-in. `source` (footer, hero, popup, tool:<slug>, …) rides in
  // p_category so each capture surface gets its own conversion attribution.
  newsletterSignup(source: string, email?: string) {
    emit({ p_event_type: "newsletter_signup", p_category: source });
    const eventId = newEventId();
    dl({ event: "newsletter_signup", source, event_id: eventId });
    postServerEvent("newsletter_signup", eventId, { user_data: email ? { email } : undefined, custom_data: { source } });
  },
  // --- Conversion events. dataLayer drives the browser pixels; postServerEvent
  // mirrors to /api/track (Meta CAPI / TikTok Events API) with the SAME event_id
  // for de-duplication (no-op until NEXT_PUBLIC_SERVER_EVENTS=1). One call → all
  // platforms, browser + server. The Supabase capture lives in each /api route. -
  signUp(method: "email" | "google", userRole: "user" | "owner", email?: string) {
    const eventId = newEventId();
    dl({ event: "sign_up", method, user_role: userRole, event_id: eventId });
    postServerEvent("sign_up", eventId, { user_data: email ? { email } : undefined });
  },
  leadSubmit(
    leadType: "quote" | "claim" | "suggest" | "contact" | "enquiry",
    extra: { listing_id?: string; listing_category?: string; value?: number; currency?: string } = {},
    userData?: ServerUserData,
  ) {
    const eventId = newEventId();
    dl({ event: "lead_submit", lead_type: leadType, ...extra, event_id: eventId });
    postServerEvent("lead_submit", eventId, { user_data: userData, custom_data: { lead_type: leadType, ...extra } });
  },
  eventRsvp(itemId: string, itemName: string, quantity: number, email?: string) {
    const eventId = newEventId();
    dl({ event: "event_rsvp", item_id: itemId, item_name: itemName, quantity, value: 0, currency: "SGD", event_id: eventId });
    postServerEvent("event_rsvp", eventId, { user_data: email ? { email } : undefined, custom_data: { content_ids: [itemId], content_name: itemName } });
  },
  purchase(
    o: { transaction_id?: string; item_id?: string; item_name?: string; tier?: string; quantity?: number; value?: number; currency?: string },
    userData?: ServerUserData,
  ) {
    const eventId = newEventId();
    dl({ event: "purchase", currency: "SGD", ...o, event_id: eventId });
    postServerEvent("purchase", eventId, { user_data: userData, custom_data: { value: o.value, currency: o.currency ?? "SGD", content_ids: o.item_id ? [o.item_id] : undefined } });
  },
  // --- Ads -------------------------------------------------------------------
  // Ad slot events for GTM/GA4. Direct-sponsor impressions/clicks are ALSO
  // persisted server-side (/api/ads/track → track_ad_event RPC) for the admin
  // performance table; here we mirror to the dataLayer so GA4 gets slot-level
  // fill, source (direct|adsense) and CTR. AdSense reports its own revenue —
  // this just gives GA4 visibility of which slots rendered. No PII.
  adImpression(o: { placement: string; source: "direct" | "adsense"; campaignId?: string }) {
    dl({ event: "ad_impression", ad_placement: o.placement, ad_source: o.source, campaign_id: o.campaignId });
  },
  adClick(o: { placement: string; source: "direct" | "adsense"; campaignId?: string }) {
    dl({ event: "ad_click", ad_placement: o.placement, ad_source: o.source, campaign_id: o.campaignId });
  },
};
