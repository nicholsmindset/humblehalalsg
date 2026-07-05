"use client";

/* Admin → Businesses: full listing management (split from admin.tsx following
   the admin-leads.tsx / admin-verdicts.tsx precedent).

   - List: GET /api/admin/listing?all=1 — every business INCLUDING suspended
     ones (useDirectory() only carries published rows, so a suspended listing
     would vanish from an admin list built on it).
   - Manage: edit whitelisted fields (incl. identity: name/category/area),
     Suspend/Restore (reversible takedown via status='suspended' — instantly
     hidden from every public surface), plus the per-business feature-override
     panel. Halal status is deliberately NOT editable here — it stays in the
     Halal-verification section (single-sourced via lib/verify-grant). */

import { useEffect, useState } from "react";
import { HHData } from "@/lib/data";
import type { FlagKey } from "@/lib/flags";
import { ATTRIBUTE_OPTIONS } from "@/lib/attributes";
import { useSupabaseBrowser } from "@/lib/supabase/client";
import { Empty, Icon } from "../ui";
import { FLAG_COPY } from "./admin-flag-copy";

/* ── Types (mirror /api/admin/listing selects) ─────────────────────────────── */
type AdminBizRow = {
  id: string; slug: string; name: string; cat_id: string | null; area: string | null;
  plan: string | null; status: string; halal_tier: string | null; featured: boolean | null;
  created_at: string;
};
type AdminBizFull = AdminBizRow & {
  phone: string | null; website: string | null; address: string | null; postal: string | null;
  description: string | null; price_level: string | null; attributes: string[] | null;
};

const EDIT_FIELDS = [
  ["name", "Business name"],
  ["area", "Area"],
  ["address", "Address"],
  ["postal", "Postal code"],
  ["phone", "Phone"],
  ["website", "Website"],
] as const;

const PRICE_LEVELS = ["", "$", "$$", "$$$", "$$$$"];
const STATUS_FILTERS = ["all", "published", "suspended"] as const;

function StatusChip({ status }: { status: string }) {
  const suspended = status === "suspended";
  return (
    <span className="pill-tag" style={suspended ? { background: "#FCEBEB", color: "#A32D2D" } : { background: "var(--emerald-50)", color: "var(--emerald)" }}>
      {suspended ? "Suspended" : status === "published" ? "Published" : status}
    </span>
  );
}

/* ── Per-business feature overrides (moved verbatim from admin.tsx) ──────────
   Only THREE flags are shown — the ones `resolveBusinessFlag` actually reads
   server-side (owner/ads/checkout, owner/cert, owner/leads/accept).
   `leadRouting` and `paidPlans` are intentionally excluded: their gates are
   evaluated before a businessId is resolvable, so a per-business override
   would never be read — a toggle for them would be misleading UI. The API's
   FEATURES array and DB constraint still allow all 5, forward-compatible. */
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
    // Reset synchronously so switching businesses never flashes the previous
    // business's On/Off state.
    const cleared: Record<string, boolean | null> = {};
    for (const k of BUSINESS_FEATURE_KEYS) cleared[k] = null;
    setValues(cleared);
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
    <div className="stack g10">
      <div className="faint" style={{ fontSize: ".78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em" }}>
        Features{loading ? " · loading…" : ""}
      </div>
      <div className="stack g10">
        {BUSINESS_FEATURE_KEYS.map((k) => (
          <BusinessFeatureRow key={k} flagKey={k} value={values[k] ?? null} onSet={(next) => setFeature(k, next)} />
        ))}
      </div>
    </div>
  );
}

/* ── Manage panel: editor + suspend/restore + features ─────────────────────── */
function BusinessManagePanel({ businessId, onClose, onChanged, toast, gotoVerification }: {
  businessId: string;
  onClose: () => void;
  onChanged: (row: Partial<AdminBizRow> & { id: string }) => void;
  toast: (msg: string) => void;
  gotoVerification: () => void;
}) {
  const [biz, setBiz] = useState<AdminBizFull | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [attrs, setAttrs] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [acting, setActing] = useState(false);
  const [loadErr, setLoadErr] = useState(false);

  useEffect(() => {
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
            name: d.business.name || "",
            cat_id: d.business.cat_id || "",
            area: d.business.area || "",
            address: d.business.address || "",
            postal: d.business.postal || "",
            phone: d.business.phone || "",
            website: d.business.website || "",
            description: d.business.description || "",
            price_level: d.business.price_level || "",
          });
          setAttrs(Array.isArray(d.business.attributes) ? d.business.attributes : []);
        } else setLoadErr(true);
      } catch { if (alive) setLoadErr(true); }
    })();
    return () => { alive = false; };
  }, [businessId]);

  if (loadErr) return <div className="card" style={{ padding: 20 }}><p className="faint" role="alert">Couldn&apos;t load this business — try again.</p></div>;
  if (!biz) return <div className="card" style={{ padding: 20, height: 120, opacity: 0.5 }} aria-busy="true" />;

  const suspended = biz.status === "suspended";
  const dirty =
    form.name !== (biz.name || "") || form.cat_id !== (biz.cat_id || "") || form.area !== (biz.area || "") ||
    form.address !== (biz.address || "") || form.postal !== (biz.postal || "") || form.phone !== (biz.phone || "") ||
    form.website !== (biz.website || "") || form.description !== (biz.description || "") ||
    form.price_level !== (biz.price_level || "") ||
    JSON.stringify([...attrs].sort()) !== JSON.stringify([...(biz.attributes || [])].sort());

  const save = async () => {
    if (!form.name.trim()) { toast("Business name is required."); return; }
    setSaving(true);
    try {
      const r = await fetch("/api/admin/listing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: biz.id, ...form, attributes: attrs }),
      });
      const d = (await r.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (d.ok) {
        const updated = { ...biz, ...form, attributes: attrs } as AdminBizFull;
        setBiz(updated);
        onChanged({ id: biz.id, name: form.name, cat_id: form.cat_id, area: form.area });
        toast("Listing updated.");
      } else toast(d.error === "name_required" ? "Business name is required." : "Couldn't save — try again.");
    } catch { toast("Couldn't save — try again."); }
    finally { setSaving(false); }
  };

  const act = async (action: "suspend" | "restore") => {
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
        onChanged({ id: biz.id, status: d.status });
        toast(action === "suspend" ? "Listing suspended — hidden from the public site." : "Listing restored.");
      } else toast("Couldn't update — try again.");
    } catch { toast("Couldn't update — try again."); }
    finally { setActing(false); }
  };

  const input = (k: string, extra?: Record<string, unknown>) => (
    <input className="input" value={form[k] ?? ""} onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))} {...extra} />
  );

  return (
    <div className="card" style={{ padding: 20 }}>
      <div className="flex between center wrap g8" style={{ marginBottom: 6 }}>
        <div>
          <div className="flex g8 center wrap">
            <h3 style={{ fontSize: "1.1rem" }}>{biz.name}</h3>
            <StatusChip status={biz.status} />
          </div>
          <p className="faint" style={{ fontSize: ".84rem" }}>
            {HHData.categories.find((c) => c.id === biz.cat_id)?.label || biz.cat_id} · {biz.area || "—"} · <span className="pill-tag">{biz.plan || "free"}</span>
          </p>
        </div>
        <div className="flex g8 center">
          <a className="btn btn-ghost btn-sm" href={`/business/${biz.slug}`} target="_blank" rel="noopener noreferrer">
            View public page <Icon name="arrow" size={14} />
          </a>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><Icon name="x" size={15} /> Close</button>
        </div>
      </div>

      {suspended && (
        <div className="notice notice-warn" style={{ marginBottom: 14 }}>
          <Icon name="info" size={18} />
          <span><strong>This listing is suspended</strong> — hidden from the directory, search, its page and the sitemap. Restore it below when resolved.</span>
        </div>
      )}

      {/* ── Edit form ── */}
      <div className="stack g12" style={{ marginTop: 8 }}>
        <div className="flex g10 wrap">
          <div className="field" style={{ flex: 2, minWidth: 220 }}><label>Business name</label>{input("name")}</div>
          <div className="field" style={{ flex: 1, minWidth: 160 }}>
            <label>Category</label>
            <select className="input" value={form.cat_id ?? ""} onChange={(e) => setForm((f) => ({ ...f, cat_id: e.target.value }))}>
              <option value="">—</option>
              {HHData.categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
        </div>
        <div className="flex g10 wrap">
          {EDIT_FIELDS.filter(([k]) => k !== "name").map(([k, label]) => (
            <div key={k} className="field" style={{ flex: 1, minWidth: 150 }}>
              <label>{label}</label>
              {input(k, k === "postal" ? { inputMode: "numeric", maxLength: 6 } : k === "phone" ? { type: "tel" } : k === "website" ? { type: "url", placeholder: "https://…" } : {})}
            </div>
          ))}
          <div className="field" style={{ minWidth: 110 }}>
            <label>Price</label>
            <select className="input" value={form.price_level ?? ""} onChange={(e) => setForm((f) => ({ ...f, price_level: e.target.value }))}>
              {PRICE_LEVELS.map((p) => <option key={p} value={p}>{p || "—"}</option>)}
            </select>
          </div>
        </div>
        <div className="field">
          <label>Description</label>
          <textarea className="input" rows={3} value={form.description ?? ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
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
        <div className="flex g8 center wrap" style={{ justifyContent: "space-between" }}>
          <div className="flex g8">
            <button className="btn btn-primary btn-sm" disabled={!dirty || saving} onClick={save}>
              {saving ? "Saving…" : dirty ? "Save changes" : "Saved"}
            </button>
          </div>
          {suspended ? (
            <button className="btn btn-soft btn-sm" disabled={acting} onClick={() => act("restore")}>
              <Icon name="check" size={15} /> {acting ? "Working…" : "Restore listing"}
            </button>
          ) : (
            <button className="btn btn-sm" style={{ background: "#FCEBEB", color: "#A32D2D" }} disabled={acting} onClick={() => act("suspend")}>
              <Icon name="x" size={15} /> {acting ? "Working…" : "Suspend listing"}
            </button>
          )}
        </div>
      </div>

      <div style={{ borderTop: "1px solid var(--line)", margin: "18px 0" }} />
      <BusinessFeaturesPanel businessId={biz.id} toast={toast} />
    </div>
  );
}

/* ── The section: list (all statuses) → Manage ─────────────────────────────── */
export function AdminBusinesses({ toast, gotoVerification }: { toast: (msg: string) => void; gotoVerification: () => void }) {
  const [rows, setRows] = useState<AdminBizRow[] | null>(null);
  const [loadErr, setLoadErr] = useState(false);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>("all");
  const [selected, setSelected] = useState<string | null>(null);

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
  }, []);

  const catLabel = (id: string | null) => HHData.categories.find((c) => c.id === id)?.label || id || "—";
  const filtered = (rows ?? [])
    .filter((r) => (statusFilter === "all" ? true : r.status === statusFilter))
    .filter((r) => (q ? `${r.name} ${catLabel(r.cat_id)} ${r.area ?? ""}`.toLowerCase().includes(q.toLowerCase()) : true));
  const suspendedCount = (rows ?? []).filter((r) => r.status === "suspended").length;

  // Local row patcher so edits/suspends reflect in the list without a refetch.
  const patchRow = (patch: Partial<AdminBizRow> & { id: string }) =>
    setRows((cur) => (cur ? cur.map((r) => (r.id === patch.id ? { ...r, ...patch } : r)) : cur));

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
          <div className="searchbar" style={{ maxWidth: 260, padding: "4px 4px 4px 12px" }}>
            <Icon name="search" className="lead" size={16} />
            <input placeholder="Search businesses…" value={q} onChange={(e) => setQ(e.target.value)} style={{ fontSize: ".86rem" }} aria-label="Search businesses" />
          </div>
        </div>
        {loadErr ? (
          <div style={{ padding: 24 }}><Empty icon="building" title="Couldn't load businesses" body="Check that you're signed in as an admin and try again." /></div>
        ) : rows && filtered.length === 0 ? (
          <div style={{ padding: 24 }}><Empty icon="building" title="No businesses" body={q ? `Nothing matches "${q}".` : statusFilter !== "all" ? `No ${statusFilter} businesses.` : "No businesses in the directory yet."} /></div>
        ) : (
          <div className="tbl-scroll"><table className="tbl">
            <thead><tr><th>Business</th><th>Category</th><th>Area</th><th>Status</th><th>Plan</th><th>Manage</th></tr></thead>
            <tbody>{filtered.slice(0, 200).map((r) => (
              <tr key={r.id} className="rowhover" style={{ background: selected === r.id ? "var(--cream-100)" : undefined }}>
                <td style={{ fontWeight: 700 }}>{r.name}</td>
                <td className="muted">{catLabel(r.cat_id)}</td>
                <td className="muted">{r.area || "—"}</td>
                <td><StatusChip status={r.status} /></td>
                <td><span className="pill-tag">{r.plan || "free"}</span></td>
                <td><button className="btn btn-soft btn-sm" onClick={() => setSelected(selected === r.id ? null : r.id)}>{selected === r.id ? "Close" : "Manage"}</button></td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </div>

      {selected && (
        <BusinessManagePanel
          businessId={selected}
          onClose={() => setSelected(null)}
          onChanged={patchRow}
          toast={toast}
          gotoVerification={gotoVerification}
        />
      )}
    </div>
  );
}
