"use client";

import { Suspense } from "react";
import { AppProvider } from "./app-context";

export function AppProviders({ children, ramadanModeEnabled = false }: { children: React.ReactNode; ramadanModeEnabled?: boolean }) {
  // AppProvider reads useSearchParams(), which requires a Suspense boundary.
  return (
    <Suspense fallback={null}>
      <AppProvider ramadanModeEnabled={ramadanModeEnabled}>{children}</AppProvider>
    </Suspense>
  );
}
