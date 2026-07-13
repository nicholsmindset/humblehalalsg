"use client";

/* Owner dashboard: manage the listing's single active offer (Premium).
   Lower tiers see a locked teaser — the classic visible-but-locked ladder. */

import { useEffect, useState } from "react";
import { canUse } from "@/lib/plans";
import { track } from "@/lib/analytics";
import { Icon } from "../ui";

type Offer = { id?: string; title: string; details: string | null; ends_at: string | null };

export function OwnerOfferCard({ plan, toast, onUpgrade }: {
  plan: string;
  toast: (m: string) => void;
  onUpgrade: () => void;
}) {
  const allowed = canUse(plan, "offers_block");
  const [offer, setOffer] = useState<Offer | null>(null);
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!allowed) { setLoaded(true); return; }
    let alive = true;
    fetch("/api/owner/offer")
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        if (d?.ok && d.offer) {
          setOffer(d.offer);
          setTitle(String(d.offer.title || ""));
          setDetails(String(d.offer.details || ""));
          setEndsAt(String(d.offer.ends_at || ""));
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
    return () => { alive = false; };
  }, [allowed]);

  if (!allowed) {
    return (
      <div className="card" style={{ padding: 18, display: "flex", gap: 14, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div className="flex g8 center"><Icon name="trophy" size={16} /><h3 style={{ fontSize: "1rem" }}>Offers &amp; promotions</h3><span className="pill-tag">Premium</span></div>
          <p className="faint" style={{ fontSize: ".84rem", marginTop: 6 }}>
            Show a live promotion on your public listing — “10% off for Humble Halal visitors”, set-menu deals, Ramadan specials.
          </p>
        </div>
        <button className="btn btn-gold btn-sm" onClick={onUpgrade}>Upgrade to Premium</button>
      </div>
    );
  }

  const save = async () => {
    if (title.trim().length < 3) { toast("Give the offer a short title first."); return; }
    setBusy(true);
    try {
      const r = await fetch("/api/owner/offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), details: details.trim(), endsAt: endsAt || undefined }),
      });
      const d = await r.json().catch(() => ({}));
      if (d?.ok) { setOffer(d.offer || { title, details, ends_at: endsAt || null }); track.ownerAction("offer_publish"); toast("Offer is live on your listing"); }
      else toast(d?.error === "plan_required" ? "Offers need the Premium plan." : "Couldn't save — try again.");
    } catch { toast("Network error — try again."); }
    finally { setBusy(false); }
  };

  const remove = async () => {
    setBusy(true);
    try {
      const r = await fetch("/api/owner/offer", { method: "DELETE" });
      const d = await r.json().catch(() => ({}));
      if (d?.ok) { setOffer(null); setTitle(""); setDetails(""); setEndsAt(""); track.ownerAction("offer_remove"); toast("Offer removed"); }
      else toast("Couldn't remove — try again.");
    } catch { toast("Network error — try again."); }
    finally { setBusy(false); }
  };

  return (
    <div className="card" style={{ padding: 18 }}>
      <div className="flex g8 center between wrap">
        <div className="flex g8 center"><Icon name="trophy" size={16} /><h3 style={{ fontSize: "1rem" }}>Offers &amp; promotions</h3></div>
        {offer && <span className="pill-tag" style={{ background: "var(--emerald-50)", color: "var(--emerald)" }}>Live on your listing</span>}
      </div>
      {!loaded ? (
        <p className="faint" style={{ fontSize: ".84rem", marginTop: 8 }}>Loading…</p>
      ) : (
        <div className="stack g10" style={{ marginTop: 12 }}>
          <div className="field">
            <label>Offer title</label>
            <input className="input" maxLength={80} placeholder="e.g. 10% off for Humble Halal visitors" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="field">
            <label>Details (optional)</label>
            <input className="input" maxLength={500} placeholder="e.g. Weekdays only, dine-in, min. 2 pax" value={details} onChange={(e) => setDetails(e.target.value)} />
          </div>
          <div className="field" style={{ maxWidth: 220 }}>
            <label>Valid until (optional)</label>
            <input className="input" type="date" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
          </div>
          <div className="flex g8">
            <button className="btn btn-primary btn-sm" disabled={busy} onClick={save}>{busy ? "Saving…" : offer ? "Update offer" : "Publish offer"}</button>
            {offer && <button className="btn btn-ghost btn-sm" disabled={busy} onClick={remove}>Remove</button>}
          </div>
        </div>
      )}
    </div>
  );
}
