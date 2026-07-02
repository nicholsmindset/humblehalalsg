"use client";

/* =============================================================
   OWNER LISTING EDITOR (inline, self-service)
   Lets a claimed owner edit the editable fields of a listing they own.
   Talks to /api/owner/listing (GET to load, PATCH to save) — ownership is
   enforced server-side. Sends only changed fields; "" clears a field.
============================================================= */

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { DAY_LABELS } from "@/lib/hours";
import { Icon, ImagePh } from "../ui";

type EditableSocials = { whatsapp?: string; instagram?: string; [k: string]: string | undefined };
type OwnerListing = {
  id: string;
  phone?: string | null;
  website?: string | null;
  address?: string | null;
  postal?: string | null;
  description?: string | null;
  price_level?: string | null;
  opening_hours?: ({ open?: string; close?: string } | null)[] | null;
  socials?: EditableSocials | null;
  photos?: ({ url?: string; caption?: string } | null)[] | null;
};
// A single day in the 7-row editor: closed = no range for that day.
type DayRow = { closed: boolean; open: string; close: string };
const EMPTY_DAY: DayRow = { closed: true, open: "", close: "" };

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

  // Keep the loaded values so we PATCH only what actually changed (and preserve
  // any extra keys already on the `socials` jsonb object).
  const [orig, setOrig] = useState<OwnerListing | null>(null);

  // Photos: jsonb array of { url, caption? }. We track just the url list in
  // the editor; captions on existing photos are preserved on save.
  const MAX_PHOTOS = 6;
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const photoInputRef = useRef<HTMLInputElement | null>(null);

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
        const ph = Array.isArray(b.photos) ? b.photos : [];
        setPhotos(ph.map((p) => p?.url).filter((u): u is string => typeof u === "string" && !!u).slice(0, MAX_PHOTOS));
        setLoading(false);
      } catch {
        if (alive) { setLoadError("Couldn’t load this listing — try again."); setLoading(false); }
      }
    })();
    return () => { alive = false; };
  }, [id]);

  const setDay = (i: number, patch: Partial<DayRow>) =>
    setDays((prev) => prev.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));

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

  // Real photo upload — mirrors AddListingScreen: one request per file to the
  // generic authed image endpoint. Skips files that fail; caps at MAX_PHOTOS.
  const onPhotosPicked = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = ""; // allow re-selecting the same file later
    if (!files.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        let full = false;
        setPhotos((cur) => { full = cur.length >= MAX_PHOTOS; return cur; });
        if (full) { toast(`You can add up to ${MAX_PHOTOS} photos`); break; }
        try {
          const fd = new FormData();
          fd.set("file", file);
          const res = await fetch("/api/events/upload", { method: "POST", body: fd });
          const json = await res.json().catch(() => ({ ok: false }));
          if (json?.ok && json.url) {
            setPhotos((cur) => (cur.length >= MAX_PHOTOS ? cur : [...cur, json.url as string]));
          } else {
            const msg: Record<string, string> = {
              unauthenticated: "Please sign in to upload photos.",
              not_configured: "Photo uploads aren’t available yet.",
              too_large: `${file.name} is too large (max 5MB).`,
              bad_type: `${file.name} isn’t a supported image.`,
            };
            toast(msg[json?.reason] || `Couldn’t upload ${file.name}.`);
          }
        } catch {
          toast(`Couldn’t upload ${file.name}.`);
        }
      }
    } finally {
      setUploading(false);
    }
  };
  const removePhoto = (idx: number) => setPhotos((cur) => cur.filter((_, i) => i !== idx));

  // Did the photo url list change from what we loaded?
  const photosChanged = (): boolean => {
    const was = (Array.isArray(orig?.photos) ? orig!.photos : [])
      .map((p) => p?.url).filter((u): u is string => typeof u === "string" && !!u);
    if (was.length !== photos.length) return true;
    for (let i = 0; i < photos.length; i++) if (photos[i] !== was[i]) return true;
    return false;
  };

  const save = async () => {
    if (!orig) return;
    // 6-digit postal sanity check (allow blank to clear).
    if (postal && !/^\d{6}$/.test(postal)) { toast("Postal code should be 6 digits"); return; }

    // Opening-hours sanity: for any open day, close must be a valid HH:MM and
    // strictly after open.
    const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
    for (const d of days) {
      if (d.closed) continue;
      if (!HHMM.test(d.open) || !HHMM.test(d.close) || d.close <= d.open) {
        toast("Check your opening hours — close time must be after open time");
        return;
      }
    }

    const patch: Record<string, unknown> = { id };
    const diff = (val: string, was: string | null | undefined) => {
      const nv = val.trim();
      if (nv !== (was ?? "")) return true;
      return false;
    };
    if (diff(phone, orig.phone)) patch.phone = phone.trim();
    if (diff(website, orig.website)) patch.website = website.trim();
    if (diff(address, orig.address)) patch.address = address.trim();
    if (diff(postal, orig.postal)) patch.postal = postal.trim();
    if (diff(description, orig.description)) patch.description = description.trim();
    if (diff(priceLevel, orig.price_level)) patch.price_level = priceLevel;

    // Socials: merge onto the existing jsonb so other keys are preserved.
    const origSoc = (orig.socials && typeof orig.socials === "object" ? orig.socials : {}) as EditableSocials;
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

    // Photos: preserve captions on existing urls; new uploads carry url only.
    if (photosChanged()) {
      const prev = (Array.isArray(orig.photos) ? orig.photos : []).filter((p): p is { url?: string; caption?: string } => !!p);
      patch.photos = photos.map((url) => {
        const existing = prev.find((p) => p.url === url);
        return existing?.caption ? { url, caption: existing.caption } : { url };
      });
    }

    if (Object.keys(patch).length <= 1) { toast("No changes to save"); onClose(); return; }

    setSaving(true);
    try {
      const res = await fetch("/api/owner/listing", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
      const json = await res.json().catch(() => ({ ok: false }));
      if (res.ok && json?.ok) {
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

  return (
    <div style={{ borderTop: "1px solid var(--line)", padding: 16, background: "var(--surface-2, #fafafa)" }}>
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
          <div className="field">
            <label>Phone</label>
            <input className="input" type="tel" inputMode="tel" placeholder="+65 9123 4567" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ fontSize: 16, minHeight: 44 }} />
          </div>
          <div className="field">
            <label>Website</label>
            <input className="input" type="url" placeholder="https://example.com" value={website} onChange={(e) => setWebsite(e.target.value)} style={{ fontSize: 16, minHeight: 44 }} />
          </div>
          <div className="grid2 g12" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
            <div className="field">
              <label>Address</label>
              <input className="input" type="text" placeholder="123 Example Street, #01-23" value={address} onChange={(e) => setAddress(e.target.value)} style={{ fontSize: 16, minHeight: 44 }} />
            </div>
            <div className="field">
              <label>Postal code</label>
              <input className="input" type="text" inputMode="numeric" maxLength={6} placeholder="123456" value={postal} onChange={(e) => setPostal(e.target.value.replace(/\D/g, "").slice(0, 6))} style={{ fontSize: 16, minHeight: 44 }} />
            </div>
          </div>
          <div className="field">
            <label>Description</label>
            <textarea className="textarea" placeholder="Tell customers what makes your place special." value={description} onChange={(e) => setDescription(e.target.value)} style={{ fontSize: 16, minHeight: 88 }} />
          </div>
          <div className="field">
            <label>Price level</label>
            <select className="select" value={priceLevel} onChange={(e) => setPriceLevel(e.target.value)} style={{ fontSize: 16, minHeight: 44 }}>
              <option value="">Not set</option>
              <option value="$">$</option>
              <option value="$$">$$</option>
              <option value="$$$">$$$</option>
              <option value="$$$$">$$$$</option>
            </select>
          </div>
          <div className="field">
            <label>WhatsApp</label>
            <input className="input" type="text" inputMode="tel" placeholder="+65 9123 4567" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} style={{ fontSize: 16, minHeight: 44 }} />
          </div>
          <div className="field">
            <label>Instagram</label>
            <input className="input" type="text" placeholder="@yourhandle" value={instagram} onChange={(e) => setInstagram(e.target.value)} style={{ fontSize: 16, minHeight: 44 }} />
          </div>

          <div className="field">
            <label>Photos</label>
            <p className="faint" style={{ fontSize: ".8rem", marginBottom: 8 }}>Cover photo, interior, and a few signature dishes work best. Up to {MAX_PHOTOS}.</p>
            <input ref={photoInputRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={onPhotosPicked} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))", gap: 10 }}>
              {photos.length < MAX_PHOTOS && (
                <button type="button" className="upload-zone" style={{ aspectRatio: "1", minHeight: 96 }} disabled={uploading} onClick={() => photoInputRef.current?.click()}>
                  <Icon name="camera" size={22} /><span style={{ fontSize: ".76rem", fontWeight: 700, marginTop: 6 }}>{uploading ? "Uploading…" : "Add photo"}</span>
                </button>
              )}
              {photos.map((url, i) => (
                <div key={url} style={{ position: "relative" }}>
                  <ImagePh label={`photo ${i + 1}`} tone="gold" ratio="1" src={url} />
                  <button type="button" aria-label={`Remove photo ${i + 1}`} onClick={() => removePhoto(i)} style={{ position: "absolute", top: 6, right: 6, width: 28, height: 28, borderRadius: "50%", border: "none", background: "rgba(0,0,0,.6)", color: "#fff", display: "grid", placeItems: "center", cursor: "pointer" }}><Icon name="x" size={15} /></button>
                </div>
              ))}
            </div>
            <p className="faint" style={{ fontSize: ".76rem", marginTop: 8 }}>{photos.length} of {MAX_PHOTOS} photos added.</p>
          </div>

          <div className="field">
            <label>Opening hours</label>
            <div className="stack g8" style={{ marginTop: 6 }}>
              {DAY_LABELS.map((label, i) => {
                const d = days[i];
                return (
                  <div key={label} className="flex g8 center wrap" style={{ alignItems: "center" }}>
                    <span style={{ width: 44, fontWeight: 600, fontSize: ".9rem" }}>{label}</span>
                    {d.closed ? (
                      <span className="faint f1" style={{ fontSize: ".88rem" }}>Closed</span>
                    ) : (
                      <div className="flex g6 center f1" style={{ flexWrap: "wrap" }}>
                        <input aria-label={`${label} opening time`} className="input" type="time" value={d.open} onChange={(e) => setDay(i, { open: e.target.value })} style={{ fontSize: 16, minHeight: 44, width: 130 }} />
                        <span className="faint">to</span>
                        <input aria-label={`${label} closing time`} className="input" type="time" value={d.close} onChange={(e) => setDay(i, { close: e.target.value })} style={{ fontSize: 16, minHeight: 44, width: 130 }} />
                      </div>
                    )}
                    <label className="flex g6 center" style={{ fontSize: ".85rem", minHeight: 44 }}>
                      <input type="checkbox" checked={d.closed} onChange={(e) => setDay(i, e.target.checked ? { closed: true } : { closed: false, open: d.open || "09:00", close: d.close || "18:00" })} style={{ width: 20, height: 20 }} />
                      Closed
                    </label>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex g8 wrap" style={{ marginTop: 4 }}>
            <button className="btn btn-primary" disabled={saving} onClick={save} style={{ minHeight: 44 }}>{saving ? "Saving…" : "Save changes"}</button>
            <button className="btn btn-soft" disabled={saving} onClick={onClose} style={{ minHeight: 44 }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
