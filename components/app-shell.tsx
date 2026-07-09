"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { pathToScreen, CHROMELESS_SCREENS } from "@/lib/routes";
import { useApp } from "./app-context";
import { BottomNav, Footer, MobileBar, Onboarding, PrayerStrip, TopNav } from "./chrome";
import { NewsletterPopup } from "./newsletter-popup";
import { HHTweaks } from "./tweaks-panel";
import { Toast } from "./ui";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { state, toastMsg } = useApp();
  const [prayerOpen, setPrayerOpen] = useState(false);
  // Don't stack the onboarding modal on top of the cookie banner (both used to
  // appear together on first load). Wait until a consent choice exists, polling
  // briefly — the banner writes hh_consent_v1 on any of its three buttons.
  const [consentDecided, setConsentDecided] = useState(false);
  useEffect(() => {
    const check = () => {
      try { if (localStorage.getItem("hh_consent_v1")) { setConsentDecided(true); return true; } } catch { /* SSR/private mode */ }
      return false;
    };
    if (check()) return;
    const id = window.setInterval(() => { if (check()) window.clearInterval(id); }, 800);
    return () => window.clearInterval(id);
  }, []);

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
      {/* Onboarding is a blocking modal — only show it on the home page so it
          never covers a task page (e.g. /travel/flights) a user lands on
          directly, and only AFTER the cookie banner is answered (no stacking). */}
      {state.hydrated && consentDecided && !state.prefs.onboarded && screen === "home" && <Onboarding />}
      {state.hydrated && state.prefs.onboarded && !isChromeless && <NewsletterPopup />}
      <HHTweaks />
    </div>
  );
}
