"use client";

/* Dismissible "what is this / how it works" callout for a dashboard tab.
   Content comes from lib/help-content (shared with /faq). Renders nothing when
   the feature has a flag that's off. Dismissal is remembered per-key in
   localStorage; the HelpReopen "?" control clears it and re-shows the callout. */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "./ui";
import { useApp } from "./app-context";
import { helpByKey } from "@/lib/help-content";

const LS_KEY = "hh_help_dismissed";
const REOPEN_EVENT = "hh-help-reopen";

function readDismissed(): string[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); } catch { return []; }
}
function writeDismissed(keys: string[]) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(keys)); } catch { /* ignore */ }
}

export function HelpCallout({ feature }: { feature: string }) {
  const { flags } = useApp();
  const h = helpByKey(feature);
  const [dismissed, setDismissed] = useState(true); // hidden until we read LS (avoids flash)

  useEffect(() => {
    const sync = () => setDismissed(readDismissed().includes(feature));
    sync();
    window.addEventListener(REOPEN_EVENT, sync);
    return () => window.removeEventListener(REOPEN_EVENT, sync);
  }, [feature]);

  if (!h) return null;
  if (h.flag && !flags?.[h.flag]) return null;
  if (dismissed) return null;

  const dismiss = () => {
    writeDismissed(Array.from(new Set([...readDismissed(), feature])));
    setDismissed(true);
  };

  return (
    <div className="help-callout" role="note">
      <div className="help-callout-body">
        <div className="help-callout-title"><Icon name="info" size={16} /> {h.label}</div>
        <p className="help-callout-what">{h.what}</p>
        <details className="help-callout-how">
          <summary>How it works</summary>
          <ol>{h.how.map((s, i) => <li key={i}>{s}</li>)}</ol>
          {h.faqs.length > 0 && <Link className="help-callout-more" href={`/faq#${h.key}`}>More in the FAQ →</Link>}
        </details>
      </div>
      <button className="help-callout-x" onClick={dismiss} aria-label={`Dismiss ${h.label} help`}><Icon name="x" size={16} /></button>
    </div>
  );
}

/** Small "?" control (for a tab header) that re-opens a dismissed callout. */
export function HelpReopen({ feature }: { feature: string }) {
  const h = helpByKey(feature);
  if (!h) return null;
  const reopen = () => {
    writeDismissed(readDismissed().filter((k) => k !== feature));
    window.dispatchEvent(new Event(REOPEN_EVENT));
  };
  return <button className="help-reopen" onClick={reopen} aria-label={`Show ${h.label} help`}><Icon name="info" size={15} /></button>;
}
