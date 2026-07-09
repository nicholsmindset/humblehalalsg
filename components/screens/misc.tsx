"use client";

/* Humble Halal — Misc screens: Auth, User dashboard, Suggest, Claim, Report, Trust, SEO, States
   (ported from screens-misc.jsx). */
import { useEffect, useRef, useState } from "react";
import { HHData } from "@/lib/data";
import { REGIONS, townsInRegion } from "@/lib/sg-locations";
import type { BadgeKey, EventItem } from "@/lib/types";
import { useApp } from "../app-context";
import { useDirectory } from "../directory-context";
import { useClerk } from "@clerk/nextjs";
// Classic (resource-based) sign-in/up API: create → prepare → attempt → setActive.
// v7's default useSignIn/useSignUp are the newer signals API; the legacy entry
// keeps the resource API this custom flow is built on.
import { useSignIn, useSignUp } from "@clerk/nextjs/legacy";
import { Badge, Empty, Icon, ImagePh, ListingCard, Logo, MobileHeader } from "../ui";
import { EventCard, EventBadges } from "./events";
import { useEvents } from "../events-context";
import { downloadIcs } from "@/lib/ics";
import { allSeoPages, getSeoPage, relatedSeoPages, seoListings } from "@/lib/seo-pages";
import { LEAD_VERTICALS, LEAD_CONSENT_VERSION, LEAD_ROUTE_CAP, verticalForCatId } from "@/lib/lead-verticals";
import { areaProfile, nearbyAreaIds } from "@/lib/area-content";
import { categoryContent } from "@/lib/category-content";
import { HALALSG_BASE } from "@/lib/muis";
import { screenToPath } from "@/lib/routes";
import { Faq } from "../faq";
import { Newsletter } from "../newsletter";
import { AdSlot } from "../ads/ad-slot";
import { track } from "@/lib/analytics";
import { NotificationBell } from "../notification-bell";
import { VERIFY_FAQ } from "@/lib/faq";
import { PassportScreen } from "./passport";

/* =============================================================
   LOGIN / REGISTER
============================================================= */
/** Pull a human message out of a Clerk error (ClerkAPIResponseError). */
function clerkErr(err: unknown): string {
  const e = err as { errors?: Array<{ longMessage?: string; message?: string }> };
  return e?.errors?.[0]?.longMessage || e?.errors?.[0]?.message || "";
}

/* Halal Passport referral: read the `hh_ref` cookie (set by /i/[code]) so it can
   ride Clerk unsafeMetadata through signup. Guarded like captureAttribution. */
function readRefCode(): string | undefined {
  try {
    const m = document.cookie.match(/(?:^|;\s*)hh_ref=([a-z0-9]{4,12})(?:;|$)/);
    if (m) return m[1];
    const s = sessionStorage.getItem("hh-ref");
    return s && /^[a-z0-9]{4,12}$/.test(s) ? s : undefined;
  } catch {
    return undefined;
  }
}

export function LoginScreen() {
  const { navigate, setUser, toast } = useApp();
  const { isLoaded: siLoaded, signIn, setActive: setActiveSignIn } = useSignIn();
  const { isLoaded: suLoaded, signUp, setActive: setActiveSignUp } = useSignUp();
  const [mode, setMode] = useState("login");
  const [role, setRole] = useState<"user" | "owner">("user");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [code, setCode] = useState("");
  const [touched, setTouched] = useState(false);
  const [sending, setSending] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [authErr, setAuthErr] = useState("");

  // Clerk drives real auth (email code + Google). Without a publishable key we
  // fall back to the mock/demo password flow so dev/previews still work.
  const clerkConfigured = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  const emailErr = !email
    ? "Enter your email"
    : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      ? "Enter a valid email address"
      : "";
  const pwErr = !pw ? "Enter your password" : pw.length < 6 ? "At least 6 characters" : "";
  const codeErr = code.trim().length < 6 ? "Enter the 6-digit code" : "";

  const finish = () => {
    const first = email.split("@")[0];
    setUser({ loggedIn: true, role, name: first ? first[0].toUpperCase() + first.slice(1) : "Aisyah" });
    toast(mode === "login" ? "Welcome back" : "Account created");
    navigate(role === "owner" ? "owner-dashboard" : "user-dashboard");
  };

  // After Clerk activates the session, app-context (useUser) syncs the real
  // user + role; we just route to the right dashboard.
  const afterAuth = () => {
    // Registration is a conversion; login is not. (Google OAuth signups complete
    // in the SSO callback route — tracked server-side in Phase 2.)
    if (mode === "register") track.signUp("email", role, email);
    toast(mode === "login" ? "Welcome back" : "Account created");
    navigate(role === "owner" ? "owner-dashboard" : "user-dashboard");
  };

  // Step 1 — email the 6-digit code (sign-in) or create the sign-up + send code.
  const sendCode = async () => {
    setAuthErr("");
    setSending(true);
    try {
      if (mode === "login") {
        if (!siLoaded || !signIn) throw new Error("not_ready");
        const res = await signIn.create({ identifier: email });
        const factor = res.supportedFirstFactors?.find((f) => f.strategy === "email_code") as
          | { emailAddressId: string }
          | undefined;
        if (!factor) throw new Error("We couldn’t find an account for that email — try Sign up.");
        await signIn.prepareFirstFactor({ strategy: "email_code", emailAddressId: factor.emailAddressId });
      } else {
        if (!suLoaded || !signUp) throw new Error("not_ready");
        // accountType rides Clerk unsafeMetadata → the user.created webhook
        // provisions profiles.role, so business owners land in the right
        // dashboard from their very first session. refCode credits a referral.
        const refCode = readRefCode();
        await signUp.create({ emailAddress: email, unsafeMetadata: { accountType: role, ...(refCode ? { refCode } : {}) } });
        await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      }
      setCodeSent(true);
      setTouched(false);
      toast("Check your inbox ✉️");
    } catch (err) {
      const msg = clerkErr(err) || "Couldn’t send the code — please try again.";
      setAuthErr(msg);
      toast(msg);
    } finally {
      setSending(false);
    }
  };

  // Step 2 — verify the code and activate the session.
  const verifyCode = async () => {
    setAuthErr("");
    setSending(true);
    try {
      if (mode === "login") {
        if (!signIn || !setActiveSignIn) throw new Error("not_ready");
        const res = await signIn.attemptFirstFactor({ strategy: "email_code", code });
        if (res.status === "complete" && res.createdSessionId) {
          await setActiveSignIn({ session: res.createdSessionId });
          afterAuth();
        } else throw new Error("Incorrect or expired code.");
      } else {
        if (!signUp || !setActiveSignUp) throw new Error("not_ready");
        const res = await signUp.attemptEmailAddressVerification({ code });
        if (res.status === "complete" && res.createdSessionId) {
          await setActiveSignUp({ session: res.createdSessionId });
          afterAuth();
        } else throw new Error("Incorrect or expired code.");
      }
    } catch (err) {
      const msg = clerkErr(err) || "Incorrect or expired code.";
      setAuthErr(msg);
      toast(msg);
    } finally {
      setSending(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!clerkConfigured) {
      if (emailErr || pwErr) return;
      finish();
      return;
    }
    if (!codeSent) {
      if (emailErr) return;
      await sendCode();
    } else {
      if (codeErr) return;
      await verifyCode();
    }
  };

  const googleSignIn = async () => {
    if (!clerkConfigured) {
      finish();
      return;
    }
    try {
      // Stash the account-type choice for the post-redirect fallback
      // (app-context reads it after the OAuth round-trip in case the
      // metadata path doesn't stick, e.g. sign-up transferred to sign-in).
      try { sessionStorage.setItem("hh-account-type", role); } catch { /* private mode */ }
      if (mode === "register") {
        if (!suLoaded || !signUp) return;
        const refCode = readRefCode();
        await signUp.authenticateWithRedirect({
          strategy: "oauth_google",
          redirectUrl: `${window.location.origin}/sign-in/sso-callback`,
          redirectUrlComplete: `${window.location.origin}/`,
          unsafeMetadata: { accountType: role, ...(refCode ? { refCode } : {}) },
        });
        return;
      }
      if (!siLoaded || !signIn) return;
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: `${window.location.origin}/sign-in/sso-callback`,
        redirectUrlComplete: `${window.location.origin}/`,
      });
    } catch (err) {
      const msg = clerkErr(err) || "Google sign-in failed — please try again.";
      setAuthErr(msg);
      toast(msg);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-aside hh-pattern">
        <Logo light onClick={()=>navigate('home')} />
        <figure className="auth-hadith">
          <span className="auth-hadith-mark" aria-hidden="true">&ldquo;</span>
          <blockquote>The truthful, trustworthy merchant will be with the Prophets, the truthful, and the martyrs.</blockquote>
          <figcaption><span className="auth-hadith-rule" aria-hidden="true" />Prophet Muhammad <span className="auth-hadith-saw" aria-label="peace be upon him">ﷺ</span><small>Jāmiʿ at-Tirmidhī 1209</small></figcaption>
        </figure>
        <div className="auth-aside-foot">
          <h2 style={{color:'#fff', fontSize:'1.9rem', maxWidth:360}}>Singapore’s most trusted halal directory</h2>
          <p style={{color:'#CFE0DA', marginTop:12, maxWidth:340}}>Save your favourite places, follow Muslim-owned businesses, and discover with confidence.</p>
          <div className="flex g8 wrap" style={{marginTop:18}}><Badge type="muis" lg/><Badge type="owned" lg/><Badge type="admin" lg/></div>
        </div>
      </div>
      <div className="auth-form">
        <button className="btn btn-ghost btn-sm auth-back" onClick={()=>navigate('home')}><Icon name="back" size={18}/> Back</button>
        <div className="auth-card">
          <div className="auth-tabs">
            <button className={mode==='login'?'on':''} onClick={()=>setMode('login')}>Log in</button>
            <button className={mode==='register'?'on':''} onClick={()=>setMode('register')}>Sign up</button>
          </div>
          <h1 style={{fontSize:'1.6rem', marginTop:18}}>{mode==='login'?'Welcome back':'Create your account'}</h1>
          <p className="muted" style={{marginTop:4}}>{clerkConfigured ? "No password needed — continue with Google, or we’ll email you a 6-digit code." : (mode==='login'?'Log in to manage saved places and reviews.':'Join Humble Halal in a few seconds.')}</p>

          <button className="btn btn-outline btn-block" style={{marginTop:18}} onClick={googleSignIn}><Icon name="google" size={20}/> Continue with Google</button>
          <div className="auth-or"><span>or</span></div>

          {clerkConfigured && codeSent ? (
          <form onSubmit={submit} className="stack g14" noValidate>
            <div className="notice notice-ok" role="status" style={{ alignItems: "flex-start" }}>
              <Icon name="check" size={20} />
              <div>
                <div style={{ fontWeight: 700 }}>Check your inbox ✉️</div>
                <p className="muted" style={{ fontSize: ".88rem", marginTop: 4, lineHeight: 1.5 }}>
                  We emailed a 6-digit code to <strong>{email}</strong>. Enter it below to finish — it expires in a few minutes.
                </p>
              </div>
            </div>
            <div className="field">
              <label htmlFor="login-code">6-digit code</label>
              <input id="login-code" className="input" inputMode="numeric" autoComplete="one-time-code" placeholder="123456" value={code}
                onChange={e=>{ setCode(e.target.value.replace(/\D/g, "").slice(0, 6)); if (authErr) setAuthErr(""); }}
                aria-invalid={touched && (!!codeErr || !!authErr)} aria-describedby={touched && codeErr ? "login-code-err" : undefined} />
              {touched && codeErr && <span id="login-code-err" className="field-error"><Icon name="warning" size={13}/> {codeErr}</span>}
            </div>
            {authErr && <div className="notice notice-warn" role="alert"><Icon name="warning" size={16}/> <span>{authErr}</span></div>}
            <button className="btn btn-primary btn-block btn-lg" type="submit" disabled={sending} aria-busy={sending}>{sending ? 'Verifying…' : 'Verify & continue'}</button>
            <button type="button" className="link-inline tc" onClick={() => { setCodeSent(false); setCode(""); setAuthErr(""); }}>Use a different email</button>
          </form>
          ) : (
          <form onSubmit={submit} className="stack g14" noValidate>
            <div className="field">
              <label htmlFor="login-email">Email</label>
              <input id="login-email" className="input" type="email" autoComplete="email" placeholder="you@email.com" value={email} onChange={e=>{ setEmail(e.target.value); if (authErr) setAuthErr(""); }}
                aria-invalid={touched && (!!emailErr || !!authErr)} aria-describedby={touched && emailErr ? "login-email-err" : undefined} />
              {touched && emailErr && <span id="login-email-err" className="field-error"><Icon name="warning" size={13}/> {emailErr}</span>}
            </div>
            {!clerkConfigured && (
              <div className="field">
                <label htmlFor="login-pw">Password</label>
                <input id="login-pw" className="input" type="password" autoComplete={mode==='login'?'current-password':'new-password'} placeholder="••••••••" value={pw} onChange={e=>setPw(e.target.value)}
                  aria-invalid={touched && !!pwErr} aria-describedby={touched && pwErr ? "login-pw-err" : undefined} />
                {touched && pwErr && <span id="login-pw-err" className="field-error"><Icon name="warning" size={13}/> {pwErr}</span>}
              </div>
            )}

            {mode==='register' && (
              <div>
                <label style={{fontWeight:600, fontSize:'.88rem'}}>I’m joining as</label>
                <div className="role-grid mt8">
                  <button type="button" className={`role-opt ${role==='user'?'on':''}`} aria-pressed={role==='user'} onClick={()=>setRole('user')}>
                    <Icon name="user" size={22}/><div style={{fontWeight:700,marginTop:6}}>I’m a user</div><span className="faint" style={{fontSize:'.78rem'}}>Discover &amp; save places</span></button>
                  <button type="button" className={`role-opt ${role==='owner'?'on':''}`} aria-pressed={role==='owner'} onClick={()=>setRole('owner')}>
                    <Icon name="store" size={22}/><div style={{fontWeight:700,marginTop:6}}>I’m a business owner</div><span className="faint" style={{fontSize:'.78rem'}}>List &amp; manage a business</span></button>
                </div>
              </div>
            )}
            {authErr && <div className="notice notice-warn" role="alert"><Icon name="warning" size={16}/> <span>{authErr}</span></div>}
            <button className="btn btn-primary btn-block btn-lg" type="submit" disabled={sending} aria-busy={sending}>{sending ? 'Sending…' : (clerkConfigured ? 'Email me a code' : (mode==='login'?'Log in':'Create account'))}</button>
          </form>
          )}
          <p className="faint tc" style={{fontSize:'.8rem', marginTop:16}}>By continuing you agree to our <a href="/terms" className="link-inline">Terms</a> &amp; <a href="/privacy" className="link-inline">Privacy Policy</a>.</p>
        </div>
      </div>
    </div>
  );
}

/* =============================================================
   USER DASHBOARD
============================================================= */
export function UserDashboardScreen({ passportEnabled = false }: { passportEnabled?: boolean }) {
  const { navigate, params, state, setUser, setPref, toast, createCollection, toggleInCollection, flags } = useApp();
  const dir = useDirectory();
  const { signOut } = useClerk();
  const clerkConfigured = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const logOut = async () => {
    if (clerkConfigured) {
      try { await signOut(); } catch { /* ignore */ }
    }
    setUser({ loggedIn: false, role: "user", name: "Guest" });
    navigate("home");
  };
  // /dashboard is a STATIC route, so the server `passportEnabled` prop is baked
  // false at build time and never reflects an admin flag flip. The client flags
  // context (refreshed from /api/flags after mount) is the source of truth — OR
  // the prop so a dynamic render still works. Keeps the Passport tab reactive.
  const passportOn = flags?.passport || passportEnabled;
  // Deep-linkable tab (email CTAs use /dashboard?tab=tickets).
  const TAB_IDS = [...(passportOn ? ["passport"] : []), "saved", "collections", "tickets", "requests", "wishlist", "recent", "reviews", "settings"];
  const [tab, setTab] = useState(TAB_IDS.includes(String(params.tab)) ? String(params.tab) : (passportOn ? "passport" : "saved"));
  // Honour a ?tab=passport deep-link once the flag arrives client-side (the tab
  // isn't in TAB_IDS at first render on a static page).
  useEffect(() => { if (passportOn && String(params.tab) === "passport") setTab("passport"); }, [passportOn, params.tab]);
  const get = (ids: string[]) => ids.map(id => dir.get(id)).filter(Boolean) as typeof dir.listings;
  const saved = get(state.saved), wish = get(state.wishlist), recent = get(state.recent);
  const tabs: [string, string, string][] = [...(passportOn ? [['passport','Passport','trophy'] as [string,string,string]] : []),['saved','Saved places','heart'],['collections','Collections','bookmark'],['tickets','My tickets','ticket'],['requests','My requests','doc'],['wishlist','Want to try','clock'],['recent','Recently viewed','clock'],['reviews','My reviews','star'],['settings','Settings','settings']];
  const cur = ({ saved, wishlist:wish, recent } as Record<string, typeof saved>)[tab];

  // Profile settings — real save to /api/user/update (display name) + client pref (home area).
  const [pName, setPName] = useState(state.user.name);
  const [pArea, setPArea] = useState(state.prefs?.homeArea || "");
  const [pSaving, setPSaving] = useState(false);
  const saveProfile = async () => {
    setPSaving(true);
    try {
      const res = await fetch("/api/user/update", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: pName }) });
      const d = await res.json().catch(() => ({}));
      if (res.ok && d.ok) {
        setUser({ ...state.user, name: (pName.trim() || state.user.name) });
        setPref({ homeArea: pArea });
        toast("Profile saved");
      } else if (res.status === 401) {
        toast("Please sign in to save your profile");
      } else {
        toast("Couldn’t save — please try again");
      }
    } catch { toast("Couldn’t save — please try again"); }
    setPSaving(false);
  };
  const newCollection = () => {
    const name = typeof window !== "undefined" ? window.prompt("Name your collection (e.g. Date night, Iftar 2026)") : "";
    if (name && name.trim()) createCollection(name.trim());
  };

  // My reviews — load the signed-in user's own reviews from /api/reviews/mine.
  type MyReview = { id: string; businessName: string; businessSlug: string | null; rating: number; text: string; status: string; created_at: string };
  const [myReviews, setMyReviews] = useState<MyReview[]>([]);
  const [reviewsLoaded, setReviewsLoaded] = useState(false);
  useEffect(() => {
    if (!state.user.loggedIn) { setMyReviews([]); setReviewsLoaded(true); return; }
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/reviews/mine");
        const d = await res.json().catch(() => ({}));
        if (active && d?.ok && Array.isArray(d.reviews)) setMyReviews(d.reviews as MyReview[]);
      } catch { /* graceful */ }
      finally { if (active) setReviewsLoaded(true); }
    })();
    return () => { active = false; };
  }, [state.user.loggedIn]);

  return (
    <div className="screen-in hh-page dash">
      <div className="dash-header dash-header-user hh-pattern">
        <div className="hh-wrap flex between center wrap g12">
          <div className="flex g14 center">
            <span className="avatar" style={{width:56,height:56,fontSize:'1.4rem',background:'var(--gold)',color:'#3a2c08'}}>{(state.user.name||'A')[0]}</span>
            <div><h1 style={{color:'#fff', fontSize:'1.6rem'}}>{state.user.loggedIn?state.user.name:'Guest'}</h1>
              <p style={{color:'#CFE0DA', fontSize:'.9rem'}}>{state.user.loggedIn?'Assalamualaikum 👋':'Log in to sync your saves across devices'}</p></div>
          </div>
          <div className="flex g10 center">
            {state.user.loggedIn && <NotificationBell />}
            {!state.user.loggedIn
              ? <button className="btn btn-gold" onClick={()=>navigate('login')}>Log in</button>
              : <button className="btn" style={{background:'rgba(255,255,255,.14)',color:'#fff'}} onClick={logOut}><Icon name="logout" size={17}/> Log out</button>}
          </div>
        </div>
      </div>

      <div className="hh-wrap">
        <div className="dash-tabs">
          {tabs.map(([id,label,icon])=>(<button key={id} className={tab===id?'on':''} onClick={()=>setTab(id)}><Icon name={icon} size={17}/> {label}</button>))}
        </div>
        <div className="dash-pane">
          {['saved','wishlist','recent'].includes(tab) && (
            cur.length===0
              ? <Empty icon={tab==='saved'?'heart':tab==='wishlist'?'bookmark':'clock'} title={`Nothing here yet`} body="Explore places and tap the heart to save them for later." action="Start exploring" onAction={()=>navigate('explore')} />
              : <div className="grid-cards">{cur.map(l=><ListingCard key={l.id} item={l} />)}</div>
          )}
          {tab==='collections' && (
            <div className="stack g16">
              <div className="flex between center wrap g10">
                <p className="muted" style={{fontWeight:600}}>Organise your saved places into named lists.</p>
                <button className="btn btn-primary btn-sm" onClick={newCollection}><Icon name="plus" size={16}/> New collection</button>
              </div>
              {state.collections.length===0
                ? <Empty icon="bookmark" title="No collections yet" body="Create a collection like “Family weekend” or “Iftar 2026” to organise your finds." action="New collection" onAction={newCollection} />
                : state.collections.map(c=>{
                    const items = get(c.ids);
                    return (
                      <div key={c.id} className="card" style={{padding:18}}>
                        <div className="flex between center" style={{marginBottom:12}}>
                          <h3 style={{fontSize:'1.15rem'}}>{c.name} <span className="faint" style={{fontSize:'.85rem', fontWeight:600}}>· {items.length}</span></h3>
                          <details className="collection-add">
                            <summary className="btn btn-soft btn-sm"><Icon name="plus" size={15}/> Add places</summary>
                            <div className="collection-picker">
                              {saved.length===0
                                ? <p className="faint" style={{fontSize:'.84rem', padding:'4px 2px'}}>Save some places first (tap the heart), then add them here.</p>
                                : saved.map(l=>(
                                    <label key={l.id} className="collection-pick-row">
                                      <input type="checkbox" checked={c.ids.includes(l.id)} onChange={()=>toggleInCollection(c.id, l.id)} />
                                      <span>{l.name}</span>
                                    </label>
                                  ))}
                            </div>
                          </details>
                        </div>
                        {items.length===0
                          ? <p className="faint" style={{fontSize:'.88rem'}}>Empty — add saved places to this collection.</p>
                          : <div className="grid-cards">{items.map(l=><ListingCard key={l.id} item={l} />)}</div>}
                      </div>
                    );
                  })}
            </div>
          )}
          {tab==='tickets' && <MyTickets navigate={navigate} state={state} />}
          {tab==='requests' && <MyRequests navigate={navigate} state={state} />}
          {tab==='passport' && <PassportScreen />}
          {tab==='reviews' && (
            reviewsLoaded && myReviews.length===0
              ? <Empty icon="star" title="No reviews yet" body="You haven’t written any reviews yet. Explore places and share your experience." action="Start exploring" onAction={()=>navigate('explore')} />
              : <div className="stack g14">
                  {myReviews.map(r=>(
                    <div key={r.id} className="card" style={{padding:16}}>
                      <div className="flex between center wrap g10">
                        <div>
                          {r.businessSlug
                            ? <a href={screenToPath("detail", { id: r.businessSlug })} style={{fontWeight:700, color:'var(--emerald)'}}>{r.businessName}</a>
                            : <div style={{fontWeight:700}}>{r.businessName}</div>}
                          <span className="rs-stars" style={{display:'block', marginTop:2}}>{[1,2,3,4,5].map(i=><Icon key={i} name="starf" size={12} style={{color:i<=r.rating?'var(--gold)':'var(--line-strong)'}}/>)}</span>
                        </div>
                        <span className={`pill-tag ${r.status==='published'?'green':'amber'}`}>{r.status==='published'?'Published':'Pending'}</span>
                      </div>
                      {r.text && <p className="muted" style={{marginTop:10, fontSize:'.92rem'}}>{r.text}</p>}
                      <p className="faint" style={{marginTop:8, fontSize:'.78rem'}}>{new Date(r.created_at).toLocaleDateString('en-SG', { year:'numeric', month:'short', day:'numeric' })}</p>
                    </div>
                  ))}
                </div>
          )}
          {tab==='settings' && (
            <div className="card" style={{padding:22, maxWidth:540}}>
              <h3 style={{fontSize:'1.2rem'}}>Profile settings</h3>
              <div className="stack g14 mt16">
                <div className="field"><label htmlFor="set-name">Display name</label><input id="set-name" className="input" value={pName} onChange={(e)=>setPName(e.target.value)} /></div>
                <div className="field"><label htmlFor="set-email">Email</label><input id="set-email" className="input" placeholder="Managed by your sign-in" disabled /></div>
                <div className="field"><label htmlFor="set-area">Home area</label><select id="set-area" className="select" value={pArea} onChange={(e)=>setPArea(e.target.value)}><option value="">Select your area</option>{REGIONS.map(r=><optgroup key={r} label={r}>{townsInRegion(r).map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</optgroup>)}</select></div>
                <button className="btn btn-primary" onClick={saveProfile} disabled={pSaving}>{pSaving ? "Saving…" : "Save changes"}</button>
              </div>
            </div>
          )}
          {state.user.loggedIn && state.user.role !== "owner" && (
            <div className="card" style={{padding:20, marginTop:16}}>
              <div className="flex between center wrap g12">
                <div>
                  <div style={{fontWeight:700, fontSize:'1.05rem'}}>Run events or own a halal business?</div>
                  <p className="faint" style={{fontSize:'.88rem', marginTop:2}}>Host an event or list your business to unlock a business dashboard — manage listings, tickets, attendees &amp; payouts.</p>
                </div>
                <div className="flex g8 wrap">
                  <button className="btn btn-gold btn-sm" onClick={()=>navigate('host-event')}><Icon name="plus" size={16}/> Host an event</button>
                  <button className="btn btn-outline btn-sm" onClick={()=>navigate('for-business')}><Icon name="store" size={16}/> List your business</button>
                </div>
              </div>
            </div>
          )}
          <div className="suggest-cta">
            <div><div style={{fontWeight:700}}>Know a great halal spot we’re missing?</div><p className="faint" style={{fontSize:'.86rem'}}>Help the community discover it.</p></div>
            <button className="btn btn-outline" onClick={()=>navigate('suggest')}><Icon name="plus" size={17}/> Suggest a business</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =============================================================
   SUGGEST A BUSINESS
============================================================= */
export function SuggestScreen() {
  const { navigate } = useApp();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const nameErr = !name.trim() ? "Please enter the business name" : "";
  const emailErr = email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? "Enter a valid email address" : "";
  const submit = async () => {
    setTouched(true);
    if (nameErr || emailErr) return;
    try {
      await fetch("/api/submissions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "suggest", name, email: email.trim() || undefined }) });
    } catch { /* graceful */ }
    track.leadSubmit("suggest", {}, email.trim() ? { email: email.trim() } : undefined);
    navigate("success", { type: "suggest" });
  };
  return (
    <div className="screen-in hh-page">
      <MobileHeader title="Suggest a business" onBack={()=>navigate('home')} />
      <div className="form-page">
        <div className="form-head"><span className="eyebrow">Community</span><h1 style={{fontSize:'1.8rem', marginTop:8}}>Suggest a business</h1><p className="muted" style={{marginTop:6}}>Recommend a place you love — we’ll review and add it. This is different from listing your own business.</p></div>
        <div className="card form-card">
          <div className="stack g16">
            <div className="field">
              <label htmlFor="sg-name">Business name</label>
              <input id="sg-name" className="input" placeholder="What’s it called?" value={name} onChange={e=>setName(e.target.value)}
                aria-required="true" aria-invalid={touched && !!nameErr} aria-describedby={touched && nameErr ? "sg-name-err" : undefined} />
              {touched && nameErr && <span id="sg-name-err" className="field-error"><Icon name="warning" size={13}/> {nameErr}</span>}
            </div>
            <div className="grid2">
              <div className="field"><label>Area</label><select className="select"><option>Select area</option>{HHData.areas.map(a=><option key={a.id}>{a.name}</option>)}</select></div>
              <div className="field"><label>Category</label><select className="select"><option>Select category</option>{HHData.categories.map(c=><option key={c.id}>{c.label}</option>)}</select></div>
            </div>
            <div className="field"><label>Why do you recommend it? <span className="hint">(optional)</span></label><textarea className="textarea" placeholder="Tell us what’s great about it" /></div>
            <div className="field">
              <label htmlFor="sg-email">Your email <span className="hint">(optional — we’ll confirm we got it)</span></label>
              <input id="sg-email" className="input" type="email" placeholder="you@email.com" value={email} onChange={e=>setEmail(e.target.value)}
                aria-invalid={touched && !!emailErr} aria-describedby={touched && emailErr ? "sg-email-err" : undefined} />
              {touched && emailErr && <span id="sg-email-err" className="field-error"><Icon name="warning" size={13}/> {emailErr}</span>}
            </div>
            <div className="field"><label>Link or photo <span className="hint">(optional)</span></label><div className="upload-zone" style={{padding:'18px'}}><Icon name="camera" size={22}/><span className="faint" style={{fontSize:'.82rem', marginTop:6}}>Add a photo or paste a link</span></div></div>
            <button className="btn btn-primary btn-lg" onClick={submit}>Submit suggestion</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =============================================================
   REQUEST A QUOTE (lead-gen for high-ticket verticals)
============================================================= */
const QUOTE_VERTICALS = LEAD_VERTICALS.map((v) => v.label);
const QUOTE_BUDGETS = ["Under $500", "$500–$2,000", "$2,000–$5,000", "$5,000+", "Not sure yet"];

export function RequestQuoteScreen() {
  const { navigate, params, addRequest } = useApp();
  const [vertical, setVertical] = useState(String(params.category || ""));
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [area, setArea] = useState("");
  const [budget, setBudget] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [details, setDetails] = useState("");
  const [consent, setConsent] = useState(false);
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // Where the CTA came from — a listing detail page and/or a pSEO page.
  const businessSlug = String(params.business || "");
  const sourcePath = String(params.source || "");

  const nameErr = !name.trim() ? "Please enter your name" : "";
  const contactErr = !email.trim() && !phone.trim() ? "Add an email or phone so vendors can reach you" : "";
  const emailErr =
    email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? "Please enter a valid email" : "";
  const consentErr = !consent ? "Please tick the box so providers are allowed to contact you" : "";

  const submit = async () => {
    setTouched(true);
    if (nameErr || contactErr || emailErr || consentErr) return;
    setSubmitting(true);
    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, email, phone, category: vertical, area, budget, eventDate, details,
          businessSlug: businessSlug || undefined,
          sourcePath: sourcePath || undefined,
          consent: true,
          consentVersion: LEAD_CONSENT_VERSION,
        }),
      });
    } catch {
      /* graceful — still confirm to the user */
    }
    setSubmitting(false);
    track.leadSubmit("quote", { listing_category: vertical || undefined }, { email: email || undefined, phone: phone || undefined });
    addRequest("quote", [vertical, area].filter(Boolean).join(" · ") || "Quote request");
    navigate("success", { type: "quote" });
  };

  return (
    <div className="screen-in hh-page">
      <MobileHeader title="Request quotes" onBack={() => navigate("home")} />
      <div className="form-page">
        <div className="form-head">
          <span className="eyebrow">Free · no obligation</span>
          <h1 style={{ fontSize: "1.8rem", marginTop: 8 }}>Get quotes from halal vendors</h1>
          <p className="muted" style={{ marginTop: 6 }}>
            Tell us what you need and we’ll match you with trusted Muslim-owned &amp; halal-certified providers who send you quotes. Free for you — always.
          </p>
        </div>
        <div className="card form-card">
          <div className="stack g16">
            <div className="field">
              <label htmlFor="rq-vert">What do you need?</label>
              <select id="rq-vert" className="select" value={vertical} onChange={(e) => setVertical(e.target.value)}>
                <option value="">Select a service</option>
                {QUOTE_VERTICALS.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
            <div className="grid2">
              <div className="field">
                <label htmlFor="rq-name">Your name</label>
                <input id="rq-name" className="input" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)}
                  aria-required="true" aria-invalid={touched && !!nameErr} aria-describedby={touched && nameErr ? "rq-name-err" : undefined} />
                {touched && nameErr && <span id="rq-name-err" className="field-error"><Icon name="warning" size={13} /> {nameErr}</span>}
              </div>
              <div className="field">
                <label htmlFor="rq-area">Area <span className="hint">(optional)</span></label>
                <select id="rq-area" className="select" value={area} onChange={(e) => setArea(e.target.value)}>
                  <option value="">Select area</option>
                  {HHData.areas.map((a) => (<option key={a.id} value={a.name}>{a.name}</option>))}
                </select>
              </div>
            </div>
            <div className="grid2">
              <div className="field">
                <label htmlFor="rq-email">Email</label>
                <input id="rq-email" type="email" className="input" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={touched && !!emailErr} aria-describedby={touched && emailErr ? "rq-email-err" : undefined} />
                {touched && emailErr && <span id="rq-email-err" className="field-error"><Icon name="warning" size={13} /> {emailErr}</span>}
              </div>
              <div className="field">
                <label htmlFor="rq-phone">Phone / WhatsApp</label>
                <input id="rq-phone" className="input" placeholder="+65 …" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </div>
            {touched && contactErr && <span className="field-error"><Icon name="warning" size={13} /> {contactErr}</span>}
            <div className="grid2">
              <div className="field">
                <label htmlFor="rq-budget">Budget <span className="hint">(optional)</span></label>
                <select id="rq-budget" className="select" value={budget} onChange={(e) => setBudget(e.target.value)}>
                  <option value="">Select budget</option>
                  {QUOTE_BUDGETS.map((b) => (<option key={b} value={b}>{b}</option>))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="rq-date">Event date <span className="hint">(optional)</span></label>
                <input id="rq-date" type="date" className="input" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
              </div>
            </div>
            <div className="field">
              <label htmlFor="rq-details">Details</label>
              <textarea id="rq-details" className="textarea" placeholder="e.g. iftar buffet for 80 pax, MUIS-certified, in Tampines on 14 Mar" value={details} onChange={(e) => setDetails(e.target.value)} />
            </div>
            <div className="field">
              <label style={{ display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer", fontWeight: 400 }}>
                <input
                  type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)}
                  aria-required="true" aria-invalid={touched && !!consentErr}
                  aria-describedby={touched && consentErr ? "rq-consent-err" : undefined}
                  style={{ marginTop: 3, flexShrink: 0 }}
                />
                <span style={{ fontSize: ".86rem" }}>
                  I agree that Humble Halal may share my request and contact details with up to {LEAD_ROUTE_CAP} matching
                  halal providers, who may contact me directly about this request.
                </span>
              </label>
              {touched && consentErr && <span id="rq-consent-err" className="field-error"><Icon name="warning" size={13} /> {consentErr}</span>}
            </div>
            <button className="btn btn-primary btn-lg" disabled={submitting} onClick={submit}>
              {submitting ? "Sending…" : "Get my quotes"}
            </button>
            <p className="faint tc" style={{ fontSize: ".82rem" }}>
              Quotes typically arrive within 1–2 business days. Free for you — always; no spam. We keep your request
              only as long as needed to arrange quotes (see our <a href="/pdpa" style={{ textDecoration: "underline" }}>PDPA policy</a>).
              Vendors are independent; please do your own checks before engaging them.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =============================================================
   CLAIM BUSINESS
============================================================= */
export function ClaimScreen() {
  const { navigate, params, toast, addRequest } = useApp();
  const dir = useDirectory();
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState(params.id ? dir.get(String(params.id)) || null : null);
  const [role, setRole] = useState("Owner");
  const [message, setMessage] = useState("");
  const [proof, setProof] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const results = q ? dir.listings.filter(l=>l.name.toLowerCase().includes(q.toLowerCase())) : dir.listings.slice(0,4);

  // Pre-select the business when arriving from a claim link (/claim?id=… or a
  // slug). Query params hydrate AFTER mount, so useState's one-shot initializer
  // misses them — sync here once params.id + the directory are available, so the
  // owner lands straight on their listing instead of having to search.
  useEffect(() => {
    if (picked || !params.id) return;
    const found = dir.get(String(params.id));
    if (found) setPicked(found);
  }, [params.id, dir, picked]);

  // Proof of ownership is OPTIONAL at submission to keep claiming frictionless
  // (cold-outreach conversion). Ownership is never auto-granted — every claim
  // goes to the admin queue and is verified before approval, so the trust gate
  // is the admin review, not a blocking upload. Attaching a doc just speeds it up.
  const MAX_PROOF_BYTES = 8 * 1024 * 1024;
  function onPickFile(f: File | null) {
    if (!f) { setProof(null); return; }
    if (f.size > MAX_PROOF_BYTES) { toast("That file is over 8MB — please choose a smaller one"); return; }
    setProof(f);
  }

  return (
    <div className="screen-in hh-page">
      <MobileHeader title="Claim your business" onBack={()=>navigate('for-business')} />
      <div className="form-page">
        <div className="form-head"><span className="eyebrow">For owners</span><h1 style={{fontSize:'1.8rem', marginTop:8}}>Claim your business</h1><p className="muted" style={{marginTop:6}}>Find your listing, prove you own it, and take control of your profile.</p></div>

        {!picked ? (
          <div className="card form-card">
            <div className="field"><label>Find your listing</label><div className="searchbar" style={{marginTop:6}}><Icon name="search" className="lead"/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search your business name" /></div></div>
            <div className="stack g10 mt16">
              {results.map(l=>(
                <button key={l.id} className="claim-result" onClick={()=>setPicked(l)}>
                  <ImagePh label={l.img} tone={l.tone} src={l.image} style={{width:54,height:54,borderRadius:10,flex:'none'}}/>
                  <div className="f1" style={{textAlign:'left'}}><div style={{fontWeight:700}}>{l.name}</div><div className="lc-meta">{l.area} · {l.cuisine}</div></div>
                  <Icon name="chevron" size={18} style={{color:'var(--ink-faint)'}}/>
                </button>
              ))}
            </div>
            <p className="faint tc" style={{fontSize:'.84rem', marginTop:16}}>Can’t find it? <span className="link-inline" onClick={()=>navigate('add-listing')}>Add a new listing →</span></p>
          </div>
        ) : (
          <div className="card form-card">
            <div className="flex g12 center" style={{paddingBottom:16, borderBottom:'1px solid var(--line)'}}>
              <ImagePh label={picked.img} tone={picked.tone} src={picked.image} style={{width:54,height:54,borderRadius:10,flex:'none'}}/>
              <div className="f1"><div style={{fontWeight:700}}>{picked.name}</div><div className="lc-meta">{picked.area}</div></div>
              <button className="btn btn-ghost btn-sm" onClick={()=>setPicked(null)}>Change</button>
            </div>
            <div className="stack g16 mt16">
              <div className="field"><label>Your role</label><select className="select" value={role} onChange={e=>setRole(e.target.value)}><option>Owner</option><option>Manager</option><option>Authorised staff</option></select></div>
              <div className="field">
                <label>Proof of ownership <span className="hint">(optional — speeds up approval)</span></label>
                <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.heic" hidden onChange={e=>onPickFile(e.target.files?.[0] ?? null)} />
                <div className={`upload-zone ${proof ? "has-file" : ""}`} role="button" tabIndex={0} onClick={()=>fileRef.current?.click()} onKeyDown={e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); fileRef.current?.click(); } }}>
                  <Icon name={proof ? "check" : "upload"} size={24}/>
                  {proof ? (
                    <>
                      <div style={{fontWeight:700,marginTop:6}}>{proof.name}</div>
                      <p className="faint" style={{fontSize:'.8rem'}}>{(proof.size/1024).toFixed(0)} KB · <span className="link-inline" onClick={(e)=>{ e.stopPropagation(); setProof(null); if(fileRef.current) fileRef.current.value=''; }}>Remove</span></p>
                    </>
                  ) : (
                    <>
                      <div style={{fontWeight:700,marginTop:6}}>Upload document</div>
                      <p className="faint" style={{fontSize:'.8rem'}}>Business registration, utility bill, or MUIS cert (PDF/JPG/PNG, max 8MB)</p>
                      <span className="btn btn-soft btn-sm mt8">Choose file</span>
                    </>
                  )}
                </div>
              </div>
              <div className="field"><label>Message to our team <span className="hint">(optional)</span></label><textarea className="textarea" placeholder="Anything we should know?" value={message} onChange={e=>setMessage(e.target.value)} /></div>
              <button className="btn btn-primary btn-lg" disabled={submitting} onClick={async ()=>{
                setSubmitting(true);
                try {
                  await fetch("/api/submissions", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ kind:"claim", businessId: picked.id, name: picked.name, role, message, proofFileName: proof?.name ?? null, proofType: proof?.type ?? null, proofSize: proof?.size ?? null }) });
                } catch { /* graceful */ }
                track.leadSubmit("claim", { listing_id: String(picked.id) });
                addRequest("claim", picked.name);
                navigate('success',{type:'claim'});
              }}>{submitting ? "Submitting…" : "Submit claim"}</button>
              <p className="faint tc" style={{fontSize:'.8rem'}}>We verify ownership before your claim is approved.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* =============================================================
   REPORT / CORRECTION
============================================================= */
export function ReportScreen() {
  const { navigate, params, toast } = useApp();
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const dir = useDirectory();
  const item = params.id ? dir.get(String(params.id)) : null;
  const emailErr = email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? "Enter a valid email address" : "";
  const submitReport = async () => {
    setTouched(true);
    if (emailErr) return;
    setBusy(true);
    try {
      await fetch("/api/reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ businessId: item?.id || "", reason, details, email: email.trim() || undefined }) });
    } catch { /* graceful */ }
    setBusy(false);
    navigate("success", { type: "report" });
  };
  const reasons = [
    ['halal','Wrong halal status','The certification or halal info is incorrect'],
    ['closed','Permanently closed','This place is no longer operating'],
    ['hours','Wrong opening hours','Hours shown are inaccurate'],
    ['address','Wrong address','Location or address is incorrect'],
    ['owner','No longer Muslim-owned','Ownership has changed'],
    ['menu','Misleading menu','Menu or photos are misleading'],
    ['other','Something else','A different issue'],
  ];
  return (
    <div className="screen-in hh-page">
      <MobileHeader title="Report an issue" onBack={()=>navigate(item?'detail':'home', item?{id:item.id}:{})} />
      <div className="form-page">
        <div className="form-head"><span className="eyebrow">Help us stay accurate</span><h1 style={{fontSize:'1.8rem', marginTop:8}}>Report incorrect info</h1>
          {item && <p className="muted" style={{marginTop:6}}>For <strong>{item.name}</strong></p>}</div>
        <div className="card form-card">
          <label id="report-q" style={{fontWeight:600, fontSize:'.88rem'}}>What’s wrong?</label>
          <div className="stack g8 mt12" role="radiogroup" aria-labelledby="report-q">
            {reasons.map(([v,t,d])=>(
              <button key={v} role="radio" aria-checked={reason===v} className={`report-opt ${reason===v?'on':''}`} onClick={()=>setReason(v)}>
                <div style={{textAlign:'left'}}><div style={{fontWeight:700}}>{t}</div><div className="faint" style={{fontSize:'.8rem'}}>{d}</div></div>
                <span className={`radio ${reason===v?'on':''}`} />
              </button>
            ))}
          </div>
          <div className="field mt16"><label>Details <span className="hint">(optional)</span></label><textarea className="textarea" placeholder="Add any detail that helps us verify" value={details} onChange={(e)=>setDetails(e.target.value)} /></div>
          <div className="field mt16">
            <label htmlFor="rp-email">Your email <span className="hint">(optional — we’ll confirm we got it)</span></label>
            <input id="rp-email" className="input" type="email" placeholder="you@email.com" value={email} onChange={(e)=>setEmail(e.target.value)}
              aria-invalid={touched && !!emailErr} aria-describedby={touched && emailErr ? "rp-email-err" : undefined} />
            {touched && emailErr && <span id="rp-email-err" className="field-error"><Icon name="warning" size={13}/> {emailErr}</span>}
          </div>
          <button className="btn btn-primary btn-lg btn-block mt16" disabled={!reason || busy} onClick={submitReport}>{busy ? "Submitting…" : "Submit report"}</button>
        </div>
      </div>
    </div>
  );
}

/* =============================================================
   HOW WE VERIFY (Trust page)
============================================================= */
export function VerifyScreen() {
  const { navigate } = useApp();
  const badges: { type: BadgeKey; tier: string; how: string; example: string }[] = [
    { type:'muis', tier:'Certified', how:'The business holds a valid MUIS halal certificate. We record the certificate number and link to the official HalalSG register so you can verify it yourself.', example:'A restaurant with full-kitchen MUIS certification.' },
    { type:'admin', tier:'Certified', how:'Our team has reviewed documentary proof (e.g. business registration, supplier halal certs) and confirmed the halal claim, even where MUIS certification isn’t applicable.', example:'A Muslim-owned home bakery with verified halal suppliers.' },
    { type:'owned', tier:'Verified', how:'We have confirmed the business is owned by a Muslim individual or family through registration documents.', example:'A family-run aircon service in the east.' },
    { type:'friendly', tier:'Self-declared — not certified', how:'The business describes itself as halal-friendly. We have NOT verified this. Always ask the business directly.', example:'A café serving no pork but without certification.' },
    { type:'nopork', tier:'Self-declared — not certified', how:'The business states it uses no pork and no lard. This is self-reported and NOT verified by us or MUIS.', example:'A hawker stall declaring no pork no lard.' },
    { type:'pending', tier:'Under review', how:'The business has submitted documents and is awaiting our review. No claim is confirmed yet.', example:'A newly added café awaiting document checks.' },
  ];
  return (
    <div className="screen-in hh-page">
      <MobileHeader title="How we verify" onBack={()=>navigate('home')} />
      <section className="hero hero--immersive hh-pattern" style={{padding:'0'}}>
        <div className="hh-wrap hero-inner" style={{textAlign:'center'}}>
          <span className="eyebrow" style={{color:'var(--gold)'}}>Trust &amp; verification</span>
          <h1 className="hero-h1" style={{color:'#fff', fontSize:'clamp(1.8rem,4vw,2.6rem)', maxWidth:680, margin:'12px auto 0'}}>How we verify halal status</h1>
          <p className="hero-sub" style={{color:'#CFE0DA', maxWidth:560, margin:'12px auto 0'}}>We’re a discovery platform — not a certifier. Here’s exactly what each badge means.</p>
        </div>
      </section>

      <div className="hh-wrap" style={{maxWidth:820, paddingTop:32}}>
        <div className="notice" style={{background:'var(--emerald-50)', border:'1px solid var(--emerald-100)', color:'var(--emerald-700)'}}>
          <Icon name="info" size={20}/>
          <span><strong>Humble Halal does not issue halal certification.</strong> For official certification, always check the <a className="link-inline" href={HALALSG_BASE} target="_blank" rel="noopener noreferrer">MUIS HalalSG register ↗</a>. We surface what we know and label clearly what is — and isn’t — verified.</span>
        </div>

        <div className="verify-list">
          {badges.map(b=>(
            <div key={b.type} className="verify-row card">
              <div className="verify-badge"><Badge type={b.type} lg/><span className={`verify-tier tier-${HHData.badgeMeta[b.type].tier}`}>{b.tier}</span></div>
              <div className="f1">
                <div style={{fontWeight:700, marginBottom:4}}>How we check</div>
                <p className="muted" style={{fontSize:'.92rem', lineHeight:1.55}}>{b.how}</p>
                <p className="faint" style={{fontSize:'.84rem', marginTop:8}}><strong>Example:</strong> {b.example}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="card" style={{padding:22, marginTop:24, textAlign:'center'}}>
          <h3 style={{fontSize:'1.2rem'}}>Found something inaccurate?</h3>
          <p className="muted" style={{marginTop:6}}>Help us keep the community safe and informed.</p>
          <div className="flex g10 center" style={{justifyContent:'center', marginTop:14}}>
            <button className="btn btn-primary" onClick={()=>navigate('report')}><Icon name="flag" size={17}/> Report a listing</button>
            <button className="btn btn-outline" onClick={()=>navigate('disclaimer')}>Read full disclaimer</button>
          </div>
        </div>
      </div>
      <Faq items={VERIFY_FAQ} title="Halal verification — frequently asked questions" />
    </div>
  );
}

/* =============================================================
   DISCLAIMER
============================================================= */
export function DisclaimerScreen() {
  const { navigate } = useApp();
  const sections = [
    ['Not a certification body','Humble Halal is an independent discovery platform. We do not issue, endorse, or replace official halal certification from MUIS or any authority.'],
    ['Verify before you visit','Certification status can change. Before relying on any listing, confirm directly with the business and on the official MUIS HalalSG register.'],
    ['Self-declared listings','Badges marked “Halal-Friendly” or “No Pork No Lard” are self-reported by businesses and have NOT been verified by us. Treat them as informational only.'],
    ['Community-sourced information','Some details (hours, menus, photos) are contributed by the community and business owners and may contain errors. Please report anything inaccurate.'],
    ['Your responsibility','Dietary decisions remain your own. If halal compliance is critical to you, seek certified establishments and confirm independently.'],
  ];
  return (
    <div className="screen-in hh-page">
      <MobileHeader title="Halal status disclaimer" onBack={()=>navigate('verify')} />
      <div className="hh-wrap" style={{maxWidth:760, paddingTop:32, paddingBottom:48}}>
        <span className="eyebrow">Legal</span>
        <h1 style={{fontSize:'2rem', marginTop:10}}>Halal status disclaimer</h1>
        <p className="muted" style={{marginTop:8}}>Last updated 1 June 2026</p>
        <div className="stack g20 mt24">
          {sections.map(([t,d],i)=>(
            <div key={t} className="disc-item">
              <span className="disc-num">{i+1}</span>
              <div><h3 style={{fontSize:'1.15rem'}}>{t}</h3><p className="muted" style={{marginTop:6, lineHeight:1.6}}>{d}</p></div>
            </div>
          ))}
        </div>
        <div className="notice notice-warn" style={{marginTop:24}}><Icon name="info" size={20}/><span>When in doubt, choose <strong>MUIS Certified</strong> listings and verify on HalalSG.</span></div>
      </div>
    </div>
  );
}

/* =============================================================
   SEO LANDING TEMPLATE
============================================================= */
export function SeoScreen() {
  const { navigate, params } = useApp();
  const dir = useDirectory();
  // Server route 404s unknown slugs; this guard covers SPA navigation. The old
  // `|| allSeoPages()[0]` fallback silently rendered page-0 content instead.
  const page = getSeoPage(String(params.slug || ""));
  if (!page) return <NotFoundScreen />;
  const areaName = page.areaName || "Singapore";
  const cat = page.catId ? HHData.categories.find((c) => c.id === page.catId) : null;
  const isCategoryPage = !!page.catId && !page.areaId;
  const isFood = !page.catId || page.catId === "restaurants" || page.catId === "cafes";
  const content = categoryContent(page.catId);
  // No whole-directory fallback: a page with zero real matches renders its
  // honest "No places yet — suggest one" state instead of unrelated listings.
  const results = seoListings(page, dir.listings).slice(0, isCategoryPage ? 9 : 6);
  const related = relatedSeoPages(page, 6);
  const noun = cat ? cat.label.toLowerCase() : "places";
  const placeLabel = page.areaId ? `in ${areaName}` : "in Singapore";

  // Hand-written area profile (area-content.ts) powers the v2 area template:
  // unique local intro (already on page.intro), MRT + landmark blocks, and
  // area-specific FAQs. Only area/mrt pages that have a profile get the extras.
  const profile = areaProfile(page.areaId);
  // Related areas → only link to areas that actually have a generated page.
  const areaSlugs = new Set(allSeoPages().filter((p) => p.kind === "area").map((p) => p.areaId));
  const relatedAreas = profile
    ? nearbyAreaIds(profile.id, 10).filter((a) => areaSlugs.has(a.id)).slice(0, 6)
    : [];
  // Landmark cards deep-link into an existing venue page when we have one.
  const venueSlugs = new Set(allSeoPages().filter((p) => p.kind === "venue").map((p) => p.slug));
  // Area FAQ (specific first) merged with the global halal FAQ for the page.
  const faqItems = profile ? [...profile.faqs, ...content.faq] : content.faq;

  // Category page → links to this category in each area; sibling category pages.
  const areaLinks = isCategoryPage
    ? allSeoPages().filter((p) => p.catId === page.catId && p.areaId)
    : [];
  const otherCats = allSeoPages()
    .filter((p) => p.catId && !p.areaId && p.slug !== page.slug)
    .slice(0, 10);

  // Crawlable internal links: real <a href> + progressive-enhancement SPA nav.
  const link = (screen: string, p?: Record<string, string>) => ({
    href: screenToPath(screen, p),
    onClick: (e: React.MouseEvent) => {
      e.preventDefault();
      navigate(screen, p);
    },
  });

  return (
    <div className="screen-in hh-page">
      <section className="seo-hero hh-pattern">
        <div className="hh-wrap">
          <nav className="flex g6 center faint" aria-label="Breadcrumb" style={{ fontSize: ".82rem", fontWeight: 600, marginBottom: 10 }}><a className="link-inline" {...link("home")}>Home</a><Icon name="chevron" size={13} /><a className="link-inline" {...link("explore")}>Explore</a><Icon name="chevron" size={13} /><span style={{ color: "var(--ink)" }}>{page.h1}</span></nav>
          <h1 style={{ fontSize: "clamp(1.8rem,4vw,2.6rem)", maxWidth: 680 }}>{page.h1}</h1>
          <p className="muted" style={{ maxWidth: 640, marginTop: 10, fontSize: "1.05rem" }}>{page.intro}</p>
          <div className="pillbar" style={{ marginTop: 16 }}>
            {cat && <button className="chip" onClick={() => navigate("explore", { cat: page.catId })}>All {cat.label}</button>}
            <button className="chip" onClick={() => navigate("explore", { halal: "certified" })}>MUIS Certified</button>
            <button className="chip" onClick={() => navigate("explore", { family: "true" })}>Family friendly</button>
            <button className="chip" onClick={() => navigate("explore", { prayer: "true" })}>Prayer space</button>
            <button className="chip" onClick={() => navigate("map")}>Map view</button>
          </div>
        </div>
      </section>

      <div className="hh-wrap seo-body">
        <div>
          <div className="flex between center" style={{ marginBottom: 16 }}><h2 style={{ fontSize: "1.4rem" }}>Top halal {noun} {placeLabel}</h2><a className="link" {...link("map")}>View on map <Icon name="map" size={15} /></a></div>
          {results.length ? (
            <div className="grid-cards">{results.map((l) => <ListingCard key={l.id} item={l} />)}</div>
          ) : (
            <Empty icon="search" title="No places yet" body={`We're still adding halal spots for ${page.h1.toLowerCase()}.`} action="Suggest a place" onAction={() => navigate("suggest")} />
          )}

          {/* Lead-gen banner for high-ticket verticals (weddings, umrah, services…). */}
          {verticalForCatId(page.catId) && (
            <div className="card mt16" style={{ padding: "18px 20px", display: "flex", flexWrap: "wrap", gap: 14, alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ minWidth: 220, flex: 1 }}>
                <strong style={{ fontSize: "1.02rem" }}>Planning something? Get up to {LEAD_ROUTE_CAP} free quotes</strong>
                <p className="muted" style={{ marginTop: 4, fontSize: ".88rem" }}>Tell us what you need once — trusted halal {noun} send you quotes. Free, no obligation.</p>
              </div>
              <button
                className="btn btn-gold"
                onClick={() => { track.leadAction("enquiry_form", page.slug, page.catId); navigate("request-quote", { category: verticalForCatId(page.catId)!.label, source: page.slug }); }}
              >
                <Icon name="doc" size={17} /> Request quotes
              </button>
            </div>
          )}

          {/* Directory hub slot (leaderboard) — between the listings and the guide,
              never interrupting the ranked results. Direct-first, AdSense fill. */}
          <AdSlot slot="directory_hub" />

          {/* ---- Area template v2: MRT + landmark discovery blocks ---- */}
          {profile && profile.mrts.length > 0 && (
            <section className="mt24">
              <h2 style={{ fontSize: "1.4rem", marginBottom: 4 }}>Near the MRT</h2>
              <p className="muted" style={{ marginBottom: 14 }}>Halal spots you can reach on foot from {areaName}&apos;s stations.</p>
              <div className="flex g8 wrap">
                {profile.mrts.map((m) => (
                  <button key={m} className="chip" style={{ cursor: "pointer" }} onClick={() => navigate("explore", { q: `${m} halal` })}>
                    <Icon name="map" size={14} /> {m} MRT
                  </button>
                ))}
              </div>
            </section>
          )}

          {profile && profile.landmarks.length > 0 && (
            <section className="mt24">
              <h2 style={{ fontSize: "1.4rem", marginBottom: 4 }}>Malls, hawker centres &amp; landmarks</h2>
              <p className="muted" style={{ marginBottom: 14 }}>Where halal food clusters in {areaName}.</p>
              <div className="seo-linkgrid">
                {profile.landmarks.map((lm) => {
                  const venueSlug = lm.venueId ? `halal-food-at-${lm.venueId}` : null;
                  const inner = (
                    <>
                      <span><strong>{lm.name}</strong><span className="faint" style={{ display: "block", fontSize: ".78rem", textTransform: "capitalize" }}>{lm.type}</span></span>
                      {venueSlug && venueSlugs.has(venueSlug) && <Icon name="arrow" size={15} />}
                    </>
                  );
                  return venueSlug && venueSlugs.has(venueSlug) ? (
                    <a key={lm.name} className="related-link" {...link("seo", { slug: venueSlug })}>{inner}</a>
                  ) : (
                    <div key={lm.name} className="related-link" style={{ cursor: "default" }}>{inner}</div>
                  );
                })}
              </div>
            </section>
          )}

          {/* collapsible SEO content (crawlable in the DOM) */}
          <div className="seo-prose mt24">
            <h2 style={{ fontSize: "1.4rem", marginBottom: 14 }}>{isCategoryPage ? `Choosing halal ${noun} in Singapore` : `Halal ${noun} ${placeLabel}`}</h2>
            <div className="faq-list">
              <details className="faq-item" name="seo-content" open>
                <summary>What to look for{cat ? ` in a halal ${cat.label.toLowerCase().replace(/s$/, "")}` : ""}<span className="faq-chevron" aria-hidden="true" /></summary>
                <ul className="seo-bullets">{content.lookFor.map((b) => <li key={b}><Icon name="check" size={15} /> <span>{b}</span></li>)}</ul>
              </details>
              <details className="faq-item" name="seo-content">
                <summary>Halal considerations<span className="faq-chevron" aria-hidden="true" /></summary>
                <ul className="seo-bullets">{content.considerations.map((b) => <li key={b}><Icon name="info" size={15} /> <span>{b}</span></li>)}</ul>
              </details>
              {isCategoryPage && areaLinks.length > 0 && (
                <details className="faq-item" name="seo-content">
                  <summary>{cat?.label} by area in Singapore<span className="faq-chevron" aria-hidden="true" /></summary>
                  <div className="seo-linkgrid">{areaLinks.map((p) => <a key={p.slug} className="related-link" {...link("seo", { slug: p.slug })}>{p.h1}<Icon name="arrow" size={15} /></a>)}</div>
                </details>
              )}
            </div>
          </div>

          <section className="newsletter-card mt24">
            <span className="eyebrow" style={{ color: "var(--emerald)" }}>🌙 Free guide</span>
            <h2 style={{ fontSize: "1.2rem", marginTop: 8 }}>Get the Ultimate Halal Food Guide by MRT</h2>
            <p className="muted" style={{ marginTop: 6 }}>
              Be first to hear about new {noun} {placeLabel} in our weekly newsletter. Subscribe and we&apos;ll email you
              the free guide — MUIS-verified spots sorted by MRT station.
            </p>
            <div style={{ marginTop: 14 }}>
              <Newsletter source="directory" cta="Send me the guide" />
            </div>
          </section>

          <Faq items={faqItems} title={`${cat ? "Halal " + cat.label : "Halal in " + areaName} — your questions, answered`} eyebrow="Good to know" />
        </div>

        <aside className="seo-side">
          {relatedAreas.length > 0 && (
            <div className="card" style={{ padding: 18 }}>
              <h3 style={{ fontSize: "1.05rem" }}>Nearby areas</h3>
              <div className="stack g8 mt12">{relatedAreas.map((a) => (<a key={a.id} className="related-link" {...link("seo", { slug: `halal-food-in-${a.id}` })}>Halal Food in {a.name}<Icon name="arrow" size={16} /></a>))}</div>
            </div>
          )}
          {related.length > 0 && (
            <div className="card" style={{ padding: 18, marginTop: relatedAreas.length ? 16 : 0 }}>
              <h3 style={{ fontSize: "1.05rem" }}>Related searches</h3>
              <div className="stack g8 mt12">{related.map((r) => (<a key={r.slug} className="related-link" {...link("seo", { slug: r.slug })}>{r.h1}<Icon name="arrow" size={16} /></a>))}</div>
            </div>
          )}
          <div className="card" style={{ padding: 18, marginTop: related.length ? 16 : 0 }}>
            <h3 style={{ fontSize: "1.05rem" }}>Browse by category</h3>
            <div className="stack g8 mt12">{otherCats.map((p) => (<a key={p.slug} className="related-link" {...link("seo", { slug: p.slug })}>{p.h1}<Icon name="arrow" size={16} /></a>))}</div>
          </div>
          {isFood && (
            <div className="card" style={{ padding: 18, marginTop: 16 }}>
              <h3 style={{ fontSize: "1.05rem" }}>Popular cuisines</h3>
              <div className="flex g8 wrap mt12">{["Nasi Padang", "Biryani", "Malay", "Western", "Korean", "Thai", "Café"].map((c) => <span key={c} className="chip" style={{ cursor: "pointer" }} onClick={() => navigate("explore", { q: c })}>{c}</span>)}</div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

/* =============================================================
   SYSTEM STATES — 404, Success
============================================================= */
export function NotFoundScreen() {
  const { navigate } = useApp();
  return (
    <div className="state-screen">
      <div className="state-card">
        <div className="state-glyph hh-pattern"><span>404</span></div>
        <h1 style={{fontSize:'1.8rem', marginTop:20}}>This page wandered off</h1>
        <p className="muted" style={{marginTop:8, maxWidth:380}}>We couldn’t find what you’re looking for. It may have moved or no longer exists.</p>
        <div className="flex g10 center" style={{justifyContent:'center', marginTop:20}}>
          <button className="btn btn-primary" onClick={()=>navigate('home')}><Icon name="home" size={17}/> Back home</button>
          <button className="btn btn-outline" onClick={()=>navigate('explore')}><Icon name="search" size={17}/> Explore</button>
        </div>
      </div>
    </div>
  );
}

export function SuccessScreen() {
  const { navigate, params } = useApp();
  const map: Record<string, { t: string; d: string; cta: string; go: string }> = {
    listing: { t:'Listing submitted!', d:'Your business has been submitted for review. We’ll verify your details and let you know within 1–2 business days.', cta:'Go to dashboard', go:'owner-dashboard' },
    claim: { t:'Claim submitted!', d:'We’ve received your ownership claim and proof document. Our team will review it and email you within 3–5 business days.', cta:'Go to dashboard', go:'owner-dashboard' },
    suggest: { t:'Thank you!', d:'Your suggestion has been sent to our team. We usually review and add new places within a few business days to help the community discover them.', cta:'Back home', go:'home' },
    quote: { t:'Request sent! 🎉', d:'We’ve received your request and will match you with relevant Muslim-owned & halal-friendly providers, who typically reach out within 1–2 business days. Track it under “My requests” — quotes are no-obligation, and you’re never charged by Humble Halal.', cta:'View my requests', go:'user-dashboard' },
    report: { t:'Report received', d:'Thanks for helping us stay accurate. We aim to review reports within 3 business days and update the listing if needed.', cta:'Back home', go:'home' },
    payment: { t:'Payment successful', d:'Your plan is now active. Enjoy your upgraded visibility on Humble Halal.', cta:'Go to dashboard', go:'owner-dashboard' },
    rsvp: { t:'You’re going! 🎉', d:'Your free RSVP is confirmed. Find your ticket and QR code under “My tickets” — see you there.', cta:'View my tickets', go:'user-dashboard' },
    'payment-event': { t:'Tickets confirmed! 🎟️', d:'Payment received and your tickets are booked. Your QR code is ready under “My tickets”.', cta:'View my tickets', go:'user-dashboard' },
    'event-listing': { t:'Event submitted!', d:'Your event has been sent for review. Once approved (usually within a day) it goes live in the directory.', cta:'Go to dashboard', go:'owner-dashboard' },
    'join-request': { t:'Request sent! 🙌', d:'The organiser will review your request. You’ll get an email — and your ticket appears under “My tickets” — once it’s approved.', cta:'Browse more events', go:'events' },
  };
  const s = map[params.type as string] || map.suggest;
  // Owner-lifecycle capture: at the moment a business is listed/claimed, seed the
  // B2B nurture (source "for-business" → owner segment) with the lifecycle stage.
  const ownerStage = params.type === "listing" ? "listed" : params.type === "claim" ? "claimed" : null;
  // "What happens next" — the review flows are async and used to end in a void;
  // a 3-step timeline sets expectations and points back at the dashboard where
  // the new "In review" card is waiting.
  const NEXT_STEPS: Record<string, [string, string, string]> = {
    listing: ["Our team reviews your details (1–2 business days)", "You get an email the moment it's approved", "Your listing appears in the directory — add photos & hours from your dashboard"],
    claim: ["We verify your ownership (3–5 business days)", "You get an email once it's confirmed", "Manage your listing, reply to reviews and see insights from your dashboard"],
    "event-listing": ["Our team reviews your event (usually within a day)", "You get an email when it goes live", "Track RSVPs, check-ins and sales from My events"],
  };
  const nextSteps = NEXT_STEPS[params.type as string];
  return (
    <div className="state-screen">
      <div className="state-card">
        <div className="success-check"><Icon name="check" size={48} strokeWidth={2.4}/></div>
        <h1 style={{fontSize:'1.9rem', marginTop:20}}>{s.t}</h1>
        <p className="muted" style={{marginTop:10, maxWidth:420}}>{s.d}</p>
        {nextSteps && (
          <ol className="success-next" aria-label="What happens next">
            {nextSteps.map((step, i) => (
              <li key={i}>
                <span className="sn-num">{i + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        )}
        <div className="flex g10 center" style={{justifyContent:'center', marginTop:22}}>
          <button className="btn btn-primary btn-lg" onClick={()=>navigate(s.go)}>{s.cta}</button>
          <button className="btn btn-ghost" onClick={()=>navigate('home')}>Home</button>
        </div>
        {ownerStage && (
          <div className="newsletter-card" style={{ marginTop: 24, textAlign: "left" }}>
            <h2 style={{ fontSize: "1.1rem" }}>Get more customers from your listing</h2>
            <p className="muted" style={{ marginTop: 6, fontSize: ".92rem" }}>
              Weekly tips for halal businesses — plus the free starter kit on winning more customers on HumbleHalal.
            </p>
            <div style={{ marginTop: 12 }}>
              <Newsletter source="for-business" stage={ownerStage} cta="Send me tips" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Scannable ticket QR (generated client-side, no network) ---------- */
function TicketQR({ value, size = 96 }: { value: string; size?: number }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    let alive = true;
    // qrcode (~90KB) is dynamically imported so it never lands in the shared
    // bundle — only fetched when a ticket QR actually renders.
    import("qrcode")
      .then(({ default: QRCode }) =>
        QRCode.toDataURL(value, { margin: 1, width: size * 2, errorCorrectionLevel: "M" }),
      )
      .then((u) => { if (alive) setUrl(u); })
      .catch(() => {});
    return () => { alive = false; };
  }, [value, size]);
  if (!url) return <div className="ticket-qr" aria-hidden />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="Ticket QR code — show at the door" width={size} height={size} style={{ borderRadius: 8, display: "block" }} />;
}

type DbTicket = {
  id: string; qrRef: string; tier: string; status: string;
  event: { title: string; slug: string; dateISO: string; img: string; cat: string } | null;
};

/* ---------- My Tickets (user dashboard) ---------- */
export function MyRequests({ navigate, state }: { navigate: ReturnType<typeof useApp>["navigate"]; state: ReturnType<typeof useApp>["state"] }) {
  const requests = state.requests || [];
  if (!requests.length) {
    return <Empty icon="doc" title="No requests yet" body="Quote requests and business claims you submit will show up here so you can keep track of them." action="Request a quote" onAction={()=>navigate('request-quote')} />;
  }
  const META: Record<string, { label: string; icon: string }> = {
    quote: { label: "Quote request", icon: "doc" },
    claim: { label: "Business claim", icon: "shield-check" },
  };
  return (
    <div className="stack g12">
      {requests.map((r)=>{
        const m = META[r.kind] || META.quote;
        return (
          <div key={r.id} className="card" style={{padding:16}}>
            <div className="flex g12 center between">
              <div className="flex g10 center">
                <span className="attn-ico"><Icon name={m.icon} size={18}/></span>
                <div>
                  <div style={{fontWeight:700}}>{m.label}{r.label ? ` — ${r.label}` : ""}</div>
                  <div className="faint" style={{fontSize:'.8rem'}}>Submitted {new Date(r.at).toLocaleDateString("en-SG", { day:"numeric", month:"short", year:"numeric" })}</div>
                </div>
              </div>
              <span className="tag"><Icon name="clock" size={13}/> Under review</span>
            </div>
          </div>
        );
      })}
      <p className="faint" style={{fontSize:'.82rem'}}>We email you when there’s an update. Submitted requests are kept on this device.</p>
    </div>
  );
}

/* Email the signed-in user their own tickets (links to each /tickets/[id]). */
function ResendTicketsButton({ block = false }: { block?: boolean }) {
  const { toast } = useApp();
  const [busy, setBusy] = useState(false);
  const send = async () => {
    setBusy(true);
    try {
      const r = await fetch("/api/tickets/resend", { method: "POST" });
      const j = await r.json().catch(() => null);
      if (j?.ok) toast?.(j.simulated ? "Email queued" : `Sent ${j.count} ticket${j.count === 1 ? "" : "s"} to your email`);
      else toast?.(j?.reason === "not_signed_in" ? "Sign in to email your tickets" : "Couldn’t send — please try again");
    } catch { toast?.("Couldn’t send — please try again"); }
    finally { setBusy(false); }
  };
  return (
    <button type="button" className={`btn btn-ghost${block ? " btn-block" : " btn-sm"}`} onClick={send} disabled={busy}>
      <Icon name="mail" size={block ? 17 : 15} /> {busy ? "Sending…" : "Email me my tickets"}
    </button>
  );
}

export function MyTickets({ navigate, state }: { navigate: ReturnType<typeof useApp>["navigate"]; state: ReturnType<typeof useApp>["state"] }) {
  const { get: getEvent } = useEvents();
  const localTickets = state.tickets || [];
  const savedEvs = (state.savedEvents||[]).map(id=>getEvent(id)).filter(Boolean) as EventItem[];
  const [dbTickets, setDbTickets] = useState<DbTicket[] | null>(null);

  // Pull the signed-in user's real tickets (with the scannable qr_ref). Falls
  // back to the local mock tickets when signed out or the backend is empty.
  useEffect(() => {
    let alive = true;
    fetch("/api/tickets/mine")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (alive && Array.isArray(j?.tickets)) setDbTickets(j.tickets as DbTicket[]); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const hasDb = dbTickets && dbTickets.length > 0;
  if (!localTickets.length && !savedEvs.length && !hasDb) {
    return <Empty icon="ticket" title="No tickets yet" body="RSVP to free events or grab tickets — they’ll show up here with a QR code." action="Browse events" onAction={()=>navigate('events')} />;
  }

  const STATUS_LABEL: Record<string, string> = { valid: "Valid", used: "Checked in", refunded: "Refunded", cancelled: "Cancelled" };

  return (
    <div className="stack g20">
      {hasDb ? (
        <div>
          <div className="flex between center" style={{marginBottom:12}}>
            <h3 style={{fontSize:'1.15rem', margin:0}}>Your tickets</h3>
            <ResendTicketsButton />
          </div>
          <div className="stack g12">
            {dbTickets!.map((t)=>{
              const ev = t.event;
              return (
                <button key={t.id} type="button" className={`ticket-row${t.status !== "valid" ? " is-dim" : ""}`} onClick={()=>navigate('ticket-detail',{id:t.id})}>
                  <div className="ticket-row-thumb"><ImagePh label={(ev?.cat||"event").toLowerCase()} tone="emerald" src={ev?.img} style={{position:'absolute',inset:0}}/></div>
                  <div className="ticket-row-main">
                    <span className="evt-cat">{ev?.cat || "Event"}</span>
                    <div className="ticket-row-title">{ev?.title || "Event"}</div>
                    {ev?.dateISO && <div className="evt-meta"><Icon name="calendar" size={14}/> {ev.dateISO}</div>}
                    <div className="ticket-row-tags">
                      <span className="tag">{t.tier}</span>
                      <span className={`tag ${t.status === "used" ? "green" : ""}`}>{STATUS_LABEL[t.status] || t.status}</span>
                    </div>
                  </div>
                  <Icon name="chevron" size={18} className="ticket-row-go" />
                </button>
              );
            })}
          </div>
        </div>
      ) : localTickets.length>0 && (
        <div>
          <h3 style={{fontSize:'1.15rem', marginBottom:12}}>Upcoming</h3>
          <div className="stack g12">
            {localTickets.map(t=>{
              const ev = getEvent(t.eventId); if(!ev) return null;
              return (
                <button key={t.ref} type="button" className="ticket-row" onClick={()=>navigate('ticket-detail',{id:t.ref})}>
                  <div className="ticket-row-thumb"><ImagePh label={ev.cat.toLowerCase()} tone={ev.tone} src={ev.img} style={{position:'absolute',inset:0}}/></div>
                  <div className="ticket-row-main">
                    <span className="evt-cat">{ev.cat}</span>
                    <div className="ticket-row-title">{ev.title}</div>
                    <div className="evt-meta"><Icon name="calendar" size={14}/> {ev.dateLabel} · {ev.timeLabel.split(' – ')[0]}</div>
                    <div className="evt-meta"><Icon name="pin" size={14}/> {ev.venue}</div>
                    <div className="ticket-row-tags">
                      <span className="ticket-ref">{t.ref}</span>
                      <span className="tag">{t.tier} × {t.qty}</span>
                    </div>
                  </div>
                  <Icon name="chevron" size={18} className="ticket-row-go" />
                </button>
              );
            })}
          </div>
        </div>
      )}
      {savedEvs.length>0 && (
        <div>
          <h3 style={{fontSize:'1.15rem', marginBottom:12}}>Saved events</h3>
          <div className="evt-grid">{savedEvs.map(e=><EventCard key={e.id} ev={e} />)}</div>
        </div>
      )}
    </div>
  );
}

/* ---------- Ticket detail (one ticket: full-screen QR for door entry) ---------- */
export function TicketDetailScreen({ ticketId }: { ticketId: string }) {
  const { navigate, state, toast } = useApp();
  const { get: getEvent } = useEvents();
  const [dbTickets, setDbTickets] = useState<DbTicket[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // A free-RSVP / signed-out ticket lives in client state, keyed by its ref.
  const local = (state.tickets || []).find((t) => t.ref === ticketId);

  useEffect(() => {
    if (local) { setLoading(false); return; }
    let alive = true;
    fetch("/api/tickets/mine")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (alive) setDbTickets(Array.isArray(j?.tickets) ? (j.tickets as DbTicket[]) : []); })
      .catch(() => { if (alive) setDbTickets([]); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [ticketId, local]);

  const db = !local && dbTickets ? dbTickets.find((t) => t.id === ticketId) : undefined;
  const evFull = local ? getEvent(local.eventId) : (db?.event?.slug ? getEvent(db.event.slug) : undefined);

  if (loading) {
    return (
      <div className="screen-in hh-page">
        <MobileHeader title="Your ticket" onBack={() => navigate("user-dashboard")} />
        <div className="hh-wrap" style={{ padding: "48px 0", textAlign: "center" }}><p className="muted">Loading your ticket…</p></div>
      </div>
    );
  }

  if (!local && !db) {
    return (
      <div className="screen-in hh-page">
        <MobileHeader title="Your ticket" onBack={() => navigate("user-dashboard")} />
        <div className="hh-wrap"><Empty icon="ticket" title="Ticket not found" body="We couldn't find this ticket on your account — it may belong to a different login." action="My tickets" onAction={() => navigate("user-dashboard")} /></div>
      </div>
    );
  }

  const code = local ? local.ref : (db?.qrRef || "");
  const tier = local ? local.tier : (db?.tier || "Ticket");
  const qty = local ? local.qty : 1;
  const status = (local ? local.status : db?.status) || "valid";
  const voided = status === "refunded" || status === "cancelled";

  const title = evFull?.title || db?.event?.title || "Event";
  const cat = evFull?.cat || db?.event?.cat || "Event";
  const img = evFull?.img || db?.event?.img || "";
  const dateText = evFull?.dateLabel || db?.event?.dateISO || "";
  const timeText = evFull?.timeLabel || "";
  const venue = evFull?.venue || "";
  const area = evFull?.area || "";
  const organiser = evFull?.organiser || "";
  const eventNav: Record<string, string> | null = local ? { id: local.eventId } : (db?.event?.slug ? { slug: db.event.slug } : null);

  const ST: Record<string, { label: string; cls: string; icon: string }> = {
    valid: { label: "Valid — ready to scan", cls: "ok", icon: "shield-check" },
    used: { label: "Checked in", cls: "used", icon: "check" },
    refunded: { label: "Refunded", cls: "void", icon: "x" },
    cancelled: { label: "Cancelled", cls: "void", icon: "x" },
  };
  const st = ST[status] || ST.valid;

  const copyCode = async () => {
    try { await navigator.clipboard.writeText(code); setCopied(true); toast?.("Ticket code copied"); setTimeout(() => setCopied(false), 1800); } catch { /* ignore */ }
  };
  const share = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try { if (typeof navigator !== "undefined" && navigator.share) { await navigator.share({ title, url }); return; } } catch { return; }
    try { await navigator.clipboard.writeText(url); toast?.("Ticket link copied"); } catch { /* ignore */ }
  };

  return (
    <div className="screen-in hh-page">
      <MobileHeader title="Your ticket" onBack={() => navigate("user-dashboard")} />
      <div className="hh-wrap ticket-detail-wrap">
        <div className={`ticket-pass${voided ? " is-void" : ""}`}>
          <div className="ticket-pass-top">
            <ImagePh label={cat.toLowerCase()} tone="emerald" src={img} style={{ position: "absolute", inset: 0 }} />
            <div className="ticket-pass-top-ov">
              <span className="evt-cat light">{cat}</span>
              <span className={`ticket-status ${st.cls}`}><Icon name={st.icon} size={13} /> {st.label}</span>
            </div>
          </div>
          <div className="ticket-pass-info">
            <h1 className="ticket-pass-title">{title}</h1>
            {dateText && <div className="evt-meta"><Icon name="calendar" size={15} /> {dateText}{timeText ? ` · ${timeText}` : ""}</div>}
            {venue && <div className="evt-meta"><Icon name="pin" size={15} /> {venue}{area ? `, ${area}` : ""}</div>}
            {organiser && <div className="evt-meta"><Icon name="user" size={15} /> {organiser}</div>}
            <div className="ticket-pass-tags"><span className="tag">{tier}{qty > 1 ? ` × ${qty}` : ""}</span></div>
            {evFull && (evFull.halalCatering || evFull.prayerNearby || (evFull.genderArrangement && evFull.genderArrangement !== "mixed")) && (
              <div className="ticket-pass-mf">
                <span className="tpb-label">Good to know</span>
                <div className="flex g6 wrap"><EventBadges ev={evFull} compact /></div>
              </div>
            )}
          </div>
          <div className="ticket-tear" aria-hidden><span className="tear-line" /></div>
          <div className="ticket-pass-qr">
            {voided ? (
              <div className="ticket-void-note"><Icon name="x" size={26} /><p>This ticket is no longer valid.</p></div>
            ) : (
              <>
                <div className="ticket-qr-big"><TicketQR value={code} size={224} /></div>
                <p className="ticket-qr-cap"><Icon name="shield-check" size={14} /> Show this QR at the door</p>
                <button type="button" className="ticket-code-btn" onClick={copyCode}>
                  <span className="ticket-code-val">{code}</span>
                  <span className="ticket-code-hint">{copied ? "Copied ✓" : "Tap to copy"}</span>
                </button>
              </>
            )}
          </div>
        </div>
        <div className="ticket-actions">
          {evFull && !voided && <button type="button" className="btn btn-outline btn-block" onClick={() => downloadIcs(evFull)}><Icon name="calendar" size={17} /> Add to calendar</button>}
          {eventNav && <button type="button" className="btn btn-outline btn-block" onClick={() => navigate("event-detail", eventNav)}><Icon name="ticket" size={17} /> View event</button>}
          <button type="button" className="btn btn-ghost btn-block" onClick={share}><Icon name="share" size={17} /> Share ticket</button>
          <ResendTicketsButton block />
        </div>
      </div>
    </div>
  );
}
