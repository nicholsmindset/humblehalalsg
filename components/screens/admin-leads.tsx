"use client";

/* Admin lead pipeline — the beta control surface for the lead marketplace.
   Lists incoming quote requests with a matched-vendor preview, a one-click
   Route action, and spam/close. Coverage gaps (fewer than 3 matches) are
   flagged so the team knows which verticals/areas to pitch. */

import { useCallback, useEffect, useState } from "react";
import { Icon } from "../ui";
import { waHref } from "@/lib/contact";
import { LEAD_VERTICALS } from "@/lib/lead-verticals";

type Candidate = { id: string; name: string; plan: string | null; hasQuota: boolean };
type RouteInfo = {
  business_id: string; status: string;
  mode?: string | null; delivery?: string | null; deliveredAt?: string | null; expiresAt?: string | null;
  businessName?: string | null; businessPhone?: string | null;
};
type AdminLead = {
  id: string; name: string | null; email: string | null; phone: string | null;
  vertical: string; verticalId: string | null;
  area: string | null; budget: string | null; when: string | null; details: string | null;
  status: string; consent: boolean; createdAt: string; sourceSlug: string | null;
  routes: RouteInfo[];
  match: { count: number; gap: boolean; candidates: Candidate[] } | null;
};

const FILTERS: [string, string][] = [["new", "New"], ["routed", "Routed"], ["contacted", "In progress"], ["", "All"]];

/* Funnel stats — captures by surface + route→accept + free-taste→claim. */
type Stats = {
  windowDays: number;
  leads: { total: number; consented: number; bySurface: Record<string, number> };
  routes: { sent: number; accepted: number; expired: number; exclusive: number; freeSent: number };
  acceptRate: number;
  freeTaste: { sent: number; claimed: number | null };
};
function LeadStats() {
  const [s, setS] = useState<Stats | null>(null);
  useEffect(() => {
    let alive = true;
    (async () => {
      try { const d = await (await fetch("/api/admin/leads/stats?days=30")).json(); if (alive && d?.ok) setS(d); }
      catch { /* silent */ }
    })();
    return () => { alive = false; };
  }, []);
  if (!s) return null;
  const Tile = ({ label, value, sub }: { label: string; value: string | number; sub?: string }) => (
    <div className="card" style={{ padding: "10px 14px", flex: "1 1 130px", minWidth: 120 }}>
      <div style={{ fontSize: "1.5rem", fontWeight: 800 }}>{value}</div>
      <div className="faint" style={{ fontSize: ".76rem" }}>{label}</div>
      {sub && <div className="faint" style={{ fontSize: ".72rem", marginTop: 2 }}>{sub}</div>}
    </div>
  );
  const topSurface = Object.entries(s.leads.bySurface).sort((a, b) => b[1] - a[1])[0];
  return (
    <div className="flex g8 wrap">
      <Tile label={`Leads · last ${s.windowDays}d`} value={s.leads.total} sub={`${s.leads.consented} consented`} />
      <Tile label="Top source" value={topSurface && topSurface[1] > 0 ? topSurface[0] : "—"} sub={topSurface ? `${topSurface[1]} leads` : undefined} />
      <Tile label="Accept rate" value={`${s.acceptRate}%`} sub={`${s.routes.accepted}/${s.routes.sent} routes`} />
      <Tile label="Free leads sent" value={s.freeTaste.sent} sub={s.freeTaste.claimed != null ? `${s.freeTaste.claimed} claimed` : undefined} />
      <Tile label="Cascade expiries" value={s.routes.expired} />
    </div>
  );
}

/* Per-surface capture toggles (jsonb; master flag lives on the Monetization tab). */
function CaptureSettings({ toast }: { toast: (m: string) => void }) {
  const [surfaces, setSurfaces] = useState<Record<string, boolean> | null>(null);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const d = await (await fetch("/api/admin/lead-settings")).json();
        if (alive && d?.surfaces) setSurfaces(d.surfaces);
      } catch { if (alive) setSurfaces(null); }
    })();
    return () => { alive = false; };
  }, []);
  const flip = async (k: string) => {
    if (!surfaces) return;
    const next = { ...surfaces, [k]: !surfaces[k] };
    setSurfaces(next);
    try {
      const r = await fetch("/api/admin/lead-settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ surfaces: { [k]: next[k] } }) });
      if (!(await r.json())?.ok) throw new Error();
      toast(`${k} capture ${next[k] ? "on" : "off"}`);
    } catch { setSurfaces(surfaces); toast("Couldn't save — try again"); }
  };
  const LABEL: Record<string, string> = { blog: "Blog posts", hub: "Guide pages", listing: "Listing CTA", popup: "Popup" };
  return (
    <div className="card" style={{ padding: 14 }}>
      <div className="flex between center wrap g8">
        <div>
          <strong style={{ fontSize: ".95rem" }}>Capture surfaces</strong>
          <p className="faint" style={{ fontSize: ".78rem", marginTop: 2 }}>Master switch = “Lead capture surfaces” on the Monetization tab. These fine-tune where the quote blocks show.</p>
        </div>
        <div className="flex g6 wrap">
          {surfaces
            ? Object.keys(LABEL).map((k) => (
                <button key={k} className={`chip ${surfaces[k] ? "active" : ""}`} aria-pressed={surfaces[k]} onClick={() => flip(k)}>
                  {LABEL[k]} {surfaces[k] ? "✓" : "✕"}
                </button>
              ))
            : <span className="faint" style={{ fontSize: ".8rem" }}>Loading…</span>}
        </div>
      </div>
    </div>
  );
}

/* Rotation pool — the owner's "add company" control. */
type PoolRow = {
  businessId: string; name: string; slug: string; claimed: boolean; published: boolean;
  phone: string | null; contactEmail: string | null; verticals: string[]; areas: string[];
  active: boolean; lastRoutedAt: string | null; freeLeadUsed: boolean;
};
function RotationPool({ toast }: { toast: (m: string) => void }) {
  const [pool, setPool] = useState<PoolRow[] | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ id: string; name: string; slug: string; area: string | null; claimed: boolean }[]>([]);
  const [pick, setPick] = useState<{ id: string; name: string; claimed: boolean } | null>(null);
  const [verticals, setVerticals] = useState<string[]>([]);
  const [contactEmail, setContactEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const d = await (await fetch("/api/admin/lead-pool")).json();
      setPool(Array.isArray(d.pool) ? d.pool : []);
    } catch { setPool([]); }
  }, []);
  useEffect(() => { let alive = true; (async () => { if (alive) await load(); })(); return () => { alive = false; }; }, [load]);

  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const d = await (await fetch(`/api/admin/lead-pool?search=${encodeURIComponent(query.trim())}`)).json();
        setResults(Array.isArray(d.results) ? d.results : []);
      } catch { setResults([]); }
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  const save = async () => {
    if (!pick || verticals.length === 0) { toast("Pick a business and at least one vertical"); return; }
    setBusy(true);
    try {
      const r = await fetch("/api/admin/lead-pool", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ businessId: pick.id, verticals, areas: [], contactEmail: contactEmail.trim() }) });
      const d = await r.json();
      if (!d.ok) throw new Error(d.error);
      toast(`${pick.name} added to rotation`);
      setOpen(false); setPick(null); setQuery(""); setVerticals([]); setContactEmail("");
      await load();
    } catch { toast("Couldn't add — check the details"); }
    setBusy(false);
  };

  const toggleActive = async (row: PoolRow) => {
    try {
      const r = await fetch("/api/admin/lead-pool", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ businessId: row.businessId, verticals: row.verticals, areas: row.areas, active: !row.active }) });
      if (!(await r.json())?.ok) throw new Error();
      toast(`${row.name} ${row.active ? "paused" : "resumed"}`);
      await load();
    } catch { toast("Couldn't update"); }
  };

  return (
    <div className="card" style={{ padding: 14 }}>
      <div className="flex between center wrap g8">
        <div>
          <strong style={{ fontSize: ".95rem" }}>Rotation pool ({pool?.length ?? "…"})</strong>
          <p className="faint" style={{ fontSize: ".78rem", marginTop: 2 }}>Businesses receiving round-robin leads. Unclaimed ones need a contact email (or WhatsApp delivery below).</p>
        </div>
        <button className="btn btn-soft btn-sm" onClick={() => setOpen((o) => !o)}><Icon name="plus" size={14} /> Add company</button>
      </div>

      {open && (
        <div className="card" style={{ marginTop: 10, padding: 12, background: "var(--wash,#f8f6f0)" }}>
          {!pick ? (
            <>
              <input className="input" placeholder="Search business by name or slug…" value={query} onChange={(e) => setQuery(e.target.value)} />
              {results.length > 0 && (
                <div className="stack g4" style={{ marginTop: 8 }}>
                  {results.map((r) => (
                    <button key={r.id} className="btn btn-ghost btn-sm" style={{ justifyContent: "flex-start" }} onClick={() => setPick({ id: r.id, name: r.name, claimed: r.claimed })}>
                      {r.name} <span className="faint">· {r.area || r.slug} · {r.claimed ? "claimed" : "unclaimed"}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="stack g8">
              <strong style={{ fontSize: ".9rem" }}>{pick.name} {!pick.claimed && <span className="pill-tag amber">unclaimed</span>}</strong>
              <div className="flex g6 wrap">
                {LEAD_VERTICALS.map((v) => (
                  <button key={v.id} className={`chip ${verticals.includes(v.id) ? "active" : ""}`} aria-pressed={verticals.includes(v.id)}
                    onClick={() => setVerticals((cur) => cur.includes(v.id) ? cur.filter((x) => x !== v.id) : [...cur, v.id])}>
                    {v.label}
                  </button>
                ))}
              </div>
              {!pick.claimed && (
                <input className="input" placeholder="Outreach email (optional — else deliver via WhatsApp queue)" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
              )}
              <div className="flex g8">
                <button className="btn btn-primary btn-sm" disabled={busy} onClick={save}>{busy ? "Saving…" : "Add to rotation"}</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setPick(null)}>Back</button>
              </div>
            </div>
          )}
        </div>
      )}

      {pool && pool.length > 0 && (
        <div className="stack g6" style={{ marginTop: 10 }}>
          {pool.map((row) => (
            <div key={row.businessId} className="flex between center wrap g8" style={{ fontSize: ".84rem", padding: "6px 0", borderTop: "1px solid var(--line,#eee)" }}>
              <span>
                <strong>{row.name}</strong>{" "}
                <span className="faint">· {row.verticals.join(", ")} · {row.claimed ? "claimed" : row.contactEmail ? "unclaimed (email)" : "unclaimed (WhatsApp)"}{row.freeLeadUsed ? " · free lead used" : " · 🎁 free lead available"}</span>
              </span>
              <button className="btn btn-ghost btn-sm" onClick={() => toggleActive(row)}>{row.active ? "Pause" : "Resume"}</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function AdminLeads({ toast }: { toast: (m: string) => void }) {
  const [status, setStatus] = useState("new");
  const [leads, setLeads] = useState<AdminLead[] | null>(null);
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    setLeads(null);
    try {
      const res = await fetch(`/api/admin/leads?status=${status}`);
      const d = await res.json();
      setLeads(Array.isArray(d.leads) ? d.leads : []);
    } catch { setLeads([]); }
  }, [status]);

  useEffect(() => { let alive = true; (async () => { if (alive) await load(); })(); return () => { alive = false; }; }, [load]);

  const act = async (id: string, action: string, businessIds?: string[]) => {
    setBusy(id);
    try {
      const res = await fetch("/api/admin/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, action, ...(businessIds ? { businessIds } : {}) }) });
      const d = await res.json();
      if (!res.ok || !d.ok) {
        toast(
          d.error === "no_consent" ? "Lead has no contact consent"
          : d.error === "no_matches" || d.error === "no_match" ? "No matching vendors in rotation"
          : d.error === "schema" ? "Paste migration 0066 first (rotation columns missing)"
          : "Action failed",
        );
      } else {
        toast(
          action === "route" ? `Routed to ${d.routed} vendor${d.routed === 1 ? "" : "s"}`
          : action === "route-exclusive" ? `Sent exclusively${d.business ? ` to ${d.business}` : ""} (${d.delivery === "full" ? "free full lead" : "teaser"})`
          : action === "mark-delivered" ? "Marked delivered"
          : action === "spam" ? "Marked spam" : "Closed",
        );
        await load();
      }
    } catch { toast("Action failed"); }
    setBusy("");
  };

  if (leads === null) return <div className="card" style={{ padding: 24, height: 120, opacity: 0.5 }} aria-busy="true" />;

  return (
    <div className="stack g14">
      <LeadStats />
      <CaptureSettings toast={toast} />
      <RotationPool toast={toast} />

      <div className="flex g8 wrap">
        {FILTERS.map(([v, l]) => (
          <button key={v} className={`chip ${status === v ? "active" : ""}`} aria-pressed={status === v} onClick={() => setStatus(v)}>{l}</button>
        ))}
      </div>

      {leads.length === 0 ? (
        <div className="card" style={{ padding: 28, textAlign: "center" }}>
          <p className="faint">No leads in this view.</p>
        </div>
      ) : (
        leads.map((l) => (
          <div key={l.id} className="card" style={{ padding: 16 }}>
            <div className="flex between center wrap g8">
              <div>
                <div className="flex g8 center">
                  <strong>{l.vertical}</strong>
                  {!l.consent && <span className="pill-tag red">No consent</span>}
                  {l.match?.gap && <span className="pill-tag amber">Coverage gap</span>}
                </div>
                <div className="faint" style={{ fontSize: ".82rem", marginTop: 2 }}>{[l.name, l.area, l.budget, l.when].filter(Boolean).join(" · ") || "—"}</div>
              </div>
              <span className="faint" style={{ fontSize: ".78rem" }}>{new Date(l.createdAt).toLocaleDateString("en-SG", { day: "numeric", month: "short" })}</span>
            </div>

            {l.details && <p className="muted" style={{ marginTop: 8, fontSize: ".88rem" }}>{l.details}</p>}

            {/* Matched-vendor preview (new leads) */}
            {l.match && (
              <div className="card" style={{ marginTop: 10, padding: "10px 12px", background: "var(--wash,#f8f6f0)" }}>
                {l.match.count > 0 ? (
                  <>
                    <div className="faint" style={{ fontSize: ".8rem", marginBottom: 6 }}>Would route to {l.match.count}:</div>
                    <div className="flex g6 wrap">
                      {l.match.candidates.map((c) => (
                        <span key={c.id} className="pill-tag" title={c.plan || "free"}>{c.name}{c.hasQuota ? " ✓" : ""}</span>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="faint" style={{ fontSize: ".82rem" }}>No subscribed vendors match this vertical/area yet — a pitch opportunity.</div>
                )}
              </div>
            )}

            {/* Routed vendors (already-routed leads) */}
            {!l.match && l.routes.length > 0 && (
              <div className="faint" style={{ fontSize: ".82rem", marginTop: 8 }}>
                Routed to {l.routes.length} · {l.routes.filter((r) => ["accepted", "contacted", "won"].includes(r.status)).length} accepted
              </div>
            )}

            {/* WhatsApp delivery queue: exclusive free leads to unclaimed
                vendors that have no email → send the branded message by hand. */}
            {l.routes.filter((r) => r.mode === "exclusive" && !r.deliveredAt && r.businessPhone).map((r) => {
              const msg = `Assalamualaikum! You've got a *free customer lead* from Humble Halal for ${l.vertical}${l.area ? ` in ${l.area}` : ""}.\n\n`
                + [l.name && `Name: ${l.name}`, l.phone && `Phone: ${l.phone}`, l.email && `Email: ${l.email}`, l.budget && `Budget: ${l.budget}`, l.when && `When: ${l.when}`, l.details && `Request: ${l.details}`].filter(Boolean).join("\n")
                + `\n\nReply to them directly. Want more leads reserved just for you? Claim your free Humble Halal listing: https://www.humblehalal.com`;
              return (
                <div key={r.business_id} className="card" style={{ marginTop: 8, padding: "8px 10px", background: "var(--gold-50,#fbf3df)" }}>
                  <div className="flex between center wrap g8" style={{ fontSize: ".82rem" }}>
                    <span>🎁 Deliver free lead to <strong>{r.businessName}</strong> (no email on file)</span>
                    <span className="flex g6">
                      <a className="btn btn-soft btn-sm" href={waHref(r.businessPhone!, msg)} target="_blank" rel="noopener"><Icon name="whatsapp" size={14} /> WhatsApp</a>
                      <button className="btn btn-ghost btn-sm" disabled={busy === l.id} onClick={() => act(l.id, "mark-delivered", [r.business_id])}>Mark sent</button>
                    </span>
                  </div>
                </div>
              );
            })}

            <div className="flex g8 wrap" style={{ marginTop: 12 }}>
              {(l.status === "new" || l.status === "reviewing") && (
                <>
                  <button className="btn btn-primary btn-sm" disabled={busy === l.id || !l.consent} onClick={() => act(l.id, "route-exclusive")}>
                    <Icon name="megaphone" size={15} /> Route (round-robin)
                  </button>
                  <button className="btn btn-soft btn-sm" disabled={busy === l.id || !l.consent || (l.match?.count ?? 0) === 0} onClick={() => act(l.id, "route")} title="Legacy: fan out to up to 5 subscribed vendors at once">
                    Fan out to {l.match?.count ?? 0}
                  </button>
                </>
              )}
              <button className="btn btn-ghost btn-sm" disabled={busy === l.id} onClick={() => act(l.id, "spam")}>Spam</button>
              <button className="btn btn-ghost btn-sm" disabled={busy === l.id} onClick={() => act(l.id, "close")}>Close</button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
