"use client";

/* Site-wide newsletter capture popup.
   Triggers once per visitor (localStorage): exit-intent on desktop, or 50% scroll
   / 25s dwell on touch. Suppressed on conversion/admin paths and after dismissal
   or signup. Reuses the .modal-veil / .modal chrome + useDialog (ESC + click-out). */

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Icon, useBodyScrollLock, useDialog } from "./ui";
import { Newsletter } from "./newsletter";
import { claimPopupSession, isLeadPopupMounted, popupSessionTaken } from "./lead-capture/popup-guard";

const STORE_KEY = "hh_nl_popup"; // "dismissed" | "subscribed"
const DWELL_MS = 25_000;
const SCROLL_FRACTION = 0.5;
// Don't let the scroll trigger fire on the very first flick: on a short page 50%
// is reached in ~1 tick, so the popup could appear within a second of landing.
// Arm the scroll trigger only after the visitor has actually dwelled a little.
const SCROLL_ARM_MS = 6_000;

// Don't interrupt high-intent / non-consumer flows.
const SUPPRESS_PREFIXES = ["/advertise", "/subscribe", "/checkout", "/owner", "/admin", "/host-event"];

function alreadyHandled(): boolean {
  try {
    return !!window.localStorage.getItem(STORE_KEY);
  } catch {
    return false;
  }
}

function mark(value: "dismissed" | "subscribed") {
  try {
    window.localStorage.setItem(STORE_KEY, value);
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

  const close = () => {
    setOpen(false);
    mark("dismissed");
  };
  useDialog(ref, close);
  useBodyScrollLock(open);

  useEffect(() => {
    if (suppressed || alreadyHandled() || shownRef.current) return;

    const trigger = () => {
      if (shownRef.current || alreadyHandled()) return;
      // Popup coordination (owner subtlety rule): yield entirely on pages
      // where the lead-capture popup is mounted, and never show if any popup
      // has already used this session's one-popup slot.
      if (isLeadPopupMounted() || popupSessionTaken()) return;
      if (!claimPopupSession("newsletter")) return;
      shownRef.current = true;
      setOpen(true);
      cleanup();
    };

    const onMouseOut = (e: MouseEvent) => {
      // exit-intent: cursor leaves through the top of the viewport
      if (e.clientY <= 0 && !e.relatedTarget) trigger();
    };
    const armedAt = Date.now();
    const onScroll = () => {
      if (Date.now() - armedAt < SCROLL_ARM_MS) return; // ignore the first-flick scroll
      const scrolled = window.scrollY + window.innerHeight;
      const full = document.documentElement.scrollHeight;
      if (full > 0 && scrolled / full >= SCROLL_FRACTION) trigger();
    };

    const timer = window.setTimeout(trigger, DWELL_MS);
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
        if ((e.target as HTMLElement).classList.contains("modal-veil")) close();
      }}
    >
      <div className="modal nl-popup" ref={ref} role="dialog" aria-modal="true" aria-label="Join the Humble Halal newsletter">
        <div className="onboard-head">
          <span className="eyebrow">🌙 Free weekly guide</span>
          <button className="btn btn-ghost btn-sm" style={{ padding: 8 }} onClick={close} aria-label="Close">
            <Icon name="x" size={18} />
          </button>
        </div>
        <h2 style={{ fontSize: "1.5rem", marginTop: 6 }}>Never miss a new halal spot</h2>
        <p className="muted" style={{ marginTop: 8 }}>
          Join HumbleHalal — MUIS-verified food finds, mosque events &amp; deals across Singapore,
          every week. Subscribe and we&apos;ll send you the <strong>Ultimate Halal Food Guide by MRT
          Station</strong> (free).
        </p>
        <div style={{ marginTop: 16 }}>
          <Newsletter source="popup" collectName cta="Send me the guide" />
        </div>
      </div>
    </div>
  );
}
