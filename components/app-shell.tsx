"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { pathToScreen, CHROMELESS_SCREENS } from "@/lib/routes";
import { useApp } from "./app-context";
import { BottomNav, Footer, MobileBar, PrayerStrip, TopNav } from "./chrome";
import { NewsletterPopup } from "./newsletter-popup";
import { HHTweaks } from "./tweaks-panel";
import { Toast } from "./ui";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { state, toastMsg } = useApp();
  const [prayerOpen, setPrayerOpen] = useState(false);

  // Keystatic supplies its own full-screen application shell. Rendering the
  // consumer header/footer around it squeezes the editor and exposes unrelated
  // navigation inside the admin dashboard.
  if (pathname.startsWith("/keystatic")) return <>{children}</>;

  const screen = pathToScreen(pathname);
  const isChromeless = CHROMELESS_SCREENS.includes(screen);
  const isMapFull = screen === "map";
  const showPrayerStrip = !isChromeless;

  return (
    <div className="hh-app">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      {!isChromeless && <TopNav />}
      {!isChromeless && <MobileBar />}
      {showPrayerStrip && <PrayerStrip open={prayerOpen} setOpen={setPrayerOpen} />}
      <main
        id="main-content"
        className="hh-main"
        style={isMapFull ? { overflow: "hidden" } : undefined}
      >
        {children}
      </main>
      {!isChromeless && <BottomNav />}
      {!isChromeless && !isMapFull && <Footer />}
      <Toast msg={toastMsg} />
      {state.hydrated && state.prefs.onboarded && !isChromeless && <NewsletterPopup />}
      <HHTweaks />
    </div>
  );
}
