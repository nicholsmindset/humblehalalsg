"use client";

/* "In review" cards for the owner dashboard — surfaces listing submissions
   (staging_businesses) and claims that are still with the moderation team, so
   a fresh submission doesn't read as "No listings yet". Pure render; the
   dashboard fetches /api/owner/submissions and passes rows in. */

import { Icon } from "../ui";

export type PendingSubmission = {
  id: string;
  kind: "listing" | "claim";
  name: string;
  status: string;
  created_at: string;
};

export function PendingSubmissions({ items }: { items: PendingSubmission[] }) {
  if (!items.length) return null;
  return (
    <div className="stack g10" style={{ marginBottom: 14 }}>
      {items.map((s) => {
        const when = s.created_at
          ? new Date(s.created_at).toLocaleDateString("en-SG", { day: "numeric", month: "short" })
          : "";
        return (
          <div key={`${s.kind}-${s.id}`} className="card" style={{ display: "flex", gap: 12, padding: 14, alignItems: "center", flexWrap: "wrap" }}>
            <div className="empty-ico" style={{ width: 40, height: 40, borderRadius: 11, background: "var(--cream-200)", flex: "none" }}>
              <Icon name={s.kind === "claim" ? "shield-check" : "store"} size={19} />
            </div>
            <div className="f1" style={{ minWidth: 160 }}>
              <div className="flex g8 center wrap">
                <span className="pill-tag amber">In review</span>
                <span style={{ fontWeight: 700 }}>{s.name}</span>
              </div>
              <p className="faint" style={{ fontSize: ".82rem", marginTop: 3 }}>
                {s.kind === "claim" ? "Ownership claim" : "New listing"}
                {when ? ` · submitted ${when}` : ""} · reviews usually take 1–2 business days. We&rsquo;ll email you when it&rsquo;s live.
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
