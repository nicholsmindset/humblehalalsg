/* Humble Halal — marketing attribution for ticket sales (PDPA-conscious).
   Identifies the CHANNEL that brought a buyer — an organiser tracking link
   (/e/[slug]?ref=CODE), UTM-tagged campaign, or external referrer — never the
   person. The hh_attr cookie holds only channel labels; no PII.

   Touch rules:
     * /e/[slug] tracking links ALWAYS overwrite the cookie (an explicit
       organiser-campaign click is the strongest signal → that link gets credit).
     * captureAttribution() (mounted site-wide) writes only on FIRST touch, so
       organic/UTM attribution survives in-site navigation until purchase.
   The checkout API reads the cookie server-side and snapshots it onto the
   order row (orders.utm / orders.ref_code — migration 0042). */

export const ATTR_COOKIE = "hh_attr";
export const ATTR_TTL_DAYS = 30;

export interface Attribution {
  ref?: string; // organiser tracking-link code (event_ref_codes.code)
  source?: string; // utm_source
  medium?: string; // utm_medium
  campaign?: string; // utm_campaign
  content?: string; // utm_content
  term?: string; // utm_term
  referrer?: string; // external referrer hostname only (not the full URL)
}

const str = (v: unknown, max: number) => {
  const s = typeof v === "string" ? v.trim() : "";
  return s ? s.slice(0, max) : undefined;
};

/** Whitelist + truncate — the cookie is client-writable, so treat as untrusted. */
export function sanitizeAttribution(raw: unknown): Attribution | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const a: Attribution = {
    ref: str(r.ref, 32),
    source: str(r.source, 80),
    medium: str(r.medium, 80),
    campaign: str(r.campaign, 120),
    content: str(r.content, 120),
    term: str(r.term, 120),
    referrer: str(r.referrer, 120),
  };
  for (const k of Object.keys(a) as (keyof Attribution)[]) if (a[k] === undefined) delete a[k];
  return Object.keys(a).length ? a : null;
}

/** Server-safe: pull the attribution out of a raw Cookie header. */
export function parseAttributionCookie(cookieHeader: string | null | undefined): Attribution | null {
  if (!cookieHeader) return null;
  const m = cookieHeader.match(new RegExp(`(?:^|;\\s*)${ATTR_COOKIE}=([^;]+)`));
  if (!m) return null;
  try {
    return sanitizeAttribution(JSON.parse(decodeURIComponent(m[1])));
  } catch {
    return null;
  }
}

/** Build an attribution from landing-page signals (query string + referrer). */
export function attributionFromLanding(search: string, referrer: string, ownHost?: string): Attribution | null {
  let p: URLSearchParams;
  try {
    p = new URLSearchParams(search);
  } catch {
    return null;
  }
  let refHost = "";
  try {
    refHost = referrer ? new URL(referrer).hostname : "";
  } catch {
    refHost = "";
  }
  return sanitizeAttribution({
    ref: p.get("ref") ?? undefined,
    source: p.get("utm_source") ?? undefined,
    medium: p.get("utm_medium") ?? undefined,
    campaign: p.get("utm_campaign") ?? undefined,
    content: p.get("utm_content") ?? undefined,
    term: p.get("utm_term") ?? undefined,
    referrer: refHost && refHost !== ownHost ? refHost : undefined,
  });
}

/** Set-Cookie / document.cookie value for an attribution. */
export function serializeAttributionCookie(a: Attribution): string {
  return `${ATTR_COOKIE}=${encodeURIComponent(JSON.stringify(a))}; Max-Age=${ATTR_TTL_DAYS * 86400}; Path=/; SameSite=Lax`;
}

/** Client, first-touch only: record how this visit arrived if we haven't yet.
 *  Mounted once site-wide (components/analytics/page-view.tsx). Never throws. */
export function captureAttribution(): void {
  if (typeof window === "undefined") return;
  try {
    if (document.cookie.includes(`${ATTR_COOKIE}=`)) return; // first touch wins
    const a = attributionFromLanding(window.location.search, document.referrer, window.location.hostname);
    if (a) document.cookie = serializeAttributionCookie(a);
  } catch {
    /* attribution must never break the page */
  }
}
