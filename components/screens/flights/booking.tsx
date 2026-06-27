"use client";

/* Humble Halal — flight booking (3-step: Passenger & Contact → Seats & Bags →
   Review & Pay) with a price-hold countdown, payment mount, and PAID_FLIGHTS_ENABLED
   gating, plus the post-booking confirmation screen (with travel du‘ā). */
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { Icon, Empty, RewardsNote, PromoCode } from "../../ui";
import { COUNTRIES, flagEmoji } from "@/lib/countries";
import { launchLiteApiPayment } from "@/lib/liteapi-payment-client";

interface Pax { firstName: string; middleName: string; lastName: string; dobD: string; dobM: string; dobY: string; gender: string; nationality: string; docType: string; docNumber: string; docExpD: string; docExpM: string; docExpY: string; docCountry: string }
const blankPax = (): Pax => ({ firstName: "", middleName: "", lastName: "", dobD: "", dobM: "", dobY: "", gender: "M", nationality: "SG", docType: "passport", docNumber: "", docExpD: "", docExpM: "", docExpY: "", docCountry: "SG" });
interface Prebook { prebookId: string; transactionId: string | null; secretKey: string | null; publishableKey: string | null; price: number | null; currency: string; expiration?: string | null; servicesAttachable?: unknown }

function isoDate(d: string, m: string, y: string): string {
  if (!d || !m || !y) return "";
  const iso = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  // reject impossible calendar dates (e.g. 31 Feb) before sending to the API
  const dt = new Date(`${iso}T00:00:00Z`);
  return dt.getUTCFullYear() === Number(y) && dt.getUTCMonth() + 1 === Number(m) && dt.getUTCDate() === Number(d) ? iso : "";
}

/* Single native date field — one tap, typeable, no 100-year scroll. Bounds keep
   DOB in the past and document expiry in the future. Keeps the d/m/y state shape
   so validation (isoDate) and the passenger payload are unchanged. */
function DateField({ label, d, m, y, set, future }: { label: string; d: string; m: string; y: string; set: (k: "d" | "m" | "y", v: string) => void; future?: boolean }) {
  const today = new Date();
  const isoLocal = (dt: Date) => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
  const value = d && m && y ? `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}` : "";
  const min = future ? isoLocal(today) : `${today.getFullYear() - 120}-01-01`;
  const max = future ? `${today.getFullYear() + 20}-12-31` : isoLocal(today);
  return (
    <div className="field">
      <label>{label} <span className="req">*</span></label>
      <input
        type="date"
        className="date-input"
        value={value}
        min={min}
        max={max}
        onChange={(e) => {
          const v = e.target.value;
          if (!v) { set("y", ""); set("m", ""); set("d", ""); return; }
          const [yy, mm, dd] = v.split("-");
          set("y", yy); set("m", String(Number(mm))); set("d", String(Number(dd)));
        }}
      />
    </div>
  );
}

function CountrySelect({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="field">
      <label>{label} <span className="req">*</span></label>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{flagEmoji(c.code)} {c.name}</option>)}
      </select>
    </div>
  );
}

function useCountdown(expiration?: string | null, active?: boolean) {
  const [left, setLeft] = useState<number | null>(null);
  const target = useRef<number | null>(null);
  useEffect(() => {
    if (!active) { setLeft(null); target.current = null; return; }
    target.current = expiration ? Date.parse(expiration) : Date.now() + 10 * 60000;
    const tick = () => setLeft(Math.max(0, Math.round(((target.current as number) - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiration, active]);
  return left;
}

export function FlightBookingScreen({ offerId, from, to, date, price, currency, adults, roundTrip, returnDate, bookingEnabled, paymentMode }: { offerId: string; from: string; to: string; date: string; price: string; currency: string; adults: number; roundTrip: boolean; returnDate: string; bookingEnabled: boolean; paymentMode: "sandbox" | "live" }) {
  const [pax, setPax] = useState<Pax[]>(() => Array.from({ length: Math.max(1, adults) }, blankPax));
  const [contact, setContact] = useState({ email: "", phoneCc: "65", phone: "" });
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [busy, setBusy] = useState("");
  const [pb, setPb] = useState<Prebook | null>(null);
  const [err, setErr] = useState("");
  const [priceNote, setPriceNote] = useState("");
  const [settle, setSettle] = useState<"idle" | "returning" | "followup">("idle");
  const countdown = useCountdown(pb?.expiration, step >= 2 && !!pb);

  const setP = (i: number, k: keyof Pax, v: string) => setPax((arr) => arr.map((p, idx) => (idx === i ? { ...p, [k]: v } : p)));
  const services = useMemo(() => {
    const s = pb?.servicesAttachable;
    return Array.isArray(s) ? (s as Record<string, unknown>[]) : [];
  }, [pb]);

  // Payment RETURN (?paid=1&pid&tid): the SDK charged the card and redirected here.
  // Finalise via /flights/book using the context we stashed before paying.
  useEffect(() => {
    let on = true;
    const sp = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const pid = sp?.get("pid"); const tid = sp?.get("tid"); const paid = sp?.get("paid");
    if (!(paid && pid && tid)) return;
    setSettle("returning");
    (async () => {
      try {
        const raw = sessionStorage.getItem("hh_flight_book_" + pid);
        const ctx = raw ? JSON.parse(raw) : {};
        const r = await fetch("/api/travel/flights/book", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prebookId: pid, transactionId: tid, ...ctx }) });
        const d = await r.json();
        if (!on) return;
        if (d.ok) {
          sessionStorage.removeItem("hh_flight_book_" + pid);
          const p = new URLSearchParams({ ref: String(d.bookingRef || d.id || ""), status: String(d.status || ""), from: String(ctx.origin || ""), to: String(ctx.destination || ""), date: String(ctx.date || "") });
          window.location.href = `/travel/flights/confirmation?${p.toString()}`;
        } else setSettle("followup"); // card charged — never show a payment error
      } catch { if (on) setSettle("followup"); }
    })();
    return () => { on = false; };
  }, []);

  // When Review & Pay opens, stash context and mount the hosted card form. The SDK
  // charges the card then redirects to returnUrl (?paid=1) where the effect above books.
  useEffect(() => {
    if (settle !== "idle" || step !== 3 || !pb) return;
    if (!pb.secretKey) { setErr("Secure payment isn't available for this fare — please search again."); return; }
    const expiredAt = pb.expiration ? Date.parse(pb.expiration) : null;
    if (expiredAt && Date.now() > expiredAt) return;
    const cur = pb.currency || currency || "USD";
    const ctx = { origin: from, destination: to, date, currency: cur, total: pb.price, contactEmail: contact.email, passengers: pax.map((p) => ({ firstName: p.firstName, lastName: p.lastName })) };
    try { sessionStorage.setItem("hh_flight_book_" + pb.prebookId, JSON.stringify(ctx)); } catch { /* private mode */ }
    let cancelled = false;
    (async () => {
      try {
        await launchLiteApiPayment({
          mode: paymentMode,
          secretKey: pb.secretKey!,
          targetSelector: "#liteapi-flight-payment",
          returnUrl: `${window.location.origin}/travel/flights/booking?tid=${encodeURIComponent(pb.transactionId || "")}&pid=${encodeURIComponent(pb.prebookId)}&paid=1`,
        });
      } catch { if (!cancelled) setErr("Couldn't load secure payment. Please refresh and try again."); }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settle, step, pb, paymentMode]);

  const crumbs = (
    <nav className="travel-breadcrumbs" aria-label="Breadcrumb"><div className="hh-wrap">
      <span className="crumb"><Link href="/travel">Travel</Link><Icon name="chevron" size={13} /></span>
      <span className="crumb"><Link href="/travel/flights">Flights</Link><Icon name="chevron" size={13} /></span>
      <span className="crumb"><span aria-current="page">Book</span></span>
    </div></nav>
  );

  if (settle === "returning") {
    return (
      <div className="screen-in hh-page">{crumbs}
        <div className="hh-wrap hh-section" style={{ maxWidth: 640 }}>
          <div className="route-loading" role="status"><span className="spinner" /> <span className="faint">Confirming your booking…</span></div>
        </div>
      </div>
    );
  }
  if (settle === "followup") {
    return (
      <div className="screen-in hh-page">{crumbs}
        <div className="hh-wrap hh-section" style={{ maxWidth: 620, textAlign: "center" }}>
          <div className="empty-ico" style={{ margin: "0 auto", background: "var(--gold-50, #fff7ed)", color: "var(--gold-700, #b45309)" }}><Icon name="clock" size={28} /></div>
          <h1 style={{ fontSize: "1.5rem", marginTop: 14 }}>Payment received — confirming your flight</h1>
          <p className="muted" style={{ marginTop: 8 }}>Your payment went through and we&apos;re finalising your ticket with the airline. You&apos;ll get an email shortly — there&apos;s no need to pay again.</p>
          <div className="flex g10 center" style={{ justifyContent: "center", marginTop: 16 }}><Link className="btn btn-primary" href="/travel/trips">View my trips</Link></div>
        </div>
      </div>
    );
  }
  if (!bookingEnabled || !offerId) {
    return (
      <div className="screen-in hh-page">{crumbs}
        <div className="hh-wrap hh-section" style={{ maxWidth: 640 }}>
          <Empty icon="plane" title="Flight booking opening soon" body="We're finishing secure flight checkout. In the meantime, enquire and our team will help you book." />
          <Link className="btn btn-primary" href="/quotes?category=travel" style={{ marginTop: 14 }}>Enquire</Link>
        </div>
      </div>
    );
  }

  const total = pb?.price ?? (price ? Number(price) : null);
  const cur = pb?.currency || currency || "USD";

  const continueToSeats = async (e: FormEvent) => {
    e.preventDefault();
    setErr(""); setPriceNote("");
    // validate document dates + contact before holding a price (empty/invalid ISO
    // must never reach the booking partner)
    for (let i = 0; i < pax.length; i++) {
      const p = pax[i];
      if (!isoDate(p.dobD, p.dobM, p.dobY)) { setErr(`Enter a valid date of birth for traveller ${i + 1}.`); return; }
      if (!isoDate(p.docExpD, p.docExpM, p.docExpY)) { setErr(`Enter a valid document expiry date for traveller ${i + 1}.`); return; }
    }
    if (!contact.phone.trim()) { setErr("Enter a contact phone number."); return; }
    setBusy("verify");
    try {
      const v = await fetch("/api/travel/flights/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ offerId }) }).then((r) => r.json()).catch(() => null);
      if (v?.ok && v.changed && v.total != null) setPriceNote(`Fare updated to ${v.currency || cur} ${Math.round(v.total)} before we hold it.`);
    } catch { /* non-blocking */ }
    try {
      setBusy("prebook");
      const passengers = pax.map((p) => ({
        firstName: p.firstName, lastName: p.lastName, birthday: isoDate(p.dobD, p.dobM, p.dobY),
        passengerType: 0, documentType: p.docType, documentNumber: p.docNumber,
        documentIssueCountry: p.docCountry, documentExpiry: isoDate(p.docExpD, p.docExpM, p.docExpY),
        gender: p.gender, nationality: p.nationality, ...(p.middleName ? { middleName: p.middleName } : {}),
      }));
      const lead = pax[0];
      const r = await fetch("/api/travel/flights/prebook", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerId, contact: { firstName: lead.firstName, lastName: lead.lastName, email: contact.email, phoneNumber: contact.phone.trim(), phoneCountryCode: contact.phoneCc }, passengers }),
      });
      const d = await r.json();
      if (!d.ok) { setErr(d.error || d.reason || "Could not start booking."); setBusy(""); return; }
      setPb(d as Prebook); setStep(2); setBusy("");
    } catch { setErr("Could not start booking."); setBusy(""); }
  };

  const stepper = (
    <ol className="flt-stepper">
      {["Passenger & Contact", "Seats & Bags", "Review & Pay"].map((s, i) => {
        const n = (i + 1) as 1 | 2 | 3;
        return <li key={s} className={`${step === n ? "on" : ""} ${step > n ? "done" : ""}`}><span className="flt-step-n">{step > n ? <Icon name="check" size={13} /> : n}</span><span className="flt-step-label">{s}</span></li>;
      })}
    </ol>
  );

  return (
    <div className="screen-in hh-page">{crumbs}
      <div className="hh-wrap hh-section">
        {stepper}
        <div className="flt-book-grid">
          <div className="flt-book-main">
            {step === 1 && (
              <form onSubmit={continueToSeats}>
                <h1 style={{ fontSize: "1.5rem", marginBottom: 4 }}>Passenger &amp; contact details</h1>
                <p className="muted" style={{ marginBottom: 16 }}>Enter details exactly as they appear on your travel document.</p>
                <div className="notice"><Icon name="info" size={16} /><span>Fields marked with <span className="req">*</span> are required. Names must match the passport exactly.</span></div>

                {pax.map((p, i) => (
                  <div key={i} className="card pax-card">
                    <h2>Traveller {i + 1} <span className="faint">· Adult</span></h2>
                    <div className="form-row-3">
                      <div className="field"><label>First name <span className="req">*</span></label><input required value={p.firstName} onChange={(e) => setP(i, "firstName", e.target.value)} /></div>
                      <div className="field"><label>Middle name</label><input placeholder="Optional" value={p.middleName} onChange={(e) => setP(i, "middleName", e.target.value)} /></div>
                      <div className="field"><label>Last name <span className="req">*</span></label><input required value={p.lastName} onChange={(e) => setP(i, "lastName", e.target.value)} /></div>
                    </div>
                    <div className="form-row">
                      <CountrySelect label="Nationality" value={p.nationality} onChange={(v) => setP(i, "nationality", v)} />
                      <div className="field"><label>Gender <span className="req">*</span></label><select value={p.gender} onChange={(e) => setP(i, "gender", e.target.value)}><option value="M">Male</option><option value="F">Female</option></select></div>
                    </div>
                    <DateField label="Date of birth" d={p.dobD} m={p.dobM} y={p.dobY} set={(k, v) => setP(i, k === "d" ? "dobD" : k === "m" ? "dobM" : "dobY", v)} />
                    <h3 className="pax-sub">Document details</h3>
                    <div className="form-row">
                      <div className="field"><label>Document type <span className="req">*</span></label><select value={p.docType} onChange={(e) => setP(i, "docType", e.target.value)}><option value="passport">Passport</option><option value="national_id">National ID</option></select></div>
                      <CountrySelect label="Issue country" value={p.docCountry} onChange={(v) => setP(i, "docCountry", v)} />
                    </div>
                    <div className="form-row">
                      <div className="field"><label>Document number <span className="req">*</span></label><input required value={p.docNumber} onChange={(e) => setP(i, "docNumber", e.target.value)} placeholder="Enter document number" /></div>
                      <DateField label="Expiry date" d={p.docExpD} m={p.docExpM} y={p.docExpY} future set={(k, v) => setP(i, k === "d" ? "docExpD" : k === "m" ? "docExpM" : "docExpY", v)} />
                    </div>
                  </div>
                ))}

                <div className="card pax-card">
                  <h2>Contact details</h2>
                  <div className="form-row">
                    <div className="field"><label>Email <span className="req">*</span></label><input required type="email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} placeholder="you@email.com" /></div>
                    <div className="field"><label>Phone <span className="req">*</span></label><div className="phone-grid"><input className="phone-cc" value={contact.phoneCc} onChange={(e) => setContact({ ...contact, phoneCc: e.target.value.replace(/\D/g, "") })} /><input value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} placeholder="Include country code" /></div></div>
                  </div>
                </div>

                {err && <p style={{ color: "var(--danger)", fontSize: ".9rem", margin: "8px 0" }}>{err}</p>}
                <div className="flt-book-foot">
                  <Link className="btn btn-soft" href="/travel/flights"><Icon name="back" size={16} /> Back to search</Link>
                  <button className="btn btn-primary btn-lg" type="submit" disabled={!!busy}>{busy === "verify" ? "Checking fare…" : busy === "prebook" ? "Holding price…" : "Continue to seats & bags"} <Icon name="chevron" size={15} /></button>
                </div>
              </form>
            )}

            {step === 2 && (
              <div>
                <h1 style={{ fontSize: "1.5rem", marginBottom: 4 }}>Seats &amp; bags</h1>
                <p className="muted" style={{ marginBottom: 16 }}>Add extras to your trip, or continue with what's included in your fare.</p>
                {services.length === 0 ? (
                  <div className="card pax-card">
                    <div className="notice"><Icon name="check" size={16} /><span>Your fare includes the standard cabin {pb?.price != null ? "" : ""}baggage. No paid extras are available to add for this fare.</span></div>
                  </div>
                ) : (
                  <div className="card pax-card"><p className="muted">Optional seats and baggage available on this fare:</p>
                    <div className="seat-bag-list">{services.map((s, i) => <div key={i} className="seat-bag"><Icon name="briefcase" size={14} /> <span>{String(s.description || s.label || s.type || "Extra")}{s.price != null ? ` · +${cur} ${Math.round(Number(s.price))}` : ""}</span></div>)}</div>
                    <p className="faint" style={{ fontSize: ".78rem", marginTop: 10 }}>You can add seats and extra bags directly with the airline after booking.</p>
                  </div>
                )}
                {err && <p style={{ color: "var(--danger)", fontSize: ".9rem", margin: "8px 0" }}>{err}</p>}
                <div className="flt-book-foot">
                  <button className="btn btn-soft" onClick={() => setStep(1)}><Icon name="back" size={16} /> Back</button>
                  <button className="btn btn-primary btn-lg" onClick={() => setStep(3)}>Continue to review &amp; pay <Icon name="chevron" size={15} /></button>
                </div>
              </div>
            )}

            {step === 3 && pb && (
              <div>
                <div className="checkout-head">
                  <h1 style={{ fontSize: "1.5rem" }}>Review &amp; pay</h1>
                  <span className="secure-pill"><Icon name="shield-check" size={13} /> Secure checkout</span>
                </div>
                <p className="muted" style={{ marginBottom: 16 }}>Pay securely with your card. You&apos;re never charged without a confirmed booking.</p>
                <div className="card pax-card">
                  <h2>Payment</h2>
                  <div className="checkout-secure">
                    <span className="cs-lead"><Icon name="shield-check" size={15} /> 256-bit encrypted payment</span>
                    <span className="card-brands"><i>VISA</i><i>Mastercard</i><i>Amex</i></span>
                  </div>
                  {countdown === 0 ? (
                    <p style={{ color: "var(--danger)", fontSize: ".9rem" }}>This held price has expired — please search again.</p>
                  ) : (
                    <div className="pay-panel">
                      <div className="pay-panel-head"><Icon name="shield-check" size={15} /> Card details <span className="pp-enc"><Icon name="check" size={12} /> Encrypted</span></div>
                      <div className="pay-panel-body">
                        <div id="liteapi-flight-payment">
                          <div className="route-loading" role="status"><span className="spinner" /> <span className="faint">Loading secure card form…</span></div>
                        </div>
                      </div>
                    </div>
                  )}
                  {err && <p style={{ color: "var(--danger)", fontSize: ".9rem", marginTop: 10 }}>{err}</p>}
                  {paymentMode === "sandbox" && countdown !== 0 && <p className="muted" style={{ fontSize: ".78rem", margin: "8px 0 0" }}>Sandbox: card 4242 4242 4242 4242, any future expiry &amp; CVV.</p>}
                  <ul className="checkout-trust">
                    <li><Icon name="check" size={15} /> No charge until your ticket is confirmed</li>
                    <li><Icon name="shield-check" size={15} /> Secure payment via our travel partner</li>
                    <li><Icon name="mail" size={15} /> E-ticket emailed the moment it&apos;s confirmed</li>
                  </ul>
                </div>
                <div className="flt-book-foot"><button className="btn btn-soft" onClick={() => { setErr(""); setStep(2); }}><Icon name="back" size={16} /> Back</button></div>
              </div>
            )}
          </div>

          <aside className="flt-book-rail">
            {step >= 2 && pb && countdown !== null && (
              <div className={`price-hold ${countdown === 0 ? "expired" : ""}`}>
                <span><Icon name="clock" size={15} /> {countdown === 0 ? "Price expired" : "Price held for…"}</span>
                <strong>{countdown === 0 ? "00:00" : `${String(Math.floor(countdown / 60)).padStart(2, "0")}:${String(countdown % 60).padStart(2, "0")}`}</strong>
              </div>
            )}
            <div className="card flt-rail-card">
              <h2>Flight details</h2>
              <div className="flt-rail-route"><strong>{from} → {to}</strong>{roundTrip && <strong>{to} → {from}</strong>}</div>
              <div className="sum-row faint"><span>Depart</span><span>{date}</span></div>
              {roundTrip && returnDate && <div className="sum-row faint"><span>Return</span><span>{returnDate}</span></div>}
              <div className="sum-row faint"><span>Travellers</span><span>{adults} adult{adults > 1 ? "s" : ""}</span></div>
            </div>
            <div className="card flt-rail-card">
              <h2>Price breakdown</h2>
              <div className="sum-row"><span>Fare ({adults} adult{adults > 1 ? "s" : ""})</span><span>{total != null ? `${cur} ${Math.round(total)}` : "—"}</span></div>
              <div className="sum-row faint"><span>Taxes &amp; fees</span><span>Included</span></div>
              {priceNote && <p className="faint" style={{ fontSize: ".78rem", margin: "6px 0 0" }}>{priceNote}</p>}
              <div className="sum-row total"><span>Total</span><span>{total != null ? `${cur} ${Math.round(total)}` : "—"}</span></div>
              <PromoCode amount={total} currency={cur} />
              <RewardsNote amount={total} currency={cur} />
            </div>
            <div className="card flt-rail-card why-book">
              <h2>Why book with us</h2>
              <ul>
                <li><Icon name="shield-check" size={15} /> Secure payment via our travel partner</li>
                <li><Icon name="moon" size={15} /> Halal-friendly trip planning</li>
                <li><Icon name="mail" size={15} /> Email support from our team</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export function FlightConfirmationScreen({ reference, status, from, to, date }: { reference?: string; status?: string; from?: string; to?: string; date?: string }) {
  const confirming = status === "confirming";
  return (
    <div className="screen-in hh-page">
      <div className="hh-wrap hh-section" style={{ maxWidth: 620, textAlign: "center" }}>
        <div className="empty-ico" style={{ margin: "0 auto", background: confirming ? "var(--gold-50)" : "var(--emerald-50)", color: confirming ? "var(--gold-700)" : "var(--emerald)" }}><Icon name={confirming ? "clock" : "check"} size={30} /></div>
        <h1 style={{ fontSize: "1.7rem", marginTop: 16 }}>{confirming ? "Payment received — confirming your flight" : "Flight booked"}</h1>
        <p className="muted" style={{ marginTop: 8 }}>{confirming ? "Your payment went through and we're finalising your ticket with the airline. You'll get an email shortly — no need to pay again." : <>Your flight {from && to ? <>{from} → {to}</> : null}{date ? `, ${date}` : ""} is confirmed. Your e-ticket has been emailed.</>}</p>
        {reference && <div className="card" style={{ padding: 18, margin: "20px auto", maxWidth: 360, textAlign: "left" }}><div className="sum-row"><span className="muted">Booking ref</span><strong className="kbd-mono">{reference}</strong></div></div>}
        <div className="flex g10 center" style={{ justifyContent: "center" }}>
          <Link className="btn btn-primary" href="/travel/trips">View my trips</Link>
          <Link className="btn btn-soft" href="/travel/flights">Back to flights</Link>
        </div>

        <Link href="/travel" className="hotel-cta" style={{ marginTop: 26, textAlign: "left" }}>
          <span className="hcta-ico"><Icon name="bed" size={20} /></span>
          <span className="hcta-text"><strong>Now find your stay</strong> — book a Muslim-friendly hotel{to ? ` in ${to}` : ""} with prayer rooms and halal dining nearby.</span>
          <span className="hcta-go">Find a stay <Icon name="arrow" size={15} /></span>
        </Link>

        <div className="travel-dua">
          <p className="travel-dua-ar" lang="ar" dir="rtl">سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَٰذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ</p>
          <p className="travel-dua-tr">Subḥāna-lladhī sakhkhara lanā hādhā wa mā kunnā lahu muqrinīn</p>
          <p className="travel-dua-en">“Glory to Him who has subjected this to us, and we could never have done it by ourselves.” — the du‘ā for travel. Safe travels, and consider a Sadaqah for a blessed journey.</p>
        </div>
      </div>
    </div>
  );
}
