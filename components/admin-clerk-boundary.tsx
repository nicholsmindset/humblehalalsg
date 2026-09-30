"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

const ClerkProvider = dynamic(() => import("@clerk/nextjs").then((module) => module.ClerkProvider), { ssr: false });

/** Keep Clerk's client bundle and setup UI off the public publication. */
export function AdminClerkBoundary({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (!pathname.startsWith("/admin")) return <>{children}</>;
  return <ClerkProvider afterSignOutUrl="/" appearance={{ variables: { colorPrimary: "#12525B" } }}>{children}</ClerkProvider>;
}
