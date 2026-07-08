"use client";

/* Humble Halal — About, Contact and FAQ pages. Content-rich, factual (golden rule:
   discovery platform, never a certifier). */
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Icon } from "../ui";
import { HOME_FAQ, VERIFY_FAQ } from "@/lib/faq";
import { CONTACT_EMAILS } from "@/lib/contact";
import { track } from "@/lib/analytics";

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
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) || form.message.trim().length < 5) { setState("error"); return; }
    setState("sending");
    try {
      const r = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const d = await r.json();
      setState(d.ok ? "done" : "error");
      if (d.ok) track.leadSubmit("contact", {}, { email: form.email || undefined });
    } catch { setState("error"); }
  };

  return (
    <div className="screen-in hh-page">
      <Crumb trail={[{ label: "Home", href: "/" }, { label: "Contact" }]} />
      <div className="hh-wrap hh-section">
        <h1 style={{ fontSize: "1.9rem", marginBottom: 6 }}>Contact us</h1>
        <p className="muted" style={{ maxWidth: 620, marginBottom: 26 }}>Questions, feedback or a partnership in mind? We'd love to hear from you. We aim to reply within <strong>1–2 business days</strong>.</p>

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

/* ── FAQ hub ──────────────────────────────────────────────────────────────── */
const TRAVEL_FAQ = [
  { q: "Are the hotels and flights “halal certified”?", a: "No — Humble Halal is a discovery platform, not a certifier. We surface factual, Muslim-friendly details (prayer rooms, halal dining nearby, alcohol-free options, Muslim-meal flags, prayer-aware layovers, qibla) from each hotel's or airline's own information. Always confirm specifics with the hotel or airline." },
  { q: "Can I book flights and a hotel together?", a: "Yes. Search Muslim-friendly hotels and flights for Umrah, Hajj or everyday Muslim travel, and plan your whole trip in one place. Payment is handled securely by our travel partner." },
  { q: "Do you support Umrah and Hajj?", a: "Yes — use the Jeddah and Madinah presets, see the Hijri date and Ramadan/Hajj-season flags, and pair flights with a Muslim-friendly stay near the Haramain." },
  { q: "When am I charged, and can I cancel?", a: "You're never charged without a confirmed booking, and cancellations follow the hotel's or airline's own policy (shown before you pay). You can manage and cancel eligible bookings in My Trips." },
];
const BUSINESS_FAQ = [
  { q: "How do I list my business?", a: "Create a free listing from the For Business page. You can add your details, photos, opening hours and halal information, then upgrade for a verification review and more visibility." },
  { q: "What does the Verified badge mean?", a: "It means our team has reviewed documentary proof for that business (for example a MUIS certificate or supplier certifications). Self-declared information is shown without a Verified badge. See How we verify for the full badge system." },
  { q: "Can I advertise with Humble Halal?", a: "Yes — see Advertise with us for formats and how to reach Singapore's Muslim community, or email partners@humblehalal.com." },
];

export function FaqScreen() {
  const sections: [string, { q: string; a: string }[]][] = [
    ["Getting started & the directory", HOME_FAQ],
    ["Trust & verification", VERIFY_FAQ],
    ["Halal travel — hotels & flights", TRAVEL_FAQ],
    ["For businesses", BUSINESS_FAQ],
  ];
  return (
    <div className="screen-in hh-page">
      <Crumb trail={[{ label: "Home", href: "/" }, { label: "FAQ" }]} />
      <div className="hh-wrap hh-section" style={{ maxWidth: 860 }}>
        <h1 style={{ fontSize: "1.9rem", marginBottom: 6 }}>Frequently asked questions</h1>
        <p className="muted" style={{ marginBottom: 26 }}>Everything about finding halal places, our trust badges, and booking Muslim-friendly travel. Still stuck? <Link href="/contact">Contact us</Link>.</p>
        {sections.map(([title, items]) => (
          <section key={title} style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: "1.25rem", marginBottom: 12 }}>{title}</h2>
            <div className="flt-faq">
              {items.map((it) => (
                <details key={it.q} className="flt-faq-item"><summary>{it.q}<span className="faq-chevron" aria-hidden="true" /></summary><p>{it.a}</p></details>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
