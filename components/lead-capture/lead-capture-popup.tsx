"use client";

/* Vertical lead-capture popup (leads growth loop, PR-C).
   Mounted ONLY by vertical content pages (guide pages / vertical blog posts) —
   never site-wide. Mirrors the newsletter popup's triggers (exit-intent,
   50% scroll, dwell) and once-per-visitor localStorage, but coordinates via
   popup-guard so at most ONE popup ever shows per session site-wide, with
   this one outranking the newsletter popup on the pages where it's mounted.
   Flag-gated client-side (surface "popup"); fail-closed. */

import { useEffect, useRef, useState } from "react";
import { Icon, useBodyScrollLock, useDialog } from "../ui";
import { LeadInline, useLeadCaptureConfig } from "./lead-inline";
import { claimPopupSession, setLeadPopupMounted } from "./popup-guard";
import { LEAD_VERTICALS } from "@/lib/lead-verticals";

const STORE_KEY = "hh_lead_popup"; // "dismissed" | "submitted"
const DWELL_MS = 30_000;
const SCROLL_FRACTION = 0.5;

function alreadyHandled(): boolean {
  try { return !!window.localStorage.getItem(STORE_KEY); } catch { return false; }
}
function mark(value: "dismissed" | "submitted") {
  try { window.localStorage.setItem(STORE_KEY, value); } catch { /* private mode */ }
}

export function LeadCapturePopup({ vertical }: { vertical: string }) {
  const enabled = useLeadCaptureConfig("popup");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const shownRef = useRef(false);

  const close = () => { setOpen(false); mark("dismissed"); };
  useDialog(ref, close);
  useBodyScrollLock(open);

  // Announce mount so the newsletter popup yields on this page — even before
  // the config resolves (yield-first keeps the one-popup promise airtight).
  useEffect(() => {
    setLeadPopupMounted(true);
    return () => setLeadPopupMounted(false);
  }, []);

  useEffect(() => {
    if (!enabled || alreadyHandled() || shownRef.current) return;

    const trigger = () => {
      if (shownRef.current || alreadyHandled()) return;
      if (!claimPopupSession("lead")) return; // another popup already showed this session
      shownRef.current = true;
      setOpen(true);
      cleanup();
    };

    const onMouseOut = (e: MouseEvent) => {
      if (e.clientY <= 0 && !e.relatedTarget) trigger();
    };
    const onScroll = () => {
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
  }, [enabled]);

  const v = LEAD_VERTICALS.find((x) => x.id === vertical);
  if (!open || !v) return null;

  return (
    <div
      className="modal-veil"
      onClick={(e) => {
        if ((e.target as HTMLElement).classList.contains("modal-veil")) close();
      }}
    >
      <div className="modal nl-popup" ref={ref} role="dialog" aria-modal="true" aria-label={`Get free quotes from halal ${v.label.toLowerCase()} vendors`}>
        <div className="onboard-head">
          <span className="eyebrow">💬 Free, no obligation</span>
          <button className="btn btn-ghost btn-sm" style={{ padding: 8 }} onClick={close} aria-label="Close">
            <Icon name="x" size={18} />
          </button>
        </div>
        <h2 style={{ fontSize: "1.4rem", marginTop: 6 }}>Get free quotes from trusted halal vendors</h2>
        <p className="muted" style={{ marginTop: 8, fontSize: ".92rem" }}>
          Tell us what you need once — matching {v.label.toLowerCase()} vendors reply to you directly.
        </p>
        <div style={{ marginTop: 12 }}>
          <LeadInline vertical={vertical} surface="popup" defaultOpen onDone={() => mark("submitted")} />
        </div>
      </div>
    </div>
  );
}
