"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { Icon, ImagePh } from "../ui";

export type PendingSubmission = { id: string; kind: "listing" | "claim"; name: string; status: string; created_at: string };
type Form = { name: string; desc: string; phone: string; whatsapp: string; cat: string; address: string; region: string; town: string; postal: string; halal: string; certNo: string; photoUrls: string[] };
const EMPTY: Form = { name: "", desc: "", phone: "", whatsapp: "", cat: "", address: "", region: "", town: "", postal: "", halal: "", certNo: "", photoUrls: [] };

export function PendingListingEditButton({ id, onSaved, label = "Edit" }: { id: string; onSaved?: (name?: string) => void; label?: string }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement | null>(null);
  const set = (key: keyof Form, value: string | string[]) => setForm((current) => ({ ...current, [key]: value }));

  const launch = async () => {
    setBusy(true); setError("");
    try {
      const res = await fetch(`/api/owner/submissions/${encodeURIComponent(id)}`);
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) throw new Error(json?.reason || "load_failed");
      setForm({ ...EMPTY, ...json.submission, photoUrls: Array.isArray(json.submission?.photoUrls) ? json.submission.photoUrls : [] });
      setOpen(true);
    } catch { setError("Couldn’t open this submission."); }
    finally { setBusy(false); }
  };
  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []); event.target.value = "";
    if (!files.length) return;
    setUploading(true); setError("");
    try {
      for (const file of files) {
        if (form.photoUrls.length >= 6) break;
        const data = new FormData(); data.set("file", file);
        const res = await fetch(`/api/owner/submissions/${encodeURIComponent(id)}/photo`, { method: "POST", body: data });
        const json = await res.json().catch(() => null);
        if (!res.ok || !json?.url) { setError("One of the images couldn’t be uploaded. Use JPG, PNG, WebP or AVIF under 5MB."); continue; }
        setForm((current) => current.photoUrls.length < 6 ? { ...current, photoUrls: [...current.photoUrls, json.url] } : current);
      }
    } finally { setUploading(false); }
  };
  const save = async () => {
    if (form.name.trim().length < 2) { setError("Business name is required."); return; }
    setBusy(true); setError("");
    try {
      const res = await fetch(`/api/owner/submissions/${encodeURIComponent(id)}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(form) });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) throw new Error(json?.reason || "save_failed");
      setOpen(false); onSaved?.(form.name.trim());
    } catch { setError("Couldn’t save these changes. The submission may no longer be editable."); }
    finally { setBusy(false); }
  };

  return (
    <>
      <button className="btn btn-soft btn-sm" disabled={busy} onClick={launch}><Icon name="edit" size={15} /> {busy ? "Opening…" : label}</button>
      {error && !open && <span className="field-error" style={{ fontSize: ".78rem" }}>{error}</span>}
      {open && <div className="modal-veil" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
        <section className="modal" role="dialog" aria-modal="true" aria-label="Edit pending business" style={{ maxWidth: 720, maxHeight: "90vh", overflowY: "auto" }}>
          <div className="flex between center"><div><span className="pill-tag amber">Pending review</span><h2 style={{ marginTop: 7 }}>Edit business submission</h2></div><button className="btn btn-ghost btn-sm" onClick={() => setOpen(false)} aria-label="Close"><Icon name="x" size={18} /></button></div>
          <p className="muted" style={{ margin: "8px 0 16px" }}>Changes stay in the moderation queue. You can update details and reorder or remove images before approval.</p>
          <div className="grid-2 g12">
            <div className="field"><label htmlFor="ps-name">Business name</label><input id="ps-name" className="input" value={form.name} onChange={(e) => set("name", e.target.value)} /></div>
            <div className="field"><label htmlFor="ps-cat">Category</label><input id="ps-cat" className="input" value={form.cat} onChange={(e) => set("cat", e.target.value)} /></div>
            <div className="field"><label htmlFor="ps-phone">Phone</label><input id="ps-phone" className="input" value={form.phone} onChange={(e) => set("phone", e.target.value)} /></div>
            <div className="field"><label htmlFor="ps-whatsapp">WhatsApp</label><input id="ps-whatsapp" className="input" value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} /></div>
            <div className="field" style={{ gridColumn: "1 / -1" }}><label htmlFor="ps-desc">Description</label><textarea id="ps-desc" className="input" rows={4} value={form.desc} onChange={(e) => set("desc", e.target.value)} /></div>
            <div className="field" style={{ gridColumn: "1 / -1" }}><label htmlFor="ps-address">Address</label><input id="ps-address" className="input" value={form.address} onChange={(e) => set("address", e.target.value)} /></div>
            <div className="field"><label htmlFor="ps-town">Town / area</label><input id="ps-town" className="input" value={form.town} onChange={(e) => set("town", e.target.value)} /></div>
            <div className="field"><label htmlFor="ps-postal">Postal code</label><input id="ps-postal" className="input" value={form.postal} onChange={(e) => set("postal", e.target.value)} /></div>
            <div className="field"><label htmlFor="ps-halal">Halal status</label><input id="ps-halal" className="input" value={form.halal} onChange={(e) => set("halal", e.target.value)} /></div>
            <div className="field"><label htmlFor="ps-cert-no">Certificate number</label><input id="ps-cert-no" className="input" value={form.certNo} onChange={(e) => set("certNo", e.target.value)} /></div>
          </div>
          <div style={{ marginTop: 16 }}><div className="flex between center"><strong>Business images</strong><button className="btn btn-outline btn-sm" disabled={uploading || form.photoUrls.length >= 6} onClick={() => input.current?.click()}><Icon name="camera" size={15} /> {uploading ? "Uploading…" : "Add images"}</button></div><input ref={input} hidden type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple onChange={upload} />
            <div className="grid-3 g8" style={{ marginTop: 10 }}>{form.photoUrls.map((url, index) => <div key={`${url}-${index}`} className="card" style={{ overflow: "hidden", position: "relative" }}><ImagePh src={url} label={`Business image ${index + 1}`} style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", display: "block", borderRadius: 0 }} /><button className="btn btn-ghost btn-sm" style={{ position: "absolute", top: 4, right: 4, background: "#fff" }} onClick={() => set("photoUrls", form.photoUrls.filter((_, i) => i !== index))} aria-label={`Remove image ${index + 1}`}><Icon name="x" size={14} /></button><div className="flex center g4" style={{ padding: 5 }}><button className="btn btn-ghost btn-sm" disabled={index === 0} onClick={() => { const next = [...form.photoUrls]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; set("photoUrls", next); }}>←</button><span className="faint">{index + 1}</span><button className="btn btn-ghost btn-sm" disabled={index === form.photoUrls.length - 1} onClick={() => { const next = [...form.photoUrls]; [next[index], next[index + 1]] = [next[index + 1], next[index]]; set("photoUrls", next); }}>→</button></div></div>)}</div>
          </div>
          {error && <p className="field-error" style={{ marginTop: 12 }}>{error}</p>}
          <div className="flex end g8" style={{ marginTop: 18 }}><button className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button><button className="btn btn-primary" disabled={busy || uploading} onClick={save}>{busy ? "Saving…" : "Save changes"}</button></div>
        </section>
      </div>}
    </>
  );
}

export function PendingSubmissions({ items }: { items: PendingSubmission[] }) {
  const [names, setNames] = useState<Record<string, string>>({});
  if (!items.length) return null;
  return <div className="stack g10" style={{ marginBottom: 14 }}>{items.map((s) => <div key={`${s.kind}-${s.id}`} className="card" style={{ display: "flex", gap: 12, padding: 14, alignItems: "center", flexWrap: "wrap" }}><div className="empty-ico" style={{ width: 40, height: 40, borderRadius: 11, background: "var(--cream-200)", flex: "none" }}><Icon name={s.kind === "claim" ? "shield-check" : "store"} size={19} /></div><div className="f1" style={{ minWidth: 160 }}><div className="flex g8 center wrap"><span className="pill-tag amber">In review</span><span style={{ fontWeight: 700 }}>{names[s.id] || s.name}</span></div><p className="faint" style={{ fontSize: ".82rem", marginTop: 3 }}>{s.kind === "claim" ? "Ownership claim" : "New listing"} · submitted {new Date(s.created_at).toLocaleDateString("en-SG", { day: "numeric", month: "short" })}. We’ll email you after review.</p></div>{s.kind === "listing" && <PendingListingEditButton id={s.id} onSaved={(name) => setNames((current) => ({ ...current, [s.id]: name || s.name }))} />}</div>)}</div>;
}
