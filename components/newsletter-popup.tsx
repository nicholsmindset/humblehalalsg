"use client";

/* Site-wide newsletter capture popup.
   Triggers on exit-intent, 50% scroll or 30s dwell. A dismissal starts a 14-day
   cooldown; a signup suppresses it permanently. Also suppressed on conversion /
   admin paths. Reuses the modal chrome + useDialog (ESC + click-out). */

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Icon, useBodyScrollLock, useDialog } from "./ui";
import { Newsletter } from "./newsletter";
import { claimPopupSession, isLeadPopupMounted, popupSessionTaken } from "./lead-capture/popup-guard";
import { track } from "@/lib/analytics";
import { newsletterPopupHandled, newsletterPopupStoreValue } from "@/lib/newsletter-popup";

const STORE_KEY = "hh_nl_popup"; // "dismissed:<timestamp>" | "subscribed"
const POPUP_SOURCE = "weekend-planner:popup";
const DWELL_MS = 30_000;
const SCROLL_FRACTION = 0.5;
// Don't let the scroll trigger fire on the very first flick: on a short page 50%
// is reached in ~1 tick, so the popup could appear within a second of landing.
// Arm the scroll trigger only after the visitor has actually dwelled a little.
const SCROLL_ARM_MS = 6_000;

// Don't interrupt high-intent / non-consumer flows.
const SUPPRESS_PREFIXES = ["/advertise", "/subscribe", "/checkout", "/owner", "/admin", "/host-event"];

function alreadyHandled(): boolean {
  try {
    return newsletterPopupHandled(window.localStorage.getItem(STORE_KEY));
  } catch {
    return false;
  }
}

function mark(value: "dismissed" | "subscribed") {
  try {
    window.localStorage.setItem(STORE_KEY, newsletterPopupStoreValue(value));
  } catch {
    /* private mode — popup simply re-eligible next session */
  }
}

export function NewsletterPopup() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const shownRef = useRef(false);

  const suppressed = SUPPRESS_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));

  const close = useCallback((reason: "close_button" | "backdrop" | "escape") => {
    setOpen(false);
    mark("dismissed");
    track.newsletterPopupDismiss(POPUP_SOURCE, reason);
  }, []);
  const closeFromEscape = useCallback(() => close("escape"), [close]);
  useDialog(ref, closeFromEscape, open);
  useBodyScrollLock(open);

  useEffect(() => {
    if (suppressed || alreadyHandled() || shownRef.current) return;

    const trigger = (reason: "dwell" | "scroll" | "exit_intent") => {
      if (shownRef.current || alreadyHandled()) return;
      // Popup coordination (owner subtlety rule): yield entirely on pages
      // where the lead-capture popup is mounted, and never show if any popup
      // has already used this session's one-popup slot.
      if (isLeadPopupMounted() || popupSessionTaken()) return;
      if (!claimPopupSession("newsletter")) return;
      shownRef.current = true;
      setOpen(true);
      track.newsletterPopupView(POPUP_SOURCE, reason);
      cleanup();
    };

    const onMouseOut = (e: MouseEvent) => {
      // exit-intent: cursor leaves through the top of the viewport
      if (e.clientY <= 0 && !e.relatedTarget) trigger("exit_intent");
    };
    const armedAt = Date.now();
    const onScroll = () => {
      if (Date.now() - armedAt < SCROLL_ARM_MS) return; // ignore the first-flick scroll
      const scrolled = window.scrollY + window.innerHeight;
      const full = document.documentElement.scrollHeight;
      if (full > 0 && scrolled / full >= SCROLL_FRACTION) trigger("scroll");
    };

    const timer = window.setTimeout(() => trigger("dwell"), DWELL_MS);
    document.addEventListener("mouseout", onMouseOut);
    window.addEventListener("scroll", onScroll, { passive: true });

    function cleanup() {
      window.clearTimeout(timer);
      document.removeEventListener("mouseout", onMouseOut);
      window.removeEventListener("scroll", onScroll);
    }
    return cleanup;
  }, [suppressed]);

  // When the user subscribes inside the popup, persist so it never reappears.
  useEffect(() => {
    if (!open) return;
    const el = ref.current;
    if (!el) return;
    const obs = new MutationObserver(() => {
      if (el.querySelector(".newsletter-done")) mark("subscribed");
    });
    obs.observe(el, { childList: true, subtree: true });
    return () => obs.disconnect();
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="modal-veil"
      onClick={(e) => {
        if ((e.target as HTMLElement).classList.contains("modal-veil")) close("backdrop");
      }}
    >
      <div className="modal nl-popup" ref={ref} role="dialog" aria-modal="true" aria-label="Join the Humble Halal newsletter">
        <div className="onboard-head">
          <span className="eyebrow">🌙 Free weekly guide</span>
          <button className="btn btn-ghost btn-sm" style={{ padding: 8 }} onClick={() => close("close_button")} aria-label="Close">
            <Icon name="x" size={18} />
          </button>
        </div>
        <h2 style={{ fontSize: "1.5rem", marginTop: 6 }}>Plan your halal weekend in 10 minutes</h2>
        <p className="muted" style={{ marginTop: 8 }}>
          Get the free reusable worksheet for choosing one meal, placing prayer into your route and
          adding one meaningful stop. We&apos;ll also send one useful Friday email.
        </p>
        <div style={{ marginTop: 16 }}>
          <Newsletter
            source={POPUP_SOURCE}
            cta="Email me the planner"
            successHref="/guides/halal-weekend-planner-singapore.pdf"
            successCta="Open the planner now"
          />
        </div>
      </div>
    </div>
  );
}
