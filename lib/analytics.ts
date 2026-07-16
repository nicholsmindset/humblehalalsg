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
  | "shortlist"
  | "share"
  | "claim"
  | "booking"
  | "menu"
  | "cert_view";

const SESSION_KEY = "hh_sid";

/** The analytics session id, for callers that need to correlate a server-side
 *  record with this browser session (e.g. orders.session_id → funnel joins). */
export function getSessionId(): string | null {
  return sessionId();
}

/** GA4 client id from the _ga cookie ("GA1.1.123456.7890" → "123456.7890").
 *  Sent to checkout routes → Stripe metadata → webhook → GA4 Measurement
 *  Protocol, so server-side purchases land in the SAME GA4 user journey.
 *  Null when GA hasn't set the cookie (no consent / blocked). */
export function getGaClientId(): string | null {
  if (typeof document === "undefined") return null;
  try {
    const m = document.cookie.match(/(?:^|;\s*)_ga=([^;]+)/);
    if (!m) return null;
    const parts = decodeURIComponent(m[1]).split(".");
    return parts.length >= 4 ? `${parts[2]}.${parts[3]}` : null;
  } catch {
    return null;
  }
}

/** Analytics context for checkout POST bodies → Stripe session metadata →
 *  webhook → GA4 Measurement Protocol. Spread into the JSON body:
 *  `{ ...payload, ...checkoutMeta() }`. */
export function checkoutMeta(): { ga_client_id: string | null; hh_session_id: string | null } {
  return { ga_client_id: getGaClientId(), hh_session_id: getSessionId() };
}

/** Has the visitor granted analytics consent? (banner writes hh_consent_v1 —
 *  see components/cookie-consent.tsx). Used to gate the GA4 user_id push. */
function analyticsConsented(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const c = JSON.parse(localStorage.getItem("hh_consent_v1") || "null");
    return !!(c && typeof c === "object" && c.analytics);
  } catch {
    return false;
  }
}

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
  p_area?: string | null;
  p_device?: string | null;
  p_results_count?: number | null;
  p_placement?: string | null;
};

// Params added by 0045 — stripped and retried if the DB predates the migration
// (PGRST202 = no matching function), so the deploy-before-migration window
// still records the legacy shape instead of dropping events.
const V2_KEYS = ["p_area", "p_device", "p_results_count"] as const;
const V3_KEYS = ["p_placement"] as const;

function device(): string {
  try {
    return window.matchMedia("(max-width: 768px)").matches ? "mobile" : "desktop";
  } catch {
    return "desktop";
  }
}

function emit(args: Partial<EventArgs> & { p_event_type: string }) {
  const sb = getSupabaseBrowser();
  if (!sb || typeof window === "undefined") return; // mock mode → no-op
  const payload: EventArgs = {
    p_session_id: sessionId(),
    p_path: window.location.pathname,
    p_referrer: document.referrer || null,
    p_device: device(),
    ...args,
  };
  // fire-and-forget; swallow all errors so analytics never affects UX
  void sb.rpc("track_event", payload).then(({ error }) => {
    if (error?.code === "PGRST202") {
      // First retry the 0045 shape (placement was added in 0073), then the
      // original eight-argument shape for older preview databases.
      const v2 = { ...payload };
      for (const k of V3_KEYS) delete v2[k];
      void sb.rpc("track_event", v2).then(({ error: v2Error }) => {
        if (v2Error?.code !== "PGRST202") return;
        const legacy = { ...v2 };
        for (const k of V2_KEYS) delete legacy[k];
        void sb.rpc("track_event", legacy).then(() => {});
      });
      return;
    }
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
  impression(slug: string, category?: string, area?: string, placement?: string) {
    emit({ p_event_type: "impression", p_listing_slug: slug, p_category: category ?? null, p_area: area ?? null, p_placement: placement ?? null });
  },
  offerView(slug: string, category?: string) {
    emit({ p_event_type: "offer_view", p_listing_slug: slug, p_category: category ?? null, p_placement: "listing_offer" });
  },
  listingView(slug: string, category?: string, meta?: ListingMeta) {
    emit({ p_event_type: "listing_view", p_listing_slug: slug, p_category: category ?? null, p_area: meta?.area ?? null });
    dl({
      event: "view_listing",
      listing_id: slug,
      listing_category: category ?? undefined,
      listing_name: meta?.name,
      listing_area: meta?.area,
      listing_certified: meta?.certified,
    });
  },
  search(query: string, resultsCount?: number) {
    if (!query.trim()) return;
    emit({ p_event_type: "search", p_query: query, ...(typeof resultsCount === "number" ? { p_results_count: resultsCount } : {}) });
    dl({ event: "search", search_term: query, results_count: resultsCount });
  },
  // A search-results card was opened — powers search→click rate and, per
  // session, the owner-facing "search terms that led to your listing".
  searchResultClick(slug: string, category?: string, query?: string) {
    emit({ p_event_type: "search_result_click", p_listing_slug: slug, p_category: category ?? null, p_query: query ?? null });
    dl({ event: "search_result_click", listing_id: slug, search_term: query });
  },
  // Commercial-intent filters: near_me, open_now, prayer_space, muis_certified,
  // muslim_owned, halal_friendly, family_friendly, hotels, mosques, …
  filterUse(key: string) {
    emit({ p_event_type: "filter_use", p_query: key });
    dl({ event: "filter_use", filter_key: key });
  },
  mapOpen() {
    emit({ p_event_type: "map_open" });
    dl({ event: "map_open" });
  },
  aiQuery(query: string) {
    if (!query.trim()) return;
    emit({ p_event_type: "ai_query", p_query: query.slice(0, 300) });
    dl({ event: "ai_query" }); // no query text to third parties
  },
  aiResultClick(slug: string, category?: string) {
    emit({ p_event_type: "ai_result_click", p_listing_slug: slug, p_category: category ?? null });
    dl({ event: "ai_result_click", listing_id: slug });
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
    } else if (type === "share") {
      dl({ event: "share", listing_id: slug, listing_category: category ?? undefined });
    } else if (type === "claim") {
      dl({ event: "claim_click", listing_id: slug, listing_category: category ?? undefined });
    } else if (type === "cert_view") {
      dl({ event: "cert_view", listing_id: slug, listing_category: category ?? undefined });
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
  // Buyer opened a checkout — the middle step of every revenue funnel
  // (page_view → begin_checkout → purchase). Persisted first-party (0042 admits
  // the event_type) and mirrored as GA4's begin_checkout with an ecommerce
  // payload. `checkoutType` segments the revenue stream
  // (ticket|plan|ad|leads|donation|hotel).
  checkoutStart(
    itemId: string,
    itemName?: string,
    value?: number,
    opts: { checkoutType?: string; quantity?: number; itemCategory?: string } = {},
  ) {
    emit({ p_event_type: "checkout_start", p_listing_slug: itemId });
    const eventId = newEventId();
    dl({
      event: "begin_checkout",
      item_id: itemId,
      item_name: itemName,
      value,
      currency: "SGD",
      checkout_type: opts.checkoutType,
      event_id: eventId,
      ecommerce: {
        value,
        currency: "SGD",
        items: [{ item_id: itemId, item_name: itemName, item_category: opts.itemCategory ?? opts.checkoutType, price: value, quantity: opts.quantity ?? 1 }],
      },
    });
    postServerEvent("begin_checkout", eventId, { custom_data: { value, currency: "SGD", content_ids: [itemId], checkout_type: opts.checkoutType } });
  },
  eventRsvp(itemId: string, itemName: string, quantity: number, email?: string) {
    const eventId = newEventId();
    dl({ event: "event_rsvp", item_id: itemId, item_name: itemName, quantity, value: 0, currency: "SGD", event_id: eventId });
    postServerEvent("event_rsvp", eventId, { user_data: email ? { email } : undefined, custom_data: { content_ids: [itemId], content_name: itemName } });
  },
  purchase(
    o: {
      transaction_id?: string;
      item_id?: string;
      item_name?: string;
      item_category?: string;
      checkout_type?: string;
      tier?: string;
      quantity?: number;
      value?: number;
      currency?: string;
    },
    userData?: ServerUserData,
  ) {
    const eventId = newEventId();
    const currency = o.currency ?? "SGD";
    dl({
      event: "purchase",
      currency,
      ...o,
      event_id: eventId,
      ecommerce: {
        transaction_id: o.transaction_id,
        value: o.value,
        currency,
        items: [{ item_id: o.item_id, item_name: o.item_name, item_category: o.item_category ?? o.checkout_type, price: o.value, quantity: o.quantity ?? 1 }],
      },
    });
    postServerEvent("purchase", eventId, { user_data: userData, custom_data: { value: o.value, currency, content_ids: o.item_id ? [o.item_id] : undefined } });
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
  // --- Identity ---------------------------------------------------------------
  // GA4 user_id (Clerk id, pseudonymous) + user_properties, enabling
  // owner-vs-consumer segments and per-owner reporting. Only pushed once
  // analytics consent is granted (PDPA); GTM attaches these to every GA4 event
  // via the "GTES - User" event-settings variable.
  identify(userId: string, userRole: "user" | "owner" | "admin") {
    if (!analyticsConsented()) return;
    dl({ event: "user_ready", user_id: userId, user_role: userRole });
  },
  // Owner's business context — set when the dashboard resolves the owned
  // business (no extra queries). Segments all subsequent events by business.
  identifyOwner(o: { businessId: string; plan?: string; halalTier?: string }) {
    if (!analyticsConsented()) return;
    dl({ event: "owner_ready", owner_business_id: o.businessId, owner_plan: o.plan, owner_halal_tier: o.halalTier });
  },
  // --- Consumer journey gap-fills ----------------------------------------------
  viewEvent(id: string, name: string, category?: string, isFree?: boolean) {
    emit({ p_event_type: "event_view", p_listing_slug: id, p_category: category ?? null });
    dl({ event: "view_event", item_id: id, item_name: name, event_category: category, is_free: isFree });
  },
  addToCalendar(id: string, name?: string) {
    dl({ event: "add_to_calendar", item_id: id, item_name: name });
  },
  reviewSubmit(targetId: string, rating?: number, targetType: "business" | "event" = "business") {
    emit({ p_event_type: "review_submit", p_listing_slug: targetId });
    dl({ event: "review_submit", listing_id: targetId, rating, target_type: targetType });
  },
  follow(organizerId: string) {
    emit({ p_event_type: "follow", p_listing_slug: organizerId });
    dl({ event: "follow", organizer_id: organizerId });
  },
  toolUse(slug: string) {
    emit({ p_event_type: "tool_use", p_category: slug });
    dl({ event: "tool_use", tool_slug: slug });
  },
  // Scroll-depth milestones on blog posts (25/50/75/100). dataLayer-only — four
  // extra DB writes per read would be noise in the first-party table.
  blogRead(slug: string, percent: number) {
    dl({ event: "blog_read", blog_slug: slug, percent });
  },
  // --- Owner events (segmentation: every event carries the business context) ---
  ownerAddListing(o: { businessName: string; category?: string; area?: string; halalTier?: string; franchise?: boolean }) {
    dl({
      event: "owner_add_listing",
      business_name: o.businessName,
      listing_category: o.category,
      listing_area: o.area,
      halal_tier: o.halalTier,
      franchise: o.franchise,
      event_id: newEventId(),
    });
  },
  ownerCreateEvent(o: { eventId: string; title: string; isFree?: boolean; price?: number; capacity?: number; category?: string }) {
    dl({
      event: "owner_create_event",
      item_id: o.eventId,
      event_title: o.title,
      is_free: o.isFree,
      price: o.price,
      capacity: o.capacity,
      event_category: o.category,
      event_id: newEventId(),
    });
  },
  ownerLeadWon(routeId: string, businessId?: string) {
    dl({ event: "owner_lead_won", route_id: routeId, business_id: businessId, event_id: newEventId() });
  },
  // Long-tail dashboard actions funnel through one event; `action` is the
  // GA4 dimension (cert_upload, review_reply, ad_request, listing_edit,
  // offer_publish, photo_upload, lead_accept, lead_status, event_cancel,
  // billing_portal, connect_onboard, …).
  ownerAction(action: string, businessId?: string, extra: Record<string, unknown> = {}) {
    dl({ event: "owner_action", action, business_id: businessId, ...extra });
  },
};
