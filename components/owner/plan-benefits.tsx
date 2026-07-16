"use client";

import { useEffect, useState } from "react";
import { Icon } from "../ui";

type Benefit = {
  key: string; label: string; description: string; href: string;
  status: "active" | "unlocked" | "included" | "review_available";
};
type Entitlements = {
  plan: string;
  activationStatus: "active" | "activating" | "needs_review";
  automaticBenefitsActive: boolean;
  billing: { status: string; currentPeriodEnd?: string | null } | null;
  benefits: Benefit[];
};

const statusCopy = {
  active: ["Benefits active", "Your automatic plan benefits are live."],
  activating: ["Activating", "Payment is received. We’re finishing your plan activation."],
  needs_review: ["We’re checking your plan", "Your access is safe while our team checks a billing mismatch."],
} as const;

export function PlanBenefitsCard({ businessId, onUpgrade }: { businessId: string; onUpgrade?: () => void }) {
  const [data, setData] = useState<Entitlements | null>(null);
  const [supportOpen, setSupportOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(`/api/owner/entitlements?business=${encodeURIComponent(businessId)}`)
      .then((r) => r.json()).then((j) => { if (alive && j?.ok) setData(j); }).catch(() => {});
    return () => { alive = false; };
  }, [businessId]);

  if (!data) return <div className="card mt20" style={{ height: 120, opacity: .5 }} aria-busy="true" />;
  const [statusTitle, statusDetail] = statusCopy[data.activationStatus];
  const prioritySupport = data.benefits.some((b) => b.key === "priority_support");
  const renewal = data.billing?.currentPeriodEnd
    ? new Date(data.billing.currentPeriodEnd).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" }) : null;

  const submitSupport = async () => {
    if (subject.trim().length < 3 || message.trim().length < 5) return;
    setSending(true);
    try {
      const res = await fetch("/api/owner/support", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ businessId, subject, message }) });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.ok) { setSent(true); setSubject(""); setMessage(""); }
    } finally { setSending(false); }
  };

  return (
    <section className="card mt20" style={{ padding: 22 }} aria-labelledby="plan-benefits-title">
      <div className="flex between center wrap g12">
        <div>
          <span className="eyebrow">Your plan</span>
          <h3 id="plan-benefits-title" style={{ fontSize: "1.2rem", marginTop: 4 }}>{data.plan.charAt(0).toUpperCase() + data.plan.slice(1)} benefits</h3>
          <p className="faint" style={{ fontSize: ".84rem", marginTop: 4 }}>{statusDetail}{renewal ? ` Current period ends ${renewal}.` : ""}</p>
        </div>
        <span className={`plan-chip ${data.activationStatus !== "active" ? "notice-warn" : ""}`}><Icon name={data.activationStatus === "active" ? "check" : "info"} size={14} /> {statusTitle}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 10, marginTop: 16 }}>
        {data.benefits.map((benefit) => (
          <a key={benefit.key} href={benefit.href} style={{ display: "flex", gap: 10, padding: 12, border: "1px solid var(--border)", borderRadius: 12, color: "inherit", textDecoration: "none" }}>
            <span style={{ color: "var(--emerald)", marginTop: 1 }}><Icon name="check" size={16} /></span>
            <span><strong style={{ fontSize: ".9rem" }}>{benefit.label}</strong><small className="faint" style={{ display: "block", lineHeight: 1.4, marginTop: 3 }}>{benefit.description}</small></span>
          </a>
        ))}
      </div>
      {prioritySupport ? (
        <div style={{ marginTop: 16, borderTop: "1px solid var(--border)", paddingTop: 14 }}>
          <div className="flex between center wrap g10">
            <div><strong style={{ fontSize: ".92rem" }}>Priority support</strong><p className="faint" style={{ fontSize: ".82rem" }}>Requests from your plan enter the high-priority queue.</p></div>
            <button className="btn btn-outline btn-sm" onClick={() => { setSupportOpen((v) => !v); setSent(false); }}><Icon name="email" size={15} /> Contact support</button>
          </div>
          {supportOpen && <div className="stack g10" style={{ marginTop: 12 }}>
            {sent && <div className="notice notice-ok"><Icon name="check" size={16} /> Request received in the priority queue.</div>}
            <input className="input" aria-label="Support subject" placeholder="What can we help with?" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={120} />
            <textarea className="textarea" aria-label="Support message" placeholder="Add the details our team needs…" value={message} onChange={(e) => setMessage(e.target.value)} maxLength={4000} rows={4} />
            <button className="btn btn-gold btn-sm" disabled={sending || subject.trim().length < 3 || message.trim().length < 5} onClick={submitSupport}>{sending ? "Sending…" : "Send priority request"}</button>
          </div>}
        </div>
      ) : onUpgrade ? <div style={{ marginTop: 14 }}><button className="btn btn-soft btn-sm" onClick={onUpgrade}>Compare plan benefits</button></div> : null}
      <p className="faint" style={{ fontSize: ".76rem", marginTop: 14 }}>Automatic placement is derived from your billing plan. Halal verification remains a separate evidence review and is never purchased.</p>
    </section>
  );
}
