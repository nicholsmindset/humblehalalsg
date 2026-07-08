"use client";

import { Suspense } from "react";
import { AppProvider } from "./app-context";
import type { Flags } from "@/lib/flags";

export function AppProviders({ children, ramadanModeEnabled = false, serverFlags }: { children: React.ReactNode; ramadanModeEnabled?: boolean; serverFlags?: Partial<Flags> }) {
  // AppProvider reads useSearchParams(), which requires a Suspense boundary.
  return (
    <Suspense fallback={null}>
      <AppProvider ramadanModeEnabled={ramadanModeEnabled} serverFlags={serverFlags}>{children}</AppProvider>
    </Suspense>
  );
}
