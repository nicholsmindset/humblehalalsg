import type { Metadata, Viewport } from "next";
import {
  Spectral,
  Hanken_Grotesk,
  Cormorant_Garamond,
  Libre_Caslon_Text,
  Newsreader,
} from "next/font/google";
import "../styles/styles.css";
import "../styles/ota.css";
import "../styles/screens.css";
import "../styles/screens2.css";
import "../styles/moat.css";
import "../styles/events.css";
import "../styles/travel.css";
import "../styles/tools.css";
import "../styles/mobile.css";
import "../styles/mobile-a11y.css";
import { ClerkProvider } from "@clerk/nextjs";
import { AppProviders } from "@/components/providers";
import { AppShell } from "@/components/app-shell";
import { CookieConsent } from "@/components/cookie-consent";
import { AnalyticsPageView } from "@/components/analytics/page-view";
import { DirectoryProvider } from "@/components/directory-context";
import { getDirectory } from "@/lib/directory";
import { EventsProvider } from "@/components/events-context";
import { getEvents } from "@/lib/events-source";
import { getRamadanMode } from "@/lib/platform";
import { SITE } from "@/lib/seo";
import {
  JsonLd,
  organizationJsonLd,
  websiteJsonLd,
} from "@/components/seo/json-ld";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: [
    "halal Singapore",
    "halal food",
    "Muslim-owned business",
    "MUIS certified",
    "halal restaurants",
    "halal directory",
    "halal near me",
  ],
  alternates: {
    canonical: "/",
    languages: { "en-SG": "/", "x-default": "/" },
  },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    url: SITE.url,
    locale: SITE.locale,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
  },
  appleWebApp: { capable: true, statusBarStyle: "default", title: SITE.name },
};

export const viewport: Viewport = {
  themeColor: "#0F5C4A",
  width: "device-width",
  initialScale: 1,
  // No maximumScale/user-scalable lock — pinch-zoom must stay enabled (WCAG 1.4.4).
  // viewport-fit=cover lets safe-area-inset env() padding work on notched devices.
  viewportFit: "cover",
};

/* Self-hosted via next/font (no render-blocking <link>). Exposed as CSS
   variables so styles.css tokens + the tweaks-panel font swap resolve. */
const spectral = Spectral({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
  variable: "--font-spectral",
  display: "swap",
});
const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-hanken",
  display: "swap",
});
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});
const libreCaslon = Libre_Caslon_Text({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-libre",
  display: "swap",
});
const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-newsreader",
  display: "swap",
});

const fontVars = [spectral, hanken, cormorant, libreCaslon, newsreader]
  .map((f) => f.variable)
  .join(" ");

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Directory snapshot — Supabase when configured, else the mock seed (keeps
  // static rendering when there are no keys, so no regression).
  // Independent reads — run in parallel to cut server-render TTFB.
  const [directory, events, ramadanMode] = await Promise.all([getDirectory(), getEvents(), getRamadanMode()]);
  return (
    <html lang="en" className={fontVars}>
      <body>
        <ClerkProvider appearance={{ variables: { colorPrimary: "#0F5C4A" } }}>
          <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
          <AppProviders ramadanModeEnabled={ramadanMode}>
            <DirectoryProvider listings={directory}>
              <EventsProvider events={events}>
                <AppShell>{children}</AppShell>
              </EventsProvider>
            </DirectoryProvider>
          </AppProviders>
          <CookieConsent />
          <AnalyticsPageView />
        </ClerkProvider>
      </body>
    </html>
  );
}
