"use client";

/* First-run activation checklist — shown on the owner dashboard Overview when
   there's no live listing yet. Turns the empty dashboard into a guided path:
   add/claim → complete profile → halal evidence → grow. Steps deep-link into
   dashboard tabs (?tab=) or the add-listing wizard. */

import { Icon } from "../ui";

export function ActivationChecklist({
  hasLive,
  pendingCount,
  certVault,
  onGoTab,
  onAddListing,
}: {
  hasLive: boolean;
  pendingCount: number;
  certVault: boolean;
  onGoTab: (tab: string) => void;
  onAddListing: () => void;
}) {
  const steps: { icon: string; title: string; body: string; cta: string; done?: boolean; pending?: boolean; go: () => void }[] = [
    {
      icon: "store",
      title: "Add or claim your business",
      body: "Get your listing into the directory so customers can find you.",
      cta: hasLive ? "Add another" : "Start now",
      done: hasLive,
      pending: !hasLive && pendingCount > 0,
      go: onAddListing,
    },
    {
      icon: "camera",
      title: "Complete your profile",
      body: "Photos, opening hours and amenities — complete profiles get more clicks.",
      cta: "Edit listing",
      go: () => onGoTab("listings"),
    },
    ...(certVault
      ? [{
          icon: "shield-check",
          title: "Submit your halal evidence",
          body: "Upload your certificate for review to earn a trust badge.",
          cta: "Open cert vault",
          go: () => onGoTab("cert"),
        }]
      : []),
    {
      icon: "trophy",
      title: "Grow with sponsored placement",
      body: "Feature your business across the directory when you're ready.",
      cta: "See ad options",
      go: () => onGoTab("ads"),
    },
  ];

  return (
    <div className="card" style={{ padding: 20, marginBottom: 16 }}>
      <span className="eyebrow">Getting started</span>
      <h3 style={{ fontSize: "1.2rem", marginTop: 6 }}>Set up your business on Humble Halal</h3>
      <div className="stack g8" style={{ marginTop: 12 }}>
        {steps.map((s, i) => (
          <div key={s.title} className="flex g12 center wrap" style={{ padding: "10px 0", borderTop: i ? "1px dashed var(--line)" : "none" }}>
            <span
              className="empty-ico"
              style={{
                width: 36, height: 36, borderRadius: 10, flex: "none",
                background: s.done ? "var(--emerald)" : "var(--emerald-50)",
                color: s.done ? "#fff" : "var(--emerald)",
              }}
            >
              <Icon name={s.done ? "check" : s.icon} size={17} />
            </span>
            <div className="f1" style={{ minWidth: 180 }}>
              <div className="flex g8 center wrap">
                <span style={{ fontWeight: 700, fontSize: ".95rem" }}>{s.title}</span>
                {s.pending && <span className="pill-tag amber">In review</span>}
              </div>
              <p className="faint" style={{ fontSize: ".82rem", marginTop: 2 }}>{s.body}</p>
            </div>
            {!s.done && !s.pending && (
              <button className="btn btn-outline btn-sm" onClick={s.go}>{s.cta} <Icon name="chevron" size={13} /></button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
