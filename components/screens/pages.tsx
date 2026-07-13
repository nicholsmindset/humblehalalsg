"use client";

/* Humble Halal — About, Contact and FAQ pages. Content-rich, factual (golden rule:
   discovery platform, never a certifier). */
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Icon } from "../ui";
import { HOME_FAQ, VERIFY_FAQ, TRAVEL_FAQ, BUSINESS_FAQ, type QA } from "@/lib/faq";
import { HELP, type FaqCategory } from "@/lib/help-content";
import type { Flags } from "@/lib/flags";
import { CONTACT_EMAILS } from "@/lib/contact";
import { track } from "@/lib/analytics";
import { Turnstile } from "@/components/turnstile";

function Crumb({ trail }: { trail: { label: string; href?: string }[] }) {
  return (
    <nav className="travel-breadcrumbs" aria-label="Breadcrumb"><div className="hh-wrap">
      {trail.map((t, i) => (
        <span className="crumb" key={i}>{t.href ? <Link href={t.href}>{t.label}</Link> : <span aria-current="page">{t.label}</span>}{i < trail.length - 1 ? <Icon name="chevron" size={13} /> : null}</span>
      ))}
    </div></nav>
  );
}

/* ── About ────────────────────────────────────────────────────────────────── */
const PILLARS: [string, string, string][] = [
  ["search", "A trusted halal directory", "Find MUIS-certified, Muslim-owned and Muslim-friendly places across Singapore — with clear, honest trust badges so you always know what's verified and what's self-declared."],
  ["plane", "Halal travel, done right", "Search Muslim-friendly hotels and flights worldwide — prayer rooms, halal dining nearby, alcohol-free options, Muslim-meal flags, prayer-aware layovers and qibla — for Umrah, Hajj and everyday travel."],
  ["shield-check", "Transparency over hype", "We're a discovery platform, not a certifier. Facts come from each business's own information and, where marked, a human review by our team — never an AI guess. MUIS HalalSG remains the certifying authority."],
  ["heart", "Built with the community", "Suggestions, reports and reviews from Muslim travellers and diners keep the directory accurate and useful. Built for the Singapore Muslim community, and for Muslims travelling the world."],
];

export function AboutScreen() {
  return (
    <div className="screen-in hh-page">
      <Crumb trail={[{ label: "Home", href: "/" }, { label: "About" }]} />
      <section className="travel-hero hh-pattern">
        <div className="hh-wrap">
          <span className="eyebrow" style={{ color: "#cfe0da" }}>About Humble Halal</span>
          <h1>Helping Muslims discover, dine and travel with confidence</h1>
          <p className="sub">Humble Halal is Singapore's halal &amp; Muslim-owned directory — and a Muslim-first travel platform for hotels and flights. We bring the facts that matter together in one trusted place, so you can choose with confidence.</p>
        </div>
      </section>

      <div className="hh-wrap hh-section">
        <div className="flt-benefit-grid">
          {PILLARS.map(([ic, h, b]) => (
            <div key={h} className="flt-benefit"><span className="fi-ico"><Icon name={ic} size={20} /></span><h3>{h}</h3><p className="muted">{b}</p></div>
          ))}
        </div>

        <section className="about-block" style={{ marginTop: 44 }}>
          <h2>Our promise: facts and human verification — never AI guesswork</h2>
          <p>We never let an algorithm declare a business, hotel or flight “halal”. Halal status is a matter of trust and scholarship, so we defer to <a href="https://www.muis.gov.sg/" target="_blank" rel="noopener noreferrer">MUIS</a> and the official <strong>HalalSG</strong> register, and we show exactly where each piece of information comes from. A <strong>Verified</strong> badge means our team reviewed the details; everything else is the business's or hotel's own declaration for you to confirm. Always check certification on MUIS HalalSG before you rely on it.</p>
        </section>

        <section className="about-block" style={{ marginTop: 32 }}>
          <h2>Who we are</h2>
          <p>Humble Halal is operated by <strong>ONN GROUP LLP</strong>, based at 60 Paya Lebar Road, #06-28 Paya Lebar Square, Singapore 409051. We're an independent platform built for the Singapore Muslim community and for Muslim travellers everywhere.</p>
        </section>

        <div className="flex g10 wrap" style={{ marginTop: 32 }}>
          <Link className="btn btn-primary" href="/explore">Explore halal places</Link>
          <Link className="btn btn-soft" href="/travel">Plan halal travel</Link>
          <Link className="btn btn-outline" href="/contact">Contact us</Link>
        </div>
      </div>
    </div>
  );
}

/* ── Contact ──────────────────────────────────────────────────────────────── */
export function ContactScreen() {
  const [form, setForm] = useState({ name: "", email: "", subject: "General enquiry", message: "", website: "" });
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [tsToken, setTsToken] = useState("");
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) || form.message.trim().length < 5) { setState("error"); return; }
    setState("sending");
    try {
      const r = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, ...(tsToken ? { turnstileToken: tsToken } : {}) }) });
      const d = await r.json();
      setState(d.ok ? "done" : "error");
      if (d.ok) track.leadSubmit("contact", {}, { email: form.email || undefined });
    } catch { setState("error"); }
  };

  return (
    <div className="screen-in hh-page">
      <Crumb trail={[{ label: "Home", href: "/" }, { label: "Contact" }]} />
      <div className="hh-wrap hh-section">
        <h1 style={{ fontSize: "1.9rem", marginBottom: 6, textAlign: "center" }}>Contact us</h1>
        <p className="muted" style={{ maxWidth: 620, margin: "0 auto 26px", textAlign: "center" }}>Questions, feedback or a partnership in mind? We'd love to hear from you. We aim to reply within <strong>1–2 business days</strong>.</p>

        <div className="contact-grid">
          <div className="card" style={{ padding: 22 }}>
            {state === "done" ? (
              <div className="contact-done"><div className="empty-ico" style={{ background: "var(--emerald-50)", color: "var(--emerald)" }}><Icon name="check" size={26} /></div><h2 style={{ marginTop: 12 }}>Thank you — message received</h2><p className="muted">We've got your message and will reply by email within 1–2 business days, insha'Allah.</p></div>
            ) : (
              <form onSubmit={submit} noValidate className="stack g14">
                <h2 style={{ fontSize: "1.15rem" }}>Send us a message</h2>
                <input type="text" name="website" value={form.website} onChange={(e) => set("website", e.target.value)} style={{ display: "none" }} tabIndex={-1} autoComplete="off" aria-hidden />
                <div className="form-row">
                  <div className="field"><label htmlFor="contact-name">Your name *</label><input id="contact-name" required value={form.name} onChange={(e) => set("name", e.target.value)} autoComplete="name" /></div>
                  <div className="field"><label htmlFor="contact-email">Email *</label><input id="contact-email" required type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@email.com" autoComplete="email" /></div>
                </div>
                <div className="field"><label htmlFor="contact-subject">Subject</label><select id="contact-subject" value={form.subject} onChange={(e) => set("subject", e.target.value)}><option>General enquiry</option><option>Help with a listing or booking</option><option>Business / advertising partnership</option><option>Managed marketing (Growth Partner)</option><option>Report incorrect information</option><option>Privacy &amp; data request</option><option>Press / media</option></select></div>
                <div className="field"><label htmlFor="contact-message">Message *</label><textarea id="contact-message" required rows={5} value={form.message} onChange={(e) => set("message", e.target.value)} placeholder="How can we help?" /></div>
                {state === "error" && <p style={{ color: "var(--danger)", fontSize: ".9rem" }}>Please enter your name, a valid email and a short message.</p>}
                <Turnstile onToken={setTsToken} />
                <button className="btn btn-primary btn-lg" type="submit" disabled={state === "sending"}>{state === "sending" ? "Sending…" : "Send message"}</button>
              </form>
            )}
          </div>

          <aside className="stack g16">
            <div className="card" style={{ padding: 18 }}>
              <h3 style={{ fontSize: "1.02rem", marginBottom: 10 }}>Email us</h3>
              <ul className="contact-list">
                <li><Icon name="mail" size={15} /><div><strong>General &amp; support</strong><a href={`mailto:${CONTACT_EMAILS.general}`}>{CONTACT_EMAILS.general}</a></div></li>
                <li><Icon name="mail" size={15} /><div><strong>Business &amp; advertising</strong><a href={`mailto:${CONTACT_EMAILS.partners}`}>{CONTACT_EMAILS.partners}</a></div></li>
                <li><Icon name="mail" size={15} /><div><strong>Privacy &amp; data requests</strong><a href={`mailto:${CONTACT_EMAILS.privacy}`}>{CONTACT_EMAILS.privacy}</a></div></li>
              </ul>
            </div>
            <div className="card" style={{ padding: 18 }}>
              <h3 style={{ fontSize: "1.02rem", marginBottom: 8 }}>Office</h3>
              <p className="muted" style={{ fontSize: ".9rem", lineHeight: 1.6 }}>Operated by ONN GROUP LLP<br />60 Paya Lebar Road, #06-28<br />Paya Lebar Square, Singapore 409051</p>
              <p className="muted" style={{ fontSize: ".84rem", marginTop: 10 }}>Support hours: Mon–Fri, 9am–6pm (SGT)</p>
            </div>
            <div className="card" style={{ padding: 18 }}>
              <h3 style={{ fontSize: "1.02rem", marginBottom: 10 }}>Quick help</h3>
              <ul className="contact-quick">
                <li><Link href="/suggest">My business isn't listed →</Link></li>
                <li><Link href="/claim">Claim or manage my listing →</Link></li>
                <li><Link href="/report">Report incorrect info →</Link></li>
                <li><Link href="/faq">Browse the FAQ →</Link></li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

/* ── Growth Partner intake ───────────────────────────────────────────────── */
const GP_GOALS = ["More enquiries", "More walk-ins", "Improve Google/social", "Promote offers", "Launch a new outlet", "Fix weak marketing"];
const GP_CHANNELS = ["Google Business Profile", "Instagram / TikTok", "Paid ads", "Influencers", "Email / WhatsApp list", "None consistently"];
const GP_BUDGETS = ["S$299–S$499/mo", "S$500–S$999/mo", "S$1,000–S$2,000/mo", "S$2,000+/mo", "Not sure yet"];
const GP_TIMELINES = ["ASAP", "This month", "Next 1–3 months", "Just exploring"];

export function GrowthPartnerScreen() {
  const [step, setStep] = useState(0);
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [tsToken, setTsToken] = useState("");
  const [form, setForm] = useState({
    business: "",
    website: "",
    goals: [] as string[],
    channels: [] as string[],
    budget: "",
    timeline: "",
    current: "",
    name: "",
    email: "",
    phone: "",
    notes: "",
  });
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));
  const toggle = (key: "goals" | "channels", value: string) =>
    setForm((f) => ({ ...f, [key]: f[key].includes(value) ? f[key].filter((x) => x !== value) : [...f[key], value] }));
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
  const canNext = step === 0 ? form.business.trim().length >= 2 && form.goals.length > 0 : step === 1 ? !!form.budget && !!form.timeline : true;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !emailOk) { setState("error"); return; }
    setState("sending");
    const message = [
      "Growth Partner intake",
      "",
      `Business: ${form.business || "Not provided"}`,
      `Website/listing: ${form.website || "Not provided"}`,
      `Goals: ${form.goals.join(", ") || "Not provided"}`,
      `Current marketing: ${form.channels.join(", ") || "Not provided"}`,
      `What they are doing now: ${form.current || "Not provided"}`,
      `Budget: ${form.budget || "Not provided"}`,
      `Timeline: ${form.timeline || "Not provided"}`,
      `Phone/WhatsApp: ${form.phone || "Not provided"}`,
      "",
      `Notes: ${form.notes || "None"}`,
    ].join("\n");
    try {
      const r = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, email: form.email, subject: "Managed marketing (Growth Partner)", message, ...(tsToken ? { turnstileToken: tsToken } : {}) }),
      });
      const d = await r.json().catch(() => ({}));
      if (d?.ok) {
        setState("done");
        track.leadSubmit("contact", {}, { email: form.email || undefined });
        requestAnimationFrame(() => document.querySelector(".growth-form")?.scrollIntoView({ block: "center", behavior: "smooth" }));
      } else {
        setState("error");
      }
    } catch { setState("error"); }
  };

  return (
    <div className="screen-in hh-page growth-intake">
      <Crumb trail={[{ label: "Home", href: "/" }, { label: "Growth Partner" }]} />
      <section className="growth-hero hh-pattern">
        <div className="hh-wrap growth-hero-grid">
          <div>
            <span className="eyebrow" style={{ color: "var(--gold)" }}>Humble Halal Growth Partner</span>
            <h1>Managed marketing for halal businesses that want more enquiries</h1>
            <p>
              Tell us your budget, current marketing, and growth goals first. Then we route your enquiry to the right
              Onnifyworks package instead of sending you to a generic contact form.
            </p>
          </div>
          <div className="growth-hero-card">
            <strong>From S$299/mo</strong>
            <span>Campaign setup, content direction, local SEO, ads support, and monthly lead reporting.</span>
          </div>
        </div>
      </section>

      <div className="hh-wrap hh-section">
        <div className="growth-layout">
          <aside className="growth-steps" aria-label="Growth Partner steps">
            {["Goals", "Budget", "Contact"].map((label, i) => (
              <button key={label} className={step === i ? "on" : ""} onClick={() => i <= step && setStep(i)}>
                <span>{i + 1}</span>
                <div><strong>{label}</strong><small>{i === 0 ? "What you want to grow" : i === 1 ? "Spend and timeline" : "Send the brief"}</small></div>
              </button>
            ))}
          </aside>

          <form className="growth-form card" onSubmit={submit} noValidate>
            {state === "done" ? (
              <div className="growth-done">
                <div className="empty-ico" style={{ background: "var(--emerald-50)", color: "var(--emerald)" }}><Icon name="check" size={26} /></div>
                <h2 style={{ marginTop: 12 }}>Intake received</h2>
                <p className="muted">We’ll review your goals and reply with a recommended Growth Partner package within 1–2 business days.</p>
              </div>
            ) : (
              <>
                {step === 0 && (
                  <div className="stack g16">
                    <div><span className="eyebrow">Step 1</span><h2>What are you trying to grow?</h2></div>
                    <div className="grid2">
                      <div className="field"><label>Business name *</label><input value={form.business} onChange={(e) => set("business", e.target.value)} placeholder="e.g. Warung Bumbu Rempah" /></div>
                      <div className="field"><label>Website or listing link</label><input value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="https://..." /></div>
                    </div>
                    <div className="field">
                      <label>Main goals *</label>
                      <div className="option-grid">
                        {GP_GOALS.map((g) => <button key={g} type="button" className={form.goals.includes(g) ? "on" : ""} onClick={() => toggle("goals", g)}>{g}</button>)}
                      </div>
                    </div>
                  </div>
                )}

                {step === 1 && (
                  <div className="stack g16">
                    <div><span className="eyebrow">Step 2</span><h2>Budget and current marketing</h2></div>
                    <div className="field"><label>Monthly marketing budget *</label><div className="option-grid">{GP_BUDGETS.map((b) => <button key={b} type="button" className={form.budget === b ? "on" : ""} onClick={() => set("budget", b)}>{b}</button>)}</div></div>
                    <div className="field"><label>When do you want to start? *</label><div className="option-grid">{GP_TIMELINES.map((t) => <button key={t} type="button" className={form.timeline === t ? "on" : ""} onClick={() => set("timeline", t)}>{t}</button>)}</div></div>
                    <div className="field"><label>What marketing are you doing now?</label><div className="option-grid">{GP_CHANNELS.map((c) => <button key={c} type="button" className={form.channels.includes(c) ? "on" : ""} onClick={() => toggle("channels", c)}>{c}</button>)}</div></div>
                    <div className="field"><label>What has or has not worked?</label><textarea rows={4} value={form.current} onChange={(e) => set("current", e.target.value)} placeholder="Tell us about ads, social posts, offers, agencies, or what you’ve tried." /></div>
                  </div>
                )}

                {step === 2 && (
                  <div className="stack g16">
                    <div><span className="eyebrow">Step 3</span><h2>Where should we send the recommendation?</h2></div>
                    <div className="grid2">
                      <div className="field"><label>Your name *</label><input value={form.name} onChange={(e) => set("name", e.target.value)} autoComplete="name" /></div>
                      <div className="field"><label>Email *</label><input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@email.com" autoComplete="email" /></div>
                    </div>
                    <div className="field"><label>Phone / WhatsApp</label><input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+65..." /></div>
                    <div className="field"><label>Anything else we should know?</label><textarea rows={4} value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Products to promote, target areas, preferred language, campaign deadlines..." /></div>
                    {state === "error" && <p style={{ color: "var(--danger)", fontSize: ".9rem" }}>Please enter your name and a valid email.</p>}
                  </div>
                )}

                <div className="growth-actions">
                  <button type="button" className="btn btn-ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>Back</button>
                  {step < 2 ? (
                    <button type="button" className="btn btn-primary" disabled={!canNext} onClick={() => setStep((s) => Math.min(2, s + 1))}>Continue <Icon name="arrow" size={16} /></button>
                  ) : (
                    <><Turnstile onToken={setTsToken} /><button className="btn btn-primary" type="submit" disabled={state === "sending"}>{state === "sending" ? "Sending…" : "Send intake"}</button></>
                  )}
                </div>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

/* ── FAQ hub ──────────────────────────────────────────────────────────────── */
function slugCat(c: string): string {
  return c.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const FAQ_ORDER: FaqCategory[] = ["Getting started", "Features", "For businesses", "Travel", "Trust & verification"];

/* Nested, flag-aware FAQ. Category-level (legacy) Q&As plus a per-feature
   sub-group for every ENABLED feature (from lib/help-content), so the FAQ never
   documents a hidden feature and stays in sync with the dashboard callouts. */
export function FaqScreen({ flags }: { flags: Flags }) {
  const legacy: Record<FaqCategory, QA[]> = {
    "Getting started": [...HOME_FAQ],
    "Features": [],
    "For businesses": [...BUSINESS_FAQ],
    "Travel": [...TRAVEL_FAQ],
    "Trust & verification": [...VERIFY_FAQ],
  };

  const enabled = HELP.filter((h) => !h.flag || flags[h.flag]);
  const featureGroups: Record<string, { key: string; label: string; faqs: QA[] }[]> = {};
  for (const h of enabled) {
    if (h.faqs.length === 0) continue;
    (featureGroups[h.faqCategory] ||= []).push({ key: h.key, label: h.label, faqs: h.faqs });
  }

  const categories = FAQ_ORDER.filter(
    (c) => legacy[c].length > 0 || (featureGroups[c] && featureGroups[c].length > 0),
  );

  return (
    <div className="screen-in hh-page">
      <Crumb trail={[{ label: "Home", href: "/" }, { label: "FAQ" }]} />
      <div className="hh-wrap hh-section" style={{ maxWidth: 900 }}>
        <h1 style={{ fontSize: "1.9rem", marginBottom: 6 }}>Frequently asked questions</h1>
        <p className="muted" style={{ marginBottom: 18 }}>How Humble Halal works — finding halal places, our trust badges, features and travel. Still stuck? <Link href="/contact">Contact us</Link>.</p>

        <nav className="faq-jump" aria-label="FAQ categories">
          {categories.map((c) => (
            <a key={c} href={`#${slugCat(c)}`} className="faq-jump-link">{c}</a>
          ))}
        </nav>

        {categories.map((c) => (
          <section key={c} id={slugCat(c)} style={{ marginBottom: 30 }}>
            <h2 style={{ fontSize: "1.3rem", marginBottom: 12 }}>{c}</h2>

            <div className="flt-faq">
              {legacy[c].map((it) => (
                <details key={it.q} className="flt-faq-item"><summary>{it.q}<span className="faq-chevron" aria-hidden="true" /></summary><p>{it.a}</p></details>
              ))}
            </div>

            {(featureGroups[c] || []).map((g) => (
              <div key={g.key} id={g.key} className="faq-subgroup">
                <h3 style={{ fontSize: "1.05rem", margin: "16px 0 8px" }}>{g.label}</h3>
                <div className="flt-faq">
                  {g.faqs.map((it) => (
                    <details key={it.q} className="flt-faq-item"><summary>{it.q}<span className="faq-chevron" aria-hidden="true" /></summary><p>{it.a}</p></details>
                  ))}
                </div>
              </div>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
