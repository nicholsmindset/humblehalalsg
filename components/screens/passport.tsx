"use client";

/* Halal Passport — the consumer loyalty dashboard. Points, tier + progress,
   streak, earned badges, invite-a-friend card (referral), recent activity, and
   a "make my passport public" toggle. Fires a daily check-in once on mount.
   All data from /api/passport, /api/referral/code, /api/passport/settings. */

import { useCallback, useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useApp } from "../app-context";
import { Icon } from "../ui";
import { shareOrCopy } from "@/lib/share";

const SITE = "https://www.humblehalal.com";

type Passport = {
  stats: { totalPoints: number; reviewCount: number; visitCount: number; followCount: number; streakDays: number; qualifiedReferrals: number };
  tier: { key: string; label: string; min: number };
  nextTier: { tier: { key: string; label: string; min: number }; pointsToGo: number } | null;
  badges: { key: string; label: string; icon: string; desc: string; earned: boolean }[];
  recent: { delta: number; reason: string; at: string }[];
};

export function PassportScreen({ embedded = false }: { embedded?: boolean } = {}) {
  const { navigate, toast } = useApp();
  const { isSignedIn, isLoaded } = useUser();
  const [data, setData] = useState<Passport | null>(null);
  const [loaded, setLoaded] = useState(false);
  // Standalone /passport uses <h1>; when rendered as a tab inside /dashboard
  // (which already owns the page <h1>) demote to <h2> so the page keeps a single
  // H1 and a valid heading order (axe).
  const H = embedded ? "h2" : "h1";

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/passport");
      const d = await res.json();
      if (d.ok && d.enabled) setData(d as Passport);
    } catch { /* leave null */ }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return; // signed-out render is gated on Clerk's isLoaded below
    let alive = true;
    (async () => {
      // Daily check-in (keeps streaks alive on browse-only days), then load.
      try { await fetch("/api/passport/checkin", { method: "POST" }); } catch { /* best-effort */ }
      if (alive) await load();
    })();
    return () => { alive = false; };
  }, [isLoaded, isSignedIn, load]);

  if (isLoaded && !isSignedIn) {
    return (
      <div className="screen-in hh-page"><div className="hh-wrap" style={{ maxWidth: 560, paddingTop: 40, textAlign: "center" }}>
        <div style={{ fontSize: 44 }}>🕌</div>
        <H style={{ fontSize: "1.8rem", marginTop: 8 }}>Your Halal Passport</H>
        <p className="muted" style={{ marginTop: 8 }}>Sign in to earn points for reviews, visits and referrals — collect stamps, unlock badges, and climb the tiers.</p>
        <button className="btn btn-primary mt16" onClick={() => navigate("login")}>Sign in to start</button>
      </div></div>
    );
  }

  if (!loaded || !data) {
    return <div className="screen-in hh-page"><div className="hh-wrap" style={{ maxWidth: 640, paddingTop: 32 }}><div className="card" style={{ height: 160, opacity: 0.5 }} aria-busy="true" /></div></div>;
  }

  const s = data.stats;
  const pct = data.nextTier ? Math.min(100, Math.round(((s.totalPoints - data.tier.min) / (data.nextTier.tier.min - data.tier.min)) * 100)) : 100;

  return (
    <div className="screen-in hh-page">
      <div className="hh-wrap" style={{ maxWidth: 720, paddingTop: 28, paddingBottom: 48 }}>
        <span className="eyebrow">Halal Passport</span>
        <div className="flex between center wrap g10" style={{ marginTop: 6 }}>
          <H style={{ fontSize: "clamp(1.6rem,4vw,2.2rem)" }}>{data.tier.label}</H>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--emerald,#0e7a5f)" }}>{s.totalPoints}</div>
            <div className="faint" style={{ fontSize: ".8rem" }}>points</div>
          </div>
        </div>

        {/* Tier progress */}
        <div className="card" style={{ padding: 16, marginTop: 14 }}>
          {data.nextTier ? (
            <>
              <div className="flex between" style={{ fontSize: ".85rem", fontWeight: 600, marginBottom: 6 }}>
                <span>{data.tier.label}</span><span className="faint">{data.nextTier.pointsToGo} pts to {data.nextTier.tier.label}</span>
              </div>
              <div style={{ height: 10, borderRadius: 999, background: "var(--line,#eee)", overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: "var(--emerald,#0e7a5f)" }} />
              </div>
            </>
          ) : (
            <div style={{ fontWeight: 700 }}>🏆 You&apos;ve reached the top tier — Ambassador!</div>
          )}
          <div className="flex g16 wrap" style={{ marginTop: 14 }}>
            <Metric icon="star" label="Reviews" val={s.reviewCount} />
            <Metric icon="pin" label="Places visited" val={s.visitCount} />
            <Metric icon="heart" label="Following" val={s.followCount} />
            <Metric icon="sparkles" label="Day streak" val={s.streakDays} />
            <Metric icon="users" label="Referrals" val={s.qualifiedReferrals} />
          </div>
        </div>

        {/* Badges */}
        <h2 style={{ fontSize: "1.2rem", margin: "24px 0 12px" }}>Badges</h2>
        <div className="grid-cards" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: 10 }}>
          {data.badges.map((b) => (
            <div key={b.key} className="card" style={{ padding: 12, textAlign: "center", opacity: b.earned ? 1 : 0.4 }}>
              <span style={{ width: 40, height: 40, borderRadius: 12, background: b.earned ? "var(--gold-50,#fbf3df)" : "var(--wash,#f2f0ea)", color: b.earned ? "var(--gold,#b8860b)" : "var(--ink-soft,#8a8a8a)", display: "grid", placeItems: "center", margin: "0 auto 8px" }}>
                <Icon name={b.icon} size={18} />
              </span>
              <div style={{ fontWeight: 700, fontSize: ".85rem" }}>{b.label}</div>
              <div className="faint" style={{ fontSize: ".74rem", marginTop: 2 }}>{b.desc}</div>
            </div>
          ))}
        </div>

        <InviteFriendCard toast={toast} />

        <PublicToggle toast={toast} />

        {/* Recent activity */}
        {data.recent.length > 0 && (
          <>
            <h2 style={{ fontSize: "1.2rem", margin: "24px 0 12px" }}>Recent activity</h2>
            <ul className="stack g6" style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {data.recent.map((r, i) => (
                <li key={i} className="flex between center" style={{ padding: "8px 12px", background: "var(--wash,#f8f6f0)", borderRadius: 8 }}>
                  <span style={{ fontSize: ".9rem" }}>{r.reason}</span>
                  <span style={{ fontWeight: 700, color: "var(--emerald,#0e7a5f)", fontSize: ".85rem" }}>+{r.delta}</span>
                </li>
              ))}
            </ul>
          </>
        )}

        {/* How to earn */}
        <h2 style={{ fontSize: "1.2rem", margin: "24px 0 12px" }}>Earn more points</h2>
        <ul className="stack g6" style={{ listStyle: "none", padding: 0, margin: 0, fontSize: ".9rem" }}>
          <li className="flex between"><span>Write a review</span><span className="faint">+50</span></li>
          <li className="flex between"><span>Collect a stamp at a halal spot</span><span className="faint">+20</span></li>
          <li className="flex between"><span>Follow a business</span><span className="faint">+10</span></li>
          <li className="flex between"><span>Visit Humble Halal daily</span><span className="faint">+5</span></li>
          <li className="flex between"><span>A friend you invite joins in</span><span className="faint">+100</span></li>
        </ul>
      </div>
    </div>
  );
}

function Metric({ icon, label, val }: { icon: string; label: string; val: number }) {
  return (
    <div style={{ minWidth: 72 }}>
      <div className="flex g6 center" style={{ color: "var(--emerald,#0e7a5f)" }}><Icon name={icon} size={15} /><strong style={{ fontSize: "1.05rem" }}>{val}</strong></div>
      <div className="faint" style={{ fontSize: ".76rem" }}>{label}</div>
    </div>
  );
}

export function InviteFriendCard({ toast }: { toast: (m: string) => void }) {
  const [ref, setRef] = useState<{ code: string; url: string; clicks: number; signups: number } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try { const d = await (await fetch("/api/referral/code")).json(); if (alive && d.ok) setRef(d); } catch { /* noop */ }
    })();
    return () => { alive = false; };
  }, []);

  if (!ref) return null;
  const link = `${SITE}${ref.url}`;
  const msg = `I'm finding halal food & spots on Humble Halal — join me and we both earn Halal Passport points 🕌 ${link}`;

  const copy = async () => {
    const r = await shareOrCopy({ title: "Join me on Humble Halal", text: msg, path: ref.url });
    if (r !== "failed") { setCopied(true); toast(r === "shared" ? "Shared!" : "Link copied"); setTimeout(() => setCopied(false), 1800); }
  };

  return (
    <div className="card" style={{ padding: 18, marginTop: 24, background: "var(--emerald-50,#e7f3ee)" }}>
      <h2 style={{ fontSize: "1.15rem" }}>Invite friends, earn together</h2>
      <p className="faint" style={{ fontSize: ".88rem", marginTop: 4 }}>Share your link. When a friend joins and leaves their first review or collects a stamp, you both earn points. Refer 3 to become a <strong>Community Ambassador</strong>.</p>
      <div className="flex g8 wrap center" style={{ marginTop: 12 }}>
        <code style={{ flex: 1, minWidth: 160, background: "#fff", borderRadius: 8, padding: "9px 12px", fontSize: ".82rem" }}>{link}</code>
        <button className="btn btn-primary btn-sm" onClick={copy}><Icon name={copied ? "check" : "share"} size={15} /> {copied ? "Shared" : "Share"}</button>
        <a className="btn btn-soft btn-sm" href={`https://wa.me/?text=${encodeURIComponent(msg)}`} target="_blank" rel="noopener"><Icon name="whatsapp" size={15} /> WhatsApp</a>
      </div>
      <div className="faint" style={{ fontSize: ".8rem", marginTop: 8 }}>{ref.clicks} clicks · {ref.signups} joined</div>
    </div>
  );
}

function PublicToggle({ toast }: { toast: (m: string) => void }) {
  const [state, setState] = useState<{ isPublic: boolean; shareToken: string | null } | null>(null);
  useEffect(() => {
    let alive = true;
    (async () => { try { const d = await (await fetch("/api/passport/settings")).json(); if (alive && d.ok) setState({ isPublic: d.isPublic, shareToken: d.shareToken }); } catch { /* noop */ } })();
    return () => { alive = false; };
  }, []);
  if (!state) return null;
  const toggle = async () => {
    try {
      const d = await (await fetch("/api/passport/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isPublic: !state.isPublic }) })).json();
      if (d.ok) { setState({ isPublic: d.isPublic, shareToken: d.shareToken }); toast(d.isPublic ? "Passport is now public" : "Passport is private"); }
    } catch { toast("Couldn't update"); }
  };
  return (
    <div className="card" style={{ padding: 14, marginTop: 14 }}>
      <label className="flex g10 center" style={{ cursor: "pointer" }}>
        <input type="checkbox" checked={state.isPublic} onChange={toggle} />
        <span><strong>Make my passport shareable</strong><br /><span className="faint" style={{ fontSize: ".82rem" }}>A public page shows your tier, points and badges (no email or contact details).</span></span>
      </label>
      {state.isPublic && state.shareToken && (
        <a className="link-inline" style={{ display: "inline-block", marginTop: 8, fontSize: ".85rem" }} href={`/passport/${state.shareToken}`} target="_blank" rel="noopener">View my public passport →</a>
      )}
    </div>
  );
}
