"use client";

/* Halal Passport — the consumer loyalty dashboard, mockup layout on real data:
   member card (tier + points + personal QR when shareable), full tier journey,
   next-tier progress, stats, earned/locked badges, referral card, recent
   activity, how-it-works and the explicit loyalty≠halal-status separation.
   All data from /api/passport, /api/referral/code, /api/passport/settings.
   Real-data policy: no per-business stamp cards, challenges or voucher promises
   — those have no backend yet. */

import { useCallback, useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useApp } from "../app-context";
import { Icon } from "../ui";
import { ProgressRing } from "@/components/progress-ring";
import { shareOrCopy } from "@/lib/share";

const SITE = "https://www.humblehalal.com";

type Tier = { key: string; label: string; min: number };
type Passport = {
  stats: { totalPoints: number; reviewCount: number; visitCount: number; followCount: number; streakDays: number; qualifiedReferrals: number };
  tier: Tier;
  nextTier: { tier: Tier; pointsToGo: number } | null;
  tiers?: Tier[];
  badges: { key: string; label: string; icon: string; desc: string; earned: boolean }[];
  recent: { delta: number; reason: string; at: string }[];
};

/* QR generated client-side via the same dynamically imported `qrcode` used for
   the shopfront poster and ticket check-in (no network, no upfront bundle). */
function QrImage({ value, size = 96, label }: { value: string; size?: number; label: string }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    let alive = true;
    import("qrcode")
      .then(({ default: QRCode }) => QRCode.toDataURL(value, { margin: 1, width: size * 2, errorCorrectionLevel: "M" }))
      .then((url) => { if (alive) setSrc(url); })
      .catch(() => { /* QR is progressive enhancement */ });
    return () => { alive = false; };
  }, [value, size]);
  if (!src) return <div style={{ width: size, height: size, borderRadius: 8, background: "rgba(255,255,255,.15)" }} aria-hidden="true" />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} width={size} height={size} alt={label} style={{ borderRadius: 8, background: "#fff", padding: 4 }} />;
}

export function PassportScreen({ embedded = false }: { embedded?: boolean } = {}) {
  const { navigate, toast } = useApp();
  const { isSignedIn, isLoaded, user } = useUser();
  const [data, setData] = useState<Passport | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [share, setShare] = useState<{ isPublic: boolean; shareToken: string | null } | null>(null);
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
    try {
      const d = await (await fetch("/api/passport/settings")).json();
      if (d.ok) setShare({ isPublic: d.isPublic, shareToken: d.shareToken });
    } catch { /* card just omits the QR */ }
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

  if (!loaded) {
    return <div className="screen-in hh-page"><div className="hh-wrap" style={{ maxWidth: 720, paddingTop: 32 }}><div className="card" style={{ height: 200, opacity: 0.5 }} aria-busy="true" /></div></div>;
  }
  if (!data) {
    // Loaded but no data — the passport backend is off/unavailable (e.g. the flag
    // is on before Supabase is wired). Show an honest state + retry, not a
    // skeleton that spins forever.
    return (
      <div className="screen-in hh-page"><div className="hh-wrap" style={{ maxWidth: 560, paddingTop: 40, textAlign: "center" }}>
        <div style={{ fontSize: 44 }}>🕌</div>
        <H style={{ fontSize: "1.6rem", marginTop: 8 }}>Your Halal Passport isn’t available right now</H>
        <p className="muted" style={{ marginTop: 8 }}>Points and stamps are warming up. Please check back shortly.</p>
        <button className="btn btn-soft mt16" onClick={() => { setLoaded(false); load(); }}>Try again</button>
      </div></div>
    );
  }

  const s = data.stats;
  const pct = data.nextTier ? Math.min(100, Math.round(((s.totalPoints - data.tier.min) / (data.nextTier.tier.min - data.tier.min)) * 100)) : 100;
  const ladder = data.tiers?.length ? data.tiers : [data.tier];
  const memberName = user?.firstName || user?.username || "Member";
  const publicUrl = share?.isPublic && share.shareToken ? `${SITE}/passport/${share.shareToken}` : null;
  const memberId = share?.shareToken ? `HH-${share.shareToken.slice(0, 8).toUpperCase()}` : null;

  return (
    <div className="screen-in hh-page">
      <div className="hh-wrap" style={{ maxWidth: 860, paddingTop: 28, paddingBottom: 48 }}>
        <span className="eyebrow">Humble Halal Passport</span>
        <div className="pp-hero">
          <div style={{ minWidth: 0 }}>
            <H style={{ fontSize: "clamp(1.7rem,4vw,2.4rem)", lineHeight: 1.15 }}>Explore more. Support local. Earn rewards.</H>
            <p className="muted" style={{ marginTop: 10, maxWidth: 420 }}>
              Collect visit stamps at participating halal and Muslim-owned businesses, keep your streak going and unlock badges as you climb the tiers.
            </p>
            <div className="notice notice-info" style={{ marginTop: 14 }}>
              <Icon name="shield-check" size={16} />
              <span style={{ fontSize: ".84rem" }}>Passport rewards are a <strong>loyalty feature</strong> and never change a business&apos;s halal status.</span>
            </div>
            <div className="flex g8 wrap" style={{ marginTop: 14 }}>
              <a className="btn btn-gold" href="#pp-how"><Icon name="camera" size={16} /> How to collect stamps</a>
              {publicUrl && (
                <button className="btn btn-outline" onClick={async () => {
                  const r = await shareOrCopy({ title: "My Halal Passport", path: publicUrl.replace(SITE, "") });
                  toast(r === "shared" ? "Shared!" : r === "copied" ? "Link copied" : "Couldn't share");
                }}><Icon name="share" size={15} /> Share my passport</button>
              )}
            </div>
          </div>

          {/* Member card — real name, tier, points; QR appears when the owner has
              made their passport shareable (it encodes the public page). */}
          <div className="pp-card" aria-label="Your passport card">
            <div className="pp-card-top">
              <div>
                <span className="pp-card-name">{memberName}</span>
                <span className="pp-card-tier">{data.tier.label}</span>
              </div>
              <Icon name="crescent" size={22} />
            </div>
            <div className="pp-card-bottom">
              <div>
                <strong className="pp-card-points">{s.totalPoints}</strong>
                <span className="pp-card-lbl">points</span>
                {memberId && <span className="pp-card-id">{memberId} · member id</span>}
              </div>
              {publicUrl ? (
                <QrImage value={publicUrl} label="QR code linking to your public passport" />
              ) : (
                <span className="pp-card-lbl" style={{ maxWidth: 110, textAlign: "right" }}>Enable sharing below to get your passport QR</span>
              )}
            </div>
          </div>
        </div>

        {/* Tier journey + next-tier progress (full real ladder from the API). */}
        <div className="card" style={{ padding: 18, marginTop: 20 }}>
          <div className="pp-tiers">
            {ladder.map((t) => {
              const reached = s.totalPoints >= t.min;
              const current = t.key === data.tier.key;
              return (
                <div key={t.key} className={`pp-tier ${reached ? "reached" : ""} ${current ? "current" : ""}`}>
                  <span className="pp-tier-ico"><Icon name={current ? "starf" : reached ? "check" : "lock"} size={14} /></span>
                  <strong>{t.label}</strong>
                  <span className="faint">{t.min} pts</span>
                </div>
              );
            })}
          </div>
          {data.nextTier ? (
            <>
              <div className="flex between" style={{ fontSize: ".85rem", fontWeight: 600, margin: "14px 0 6px" }}>
                <span>{s.totalPoints} / {data.nextTier.tier.min} points</span>
                <span className="faint">{data.nextTier.pointsToGo} points to {data.nextTier.tier.label}</span>
              </div>
              <div style={{ height: 10, borderRadius: 999, background: "var(--line,#eee)", overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: "var(--emerald,#0e7a5f)", transition: "width .3s" }} />
              </div>
            </>
          ) : (
            <div style={{ fontWeight: 700, marginTop: 12 }}>🏆 You&apos;ve reached the top tier — {data.tier.label}!</div>
          )}
        </div>

        {/* Real activity stats */}
        <div className="statx-grid" style={{ marginTop: 16 }}>
          <div className="statx"><span className="statx-icon"><Icon name="pin" size={18} /></span><div className="statx-body"><div className="statx-value">{s.visitCount}</div><div className="statx-label">Visits stamped</div></div></div>
          <div className="statx"><span className="statx-icon"><Icon name="star" size={18} /></span><div className="statx-body"><div className="statx-value">{s.reviewCount}</div><div className="statx-label">Reviews written</div></div></div>
          <div className="statx"><span className="statx-icon"><Icon name="sparkles" size={18} /></span><div className="statx-body"><div className="statx-value">{s.streakDays}{s.streakDays ? "-day" : ""}</div><div className="statx-label">Streak</div></div></div>
          <div className="statx"><span className="statx-icon"><Icon name="users" size={18} /></span><div className="statx-body"><div className="statx-value">{s.qualifiedReferrals}</div><div className="statx-label">Friends joined</div></div></div>
        </div>

        {/* Badges — simplified earned/locked */}
        <div className="flex between center wrap g10" style={{ margin: "26px 0 12px" }}>
          <h2 style={{ fontSize: "1.2rem", margin: 0 }}>Badges</h2>
          <span className="faint" style={{ fontSize: ".82rem" }}>{data.badges.filter((b) => b.earned).length} of {data.badges.length} earned</span>
        </div>
        <div className="grid-cards" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 10 }}>
          {data.badges.map((b) => (
            <div key={b.key} className="card" style={{ padding: 14, textAlign: "center", opacity: b.earned ? 1 : 0.45 }}>
              <span style={{ width: 42, height: 42, borderRadius: 12, background: b.earned ? "var(--gold-50,#fbf3df)" : "var(--wash,#f2f0ea)", color: b.earned ? "var(--gold-800,#856520)" : "var(--ink-soft,#8a8a8a)", display: "grid", placeItems: "center", margin: "0 auto 8px" }}>
                <Icon name={b.icon} size={19} />
              </span>
              <div style={{ fontWeight: 700, fontSize: ".85rem" }}>{b.label}</div>
              <div className="faint" style={{ fontSize: ".74rem", marginTop: 2 }}>{b.earned ? "Earned" : b.desc}</div>
            </div>
          ))}
        </div>

        <InviteFriendCard toast={toast} />

        <PublicToggle toast={toast} onChange={(v) => setShare(v)} />

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

        {/* How it works — matches the real poster-scan flow. */}
        <section id="pp-how" className="pp-how card" style={{ padding: 20, marginTop: 26 }}>
          <h2 style={{ fontSize: "1.2rem", marginBottom: 14 }}>How it works</h2>
          <div className="pp-how-grid">
            <div><span className="pp-step">1</span><strong>Scan in store</strong><p>Participating businesses display a Humble Halal Passport QR poster at the counter — scan it with your phone camera.</p></div>
            <div><span className="pp-step">2</span><strong>Collect a verified visit stamp</strong><p>Your visit is recorded instantly in your passport and earns points.</p></div>
            <div><span className="pp-step">3</span><strong>Unlock badges and tiers</strong><p>Reach visit goals, keep streaks and climb from {ladder[0]?.label || "Explorer"} to {ladder[ladder.length - 1]?.label || "Ambassador"}.</p></div>
          </div>
        </section>

        {/* How to earn */}
        <h2 style={{ fontSize: "1.2rem", margin: "24px 0 12px" }}>Earn more points</h2>
        <ul className="stack g6" style={{ listStyle: "none", padding: 0, margin: 0, fontSize: ".9rem" }}>
          <li className="flex between"><span>Write a review</span><span className="faint">+50</span></li>
          <li className="flex between"><span>Collect a stamp at a halal spot</span><span className="faint">+20</span></li>
          <li className="flex between"><span>Follow a business</span><span className="faint">+10</span></li>
          <li className="flex between"><span>Visit Humble Halal daily</span><span className="faint">+5</span></li>
          <li className="flex between"><span>A friend you invite joins in</span><span className="faint">+100</span></li>
        </ul>

        <p className="faint" style={{ fontSize: ".8rem", marginTop: 20 }}>
          Looking for somewhere to visit? <button className="link-inline" style={{ font: "inherit", padding: 0, minHeight: 24 }} onClick={() => navigate("explore")}>Browse halal places →</button>
        </p>
      </div>
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
      <p className="faint" style={{ fontSize: ".88rem", marginTop: 4 }}>You both earn points after their first review or stamp. Refer 3 to become a <strong>Community Ambassador</strong>.</p>
      <div className="flex g8 wrap center" style={{ marginTop: 12 }}>
        <code style={{ flex: 1, minWidth: 160, background: "#fff", borderRadius: 8, padding: "9px 12px", fontSize: ".82rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{link}</code>
        <button className="btn btn-primary btn-sm" onClick={copy}><Icon name={copied ? "check" : "share"} size={15} /> {copied ? "Shared" : "Share"}</button>
        <a className="btn btn-soft btn-sm" href={`https://wa.me/?text=${encodeURIComponent(msg)}`} target="_blank" rel="noopener"><Icon name="whatsapp" size={15} /> WhatsApp</a>
      </div>
      <div className="faint" style={{ fontSize: ".8rem", marginTop: 8 }}>{ref.clicks} clicks · {ref.signups} joined</div>
    </div>
  );
}

function PublicToggle({ toast, onChange }: { toast: (m: string) => void; onChange?: (v: { isPublic: boolean; shareToken: string | null }) => void }) {
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
      if (d.ok) {
        const next = { isPublic: d.isPublic, shareToken: d.shareToken };
        setState(next);
        onChange?.(next);
        toast(d.isPublic ? "Passport is now public — your QR is on the card above" : "Passport is private");
      }
    } catch { toast("Couldn't update"); }
  };
  return (
    <div className="card" style={{ padding: 14, marginTop: 14 }}>
      <label className="flex g10 center" style={{ cursor: "pointer" }}>
        <input type="checkbox" checked={state.isPublic} onChange={toggle} />
        <span><strong>Make my passport shareable</strong><br /><span className="faint" style={{ fontSize: ".82rem" }}>Adds a personal QR to your card and a public page showing your tier, points and badges (no email or contact details).</span></span>
      </label>
      {state.isPublic && state.shareToken && (
        <a className="link-inline" style={{ display: "inline-block", marginTop: 8, fontSize: ".85rem" }} href={`/passport/${state.shareToken}`} target="_blank" rel="noopener">View my public passport →</a>
      )}
    </div>
  );
}
