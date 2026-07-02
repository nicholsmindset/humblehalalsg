"use client";

/* Humble Halal — Business screens (ported from screens-business.jsx):
   For Business value page, Pricing, Add-Listing wizard, Owner Dashboard, Sparkline. */
import { Fragment, useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import { HHData, spotsLeft } from "@/lib/data";
import type { EventItem, Listing, LatLng } from "@/lib/types";
import { canUse, planKey, PLAN_LIST } from "@/lib/plans";
import { useUser } from "@clerk/nextjs";
import { useSupabaseBrowser, supabaseConfigured } from "@/lib/supabase/client";
import { resolveRange, fmt } from "@/lib/analytics-dashboard";
import { DAY_LABELS } from "@/lib/hours";
import { REGIONS, townsInRegion, nearestTown, SG_CENTER } from "@/lib/sg-locations";
import { useApp } from "../app-context";
import { useDirectory } from "../directory-context";
import { Badge, Icon, ImagePh, MobileHeader } from "../ui";
import { AddressAutocomplete, type AddrPick } from "../biz/address-autocomplete";
import { MapView } from "../map/map-view";
import { EventPriceTag } from "./events";

// MUIS certifies food & beverage — so only these categories get the
// "MUIS Certified" path. Everything else uses Muslim-Owned / Muslim-Friendly.
const FOOD_CATS = ["restaurants", "cafes", "groceries"];

/* =============================================================
   FOR BUSINESS (value page)
============================================================= */
export function ForBusinessScreen() {
  const { navigate } = useApp();
  const benefits = [
    { icon: "search", t: "Get discovered by SG Muslims", d: "Appear when people search halal food, services and shops across Singapore." },
    { icon: "shield-check", t: "Build trust with halal labels", d: "Show MUIS-certified, Admin-verified or Muslim-owned badges that reassure customers." },
    { icon: "whatsapp", t: "Receive WhatsApp & direction clicks", d: "Turn searches into calls, messages and visits with one-tap contact buttons." },
    { icon: "camera", t: "Show your menu & photos", d: "A rich profile with gallery, hours and amenities — your shopfront online." },
    { icon: "building", t: "Claim your profile", d: "Already listed? Claim it to manage info, reply to reviews and see analytics." },
    { icon: "chart", t: "Understand your customers", d: "See views, saves and contact clicks trend over time in your dashboard." },
  ];
  return (
    <div className="screen-in hh-page">
      <section className="hero hero--immersive hh-pattern">
        <div className="hh-wrap hero-inner" style={{ textAlign: "center" }}>
          <span className="eyebrow" style={{ color: "var(--gold)" }}>For business owners</span>
          <h1 className="hero-h1" style={{ color: "#fff", maxWidth: 760, margin: "14px auto 0" }}>Reach Singapore’s Muslim community with confidence</h1>
          <p className="hero-sub" style={{ color: "#CFE0DA", maxWidth: 560, margin: "12px auto 0" }}>List your halal or Muslim-owned business, earn trusted badges, and turn discovery into footfall.</p>
          <div className="flex g10 center" style={{ justifyContent: "center", marginTop: 22 }}>
            <button className="btn btn-gold btn-lg" onClick={() => navigate("add-listing")}>List your business — free</button>
            <button className="btn btn-lg" style={{ background: "rgba(255,255,255,.12)", color: "#fff" }} onClick={() => navigate("pricing")}>See pricing</button>
          </div>
        </div>
      </section>

      <section className="hh-wrap hh-section">
        <div className="biz-benefits">
          {benefits.map((b) => (
            <div key={b.t} className="card" style={{ padding: 22 }}>
              <div className="empty-ico" style={{ width: 52, height: 52, borderRadius: 15 }}><Icon name={b.icon} size={26} /></div>
              <h3 style={{ fontSize: "1.2rem", marginTop: 14 }}>{b.t}</h3>
              <p className="muted" style={{ marginTop: 8, fontSize: ".92rem", lineHeight: 1.5 }}>{b.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="hh-wrap" style={{ paddingBottom: 48 }}>
        <div className="biz-cta hh-pattern-gold">
          <div className="biz-cta-in" style={{ gridTemplateColumns: "1fr" }}>
            <div style={{ textAlign: "center", maxWidth: 560, margin: "0 auto" }}>
              <h2 style={{ color: "#fff", fontSize: "1.9rem" }}>Ready to be found?</h2>
              <p style={{ color: "#DDEAE4", marginTop: 10 }}>Set up your free listing in minutes. Upgrade any time for verification and featured placement.</p>
              <div className="flex g10 center" style={{ justifyContent: "center", marginTop: 18 }}>
                <button className="btn btn-gold btn-lg" onClick={() => navigate("add-listing")}>Get started</button>
                <button className="btn btn-lg" style={{ background: "rgba(255,255,255,.12)", color: "#fff" }} onClick={() => navigate("claim")}>Claim existing listing</button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/* =============================================================
   PRICING
============================================================= */
export function PricingScreen() {
  const { navigate, toast, flags } = useApp();
  const [yearly, setYearly] = useState(false);
  const choosePlan = async (id: string) => {
    if (id === "free") return navigate("add-listing");
    if (!flags.paidPlans) {
      toast("Paid plans are coming soon — get listed free today");
      return navigate("add-listing");
    }
    try {
      const res = await fetch("/api/checkout/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: id, yearly }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
    } catch {
      /* fall through */
    }
    navigate("add-listing");
  };
  // The plan catalog (lib/plans) is the single source of truth — no duplicated
  // tier list here. Yearly shows the monthly-equivalent (yearly ÷ 12, ≈2 months free).
  const tiers = PLAN_LIST.map((p) => ({
    id: p.key,
    name: p.name,
    price: yearly && p.monthly > 0 ? Math.round(p.yearly / 12) : p.monthly,
    year: p.yearly,
    tag: p.tag,
    features: p.bullets,
    cta: p.cta,
    accent: !!p.accent,
    popular: !!p.popular,
  }));
  return (
    <div className="screen-in hh-page">
      <section className="hh-wrap" style={{ paddingTop: 40, textAlign: "center" }}>
        <span className="eyebrow">Pricing</span>
        <h1 style={{ fontSize: "clamp(1.8rem,4vw,2.6rem)", marginTop: 10 }}>Plans that grow with your business</h1>
        <p className="muted" style={{ maxWidth: 520, margin: "12px auto 0" }}>Start free, upgrade for verification and visibility. No hidden fees, cancel any time.</p>
        <div className="billing-toggle">
          <button className={!yearly ? "on" : ""} onClick={() => setYearly(false)}>Monthly</button>
          <button className={yearly ? "on" : ""} onClick={() => setYearly(true)}>Yearly <span className="save-pill">2 months free</span></button>
        </div>
      </section>
      <section className="hh-wrap hh-section">
        <div className="founders-banner">
          <div className="fb-ico"><Icon name="crescent" size={20} /></div>
          <div className="fb-text">
            <strong>Founding member offer</strong>
            <span>First 200 businesses lock in <b>Verified at $120/year</b> ($10/mo) — grandfathered for life.</span>
          </div>
          <button className="btn btn-gold btn-sm fb-cta" onClick={() => choosePlan("verified")}>Claim founding rate</button>
        </div>
        <div className="pricing-grid">
          {tiers.map((t) => (
            <div key={t.id} className={`pricing-card card ${t.accent ? "feat" : ""}`}>
              {t.popular && <span className="pop-badge">Most popular</span>}
              <span className="eyebrow" style={{ color: t.accent ? "var(--gold)" : "var(--gold-700)" }}>{t.tag}</span>
              <h3 style={{ fontSize: "1.5rem", marginTop: 8 }}>{t.name}</h3>
              <div className="price-row"><span className="price-num">${t.price}</span><span className="price-per">{t.price === 0 ? "forever" : `/mo`}</span></div>
              {yearly && t.price > 0 && <div className="price-sub">${t.year}/year · billed annually</div>}
              <button className={`btn btn-block ${t.accent ? "btn-gold" : "btn-outline"}`} style={{ marginTop: 14 }} onClick={() => choosePlan(t.id)}>{t.id !== "free" && !flags.paidPlans ? "Join the waitlist" : t.cta}</button>
              <ul className="feat-list">
                {t.features.map((f) => (<li key={f}><Icon name="check" size={16} /> {f}</li>))}
              </ul>
            </div>
          ))}
        </div>
        <p className="faint tc" style={{ marginTop: 24, fontSize: ".86rem" }}>All paid plans include a 14-day money-back guarantee. Prices in SGD, exclusive of GST.</p>
      </section>
    </div>
  );
}

/* =============================================================
   ADD LISTING WIZARD
============================================================= */
interface ListingOutlet {
  name: string;
  address: string;
  region: string;
  town: string;
  postal: string;
  lat?: number;
  lng?: number;
}
interface ListingForm {
  name: string;
  desc: string;
  phone: string;
  whatsapp: string;
  cat: string;
  address: string;
  region: string;
  town: string;
  postal: string;
  lat?: number;
  lng?: number;
  halal: string;
  certNo: string;
  photos: number;
  photoUrls: string[];
  proofName: string;
  franchise: boolean;
  outlets: ListingOutlet[];
}
const emptyOutlet = (): ListingOutlet => ({ name: "", address: "", region: "", town: "", postal: "" });
export function AddListingScreen() {
  const { navigate, toast } = useApp();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<ListingForm>({ name: "", desc: "", phone: "", whatsapp: "", cat: "", address: "", region: "", town: "", postal: "", halal: "", certNo: "", photos: 0, photoUrls: [], proofName: "", franchise: false, outlets: [emptyOutlet()] });
  const set = <K extends keyof ListingForm>(k: K, v: ListingForm[K]) => setData((d) => ({ ...d, [k]: v }));
  const [uploading, setUploading] = useState(false);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const proofInputRef = useRef<HTMLInputElement | null>(null);

  // Real photo upload — one request per file to /api/events/upload (authed,
  // rate-limited generic image upload). Skips files that fail; caps at 6.
  const MAX_PHOTOS = 6;
  const onPhotosPicked = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = ""; // allow re-selecting the same file later
    if (!files.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        // Stop once we've reached the cap (account for in-flight additions).
        let full = false;
        setData((d) => { full = (d.photoUrls?.length || 0) >= MAX_PHOTOS; return d; });
        if (full) { toast(`You can add up to ${MAX_PHOTOS} photos`); break; }
        try {
          const fd = new FormData();
          fd.set("file", file);
          const res = await fetch("/api/events/upload", { method: "POST", body: fd });
          const json = await res.json().catch(() => ({ ok: false }));
          if (json?.ok && json.url) {
            setData((d) => {
              const cur = d.photoUrls || [];
              if (cur.length >= MAX_PHOTOS) return d;
              return { ...d, photoUrls: [...cur, json.url as string] };
            });
          } else {
            const msg: Record<string, string> = {
              unauthenticated: "Please sign in to upload photos.",
              not_configured: "Photo uploads aren’t available yet.",
              too_large: `${file.name} is too large (max 5MB).`,
              bad_type: `${file.name} isn’t a supported image.`,
            };
            toast(msg[json?.reason] || `Couldn’t upload ${file.name}.`);
          }
        } catch {
          toast(`Couldn’t upload ${file.name}.`);
        }
      }
    } finally {
      setUploading(false);
    }
  };
  const removePhoto = (idx: number) =>
    setData((d) => ({ ...d, photoUrls: (d.photoUrls || []).filter((_, i) => i !== idx) }));
  const setOutlet = (i: number, patch: Partial<ListingOutlet>) => setData((d) => { const o = d.outlets.slice(); o[i] = { ...o[i], ...patch }; return { ...d, outlets: o }; });
  const addOutlet = () => setData((d) => ({ ...d, outlets: [...d.outlets, emptyOutlet()] }));
  const removeOutlet = (i: number) => setData((d) => ({ ...d, outlets: d.outlets.filter((_, idx) => idx !== i) }));

  // Snap region + town from a picked coordinate (address pick or pin drag).
  const applyPick = (r: AddrPick) => {
    const t = nearestTown({ lat: r.lat, lng: r.lng });
    setData((d) => ({ ...d, address: r.address, postal: r.postal || d.postal, lat: r.lat, lng: r.lng, region: t.region, town: t.name }));
  };
  const onPinMove = (c: LatLng) => {
    const t = nearestTown(c);
    setData((d) => ({ ...d, lat: c.lat, lng: c.lng, region: t.region, town: t.name }));
  };
  const applyOutletPick = (i: number, r: AddrPick) => {
    const t = nearestTown({ lat: r.lat, lng: r.lng });
    setOutlet(i, { address: r.address, postal: r.postal, lat: r.lat, lng: r.lng, region: t.region, town: t.name });
  };

  const isFood = FOOD_CATS.includes(data.cat);
  const pinCoords: LatLng = data.lat != null && data.lng != null ? { lat: data.lat, lng: data.lng } : SG_CENTER;
  const outletPins = data.outlets
    .map((o, i) => ({ o, i }))
    .filter(({ o }) => o.lat != null && o.lng != null)
    .map(({ o, i }) => ({ id: `o${i}`, name: o.name || `Outlet ${i + 1}`, coords: { lat: o.lat as number, lng: o.lng as number }, kind: "listing" as const, active: i === 0 }));
  const steps = ["Details", "Location", "Category", "Halal status", "Photos", "Review"];
  const submitListing = async () => {
    try {
      await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "listing",
          ...data,
          photos: (data.photoUrls || []).map((url) => ({ url })),
          proofFileName: data.proofName,
        }),
      });
    } catch {
      /* graceful — still confirm to the user */
    }
    navigate("success", { type: "listing" });
  };
  const next = () => (step < steps.length - 1 ? setStep(step + 1) : submitListing());
  const prev = () => (step > 0 ? setStep(step - 1) : navigate("for-business"));

  return (
    <div className="screen-in hh-page">
      <MobileHeader title="Add your business" onBack={prev} />
      <div className="wizard">
        <div className="wizard-head hide-mob">
          <h1 style={{ fontSize: "1.7rem" }}>Add your business</h1>
          <p className="muted">Step {step + 1} of {steps.length} — {steps[step]}</p>
        </div>
        <div className="steps wizard-steps">
          {steps.map((s, i) => (
            <Fragment key={s}>
              <div className={`step ${i < step ? "done" : ""} ${i === step ? "active" : ""}`}>
                <span className="num">{i < step ? <Icon name="check" size={15} /> : i + 1}</span>
                <span className="lbl hide-mob">{s}</span>
              </div>
              {i < steps.length - 1 && <span className={`bar ${i < step ? "done" : ""}`} />}
            </Fragment>
          ))}
        </div>

        <div className="card wizard-body">
          {step === 0 && (
            <div className="stack g16">
              <div className="field"><label>Business name</label><input className="input" placeholder="e.g. Warung Bumbu Rempah" value={data.name} onChange={(e) => set("name", e.target.value)} /></div>
              <div className="field"><label>Short description</label><textarea className="textarea" placeholder="What makes your place special?" value={data.desc} onChange={(e) => set("desc", e.target.value)} /></div>
              <div className="grid2">
                <div className="field"><label>Phone</label><input className="input" type="tel" inputMode="tel" autoComplete="tel" placeholder="+65 …" value={data.phone} onChange={(e) => set("phone", e.target.value)} /></div>
                <div className="field"><label>WhatsApp</label><input className="input" type="tel" inputMode="tel" placeholder="+65 …" value={data.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} /></div>
              </div>
            </div>
          )}
          {step === 1 && (
            <div className="stack g16">
              <label className="franchise-switch">
                <span className="flex g10 center"><span className="attn-ico"><Icon name="building" size={17} /></span>
                  <span><span style={{ fontWeight: 700, display: "block" }}>Multiple locations (franchise)</span><span className="faint" style={{ fontSize: ".8rem" }}>Manage every outlet under one profile</span></span></span>
                <span className={`switch ${data.franchise ? "on" : ""}`} onClick={() => set("franchise", !data.franchise)} />
              </label>

              {!data.franchise ? (
                <>
                  <div className="field">
                    <label htmlFor="al-addr">Street address</label>
                    <AddressAutocomplete id="al-addr" value={data.address} placeholder="Start typing — e.g. 12 Yishun Ave 9" onChange={(v) => set("address", v)} onPick={applyPick} />
                    <span className="hint" style={{ fontSize: ".78rem" }}>Pick a suggestion to auto-fill region, town & map pin{data.postal ? ` · postal ${data.postal}` : ""}.</span>
                  </div>
                  <div className="grid2">
                    <div className="field"><label>Region</label>
                      <select className="select" value={data.region} onChange={(e) => setData((d) => ({ ...d, region: e.target.value, town: "" }))}>
                        <option value="">Select region</option>
                        {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select></div>
                    <div className="field"><label>Town / area</label>
                      <select className="select" value={data.town} disabled={!data.region} onChange={(e) => set("town", e.target.value)}>
                        <option value="">{data.region ? "Select town" : "Pick a region first"}</option>
                        {townsInRegion(data.region).map((t) => <option key={t.id} value={t.name}>{t.name}</option>)}
                      </select></div>
                  </div>
                  <div className="field">
                    <label>Pin your exact location</label>
                    <div className="biz-map">
                      <MapView center={pinCoords} zoom={data.lat != null ? 16 : 11} onPick={onPinMove}
                        points={[{ id: "biz", name: data.name || "Your business", coords: pinCoords, kind: "listing", active: true }]} />
                    </div>
                    <span className="hint" style={{ fontSize: ".78rem" }}>Tap the map or drag the pin to fine-tune — region & town update automatically.</span>
                  </div>
                </>
              ) : (
                <div className="stack g12">
                  <p className="faint" style={{ fontSize: ".84rem" }}>Add each outlet. Every location is verified and shown with its own hours and directions.</p>
                  {data.outlets.map((o, i) => (
                    <div key={i} className="outlet-form">
                      <div className="flex between center" style={{ marginBottom: 10 }}>
                        <span style={{ fontWeight: 700, fontSize: ".9rem" }}>Outlet {i + 1}{i === 0 ? " · Flagship" : ""}</span>
                        {data.outlets.length > 1 && <button className="btn btn-ghost btn-sm" style={{ padding: 6 }} onClick={() => removeOutlet(i)}><Icon name="x" size={16} /></button>}
                      </div>
                      <div className="stack g10">
                        <input className="input" placeholder="Outlet name (e.g. Tampines Hub)" value={o.name} onChange={(e) => setOutlet(i, { name: e.target.value })} />
                        <AddressAutocomplete value={o.address} placeholder="Start typing the outlet address…" onChange={(v) => setOutlet(i, { address: v })} onPick={(r) => applyOutletPick(i, r)} />
                        <select className="select" value={o.town} onChange={(e) => setOutlet(i, { town: e.target.value })}>
                          <option value="">Select town / area</option>
                          {REGIONS.map((r) => <optgroup key={r} label={r}>{townsInRegion(r).map((t) => <option key={t.id} value={t.name}>{t.name}</option>)}</optgroup>)}
                        </select>
                      </div>
                    </div>
                  ))}
                  <button className="btn btn-outline btn-block" onClick={addOutlet}><Icon name="plus" size={17} /> Add another outlet</button>
                  {outletPins.length > 0 && (
                    <div className="biz-map" style={{ marginTop: 6 }}>
                      <MapView center={outletPins[0].coords} zoom={11} points={outletPins} />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          {step === 2 && (
            <div>
              <label style={{ fontWeight: 600, fontSize: ".88rem" }}>Pick your main category</label>
              <div className="cat-grid" style={{ marginTop: 12 }}>
                {HHData.categories.map((c) => (
                  <button key={c.id} className={`cat-btn ${data.cat === c.id ? "cat-on" : ""}`} onClick={() => set("cat", c.id)}>
                    <span className="cat-ico"><Icon name={c.icon} size={22} /></span><span>{c.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="stack g14">
              <label style={{ fontWeight: 600, fontSize: ".88rem" }}>{isFood ? "What best describes your halal status?" : "How is your business Muslim-friendly?"}</label>
              {!isFood && (
                <div className="notice notice-info">
                  <Icon name="info" size={18} />
                  <span>MUIS halal certification applies to <strong>food &amp; beverage</strong> businesses. For other businesses, let customers know you&apos;re Muslim-owned or Muslim-friendly.</span>
                </div>
              )}
              {(isFood
                ? [
                    { v: "muis", t: "MUIS Certified", d: "I have official MUIS halal certification", b: "muis" },
                    { v: "owned", t: "Muslim-Owned", d: "My business is Muslim-owned", b: "owned" },
                    { v: "friendly", t: "Halal-Friendly", d: "Self-declared, not certified", b: "friendly" },
                    { v: "nopork", t: "No Pork No Lard", d: "Self-declared, not certified", b: "nopork" },
                  ]
                : [
                    { v: "owned", t: "Muslim-Owned", d: "My business is Muslim-owned", b: "owned" },
                    { v: "friendly", t: "Muslim-Friendly", d: "Welcoming to Muslim customers", b: "friendly" },
                  ]
              ).map((o) => (
                <button key={o.v} className={`halal-opt ${data.halal === o.v ? "on" : ""}`} onClick={() => set("halal", o.v)}>
                  <div className="flex g12 center"><Badge type={o.b as Listing["badges"][number]} /><div style={{ textAlign: "left" }}><div style={{ fontWeight: 700 }}>{o.t}</div><div className="faint" style={{ fontSize: ".8rem" }}>{o.d}</div></div></div>
                  <span className={`radio ${data.halal === o.v ? "on" : ""}`} />
                </button>
              ))}
              {isFood && data.halal === "muis" && (
                <div className="field">
                  <label htmlFor="al-cert">MUIS certificate number</label>
                  <input id="al-cert" className="input" placeholder="From your MUIS halal certificate" value={data.certNo} onChange={(e) => set("certNo", e.target.value)} />
                  <span className="hint" style={{ fontSize: ".78rem" }}>We verify this against the official MUIS HalalSG register before granting the badge.</span>
                </div>
              )}
              {isFood && (data.halal === "muis" || data.halal === "owned") ? (
                <div className="upload-zone"><Icon name="upload" size={26} /><div style={{ fontWeight: 700, marginTop: 8 }}>Upload proof</div><p className="faint" style={{ fontSize: ".82rem" }}>{data.halal === "muis" ? "MUIS cert / business registration (PDF, JPG)" : "Business registration (PDF, JPG)"}</p><button className="btn btn-soft btn-sm mt8" onClick={() => proofInputRef.current?.click()}>{data.proofName ? "Change file" : "Choose file"}</button>{data.proofName && <p className="faint" style={{ fontSize: ".8rem", marginTop: 6, wordBreak: "break-all" }}><Icon name="check" size={14} /> {data.proofName}</p>}<input ref={proofInputRef} type="file" accept="application/pdf,image/*" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) set("proofName", f.name); e.target.value = ""; }} /></div>
              ) : null}
              {!isFood && (
                <p className="faint" style={{ fontSize: ".82rem" }}>No documents needed — non-food businesses are listed as Muslim-owned or Muslim-friendly without certification.</p>
              )}
            </div>
          )}
          {step === 4 && (
            <div>
              <label style={{ fontWeight: 600, fontSize: ".88rem" }}>Add photos</label>
              <p className="faint" style={{ fontSize: ".82rem", marginBottom: 12 }}>Cover photo, interior, and a few signature dishes work best.</p>
              <input ref={photoInputRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={onPhotosPicked} />
              <div className="photo-grid">
                {data.photoUrls.length < MAX_PHOTOS && (
                  <button className="upload-zone" style={{ aspectRatio: "1" }} disabled={uploading} onClick={() => photoInputRef.current?.click()}><Icon name="camera" size={24} /><span style={{ fontSize: ".78rem", fontWeight: 700, marginTop: 6 }}>{uploading ? "Uploading…" : "Add photo"}</span></button>
                )}
                {data.photoUrls.map((url, i) => (
                  <div key={url} style={{ position: "relative" }}>
                    <ImagePh label={`photo ${i + 1}`} tone="gold" ratio="1" src={url} />
                    <button type="button" aria-label={`Remove photo ${i + 1}`} onClick={() => removePhoto(i)} style={{ position: "absolute", top: 6, right: 6, width: 28, height: 28, borderRadius: "50%", border: "none", background: "rgba(0,0,0,.6)", color: "#fff", display: "grid", placeItems: "center", cursor: "pointer" }}><Icon name="x" size={15} /></button>
                  </div>
                ))}
              </div>
              <p className="faint" style={{ fontSize: ".78rem", marginTop: 8 }}>{data.photoUrls.length} of {MAX_PHOTOS} photos added.</p>
            </div>
          )}
          {step === 5 && (
            <div className="stack g14">
              <h3 style={{ fontSize: "1.2rem" }}>Review &amp; submit</h3>
              <div className="review-summary-box">
                {([["Name", data.name || "—"], ["Locations", data.franchise ? `${data.outlets.length} outlets (franchise)` : ([data.town, data.region].filter(Boolean).join(", ") || "—")], ["Category", HHData.categories.find((c) => c.id === data.cat)?.label || "—"], ["Halal status", data.halal || "—"], ["Photos", data.photoUrls.length]] as [string, string | number][]).map(([k, v]) => (
                  <div key={k} className="rsb-row"><span className="faint">{k}</span><span style={{ fontWeight: 600 }}>{v}</span></div>
                ))}
              </div>
              <div className="notice notice-warn"><Icon name="info" size={18} /><span>Your listing will be reviewed by our team before going live. Certified badges require document verification.</span></div>
            </div>
          )}
        </div>

        <div className="wizard-foot">
          <button className="btn btn-ghost" onClick={prev}>{step === 0 ? "Cancel" : "Back"}</button>
          <button className="btn btn-primary" onClick={next}>{step === steps.length - 1 ? "Submit for review" : "Continue"}<Icon name="arrow" size={17} /></button>
        </div>
      </div>
    </div>
  );
}

/* =============================================================
   OWNER DASHBOARD
============================================================= */
function PayoutsPanel({ toast, flags }: { toast: (m: string) => void; flags: { paidTickets: boolean } }) {
  const [loading, setLoading] = useState(false);
  // Without Stripe + Supabase wired, onboarding isn't possible yet.
  const setup = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/connect/onboard", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      const msg: Record<string, string> = {
        stripe_not_configured: "Payouts go live once Stripe is connected.",
        db_not_configured: "Connect Supabase + Stripe to enable payouts.",
        unauthenticated: "Log in as the business owner first.",
        no_business: "Claim or add your business first.",
      };
      toast(msg[data.reason] || "Payouts aren’t available yet.");
    } catch {
      toast("Couldn’t start payout setup.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dash-pane stack g16">
      {!flags.paidTickets && (
        <div className="notice notice-warn">
          <Icon name="info" size={18} />
          <span>Paid tickets are currently <strong>off</strong> platform-wide. You can set up payouts now so you’re ready the moment paid ticketing is enabled.</span>
        </div>
      )}

      <div className="card" style={{ padding: 22 }}>
        <div className="flex between center wrap g12">
          <div>
            <span className="eyebrow">Payouts</span>
            <h3 style={{ fontSize: "1.4rem", marginTop: 6 }}>Get paid for ticket sales</h3>
            <p className="faint" style={{ maxWidth: 460, marginTop: 4 }}>
              We use <strong>Stripe Connect</strong>. When a ticket sells, your full ticket price lands in your Stripe balance and Stripe pays it out to your bank automatically — Humble Halal only takes the booking fee.
            </p>
          </div>
          <span className="tag" style={{ background: "var(--cream-200)", color: "var(--ink-soft)" }}>
            <Icon name="info" size={13} /> Not set up
          </span>
        </div>
        <div className="flex g10 wrap" style={{ marginTop: 16 }}>
          <button className="btn btn-primary" disabled={loading} onClick={setup}>
            <Icon name="shield-check" size={17} /> {loading ? "Starting…" : "Set up payouts"}
          </button>
          <button className="btn btn-outline" disabled aria-disabled="true">
            Stripe dashboard
          </button>
          <span className="faint" style={{ fontSize: ".8rem", alignSelf: "center" }}>Dashboard unlocks after onboarding.</span>
        </div>
      </div>

      <div className="card" style={{ padding: 20 }}>
        <h3 style={{ fontSize: "1.1rem", marginBottom: 4 }}>How payouts work</h3>
        <ol className="payout-steps">
          <li><strong>Onboard once</strong> — verify identity + add a bank account (handled by Stripe).</li>
          <li><strong>Sell tickets</strong> — buyers pay face value + a booking fee; you keep the full face value.</li>
          <li><strong>Get paid automatically</strong> — Stripe transfers your balance to your bank on a rolling schedule.</li>
        </ol>
      </div>

      {/* No fake stat grid: gross/paid-out/pending were hardcoded zeros (and the
          footer quoted MOCK analytics) presented as live numbers. Real figures
          render here once ticket sales are wired to the DB. */}
      <p className="faint" style={{ fontSize: ".82rem" }}>
        Sales, payout and ticket numbers will appear here once paid ticketing is live.
      </p>
    </div>
  );
}

type OwnerBiz = { id: string; slug: string; name: string; area: string | null; cat_id: string | null; plan: string; featured: boolean; halal_tier: string | null; last_verified_at: string | null };
type OwnerEvent = { id: string; slug: string; title: string; status: string; taken: number; capacity: number; is_free: boolean; date_iso: string | null; display: { cat?: string; area?: string; priceFrom?: number; requiresApproval?: boolean } | null };

/* =============================================================
   OWNER LISTING EDITOR (inline, self-service)
   Lets a claimed owner edit the editable fields of a listing they own.
   Talks to /api/owner/listing (GET to load, PATCH to save) — ownership is
   enforced server-side. Sends only changed fields; "" clears a field.
============================================================= */

type EditableSocials = { whatsapp?: string; instagram?: string; [k: string]: string | undefined };
type OwnerListing = {
  id: string;
  phone?: string | null;
  website?: string | null;
  address?: string | null;
  postal?: string | null;
  description?: string | null;
  price_level?: string | null;
  opening_hours?: ({ open?: string; close?: string } | null)[] | null;
  socials?: EditableSocials | null;
  photos?: ({ url?: string; caption?: string } | null)[] | null;
};
// A single day in the 7-row editor: closed = no range for that day.
type DayRow = { closed: boolean; open: string; close: string };
const EMPTY_DAY: DayRow = { closed: true, open: "", close: "" };

function OwnerListingEditor({ id, name, toast, onClose, onSaved }: { id: string; name: string; toast: (m: string) => void; onClose: () => void; onSaved: () => void }) {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [address, setAddress] = useState("");
  const [postal, setPostal] = useState("");
  const [description, setDescription] = useState("");
  const [priceLevel, setPriceLevel] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [instagram, setInstagram] = useState("");
  const [days, setDays] = useState<DayRow[]>(() => Array.from({ length: 7 }, () => ({ ...EMPTY_DAY })));

  // Keep the loaded values so we PATCH only what actually changed (and preserve
  // any extra keys already on the `socials` jsonb object).
  const [orig, setOrig] = useState<OwnerListing | null>(null);

  // Photos: jsonb array of { url, caption? }. We track just the url list in
  // the editor; captions on existing photos are preserved on save.
  const MAX_PHOTOS = 6;
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setLoadError(null);
    (async () => {
      try {
        const res = await fetch(`/api/owner/listing?id=${encodeURIComponent(id)}`);
        const json = await res.json().catch(() => ({ ok: false }));
        if (!alive) return;
        if (!res.ok || !json?.ok) {
          const map: Record<string, string> = { unauthorized: "Please sign in to edit this listing.", forbidden: "You don’t have access to this listing.", not_found: "We couldn’t find this listing.", service_not_configured: "Editing isn’t available right now." };
          setLoadError(map[json?.error] || "Couldn’t load this listing — try again.");
          setLoading(false);
          return;
        }
        const b = json.business as OwnerListing;
        setOrig(b);
        setPhone(b.phone ?? "");
        setWebsite(b.website ?? "");
        setAddress(b.address ?? "");
        setPostal(b.postal ?? "");
        setDescription(b.description ?? "");
        setPriceLevel(b.price_level ?? "");
        const soc = (b.socials && typeof b.socials === "object" ? b.socials : {}) as EditableSocials;
        setWhatsapp(soc.whatsapp ?? "");
        setInstagram(soc.instagram ?? "");
        const oh = Array.isArray(b.opening_hours) ? b.opening_hours : [];
        setDays(Array.from({ length: 7 }, (_, i) => {
          const d = oh[i];
          if (d && d.open && d.close) return { closed: false, open: d.open, close: d.close };
          return { ...EMPTY_DAY };
        }));
        const ph = Array.isArray(b.photos) ? b.photos : [];
        setPhotos(ph.map((p) => p?.url).filter((u): u is string => typeof u === "string" && !!u).slice(0, MAX_PHOTOS));
        setLoading(false);
      } catch {
        if (alive) { setLoadError("Couldn’t load this listing — try again."); setLoading(false); }
      }
    })();
    return () => { alive = false; };
  }, [id]);

  const setDay = (i: number, patch: Partial<DayRow>) =>
    setDays((prev) => prev.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));

  // Build the opening_hours array in the exact shape rowToListing expects:
  // length-7 array, each entry { open, close } or null for a closed day.
  const buildHours = (): ({ open: string; close: string } | null)[] =>
    days.map((d) => (!d.closed && d.open && d.close ? { open: d.open, close: d.close } : null));

  const sameHours = (a: ({ open: string; close: string } | null)[], b: OwnerListing["opening_hours"]): boolean => {
    const bb = Array.isArray(b) ? b : [];
    if (a.length !== 7) return false;
    for (let i = 0; i < 7; i++) {
      const x = a[i];
      const y = bb[i];
      const yOpen = y?.open || "";
      const yClose = y?.close || "";
      const yNull = !(yOpen && yClose);
      if (x === null && yNull) continue;
      if (x === null || yNull) return false;
      if (x.open !== yOpen || x.close !== yClose) return false;
    }
    return true;
  };

  // Real photo upload — mirrors AddListingScreen: one request per file to the
  // generic authed image endpoint. Skips files that fail; caps at MAX_PHOTOS.
  const onPhotosPicked = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = ""; // allow re-selecting the same file later
    if (!files.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        let full = false;
        setPhotos((cur) => { full = cur.length >= MAX_PHOTOS; return cur; });
        if (full) { toast(`You can add up to ${MAX_PHOTOS} photos`); break; }
        try {
          const fd = new FormData();
          fd.set("file", file);
          const res = await fetch("/api/events/upload", { method: "POST", body: fd });
          const json = await res.json().catch(() => ({ ok: false }));
          if (json?.ok && json.url) {
            setPhotos((cur) => (cur.length >= MAX_PHOTOS ? cur : [...cur, json.url as string]));
          } else {
            const msg: Record<string, string> = {
              unauthenticated: "Please sign in to upload photos.",
              not_configured: "Photo uploads aren\u2019t available yet.",
              too_large: `${file.name} is too large (max 5MB).`,
              bad_type: `${file.name} isn\u2019t a supported image.`,
            };
            toast(msg[json?.reason] || `Couldn\u2019t upload ${file.name}.`);
          }
        } catch {
          toast(`Couldn\u2019t upload ${file.name}.`);
        }
      }
    } finally {
      setUploading(false);
    }
  };
  const removePhoto = (idx: number) => setPhotos((cur) => cur.filter((_, i) => i !== idx));

  // Did the photo url list change from what we loaded?
  const photosChanged = (): boolean => {
    const was = (Array.isArray(orig?.photos) ? orig!.photos : [])
      .map((p) => p?.url).filter((u): u is string => typeof u === "string" && !!u);
    if (was.length !== photos.length) return true;
    for (let i = 0; i < photos.length; i++) if (photos[i] !== was[i]) return true;
    return false;
  };

  const save = async () => {
    if (!orig) return;
    // 6-digit postal sanity check (allow blank to clear).
    if (postal && !/^\d{6}$/.test(postal)) { toast("Postal code should be 6 digits"); return; }

    // Opening-hours sanity: for any open day, close must be a valid HH:MM and
    // strictly after open.
    const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
    for (const d of days) {
      if (d.closed) continue;
      if (!HHMM.test(d.open) || !HHMM.test(d.close) || d.close <= d.open) {
        toast("Check your opening hours — close time must be after open time");
        return;
      }
    }

    const patch: Record<string, unknown> = { id };
    const diff = (val: string, was: string | null | undefined) => {
      const nv = val.trim();
      if (nv !== (was ?? "")) return true;
      return false;
    };
    if (diff(phone, orig.phone)) patch.phone = phone.trim();
    if (diff(website, orig.website)) patch.website = website.trim();
    if (diff(address, orig.address)) patch.address = address.trim();
    if (diff(postal, orig.postal)) patch.postal = postal.trim();
    if (diff(description, orig.description)) patch.description = description.trim();
    if (diff(priceLevel, orig.price_level)) patch.price_level = priceLevel;

    // Socials: merge onto the existing jsonb so other keys are preserved.
    const origSoc = (orig.socials && typeof orig.socials === "object" ? orig.socials : {}) as EditableSocials;
    const wa = whatsapp.trim();
    const ig = instagram.trim();
    if ((wa || "") !== (origSoc.whatsapp ?? "") || (ig || "") !== (origSoc.instagram ?? "")) {
      const nextSoc: EditableSocials = { ...origSoc };
      if (wa) nextSoc.whatsapp = wa; else delete nextSoc.whatsapp;
      if (ig) nextSoc.instagram = ig; else delete nextSoc.instagram;
      patch.socials = nextSoc;
    }

    const hours = buildHours();
    if (!sameHours(hours, orig.opening_hours)) patch.opening_hours = hours;

    // Photos: preserve captions on existing urls; new uploads carry url only.
    if (photosChanged()) {
      const prev = (Array.isArray(orig.photos) ? orig.photos : []).filter((p): p is { url?: string; caption?: string } => !!p);
      patch.photos = photos.map((url) => {
        const existing = prev.find((p) => p.url === url);
        return existing?.caption ? { url, caption: existing.caption } : { url };
      });
    }

    if (Object.keys(patch).length <= 1) { toast("No changes to save"); onClose(); return; }

    setSaving(true);
    try {
      const res = await fetch("/api/owner/listing", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
      const json = await res.json().catch(() => ({ ok: false }));
      if (res.ok && json?.ok) {
        toast("Listing updated");
        onSaved();
      } else {
        const map: Record<string, string> = { forbidden: "You don’t have access to this listing.", not_found: "We couldn’t find this listing.", no_fields: "No changes to save.", unauthorized: "Please sign in to edit this listing." };
        toast(map[json?.error] || "Couldn’t save — try again.");
      }
    } catch {
      toast("Couldn’t save — try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ borderTop: "1px solid var(--line)", padding: 16, background: "var(--surface-2, #fafafa)" }}>
      {loading ? (
        <div className="stack g10" aria-busy="true">
          <div className="faint" style={{ fontSize: ".88rem" }}>Loading {name}…</div>
          <div className="card" style={{ height: 60, opacity: 0.4 }} />
        </div>
      ) : loadError ? (
        <div className="stack g12">
          <div className="notice notice-warn"><Icon name="info" size={18} /><span>{loadError}</span></div>
          <div className="flex g8"><button className="btn btn-soft btn-sm" onClick={onClose}>Close</button></div>
        </div>
      ) : (
        <div className="stack g16">
          <div className="field">
            <label>Phone</label>
            <input className="input" type="tel" inputMode="tel" placeholder="+65 9123 4567" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ fontSize: 16, minHeight: 44 }} />
          </div>
          <div className="field">
            <label>Website</label>
            <input className="input" type="url" placeholder="https://example.com" value={website} onChange={(e) => setWebsite(e.target.value)} style={{ fontSize: 16, minHeight: 44 }} />
          </div>
          <div className="grid2 g12" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
            <div className="field">
              <label>Address</label>
              <input className="input" type="text" placeholder="123 Example Street, #01-23" value={address} onChange={(e) => setAddress(e.target.value)} style={{ fontSize: 16, minHeight: 44 }} />
            </div>
            <div className="field">
              <label>Postal code</label>
              <input className="input" type="text" inputMode="numeric" maxLength={6} placeholder="123456" value={postal} onChange={(e) => setPostal(e.target.value.replace(/\D/g, "").slice(0, 6))} style={{ fontSize: 16, minHeight: 44 }} />
            </div>
          </div>
          <div className="field">
            <label>Description</label>
            <textarea className="textarea" placeholder="Tell customers what makes your place special." value={description} onChange={(e) => setDescription(e.target.value)} style={{ fontSize: 16, minHeight: 88 }} />
          </div>
          <div className="field">
            <label>Price level</label>
            <select className="select" value={priceLevel} onChange={(e) => setPriceLevel(e.target.value)} style={{ fontSize: 16, minHeight: 44 }}>
              <option value="">Not set</option>
              <option value="$">$</option>
              <option value="$$">$$</option>
              <option value="$$$">$$$</option>
              <option value="$$$$">$$$$</option>
            </select>
          </div>
          <div className="field">
            <label>WhatsApp</label>
            <input className="input" type="text" inputMode="tel" placeholder="+65 9123 4567" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} style={{ fontSize: 16, minHeight: 44 }} />
          </div>
          <div className="field">
            <label>Instagram</label>
            <input className="input" type="text" placeholder="@yourhandle" value={instagram} onChange={(e) => setInstagram(e.target.value)} style={{ fontSize: 16, minHeight: 44 }} />
          </div>

          <div className="field">
            <label>Photos</label>
            <p className="faint" style={{ fontSize: ".8rem", marginBottom: 8 }}>Cover photo, interior, and a few signature dishes work best. Up to {MAX_PHOTOS}.</p>
            <input ref={photoInputRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={onPhotosPicked} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))", gap: 10 }}>
              {photos.length < MAX_PHOTOS && (
                <button type="button" className="upload-zone" style={{ aspectRatio: "1", minHeight: 96 }} disabled={uploading} onClick={() => photoInputRef.current?.click()}>
                  <Icon name="camera" size={22} /><span style={{ fontSize: ".76rem", fontWeight: 700, marginTop: 6 }}>{uploading ? "Uploading\u2026" : "Add photo"}</span>
                </button>
              )}
              {photos.map((url, i) => (
                <div key={url} style={{ position: "relative" }}>
                  <ImagePh label={`photo ${i + 1}`} tone="gold" ratio="1" src={url} />
                  <button type="button" aria-label={`Remove photo ${i + 1}`} onClick={() => removePhoto(i)} style={{ position: "absolute", top: 6, right: 6, width: 28, height: 28, borderRadius: "50%", border: "none", background: "rgba(0,0,0,.6)", color: "#fff", display: "grid", placeItems: "center", cursor: "pointer" }}><Icon name="x" size={15} /></button>
                </div>
              ))}
            </div>
            <p className="faint" style={{ fontSize: ".76rem", marginTop: 8 }}>{photos.length} of {MAX_PHOTOS} photos added.</p>
          </div>

          <div className="field">
            <label>Opening hours</label>
            <div className="stack g8" style={{ marginTop: 6 }}>
              {DAY_LABELS.map((label, i) => {
                const d = days[i];
                return (
                  <div key={label} className="flex g8 center wrap" style={{ alignItems: "center" }}>
                    <span style={{ width: 44, fontWeight: 600, fontSize: ".9rem" }}>{label}</span>
                    {d.closed ? (
                      <span className="faint f1" style={{ fontSize: ".88rem" }}>Closed</span>
                    ) : (
                      <div className="flex g6 center f1" style={{ flexWrap: "wrap" }}>
                        <input aria-label={`${label} opening time`} className="input" type="time" value={d.open} onChange={(e) => setDay(i, { open: e.target.value })} style={{ fontSize: 16, minHeight: 44, width: 130 }} />
                        <span className="faint">to</span>
                        <input aria-label={`${label} closing time`} className="input" type="time" value={d.close} onChange={(e) => setDay(i, { close: e.target.value })} style={{ fontSize: 16, minHeight: 44, width: 130 }} />
                      </div>
                    )}
                    <label className="flex g6 center" style={{ fontSize: ".85rem", minHeight: 44 }}>
                      <input type="checkbox" checked={d.closed} onChange={(e) => setDay(i, e.target.checked ? { closed: true } : { closed: false, open: d.open || "09:00", close: d.close || "18:00" })} style={{ width: 20, height: 20 }} />
                      Closed
                    </label>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex g8 wrap" style={{ marginTop: 4 }}>
            <button className="btn btn-primary" disabled={saving} onClick={save} style={{ minHeight: 44 }}>{saving ? "Saving…" : "Save changes"}</button>
            <button className="btn btn-soft" disabled={saving} onClick={onClose} style={{ minHeight: 44 }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

export function OwnerDashboardScreen() {
  const { navigate, toast, flags, params } = useApp();
  const dir = useDirectory();
  const { user } = useUser();
  const supabase = useSupabaseBrowser();
  const [tab, setTab] = useState("overview");
  const demoListings = [dir.listings[0], dir.listings.find((l) => l.id === "l5") || dir.listings[6]];

  // Real owner data when Supabase is live + the user is signed in; otherwise
  // mock-mode keeps the demo so the screen isn't bare in dev/previews.
  const live = supabaseConfigured;
  const [biz, setBiz] = useState<OwnerBiz[] | null>(null); // null = loading
  const [ownerEvents, setOwnerEvents] = useState<OwnerEvent[] | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null); // listing being edited inline

  // Reload the owner's businesses (id-only refresh keeps card metadata current
  // after an inline edit). Returns the list so callers can chain.
  const loadBiz = useCallback(async () => {
    const sb = supabase;
    if (!sb || !user) return [] as OwnerBiz[];
    const { data: bd } = await sb.from("businesses").select("id, slug, name, area, cat_id, plan, featured, halal_tier, last_verified_at, status").or(`owner_id.eq.${user.id},claimed_by.eq.${user.id}`);
    const list = (bd as OwnerBiz[]) || [];
    setBiz(list);
    return list;
  }, [supabase, user]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const sb = supabase;
      if (!sb) return; // mock mode
      if (!user) { if (alive) { setBiz([]); setOwnerEvents([]); } return; }
      const list = await loadBiz();
      if (!alive) return;
      if (list.length) {
        const { data: ed } = await sb.from("events").select("id, slug, title, status, taken, capacity, is_free, date_iso, display").in("business_id", list.map((b) => b.id)).order("date_iso", { ascending: false });
        if (alive) setOwnerEvents((ed as OwnerEvent[]) || []);
      } else if (alive) setOwnerEvents([]);
    })();
    return () => { alive = false; };
  }, [supabase, user, loadBiz]);
  const myBiz = biz && biz.length ? biz[0] : null;
  // Current subscription tier (from the business `plan`). In mock/demo mode show
  // "verified" so the header isn't bare; the upgrade CTA shows below premium.
  const currentPlan = planKey(live ? myBiz : "verified");
  const currentPlanLabel = currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1);
  const canUpgrade = currentPlan !== "premium";

  // Open the Stripe Customer Portal so owners can self-serve manage their
  // subscription (update card, change plan, cancel). Degrades gracefully when
  // Stripe isn't configured or there's no subscription yet.
  const manageBilling = async () => {
    try {
      const res = await fetch("/api/portal", { method: "POST" });
      const data = await res.json();
      if (data.ok && data.url) { window.location.href = data.url; return; }
      if (data.reason === "no_customer") { toast("No active subscription yet — choose a plan to get started"); return navigate("pricing"); }
      if (data.reason === "unauthenticated") { toast("Please sign in to manage billing"); return navigate("login"); }
      toast("Billing portal isn’t available yet — try again soon");
    } catch { toast("Couldn’t open the billing portal — try again"); }
  };

  // Cancel an event (soft) + refresh the local list.
  const cancelEvent = async (id: string) => {
    if (!window.confirm("Cancel this event? Ticket holders will be notified and paid tickets refunded.")) return;
    try {
      const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
      const j = await res.json();
      if (j?.ok) {
        setOwnerEvents((evs) => (evs || []).map((e) => (e.id === id ? { ...e, status: "cancelled" } : e)));
        toast("Event cancelled — attendees notified");
      } else toast(j?.reason === "forbidden" ? "You can’t cancel this event" : "Couldn’t cancel — try again");
    } catch { toast("Couldn’t cancel — try again"); }
  };

  const tabs: [string, string, string][] = [["overview", "Overview", "chart"], ["listings", "My listings", "store"], ["cert", "Halal certificate", "shield-check"], ["events", "My events", "calendar"], ["payouts", "Payouts", "dollar"], ["reviews", "Reviews", "star"], ["ads", "Sponsored ads", "trophy"], ["billing", "Billing", "settings"]];

  // One-time success toasts after returning from Stripe (Connect onboarding /
  // billing portal). Query params arrive via `params`; guard so it fires once.
  const stripeToastShown = useRef(false);
  useEffect(() => {
    if (stripeToastShown.current) return;
    const payouts = params.payouts;
    const billing = params.billing;
    let msg = "";
    if (payouts === "done") msg = "Payout account connected";
    else if (billing === "done") msg = "Billing updated";
    if (msg) { stripeToastShown.current = true; toast(msg); }
  }, [params, toast]);

  return (
    <div className="screen-in hh-page dash">
      <div className="dash-header hh-pattern">
        <div className="hh-wrap">
          <div className="flex between center wrap g12">
            <div><span className="eyebrow" style={{ color: "var(--gold)" }}>Business dashboard</span>
              <h1 style={{ color: "#fff", fontSize: "1.8rem", marginTop: 6 }}>{live ? (myBiz?.name || (biz === null ? "Loading…" : "Your business")) : "Warung Bumbu Rempah"}</h1>
              <div className="flex g8 center" style={{ marginTop: 8 }}>{live ? (myBiz ? <>{myBiz.halal_tier === "muis" && <Badge type="muis" />}{myBiz.halal_tier === "admin" && <Badge type="admin" />}</> : null) : <><Badge type="muis" /><Badge type="owned" /></>}</div></div>
            <div className="flex g10 center wrap" style={{ alignItems: "center" }}>
              <div className="flex g8 center" style={{ flexWrap: "wrap" }}>
                <span className="plan-chip"><Icon name="crescent" size={13} /> {currentPlanLabel} plan</span>
                {canUpgrade && <button className="btn btn-soft btn-sm" onClick={() => navigate("pricing")}><Icon name="arrow" size={15} /> Upgrade</button>}
              </div>
              <button className="btn btn-gold" onClick={() => navigate("add-listing")}><Icon name="plus" size={18} /> Add listing</button>
            </div>
          </div>
        </div>
      </div>

      <div className="hh-wrap">
        <div className="dash-tabs">
          {tabs.map(([id, label, icon]) => (<button key={id} className={tab === id ? "on" : ""} onClick={() => setTab(id)}><Icon name={icon} size={17} /> {label}</button>))}
        </div>

        {tab === "overview" && (
          <div className="dash-pane">
            {!live && demoListings.some((l) => l?.verify?.expiringSoon) && (
              <div className="notice notice-warn" style={{ marginBottom: 16 }}>
                <Icon name="info" size={18} />
                <span>
                  Your MUIS halal certificate is <strong>expiring soon</strong>. Renew with MUIS and re-verify on Humble Halal to keep your <strong>MUIS Certified</strong> badge and halal-confidence score.
                  <button className="link-inline" style={{ marginLeft: 6 }} onClick={() => navigate("verify")}>Re-verify →</button>
                </span>
              </div>
            )}
            {(() => {
              if (!live) return (
                <div className="verif-banner">
                  <div className="flex g12 center"><div className="empty-ico" style={{ width: 44, height: 44, borderRadius: 12, background: "var(--emerald-50)" }}><Icon name="shield-check" size={22} /></div>
                    <div><div style={{ fontWeight: 700 }}>Verification: Approved</div><p className="faint" style={{ fontSize: ".84rem" }}>MUIS Certified · last reviewed 12 May 2026</p></div></div>
                  <button className="btn btn-outline btn-sm" onClick={() => navigate("verify")}>View details</button>
                </div>
              );
              if (!myBiz) return null;
              const verified = myBiz.halal_tier === "muis" || myBiz.halal_tier === "admin";
              const reviewedOn = myBiz.last_verified_at ? new Date(myBiz.last_verified_at).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" }) : "";
              return (
                <div className="verif-banner">
                  <div className="flex g12 center"><div className="empty-ico" style={{ width: 44, height: 44, borderRadius: 12, background: "var(--emerald-50)" }}><Icon name="shield-check" size={22} /></div>
                    <div><div style={{ fontWeight: 700 }}>{verified ? "Verification: Approved" : "Not verified yet"}</div>
                      <p className="faint" style={{ fontSize: ".84rem" }}>{verified ? `${myBiz.halal_tier === "muis" ? "MUIS Certified" : "Admin Verified"}${reviewedOn ? ` · last reviewed ${reviewedOn}` : ""}` : "Submit your halal verification to earn a trust badge."}</p></div></div>
                  <button className="btn btn-outline btn-sm" onClick={() => navigate("verify")}>{verified ? "View details" : "Verify now"}</button>
                </div>
              );
            })()}
            <OwnerInsights />
          </div>
        )}

        {tab === "listings" && (
          <div className="dash-pane stack g14">
            {!live ? (
              demoListings.map((l) => (
                <div key={l?.id} className="card" style={{ display: "flex", gap: 14, padding: 14, alignItems: "center" }}>
                  <ImagePh label={l?.img} tone={l?.tone} src={l?.image} style={{ width: 90, height: 70, borderRadius: 10, flex: "none" }} />
                  <div className="f1"><div style={{ fontWeight: 700, fontFamily: "var(--serif)", fontSize: "1.1rem" }}>{l?.name}</div>
                    <div className="lc-meta">{l?.cuisine} · {l?.area}</div>
                    <div className="flex g6" style={{ marginTop: 6 }}>{l?.badges.slice(0, 2).map((b) => <Badge key={b} type={b} />)}</div></div>
                  <div className="flex g8"><button className="btn btn-outline btn-sm" onClick={() => navigate("detail", { id: l?.id })}><Icon name="eye" size={16} /> View</button><button className="btn btn-soft btn-sm"><Icon name="edit" size={16} /> Edit</button></div>
                </div>
              ))
            ) : biz === null ? (
              <div className="card" style={{ padding: 24, height: 90, opacity: 0.5 }} aria-busy="true" />
            ) : biz.length === 0 ? (
              <div className="card" style={{ padding: 28, textAlign: "center" }}>
                <div className="empty-ico" style={{ width: 48, height: 48, borderRadius: 14, background: "var(--emerald-50)", margin: "0 auto 12px" }}><Icon name="store" size={24} /></div>
                <h3 style={{ fontSize: "1.15rem", marginBottom: 6 }}>No listings yet</h3>
                <p className="faint" style={{ fontSize: ".9rem", maxWidth: 420, margin: "0 auto" }}>Add your business so customers can find you in the directory.</p>
              </div>
            ) : (
              biz.map((b) => (
                <div key={b.id} className="card" style={{ padding: 0, overflow: "hidden" }}>
                  <div style={{ display: "flex", gap: 14, padding: 14, alignItems: "center", flexWrap: "wrap" }}>
                    <div className="f1" style={{ minWidth: 180 }}><div style={{ fontWeight: 700, fontFamily: "var(--serif)", fontSize: "1.1rem" }}>{b.name}</div>
                      <div className="lc-meta">{[b.cat_id, b.area].filter(Boolean).join(" · ") || "—"}</div>
                      <div className="flex g6" style={{ marginTop: 6 }}>{b.halal_tier === "muis" && <Badge type="muis" />}{b.halal_tier === "admin" && <Badge type="admin" />}{b.featured && <span className="pill-tag green">Featured</span>}</div></div>
                    <div className="flex g8 wrap">
                      <button className="btn btn-outline btn-sm" onClick={() => navigate("detail", { id: b.slug })}><Icon name="eye" size={16} /> View</button>
                      <button className="btn btn-soft btn-sm" aria-expanded={editingId === b.id} onClick={() => setEditingId((cur) => (cur === b.id ? null : b.id))}><Icon name="edit" size={16} /> {editingId === b.id ? "Close" : "Edit"}</button>
                    </div>
                  </div>
                  {editingId === b.id && (
                    <OwnerListingEditor
                      id={b.id}
                      name={b.name}
                      toast={toast}
                      onClose={() => setEditingId(null)}
                      onSaved={() => { setEditingId(null); void loadBiz(); }}
                    />
                  )}
                </div>
              ))
            )}
            <button className="btn btn-outline btn-block" onClick={() => navigate("add-listing")}><Icon name="plus" size={18} /> {live && biz && biz.length ? "Add another listing" : "Add your business"}</button>
          </div>
        )}

        {tab === "events" && (
          <div className="dash-pane">
            <div className="flex between center wrap g10" style={{ marginBottom: 16 }}>
              <div><h3 style={{ fontSize: "1.2rem" }}>Your events</h3><p className="faint" style={{ fontSize: ".86rem" }}>Host bazaars, classes, talks and more — free or paid.</p></div>
              <button className="btn btn-gold" onClick={() => navigate("host-event")}><Icon name="plus" size={17} /> Host an event</button>
            </div>
            <div className="stack g12">
              {live && ownerEvents === null ? (
                <div className="card" style={{ padding: 24, height: 90, opacity: 0.5 }} aria-busy="true" />
              ) : !live || ownerEvents === null || ownerEvents.length === 0 ? (
                <div className="card" style={{ padding: 28 }}>
                  <div style={{ textAlign: "center", marginBottom: 20 }}>
                    <div className="empty-ico" style={{ width: 48, height: 48, borderRadius: 14, background: "var(--emerald-50)", margin: "0 auto 12px", display: "grid", placeItems: "center" }}><Icon name="calendar" size={24} /></div>
                    <h3 style={{ fontSize: "1.2rem", marginBottom: 6 }}>Run events like the pros</h3>
                    <p className="faint" style={{ fontSize: ".9rem", maxWidth: 480, margin: "0 auto" }}>Host a bazaar, class, iftar or talk — free RSVP or paid tickets. Here&rsquo;s everything you&rsquo;ll manage from your event command centre once it&rsquo;s live:</p>
                  </div>
                  <div className="grid-cards">
                    {([
                      ["chart", "Live stats", "Real-time bookings, capacity & revenue"],
                      ["users", "Attendees", "Full guest list with CSV export"],
                      ["check", "QR check-in", "Scan tickets at the door"],
                      ["ticket", "Ticket tiers", "Free RSVP or multiple paid tiers"],
                      ["shield-check", "Approvals", "Approve requests for private events"],
                    ] as [string, string, string][]).map(([ic, h, b]) => (
                      <div key={h} className="card" style={{ padding: 14 }}>
                        <span style={{ width: 34, height: 34, borderRadius: 9, background: "var(--emerald-50)", color: "var(--emerald)", display: "grid", placeItems: "center" }}><Icon name={ic} size={16} /></span>
                        <div style={{ fontWeight: 700, marginTop: 8, fontSize: ".95rem" }}>{h}</div>
                        <p className="faint" style={{ fontSize: ".82rem", marginTop: 2 }}>{b}</p>
                      </div>
                    ))}
                  </div>
                  <div style={{ textAlign: "center", marginTop: 18 }}>
                    <button className="btn btn-gold" onClick={() => navigate("host-event")}><Icon name="plus" size={16} /> Host your first event</button>
                  </div>
                </div>
              ) : (
                ownerEvents.map((ev) => {
                  const left = Math.max(0, (ev.capacity || 0) - (ev.taken || 0));
                  const st: [string, string] = ev.status === "published" ? ["Live", "green"] : ev.status === "pending" ? ["Under review", "amber"] : [ev.status, "amber"];
                  return (
                    <div key={ev.id} className="card" style={{ display: "flex", gap: 14, padding: 14, alignItems: "center", flexWrap: "wrap" }}>
                      <div className="f1" style={{ minWidth: 160 }}>
                        <div className="flex g8 center wrap"><span className={`pill-tag ${st[1]}`}>{st[0]}</span></div>
                        <div style={{ fontWeight: 700, fontFamily: "var(--serif)", fontSize: "1.05rem", marginTop: 5 }}>{ev.title}</div>
                        <div className="evt-meta" style={{ marginTop: 4 }}><Icon name="calendar" size={13} /> {ev.date_iso || "—"}{ev.display?.area ? ` · ${ev.display.area}` : ""}</div>
                      </div>
                      <div className="evt-mini-stats">
                        <div><div className="ems-v">{ev.taken || 0}</div><div className="ems-l">booked</div></div>
                        <div><div className="ems-v">{ev.capacity ? left : "∞"}</div><div className="ems-l">left</div></div>
                        <div><div className="ems-v">{ev.is_free ? "Free" : "$" + (ev.display?.priceFrom ?? 0)}</div><div className="ems-l">price</div></div>
                      </div>
                      <div className="flex g8 wrap">
                        <button className="btn btn-outline btn-sm" onClick={() => navigate("event-detail", { slug: ev.slug })}><Icon name="eye" size={15} /> View</button>
                        <a className="btn btn-gold btn-sm" href={`/events/${ev.slug}/manage`}><Icon name="settings" size={15} /> Manage</a>
                        {ev.status !== "cancelled" && (
                          <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} onClick={() => cancelEvent(ev.id)}><Icon name="x" size={15} /> Cancel</button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <button className="btn btn-outline btn-block mt14" onClick={() => navigate("host-event")}><Icon name="plus" size={18} /> Host another event</button>
          </div>
        )}

        {tab === "cert" && <CertVault toast={toast} navigate={navigate} live={live} certVaultEnabled={flags.certVault} biz={myBiz} />}

        {tab === "reviews" && <OwnerReviews toast={toast} />}

        {tab === "payouts" && <PayoutsPanel toast={toast} flags={flags} />}

        {tab === "ads" && <OwnerAds navigate={navigate} />}

        {tab === "billing" && (
          <div className="dash-pane">
            <div className="card" style={{ padding: 22 }}>
              <div className="flex between center wrap g12"><div><span className="eyebrow">Billing &amp; subscription</span><h3 style={{ fontSize: "1.3rem", marginTop: 6 }}>Manage your plan</h3><p className="faint" style={{ maxWidth: 460 }}>Open the secure Stripe portal to view your current plan, update your card, download invoices, change plan or cancel.</p></div>
                <div className="flex g8 wrap"><button className="btn btn-gold" onClick={manageBilling}><Icon name="settings" size={16} /> Manage subscription</button><button className="btn btn-soft" onClick={() => navigate("pricing")}>View plans</button></div></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* Halal Certificate Vault — owner upload + status list.
   Shows the upload form + the owner's certs when the business is Verified+ and the
   vault flag is on; otherwise a soft upsell. Files are previewed via short-TTL
   signed URLs minted by the server (never a public URL). */
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

function CertVault({
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
    let alive = true;
    (async () => {
      if (!entitled) { if (alive) setCerts([]); return; }
      try {
        const r = await fetch("/api/owner/cert");
        const d = await r.json().catch(() => ({ ok: false }));
        if (alive) setCerts(d.ok && Array.isArray(d.certs) ? (d.certs as OwnerCert[]) : []);
      } catch {
        if (alive) setCerts([]);
      }
    })();
    return () => { alive = false; };
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

/* Advertiser report — the owner's own sponsored campaigns + real reach, via the
   owner_campaign_performance RPC (0024, scoped to auth.uid()). Empty-state pitches
   the ad products when there's nothing live. */
type OwnerCampaign = {
  campaign_id: string; title: string; placement_key: string; status: string;
  rate_cents: number; starts_on: string | null; ends_on: string | null; impressions: number; clicks: number;
};
function OwnerAds({ navigate }: { navigate: ReturnType<typeof useApp>["navigate"] }) {
  const supabase = useSupabaseBrowser();
  const [rows, setRows] = useState<OwnerCampaign[] | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let alive = true;
    (async () => {
      const sb = supabase;
      if (!sb) { if (alive) setLoading(false); return; }
      const { data, error } = await sb.rpc("owner_campaign_performance");
      if (alive) { if (!error && Array.isArray(data)) setRows(data as OwnerCampaign[]); setLoading(false); }
    })();
    return () => { alive = false; };
  }, [supabase]);

  if (loading) return <div className="dash-pane"><div className="card" style={{ padding: 28, height: 120, opacity: 0.5 }} aria-busy="true" /></div>;

  if (!rows || rows.length === 0) {
    return (
      <div className="dash-pane">
        <div className="card" style={{ padding: 28, textAlign: "center" }}>
          <div className="empty-ico" style={{ width: 48, height: 48, borderRadius: 14, background: "var(--cream-200)", margin: "0 auto 12px" }}><Icon name="trophy" size={24} /></div>
          <h3 style={{ fontSize: "1.15rem", marginBottom: 6 }}>Promote your business</h3>
          <p className="faint" style={{ fontSize: ".9rem", maxWidth: 440, margin: "0 auto" }}>Featured placement, homepage spotlight and category sponsorships put you in front of more of Singapore’s Muslim community. When a campaign is live, you’ll see its reach &amp; clicks here.</p>
          <button className="btn btn-gold btn-sm" style={{ marginTop: 14 }} onClick={() => navigate("advertise")}>See ad options</button>
        </div>
      </div>
    );
  }

  const money = (c: number) => `S$${Math.round(c / 100).toLocaleString()}`;
  return (
    <div className="dash-pane">
      <div className="card" style={{ overflow: "hidden" }}>
        <div className="admin-tablehead"><h3 style={{ fontSize: "1.05rem" }}>Your campaigns</h3><button className="btn btn-gold btn-sm" onClick={() => navigate("advertise")}><Icon name="plus" size={14} /> New campaign</button></div>
        <div className="tbl-scroll"><table className="tbl">
          <thead><tr><th>Campaign</th><th>Status</th><th>Impressions</th><th>Clicks</th><th>CTR</th><th>Rate</th></tr></thead>
          <tbody>{rows.map((r) => {
            const ctr = r.impressions > 0 ? Math.round((r.clicks / r.impressions) * 1000) / 10 : 0;
            return (
              <tr key={r.campaign_id} className="rowhover">
                <td style={{ fontWeight: 700 }}>{r.title}</td>
                <td><span className={`pill-tag ${r.status === "active" ? "green" : r.status === "paused" ? "amber" : ""}`}>{r.status}</span></td>
                <td>{r.impressions.toLocaleString()}</td>
                <td>{r.clicks.toLocaleString()}</td>
                <td>{ctr}%</td>
                <td className="muted">{money(r.rate_cents)}</td>
              </tr>
            );
          })}</tbody>
        </table></div>
      </div>
    </div>
  );
}

/* Owner listing insights — real per-listing metrics from analytics_events via
   the owner_listing_analytics RPC (0013), summed across the owner's listings.
   Falls back to the published empty-state when there's no backend, no owned
   listings, or no events yet — so the dashboard never breaks in mock mode. */
type OwnerRow = {
  listing_views: number; enquiries: number; whatsapp_clicks: number;
  calls: number; directions: number; shortlists: number;
};
function OwnerInsights() {
  const supabase = useSupabaseBrowser();
  const [rows, setRows] = useState<OwnerRow[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      const sb = supabase;
      if (!sb) { if (alive) setLoading(false); return; }
      const { from, to } = resolveRange("30d");
      const { data, error } = await sb.rpc("owner_listing_analytics", { p_from: from, p_to: to });
      if (alive) {
        if (!error && Array.isArray(data)) setRows(data as OwnerRow[]);
        setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [supabase]);

  if (loading) {
    return <div className="card mt20" style={{ padding: 28, height: 120, opacity: 0.5 }} aria-busy="true" />;
  }

  const total = (rows || []).reduce(
    (a, r) => ({
      views: a.views + (r.listing_views || 0),
      enquiries: a.enquiries + (r.enquiries || 0),
      whatsapp: a.whatsapp + (r.whatsapp_clicks || 0),
      calls: a.calls + (r.calls || 0),
      directions: a.directions + (r.directions || 0),
      saves: a.saves + (r.shortlists || 0),
    }),
    { views: 0, enquiries: 0, whatsapp: 0, calls: 0, directions: 0, saves: 0 },
  );
  const anyActivity = rows && rows.length > 0 && Object.values(total).some((v) => v > 0);

  // Empty-state (no backend / no owned listings / no events yet).
  if (!anyActivity) {
    return (
      <div className="card mt20" style={{ padding: 28, textAlign: "center" }}>
        <div className="empty-ico" style={{ width: 48, height: 48, borderRadius: 14, background: "var(--emerald-50)", margin: "0 auto 12px" }}><Icon name="chart" size={24} /></div>
        <h3 style={{ fontSize: "1.15rem", marginBottom: 6 }}>Your listing insights will appear here</h3>
        <p className="faint" style={{ fontSize: ".9rem", maxWidth: 420, margin: "0 auto" }}>Once your listing is published and getting views, you’ll see profile views, WhatsApp clicks, calls and directions — updated daily.</p>
      </div>
    );
  }

  const cards: [string, number, string?][] = [
    ["Profile views", total.views],
    ["Quote enquiries", total.enquiries, "var(--emerald)"],
    ["WhatsApp taps", total.whatsapp],
    ["Calls", total.calls],
    ["Directions", total.directions],
    ["Shortlisted", total.saves],
  ];
  return (
    <div className="mt20">
      <p className="faint" style={{ fontSize: ".82rem", marginBottom: 10 }}>Last 30 days · across your listings</p>
      <div className="admin-statgrid">
        {cards.map(([l, v, c]) => (
          <div key={l} className="stat"><div className="v" style={c ? { color: c } : undefined}>{fmt(v)}</div><div className="l">{l}</div></div>
        ))}
      </div>
    </div>
  );
}

/* Owner reviews — real reviews across the owner's listings (incl. pending),
   with inline reply. Uses the owner_reviews / owner_reply_to_review RPCs (0015),
   hard-scoped server-side to listings the caller owns. Falls back to the mock
   seed in mock mode so the dashboard still demos. */
type OwnerReviewRow = {
  id: string; business_name: string; rating: number; text: string;
  reply: string | null; status: string; created_at: string;
};
function OwnerReviews({ toast }: { toast: (m: string) => void }) {
  const supabase = useSupabaseBrowser();
  const [rows, setRows] = useState<OwnerReviewRow[] | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [open, setOpen] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let alive = true;
    (async () => {
      const sb = supabase;
      if (!sb) { if (alive) setRows([]); return; }
      const { data, error } = await sb.rpc("owner_reviews");
      if (alive) setRows(!error && Array.isArray(data) ? (data as OwnerReviewRow[]) : []);
    })();
    return () => { alive = false; };
  }, [supabase]);

  const sendReply = async (id: string) => {
    const reply = (draft[id] || "").trim();
    if (reply.length < 2) return toast("Write a short reply");
    const sb = supabase;
    if (!sb) { toast("Reply sent"); setOpen((o) => ({ ...o, [id]: false })); return; }
    // POST the reply route (calls owner_reply_to_review AND emails the reviewer)
    // rather than the RPC directly, so a reviewer notification goes out.
    try {
      const res = await fetch("/api/owner/review-reply", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reviewId: id, reply }) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok || !d.ok) return toast("Couldn’t send reply");
    } catch { return toast("Couldn’t send reply"); }
    setRows((rs) => (rs || []).map((r) => (r.id === id ? { ...r, reply } : r)));
    setOpen((o) => ({ ...o, [id]: false }));
    toast("Reply posted");
  };

  // Real reviews only — empty array shows the "No reviews yet" empty state below.
  const display: OwnerReviewRow[] = rows && rows.length > 0 ? rows : [];

  if (rows === null) return <div className="dash-pane"><div className="card" style={{ padding: 24, height: 100, opacity: 0.5 }} aria-busy="true" /></div>;
  if (display.length === 0) {
    return (
      <div className="dash-pane">
        <div className="card" style={{ padding: 28, textAlign: "center" }}>
          <div className="empty-ico" style={{ width: 48, height: 48, borderRadius: 14, background: "var(--emerald-50)", margin: "0 auto 12px" }}><Icon name="star" size={24} /></div>
          <h3 style={{ fontSize: "1.15rem", marginBottom: 6 }}>No reviews yet</h3>
          <p className="faint" style={{ fontSize: ".9rem", maxWidth: 420, margin: "0 auto" }}>When customers review your listings, they’ll appear here and you can reply.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dash-pane stack g14">
      {display.map((r) => (
        <div key={r.id} className="card" style={{ padding: 16 }}>
          <div className="flex between">
            <div className="flex g10 center">
              <span className="avatar">★</span>
              <div>
                <div style={{ fontWeight: 700 }}>{r.business_name}</div>
                <span className="rs-stars">{[1, 2, 3, 4, 5].map((i) => <Icon key={i} name="starf" size={12} style={{ color: i <= r.rating ? "var(--gold)" : "var(--line-strong)" }} />)}</span>
              </div>
            </div>
            {r.status !== "published" && <span className="tag" style={{ background: "var(--cream-200)", color: "var(--ink-soft)" }}>{r.status}</span>}
          </div>
          <p className="muted" style={{ marginTop: 10, fontSize: ".92rem" }}>{r.text}</p>
          {r.reply ? (
            <div className="card" style={{ marginTop: 10, padding: "10px 12px", background: "var(--emerald-50)" }}>
              <div className="faint" style={{ fontSize: ".76rem", marginBottom: 2 }}>Your reply</div>
              <p style={{ fontSize: ".9rem" }}>{r.reply}</p>
            </div>
          ) : open[r.id] ? (
            <div className="mt8">
              <textarea className="textarea" placeholder="Thank the reviewer or address their feedback…" value={draft[r.id] || ""} onChange={(e) => setDraft((d) => ({ ...d, [r.id]: e.target.value }))} />
              <div className="flex g8 mt8">
                <button className="btn btn-primary btn-sm" onClick={() => sendReply(r.id)}><Icon name="edit" size={15} /> Post reply</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setOpen((o) => ({ ...o, [r.id]: false }))}>Cancel</button>
              </div>
            </div>
          ) : (
            <button className="btn btn-soft btn-sm mt8" onClick={() => setOpen((o) => ({ ...o, [r.id]: true }))}><Icon name="edit" size={15} /> Reply</button>
          )}
        </div>
      ))}
    </div>
  );
}

export function Sparkline({ data }: { data: number[] }) {
  const w = 600, h = 120, max = Math.max(...data), min = Math.min(...data);
  const pts = data.map((v, i) => [(i / (data.length - 1)) * w, h - ((v - min) / (max - min)) * (h - 16) - 8]);
  const path = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  const area = path + ` L${w} ${h} L0 ${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: 130, marginTop: 14 }} preserveAspectRatio="none">
      <defs><linearGradient id="spark" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--emerald)" stopOpacity=".22" /><stop offset="1" stopColor="var(--emerald)" stopOpacity="0" /></linearGradient></defs>
      <path d={area} fill="url(#spark)" />
      <path d={path} fill="none" stroke="var(--emerald)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
