"use client";

/* Humble Halal — booking flow (prebook → guest → payment → book), confirmation
   and my-trips. Booking is gated by PAID_HOTELS_ENABLED; the prebook/book flow,
   LiteAPI payment mount and flag gating are unchanged from the original. */
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { Icon, Empty, RewardsNote, PromoCode } from "../../ui";
import { Crumbs } from "./shared";
import { launchLiteApiPayment } from "@/lib/liteapi-payment-client";
import type { Prebook, TripBooking } from "./types";

/* ── booking ─────────────────────────────────────────────────────────────── */

function BookingStepper({ stage }: { stage: "rate" | "details" | "payment" }) {
  const steps: [string, string][] = [["rate", "Rate confirmed"], ["details", "Guest details"], ["payment", "Payment"]];
  const order = steps.map((s) => s[0]);
  const idx = order.indexOf(stage);
  return (
    <ol className="flt-stepper" aria-label="Booking progress">
      {steps.map(([id, label], i) => (
        <li key={id} className={i < idx ? "done" : i === idx ? "on" : ""}>
          <span className="flt-step-n">{i < idx ? <Icon name="check" size={15} /> : i + 1}</span>
          <span className="flt-step-label">{label}</span>
        </li>
      ))}
    </ol>
  );
}

export function TravelBookingScreen({ offerId, hotelId, hotelName, city, bookingEnabled, paymentMode }: { offerId: string; hotelId: string; hotelName: string; city: string; bookingEnabled: boolean; paymentMode: "sandbox" | "live" }) {
  const [pb, setPb] = useState<Prebook | null>(null);
  const [stage, setStage] = useState<"loading" | "details" | "paying" | "returning" | "followup" | "error">("loading");
  const [err, setErr] = useState("");
  const [holder, setHolder] = useState({ firstName: "", lastName: "", email: "", phone: "" });
  const [promoBusy, setPromoBusy] = useState(false);
  const [cardMounted, setCardMounted] = useState(false);

  // On mount: detect a payment RETURN (?paid=1&pid&tid) and finalise the booking;
  // otherwise open the prebook (confirm rate + open the payment intent).
  useEffect(() => {
    let on = true;
    const sp = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const pid = sp?.get("pid"); const tid = sp?.get("tid"); const paid = sp?.get("paid");
    if (paid && pid && tid) {
      setStage("returning");
      (async () => {
        try {
          const raw = sessionStorage.getItem("hh_hotel_book_" + pid);
          const ctx = raw ? JSON.parse(raw) : {};
          const res = await fetch("/api/travel/book", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prebookId: pid, transactionId: tid, ...ctx }) });
          const d = await res.json();
          if (!on) return;
          if (d.ok) {
            sessionStorage.removeItem("hh_hotel_book_" + pid);
            const p = new URLSearchParams({ ref: String(d.bookingId || ""), code: String(d.confirmationCode || ""), hotel: String(ctx.hotelName || hotelName || ""), city: String(ctx.city || city || "") });
            window.location.href = `/travel/booking/confirmation?${p.toString()}`;
          } else {
            // The card is already charged — NEVER surface a payment error. Reassure + email follow-up.
            setStage("followup");
          }
        } catch { if (on) setStage("followup"); }
      })();
      return () => { on = false; };
    }
    if (!bookingEnabled || !offerId) {
      setStage("error"); setErr(bookingEnabled ? "Missing offer." : "Online booking isn't enabled yet.");
      return () => { on = false; };
    }
    (async () => {
      try {
        const res = await fetch("/api/travel/prebook", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ offerId }) });
        const d = await res.json();
        if (!on) return;
        if (!d.ok) { setStage("error"); setErr(d.error || d.reason || "Could not start booking."); return; }
        setPb(d as Prebook);
        setStage("details");
      } catch { if (on) { setStage("error"); setErr("Could not start booking."); } }
    })();
    return () => { on = false; };
  }, [offerId, bookingEnabled, hotelName, city]);

  // Applying a promo MUST re-prebook with the voucher: that's what produces a fresh
  // payment intent (transactionId) and prebookId for the *discounted* total, so the
  // amount charged matches what the guest sees. Validation already happened in PromoCode.
  const applyPromo = async (codeRaw: string) => {
    const code = (codeRaw || "").trim().toUpperCase();
    if (!code || promoBusy || !pb) return;
    setPromoBusy(true); setErr("");
    try {
      const res = await fetch("/api/travel/prebook", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ offerId, voucherCode: code }) });
      const d = await res.json();
      if (!d.ok) { setErr(d.error || "That promo code couldn't be applied to this rate."); }
      else { setPb(d as Prebook); if (!d.voucherCode) setErr("That code isn't valid for this rate."); }
    } catch { setErr("Couldn't apply that promo code."); }
    setPromoBusy(false);
  };

  const total = pb?.sellingPrice ?? pb?.price ?? null;

  // Details submitted → persist the booking context (the SDK redirect leaves this
  // page, so we re-read it on return) and hand off to the hosted card form.
  const goToPayment = (e: FormEvent) => {
    e.preventDefault();
    if (!pb) return;
    const ctx = {
      holder,
      guests: [{ occupancyNumber: 1, ...holder }],
      hotelName, city, liteapiHotelId: hotelId,
      currency: pb.currency, retailTotal: total, commissionAmount: pb.commission,
      ...(pb.voucherCode ? { voucherCode: pb.voucherCode, discountAmount: pb.discount ?? null } : {}),
    };
    try { sessionStorage.setItem("hh_hotel_book_" + pb.prebookId, JSON.stringify(ctx)); } catch { /* private mode */ }
    setErr("");
    setStage("paying");
  };

  // When the payment step opens, mount the hosted LiteAPI card form. It charges the
  // card then redirects to returnUrl (?paid=1), where the mount effect above books.
  useEffect(() => {
    if (stage !== "paying" || !pb) return;
    if (!pb.secretKey) { setErr("Secure payment isn't available for this rate — please try another."); return; }
    setCardMounted(false);
    let cancelled = false;
    // Hide our loading note the moment the SDK injects its hosted form (otherwise the
    // placeholder + the iframe both render → a tall empty gap).
    const target = document.getElementById("liteapi-payment");
    const obs = target ? new MutationObserver((_m, observer) => { if (target.childElementCount > 0) { setCardMounted(true); observer.disconnect(); } }) : null;
    if (target && obs) obs.observe(target, { childList: true, subtree: true });
    (async () => {
      try {
        await launchLiteApiPayment({
          mode: paymentMode,
          secretKey: pb.secretKey!,
          targetSelector: "#liteapi-payment",
          returnUrl: `${window.location.origin}/travel/booking?tid=${encodeURIComponent(pb.transactionId || "")}&pid=${encodeURIComponent(pb.prebookId)}&paid=1`,
        });
      } catch { if (!cancelled) setErr("Couldn't load secure payment. Please refresh and try again."); }
    })();
    return () => { cancelled = true; obs?.disconnect(); };
  }, [stage, pb, paymentMode]);

  const stepStage = stage === "paying" ? "payment" : stage === "loading" || stage === "returning" ? "rate" : "details";

  return (
    <div className="screen-in hh-page">
      <Crumbs trail={[{ label: "Home", href: "/" }, { label: "Travel", href: "/travel" }, { label: "Book" }]} />
      <div className="hh-wrap hh-section booking-wrap">
        <div className="checkout-head">
          <h1 style={{ fontSize: "1.6rem" }}>Complete your booking</h1>
          <span className="secure-pill"><Icon name="shield-check" size={13} /> Secure checkout</span>
        </div>
        <p className="muted" style={{ marginBottom: 22 }}>{hotelName}{city ? ` · ${city}` : ""}</p>

        {stage !== "error" && stage !== "followup" && <BookingStepper stage={stepStage} />}

        {(stage === "loading" || stage === "returning") && <div className="route-loading" role="status"><span className="spinner" /> <span className="faint">{stage === "returning" ? "Confirming your booking…" : "Confirming your rate…"}</span></div>}
        {stage === "error" && <Empty icon="alert" title="Couldn't start booking" body={err || "Please try another room or dates."} />}
        {stage === "followup" && (
          <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
            <div className="empty-ico" style={{ margin: "0 auto", background: "var(--gold-50, #fff7ed)", color: "var(--gold-700, #b45309)" }}><Icon name="clock" size={28} /></div>
            <h2 style={{ marginTop: 14, fontSize: "1.3rem" }}>Payment received — confirming your stay</h2>
            <p className="muted" style={{ marginTop: 8 }}>Your payment went through and we&apos;re finalising your booking with the hotel. You&apos;ll get a confirmation email shortly — there&apos;s no need to pay again. If you don&apos;t hear from us within a few hours, please contact support.</p>
            <div className="flex g10 center" style={{ justifyContent: "center", marginTop: 16 }}><Link className="btn btn-primary" href="/travel/trips">View my trips</Link></div>
          </div>
        )}

        {(stage === "details" || stage === "paying") && pb && (
          <div className="booking-grid">
            {stage === "details" ? (
              <form className="booking-form card" style={{ padding: 20 }} onSubmit={goToPayment}>
                <h2 style={{ fontSize: "1.1rem", marginBottom: 14 }}>Guest details</h2>
                <div className="form-row">
                  <div className="field"><label>First name</label><input required value={holder.firstName} onChange={(e) => setHolder({ ...holder, firstName: e.target.value })} placeholder="As on your passport / ID" /></div>
                  <div className="field"><label>Last name</label><input required value={holder.lastName} onChange={(e) => setHolder({ ...holder, lastName: e.target.value })} placeholder="As on your passport / ID" /></div>
                </div>
                <div className="form-row">
                  <div className="field"><label>Email</label><input required type="email" value={holder.email} onChange={(e) => setHolder({ ...holder, email: e.target.value })} placeholder="you@email.com" /></div>
                  <div className="field"><label>Phone</label><input type="tel" inputMode="tel" value={holder.phone} onChange={(e) => setHolder({ ...holder, phone: e.target.value })} placeholder="+65 9123 4567" /></div>
                </div>
                {err && <p style={{ color: "var(--danger)", fontSize: ".9rem", margin: "10px 0" }}>{err}</p>}
                <button className="btn btn-primary btn-block btn-lg" type="submit" disabled={promoBusy}>
                  {promoBusy ? "Updating price…" : "Continue to secure payment"}
                </button>
                <p className="muted" style={{ fontSize: ".78rem", marginTop: 10, textAlign: "center" }}>You won&apos;t be charged until you complete payment on the next step.</p>
              </form>
            ) : (
              <div className="booking-form card" style={{ padding: 20 }}>
                <h2 style={{ fontSize: "1.1rem", marginBottom: 12 }}>Payment</h2>
                <div className="checkout-secure">
                  <span className="cs-lead"><Icon name="shield-check" size={15} /> 256-bit encrypted payment</span>
                  <span className="card-brands"><i>VISA</i><i>Mastercard</i><i>Amex</i></span>
                </div>
                <div className="pay-panel">
                  <div className="pay-panel-head"><Icon name="shield-check" size={15} /> Card details <span className="pp-enc"><Icon name="check" size={12} /> Encrypted</span></div>
                  <div className="pay-panel-body">
                    {!cardMounted && <div className="route-loading" role="status"><span className="spinner" /> <span className="faint">Loading secure card form…</span></div>}
                    <div id="liteapi-payment" />
                  </div>
                </div>
                <p className="muted" style={{ fontSize: ".78rem", margin: "8px 0 0" }}>Booking as {holder.firstName} {holder.lastName} · {holder.email}{paymentMode === "sandbox" ? " · Sandbox: card 4242 4242 4242 4242" : ""}</p>
                {err && <p style={{ color: "var(--danger)", fontSize: ".9rem", marginTop: 12 }}>{err}</p>}
                <ul className="checkout-trust">
                  <li><Icon name="check" size={15} /> No charge until your booking is confirmed</li>
                  <li><Icon name="shield-check" size={15} /> Payment handled securely by LiteAPI</li>
                  <li><Icon name="badge-check" size={15} /> Free cancellation where the rate allows</li>
                </ul>
                <button type="button" className="btn btn-soft btn-sm" style={{ marginTop: 16 }} onClick={() => { setErr(""); setStage("details"); }}><Icon name="back" size={14} /> Edit details</button>
              </div>
            )}

            <aside className="card booking-summary" style={{ padding: 18 }}>
              <h2 style={{ fontSize: "1.05rem", marginBottom: 12 }}>Price summary</h2>
              <div className="sum-row"><span>Room total</span><span>{pb.currency} {Math.round((pb.price ?? total ?? 0) + (pb.discount ?? 0))}</span></div>
              {pb.commission != null && <div className="sum-row faint"><span>Incl. our service</span><span>{pb.currency} {Math.round(pb.commission)}</span></div>}
              {pb.discount ? <div className="sum-row" style={{ color: "var(--emerald)" }}><span>Promo {pb.voucherCode}</span><span>−{pb.currency} {Math.round(pb.discount)}</span></div> : null}
              <div className="sum-row total"><span>Total</span><span>{pb.currency} {Math.round(total ?? 0)}</span></div>
              {stage === "details" ? <PromoCode amount={total} currency={pb.currency} onApply={applyPromo} /> : null}
              <RewardsNote amount={total} currency={pb.currency} />
              <p className="muted" style={{ fontSize: ".78rem", marginTop: 12 }}>Booking handled securely by LiteAPI. Free cancellation where the rate allows.</p>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── confirmation ────────────────────────────────────────────────────────── */

export function TravelConfirmationScreen({ reference, code, hotel, city }: { reference?: string; code?: string; hotel?: string; city?: string }) {
  return (
    <div className="screen-in hh-page">
      <div className="hh-wrap hh-section" style={{ maxWidth: 620, textAlign: "center" }}>
        <div className="empty-ico" style={{ margin: "0 auto", background: "var(--emerald-50)", color: "var(--emerald)" }}><Icon name="check" size={30} /></div>
        <h1 style={{ fontSize: "1.7rem", marginTop: 16 }}>Booking confirmed</h1>
        <p className="muted" style={{ marginTop: 8 }}>{hotel ? <>Your stay at <strong>{hotel}</strong>{city ? `, ${city}` : ""} is confirmed.</> : "Your stay is confirmed."} A voucher has been sent to your email.</p>
        {(reference || code) && (
          <div className="card" style={{ padding: 18, margin: "20px auto", maxWidth: 360, textAlign: "left" }}>
            {reference && <div className="sum-row"><span className="muted">Booking ref</span><strong className="kbd-mono">{reference}</strong></div>}
            {code && <div className="sum-row"><span className="muted">Hotel confirmation</span><strong className="kbd-mono">{code}</strong></div>}
          </div>
        )}
        <div className="flex g10 center" style={{ justifyContent: "center" }}>
          <Link className="btn btn-primary" href="/travel/trips">View my trips</Link>
          <Link className="btn btn-soft" href="/travel">Back to travel</Link>
        </div>
      </div>
    </div>
  );
}

/* ── my trips (auth-gated) ───────────────────────────────────────────────── */

export function TravelTripsScreen({ loggedIn, bookings }: { loggedIn: boolean; bookings: TripBooking[] }) {
  const [items, setItems] = useState(bookings);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const cancel = async (id: string) => {
    if (!window.confirm("Cancel this booking? The hotel's cancellation policy applies.")) return;
    setBusy(id);
    setErr("");
    try {
      const r = await fetch("/api/travel/cancel", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      const d = await r.json();
      if (d.ok) setItems((xs) => xs.map((b) => (b.id === id ? { ...b, status: d.status || "cancelled" } : b)));
      else setErr(d.error || "Could not cancel.");
    } catch {
      setErr("Could not cancel.");
    }
    setBusy(null);
  };
  const amend = async (id: string) => {
    const name = typeof window !== "undefined" ? window.prompt("Correct the lead guest name (First Last) exactly as on their ID:") : "";
    if (!name || !name.trim().includes(" ")) { if (name != null) setErr("Enter the full name as First Last."); return; }
    const [firstName, ...rest] = name.trim().split(/\s+/);
    setBusy(id); setErr("");
    try {
      const r = await fetch("/api/travel/amend", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, firstName, lastName: rest.join(" ") }) });
      const d = await r.json();
      if (!d.ok) setErr(d.error || "Could not update the name.");
      else { setErr(""); if (typeof window !== "undefined") window.alert("Name updated on this booking."); }
    } catch { setErr("Could not update the name."); }
    setBusy(null);
  };

  return (
    <div className="screen-in hh-page">
      <Crumbs trail={[{ label: "Home", href: "/" }, { label: "Travel", href: "/travel" }, { label: "My trips" }]} />
      <div className="hh-wrap hh-section" style={{ maxWidth: 760 }}>
        <h1 style={{ fontSize: "1.6rem", marginBottom: 14 }}>My trips</h1>
        {!loggedIn ? (
          <Empty icon="user" title="Log in to see your trips" body="Your hotel bookings appear here when you're signed in." />
        ) : items.length === 0 ? (
          <Empty icon="bed" title="No bookings yet" body="When you book a halal-friendly stay, it'll show up here." />
        ) : (
          <>
            {err && <p style={{ color: "var(--danger)", fontSize: ".9rem", marginBottom: 10 }}>{err}</p>}
            <div className="trip-list">
              {items.map((b) => (
                <div key={b.id} className={`trip-card ${b.status !== "confirmed" ? "inactive" : ""}`}>
                  <div className="trip-main">
                    <div className="trip-hotel">{b.liteapi_hotel_id ? <Link href={`/travel/hotel/${b.liteapi_hotel_id}`}>{b.hotel_name || "Hotel"}</Link> : b.hotel_name || "Hotel"}</div>
                    <div className="trip-meta">{[b.city, b.checkin && b.checkout ? `${b.checkin} → ${b.checkout}` : null].filter(Boolean).join(" · ")}</div>
                    <div className="trip-tags">
                      <span className={`trip-status ${b.status}`}>{b.status}</span>
                      {b.hotel_confirmation_code ? <span className="kbd-mono trip-ref">{b.hotel_confirmation_code}</span> : null}
                    </div>
                  </div>
                  <div className="trip-side">
                    {b.retail_total != null ? <div className="trip-total">{b.currency || ""} {Math.round(Number(b.retail_total))}</div> : null}
                    {b.status === "confirmed" && (
                      <div className="trip-actions">
                        <button className="btn btn-ghost btn-sm" disabled={busy === b.id} onClick={() => amend(b.id)}>Edit name</button>
                        <button className="btn btn-ghost btn-sm" disabled={busy === b.id} onClick={() => cancel(b.id)}>{busy === b.id ? "Working…" : "Cancel"}</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
