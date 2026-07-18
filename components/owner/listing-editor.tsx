"use client";

/* =============================================================
   OWNER LISTING EDITOR (inline, self-service)
   Lets a claimed owner edit the editable fields of a listing they own.
   Talks to /api/owner/listing (GET to load, PATCH to save) — ownership is
   enforced server-side. Sends only changed fields; "" clears a field.

   Layout: one form in five anchored sections (Basics · Contact · Hours ·
   Photos · Amenities) with a chip nav, dirty-state tracking and a sticky
   save bar so long edits never lose the Save button below the fold.
   Identity + trust fields (name, category, halal status) stay admin-
   controlled — owners file a change request instead (MUIS posture).
============================================================= */

import { useEffect, useRef, useState } from "react";
import { track } from "@/lib/analytics";
import { DAY_LABELS } from "@/lib/hours";
import { galleryMax } from "@/lib/plans";
import { ATTRIBUTE_OPTIONS } from "@/lib/attributes";
import { categories } from "@/lib/data";
import { Icon } from "../ui";
import { PhotoManager, type ManagedPhoto } from "./photo-manager";

type EditableSocials = { whatsapp?: string; instagram?: string; [k: string]: string | undefined };
type OwnerListing = {
  id: string;
  slug?: string | null;
  name?: string | null;
  cat_id?: string | null;
  plan?: string | null;
  phone?: string | null;
  website?: string | null;
  address?: string | null;
  postal?: string | null;
  description?: string | null;
  price_level?: string | null;
  opening_hours?: ({ open?: string; close?: string } | null)[] | null;
  socials?: EditableSocials | null;
  photos?: ({ url?: string; caption?: string } | null)[] | null;
  attributes?: string[] | null;
};
// A single day in the 7-row editor: closed = no range for that day.
type DayRow = { closed: boolean; open: string; close: string };
const EMPTY_DAY: DayRow = { closed: true, open: "", close: "" };

const SECTIONS = [
  ["basics", "Basics"],
  ["contact", "Contact & links"],
  ["hours", "Hours"],
  ["photos", "Photos"],
  ["amenities", "Amenities"],
] as const;

/** Inline change-request for admin-controlled fields (name / category / area).
    Files a structured note into the suggestions moderation queue — no new
    schema; admins see it alongside suggest-a-place submissions. */
function RequestChange({ businessId, businessName, field, current, toast }: {
  businessId: string;
  businessName: string;
  field: "name" | "category";
  current: string;
  toast: (m: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const send = async () => {
    const requested = text.trim();
    if (requested.length < 2) { toast("Tell us what it should change to"); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "suggest",
          name: businessName,
          note: `[${field}-change-request] business=${businessId} current="${current}" requested="${requested}"`,
        }),
      });
      const j = await res.json().catch(() => ({ ok: false }));
      if (res.ok && j?.ok) { track.ownerAction("change_request", businessId, { field }); toast("Request sent — our team will review it"); setOpen(false); setText(""); }
      else toast("Couldn’t send the request — try again.");
    } catch {
      toast("Couldn’t send the request — try again.");
    } finally {
      setBusy(false);
    }
  };
  if (!open) {
    return (
      <button type="button" className="link-inline" style={{ fontSize: ".8rem" }} onClick={() => setOpen(true)}>
        Request a change
      </button>
    );
  }
  return (
    <div className="flex g8 wrap" style={{ marginTop: 6 }}>
      <input
        className="input f1"
        style={{ minWidth: 180, fontSize: 16, minHeight: 44 }}
        placeholder={field === "name" ? "New business name" : "Correct category"}
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={120}
      />
      <button type="button" className="btn btn-soft btn-sm" disabled={busy} onClick={send}>{busy ? "Sending…" : "Send request"}</button>
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setOpen(false); setText(""); }}>Cancel</button>
    </div>
  );
}

export function OwnerListingEditor({ id, name, toast, onClose, onSaved }: { id: string; name: string; toast: (m: string) => void; onClose: () => void; onSaved: () => void }) {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [address, setAddress] = useState("");
  const [postal, setPostal] = useState("");
  const [description, setDescription] = useState("");
  const [priceLevel, setPriceLevel] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [instagram, setInstagram] = useState("");
  const [days, setDays] = useState<DayRow[]>(() => Array.from({ length: 7 }, () => ({ ...EMPTY_DAY })));
  const [attrs, setAttrs] = useState<string[]>([]);

  // Keep the loaded values so we PATCH only what actually changed (and preserve
  // any extra keys already on the `socials` jsonb object).
  const [orig, setOrig] = useState<OwnerListing | null>(null);

  // Photos: jsonb array of { url, caption? }, managed (cover/order/captions)
  // by PhotoManager. Cap follows the plan (lib/plans galleryMax: 3/15/20/30).
  const [plan, setPlan] = useState<string>("free");
  const [photos, setPhotos] = useState<ManagedPhoto[]>([]);
  const maxPhotos = galleryMax(plan);

  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setLoadError(null);
    (async () => {
      try {
        const res = await fetch(`/api/owner/listing?id=${encodeURIComponent(id)}`);
        const json = await res.json().catch(() => ({ ok: false }));
        if (!alive) return;
        if (!res.ok || !json?.ok) {
          const map: Record<string, string> = { unauthorized: "Please sign in to edit this listing.", forbidden: "You don’t have access to this listing.", not_found: "We couldn’t find this listing.", service_not_configured: "Editing isn’t available right now." };
          setLoadError(map[json?.error] || "Couldn’t load this listing — try again.");
          setLoading(false);
          return;
        }
        const b = json.business as OwnerListing;
        setOrig(b);
        setPhone(b.phone ?? "");
        setWebsite(b.website ?? "");
        setAddress(b.address ?? "");
        setPostal(b.postal ?? "");
        setDescription(b.description ?? "");
        setPriceLevel(b.price_level ?? "");
        const soc = (b.socials && typeof b.socials === "object" ? b.socials : {}) as EditableSocials;
        setWhatsapp(soc.whatsapp ?? "");
        setInstagram(soc.instagram ?? "");
        const oh = Array.isArray(b.opening_hours) ? b.opening_hours : [];
        setDays(Array.from({ length: 7 }, (_, i) => {
          const d = oh[i];
          if (d && d.open && d.close) return { closed: false, open: d.open, close: d.close };
          return { ...EMPTY_DAY };
        }));
        setAttrs(Array.isArray(b.attributes) ? b.attributes.filter((a): a is string => typeof a === "string") : []);
        setPlan(b.plan || "free");
        const ph = Array.isArray(b.photos) ? b.photos : [];
        setPhotos(
          ph
            .filter((p): p is { url: string; caption?: string } => !!p && typeof p.url === "string" && !!p.url)
            .map((p) => (p.caption ? { url: p.url, caption: p.caption } : { url: p.url }))
            .slice(0, galleryMax(b.plan || "free")),
        );
        setLoading(false);
      } catch {
        if (alive) { setLoadError("Couldn’t load this listing — try again."); setLoading(false); }
      }
    })();
    return () => { alive = false; };
  }, [id]);

  const setDay = (i: number, patch: Partial<DayRow>) =>
    setDays((prev) => prev.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));

  const copyToAll = () => {
    const first = days.find((d) => !d.closed && d.open && d.close);
    if (!first) { toast("Set one day's hours first, then copy"); return; }
    setDays((prev) => prev.map(() => ({ ...first })));
  };

  // Build the opening_hours array in the exact shape rowToListing expects:
  // length-7 array, each entry { open, close } or null for a closed day.
  const buildHours = (): ({ open: string; close: string } | null)[] =>
    days.map((d) => (!d.closed && d.open && d.close ? { open: d.open, close: d.close } : null));

  const sameHours = (a: ({ open: string; close: string } | null)[], b: OwnerListing["opening_hours"]): boolean => {
    const bb = Array.isArray(b) ? b : [];
    if (a.length !== 7) return false;
    for (let i = 0; i < 7; i++) {
      const x = a[i];
      const y = bb[i];
      const yOpen = y?.open || "";
      const yClose = y?.close || "";
      const yNull = !(yOpen && yClose);
      if (x === null && yNull) continue;
      if (x === null || yNull) return false;
      if (x.open !== yOpen || x.close !== yClose) return false;
    }
    return true;
  };

  // Did the photo list (urls, order or captions) change from what we loaded?
  const photosChanged = (): boolean => {
    const was = (Array.isArray(orig?.photos) ? orig!.photos : [])
      .filter((p): p is { url: string; caption?: string } => !!p && typeof p.url === "string" && !!p.url);
    if (was.length !== photos.length) return true;
    for (let i = 0; i < photos.length; i++) {
      if (photos[i].url !== was[i].url) return true;
      if ((photos[i].caption || "") !== (was[i].caption || "")) return true;
    }
    return false;
  };

  const attrsChanged = (): boolean => {
    const was = (Array.isArray(orig?.attributes) ? orig!.attributes : []).filter((a): a is string => typeof a === "string");
    if (was.length !== attrs.length) return true;
    const w = new Set(was);
    return attrs.some((a) => !w.has(a));
  };

  // Dirty-state: same comparisons the save() diff uses, computed every render
  // (cheap — a handful of string compares) so the sticky bar appears/disappears
  // as the owner types.
  const strDiff = (val: string, was: string | null | undefined) => val.trim() !== (was ?? "");
  const origSoc = (orig?.socials && typeof orig.socials === "object" ? orig.socials : {}) as EditableSocials;
  const dirty = !!orig && !loading && (
    strDiff(phone, orig.phone) ||
    strDiff(website, orig.website) ||
    strDiff(address, orig.address) ||
    strDiff(postal, orig.postal) ||
    strDiff(description, orig.description) ||
    strDiff(priceLevel, orig.price_level) ||
    (whatsapp.trim() || "") !== (origSoc.whatsapp ?? "") ||
    (instagram.trim() || "") !== (origSoc.instagram ?? "") ||
    !sameHours(buildHours(), orig.opening_hours) ||
    photosChanged() ||
    attrsChanged()
  );

  // Warn before the tab/window closes with unsaved edits. (In-app navigation
  // is covered by the Cancel confirm below.)
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const requestClose = () => {
    if (dirty && !window.confirm("Discard your unsaved changes?")) return;
    onClose();
  };

  const save = async () => {
    if (!orig) return;
    // 6-digit postal sanity check (allow blank to clear).
    if (postal && !/^\d{6}$/.test(postal)) { toast("Postal code should be 6 digits"); return; }

    // Opening-hours sanity: valid HH:MM both ends, open ≠ close. Overnight
    // ranges (close before open, e.g. 22:00–02:00) are supported by lib/hours.
    const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
    for (const d of days) {
      if (d.closed) continue;
      if (!HHMM.test(d.open) || !HHMM.test(d.close) || d.close === d.open) {
        toast("Check your opening hours — open and close times must be set and different");
        return;
      }
    }

    const patch: Record<string, unknown> = { id };
    if (strDiff(phone, orig.phone)) patch.phone = phone.trim();
    if (strDiff(website, orig.website)) patch.website = website.trim();
    if (strDiff(address, orig.address)) patch.address = address.trim();
    if (strDiff(postal, orig.postal)) patch.postal = postal.trim();
    if (strDiff(description, orig.description)) patch.description = description.trim();
    if (strDiff(priceLevel, orig.price_level)) patch.price_level = priceLevel;

    // Socials: merge onto the existing jsonb so other keys are preserved.
    const wa = whatsapp.trim();
    const ig = instagram.trim();
    if ((wa || "") !== (origSoc.whatsapp ?? "") || (ig || "") !== (origSoc.instagram ?? "")) {
      const nextSoc: EditableSocials = { ...origSoc };
      if (wa) nextSoc.whatsapp = wa; else delete nextSoc.whatsapp;
      if (ig) nextSoc.instagram = ig; else delete nextSoc.instagram;
      patch.socials = nextSoc;
    }

    const hours = buildHours();
    if (!sameHours(hours, orig.opening_hours)) patch.opening_hours = hours;

    // Photos: PhotoManager owns urls, order AND captions — send as-is.
    if (photosChanged()) {
      patch.photos = photos.map((p) => (p.caption ? { url: p.url, caption: p.caption } : { url: p.url }));
    }

    if (attrsChanged()) patch.attributes = attrs;

    if (Object.keys(patch).length <= 1) { toast("No changes to save"); onClose(); return; }

    setSaving(true);
    try {
      const res = await fetch("/api/owner/listing", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
      const json = await res.json().catch(() => ({ ok: false }));
      if (res.ok && json?.ok) {
        track.ownerAction("listing_edit", String(id));
        toast("Listing updated");
        onSaved();
      } else {
        const map: Record<string, string> = { forbidden: "You don’t have access to this listing.", not_found: "We couldn’t find this listing.", no_fields: "No changes to save.", unauthorized: "Please sign in to edit this listing." };
        toast(map[json?.error] || "Couldn’t save — try again.");
      }
    } catch {
      toast("Couldn’t save — try again.");
    } finally {
      setSaving(false);
    }
  };

  const jumpTo = (sectionId: string) => {
    rootRef.current?.querySelector(`[data-ed-section="${sectionId}"]`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const catLabel = categories.find((c) => c.id === orig?.cat_id)?.label || orig?.cat_id || "—";

  return (
    <div ref={rootRef} className="ed-root" style={{ borderTop: "1px solid var(--line)", padding: 16, background: "var(--surface-2, #fafafa)" }}>
      {loading ? (
        <div className="stack g10" aria-busy="true">
          <div className="faint" style={{ fontSize: ".88rem" }}>Loading {name}…</div>
          <div className="card" style={{ height: 60, opacity: 0.4 }} />
        </div>
      ) : loadError ? (
        <div className="stack g12">
          <div className="notice notice-warn"><Icon name="info" size={18} /><span>{loadError}</span></div>
          <div className="flex g8"><button className="btn btn-soft btn-sm" onClick={onClose}>Close</button></div>
        </div>
      ) : (
        <div className="stack g16">
          {/* Section chips + view-public link */}
          <div className="flex between center wrap g10">
            <nav className="ed-nav" aria-label="Edit sections">
              {SECTIONS.map(([sid, label]) => (
                <button key={sid} type="button" className="ed-chip" onClick={() => jumpTo(sid)}>{label}</button>
              ))}
            </nav>
            {orig?.slug && (
              <a className="btn btn-ghost btn-sm" href={`/business/${orig.slug}`} target="_blank" rel="noopener noreferrer">
                <Icon name="eye" size={15} /> View public page
              </a>
            )}
          </div>

          {/* ── Basics ─────────────────────────────────────────────── */}
          <section data-ed-section="basics" className="ed-section">
            <h4 className="ed-h">Basics</h4>
            <div className="ed-locked">
              <div className="flex g8 center wrap">
                <Icon name="lock" size={14} />
                <span style={{ fontWeight: 700 }}>{orig?.name || name}</span>
                <span className="tag" style={{ background: "var(--cream-200)", color: "var(--ink-soft)" }}>{catLabel}</span>
              </div>
              <p className="faint" style={{ fontSize: ".78rem", margin: "6px 0 0" }}>
                Business name and category are verified details our team manages — request a change and we&rsquo;ll update it after review.
              </p>
              <div className="flex g14 wrap" style={{ marginTop: 4 }}>
                <RequestChange businessId={id} businessName={orig?.name || name} field="name" current={orig?.name || name} toast={toast} />
                <RequestChange businessId={id} businessName={orig?.name || name} field="category" current={catLabel} toast={toast} />
              </div>
            </div>
            <div className="field">
              <label htmlFor="ed-description">Description</label>
              <textarea id="ed-description" className="textarea" placeholder="Tell customers what makes your place special." value={description} onChange={(e) => setDescription(e.target.value)} style={{ fontSize: 16, minHeight: 88 }} />
            </div>
            <div className="field">
              <label htmlFor="ed-price-level">Price level</label>
              <select id="ed-price-level" className="select" value={priceLevel} onChange={(e) => setPriceLevel(e.target.value)} style={{ fontSize: 16, minHeight: 44 }}>
                <option value="">Not set</option>
                <option value="$">$</option>
                <option value="$$">$$</option>
                <option value="$$$">$$$</option>
                <option value="$$$$">$$$$</option>
              </select>
            </div>
          </section>

          {/* ── Contact & links ────────────────────────────────────── */}
          <section data-ed-section="contact" className="ed-section">
            <h4 className="ed-h">Contact &amp; links</h4>
            <div className="ed-grid2">
              <div className="field">
                <label htmlFor="ed-phone">Phone</label>
                <input id="ed-phone" className="input" type="tel" inputMode="tel" autoComplete="tel" placeholder="+65 9123 4567" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ fontSize: 16, minHeight: 44 }} />
              </div>
              <div className="field">
                <label htmlFor="ed-whatsapp">WhatsApp</label>
                <input id="ed-whatsapp" className="input" type="tel" inputMode="tel" placeholder="+65 9123 4567" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} style={{ fontSize: 16, minHeight: 44 }} />
              </div>
              <div className="field">
                <label htmlFor="ed-website">Website</label>
                <input id="ed-website" className="input" type="url" inputMode="url" placeholder="https://example.com" value={website} onChange={(e) => setWebsite(e.target.value)} style={{ fontSize: 16, minHeight: 44 }} />
              </div>
              <div className="field">
                <label htmlFor="ed-instagram">Instagram</label>
                <input id="ed-instagram" className="input" type="text" placeholder="@yourhandle" value={instagram} onChange={(e) => setInstagram(e.target.value)} style={{ fontSize: 16, minHeight: 44 }} />
              </div>
              <div className="field">
                <label htmlFor="ed-address">Address</label>
                <input id="ed-address" className="input" type="text" autoComplete="street-address" placeholder="123 Example Street, #01-23" value={address} onChange={(e) => setAddress(e.target.value)} style={{ fontSize: 16, minHeight: 44 }} />
              </div>
              <div className="field">
                <label htmlFor="ed-postal">Postal code</label>
                <input id="ed-postal" className="input" type="text" inputMode="numeric" pattern="[0-9]*" autoComplete="postal-code" maxLength={6} placeholder="123456" value={postal} onChange={(e) => setPostal(e.target.value.replace(/\D/g, "").slice(0, 6))} style={{ fontSize: 16, minHeight: 44 }} />
              </div>
            </div>
          </section>

          {/* ── Hours ──────────────────────────────────────────────── */}
          <section data-ed-section="hours" className="ed-section">
            <div className="flex between center wrap g8">
              <h4 className="ed-h">Opening hours</h4>
              <button type="button" className="btn btn-ghost btn-sm" onClick={copyToAll} title="Copy the first open day's hours to every day">
                <Icon name="check" size={14} /> Copy to all days
              </button>
            </div>
            <div className="stack g8" style={{ marginTop: 6 }}>
              {DAY_LABELS.map((label, i) => {
                const d = days[i];
                const overnight = !d.closed && d.open && d.close && d.close < d.open;
                return (
                  <div key={label}>
                    <div className="flex g8 center wrap" style={{ alignItems: "center" }}>
                      <span style={{ width: 44, fontWeight: 600, fontSize: ".9rem" }}>{label}</span>
                      {d.closed ? (
                        <span className="faint f1" style={{ fontSize: ".88rem" }}>Closed</span>
                      ) : (
                        <div className="flex g6 center f1" style={{ flexWrap: "wrap" }}>
                          <input aria-label={`${label} opening time`} className="input" type="time" value={d.open} onChange={(e) => setDay(i, { open: e.target.value })} style={{ fontSize: 16, minHeight: 44, width: 130 }} />
                          <span className="faint">to</span>
                          <input aria-label={`${label} closing time`} className="input" type="time" value={d.close} onChange={(e) => setDay(i, { close: e.target.value })} style={{ fontSize: 16, minHeight: 44, width: 130 }} />
                          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDay(i, { open: "00:00", close: "23:59" })} title={`Open 24 hours on ${label}`}>24h</button>
                        </div>
                      )}
                      <label className="flex g6 center" style={{ fontSize: ".85rem", minHeight: 44 }}>
                        <input type="checkbox" checked={d.closed} onChange={(e) => setDay(i, e.target.checked ? { closed: true } : { closed: false, open: d.open || "09:00", close: d.close || "18:00" })} style={{ width: 20, height: 20 }} />
                        Closed
                      </label>
                    </div>
                    {overnight && (
                      <p className="faint" style={{ fontSize: ".76rem", margin: "2px 0 0 52px" }}>
                        Closes {d.close} the next day (overnight hours).
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── Photos ─────────────────────────────────────────────── */}
          <section data-ed-section="photos" className="ed-section">
            <h4 className="ed-h">Photos</h4>
            <p className="faint" style={{ fontSize: ".8rem", marginBottom: 8 }}>Cover photo, interior, and a few signature dishes work best. Captions help customers (and search) know what they&rsquo;re looking at.</p>
            <PhotoManager photos={photos} onChange={setPhotos} max={maxPhotos} plan={plan} businessId={id} toast={toast} />
          </section>

          {/* ── Amenities ──────────────────────────────────────────── */}
          <section data-ed-section="amenities" className="ed-section">
            <h4 className="ed-h">Amenities</h4>
            <p className="faint" style={{ fontSize: ".8rem", marginBottom: 8 }}>Shown on your public page and used by explore filters (prayer space, family friendly, delivery…).</p>
            <div className="ed-amenities">
              {ATTRIBUTE_OPTIONS.map((opt) => {
                const on = attrs.includes(opt);
                return (
                  <label key={opt} className={`ed-amenity ${on ? "on" : ""}`}>
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={(e) => setAttrs((cur) => (e.target.checked ? [...cur, opt] : cur.filter((a) => a !== opt)))}
                    />
                    <span>{opt}</span>
                  </label>
                );
              })}
            </div>
          </section>

          {/* Save bar — sticky above the tab bar on mobile via wizard-footer. */}
          <div className={`wizard-footer ed-savebar ${dirty ? "dirty" : ""}`}>
            {dirty && <span className="ed-dirty-hint faint">Unsaved changes</span>}
            <button className="btn btn-primary" disabled={saving || !dirty} onClick={save} style={{ minHeight: 44 }}>{saving ? "Saving…" : "Save changes"}</button>
            <button className="btn btn-soft" disabled={saving} onClick={requestClose} style={{ minHeight: 44 }}>{dirty ? "Discard" : "Close"}</button>
          </div>
        </div>
      )}
    </div>
  );
}
