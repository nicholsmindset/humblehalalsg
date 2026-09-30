import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";
import { isBlockedFoodListing } from "@/lib/listing-safety";
import { redirectFor } from "@/lib/gone-redirect-map";

/* Next.js 16: "proxy" is the renamed "middleware" file convention. Clerk's
   clerkMiddleware() runs here so auth() is populated downstream. Do NOT set a
   `runtime` key (Next 16 throws); proxy defaults to the Node.js runtime, which
   Clerk supports. Only one proxy function is allowed per file. */

// The admin console AND the business owner dashboard are gated at the middleware
// layer (redirects anonymous to sign-in; each page also re-checks server-side).
// EVERY API route already does its own auth() / requireAdmin() check, so we must
// NOT blanket-protect /api/* here — doing so 404s public, guest-facing flows
// (travel & event browsing, guest checkout, autocomplete). Public/self-
// authenticating routes (travel search/book, events browsing, Stripe/Svix/cron
// webhooks) therefore stay open at this layer and enforce auth inside each handler.
const isProtected = createRouteMatcher(["/admin(.*)", "/owner(.*)"]);

// /feature-tiktok is gated behind the off-by-default `tiktokUgc` flag; when off the
// page calls notFound(), which in this app streams a *200* shell (soft-404). Do a
// real routing-layer redirect to /suggest instead so users never land on 404 content
// with a 200 status. Gated on the ENV flag only (proxy can't read the Supabase
// platform_settings override) — enabling the feature for launch means setting
// TIKTOK_UGC_ENABLED, which also lets the page itself render.
const truthy = (v: string | undefined) => v === "1" || v === "true" || v === "on";

// Travel/hotel booking is intentionally dormant for launch. Blocking at Proxy
// prevents every page and handler from reaching LiteAPI, payment, weather, or AI
// providers while keeping the implementation available for a later relaunch.
const TRAVEL_PATH = /^\/travel(?:\/|$)/;
const TRAVEL_API_PATH = /^\/api\/travel(?:\/|$)/;
const TRAVEL_ADMIN_API_PATH = /^\/api\/admin\/(?:travel-(?:analytics|revenue|vouchers)|verify-hotel)(?:\/|$)/;
const TRAVEL_CRON_PATH = /^\/api\/cron\/(?:fare-alerts|flight-retry)(?:\/|$)/;
const TRAVEL_CONTENT_PATH = /^\/blog\/(?:category\/muslim-travel|(?:halal-cruises-from-singapore|halal-food-johor-bahru-guide|crossing-to-johor-bahru-checkpoints-transport|umrah-from-singapore-guide))(?:\/|$)/;

// The publication no longer accepts listings, events or paid placements.
// Return a real 410 for retired public URLs so stale profiles and event pages
// are not mistaken for maintained recommendations. Keep editorial and tools
// routes available; administrative and webhook paths remain for wind-down.
const RETIRED_PUBLIC_PATH = /^\/(?:explore|map|halal|halal-food|hawker|business|events|deals|pricing|add-listing|claim|owner|for-business|advertise|host-event|quotes|checkout|success|growth-partner|feature-tiktok|saved|dashboard|login|ask|verify|suggest|report|tickets|passport|scorecard)(?:\/|$)/;
const RETIRED_LANDING_PATH = /^\/(?:halal-food-singapore|halal-food-near-me|best-halal-restaurants-singapore|new-halal-restaurants-singapore|muis-halal-certified-directory|halal-business-directory-singapore|muslim-owned-businesses-singapore|halal-marketing-services)$/;
const RETIRED_API_PATH = /^\/api\/(?:checkout|events|owner|ads|offers|coupons|claims|listing|listings|tickets|submissions|rsvp|passport|connect|leads|concierge|referral)(?:\/|$)/;

// Older standalone guides were built around the directory or expired event
// inventory. Send their existing links to maintained editorial hubs.
const LEGACY_GUIDE_DESTINATIONS: Record<string, string> = {
  "/halal-food-singapore": "/blog/category/restaurants-cafes",
  "/halal-certification-singapore-guide": "/blog/category/halal-basics",
  "/how-to-get-halal-certified-muis": "/blog/category/halal-basics",
  "/muis-halal-certification-explained": "/blog/what-is-halal-singapore",
  "/halal-certification-changes": "/blog/category/halal-basics",
  "/iftar-buka-puasa-singapore": "/blog/category/seasonal-events",
  "/ramadan-bazaar-singapore": "/blog/category/seasonal-events",
  "/hari-raya": "/blog/category/seasonal-events",
  "/hari-raya-catering-singapore": "/blog/category/seasonal-events",
  "/ms/hari-raya": "/blog/category/seasonal-events",
  "/ms/makanan-halal-singapura": "/blog/category/restaurants-cafes",
  "/ms/masjid-singapura": "/mosques",
};

export function legacyGuideRedirect(req: NextRequest): NextResponse | null {
  const destination = LEGACY_GUIDE_DESTINATIONS[req.nextUrl.pathname];
  return destination ? NextResponse.redirect(new URL(destination, req.url), 308) : null;
}

export function retiredFeatureResponse(req: NextRequest): NextResponse | null {
  const path = req.nextUrl.pathname;
  if (RETIRED_API_PATH.test(path)) {
    return NextResponse.json({ ok: false, error: "feature_retired" }, { status: 410 });
  }
  if (!RETIRED_PUBLIC_PATH.test(path) && !RETIRED_LANDING_PATH.test(path)) return null;
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Page retired | Humble Halal</title><style>body{font:18px/1.6 system-ui,sans-serif;background:#f8f6f1;color:#18383c;max-width:700px;margin:12vh auto;padding:24px}h1{font:700 2.4rem Georgia,serif}a{color:#12525b;font-weight:700}</style></head><body><p>Humble Halal</p><h1>This page has been retired.</h1><p>We now focus on practical guides and free tools for Muslim life in Singapore.</p><p><a href="/blog">Read the guides</a> · <a href="/tools">Explore tools</a></p></body></html>`;
  return new NextResponse(html, { status: 410, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=0, s-maxage=86400" } });
}

export function travelDisabledResponse(req: NextRequest): NextResponse | null {
  const path = req.nextUrl.pathname;
  if (!TRAVEL_PATH.test(path) && !TRAVEL_API_PATH.test(path) && !TRAVEL_ADMIN_API_PATH.test(path) && !TRAVEL_CRON_PATH.test(path) && !TRAVEL_CONTENT_PATH.test(path)) {
    return null;
  }
  const headers = { "Cache-Control": "public, max-age=0, s-maxage=86400" };
  if (path.startsWith("/api/")) {
    return NextResponse.json({ ok: false, error: "travel_unavailable" }, { status: 410, headers });
  }
  return new NextResponse("Travel and hotel booking are not currently available.", { status: 410, headers });
}

function unsafeFoodListingResponse(req: NextRequest): NextResponse | null {
  const match = req.nextUrl.pathname.match(/^\/business\/([^/]+)\/?$/);
  if (!match || !isBlockedFoodListing(decodeURIComponent(match[1]))) return null;
  return new NextResponse("This listing has been removed following a halal-safety review.", {
    status: 410,
    headers: { "Cache-Control": "public, max-age=0, s-maxage=86400" },
  });
}

function featureTikTokRedirect(req: NextRequest): NextResponse | null {
  if (!truthy(process.env.TIKTOK_UGC_ENABLED) && req.nextUrl.pathname === "/feature-tiktok") {
    return NextResponse.redirect(new URL("/suggest", req.url));
  }
  return null;
}

// Content routes whose entities can go away (closed business, finished event,
// unpublished post). Gone URLs 301 here — in MIDDLEWARE, because page-level
// redirect()/notFound() degrade to a soft 200 under this app's streaming layout,
// which is useless for SEO. Targets come from the `redirects` table (populated at
// suspend/cancel time + self-healed by the routes) via a 60s-cached in-memory map,
// so a live request costs only a Map.get.
const REDIRECTABLE = /^\/(business|events|blog)\//;

async function goneRedirect(req: NextRequest): Promise<NextResponse | null> {
  const { pathname } = req.nextUrl;
  if (!REDIRECTABLE.test(pathname)) return null;
  const to = await redirectFor(pathname);
  if (to && to !== pathname) return NextResponse.redirect(new URL(to, req.url), 308);
  return null;
}

// clerkMiddleware() runs a server-side handshake against the Clerk instance, which
// needs a real backend (CLERK_SECRET_KEY). When it's absent — CI e2e, local dev
// without keys — running it rejects every request with "Invalid host". Prod always
// sets the secret, so this guard is a no-op there; without it we pass requests
// through untouched. The /admin page still re-checks the admin role server-side,
// so guest-vs-admin protection is not weakened.
const clerkEnabled = !!process.env.CLERK_SECRET_KEY;

export function protectedRouteRedirect(req: NextRequest, userId: string | null | undefined): NextResponse | null {
  if (!isProtected(req) || userId) return null;
  const destination = new URL("/login", req.url);
  destination.searchParams.set("next", `${req.nextUrl.pathname}${req.nextUrl.search}`);
  return NextResponse.redirect(destination);
}

export default clerkEnabled
  ? clerkMiddleware(async (auth, req) => {
      const travelDisabled = travelDisabledResponse(req);
      if (travelDisabled) return travelDisabled;
      const retired = retiredFeatureResponse(req);
      if (retired) return retired;
      const legacy = legacyGuideRedirect(req);
      if (legacy) return legacy;
      const blocked = unsafeFoodListingResponse(req);
      if (blocked) return blocked;
      const redirect = featureTikTokRedirect(req);
      if (redirect) return redirect;
      const gone = await goneRedirect(req);
      if (gone) return gone;
      if (isProtected(req)) {
        const { userId } = await auth();
        const signIn = protectedRouteRedirect(req, userId);
        if (signIn) return signIn;
      }
    })
  : async function proxy(req: NextRequest) {
      return (
        travelDisabledResponse(req) ??
        retiredFeatureResponse(req) ??
        legacyGuideRedirect(req) ??
        unsafeFoodListingResponse(req) ??
        featureTikTokRedirect(req) ??
        (await goneRedirect(req)) ??
        NextResponse.next()
      );
    };

export const config = {
  matcher: [
    // Skip Next internals and static files unless found in search params; always run on API/trpc.
    "/((?!_next|.well-known/workflow/|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
