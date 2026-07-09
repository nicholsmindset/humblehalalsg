"use client";

/* Admin — AI listing enrichment. Pick a business, draft an improved description +
   SEO with the AI, then review (edit if needed) and approve. Approving writes the
   reviewed text back to the live listing. NEVER auto-publishes; a draft claiming
   unverified halal certification is blocked server-side. */

import { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "../ui";

type Gen = { tagline: string; description: string; seoTitle: string; seoDescription: string; cuisineTags: string[]; highlights: string[] };
type Row = {
  id: string; business_id: string; business_slug: string; business_name: string;
  generated: Gen; source_input: { existingDescription?: string | null };
};
type Biz = { id: string; name: string; slug?: string; status?: string; area?: string };

export function AdminEnrichment({ toast }: { toast: (m: string) => void }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [busy, setBusy] = useState("");
  const [drafting, setDrafting] = useState("");
  const [biz, setBiz] = useState<Biz[]>([]);
  const [q, setQ] = useState("");
  const [edits, setEdits] = useState<Record<string, Partial<Gen>>>({});

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/enrich?status=pending");
      const d = await res.json();
      setRows(Array.isArray(d.enrichments) ? d.enrichments : []);
    } catch { setRows([]); }
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (alive) await load();
      try {
        const res = await fetch("/api/admin/listing?all=1");
        const d = await res.json();
        if (alive && Array.isArray(d.businesses)) setBiz(d.businesses);
      } catch { /* ignore */ }
    })();
    return () => { alive = false; };
  }, [load]);

  const matches = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (s.length < 2) return [];
    return biz.filter((b) => b.name?.toLowerCase().includes(s)).slice(0, 8);
  }, [q, biz]);

  const draft = async (businessId: string, name: string) => {
    setDrafting(businessId);
    try {
      const res = await fetch("/api/admin/enrich/draft", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ businessId }) });
      const d = await res.json();
      if (!res.ok || !d.ok) {
        toast(d.error === "ai_not_configured" ? "AI gateway not configured" : d.error === "not_enabled" ? "Enable LISTING_ENRICHMENT_ENABLED first" : "Draft failed");
      } else { toast(`Drafted enrichment for ${name}`); setQ(""); await load(); }
    } catch { toast("Draft failed"); }
    setDrafting("");
  };

  const act = async (row: Row, action: "approve" | "reject") => {
    setBusy(row.id);
    try {
      const e = edits[row.id] || {};
      const body = action === "approve"
        ? { id: row.id, action, description: e.description ?? row.generated.description, seoTitle: e.seoTitle ?? row.generated.seoTitle, seoDescription: e.seoDescription ?? row.generated.seoDescription }
        : { id: row.id, action };
      const res = await fetch("/api/admin/enrich", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const d = await res.json();
      if (res.status === 409 && d.error === "compliance_blocked") toast(d.reason || "Blocked: unverified halal-certified claim");
      else if (!res.ok || !d.ok) toast("Action failed");
      else { toast(action === "approve" ? "Approved & written to listing" : "Rejected"); await load(); }
    } catch { toast("Action failed"); }
    setBusy("");
  };

  const setEdit = (id: string, field: keyof Gen, value: string) => setEdits((m) => ({ ...m, [id]: { ...m[id], [field]: value } }));

  // Phase 2/3 — image acquisition. Keyed by business_id.
  const [photo, setPhoto] = useState<Record<string, { url?: string; busy?: boolean }>>({});
  const findPhoto = async (businessId: string) => {
    setPhoto((p) => ({ ...p, [businessId]: { ...p[businessId], busy: true } }));
    try {
      const res = await fetch("/api/admin/enrich/image", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ businessId, action: "find" }) });
      const d = await res.json();
      if (!res.ok || !d.ok) {
        toast(d.error === "firecrawl_not_configured" ? "Set FIRECRAWL_API_KEY first" : d.error === "no_photo_found" ? "No real photo found" : "Photo search failed");
        setPhoto((p) => ({ ...p, [businessId]: { busy: false } }));
      } else {
        toast(d.upscaled ? "Found + upscaled a photo" : "Found a photo");
        setPhoto((p) => ({ ...p, [businessId]: { url: d.candidateUrl, busy: false } }));
      }
    } catch { toast("Photo search failed"); setPhoto((p) => ({ ...p, [businessId]: { busy: false } })); }
  };
  const applyPhoto = async (businessId: string, candidateUrl: string) => {
    setPhoto((p) => ({ ...p, [businessId]: { ...p[businessId], busy: true } }));
    try {
      const res = await fetch("/api/admin/enrich/image", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ businessId, action: "apply", candidateUrl }) });
      const d = await res.json();
      toast(res.ok && d.ok ? "Photo applied to listing" : "Apply failed");
    } catch { toast("Apply failed"); }
    setPhoto((p) => ({ ...p, [businessId]: { url: undefined, busy: false } }));
  };

  return (
    <div className="stack g16">
      <div className="notice notice-warn">
        <span><strong>Human-in-the-loop:</strong> AI drafts an improved description + SEO from the owner-submitted facts only. Nothing is written to the live listing until you approve. Drafts that claim halal certification for a non-certified business are blocked.</span>
      </div>

      {/* Business picker */}
      <div className="card" style={{ padding: 16 }}>
        <h3 style={{ fontSize: "1.1rem", marginBottom: 10 }}>Enrich a listing</h3>
        <div className="field">
          <label htmlFor="enr-q">Find a business</label>
          <input id="enr-q" className="input" placeholder="Search by name…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {matches.length > 0 && (
          <div className="stack g6" style={{ marginTop: 8 }}>
            {matches.map((b) => (
              <div key={b.id} className="flex between center wrap g8" style={{ padding: "6px 4px", borderTop: "1px solid var(--line,#e7e2d6)" }}>
                <div className="flex g8 center"><strong>{b.name}</strong>{b.area && <span className="faint" style={{ fontSize: ".78rem" }}>{b.area}</span>}{b.status && b.status !== "published" && <span className="pill-tag amber">{b.status}</span>}</div>
                <button className="btn btn-primary btn-sm" disabled={drafting === b.id} onClick={() => draft(b.id, b.name)}><Icon name="sparkles" size={15} /> {drafting === b.id ? "Drafting…" : "Draft with AI"}</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending queue */}
      <h3 style={{ fontSize: "1.1rem" }}>Pending review</h3>
      {rows === null ? (
        <div className="card" style={{ padding: 24, height: 90, opacity: 0.5 }} aria-busy="true" />
      ) : rows.length === 0 ? (
        <div className="card" style={{ padding: 22, textAlign: "center" }}><p className="faint">No enrichments pending. Find a business above to draft one.</p></div>
      ) : (
        rows.map((r) => {
          const e = edits[r.id] || {};
          return (
            <div key={r.id} className="card" style={{ padding: 16 }}>
              <div className="flex between center wrap g8">
                <div className="flex g8 center"><strong>{r.business_name}</strong>{r.generated.cuisineTags?.slice(0, 3).map((t) => <span key={t} className="pill-tag">{t}</span>)}</div>
                <code style={{ fontSize: ".78rem", color: "var(--ink-soft,#5b6d64)" }}>/business/{r.business_slug}</code>
              </div>

              {r.source_input?.existingDescription ? (
                <details style={{ marginTop: 8 }}>
                  <summary className="faint" style={{ fontSize: ".82rem", cursor: "pointer" }}>Before (owner-submitted)</summary>
                  <p className="faint" style={{ marginTop: 6, fontSize: ".85rem" }}>{r.source_input.existingDescription}</p>
                </details>
              ) : <p className="faint" style={{ marginTop: 6, fontSize: ".82rem" }}>No original description — this fills a blank listing.</p>}

              <div className="stack g8" style={{ marginTop: 10 }}>
                <div className="field">
                  <label>Description <span className="hint">(editable)</span></label>
                  <textarea className="textarea" rows={3} value={e.description ?? r.generated.description} onChange={(ev) => setEdit(r.id, "description", ev.target.value)} />
                </div>
                <div className="grid2" style={{ gap: 10 }}>
                  <div className="field">
                    <label>SEO title</label>
                    <input className="input" value={e.seoTitle ?? r.generated.seoTitle} onChange={(ev) => setEdit(r.id, "seoTitle", ev.target.value)} />
                  </div>
                  <div className="field">
                    <label>SEO description</label>
                    <input className="input" value={e.seoDescription ?? r.generated.seoDescription} onChange={(ev) => setEdit(r.id, "seoDescription", ev.target.value)} />
                  </div>
                </div>
                {r.generated.highlights?.length > 0 && <p className="faint" style={{ fontSize: ".82rem" }}><strong>Highlights:</strong> {r.generated.highlights.join(" · ")}</p>}
              </div>

              {/* Phase 2/3 — real photo acquisition (Firecrawl + optional upscale). */}
              <div className="stack g8" style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--line,#e7e2d6)" }}>
                <div className="flex between center wrap g8">
                  <span className="faint" style={{ fontSize: ".82rem" }}><strong>Listing photo</strong> — find a real image from the web</span>
                  <button className="btn btn-soft btn-sm" disabled={photo[r.business_id]?.busy} onClick={() => findPhoto(r.business_id)}>
                    <Icon name="image" size={14} /> {photo[r.business_id]?.busy ? "Searching…" : "Find real photo"}
                  </button>
                </div>
                {photo[r.business_id]?.url && (
                  <div className="flex g10 center wrap">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo[r.business_id].url} alt="candidate" style={{ width: 120, height: 80, objectFit: "cover", borderRadius: 8, border: "1px solid var(--line,#e7e2d6)" }} />
                    <button className="btn btn-primary btn-sm" disabled={photo[r.business_id]?.busy} onClick={() => applyPhoto(r.business_id, photo[r.business_id].url as string)}><Icon name="check" size={14} /> Use this photo</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setPhoto((p) => ({ ...p, [r.business_id]: { url: undefined } }))}>Discard</button>
                  </div>
                )}
              </div>

              <div className="flex g8 wrap" style={{ marginTop: 12 }}>
                <button className="btn btn-primary btn-sm" disabled={busy === r.id} onClick={() => act(r, "approve")}><Icon name="check" size={15} /> Approve &amp; write to listing</button>
                <button className="btn btn-ghost btn-sm" disabled={busy === r.id} onClick={() => act(r, "reject")}>Reject</button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
