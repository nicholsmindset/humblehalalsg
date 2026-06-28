import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

/* Next.js 16: "proxy" is the renamed "middleware" file convention. Clerk's
   clerkMiddleware() runs here so auth() is populated downstream. Do NOT set a
   `runtime` key (Next 16 throws); proxy defaults to the Node.js runtime, which
   Clerk supports. Only one proxy function is allowed per file. */

// Routes that require a signed-in user. Everything else stays public — including
// the self-authenticating endpoints (Stripe signature, Svix, CRON_SECRET):
//   /api/webhooks/stripe, /api/webhooks/clerk, /api/cron/* are deliberately omitted.
const isProtected = createRouteMatcher([
  "/admin(.*)",
  "/owner(.*)",
  "/dashboard(.*)",
  "/saved(.*)",
  "/api/admin/(.*)",
  "/api/owner/(.*)",
  "/api/events/(.*)",
  "/api/tickets/(.*)",
  "/api/travel/(.*)",
  "/api/connect/(.*)",
  "/api/checkout/(.*)",
  "/api/follow",
  "/api/settings",
  "/api/user/(.*)",
  "/api/portal",
  "/api/refunds",
  "/api/confirm",
]);

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
