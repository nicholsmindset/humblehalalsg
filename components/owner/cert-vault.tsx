"use client";

/* Halal Certificate Vault — owner upload + status list.
   Shows the upload form + the owner's certs when the business is Verified+ and the
   vault flag is on; otherwise a soft upsell. Files are previewed via short-TTL
   signed URLs minted by the server (never a public URL). */

import { useEffect, useState } from "react";
import { canUse } from "@/lib/plans";
import { useApp } from "../app-context";
import { Icon } from "../ui";
import type { OwnerBiz } from "./types";

type OwnerCert = {
  id: string;
  business_id: string;
  issuer: string | null;
  scheme: string | null;
  cert_no: string | null;
  issued_on: string | null;
  expires_on: string | null;
  status: string;
  review_note: string | null;
  created_at: string;
  url: string | null;
};

const CERT_STATUS: Record<string, [string, string]> = {
  pending: ["Pending review", "amber"],
  approved: ["Approved", "green"],
  rejected: ["Rejected", "red"],
  expired: ["Expired", "amber"],
};

export function CertVault({
  toast,
  navigate,
  live,
  certVaultEnabled,
  biz,
}: {
  toast: (m: string) => void;
  navigate: ReturnType<typeof useApp>["navigate"];
  live: boolean;
  certVaultEnabled: boolean;
  biz: OwnerBiz | null;
}) {
  const [certs, setCerts] = useState<OwnerCert[] | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [issuer, setIssuer] = useState("MUIS");
  const [scheme, setScheme] = useState("");
  const [certNo, setCertNo] = useState("");
  const [issuedOn, setIssuedOn] = useState("");
  const [expiresOn, setExpiresOn] = useState("");
  const [busy, setBusy] = useState(false);

  // Verified+ entitlement (cert_upload). In mock mode there's no plan, so we
  // still show the form so the surface is explorable.
  const entitled = !live || (!!biz && canUse(biz, "cert_upload"));

  const load = async () => {
    try {
      const r = await fetch("/api/owner/cert");
      const d = await r.json().catch(() => ({ ok: false }));
      if (d.ok && Array.isArray(d.certs)) setCerts(d.certs as OwnerCert[]);
      else setCerts([]);
    } catch {
      setCerts([]);
    }
  };
  useEffect(() => {
    // Same fetch as the post-submit refresh — one implementation, not two.
    if (!entitled) { setCerts([]); return; }
    load();
  }, [entitled]);

  const submit = async () => {
    if (!file) { toast("Choose a certificate file first"); return; }
    if (live && !biz) { toast("Add or claim your business first"); return; }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      if (biz) fd.set("businessId", biz.id);
      fd.set("issuer", issuer);
      fd.set("scheme", scheme);
      fd.set("cert_no", certNo);
      fd.set("issued_on", issuedOn);
      fd.set("expires_on", expiresOn);
      const r = await fetch("/api/owner/cert", { method: "POST", body: fd });
      const d = await r.json().catch(() => ({ ok: false }));
      if (!d.ok) {
        const msg: Record<string, string> = {
          cert_vault_disabled: "Certificate uploads aren’t open yet — check back soon.",
          tier_locked: "Upgrade to Verified to upload your halal certificate.",
          unauthenticated: "Please sign in to upload your certificate.",
          not_owner: "You can only upload certificates for your own business.",
        };
        toast(msg[d.reason] || d.error || "Couldn’t upload — try again.");
        return;
      }
      toast(d.simulated ? "Certificate received (demo mode)" : "Certificate uploaded — pending review");
      setFile(null); setScheme(""); setCertNo(""); setIssuedOn(""); setExpiresOn("");
      if (live) load();
    } catch {
      toast("Couldn’t upload — try again.");
    } finally {
      setBusy(false);
    }
  };

  // Soft upsell when the business isn't Verified+.
  if (!entitled) {
    return (
      <div className="dash-pane">
        <div className="card" style={{ padding: 28, textAlign: "center" }}>
          <div className="empty-ico" style={{ width: 48, height: 48, borderRadius: 14, background: "var(--emerald-50)", margin: "0 auto 12px" }}><Icon name="shield-check" size={24} /></div>
          <h3 style={{ fontSize: "1.2rem", marginBottom: 6 }}>Upload your halal certificate</h3>
          <p className="faint" style={{ fontSize: ".92rem", maxWidth: 440, margin: "0 auto 14px" }}>Verify your business to upload your halal certificate to the vault. Our team reviews it and it powers your halal-confidence badge.</p>
          <button className="btn btn-gold" onClick={() => navigate("pricing")}><Icon name="shield-check" size={16} /> Verify your business</button>
        </div>
      </div>
    );
  }

  return (
    <div className="dash-pane stack g16">
      {!certVaultEnabled && (
        <div className="notice notice-warn">
          <Icon name="info" size={18} />
          <span>The Halal Certificate Vault is in <strong>pilot</strong>. You can prepare your details now — uploads go live the moment it’s switched on.</span>
        </div>
      )}

      <div className="card" style={{ padding: 22 }}>
        <span className="eyebrow">Halal certificate vault</span>
        <h3 style={{ fontSize: "1.3rem", marginTop: 6 }}>Add your halal certificate</h3>
        <p className="faint" style={{ maxWidth: 480, marginTop: 4 }}>Upload your MUIS (or issuer) certificate as a PDF, JPG or PNG. Our team reviews it; once approved it strengthens your halal-confidence badge. Your file is private — only you and our reviewers can open it.</p>

        <div className="stack g12" style={{ marginTop: 16 }}>
          <div className="flex g10 wrap">
            <div className="field" style={{ flex: 1, minWidth: 160 }}><label>Issuer</label><input className="input" value={issuer} onChange={(e) => setIssuer(e.target.value)} placeholder="e.g. MUIS" /></div>
            <div className="field" style={{ flex: 1, minWidth: 160 }}><label>Scheme</label><input className="input" value={scheme} onChange={(e) => setScheme(e.target.value)} placeholder="e.g. Eating Establishment" /></div>
          </div>
          <div className="flex g10 wrap">
            <div className="field" style={{ flex: 1, minWidth: 160 }}><label>Certificate no.</label><input className="input" value={certNo} onChange={(e) => setCertNo(e.target.value)} placeholder="From your certificate" /></div>
            <div className="field" style={{ flex: 1, minWidth: 120 }}><label>Issued on</label><input type="date" className="input" value={issuedOn} onChange={(e) => setIssuedOn(e.target.value)} /></div>
            <div className="field" style={{ flex: 1, minWidth: 120 }}><label>Expires on</label><input type="date" className="input" value={expiresOn} onChange={(e) => setExpiresOn(e.target.value)} /></div>
          </div>
          <div className="field">
            <label>Certificate file (PDF, JPG or PNG · max 8MB)</label>
            <input className="input" type="file" accept="application/pdf,image/jpeg,image/png" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </div>
          <div className="flex g8">
            <button className="btn btn-primary" disabled={busy || !file} onClick={submit}><Icon name="upload" size={16} /> {busy ? "Uploading…" : "Upload certificate"}</button>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 20 }}>
        <h3 style={{ fontSize: "1.1rem", marginBottom: 12 }}>Your certificates</h3>
        {certs === null ? (
          <div className="card" style={{ padding: 20, height: 60, opacity: 0.5 }} aria-busy="true" />
        ) : certs.length === 0 ? (
          <p className="faint" style={{ fontSize: ".9rem" }}>No certificates yet. Upload one above to get verified.</p>
        ) : (
          <div className="stack g10">
            {certs.map((c) => {
              const [label, tone] = CERT_STATUS[c.status] || [c.status, "amber"];
              return (
                <div key={c.id} className="card" style={{ display: "flex", gap: 14, padding: 14, alignItems: "center", flexWrap: "wrap" }}>
                  <div className="f1" style={{ minWidth: 160 }}>
                    <div className="flex g8 center wrap"><span className={`pill-tag ${tone}`}>{label}</span></div>
                    <div style={{ fontWeight: 700, marginTop: 5 }}>{[c.issuer, c.scheme].filter(Boolean).join(" · ") || "Certificate"}</div>
                    <div className="faint" style={{ fontSize: ".82rem", marginTop: 2 }}>{[c.cert_no && `No. ${c.cert_no}`, c.expires_on && `Expires ${c.expires_on}`].filter(Boolean).join(" · ") || "—"}</div>
                    {c.status === "rejected" && c.review_note && <div className="faint" style={{ fontSize: ".82rem", marginTop: 4, color: "var(--danger)" }}>Reason: {c.review_note}</div>}
                  </div>
                  {c.url && (
                    <a className="btn btn-outline btn-sm" href={c.url} target="_blank" rel="noopener noreferrer"><Icon name="eye" size={15} /> View</a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
