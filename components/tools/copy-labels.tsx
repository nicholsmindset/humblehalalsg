"use client";

/* Small client island: "Copy label names" for the ingredient detail page.
   The label list is fully server-rendered next to this button (crawlable); this
   only adds a one-tap copy affordance. Progressive enhancement — the page is
   complete without it. */

import { useState } from "react";
import { Icon } from "../ui";

export function CopyLabels({ labels }: { labels: string[] }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(labels.join(", "));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — the names are visible on the page regardless */
    }
  }

  return (
    <button type="button" className="ingd-copy" onClick={copy} aria-live="polite">
      <Icon name={copied ? "check" : "doc"} size={15} />
      {copied ? "Copied" : "Copy label names"}
    </button>
  );
}
