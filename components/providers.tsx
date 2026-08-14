"use client";

import { AppProvider } from "./app-context";
import type { Flags } from "@/lib/flags";

export function AppProviders({ children, ramadanModeEnabled = false, serverFlags }: { children: React.ReactNode; ramadanModeEnabled?: boolean; serverFlags?: Partial<Flags> }) {
  // SearchParamsBridge owns the narrow Suspense boundary it needs inside
  // AppProvider. Wrapping the entire app can blank server-rendered content when
  // any descendant suspends during a static render.
  return <AppProvider ramadanModeEnabled={ramadanModeEnabled} serverFlags={serverFlags}>{children}</AppProvider>;
}
