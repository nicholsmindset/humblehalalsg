"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

const ClerkProvider = dynamic(() => import("@clerk/nextjs").then((module) => module.ClerkProvider), { ssr: false });

// Legacy routes still render at build time even though Proxy retires them for
// visitors. They retain their auth context until their source pages are removed.
const EDITORIAL_PATH = /^\/(?:blog|tools|mosques|prayer-rooms|is-halal|about|contact|faq|guides|disclaimer|terms|privacy|pdpa|cookies|accessibility|subscribe)(?:\/|$)/;

/** Keep Clerk's client bundle and setup UI off the public publication. */
export function AdminClerkBoundary({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/" || EDITORIAL_PATH.test(pathname)) return <>{children}</>;
  return <ClerkProvider afterSignOutUrl="/" appearance={{ variables: { colorPrimary: "#12525B" } }}>{children}</ClerkProvider>;
}
