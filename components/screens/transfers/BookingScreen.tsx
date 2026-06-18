"use client";
import { useState } from "react";

export interface TransferBookingProps {
  searchId: string;
  resultId: string;
  vehicleClass: string;
  total: string;
  currency: string;
  pickup: string;
  dropoff: string;
  pickupDateTime: string;
  passengers: number;
  bookingEnabled: boolean;
}

/* Contact details → create the Mozio reservation → redirect to Mozio's payment
   page (Mozio-collects; we never touch the card). Mirrors the flights booking flow. */
export default function TransferBookingScreen(props: TransferBookingProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ready = props.bookingEnabled && props.searchId && props.resultId;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true); setError(null);
    try {
      const r = await fetch("/api/travel/transfers/book", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({
          searchId: props.searchId, resultId: props.resultId,
          contact: { firstName, lastName, email, phone },
          passengers: props.passengers, currency: props.currency,
          total: props.total, vehicleClass: props.vehicleClass,
          pickup: props.pickup, dropoff: props.dropoff, pickupDateTime: props.pickupDateTime,
        }),
      });
      const d = await r.json();
      if (!d.ok) { setError(d.reason === "transfer_booking_disabled" ? "Booking isn't available yet." : (d.error || "Could not start booking.")); return; }
      if (d.paymentUrl) { window.location.href = d.paymentUrl; return; }
      setError("Booking is not available yet.");
    } catch { setError("Network error — please try again."); } finally { setSubmitting(false); }
  }

  return (
    <section className="transfers-screen" style={{ maxWidth: 640, margin: "0 auto", padding: "24px 16px" }}>
      <h1>Complete your transfer</h1>
      <p className="ota-muted">{props.vehicleClass} · {props.pickup} → {props.dropoff} · {props.currency} {props.total}</p>

      {!props.bookingEnabled && <p role="alert" className="ota-muted" data-testid="transfer-booking-disabled">Transfer booking isn’t available yet — check back soon.</p>}

      <form data-testid="transfer-booking-form" onSubmit={submit} style={{ display: "grid", gap: 10, margin: "16px 0" }}>
        <input aria-label="First name" placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
        <input aria-label="Last name" placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
        <input aria-label="Email" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input aria-label="Phone" type="tel" placeholder="Phone (with country code)" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        <button type="submit" disabled={!ready || submitting}>{submitting ? "Starting…" : "Continue to payment"}</button>
      </form>

      {error && <p role="alert" className="ota-muted">{error}</p>}
    </section>
  );
}
