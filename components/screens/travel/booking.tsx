"use client";

/* Humble Halal — booking flow (prebook → guest → payment → book), confirmation
   and my-trips. Booking is gated by PAID_HOTELS_ENABLED; the prebook/book flow,
   LiteAPI payment mount and flag gating are unchanged from the original. */
import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { Icon, Empty, RewardsNote, PromoCode } from "../../ui";
import { Crumbs } from "./shared";
import type { Prebook, TripBooking } from "./types";

declare global {
  interface Window {
    LiteAPIPayment?: new (cfg: Record<string, unknown>) => { handlePayment?: () => void; mountPaymentForm?: () => void };
  }
}

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

export function TravelBookingScreen({ offerId, hotelId, hotelName, city, bookingEnabled }: { offerId: string; hotelId: string; hotelName: string; city: string; bookingEnabled: boolean }) {
  const [pb, setPb] = useState<Prebook | null>(null);
  const [stage, setStage] = useState<"loading" | "details" | "paying" | "error">("loading");
  const [err, setErr] = useState("");
  const [holder, setHolder] = useState({ firstName: "", lastName: "", email: "", phone: "" });
  const [booking, setBooking] = useState(false);
  const payRef = useRef<HTMLDivElement>(null);
  const publicKey = process.env.NEXT_PUBLIC_LITEAPI_PUBLIC_KEY;

  useEffect(() => {
    let on = true;
    (async () => {
      if (!bookingEnabled || !offerId) {
        if (on) { setStage("error"); setErr(bookingEnabled ? "Missing offer." : "Online booking isn't enabled yet."); }
        return;
      }
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
  }, [offerId, bookingEnabled]);

  const total = pb?.sellingPrice ?? pb?.price ?? null;

  const confirm = async (e: FormEvent) => {
    e.preventDefault();
    if (!pb) return;
    setBooking(true);
    setErr("");
    try {
      const res = await fetch("/api/travel/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prebookId: pb.prebookId,
          transactionId: pb.transactionId,
          holder,
          guests: [{ occupancyNumber: 1, ...holder }],
          hotelName, city, liteapiHotelId: hotelId,
          currency: pb.currency, retailTotal: total, commissionAmount: pb.commission,
        }),
      });
      const d = await res.json();
      if (!d.ok) { setErr(d.error || "Payment/booking failed."); setBooking(false); return; }
      const p = new URLSearchParams({ ref: String(d.bookingId || ""), code: String(d.confirmationCode || ""), hotel: hotelName, city });
      window.location.href = `/travel/booking/confirmation?${p.toString()}`;
    } catch { setErr("Payment/booking failed."); setBooking(false); }
  };

  const stepStage = stage === "loading" ? "rate" : stage === "details" || stage === "paying" ? "details" : "rate";

  return (
    <div className="screen-in hh-page">
      <Crumbs trail={[{ label: "Home", href: "/" }, { label: "Travel", href: "/travel" }, { label: "Book" }]} />
      <div className="hh-wrap hh-section booking-wrap">
        <h1 style={{ fontSize: "1.6rem", marginBottom: 4 }}>Complete your booking</h1>
        <p className="muted" style={{ marginBottom: 22 }}>{hotelName}{city ? ` · ${city}` : ""}</p>

        {stage !== "error" && <BookingStepper stage={stepStage} />}

        {stage === "loading" && <div className="route-loading" role="status"><span className="spinner" /> <span className="faint">Confirming your rate…</span></div>}
        {stage === "error" && <Empty icon="alert" title="Couldn't start booking" body={err || "Please try another room or dates."} />}

        {(stage === "details" || stage === "paying") && pb && (
          <div className="booking-grid">
            <form className="booking-form card" style={{ padding: 20 }} onSubmit={confirm}>
              <h2 style={{ fontSize: "1.1rem", marginBottom: 14 }}>Guest details</h2>
              <div className="form-row">
                <div className="field"><label>First name</label><input required value={holder.firstName} onChange={(e) => setHolder({ ...holder, firstName: e.target.value })} /></div>
                <div className="field"><label>Last name</label><input required value={holder.lastName} onChange={(e) => setHolder({ ...holder, lastName: e.target.value })} /></div>
              </div>
              <div className="form-row">
                <div className="field"><label>Email</label><input required type="email" value={holder.email} onChange={(e) => setHolder({ ...holder, email: e.target.value })} /></div>
                <div className="field"><label>Phone</label><input value={holder.phone} onChange={(e) => setHolder({ ...holder, phone: e.target.value })} /></div>
              </div>

              <h2 style={{ fontSize: "1.1rem", margin: "18px 0 12px" }}>Payment</h2>
              {publicKey ? (
                <div id="liteapi-payment" ref={payRef} className="pay-mount">
                  <p className="muted" style={{ fontSize: ".86rem" }}>Secure card payment by LiteAPI.</p>
                </div>
              ) : (
                <div className="notice notice-warn" style={{ marginBottom: 14 }}>
                  <Icon name="info" size={16} />
                  <span>Sandbox test mode — use the button below to complete a test booking (no card needed). Add <code>NEXT_PUBLIC_LITEAPI_PUBLIC_KEY</code> to enable the live card form.</span>
                </div>
              )}
              {err && <p style={{ color: "var(--danger)", fontSize: ".9rem", marginBottom: 10 }}>{err}</p>}
              <button className="btn btn-primary btn-block btn-lg" type="submit" disabled={booking}>
                {booking ? "Confirming…" : total != null ? `Pay ${pb.currency} ${Math.round(total)} & confirm` : "Confirm booking"}
              </button>
              <p className="muted" style={{ fontSize: ".78rem", marginTop: 10, textAlign: "center" }}>You won&apos;t be charged until your booking is confirmed.</p>
            </form>

            <aside className="card booking-summary" style={{ padding: 18 }}>
              <h2 style={{ fontSize: "1.05rem", marginBottom: 12 }}>Price summary</h2>
              <div className="sum-row"><span>Room total</span><span>{pb.currency} {Math.round(pb.price ?? total ?? 0)}</span></div>
              {pb.commission != null && <div className="sum-row faint"><span>Incl. our service</span><span>{pb.currency} {Math.round(pb.commission)}</span></div>}
              <div className="sum-row total"><span>Total</span><span>{pb.currency} {Math.round(total ?? 0)}</span></div>
              <PromoCode amount={total} currency={pb.currency} />
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
