"use client";

/* Humble Halal — Business screens (ported from screens-business.jsx):
   For Business value page, Pricing, Add-Listing wizard, Owner Dashboard.
   Owner tab panels live in components/owner/ (extracted for reviewability). */
import { Fragment, useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import { HHData } from "@/lib/data";
import type { Listing, LatLng } from "@/lib/types";
import { planKey, PLANS, PLAN_LIST, FOUNDING } from "@/lib/plans";
import { useUser } from "@clerk/nextjs";
import { useSupabaseBrowser, supabaseConfigured } from "@/lib/supabase/client";
import { REGIONS, townsInRegion, nearestTown, SG_CENTER } from "@/lib/sg-locations";
import { useApp } from "../app-context";
import { useDirectory } from "../directory-context";
import { track, checkoutMeta } from "@/lib/analytics";
import { planCheckoutValue } from "@/lib/pricing-map";
import { HelpCallout } from "../help-callout";
import { Badge, Icon, ImagePh, MobileHeader, WizardSteps } from "../ui";
import { Newsletter } from "../newsletter";
import { AddressAutocomplete, type AddrPick } from "../biz/address-autocomplete";
import { MapView } from "../map/map-view";
import { OwnerListingEditor } from "../owner/listing-editor";
import { PayoutsPanel } from "../owner/payouts";
import { CertVault } from "../owner/cert-vault";
import { OwnerAds } from "../owner/ads-tab";
import { OwnerInsights } from "../owner/insights";
import { PlanBenefitsCard } from "../owner/plan-benefits";
import { GrowthServicesCard } from "../owner/growth-services";
import { OwnerOfferCard } from "../owner/offer-card";
import { PendingSubmissions, type PendingSubmission } from "../owner/pending-submissions";
import { ActivationChecklist } from "../owner/activation-checklist";
import { ReviewRequestCard } from "../owner/review-request-card";
import { OwnerLeads } from "../owner/leads-tab";
import { OwnerCouponsTab } from "../owner/coupons-tab";
import type { OwnerBiz, OwnerEvent } from "../owner/types";
import { ProfileStrengthCard } from "../owner/profile-strength";

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
              <p style={{ color: "#DCE9EA", marginTop: 10 }}>Set up your free listing in minutes. Upgrade any time for verification and featured placement.</p>
              <div className="flex g10 center" style={{ justifyContent: "center", marginTop: 18 }}>
                <button className="btn btn-gold btn-lg" onClick={() => navigate("add-listing")}>Get started</button>
                <button className="btn btn-lg" style={{ background: "rgba(255,255,255,.12)", color: "#fff" }} onClick={() => navigate("claim")}>Claim existing listing</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Owner-lead capture: deliver the "Get Your Business Found" starter kit and
          seed the B2B nurture (source "for-business" → owner segment, stage lead). */}
      <section className="hh-wrap" style={{ paddingBottom: 56 }}>
        <div className="newsletter-card" style={{ maxWidth: 640, margin: "0 auto" }}>
          <span className="eyebrow">📈 For business owners</span>
          <h2 style={{ fontSize: "1.25rem", marginTop: 8 }}>Get your business found by halal-seekers</h2>
          <p className="muted" style={{ marginTop: 8 }}>
            Free starter kit: how MUIS-verified listings win more customers on HumbleHalal.
          </p>
          <div style={{ marginTop: 14 }}>
            <Newsletter source="for-business" stage="lead" cta="Send the starter kit" />
          </div>
        </div>
        <p className="muted tc" style={{ fontSize: ".88rem", marginTop: 18 }}>
          Rather have it handled? <strong>Managed marketing is available</strong> — powered by{" "}
          <strong>Onnifyworks</strong>, Humble Halal&rsquo;s growth team.{" "}
          <a href="/growth-partner" style={{ fontWeight: 600 }}>Start Growth Partner intake →</a>
        </p>
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
  const choosePlan = async (id: string, founding = false) => {
    if (id === "free") return navigate("add-listing");
    if (!flags.paidPlans) {
      toast("Paid plans are coming soon — get listed free today");
      return navigate("add-listing");
    }
    try {
      const res = await fetch("/api/checkout/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // founding forces yearly billing at the locked founding rate.
        body: JSON.stringify({ plan: id, yearly: founding || yearly, founding, ...checkoutMeta() }),
      });
      const data = await res.json();
      if (data.url) {
        track.checkoutStart(id, `Plan: ${id}${founding ? " (founding)" : ""}`, planCheckoutValue(id, founding || yearly, founding), { checkoutType: "plan" });
        window.location.href = data.url;
        return;
      }
      if (founding && data.reason === "founding_not_available") {
        toast("The founding rate is fully claimed — standard plans below.");
        return;
      }
      if (res.status === 401 || data.reason === "not_signed_in") {
        toast("Log in first, then choose your plan.");
        return navigate("login");
      }
      if (data.reason === "no_business") {
        toast("Create or claim your business before choosing a paid plan.");
        return navigate("add-listing");
      }
      if (data.reason === "already_subscribed") {
        toast("You already have an active plan — change or cancel it from Billing.");
        return navigate("owner-dashboard", { tab: "billing" });
      }
      if (data.reason === "price_not_configured" || data.reason === "stripe_not_configured") {
        toast("Checkout for this plan is not configured yet.");
        return;
      }
      if (data.reason === "stripe_error" || data.reason === "unavailable" || res.status >= 500) {
        toast("Payments are having a moment — you have not been charged. Please try again shortly.");
        return;
      }
      if (data.reason === "founding_sold_out") {
        toast("The founding rate is fully claimed — standard plans below.");
        return;
      }
      if (res.status === 429) {
        toast("Too many attempts — please wait a minute and try again.");
        return;
      }
    } catch {
      toast("Checkout could not start — please try again.");
      return;
    }
    // Only the no-business path should steer to add-listing; anything else
    // unrecognised is a payment problem, not a missing listing.
    toast("Checkout could not start — you have not been charged. Please try again.");
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
            <span>
              First {FOUNDING.cap} businesses lock in <b>{PLANS[FOUNDING.plan].name} at S${FOUNDING.yearly}/year</b>
              {" "}(usually S${PLANS[FOUNDING.plan].yearly}/yr) — grandfathered for life.
            </span>
          </div>
          <button className="btn btn-gold btn-sm fb-cta" onClick={() => choosePlan(FOUNDING.plan, true)}>Claim founding rate</button>
        </div>
        <div className="pricing-grid">
          {tiers.map((t) => (
            <div key={t.id} className={`pricing-card card ${t.accent ? "feat" : ""}`}>
              {t.popular && <span className="pop-badge">Most popular</span>}
              <span className="eyebrow" style={{ color: "var(--gold-800)" }}>{t.tag}</span>
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
const LISTING_DRAFT_KEY = "hh-draft-listing";

export function AddListingScreen() {
  const { navigate, toast } = useApp();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<ListingForm>({ name: "", desc: "", phone: "", whatsapp: "", cat: "", address: "", region: "", town: "", postal: "", halal: "", certNo: "", photos: 0, photoUrls: [], proofName: "", franchise: false, outlets: [emptyOutlet()] });
  const set = <K extends keyof ListingForm>(k: K, v: ListingForm[K]) => setData((d) => ({ ...d, [k]: v }));
  const [uploading, setUploading] = useState(false);
  const [stepErr, setStepErr] = useState("");
  const [draftAvailable, setDraftAvailable] = useState<{ step: number; data: ListingForm } | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const proofInputRef = useRef<HTMLInputElement | null>(null);

  // Draft persistence — abandoning a 6-step wizard used to lose everything.
  // Saved per step-change/edit; offered back on return; cleared on submit.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LISTING_DRAFT_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as { step?: number; data?: ListingForm };
      if (saved?.data?.name) setDraftAvailable({ step: saved.step || 0, data: saved.data });
    } catch { /* corrupt draft — ignore */ }
  }, []);
  useEffect(() => {
    if (!data.name.trim()) return; // nothing worth saving yet
    try { localStorage.setItem(LISTING_DRAFT_KEY, JSON.stringify({ step, data })); } catch { /* storage full/private */ }
  }, [step, data]);

  // Real photo upload — one request per file to /api/owner/photos (authed,
  // rate-limited; business-photos bucket). Skips files that fail; caps at 6 —
  // the plan-based gallery cap applies once the listing is approved + owned.
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
          const res = await fetch("/api/owner/photos", { method: "POST", body: fd });
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
    track.ownerAddListing({ businessName: data.name, category: data.cat, area: data.town || data.region, halalTier: data.halal, franchise: data.franchise });
    try { localStorage.removeItem(LISTING_DRAFT_KEY); } catch { /* ignore */ }
    navigate("success", { type: "listing" });
  };

  // Per-step gate — Continue used to be always-enabled, so incomplete
  // submissions sailed through to moderation. Empty string = step is fine.
  const validateStep = (s: number): string => {
    if (s === 0) {
      if (data.name.trim().length < 2) return "Enter your business name to continue.";
      if (data.phone && data.phone.replace(/\D/g, "").length < 8) return "That phone number looks too short.";
    }
    if (s === 1) {
      if (data.franchise) {
        if (!data.outlets.some((o) => o.address.trim())) return "Add at least one outlet address.";
      } else {
        if (!data.address.trim()) return "Add your address so customers can find you.";
        if (data.postal && !/^\d{6}$/.test(data.postal)) return "Postal code should be 6 digits.";
      }
    }
    if (s === 2 && !data.cat) return "Pick the category that fits best.";
    if (s === 3 && !data.halal) return "Choose your halal status to continue.";
    return "";
  };
  const next = () => {
    const err = validateStep(step);
    if (err) { setStepErr(err); return; }
    setStepErr("");
    if (step < steps.length - 1) setStep(step + 1);
    else submitListing();
  };
  const prev = () => { setStepErr(""); return step > 0 ? setStep(step - 1) : navigate("for-business"); };

  return (
    <div className="screen-in hh-page has-wizard-footer">
      <MobileHeader title="Add your business" onBack={prev} />
      <div className="wizard">
        <div className="wizard-head hide-mob">
          <h1 style={{ fontSize: "1.7rem" }}>Add your business</h1>
          <p className="muted">Step {step + 1} of {steps.length} — {steps[step]}</p>
        </div>
        <WizardSteps steps={steps} step={step} />

        {draftAvailable && (
          <div className="notice" role="status" style={{ marginBottom: 12 }}>
            <Icon name="info" size={17} />
            <span className="f1">Pick up where you left off? We saved your draft for <strong>{draftAvailable.data.name}</strong>.</span>
            <div className="flex g6">
              <button className="btn btn-primary btn-sm" onClick={() => { setData(draftAvailable.data); setStep(Math.min(draftAvailable.step, steps.length - 1)); setDraftAvailable(null); }}>Restore</button>
              <button className="btn btn-ghost btn-sm" onClick={() => { setDraftAvailable(null); try { localStorage.removeItem(LISTING_DRAFT_KEY); } catch { /* ignore */ } }}>Discard</button>
            </div>
          </div>
        )}

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
              <div className="franchise-switch">
                <span className="flex g10 center"><span className="attn-ico"><Icon name="building" size={17} /></span>
                  <span><span style={{ fontWeight: 700, display: "block" }}>Multiple locations (franchise)</span><span className="faint" style={{ fontSize: ".8rem" }}>Manage every outlet under one profile</span></span></span>
                {/* Real focusable toggle with switch semantics (was a non-focusable
                    span onClick — failed WCAG 2.1.1 / 4.1.2). */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={data.franchise}
                  aria-label="Multiple locations (franchise)"
                  className={`switch ${data.franchise ? "on" : ""}`}
                  onClick={() => set("franchise", !data.franchise)}
                />
              </div>

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

        {stepErr && (
          <div className="notice notice-warn" role="alert" style={{ marginTop: 12 }}>
            <Icon name="warning" size={17} /> <span>{stepErr}</span>
          </div>
        )}

        <div className="wizard-foot wizard-footer">
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
const DASH_TABS = ["overview", "listings", "promotions", "cert", "events", "payouts", "reviews", "ads", "leads", "billing"] as const;
const isDashTab = (v: unknown): v is (typeof DASH_TABS)[number] => DASH_TABS.includes(v as (typeof DASH_TABS)[number]);

export function OwnerDashboardScreen({ leadRoutingEnabled = false }: { leadRoutingEnabled?: boolean }) {
  const { navigate, toast, flags, params } = useApp();
  const dir = useDirectory();
  const { user } = useUser();
  const supabase = useSupabaseBrowser();
  // Tab state lives in ?tab= so tabs are deep-linkable (emails, the activation
  // checklist and /advertise all point at specific tabs) and survive refresh.
  // replaceState keeps switching out of the back-button history; the app's
  // SearchParamsBridge feeds the param back in for external navigations.
  const [tab, setTabState] = useState("overview");
  useEffect(() => {
    if (isDashTab(params.tab) && params.tab !== tab) setTabState(params.tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.tab]);
  const setTab = (id: string) => {
    setTabState(id);
    const url = new URL(window.location.href);
    if (id === "overview") url.searchParams.delete("tab");
    else url.searchParams.set("tab", id);
    window.history.replaceState(null, "", url.toString());
  };
  // The tab strip scrolls horizontally on mobile — deep-linked tabs (?tab=ads,
  // ?tab=billing) can sit off-screen, so bring the active one into view.
  useEffect(() => {
    document.querySelector(".dash-tabs button.on")?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [tab]);
  const demoListings = [dir.listings[0], dir.listings.find((l) => l.id === "l5") || dir.listings[6]];

  // Real owner data when Supabase is live + the user is signed in; otherwise
  // mock-mode keeps the demo so the screen isn't bare in dev/previews.
  const live = supabaseConfigured;
  const [biz, setBiz] = useState<OwnerBiz[] | null>(null); // null = loading
  const [ownerEvents, setOwnerEvents] = useState<OwnerEvent[] | null>(null);
  const [pending, setPending] = useState<PendingSubmission[]>([]); // in-review submissions
  const [editingId, setEditingId] = useState<string | null>(null); // listing being edited inline

  // Reload the owner's businesses (id-only refresh keeps card metadata current
  // after an inline edit). Returns the list so callers can chain.
  const loadBiz = useCallback(async () => {
    const sb = supabase;
    if (!sb || !user) return [] as OwnerBiz[];
    const { data: bd } = await sb.from("businesses").select("id, slug, name, area, cat_id, plan, featured, halal_tier, last_verified_at, status, photos, description, opening_hours, website, phone, whatsapp, socials").or(`owner_id.eq.${user.id},claimed_by.eq.${user.id}`);
    const list = (bd as OwnerBiz[]) || [];
    setBiz(list);
    return list;
  }, [supabase, user]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const sb = supabase;
      if (!sb) return; // mock mode
      if (!user) { if (alive) { setBiz([]); setOwnerEvents([]); setPending([]); } return; }
      await loadBiz();
      if (!alive) return;
      try {
        const eventRes = await fetch("/api/owner/events");
        const eventJson = await eventRes.json().catch(() => ({}));
        if (alive) setOwnerEvents(eventJson?.ok && Array.isArray(eventJson.events) ? eventJson.events as OwnerEvent[] : []);
      } catch {
        if (alive) setOwnerEvents([]);
      }
      // In-flight submissions (pending listings + claims) → "In review" cards.
      try {
        const res = await fetch("/api/owner/submissions");
        const j = await res.json().catch(() => ({}));
        if (alive && j?.ok && Array.isArray(j.submissions)) setPending(j.submissions as PendingSubmission[]);
      } catch { /* cards just don't render */ }
    })();
    return () => { alive = false; };
  }, [supabase, user, loadBiz]);
  const myBiz = biz && biz.length ? biz[0] : null;
  // GA4 owner context: business id/plan/tier as user_properties so every
  // subsequent event from this owner is segmentable per business.
  useEffect(() => {
    if (myBiz) track.identifyOwner({ businessId: String(myBiz.id), plan: planKey(myBiz), halalTier: myBiz.halal_tier ?? undefined });
  }, [myBiz]);
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
      // Scope the portal to the business currently in view (matters once an owner
      // has more than one) — the route ownership-checks the id and falls back to
      // the caller's first subscribed business if omitted.
      const res = await fetch("/api/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(myBiz ? { businessId: String(myBiz.id) } : {}),
      });
      const data = await res.json();
      if (data.ok && data.url) { track.ownerAction("billing_portal", myBiz ? String(myBiz.id) : undefined); window.location.href = data.url; return; }
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
        track.ownerAction("event_cancel", myBiz ? String(myBiz.id) : undefined, { item_id: id });
        toast("Event cancelled — attendees notified");
      } else toast(j?.reason === "forbidden" ? "You can’t cancel this event" : "Couldn’t cancel — try again");
    } catch { toast("Couldn’t cancel — try again"); }
  };

  const tabs: [string, string, string][] = [["overview", "Overview", "chart"], ["listings", "My listings", "store"], ["promotions", "Promotions", "ticket"], ["cert", "Halal certificate", "shield-check"], ["events", "My events", "calendar"], ["payouts", "Payouts", "dollar"], ["reviews", "Reviews", "star"], ["ads", "Sponsored ads", "trophy"], ...(leadRoutingEnabled ? [["leads", "Leads", "briefcase"] as [string, string, string]] : []), ["billing", "Billing", "settings"]];
  const listingCount = live ? (biz?.length ?? 0) : demoListings.length;
  const eventCount = live ? (ownerEvents?.length ?? 0) : 0;
  const verifiedCount = live ? (biz || []).filter((b) => b.halal_tier === "muis" || b.halal_tier === "admin").length : 1;
  const ownerSummary: [string, string, string, string][] = [
    ["Listings", biz === null && live ? "…" : String(listingCount), "store", "Published or claimed profiles"],
    ["Verified", biz === null && live ? "…" : String(verifiedCount), "shield-check", "Trust badges active"],
    ["Events", ownerEvents === null && live ? "…" : String(eventCount), "calendar", "Managed from dashboard"],
    ["Plan", currentPlanLabel, "crescent", canUpgrade ? "Upgrade available" : "Highest tier"],
  ];

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
    <div className="screen-in hh-page dash dash-owner">
      <div className="dash-header hh-pattern">
        <div className="hh-wrap">
          <div className="flex between center wrap g12">
            <div><span className="eyebrow" style={{ color: "var(--gold)" }}>Business dashboard</span>
              <h1 style={{ color: "#fff", fontSize: "1.8rem", marginTop: 6 }}>{(() => {
                const h = new Date().getHours();
                const greet = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
                const name = live ? (myBiz?.name || (biz === null ? "…" : "Your business")) : "Warung Bumbu Rempah";
                return `${greet}, ${name}`;
              })()}</h1>
              <div className="flex g8 center" style={{ marginTop: 8 }}>{live ? (myBiz ? <>{myBiz.halal_tier === "muis" && <Badge type="muis" />}{myBiz.halal_tier === "admin" && <Badge type="admin" />}</> : null) : <><Badge type="muis" /><Badge type="owned" /></>}</div></div>
            <div className="flex g10 center wrap" style={{ alignItems: "center" }}>
              <div className="flex g8 center" style={{ flexWrap: "wrap" }}>
                <span className="plan-chip"><Icon name="crescent" size={13} /> {currentPlanLabel} plan</span>
                {canUpgrade && <button className="btn btn-soft btn-sm" onClick={() => navigate("pricing")}><Icon name="arrow" size={15} /> Upgrade</button>}
              </div>
              {live && myBiz?.slug && (
                <>
                  <a className="btn btn-outline btn-sm" href={`/business/${myBiz.slug}`} target="_blank" rel="noopener noreferrer" style={{ color: "#fff", borderColor: "rgba(255,255,255,.4)" }}><Icon name="external" size={14} /> View public listing</a>
                  <button className="btn btn-outline btn-sm" style={{ color: "#fff", borderColor: "rgba(255,255,255,.4)" }} onClick={async () => {
                    const url = `${window.location.origin}/business/${myBiz.slug}`;
                    try {
                      if (navigator.share) await navigator.share({ title: myBiz.name, url });
                      else { await navigator.clipboard.writeText(url); toast("Profile link copied"); }
                    } catch { /* user dismissed share sheet */ }
                  }}><Icon name="share" size={14} /> Share profile</button>
                  <button className="btn btn-soft btn-sm" onClick={() => setTab("listings")}><Icon name="edit" size={14} /> Edit listing</button>
                </>
              )}
              <button className="btn btn-gold" onClick={() => navigate("add-listing")}><Icon name="plus" size={18} /> Add listing</button>
            </div>
          </div>
        </div>
      </div>

      <div className="hh-wrap">
        <div className="dash-summary-grid dash-overlap">
          {ownerSummary.map(([label, value, icon, hint]) => (
            <div key={label} className="dash-summary-card">
              <span className="dash-summary-ico"><Icon name={icon} size={18} /></span>
              <div>
                <strong>{value}</strong>
                <span>{label}</span>
                <small>{hint}</small>
              </div>
            </div>
          ))}
        </div>
        <div className="dash-layout">
        <div className="dash-tabs" role="tablist" aria-label="Dashboard sections">
          {tabs.map(([id, label, icon]) => (<button key={id} role="tab" aria-selected={tab === id} className={tab === id ? "on" : ""} onClick={() => setTab(id)}><Icon name={icon} size={17} /> {label}</button>))}
        </div>
        <div className="dash-main">

        {tab === "overview" && (
          <div className="dash-pane">
            {/* Bridges the page <h1> and the overview cards' <h3>s so the heading
                order is h1 → h2 → h3 (axe heading-order). Visually hidden. */}
            <h2 className="sr-only">Overview</h2>
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
            {/* Pending submissions + first-run checklist: a fresh owner sees a
                guided path (and their in-review items) instead of bare stats. */}
            {live && <PendingSubmissions items={pending} />}
            {live && biz !== null && biz.length === 0 && (
              <ActivationChecklist
                hasLive={false}
                pendingCount={pending.length}
                certVault={flags.certVault}
                onGoTab={setTab}
                onAddListing={() => navigate("add-listing")}
              />
            )}
            {live && myBiz && (
              <ProfileStrengthCard
                onGoTab={setTab}
                input={{
                  photosCount: Array.isArray(myBiz.photos) ? myBiz.photos.length : 0,
                  descriptionLength: (myBiz.description || "").length,
                  hasHours: Array.isArray(myBiz.opening_hours) && myBiz.opening_hours.length > 0,
                  hasContact: !!(myBiz.phone || myBiz.whatsapp || (myBiz.socials && Object.keys(myBiz.socials).length)),
                  hasWebsite: !!(myBiz.website || (myBiz.socials && (myBiz.socials.instagram || myBiz.socials.facebook))),
                  verified: myBiz.halal_tier === "muis" || myBiz.halal_tier === "admin",
                }}
              />
            )}
            {live && myBiz && <PlanBenefitsCard businessId={String(myBiz.id)} onUpgrade={() => navigate("pricing")} />}
            <OwnerInsights businessId={myBiz ? String(myBiz.id) : undefined} plan={currentPlan} onUpgrade={() => navigate("pricing")} />
            {/* Quick actions — every target is an existing, working surface. */}
            <div className="card mt20" style={{ padding: 18 }}>
              <h3 style={{ fontSize: "1rem", marginBottom: 12 }}>Quick actions</h3>
              <div className="dash-quick-grid">
                <button className="dash-quick" onClick={() => setTab("listings")}><Icon name="camera" size={18} /> Add photos</button>
                <button className="dash-quick" onClick={() => setTab("promotions")}><Icon name="megaphone" size={18} /> Create promotion</button>
                <button className="dash-quick" onClick={() => setTab("events")}><Icon name="calendar" size={18} /> Post an event</button>
                {live && myBiz?.slug ? (
                  <a className="dash-quick" href={`/business/${myBiz.slug}/poster`} target="_blank" rel="noopener noreferrer"><Icon name="doc" size={18} /> Get QR poster</a>
                ) : (
                  <button className="dash-quick" onClick={() => navigate("add-listing")}><Icon name="plus" size={18} /> Add listing</button>
                )}
              </div>
            </div>
            {/* Upcoming & active events strip (real ownerEvents data). */}
            {live && (ownerEvents?.length ?? 0) > 0 && (
              <div className="card mt20" style={{ padding: 18 }}>
                <div className="flex between center wrap g10" style={{ marginBottom: 10 }}>
                  <h3 style={{ fontSize: "1rem", margin: 0 }}>Upcoming and active</h3>
                  <button className="link-inline" style={{ font: "inherit", fontSize: ".84rem" }} onClick={() => setTab("events")}>Manage events →</button>
                </div>
                <div className="stack g8">
                  {(ownerEvents || []).slice(0, 3).map((e) => (
                    <div key={e.id} className="flex between center g10" style={{ fontSize: ".88rem" }}>
                      <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 600 }}>{e.title}</span>
                      <span className={`hs-pill ${e.status === "cancelled" ? "hs-no" : "hs-yes"}`}>{e.status === "cancelled" ? "Cancelled" : e.status === "published" ? "Live" : e.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Halal Passport for owners — the QR poster existed but had no
                dashboard entry point, so owners couldn't find it (audit /
                passport-clarity). A footfall/loyalty hook, not a trust signal. */}
            {flags.passport && live && myBiz?.slug && (
              <div className="card" style={{ padding: 20, display: "flex", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
                <div className="empty-ico" style={{ width: 44, height: 44, borderRadius: 12, background: "var(--emerald-50)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><Icon name="crescent" size={22} /></div>
                <div style={{ flex: 1, minWidth: 220 }}>
                  <h3 style={{ fontSize: "1.05rem", marginBottom: 4 }}>Halal Passport — collect visits</h3>
                  <p className="muted" style={{ fontSize: ".9rem", lineHeight: 1.5 }}>Print your free QR poster and display it in-store. Customers scan it to collect a visit stamp on their Halal Passport — a reason to come back. It&apos;s a loyalty hook only; it never changes your halal status.</p>
                </div>
                <a className="btn btn-outline btn-sm" href={`/business/${myBiz.slug}/poster`} target="_blank" rel="noopener noreferrer" style={{ flex: "none" }}><Icon name="doc" size={15} /> Get your QR poster</a>
              </div>
            )}
            <GrowthServicesCard onContact={() => navigate("growth-partner")} />
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
              <>
                <PendingSubmissions items={pending} />
                {pending.length === 0 && (
                  <div className="card" style={{ padding: 28, textAlign: "center" }}>
                    <div className="empty-ico" style={{ width: 48, height: 48, borderRadius: 14, background: "var(--emerald-50)", margin: "0 auto 12px" }}><Icon name="store" size={24} /></div>
                    <h3 style={{ fontSize: "1.15rem", marginBottom: 6 }}>No listings yet</h3>
                    <p className="faint" style={{ fontSize: ".9rem", maxWidth: 420, margin: "0 auto" }}>Add your business so customers can find you in the directory.</p>
                  </div>
                )}
              </>
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
                  {/* Free growth tools — drive customers back to the listing. */}
                  <div className="flex g8 wrap" style={{ padding: "0 14px 14px", borderTop: "1px solid var(--line,#eee)", paddingTop: 12 }}>
                    <a className="btn btn-ghost btn-sm" href={`/for-business/badge?slug=${encodeURIComponent(b.slug)}`}><Icon name="badge-check" size={15} /> Website badge</a>
                    <a className="btn btn-ghost btn-sm" href={`/business/${b.slug}/poster`} target="_blank" rel="noopener"><Icon name="external" size={15} /> QR poster</a>
                    <a className="btn btn-ghost btn-sm" href={`/business/${b.slug}/poster#review`} target="_blank" rel="noopener"><Icon name="star" size={15} /> Review link</a>
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
            {/* Offers & promotions — Premium manage card / locked teaser below. */}
            {live && biz !== null && biz.length > 0 && (
              <OwnerOfferCard plan={currentPlan} toast={toast} onUpgrade={() => navigate("pricing")} />
            )}
            <button className="btn btn-outline btn-block" onClick={() => navigate("add-listing")}><Icon name="plus" size={18} /> {live && biz && biz.length ? "Add another listing" : "Add your business"}</button>
          </div>
        )}

        {tab === "events" && (
          <div className="dash-pane">
            <HelpCallout feature="events" />
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

        {tab === "promotions" && <OwnerCouponsTab toast={toast} initialRedeem={String(params.redeem || "")} />}

        {tab === "cert" && <><HelpCallout feature="cert-vault" /><CertVault toast={toast} navigate={navigate} live={live} certVaultEnabled={flags.certVault} biz={myBiz} /></>}

        {tab === "reviews" && (
          <>
            <HelpCallout feature="reviews-owner" />
            {live && biz && biz.length > 0 && <ReviewRequestCard biz={biz.map((b) => ({ id: b.id, slug: b.slug, name: b.name }))} />}
            <OwnerReviews toast={toast} />
          </>
        )}

        {tab === "leads" && leadRoutingEnabled && <><HelpCallout feature="leads" /><OwnerLeads toast={toast} live={live} navigate={navigate} /></>}

        {tab === "payouts" && <><HelpCallout feature="payouts" /><PayoutsPanel toast={toast} flags={flags} /></>}

        {tab === "ads" && <><HelpCallout feature="sponsored-ads" /><OwnerAds navigate={navigate} biz={live ? myBiz : null} /></>}

        {tab === "billing" && (
          <div className="dash-pane stack g16">
            <HelpCallout feature="billing" />
            <div className="card" style={{ padding: 22 }}>
              <div className="flex between center wrap g12">
                <div>
                  <span className="eyebrow">Billing &amp; subscription</span>
                  <h3 style={{ fontSize: "1.3rem", marginTop: 6 }}>
                    You&rsquo;re on the {currentPlanLabel} plan
                  </h3>
                  {/* Don't assert "S$X/mo" here — a yearly or founding-rate owner
                      isn't billed monthly (that showed the wrong figure). The exact
                      amount + renewal date live in the Stripe portal below. */}
                  <p className="faint" style={{ maxWidth: 460 }}>Open the secure Stripe portal to see your renewal date and amount, update your card, download invoices, change plan or cancel.</p>
                </div>
                <div className="flex g8 wrap"><button className="btn btn-gold" onClick={manageBilling}><Icon name="settings" size={16} /> Manage subscription</button><button className="btn btn-soft" onClick={() => navigate("pricing")}>View plans</button></div>
              </div>
            </div>
            {/* At-a-glance plan ladder so upgrading doesn't require leaving the
                dashboard to discover what the next tier adds. */}
            <div className="grid-cards">
              {PLAN_LIST.map((p) => {
                const isCurrent = p.key === currentPlan;
                return (
                  <div key={p.key} className="card" style={{ padding: 16, outline: isCurrent ? "2px solid var(--emerald)" : undefined }}>
                    <div className="flex between center g8">
                      <div style={{ fontWeight: 800 }}>{p.name}</div>
                      {isCurrent ? <span className="pill-tag green">Current</span> : <span className="faint" style={{ fontSize: ".8rem" }}>{p.tag}</span>}
                    </div>
                    <div style={{ fontWeight: 800, fontSize: "1.2rem", marginTop: 6 }}>
                      {p.monthly === 0 ? "Free" : `S$${p.monthly}`}<span className="faint" style={{ fontSize: ".78rem", fontWeight: 400 }}>{p.monthly === 0 ? "" : "/mo"}</span>
                    </div>
                    <ul className="faint" style={{ fontSize: ".8rem", margin: "8px 0 0", paddingLeft: 18, display: "grid", gap: 3 }}>
                      {p.bullets.slice(0, 3).map((b) => <li key={b}>{b}</li>)}
                    </ul>
                    {!isCurrent && (
                      <button className="btn btn-outline btn-sm btn-block" style={{ marginTop: 12 }} onClick={() => navigate("pricing")}>
                        {PLAN_LIST.indexOf(p) > PLAN_LIST.findIndex((x) => x.key === currentPlan) ? "Upgrade" : "Compare"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        </div>
        </div>
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
  const [loadErr, setLoadErr] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [open, setOpen] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let alive = true;
    (async () => {
      const sb = supabase;
      if (!sb) { if (alive) setRows([]); return; }
      const { data, error } = await sb.rpc("owner_reviews");
      if (alive) {
        if (error) setLoadErr(true); // was silently swallowed → looked like "no reviews yet"
        setRows(!error && Array.isArray(data) ? (data as OwnerReviewRow[]) : []);
      }
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
    track.ownerAction("review_reply", undefined, { review_id: id });
    toast("Reply posted");
  };

  // Real reviews only — empty array shows the "No reviews yet" empty state below.
  const display: OwnerReviewRow[] = rows && rows.length > 0 ? rows : [];

  if (rows === null) return <div className="dash-pane"><div className="card" style={{ padding: 24, height: 100, opacity: 0.5 }} aria-busy="true" /></div>;
  if (loadErr) return <div className="dash-pane"><div className="card" style={{ padding: 20 }}><p className="faint" role="alert">Couldn&apos;t load your reviews — refresh to try again.</p></div></div>;
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
