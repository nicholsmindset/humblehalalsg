/* Maps the prototype's screen names <-> real Next.js URL paths so ported
   screens can keep calling navigate('detail', { id }). */
import { slugForListing, slugForEvent } from "./data";

export type ScreenName =
  | "home" | "explore" | "map" | "detail"
  | "for-business" | "pricing" | "add-listing" | "owner-dashboard" | "admin" | "advertise"
  | "login" | "user-dashboard" | "suggest" | "claim" | "report" | "request-quote"
  | "mosques" | "verify" | "disclaimer" | "seo" | "404" | "success"
  | "events" | "event-detail" | "checkout" | "host-event" | "is-halal" | "blog" | "saved"
  | "travel" | "travel-city" | "travel-hotel" | "travel-booking" | "travel-trips" | "travel-flights";

export type Params = Record<string, unknown>;

/** Base path for screens whose params (if any) go in the query string. */
const BASE_PATH: Record<string, string> = {
  home: "/",
  explore: "/explore",
  map: "/map",
  "for-business": "/for-business",
  advertise: "/advertise",
  pricing: "/pricing",
  "add-listing": "/add-listing",
  "owner-dashboard": "/owner",
  admin: "/admin",
  login: "/login",
  "user-dashboard": "/dashboard",
  suggest: "/suggest",
  claim: "/claim",
  report: "/report",
  "request-quote": "/quotes",
  mosques: "/mosques",
  "is-halal": "/is-halal",
  travel: "/travel",
  "travel-booking": "/travel/booking",
  "travel-trips": "/travel/trips",
  "travel-flights": "/travel/flights",
  blog: "/blog",
  saved: "/saved",
  verify: "/verify",
  disclaimer: "/disclaimer",
  "404": "/404",
  success: "/success",
  events: "/events",
  checkout: "/checkout",
  "host-event": "/host-event",
};

const DEFAULT_SEO_SLUG = "halal-food-in-tampines";

function qs(params: Params, omit: string[] = []): string {
  const entries = Object.entries(params).filter(
    ([k, v]) => v != null && v !== "" && !omit.includes(k),
  );
  if (!entries.length) return "";
  const sp = new URLSearchParams();
  entries.forEach(([k, v]) => sp.set(k, String(v)));
  return "?" + sp.toString();
}

export function screenToPath(screen: string, params: Params = {}): string {
  switch (screen) {
    case "detail":
      return `/business/${slugForListing(String(params.id ?? ""))}${qs(params, ["id"])}`;
    case "event-detail":
      return `/events/${slugForEvent(String(params.id ?? ""))}${qs(params, ["id"])}`;
    case "seo":
      return `/halal/${String(params.slug ?? DEFAULT_SEO_SLUG)}${qs(params, ["slug"])}`;
    case "travel-city":
      return `/travel/${String(params.city ?? "")}${qs(params, ["city"])}`;
    case "travel-hotel":
      return `/travel/hotel/${String(params.id ?? "")}${qs(params, ["id"])}`;
    default: {
      const base = BASE_PATH[screen] ?? "/";
      return `${base}${qs(params)}`;
    }
  }
}

/** Resolve a pathname back to a screen name (used for nav highlighting/chrome). */
export function pathToScreen(pathname: string): ScreenName {
  if (pathname === "/") return "home";
  if (pathname.startsWith("/business")) return "detail";
  if (pathname.startsWith("/events/")) return "event-detail";
  if (pathname === "/events") return "events";
  if (pathname.startsWith("/halal")) return "seo";
  if (pathname.startsWith("/travel/hotel")) return "travel-hotel";
  if (pathname.startsWith("/travel/booking")) return "travel-booking";
  if (pathname.startsWith("/travel/trips")) return "travel-trips";
  if (pathname.startsWith("/travel/flights")) return "travel-flights";
  if (pathname === "/travel") return "travel";
  if (pathname.startsWith("/travel/")) return "travel-city";
  if (pathname.startsWith("/owner")) return "owner-dashboard";
  if (pathname.startsWith("/dashboard")) return "user-dashboard";
  const hit = Object.entries(BASE_PATH).find(
    ([, p]) => p !== "/" && pathname.startsWith(p),
  );
  return (hit?.[0] as ScreenName) ?? "home";
}

export const CHROMELESS_SCREENS: ScreenName[] = ["login", "admin"];
