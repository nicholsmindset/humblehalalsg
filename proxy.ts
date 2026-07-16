import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";
import { isBlockedFoodListing } from "@/lib/listing-safety";

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

// clerkMiddleware() runs a server-side handshake against the Clerk instance, which
// needs a real backend (CLERK_SECRET_KEY). When it's absent — CI e2e, local dev
// without keys — running it rejects every request with "Invalid host". Prod always
// sets the secret, so this guard is a no-op there; without it we pass requests
// through untouched. The /admin page still re-checks the admin role server-side,
// so guest-vs-admin protection is not weakened.
const clerkEnabled = !!process.env.CLERK_SECRET_KEY;

export default clerkEnabled
  ? clerkMiddleware(async (auth, req) => {
      const blocked = unsafeFoodListingResponse(req);
      if (blocked) return blocked;
      const redirect = featureTikTokRedirect(req);
      if (redirect) return redirect;
      if (isProtected(req)) await auth.protect();
    })
  : function proxy(req: NextRequest) {
      return unsafeFoodListingResponse(req) ?? featureTikTokRedirect(req) ?? NextResponse.next();
    };

export const config = {
  matcher: [
    // Skip Next internals and static files unless found in search params; always run on API/trpc.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
