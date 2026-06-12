import type { Metadata, Viewport } from "next";
import {
  Spectral,
  Hanken_Grotesk,
  Cormorant_Garamond,
  Libre_Caslon_Text,
  Newsreader,
} from "next/font/google";
import "../styles/styles.css";
import "../styles/screens.css";
import "../styles/screens2.css";
import "../styles/moat.css";
import "../styles/events.css";
import { AppProviders } from "@/components/providers";
import { AppShell } from "@/components/app-shell";
import { SITE } from "@/lib/seo";
import { allSeoPages } from "@/lib/seo-pages";
import { categories } from "@/lib/data-lite";
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
  maximumScale: 5,
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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Computed server-side so the footer's crawlable category links don't drag
  // the full listings dataset into the client bundle.
  const seoCategoryLinks = allSeoPages()
    .filter((p) => p.catId && !p.areaId)
    .map((p) => ({
      slug: p.slug,
      label: categories.find((c) => c.id === p.catId)?.label || p.catId!,
    }));

  return (
    <html lang="en" className={fontVars}>
      <body>
        <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
        <AppProviders>
          <AppShell seoCategoryLinks={seoCategoryLinks}>{children}</AppShell>
        </AppProviders>
      </body>
    </html>
  );
}
