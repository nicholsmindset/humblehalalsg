"use client";

/* Admin — TikTok video review queue. Users submit TikToks about listings; each
   lands here as 'pending'. Run the AI classifier (food-related? safe? which
   business?), then review and approve — approving attaches the video to the
   matched listing so it renders as a consent-gated embed. Featuring a video
   never changes a listing's halal status; unsafe/off-topic drafts are gated. */

import { useCallback, useEffect, useState } from "react";
import { Icon } from "../ui";

type Gen = {
  foodRelated?: boolean; matchedBusinessSlug?: string; confidence?: number;
  captionSummary?: string; sentiment?: string; safe?: boolean; reason?: string;
};
type Row = {
  id: string; url: string; video_id: string | null; handle: string | null;
  submitter_email: string | null; note: string | null; status: string;
  claimed_business_id: string | null; matched_business_id: string | null;
  generated: Gen; model: string | null; created_at: string;
};
type BizMap = Record<string, { name: string; slug: string }>;

const TABS: [string, string][] = [["pending", "Pending"], ["approved", "Approved"], ["rejected", "Rejected"], ["removed", "Removed"]];

export function AdminTiktok({ toast }: { toast: (m: string) => void }) {
  const [tab, setTab] = useState("pending");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [biz, setBiz] = useState<BizMap>({});
  const [busy, setBusy] = useState("");
  const [slugEdit, setSlugEdit] = useState<Record<string, string>>({});

  const load = useCallback(async (status: string) => {
    setRows(null);
    try {
      const res = await fetch(`/api/admin/tiktok?status=${status}`);
      const d = await res.json();
      setRows(Array.isArray(d.submissions) ? d.submissions : []);
      setBiz(d.businesses || {});
    } catch { setRows([]); }
  }, []);

  useEffect(() => { load(tab); }, [tab, load]);

  const classify = async (row: Row) => {
    setBusy(row.id);
    try {
      const res = await fetch("/api/admin/tiktok/draft", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: row.id }) });
      const d = await res.json();
      if (!res.ok || !d.ok) toast(d.error === "ai_not_configured" ? "Set AI_GATEWAY_API_KEY first" : d.error === "not_enabled" ? "Enable TIKTOK_UGC_ENABLED first" : "Classify failed");
      else { toast("AI classified this video"); await load(tab); }
    } catch { toast("Classify failed"); }
    setBusy("");
  };

  const act = async (row: Row, action: "approve" | "reject" | "remove") => {
    setBusy(row.id);
    try {
      const businessSlug = slugEdit[row.id]?.trim() || undefined;
      const res = await fetch("/api/admin/tiktok", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: row.id, action, businessSlug }) });
      const d = await res.json();
      if (res.status === 409 && d.error === "compliance_blocked") toast(d.reason || "Blocked — review the video first");
      else if (res.status === 422 && d.error === "no_match") toast(d.reason || "Set a business slug before approving");
      else if (!res.ok || !d.ok) toast("Action failed");
      else { toast(action === "approve" ? "Approved — now live on the listing" : action === "remove" ? "Removed" : "Rejected"); await load(tab); }
    } catch { toast("Action failed"); }
    setBusy("");
  };

  return (
    <div className="stack g16">
      <div className="notice notice-warn">
        <span><strong>Human-in-the-loop:</strong> AI drafts a classification + place-match from the link, handle and note only — it never publishes. Approving attaches the video to a listing; it does <strong>not</strong> certify the business as halal. Unsafe or off-topic videos are gated.</span>
      </div>

      <div className="flex g8 wrap" role="tablist" aria-label="TikTok queue">
        {TABS.map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} className={`filter-chip ${tab === id ? "on" : ""}`} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      {rows === null ? (
        <div className="card" style={{ padding: 24, height: 90, opacity: 0.5 }} aria-busy="true" />
      ) : rows.length === 0 ? (
        <div className="card" style={{ padding: 22, textAlign: "center" }}><p className="faint">No {tab} videos.</p></div>
      ) : (
        rows.map((r) => {
          const g = r.generated || {};
          const matched = r.matched_business_id ? biz[r.matched_business_id] : undefined;
          const claimed = r.claimed_business_id ? biz[r.claimed_business_id] : undefined;
          const hasDraft = g.safe !== undefined;
          return (
            <div key={r.id} className="card" style={{ padding: 16 }}>
              <div className="flex between center wrap g8">
                <a className="link-inline" href={r.url} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 700, wordBreak: "break-all" }}>
                  <Icon name="play" size={14} /> {r.handle ? `@${r.handle}` : r.url}
                </a>
                <span className="faint" style={{ fontSize: ".78rem" }}>{new Date(r.created_at).toLocaleDateString()}</span>
              </div>

              <div className="flex g8 wrap" style={{ marginTop: 6, fontSize: ".82rem" }}>
                {matched && <span className="pill-tag emerald">Matched: {matched.name}</span>}
                {!matched && claimed && <span className="pill-tag">Submitter: {claimed.name}</span>}
                {r.submitter_email && <span className="faint">{r.submitter_email}</span>}
                {!r.video_id && <span className="pill-tag amber">short link — open to confirm id</span>}
              </div>

              {r.note && <p className="faint" style={{ marginTop: 8, fontSize: ".85rem" }}><strong>Note:</strong> {r.note}</p>}

              {hasDraft ? (
                <div className="stack g6" style={{ marginTop: 10, padding: 10, background: "var(--wash,#f6f4ee)", borderRadius: 8 }}>
                  <div className="flex g8 wrap center" style={{ fontSize: ".8rem" }}>
                    <span className={`pill-tag ${g.safe ? "emerald" : "red"}`}>{g.safe ? "safe" : "unsafe?"}</span>
                    <span className={`pill-tag ${g.foodRelated ? "emerald" : "amber"}`}>{g.foodRelated ? "food-related" : "not food?"}</span>
                    {g.sentiment && <span className="pill-tag">{g.sentiment}</span>}
                    {typeof g.confidence === "number" && <span className="faint">match {(g.confidence * 100).toFixed(0)}%</span>}
                    {g.matchedBusinessSlug && <code style={{ fontSize: ".76rem" }}>/business/{g.matchedBusinessSlug}</code>}
                  </div>
                  {g.captionSummary && <p style={{ fontSize: ".85rem", margin: 0 }}>{g.captionSummary}</p>}
                  {g.reason && <p className="faint" style={{ fontSize: ".78rem", margin: 0 }}>{g.reason}</p>}
                </div>
              ) : (
                <p className="faint" style={{ marginTop: 8, fontSize: ".82rem" }}>Not yet classified — run the AI to draft a match.</p>
              )}

              {tab === "pending" && (
                <>
                  <div className="field" style={{ marginTop: 10 }}>
                    <label htmlFor={`slug-${r.id}`}>Attach to business (slug) <span className="hint">— overrides the AI/submitter match</span></label>
                    <input id={`slug-${r.id}`} className="input" placeholder={g.matchedBusinessSlug || claimed?.slug || "business-slug"} value={slugEdit[r.id] ?? ""} onChange={(e) => setSlugEdit((m) => ({ ...m, [r.id]: e.target.value }))} />
                  </div>
                  <div className="flex g8 wrap" style={{ marginTop: 12 }}>
                    <button className="btn btn-soft btn-sm" disabled={busy === r.id} onClick={() => classify(r)}><Icon name="sparkles" size={15} /> {busy === r.id ? "Working…" : hasDraft ? "Re-classify" : "Classify with AI"}</button>
                    <button className="btn btn-primary btn-sm" disabled={busy === r.id} onClick={() => act(r, "approve")}><Icon name="check" size={15} /> Approve &amp; feature</button>
                    <button className="btn btn-ghost btn-sm" disabled={busy === r.id} onClick={() => act(r, "reject")}>Reject</button>
                  </div>
                </>
              )}
              {tab === "approved" && (
                <div className="flex g8 wrap" style={{ marginTop: 12 }}>
                  <button className="btn btn-ghost btn-sm" disabled={busy === r.id} onClick={() => act(r, "remove")}><Icon name="x" size={15} /> Remove from listing</button>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
