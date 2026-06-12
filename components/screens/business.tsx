"use client";

/* Humble Halal — Business screens (ported from screens-business.jsx):
   For Business value page, Pricing, Add-Listing wizard, Owner Dashboard, Sparkline. */
import { Fragment, useState } from "react";
import { HHData, spotsLeft } from "@/lib/data";
import type { EventItem, Listing, LatLng } from "@/lib/types";
import { REGIONS, townsInRegion, nearestTown, SG_CENTER } from "@/lib/sg-locations";
import { useApp } from "../app-context";
import { useSubmission } from "../use-submit";
import { FileUpload } from "../file-upload";
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
  // SGD, SG-realistic. Yearly ≈ 2 months free (monthly × 10 / 12).
  const tiers = [
    { id: "free", name: "Free", price: 0, year: 0, tag: "Get listed", features: ["Basic profile", "1 category", "Up to 3 photos", "Map pin", "Customer reviews"], cta: "Start free", accent: false },
    { id: "verified", name: "Verified", price: yearly ? 16 : 19, year: 190, tag: "Build trust", features: ["Everything in Free", "Admin Verified badge", "Halal status review", "Muslim-owned label", "Up to 15 photos", "Reply to reviews", "WhatsApp & directions buttons"], cta: "Choose Verified", accent: true, popular: true },
    { id: "featured", name: "Featured", price: yearly ? 41 : 49, year: 490, tag: "Get seen", features: ["Everything in Verified", "Featured placement", "Top of category & area", "Homepage rotation", "Priority support"], cta: "Choose Featured", accent: false },
    { id: "premium", name: "Premium", price: yearly ? 82 : 99, year: 990, tag: "Grow faster", features: ["Everything in Featured", "Multiple locations", "Advanced analytics", "Promo & ad credits", "Dedicated manager"], cta: "Contact sales", accent: false },
  ];
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
  cat: string;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  region: string;
  town: string;
  postal: string;
  lat?: number;
  lng?: number;
  halal: string;
  certNo: string;
  photoPaths: string[];
  proofPaths: string[];
  franchise: boolean;
  outlets: ListingOutlet[];
}
const emptyOutlet = (): ListingOutlet => ({ name: "", address: "", region: "", town: "", postal: "" });
export function AddListingScreen() {
  const { navigate } = useApp();
  const [step, setStep] = useState(0);
  const [touched, setTouched] = useState(false);
  const { submitting, error, submit: post } = useSubmission();
  const [data, setData] = useState<ListingForm>({ name: "", desc: "", cat: "", email: "", phone: "", whatsapp: "", address: "", region: "", town: "", postal: "", halal: "", certNo: "", photoPaths: [], proofPaths: [], franchise: false, outlets: [emptyOutlet()] });
  const set = <K extends keyof ListingForm>(k: K, v: ListingForm[K]) => setData((d) => ({ ...d, [k]: v }));
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

  const nameErr = !data.name.trim() ? "Please enter the business name" : "";
  const emailErr = !data.email.trim()
    ? "Add a contact email so we can review your listing"
    : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())
      ? "Please enter a valid email"
      : "";

  const submit = async () => {
    if (nameErr || emailErr) {
      setTouched(true);
      setStep(0);
      return;
    }
    const { photoPaths, proofPaths, email, phone, ...rest } = data;
    const ok = await post({
      type: "listing",
      name: data.name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      payload: { ...rest, name: data.name.trim() },
      filePaths: [...photoPaths, ...proofPaths],
    });
    if (ok) navigate("success", { type: "listing" });
  };

  const next = () => {
    if (step === 0) {
      setTouched(true);
      if (nameErr || emailErr) return;
    }
    if (step < steps.length - 1) setStep(step + 1);
    else void submit();
  };
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
              <div className="field">
                <label htmlFor="al-name">Business name</label>
                <input id="al-name" className="input" placeholder="e.g. Warung Bumbu Rempah" value={data.name} onChange={(e) => set("name", e.target.value)}
                  aria-required="true" aria-invalid={touched && !!nameErr} aria-describedby={touched && nameErr ? "al-name-err" : undefined} />
                {touched && nameErr && <span id="al-name-err" className="field-error"><Icon name="warning" size={13} /> {nameErr}</span>}
              </div>
              <div className="field"><label>Short description</label><textarea className="textarea" placeholder="What makes your place special?" value={data.desc} onChange={(e) => set("desc", e.target.value)} /></div>
              <div className="field">
                <label htmlFor="al-email">Contact email</label>
                <input id="al-email" type="email" className="input" placeholder="you@email.com" value={data.email} onChange={(e) => set("email", e.target.value)}
                  aria-required="true" aria-invalid={touched && !!emailErr} aria-describedby={touched && emailErr ? "al-email-err" : undefined} />
                {touched && emailErr && <span id="al-email-err" className="field-error"><Icon name="warning" size={13} /> {emailErr}</span>}
              </div>
              <div className="grid2">
                <div className="field"><label htmlFor="al-phone">Phone</label><input id="al-phone" className="input" placeholder="+65 …" value={data.phone} onChange={(e) => set("phone", e.target.value)} /></div>
                <div className="field"><label htmlFor="al-wa">WhatsApp</label><input id="al-wa" className="input" placeholder="+65 …" value={data.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} /></div>
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
                <FileUpload label="Upload proof" hint={data.halal === "muis" ? "MUIS cert / business registration (PDF, JPG)" : "Business registration (PDF, JPG)"} onChange={(p) => set("proofPaths", p)} />
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
              <FileUpload label="Add photos" hint="JPEG, PNG or WebP, up to 5MB each" accept="image/jpeg,image/png,image/webp" multiple onChange={(p) => set("photoPaths", p)} />
              {data.photoPaths.length > 0 && (
                <div className="photo-grid" style={{ marginTop: 12 }}>
                  {data.photoPaths.map((_, i) => <ImagePh key={i} label={`photo ${i + 1}`} tone="gold" ratio="1" />)}
                </div>
              )}
            </div>
          )}
          {step === 5 && (
            <div className="stack g14">
              <h3 style={{ fontSize: "1.2rem" }}>Review &amp; submit</h3>
              <div className="review-summary-box">
                {([["Name", data.name || "—"], ["Locations", data.franchise ? `${data.outlets.length} outlets (franchise)` : ([data.town, data.region].filter(Boolean).join(", ") || "—")], ["Category", HHData.categories.find((c) => c.id === data.cat)?.label || "—"], ["Halal status", data.halal || "—"], ["Photos", data.photoPaths.length]] as [string, string | number][]).map(([k, v]) => (
                  <div key={k} className="rsb-row"><span className="faint">{k}</span><span style={{ fontWeight: 600 }}>{v}</span></div>
                ))}
              </div>
              <div className="notice notice-warn"><Icon name="info" size={18} /><span>Your listing will be reviewed by our team before going live. Certified badges require document verification.</span></div>
            </div>
          )}
        </div>

        {error && <span className="field-error" role="alert" style={{ marginTop: 10 }}><Icon name="warning" size={13} /> {error}</span>}
        <div className="wizard-foot">
          <button className="btn btn-ghost" onClick={prev}>{step === 0 ? "Cancel" : "Back"}</button>
          <button className="btn btn-primary" disabled={submitting} onClick={next}>{step === steps.length - 1 ? (submitting ? "Submitting…" : "Submit for review") : "Continue"}<Icon name="arrow" size={17} /></button>
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

  const a = HHData.analytics;
  const grossCents = 0; // from DB once live
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
          <button className="btn btn-outline" onClick={() => toast("Express dashboard opens once onboarding is complete")}>
            Stripe dashboard
          </button>
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

      <div className="admin-statgrid">
        {([["Gross sales", grossCents], ["Paid out", 0], ["Pending", 0], ["Tickets sold", 0]] as [string, number][]).map(([l, v]) => (
          <div key={l} className="stat"><div className="v">{l === "Tickets sold" ? v : `$${(v / 100).toFixed(2)}`}</div><div className="l">{l}</div></div>
        ))}
      </div>
      <p className="faint" style={{ fontSize: ".82rem" }}>
        Last 30 days · {a.views.toLocaleString()} profile views drove {a.directions} direction taps. Sales appear here once paid tickets go live.
      </p>
    </div>
  );
}

export function OwnerDashboardScreen() {
  const { navigate, toast, flags } = useApp();
  const [tab, setTab] = useState("overview");
  const a = HHData.analytics;
  const myListings = [HHData.listings[0], HHData.listings[6]];

  const tabs: [string, string, string][] = [["overview", "Overview", "chart"], ["listings", "My listings", "store"], ["events", "My events", "calendar"], ["payouts", "Payouts", "dollar"], ["reviews", "Reviews", "star"], ["billing", "Billing", "settings"]];

  return (
    <div className="screen-in hh-page dash">
      <div className="dash-header hh-pattern">
        <div className="hh-wrap">
          <div className="flex between center wrap g12">
            <div><span className="eyebrow" style={{ color: "var(--gold)" }}>Business dashboard</span>
              <h1 style={{ color: "#fff", fontSize: "1.8rem", marginTop: 6 }}>Warung Bumbu Rempah</h1>
              <div className="flex g8 center" style={{ marginTop: 8 }}><Badge type="muis" /><Badge type="owned" /></div></div>
            <button className="btn btn-gold" onClick={() => navigate("add-listing")}><Icon name="plus" size={18} /> Add listing</button>
          </div>
        </div>
      </div>

      <div className="hh-wrap">
        <div className="dash-tabs">
          {tabs.map(([id, label, icon]) => (<button key={id} className={tab === id ? "on" : ""} onClick={() => setTab(id)}><Icon name={icon} size={17} /> {label}</button>))}
        </div>

        {tab === "overview" && (
          <div className="dash-pane">
            <div className="verif-banner">
              <div className="flex g12 center"><div className="empty-ico" style={{ width: 44, height: 44, borderRadius: 12, background: "var(--emerald-50)" }}><Icon name="shield-check" size={22} /></div>
                <div><div style={{ fontWeight: 700 }}>Verification: Approved</div><p className="faint" style={{ fontSize: ".84rem" }}>MUIS Certified · last reviewed 12 May 2026</p></div></div>
              <button className="btn btn-outline btn-sm" onClick={() => navigate("verify")}>View details</button>
            </div>
            <div className="stat-grid mt20">
              {([["Profile views", a.views, "+18%", "up"], ["WhatsApp clicks", a.whatsapp, "+24%", "up"], ["Direction clicks", a.directions, "+9%", "up"], ["Calls", a.calls, "+5%", "up"], ["Website clicks", a.website, "-3%", "down"], ["Saves", a.saves, "+12%", "up"]] as [string, number, string, string][]).map(([l, v, d, dir]) => (
                <div key={l} className="stat"><div className="v">{v.toLocaleString()}</div><div className="l">{l}</div><div className={`d ${dir}`}>{d} <span className="faint" style={{ fontWeight: 500 }}>vs last month</span></div></div>
              ))}
            </div>
            <div className="card mt20" style={{ padding: 20 }}>
              <div className="flex between center"><h3 style={{ fontSize: "1.15rem" }}>Profile views — last 30 days</h3><span className="tag"><Icon name="trend" size={13} /> Trending up</span></div>
              <Sparkline data={a.spark} />
            </div>
          </div>
        )}

        {tab === "listings" && (
          <div className="dash-pane stack g14">
            {myListings.map((l) => (
              <div key={l?.id} className="card" style={{ display: "flex", gap: 14, padding: 14, alignItems: "center" }}>
                <ImagePh label={l?.img} tone={l?.tone} src={l?.image} style={{ width: 90, height: 70, borderRadius: 10, flex: "none" }} />
                <div className="f1"><div style={{ fontWeight: 700, fontFamily: "var(--serif)", fontSize: "1.1rem" }}>{l?.name}</div>
                  <div className="lc-meta">{l?.cuisine} · {l?.area}</div>
                  <div className="flex g6" style={{ marginTop: 6 }}>{l?.badges.slice(0, 2).map((b) => <Badge key={b} type={b} />)}</div></div>
                <div className="flex g8"><button className="btn btn-outline btn-sm" onClick={() => navigate("detail", { id: l?.id })}><Icon name="eye" size={16} /> View</button><button className="btn btn-soft btn-sm"><Icon name="edit" size={16} /> Edit</button></div>
              </div>
            ))}
            <button className="btn btn-outline btn-block" onClick={() => navigate("add-listing")}><Icon name="plus" size={18} /> Add another listing</button>
          </div>
        )}

        {tab === "events" && (
          <div className="dash-pane">
            <div className="flex between center wrap g10" style={{ marginBottom: 16 }}>
              <div><h3 style={{ fontSize: "1.2rem" }}>Your events</h3><p className="faint" style={{ fontSize: ".86rem" }}>Host bazaars, classes, talks and more — free or paid.</p></div>
              <button className="btn btn-gold" onClick={() => navigate("host-event")}><Icon name="plus" size={17} /> Host an event</button>
            </div>
            <div className="stack g12">
              {([HHData.events.find((e) => e.id === "e2"), HHData.events.find((e) => e.id === "e1")].filter(Boolean) as EventItem[]).map((ev, i) => {
                const left = spotsLeft(ev);
                const status: [string, string] = i === 0 ? ["Live", "green"] : ["Under review", "amber"];
                return (
                  <div key={ev.id} className="card" style={{ display: "flex", gap: 14, padding: 14, alignItems: "center", flexWrap: "wrap" }}>
                    <ImagePh label={ev.cat.toLowerCase()} tone={ev.tone} src={ev.img} style={{ width: 90, height: 66, borderRadius: 10, flex: "none" }} />
                    <div className="f1" style={{ minWidth: 160 }}>
                      <div className="flex g8 center wrap"><span className={`pill-tag ${status[1]}`}>{status[0]}</span><EventPriceTag ev={ev} /></div>
                      <div style={{ fontWeight: 700, fontFamily: "var(--serif)", fontSize: "1.05rem", marginTop: 5 }}>{ev.title}</div>
                      <div className="evt-meta" style={{ marginTop: 4 }}><Icon name="calendar" size={13} /> {ev.dateLabel} · {ev.area}</div>
                    </div>
                    <div className="evt-mini-stats">
                      <div><div className="ems-v">{ev.taken}</div><div className="ems-l">booked</div></div>
                      <div><div className="ems-v">{ev.capacity ? left : "∞"}</div><div className="ems-l">left</div></div>
                      <div><div className="ems-v">{ev.free ? "Free" : "$" + ev.priceFrom}</div><div className="ems-l">price</div></div>
                    </div>
                    <div className="flex g8"><button className="btn btn-outline btn-sm" onClick={() => navigate("event-detail", { id: ev.id })}><Icon name="eye" size={15} /> View</button><button className="btn btn-soft btn-sm"><Icon name="edit" size={15} /> Manage</button></div>
                  </div>
                );
              })}
            </div>
            <button className="btn btn-outline btn-block mt14" onClick={() => navigate("host-event")}><Icon name="plus" size={18} /> Host another event</button>
          </div>
        )}

        {tab === "reviews" && (
          <div className="dash-pane stack g14">
            {HHData.reviews.map((r) => (
              <div key={r.id} className="card" style={{ padding: 16 }}>
                <div className="flex between"><div className="flex g10 center"><span className="avatar">{r.avatar}</span><div><div style={{ fontWeight: 700 }}>{r.name}</div><span className="rs-stars">{[1, 2, 3, 4, 5].map((i) => <Icon key={i} name="starf" size={12} style={{ color: i <= r.rating ? "var(--gold)" : "var(--line-strong)" }} />)}</span></div></div><span className="faint" style={{ fontSize: ".8rem" }}>{r.date}</span></div>
                <p className="muted" style={{ marginTop: 10, fontSize: ".92rem" }}>{r.text}</p>
                <button className="btn btn-soft btn-sm mt8" onClick={() => toast("Reply sent")}><Icon name="edit" size={15} /> Reply</button>
              </div>
            ))}
          </div>
        )}

        {tab === "payouts" && <PayoutsPanel toast={toast} flags={flags} />}

        {tab === "billing" && (
          <div className="dash-pane">
            <div className="card" style={{ padding: 22 }}>
              <div className="flex between center wrap g12"><div><span className="eyebrow">Current plan</span><h3 style={{ fontSize: "1.4rem", marginTop: 6 }}>Verified · $19/mo</h3><p className="faint">Next billing 1 July 2026</p></div>
                <button className="btn btn-gold" onClick={() => navigate("pricing")}>Upgrade to Featured</button></div>
              <hr className="divider" style={{ margin: "18px 0" }} />
              <h4 style={{ fontWeight: 700, marginBottom: 10 }}>Payment history</h4>
              {[["1 Jun 2026", "Verified plan", "$39.00"], ["1 May 2026", "Verified plan", "$39.00"], ["1 Apr 2026", "Verified plan", "$39.00"]].map(([d, desc, amt]) => (
                <div key={d} className="flex between" style={{ padding: "10px 0", borderBottom: "1px solid var(--line)" }}><span className="muted">{d} · {desc}</span><span style={{ fontWeight: 700 }}>{amt}</span></div>
              ))}
            </div>
          </div>
        )}
      </div>
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
