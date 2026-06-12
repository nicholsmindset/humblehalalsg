"use client";

import { Suspense } from "react";
import { AppProvider } from "./app-context";

export function AppProviders({ children }: { children: React.ReactNode }) {
  // AppProvider reads useSearchParams(), which requires a Suspense boundary.
  return (
    <Suspense fallback={null}>
      <AppProvider>{children}</AppProvider>
    </Suspense>
  );
}
