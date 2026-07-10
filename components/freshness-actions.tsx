"use client";

import { useState } from "react";
import { Icon } from "./ui";

/* Community freshness one-tap. "Still here" and "Report closed" keep listings
   fresh — anonymous, no login. Posts to /api/freshness (rate-limited). Pairs with
   the existing "Confirm it's halal" button in the verification card. */
export function FreshnessActions({ businessId, lastVerifiedAgo, bare = false }: { businessId: string; lastVerifiedAgo?: string; bare?: boolean }) {
  const [done, setDone] = useState<"" | "here" | "closed">("");
  const [busy, setBusy] = useState(false);

  const ping = async (state: "here" | "closed") => {
    if (busy || done) return;
    setBusy(true);
    try {
      const res = await fetch("/api/freshness", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ businessId, state }) });
      if (res.ok) setDone(state);
    } catch { /* best-effort */ }
    setBusy(false);
  };

  const buttons = (
    <>
      <button className={bare ? "btn btn-outline btn-sm" : "btn btn-soft btn-sm"} disabled={busy || !!done} onClick={() => ping("here")}>
        <Icon name="check" size={14} /> {done === "here" ? "Thanks!" : "Still here"}
      </button>
      <button className={bare ? "btn btn-outline btn-sm" : "btn btn-ghost btn-sm"} disabled={busy || !!done} onClick={() => ping("closed")}>
        {done === "closed" ? "Reported — we'll review" : "Report closed"}
      </button>
    </>
  );

  // `bare` renders the buttons only — for hosts (e.g. the listing page's
  // "Help keep this accurate" panel) that provide their own heading.
  if (bare) return buttons;

  return (
    <div className="flex g8 center wrap" style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--line,#e7e2d6)" }}>
      <span className="faint" style={{ fontSize: ".82rem", fontWeight: 600 }}>
        Help keep this accurate{lastVerifiedAgo ? ` · last verified ${lastVerifiedAgo}` : ""}:
      </span>
      {buttons}
    </div>
  );
}
