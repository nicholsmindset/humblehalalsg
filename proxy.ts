import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

/* Next.js 16: "proxy" is the renamed "middleware" file convention. Clerk's
   clerkMiddleware() runs here so auth() is populated downstream. Do NOT set a
   `runtime` key (Next 16 throws); proxy defaults to the Node.js runtime, which
   Clerk supports. Only one proxy function is allowed per file. */

// Only the admin console is gated at the middleware layer (redirects anonymous to
// sign-in; the page also re-checks the admin role). EVERY API route already does
// its own auth() / requireAdmin() check, so we must NOT blanket-protect /api/* here
// — doing so 404s public, guest-facing flows (travel & event browsing, guest
// checkout, autocomplete). Public/self-authenticating routes (travel search/book,
// events browsing, Stripe/Svix/cron webhooks) therefore stay open at this layer
// and enforce auth where needed inside each handler.
const isProtected = createRouteMatcher(["/admin(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtected(req)) await auth.protect();
});

export const config = {
  matcher: [
    // Skip Next internals and static files unless found in search params; always run on API/trpc.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
