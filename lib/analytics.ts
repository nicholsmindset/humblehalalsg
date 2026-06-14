"use client";

// First-party event tracker. Writes through the SECURITY DEFINER track_event()
// RPC (the only write path the anon key has — see 0010_analytics.sql).
//
// Graceful by design (matches the "Supabase last" project convention): when the
// backend isn't configured, getSupabaseBrowser() returns null and every call is
// a silent no-op, so the UI works identically in mock mode. Calls are
// fire-and-forget and never throw into the UI.

import { getSupabaseBrowser } from "./supabase/client";

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

export const track = {
  pageView(path?: string) {
    emit({ p_event_type: "page_view", ...(path ? { p_path: path } : {}) });
  },
  impression(slug: string, category?: string) {
    emit({ p_event_type: "impression", p_listing_slug: slug, p_category: category ?? null });
  },
  listingView(slug: string, category?: string) {
    emit({ p_event_type: "listing_view", p_listing_slug: slug, p_category: category ?? null });
  },
  search(query: string) {
    if (!query.trim()) return;
    emit({ p_event_type: "search", p_query: query });
  },
  leadAction(type: LeadAction, slug: string, category?: string) {
    emit({
      p_event_type: "lead_action",
      p_lead_action_type: type,
      p_listing_slug: slug,
      p_category: category ?? null,
    });
  },
};
