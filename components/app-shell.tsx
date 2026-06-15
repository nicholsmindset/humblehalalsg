"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { pathToScreen, CHROMELESS_SCREENS } from "@/lib/routes";
import { useApp } from "./app-context";
import { BottomNav, Footer, MobileBar, Onboarding, PrayerStrip, TopNav } from "./chrome";
import { HHTweaks } from "./tweaks-panel";
import { Toast } from "./ui";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { state, toastMsg } = useApp();
  const [prayerOpen, setPrayerOpen] = useState(false);

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
      {state.hydrated && !state.prefs.onboarded && <Onboarding />}
      <HHTweaks />
    </div>
  );
}
