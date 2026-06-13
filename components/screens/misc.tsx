"use client";

/* Humble Halal — Misc screens: Auth, User dashboard, Suggest, Claim, Report, Trust, SEO, States
   (ported from screens-misc.jsx). */
import { useState } from "react";
import { HHData } from "@/lib/data";
import type { BadgeKey } from "@/lib/types";
import { useApp } from "../app-context";
import { useDirectory } from "../directory-context";
import { getSupabaseBrowser, supabaseConfigured } from "@/lib/supabase/client";
import { Badge, Empty, Icon, ImagePh, ListingCard, Logo, MobileHeader } from "../ui";
import { EventCard } from "./events";
import { allSeoPages, getSeoPage, relatedSeoPages, seoListings } from "@/lib/seo-pages";
import { categoryContent } from "@/lib/category-content";
import { HALALSG_BASE } from "@/lib/muis";
import { screenToPath } from "@/lib/routes";
import { Faq } from "../faq";
import { VERIFY_FAQ } from "@/lib/faq";

/* =============================================================
   LOGIN / REGISTER
============================================================= */
export function LoginScreen() {
  const { navigate, setUser, toast } = useApp();
  const [mode, setMode] = useState("login");
  const [role, setRole] = useState<"user" | "owner">("user");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [touched, setTouched] = useState(false);

  const emailErr = !email
    ? "Enter your email"
    : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      ? "Enter a valid email address"
      : "";
  const pwErr = !pw ? "Enter your password" : pw.length < 6 ? "At least 6 characters" : "";

  const finish = () => {
    const first = email.split("@")[0];
    setUser({ loggedIn: true, role, name: first ? first[0].toUpperCase() + first.slice(1) : "Aisyah" });
    toast(mode === "login" ? "Welcome back" : "Account created");
    navigate(role === "owner" ? "owner-dashboard" : "user-dashboard");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (emailErr) return;
    // Real auth: passwordless magic link. Demo: keep the password flow.
    if (supabaseConfigured) {
      const sb = getSupabaseBrowser();
      if (sb) {
        const { error } = await sb.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        });
        toast(error ? "Couldn’t send the link — try again" : "Check your email for a magic login link ✉️");
        return;
      }
    }
    if (pwErr) return;
    finish();
  };

  const googleSignIn = async () => {
    if (supabaseConfigured) {
      const sb = getSupabaseBrowser();
      if (sb) {
        await sb.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo: `${window.location.origin}/auth/callback` },
        });
        return;
      }
    }
    finish();
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
          <p className="muted" style={{marginTop:4}}>{mode==='login'?'Log in to manage saved places and reviews.':'Join Humble Halal in a few seconds.'}</p>

          <button className="btn btn-outline btn-block" style={{marginTop:18}} onClick={googleSignIn}><Icon name="google" size={20}/> Continue with Google</button>
          <div className="auth-or"><span>or</span></div>

          <form onSubmit={submit} className="stack g14" noValidate>
            <div className="field">
              <label htmlFor="login-email">Email</label>
              <input id="login-email" className="input" type="email" autoComplete="email" placeholder="you@email.com" value={email} onChange={e=>setEmail(e.target.value)}
                aria-invalid={touched && !!emailErr} aria-describedby={touched && emailErr ? "login-email-err" : undefined} />
              {touched && emailErr && <span id="login-email-err" className="field-error"><Icon name="warning" size={13}/> {emailErr}</span>}
            </div>
            <div className="field">
              <label htmlFor="login-pw">Password</label>
              <input id="login-pw" className="input" type="password" autoComplete={mode==='login'?'current-password':'new-password'} placeholder="••••••••" value={pw} onChange={e=>setPw(e.target.value)}
                aria-invalid={touched && !!pwErr} aria-describedby={touched && pwErr ? "login-pw-err" : undefined} />
              {touched && pwErr && <span id="login-pw-err" className="field-error"><Icon name="warning" size={13}/> {pwErr}</span>}
            </div>

            {mode==='register' && (
              <div>
                <label style={{fontWeight:600, fontSize:'.88rem'}}>I’m joining as</label>
                <div className="role-grid mt8">
                  <button type="button" className={`role-opt ${role==='user'?'on':''}`} onClick={()=>setRole('user')}>
                    <Icon name="user" size={22}/><div style={{fontWeight:700,marginTop:6}}>I’m a user</div><span className="faint" style={{fontSize:'.78rem'}}>Discover &amp; save places</span></button>
                  <button type="button" className={`role-opt ${role==='owner'?'on':''}`} onClick={()=>setRole('owner')}>
                    <Icon name="store" size={22}/><div style={{fontWeight:700,marginTop:6}}>I’m a business owner</div><span className="faint" style={{fontSize:'.78rem'}}>List &amp; manage a business</span></button>
                </div>
              </div>
            )}
            <button className="btn btn-primary btn-block btn-lg" type="submit">{mode==='login'?'Log in':'Create account'}</button>
          </form>
          <p className="faint tc" style={{fontSize:'.8rem', marginTop:16}}>By continuing you agree to our Terms &amp; Privacy Policy.</p>
        </div>
      </div>
    </div>
  );
}

/* =============================================================
   USER DASHBOARD
============================================================= */
export function UserDashboardScreen() {
  const { navigate, state, setUser, createCollection, toggleInCollection } = useApp();
  const dir = useDirectory();
  const [tab, setTab] = useState("saved");
  const get = (ids: string[]) => ids.map(id => dir.get(id)).filter(Boolean) as typeof dir.listings;
  const saved = get(state.saved), wish = get(state.wishlist), recent = get(state.recent);
  const tabs = [['saved','Saved places','heart'],['collections','Collections','bookmark'],['tickets','My tickets','ticket'],['wishlist','Want to try','clock'],['recent','Recently viewed','clock'],['reviews','My reviews','star'],['settings','Settings','settings']];
  const cur = ({ saved, wishlist:wish, recent } as Record<string, typeof saved>)[tab];
  const newCollection = () => {
    const name = typeof window !== "undefined" ? window.prompt("Name your collection (e.g. Date night, Iftar 2026)") : "";
    if (name && name.trim()) createCollection(name.trim());
  };

  return (
    <div className="screen-in hh-page dash">
      <div className="dash-header dash-header-user hh-pattern">
        <div className="hh-wrap flex between center wrap g12">
          <div className="flex g14 center">
            <span className="avatar" style={{width:56,height:56,fontSize:'1.4rem',background:'var(--gold)',color:'#3a2c08'}}>{(state.user.name||'A')[0]}</span>
            <div><h1 style={{color:'#fff', fontSize:'1.6rem'}}>{state.user.loggedIn?state.user.name:'Guest'}</h1>
              <p style={{color:'#CFE0DA', fontSize:'.9rem'}}>{state.user.loggedIn?'Member since 2025':'Log in to sync across devices'}</p></div>
          </div>
          {!state.user.loggedIn
            ? <button className="btn btn-gold" onClick={()=>navigate('login')}>Log in</button>
            : <button className="btn" style={{background:'rgba(255,255,255,.14)',color:'#fff'}} onClick={()=>{setUser({loggedIn:false,role:'user',name:'Aisyah'}); navigate('home');}}><Icon name="logout" size={17}/> Log out</button>}
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
          {tab==='reviews' && (
            <div className="stack g14">
              {HHData.reviews.slice(0,2).map(r=>(
                <div key={r.id} className="card" style={{padding:16}}>
                  <div className="flex g10 center"><ImagePh label="place" tone="gold" src={dir.listings[0]?.image} style={{width:48,height:48,borderRadius:10}}/><div><div style={{fontWeight:700}}>Warung Bumbu Rempah</div><span className="rs-stars">{[1,2,3,4,5].map(i=><Icon key={i} name="starf" size={12} style={{color:i<=r.rating?'var(--gold)':'var(--line-strong)'}}/>)}</span></div></div>
                  <p className="muted" style={{marginTop:10, fontSize:'.92rem'}}>{r.text}</p>
                </div>
              ))}
              <div className="card" style={{padding:20}}>
                <h3 style={{fontSize:'1.1rem'}}>Suggested for you</h3>
                <p className="muted" style={{fontSize:'.88rem', marginTop:4}}>Based on your saved places in Tampines &amp; Bedok.</p>
                <div className="grid-cards mt16">{dir.listings.slice(2,5).map(l=><ListingCard key={l.id} item={l}/>)}</div>
              </div>
            </div>
          )}
          {tab==='settings' && (
            <div className="card" style={{padding:22, maxWidth:540}}>
              <h3 style={{fontSize:'1.2rem'}}>Profile settings</h3>
              <div className="stack g14 mt16">
                <div className="field"><label>Display name</label><input className="input" defaultValue={state.user.name} /></div>
                <div className="field"><label>Email</label><input className="input" defaultValue="aisyah@email.com" /></div>
                <div className="field"><label>Home area</label><select className="select" defaultValue="tampines">{HHData.areas.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
                <button className="btn btn-primary">Save changes</button>
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
  const [touched, setTouched] = useState(false);
  const nameErr = !name.trim() ? "Please enter the business name" : "";
  const submit = async () => {
    setTouched(true);
    if (nameErr) return;
    try {
      await fetch("/api/submissions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "suggest", name }) });
    } catch { /* graceful */ }
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
const QUOTE_VERTICALS = [
  "Event & buffet catering",
  "Wedding & bridal (MUA, deco, hantaran)",
  "Umrah & Hajj travel",
  "Islamic finance & takaful",
  "Home services (renovation, cleaning, aircon)",
  "Automotive (servicing, detailing)",
  "Photography & videography",
  "Professional services (legal, accounting, marketing)",
  "Quran & tuition / education",
  "Something else",
];
const QUOTE_BUDGETS = ["Under $500", "$500–$2,000", "$2,000–$5,000", "$5,000+", "Not sure yet"];

export function RequestQuoteScreen() {
  const { navigate, params } = useApp();
  const [vertical, setVertical] = useState(String(params.category || ""));
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [area, setArea] = useState("");
  const [budget, setBudget] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [details, setDetails] = useState("");
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const nameErr = !name.trim() ? "Please enter your name" : "";
  const contactErr = !email.trim() && !phone.trim() ? "Add an email or phone so vendors can reach you" : "";
  const emailErr =
    email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? "Please enter a valid email" : "";

  const submit = async () => {
    setTouched(true);
    if (nameErr || contactErr || emailErr) return;
    setSubmitting(true);
    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, category: vertical, area, budget, eventDate, details }),
      });
    } catch {
      /* graceful — still confirm to the user */
    }
    setSubmitting(false);
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
            <button className="btn btn-primary btn-lg" disabled={submitting} onClick={submit}>
              {submitting ? "Sending…" : "Get my quotes"}
            </button>
            <p className="faint tc" style={{ fontSize: ".82rem" }}>
              By submitting you agree to be contacted by matched vendors. No spam — we only share with relevant providers.
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
  const { navigate, params } = useApp();
  const dir = useDirectory();
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState(params.id ? dir.get(String(params.id)) || null : null);
  const results = q ? dir.listings.filter(l=>l.name.toLowerCase().includes(q.toLowerCase())) : dir.listings.slice(0,4);

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
              <div className="field"><label>Your role</label><select className="select"><option>Owner</option><option>Manager</option><option>Authorised staff</option></select></div>
              <div className="field"><label>Proof of ownership</label><div className="upload-zone"><Icon name="upload" size={24}/><div style={{fontWeight:700,marginTop:6}}>Upload document</div><p className="faint" style={{fontSize:'.8rem'}}>Business registration, utility bill, or MUIS cert</p><button className="btn btn-soft btn-sm mt8">Choose file</button></div></div>
              <div className="field"><label>Message to our team <span className="hint">(optional)</span></label><textarea className="textarea" placeholder="Anything we should know?" /></div>
              <button className="btn btn-primary btn-lg" onClick={async ()=>{ try { await fetch("/api/submissions", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ kind:"claim", businessId: picked.id, name: picked.name }) }); } catch { /* graceful */ } navigate('success',{type:'claim'}); }}>Submit claim</button>
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
  const [busy, setBusy] = useState(false);
  const dir = useDirectory();
  const item = params.id ? dir.get(String(params.id)) : null;
  const submitReport = async () => {
    setBusy(true);
    try {
      await fetch("/api/reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ businessId: item?.id || "", reason, details }) });
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
  const page = getSeoPage(String(params.slug || "")) || allSeoPages()[0];
  const areaName = page.areaName || "Singapore";
  const cat = page.catId ? HHData.categories.find((c) => c.id === page.catId) : null;
  const isCategoryPage = !!page.catId && !page.areaId;
  const isFood = !page.catId || page.catId === "restaurants" || page.catId === "cafes";
  const content = categoryContent(page.catId);
  const filtered = seoListings(page);
  const results = (filtered.length ? filtered : dir.listings).slice(0, isCategoryPage ? 9 : 6);
  const related = relatedSeoPages(page, 6);
  const noun = cat ? cat.label.toLowerCase() : "places";
  const placeLabel = page.areaId ? `in ${areaName}` : "in Singapore";

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

          <Faq items={content.faq} title={`${cat ? "Halal " + cat.label : "Halal in " + areaName} — your questions, answered`} eyebrow="Good to know" />
        </div>

        <aside className="seo-side">
          {related.length > 0 && (
            <div className="card" style={{ padding: 18 }}>
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
    claim: { t:'Claim submitted!', d:'We’ve received your ownership claim. Our team will review your documents and email you shortly.', cta:'Go to dashboard', go:'owner-dashboard' },
    suggest: { t:'Thank you!', d:'Your suggestion has been sent to our team. We’ll review and add it to help the community discover it.', cta:'Back home', go:'home' },
    quote: { t:'Request sent! 🎉', d:'We’ve received your request and will match you with trusted halal vendors. Expect quotes by email or WhatsApp shortly — no obligation.', cta:'Browse the directory', go:'explore' },
    report: { t:'Report received', d:'Thanks for helping us stay accurate. We’ll look into this and update the listing if needed.', cta:'Back home', go:'home' },
    payment: { t:'Payment successful', d:'Your plan is now active. Enjoy your upgraded visibility on Humble Halal.', cta:'Go to dashboard', go:'owner-dashboard' },
    rsvp: { t:'You’re going! 🎉', d:'Your free RSVP is confirmed. Find your ticket and QR code under “My tickets” — see you there.', cta:'View my tickets', go:'user-dashboard' },
    'payment-event': { t:'Tickets confirmed! 🎟️', d:'Payment received and your tickets are booked. Your QR code is ready under “My tickets”.', cta:'View my tickets', go:'user-dashboard' },
    'event-listing': { t:'Event submitted!', d:'Your event has been sent for review. Once approved (usually within a day) it goes live in the directory.', cta:'Go to dashboard', go:'owner-dashboard' },
  };
  const s = map[params.type as string] || map.suggest;
  return (
    <div className="state-screen">
      <div className="state-card">
        <div className="success-check"><Icon name="check" size={48} strokeWidth={2.4}/></div>
        <h1 style={{fontSize:'1.9rem', marginTop:20}}>{s.t}</h1>
        <p className="muted" style={{marginTop:10, maxWidth:420}}>{s.d}</p>
        <div className="flex g10 center" style={{justifyContent:'center', marginTop:22}}>
          <button className="btn btn-primary btn-lg" onClick={()=>navigate(s.go)}>{s.cta}</button>
          <button className="btn btn-ghost" onClick={()=>navigate('home')}>Home</button>
        </div>
      </div>
    </div>
  );
}

/* ---------- My Tickets (user dashboard) ---------- */
export function MyTickets({ navigate, state }: { navigate: ReturnType<typeof useApp>["navigate"]; state: ReturnType<typeof useApp>["state"] }) {
  const tickets = state.tickets || [];
  const savedEvs = (state.savedEvents||[]).map(id=>HHData.events.find(e=>e.id===id)).filter(Boolean) as typeof HHData.events;
  if (!tickets.length && !savedEvs.length) {
    return <Empty icon="ticket" title="No tickets yet" body="RSVP to free events or grab tickets — they’ll show up here with a QR code." action="Browse events" onAction={()=>navigate('events')} />;
  }
  return (
    <div className="stack g20">
      {tickets.length>0 && (
        <div>
          <h3 style={{fontSize:'1.15rem', marginBottom:12}}>Upcoming</h3>
          <div className="stack g12">
            {tickets.map(t=>{
              const ev = HHData.events.find(e=>e.id===t.eventId); if(!ev) return null;
              return (
                <div key={t.ref} className="ticket-card">
                  <div className="ticket-stub"><ImagePh label={ev.cat.toLowerCase()} tone={ev.tone} src={ev.img} style={{position:'absolute',inset:0}}/></div>
                  <div className="ticket-perf" />
                  <div className="ticket-body">
                    <div className="flex between" style={{gap:12}}>
                      <div className="f1">
                        <span className="evt-cat">{ev.cat}</span>
                        <div style={{fontWeight:700, fontFamily:'var(--serif)', fontSize:'1.1rem', marginTop:3}}>{ev.title}</div>
                        <div className="evt-meta" style={{marginTop:6}}><Icon name="calendar" size={14}/> {ev.dateLabel} · {ev.timeLabel.split(' – ')[0]}</div>
                        <div className="evt-meta"><Icon name="pin" size={14}/> {ev.venue}</div>
                        <div className="flex g8 center" style={{marginTop:8}}>
                          <span className="ticket-ref">{t.ref}</span>
                          <span className="tag">{t.tier} × {t.qty}</span>
                        </div>
                      </div>
                      <div className="flex col center g8"><div className="ticket-qr"/><button className="btn btn-ghost btn-sm" style={{padding:'4px 8px'}} onClick={()=>navigate('event-detail',{id:ev.id})}>View</button></div>
                    </div>
                  </div>
                </div>
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
