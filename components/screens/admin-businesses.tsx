"use client";

/* Admin → Businesses: full listing management (split from admin.tsx following
   the admin-leads.tsx / admin-verdicts.tsx precedent).

   UX model: list → detail. Clicking Manage REPLACES the list with a full-width
   detail editor (back button returns) — the earlier below-the-table panel
   opened off-screen under 200 rows. "Add business" opens the same editor in
   create mode (the manual-add path; everything else arrives via the staging
   queue).

   - List: GET /api/admin/listing?all=1 — every business INCLUDING suspended.
   - Edit: whitelisted fields incl. identity (name/category/area), description,
     photos (cover = first photo; upload or add by URL) and amenities.
   - Suspend/Restore: reversible takedown via status='suspended'.
   - Halal status is deliberately NOT editable here — it stays in the
     Halal-verification section (single-sourced via lib/verify-grant). */

import { useEffect, useRef, useState } from "react";
import { HHData } from "@/lib/data";
import type { FlagKey } from "@/lib/flags";
import { ATTRIBUTE_OPTIONS } from "@/lib/attributes";
import { useSupabaseBrowser } from "@/lib/supabase/client";
import { Empty, Icon } from "../ui";
import { FLAG_COPY } from "./admin-flag-copy";

/* ── Types (mirror /api/admin/listing selects) ─────────────────────────────── */
type Photo = { url: string; caption?: string };
type AdminBizRow = {
  id: string; slug: string; name: string; cat_id: string | null; area: string | null;
  plan: string | null; status: string; halal_tier: string | null; featured: boolean | null;
  created_at: string;
};
type AdminBizFull = AdminBizRow & {
  phone: string | null; website: string | null; address: string | null; postal: string | null;
  description: string | null; price_level: string | null; attributes: string[] | null;
  photos: Photo[] | null;
};

const PRICE_LEVELS = ["", "$", "$$", "$$$", "$$$$"];
const STATUS_FILTERS = ["all", "published", "suspended"] as const;
const EMPTY_FORM = { name: "", cat_id: "", area: "", address: "", postal: "", phone: "", website: "", description: "", price_level: "" };

const catLabel = (id: string | null | undefined) => HHData.categories.find((c) => c.id === id)?.label || id || "—";
const fmtDate = (iso: string | null | undefined) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Singapore" });
};

function StatusChip({ status }: { status: string }) {
  const suspended = status === "suspended";
  return (
    <span className="pill-tag" style={suspended ? { background: "#FCEBEB", color: "#A32D2D" } : { background: "var(--emerald-50)", color: "var(--emerald)" }}>
      {suspended ? "Suspended" : status === "published" ? "Published" : status}
    </span>
  );
}

/* ── Per-business feature overrides ──────────────────────────────────────────
   Only THREE flags are shown — the ones `resolveBusinessFlag` actually reads
   server-side. `leadRouting`/`paidPlans` are excluded (their gates evaluate
   before a businessId is resolvable — a toggle would be misleading UI). */
const BUSINESS_FEATURE_KEYS: FlagKey[] = ["paidAds", "certVault", "paidLeads"];

function BusinessFeatureRow({ flagKey, value, onSet }: { flagKey: FlagKey; value: boolean | null; onSet: (next: boolean | null) => void }) {
  const { title, desc } = FLAG_COPY[flagKey];
  return (
    <div className="card" style={{ padding: 16, display: "flex", gap: 14, alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap" }}>
      <div style={{ flex: 1, minWidth: 220 }}>
        <h4 style={{ fontSize: ".96rem", marginBottom: 2 }}>{title}</h4>
        <p className="faint" style={{ fontSize: ".82rem", lineHeight: 1.4 }}>{desc}</p>
      </div>
      <div className="flex g6" role="group" aria-label={`${title} override`}>
        <button type="button" className={`chip ${value === null ? "active" : ""}`} aria-pressed={value === null} onClick={() => onSet(null)}>Default</button>
        <button type="button" className={`chip ${value === true ? "active" : ""}`} aria-pressed={value === true} onClick={() => onSet(true)}>On</button>
        <button type="button" className={`chip ${value === false ? "active" : ""}`} aria-pressed={value === false} onClick={() => onSet(false)}>Off</button>
      </div>
    </div>
  );
}

function BusinessFeaturesPanel({ businessId, toast }: { businessId: string; toast: (msg: string) => void }) {
  const supabase = useSupabaseBrowser();
  const [values, setValues] = useState<Record<string, boolean | null>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    const cleared: Record<string, boolean | null> = {};
    for (const k of BUSINESS_FEATURE_KEYS) cleared[k] = null;
    setValues(cleared); // sync reset — never flash the previous business's state
    (async () => {
      const base: Record<string, boolean | null> = {};
      for (const k of BUSINESS_FEATURE_KEYS) base[k] = null;
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from("business_feature_overrides")
            .select("feature_key, enabled")
            .eq("business_id", businessId);
          if (!error && Array.isArray(data)) {
            for (const row of data as { feature_key: string; enabled: boolean }[]) {
              if ((BUSINESS_FEATURE_KEYS as string[]).includes(row.feature_key)) base[row.feature_key] = row.enabled;
            }
          }
        } catch { /* fail soft → all Default */ }
      }
      if (alive) { setValues(base); setLoading(false); }
    })();
    return () => { alive = false; };
  }, [businessId, supabase]);

  const setFeature = async (feature: FlagKey, next: boolean | null) => {
    const prev = values[feature] ?? null;
    setValues((v) => ({ ...v, [feature]: next })); // optimistic
    try {
      const r = await fetch("/api/admin/business-flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, feature, enabled: next }),
      });
      const d = (await r.json().catch(() => ({}))) as { ok?: boolean };
      if (!d.ok) {
        setValues((v) => ({ ...v, [feature]: prev }));
        toast("Couldn't save — try again.");
      } else {
        toast(`${FLAG_COPY[feature].title} → ${next === null ? "Default" : next ? "On" : "Off"}`);
      }
    } catch {
      setValues((v) => ({ ...v, [feature]: prev }));
      toast("Couldn't save — try again.");
    }
  };

  return (
    <div className="card" style={{ padding: 20 }}>
      <h3 style={{ fontSize: "1.02rem", marginBottom: 4 }}>Feature overrides{loading ? " · loading…" : ""}</h3>
      <p className="faint" style={{ fontSize: ".82rem", marginBottom: 12 }}>Force a feature on/off for this business only. Default follows the global setting.</p>
      <div className="stack g10">
        {BUSINESS_FEATURE_KEYS.map((k) => (
          <BusinessFeatureRow key={k} flagKey={k} value={values[k] ?? null} onSet={(next) => setFeature(k, next)} />
        ))}
      </div>
    </div>
  );
}

/* ── Photos editor — cover (first) + gallery, upload or add by URL ─────────── */
function PhotosEditor({ photos, onChange, toast }: { photos: Photo[]; onChange: (next: Photo[]) => void; toast: (msg: string) => void }) {
  const [url, setUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const addUrl = () => {
    const u = url.trim();
    if (!u) return;
    if (!/^https:\/\//.test(u)) { toast("Image URL must start with https://"); return; }
    onChange([...photos, { url: u }]);
    setUrl("");
  };

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const r = await fetch("/api/admin/listing/photo", { method: "POST", body: fd });
      const d = (await r.json().catch(() => ({}))) as { ok?: boolean; url?: string; error?: string };
      if (d.ok && d.url) {
        onChange([...photos, { url: d.url }]);
        toast("Photo uploaded — remember to Save changes.");
      } else {
        toast(d.error === "too_large" ? "Image too large (max 5MB)." : d.error === "bad_type" ? "Use a JPG, PNG or WebP image." : "Upload failed — try again.");
      }
    } catch { toast("Upload failed — try again."); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ""; }
  };

  return (
    <div className="stack g12">
      {photos.length === 0 ? (
        <p className="faint" style={{ fontSize: ".86rem" }}>No photos yet — the public page shows a stock placeholder. Add a main image below.</p>
      ) : (
        <div className="flex g10 wrap">
          {photos.map((p, i) => (
            <div key={`${p.url}-${i}`} className="card" style={{ padding: 8, width: 160 }}>
              <div style={{ position: "relative" }}>
                {/* eslint-disable-next-line @next/next/no-img-element -- admin thumbs; bulk remote URLs stay unoptimized (lib/img.ts convention) */}
                <img src={p.url} alt={p.caption || `Photo ${i + 1}`} style={{ width: "100%", height: 90, objectFit: "cover", borderRadius: 8 }} />
                {i === 0 && <span className="pill-tag" style={{ position: "absolute", top: 6, left: 6, background: "var(--gold-100, #FBF3E0)", color: "#8A5A0B" }}>Cover</span>}
              </div>
              <input
                className="input" style={{ fontSize: ".78rem", marginTop: 6, padding: "4px 8px" }}
                placeholder="Caption (optional)" value={p.caption || ""} maxLength={120}
                onChange={(e) => onChange(photos.map((x, xi) => (xi === i ? { ...x, caption: e.target.value } : x)))}
                aria-label={`Caption for photo ${i + 1}`}
              />
              <div className="flex g6" style={{ marginTop: 6 }}>
                {i !== 0 && (
                  <button type="button" className="btn btn-soft btn-sm" style={{ fontSize: ".74rem", padding: "4px 8px" }}
                    onClick={() => onChange([photos[i], ...photos.filter((_, xi) => xi !== i)])}>
                    Make cover
                  </button>
                )}
                <button type="button" className="btn btn-sm" style={{ fontSize: ".74rem", padding: "4px 8px", background: "#FCEBEB", color: "#A32D2D" }}
                  onClick={() => onChange(photos.filter((_, xi) => xi !== i))}>
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex g8 wrap center">
        <button type="button" className="btn btn-soft btn-sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
          <Icon name="upload" size={15} /> {uploading ? "Uploading…" : "Upload image"}
        </button>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }} aria-label="Upload photo" />
        <span className="faint" style={{ fontSize: ".8rem" }}>or</span>
        <input className="input" style={{ flex: 1, minWidth: 220, fontSize: ".84rem" }} type="url" placeholder="https:// image URL"
          value={url} onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addUrl(); } }} aria-label="Add photo by URL" />
        <button type="button" className="btn btn-soft btn-sm" onClick={addUrl}>Add URL</button>
      </div>
      <p className="faint" style={{ fontSize: ".78rem" }}>The first photo is the main image shown in the directory and on the listing page. JPG/PNG/WebP up to 5MB.</p>
    </div>
  );
}

/* ── Detail editor — used for BOTH manage (edit) and create ─────────────────── */
function BusinessEditor({ businessId, onBack, onSaved, onRowChanged, onDeleted, toast, gotoVerification }: {
  businessId: string | null; // null = create mode
  onBack: () => void;
  onSaved: (row: AdminBizRow) => void;   // create-mode success
  onRowChanged: (row: Partial<AdminBizRow> & { id: string }) => void;
  onDeleted: (id: string) => void;       // hard-delete success
  toast: (msg: string) => void;
  gotoVerification: () => void;
}) {
  const creating = businessId === null;
  const [biz, setBiz] = useState<AdminBizFull | null>(null);
  const [form, setForm] = useState<Record<string, string>>({ ...EMPTY_FORM });
  const [attrs, setAttrs] = useState<string[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [saving, setSaving] = useState(false);
  const [acting, setActing] = useState(false);
  const [loadErr, setLoadErr] = useState(false);

  useEffect(() => {
    if (creating) { setBiz(null); setForm({ ...EMPTY_FORM }); setAttrs([]); setPhotos([]); return; }
    let alive = true;
    setBiz(null); setLoadErr(false);
    (async () => {
      try {
        const r = await fetch(`/api/admin/listing?id=${encodeURIComponent(businessId)}`);
        const d = (await r.json().catch(() => ({}))) as { ok?: boolean; business?: AdminBizFull };
        if (!alive) return;
        if (d.ok && d.business) {
          setBiz(d.business);
          setForm({
            name: d.business.name || "", cat_id: d.business.cat_id || "", area: d.business.area || "",
            address: d.business.address || "", postal: d.business.postal || "", phone: d.business.phone || "",
            website: d.business.website || "", description: d.business.description || "", price_level: d.business.price_level || "",
          });
          setAttrs(Array.isArray(d.business.attributes) ? d.business.attributes : []);
          setPhotos(Array.isArray(d.business.photos) ? d.business.photos : []);
        } else setLoadErr(true);
      } catch { if (alive) setLoadErr(true); }
    })();
    return () => { alive = false; };
  }, [businessId, creating]);

  const backBtn = (
    <button className="btn btn-ghost btn-sm" onClick={onBack}><Icon name="chevron" size={15} style={{ transform: "rotate(180deg)" }} /> All businesses</button>
  );

  if (!creating && loadErr) return <div className="stack g12">{backBtn}<div className="card" style={{ padding: 20 }}><p className="faint" role="alert">Couldn&apos;t load this business — try again.</p></div></div>;
  if (!creating && !biz) return <div className="stack g12">{backBtn}<div className="card" style={{ padding: 20, height: 140, opacity: 0.5 }} aria-busy="true" /></div>;

  const suspended = biz?.status === "suspended";
  const dirty = creating
    ? form.name.trim().length > 0
    : !!biz && (
      form.name !== (biz.name || "") || form.cat_id !== (biz.cat_id || "") || form.area !== (biz.area || "") ||
      form.address !== (biz.address || "") || form.postal !== (biz.postal || "") || form.phone !== (biz.phone || "") ||
      form.website !== (biz.website || "") || form.description !== (biz.description || "") ||
      form.price_level !== (biz.price_level || "") ||
      JSON.stringify([...attrs].sort()) !== JSON.stringify([...(biz.attributes || [])].sort()) ||
      JSON.stringify(photos) !== JSON.stringify(biz.photos || [])
    );

  const save = async () => {
    if (!form.name.trim()) { toast("Business name is required."); return; }
    setSaving(true);
    try {
      const payload = { ...form, attributes: attrs, photos };
      const r = await fetch("/api/admin/listing", {
        method: creating ? "PUT" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(creating ? payload : { id: biz!.id, ...payload }),
      });
      const d = (await r.json().catch(() => ({}))) as { ok?: boolean; error?: string; business?: AdminBizRow };
      if (d.ok) {
        if (creating && d.business) {
          toast(`"${d.business.name}" created and published.`);
          onSaved(d.business);
        } else if (biz) {
          const updated = { ...biz, ...form, attributes: attrs, photos } as AdminBizFull;
          setBiz(updated);
          onRowChanged({ id: biz.id, name: form.name, cat_id: form.cat_id, area: form.area });
          toast("Listing updated.");
        }
      } else toast(d.error === "name_required" ? "Business name is required." : "Couldn't save — try again.");
    } catch { toast("Couldn't save — try again."); }
    finally { setSaving(false); }
  };

  const act = async (action: "suspend" | "restore") => {
    if (!biz) return;
    const msg = action === "suspend"
      ? `Suspend "${biz.name}"?\n\nIt disappears from the directory, search, its detail page and the sitemap immediately. This is reversible (Restore).`
      : `Restore "${biz.name}" to the public directory?`;
    if (!confirm(msg)) return;
    let reason = "";
    if (action === "suspend") reason = prompt("Reason (recorded in the audit log):", "Not halal — removed after review") || "";
    setActing(true);
    try {
      const r = await fetch("/api/admin/listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: biz.id, action, reason }),
      });
      const d = (await r.json().catch(() => ({}))) as { ok?: boolean; status?: string };
      if (d.ok && d.status) {
        setBiz({ ...biz, status: d.status });
        onRowChanged({ id: biz.id, status: d.status });
        toast(action === "suspend" ? "Listing suspended — hidden from the public site." : "Listing restored.");
      } else toast("Couldn't update — try again.");
    } catch { toast("Couldn't update — try again."); }
    finally { setActing(false); }
  };

  const del = async () => {
    if (!biz) return;
    if (!confirm(`Delete "${biz.name}" permanently?\n\nThis removes the listing entirely (not reversible). Only works if it has no reviews, orders, certificates or other linked data — otherwise use Suspend. Best for mistaken or test entries.`)) return;
    const reason = prompt("Reason (recorded in the audit log):", "Mistaken/test entry") || "";
    setActing(true);
    try {
      const r = await fetch("/api/admin/listing", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: biz.id, action: "delete", reason }),
      });
      const d = (await r.json().catch(() => ({}))) as { ok?: boolean; deleted?: boolean; detail?: string };
      if (r.status === 409) { toast(d.detail || "Has linked data — suspend it instead."); return; }
      if (d.ok && d.deleted) { toast("Listing deleted."); onDeleted(biz.id); }
      else toast("Couldn't delete — try again.");
    } catch { toast("Couldn't delete — try again."); }
    finally { setActing(false); }
  };

  const input = (k: string, extra?: Record<string, unknown>) => (
    <input className="input" value={form[k] ?? ""} onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))} {...extra} />
  );

  return (
    <div className="stack g14">
      <div className="flex between center wrap g8">
        {backBtn}
        <div className="flex g8 center">
          {!creating && biz && (
            <a className="btn btn-ghost btn-sm" href={`/business/${biz.slug}`} target="_blank" rel="noopener noreferrer">
              View public page <Icon name="arrow" size={14} />
            </a>
          )}
          <button className="btn btn-primary btn-sm" disabled={!dirty || saving} onClick={save}>
            {saving ? "Saving…" : creating ? "Create & publish" : dirty ? "Save changes" : "Saved"}
          </button>
        </div>
      </div>

      <div className="flex g8 center wrap">
        <h3 style={{ fontSize: "1.2rem" }}>{creating ? "Add a business" : biz!.name}</h3>
        {!creating && biz && <StatusChip status={biz.status} />}
        {!creating && biz && <span className="pill-tag">{biz.plan || "free"}</span>}
      </div>

      {suspended && (
        <div className="notice notice-warn">
          <Icon name="info" size={18} />
          <span><strong>This listing is suspended</strong> — hidden from the directory, search, its page and the sitemap. Restore it below when resolved.</span>
        </div>
      )}

      {/* ── Details ── */}
      <div className="card" style={{ padding: 20 }}>
        <h3 style={{ fontSize: "1.02rem", marginBottom: 12 }}>Listing details</h3>
        <div className="stack g12">
          <div className="flex g10 wrap">
            <div className="field" style={{ flex: 2, minWidth: 220 }}><label>Business name</label>{input("name", { placeholder: "e.g. Warung Bumbu Rempah" })}</div>
            <div className="field" style={{ flex: 1, minWidth: 160 }}>
              <label>Category</label>
              <select className="input" value={form.cat_id ?? ""} onChange={(e) => setForm((f) => ({ ...f, cat_id: e.target.value }))}>
                <option value="">—</option>
                {HHData.categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div className="field" style={{ minWidth: 110 }}>
              <label>Price</label>
              <select className="input" value={form.price_level ?? ""} onChange={(e) => setForm((f) => ({ ...f, price_level: e.target.value }))}>
                {PRICE_LEVELS.map((p) => <option key={p} value={p}>{p || "—"}</option>)}
              </select>
            </div>
          </div>
          <div className="flex g10 wrap">
            <div className="field" style={{ flex: 1, minWidth: 150 }}><label>Area</label>{input("area", { placeholder: "e.g. Kampong Glam" })}</div>
            <div className="field" style={{ flex: 2, minWidth: 200 }}><label>Address</label>{input("address")}</div>
            <div className="field" style={{ minWidth: 120 }}><label>Postal code</label>{input("postal", { inputMode: "numeric", maxLength: 6 })}</div>
          </div>
          <div className="flex g10 wrap">
            <div className="field" style={{ flex: 1, minWidth: 150 }}><label>Phone</label>{input("phone", { type: "tel", placeholder: "+65 …" })}</div>
            <div className="field" style={{ flex: 2, minWidth: 200 }}><label>Website</label>{input("website", { type: "url", placeholder: "https://…" })}</div>
          </div>
          <div className="field">
            <label>Description</label>
            <textarea className="input" rows={3} value={form.description ?? ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="What makes this place special?" />
          </div>
          <div className="field">
            <label>Amenities</label>
            <div className="flex g6 wrap">
              {ATTRIBUTE_OPTIONS.map((a) => {
                const on = attrs.includes(a);
                return (
                  <button key={a} type="button" className={`chip ${on ? "active" : ""}`} aria-pressed={on}
                    onClick={() => setAttrs((cur) => (on ? cur.filter((x) => x !== a) : [...cur, a]))}>
                    {a}
                  </button>
                );
              })}
            </div>
          </div>
          <p className="faint" style={{ fontSize: ".8rem" }}>
            Halal status (MUIS / admin verification, certificates) is managed in the{" "}
            <button className="link-inline" style={{ background: "none", border: 0, padding: 0, cursor: "pointer", font: "inherit", color: "var(--emerald)" }} onClick={gotoVerification}>Halal verification</button>{" "}
            section — never edited here.
          </p>
        </div>
      </div>

      {/* ── Photos ── */}
      <div className="card" style={{ padding: 20 }}>
        <h3 style={{ fontSize: "1.02rem", marginBottom: 12 }}>Photos</h3>
        <PhotosEditor photos={photos} onChange={setPhotos} toast={toast} />
      </div>

      {!creating && biz && (
        <>
          <BusinessFeaturesPanel businessId={biz.id} toast={toast} />

          {/* ── Danger zone ── */}
          <div className="card" style={{ padding: 20, borderColor: "#F3C9C9" }}>
            <h3 style={{ fontSize: "1.02rem", marginBottom: 4 }}>{suspended ? "Restore listing" : "Remove from public site"}</h3>
            <p className="faint" style={{ fontSize: ".84rem", marginBottom: 12 }}>
              {suspended
                ? "Bring this listing back to the directory, search and its public page."
                : "Suspending hides this listing from the directory, search, its page and the sitemap immediately. Reversible — nothing is deleted."}
            </p>
            {suspended ? (
              <button className="btn btn-soft btn-sm" disabled={acting} onClick={() => act("restore")}>
                <Icon name="check" size={15} /> {acting ? "Working…" : "Restore listing"}
              </button>
            ) : (
              <button className="btn btn-sm" style={{ background: "#FCEBEB", color: "#A32D2D" }} disabled={acting} onClick={() => act("suspend")}>
                <Icon name="x" size={15} /> {acting ? "Working…" : "Suspend listing"}
              </button>
            )}
            {/* Permanent delete — only succeeds when there's no linked data
                (reviews/orders/certs/etc.); otherwise the server refuses and
                suggests Suspend. For mistaken/test entries. */}
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--line)" }}>
              <p className="faint" style={{ fontSize: ".84rem", marginBottom: 8 }}>Permanently delete this listing. Only works if it has no reviews, orders or certificates — otherwise suspend it. Best for mistaken or test entries.</p>
              <button className="btn btn-ghost btn-sm" style={{ color: "#A32D2D" }} disabled={acting} onClick={del}>
                <Icon name="x" size={15} /> {acting ? "Working…" : "Delete permanently"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Sticky save affordance at the bottom too — long form, easy access */}
      <div className="flex" style={{ justifyContent: "flex-end" }}>
        <button className="btn btn-primary" disabled={!dirty || saving} onClick={save}>
          {saving ? "Saving…" : creating ? "Create & publish" : dirty ? "Save changes" : "Saved"}
        </button>
      </div>
    </div>
  );
}

/* ── The section: list ⇄ detail ─────────────────────────────────────────────── */
type View = { mode: "list" } | { mode: "manage"; id: string } | { mode: "create" } | { mode: "import" };

export function AdminBusinesses({ toast, gotoVerification }: { toast: (msg: string) => void; gotoVerification: () => void }) {
  const [rows, setRows] = useState<AdminBizRow[] | null>(null);
  const [loadErr, setLoadErr] = useState(false);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>("all");
  const [view, setView] = useState<View>({ mode: "list" });
  const [refresh, setRefresh] = useState(0); // bumped after a bulk import publishes rows

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch("/api/admin/listing?all=1");
        const d = (await r.json().catch(() => ({}))) as { ok?: boolean; businesses?: AdminBizRow[] };
        if (!alive) return;
        if (d.ok && Array.isArray(d.businesses)) setRows(d.businesses);
        else { setRows([]); setLoadErr(true); }
      } catch { if (alive) { setRows([]); setLoadErr(true); } }
    })();
    return () => { alive = false; };
  }, [refresh]);

  const patchRow = (patch: Partial<AdminBizRow> & { id: string }) =>
    setRows((cur) => (cur ? cur.map((r) => (r.id === patch.id ? { ...r, ...patch } : r)) : cur));

  if (view.mode === "import") {
    return (
      <ImportPanel
        toast={toast}
        onBack={() => setView({ mode: "list" })}
        onPublished={() => { setView({ mode: "list" }); setRefresh((n) => n + 1); }}
      />
    );
  }

  if (view.mode !== "list") {
    return (
      <BusinessEditor
        businessId={view.mode === "manage" ? view.id : null}
        onBack={() => setView({ mode: "list" })}
        onSaved={(created) => { setRows((cur) => [created, ...(cur ?? [])]); setView({ mode: "manage", id: created.id }); }}
        onRowChanged={patchRow}
        onDeleted={(delId) => { setRows((cur) => (cur ?? []).filter((r) => r.id !== delId)); setView({ mode: "list" }); }}
        toast={toast}
        gotoVerification={gotoVerification}
      />
    );
  }

  const filtered = (rows ?? [])
    .filter((r) => (statusFilter === "all" ? true : r.status === statusFilter))
    .filter((r) => (q ? `${r.name} ${catLabel(r.cat_id)} ${r.area ?? ""}`.toLowerCase().includes(q.toLowerCase()) : true));
  const suspendedCount = (rows ?? []).filter((r) => r.status === "suspended").length;

  return (
    <div className="stack g16">
      <div className="card" style={{ overflow: "hidden" }}>
        <div className="admin-tablehead">
          <div className="flex g8 center wrap">
            <span className="tag">{rows ? `${rows.length} businesses` : "Loading…"}</span>
            {suspendedCount > 0 && <span className="pill-tag" style={{ background: "#FCEBEB", color: "#A32D2D" }}>{suspendedCount} suspended</span>}
            <div className="flex g6" role="group" aria-label="Filter by status">
              {STATUS_FILTERS.map((s) => (
                <button key={s} type="button" className={`chip ${statusFilter === s ? "active" : ""}`} aria-pressed={statusFilter === s} onClick={() => setStatusFilter(s)} style={{ textTransform: "capitalize" }}>{s}</button>
              ))}
            </div>
          </div>
          <div className="flex g8 center">
            <div className="searchbar" style={{ maxWidth: 240, padding: "4px 4px 4px 12px" }}>
              <Icon name="search" className="lead" size={16} />
              <input placeholder="Search businesses…" value={q} onChange={(e) => setQ(e.target.value)} style={{ fontSize: ".86rem" }} aria-label="Search businesses" />
            </div>
            <button className="btn btn-soft btn-sm" onClick={() => setView({ mode: "import" })}><Icon name="upload" size={15} /> Import CSV</button>
            <button className="btn btn-primary btn-sm" onClick={() => setView({ mode: "create" })}><Icon name="plus" size={15} /> Add business</button>
          </div>
        </div>
        {loadErr ? (
          <div style={{ padding: 24 }}><Empty icon="building" title="Couldn't load businesses" body="Check that you're signed in as an admin and try again." /></div>
        ) : rows && filtered.length === 0 ? (
          <div style={{ padding: 24 }}><Empty icon="building" title="No businesses" body={q ? `Nothing matches "${q}".` : statusFilter !== "all" ? `No ${statusFilter} businesses.` : "No businesses in the directory yet."} /></div>
        ) : (
          <div className="tbl-scroll"><table className="tbl">
            <thead><tr><th>Business</th><th>Category</th><th>Area</th><th>Status</th><th>Plan</th><th>Added</th><th>Manage</th></tr></thead>
            <tbody>{filtered.slice(0, 200).map((r) => (
              <tr key={r.id} className="rowhover">
                <td style={{ fontWeight: 700 }}>{r.name}</td>
                <td className="muted">{catLabel(r.cat_id)}</td>
                <td className="muted">{r.area || "—"}</td>
                <td><StatusChip status={r.status} /></td>
                <td><span className="pill-tag">{r.plan || "free"}</span></td>
                <td className="muted" style={{ whiteSpace: "nowrap" }}>{fmtDate(r.created_at)}</td>
                <td><button className="btn btn-soft btn-sm" onClick={() => setView({ mode: "manage", id: r.id })}>Manage</button></td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </div>
    </div>
  );
}

/* ── Bulk import (CSV → staging → batch approve) ───────────────────────────── */
type ImportRow = { row: number; name: string; status: "ok" | "duplicate" | "error"; reason?: string };
type ImportResult = { counts: { ok: number; duplicate: number; error: number }; report: ImportRow[]; committed?: boolean };

function ImportPanel({ toast, onBack, onPublished }: { toast: (m: string) => void; onBack: () => void; onPublished: () => void }) {
  const [csv, setCsv] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [committed, setCommitted] = useState(false);
  const [approving, setApproving] = useState(false);

  const readFile = (f: File | undefined) => {
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => { setCsv(String(reader.result || "")); setResult(null); setCommitted(false); };
    reader.readAsText(f);
  };

  const run = async (commit: boolean) => {
    setBusy(true);
    try {
      const r = await fetch("/api/admin/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv, commit }),
      });
      const d = (await r.json().catch(() => ({}))) as ImportResult & { ok?: boolean; error?: string };
      if (!d.ok) {
        toast(
          d.error === "missing_name_column" ? "The CSV needs a 'name' column — use the template." :
          d.error === "too_many_rows" ? "Max 500 rows per import — split the file." :
          d.error === "no_data_rows" ? "No data rows found below the header." :
          "Couldn't read that CSV — check the format against the template.",
        );
        return;
      }
      setResult(d);
      setCommitted(!!d.committed);
      if (d.committed) toast(`${d.counts.ok} listing${d.counts.ok === 1 ? "" : "s"} sent to the review queue`);
    } catch {
      toast("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  };

  const approveAll = async () => {
    setApproving(true);
    try {
      const r = await fetch("/api/admin/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "listings", action: "approve_all", source: "import" }),
      });
      const d = (await r.json().catch(() => ({}))) as { ok?: boolean; published?: number; failed?: number };
      if (d.ok) {
        toast(`${d.published ?? 0} published${d.failed ? ` · ${d.failed} left for manual review` : ""}`);
        onPublished();
      } else {
        toast("Couldn't batch-approve — review them in Listing approvals instead.");
      }
    } catch {
      toast("Network error — please try again.");
    } finally {
      setApproving(false);
    }
  };

  return (
    <div className="stack g16">
      <div className="flex g8 center">
        <button className="btn btn-ghost btn-sm" onClick={onBack}><Icon name="arrow" size={15} style={{ transform: "rotate(180deg)" }} /> Back to businesses</button>
      </div>
      <div className="card" style={{ padding: 20 }}>
        <h3 style={{ fontSize: "1.05rem" }}>Bulk import from a spreadsheet</h3>
        <p className="muted" style={{ fontSize: ".88rem", marginTop: 6 }}>
          Imported rows go to the <b>review queue</b> first — nothing publishes until you approve.
          Halal status is never set from a spreadsheet; verified badges stay in Halal verification.
        </p>
        <ol className="stack g10" style={{ marginTop: 14, paddingLeft: 18, fontSize: ".9rem" }}>
          <li>
            <a className="btn btn-soft btn-sm" href="/templates/business-import-template.csv" download>
              <Icon name="doc" size={15} /> Download the CSV template
            </a>
            <span className="muted" style={{ marginLeft: 8 }}>Google Sheets: File → Download → CSV. Only <b>name</b> is required.</span>
          </li>
          <li>
            <div className="stack g8" style={{ marginTop: 6 }}>
              <input type="file" accept=".csv,text/csv" aria-label="Upload CSV file" onChange={(e) => readFile(e.target.files?.[0])} />
              <textarea
                className="input"
                rows={6}
                placeholder={"…or paste CSV here (first row must be the header)\nname,category,area,address,…"}
                value={csv}
                onChange={(e) => { setCsv(e.target.value); setResult(null); setCommitted(false); }}
                style={{ fontFamily: "var(--mono, monospace)", fontSize: ".8rem" }}
              />
            </div>
          </li>
          <li>
            <div className="flex g8 center wrap" style={{ marginTop: 6 }}>
              <button className="btn btn-primary btn-sm" disabled={!csv.trim() || busy} onClick={() => run(false)}>
                {busy && !committed ? "Checking…" : "Validate"}
              </button>
              {result && !committed && result.counts.ok > 0 && (
                <button className="btn btn-gold btn-sm" disabled={busy} onClick={() => run(true)}>
                  Send {result.counts.ok} to review queue
                </button>
              )}
            </div>
          </li>
        </ol>
      </div>

      {result && (
        <div className="card" style={{ padding: 20 }}>
          <div className="flex g8 center wrap">
            <span className="pill-tag" style={{ background: "#E8F3EE", color: "var(--emerald)" }}>{result.counts.ok} ok</span>
            <span className="pill-tag">{result.counts.duplicate} duplicate{result.counts.duplicate === 1 ? "" : "s"}</span>
            <span className="pill-tag" style={{ background: "#FCEBEB", color: "#A32D2D" }}>{result.counts.error} error{result.counts.error === 1 ? "" : "s"}</span>
          </div>
          {committed && (
            <div className="flex g8 center wrap" style={{ marginTop: 12 }}>
              <button className="btn btn-primary btn-sm" disabled={approving} onClick={approveAll}>
                {approving ? "Publishing…" : "Approve all imported now"}
              </button>
              <span className="muted" style={{ fontSize: ".84rem" }}>…or review them one-by-one under Listing approvals.</span>
            </div>
          )}
          <div className="tbl-scroll" style={{ marginTop: 12, maxHeight: 320, overflowY: "auto" }}>
            <table className="tbl">
              <thead><tr><th>Row</th><th>Name</th><th>Status</th><th>Note</th></tr></thead>
              <tbody>
                {result.report.map((r) => (
                  <tr key={r.row}>
                    <td className="muted">{r.row}</td>
                    <td style={{ fontWeight: 600 }}>{r.name}</td>
                    <td>
                      <span className="pill-tag" style={r.status === "ok" ? { background: "#E8F3EE", color: "var(--emerald)" } : r.status === "error" ? { background: "#FCEBEB", color: "#A32D2D" } : undefined}>
                        {r.status}
                      </span>
                    </td>
                    <td className="muted" style={{ fontSize: ".82rem" }}>{r.reason || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
