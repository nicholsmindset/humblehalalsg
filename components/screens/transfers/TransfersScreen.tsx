"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { TransferQuote } from "@/lib/mozio-types";

/* Standalone transfers search → quotes. Mirrors the flights screen flow. The
   Book CTA only navigates when bookingEnabled (server flag). No halal claims. */
export default function TransfersScreen({ bookingEnabled }: { bookingEnabled: boolean }) {
  const router = useRouter();
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [datetime, setDatetime] = useState("");
  const [passengers, setPassengers] = useState(2);
  const [quotes, setQuotes] = useState<TransferQuote[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null); setQuotes(null);
    try {
      const r = await fetch("/api/travel/transfers/search", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ pickup, dropoff, pickupDateTime: datetime, passengers }),
      });
      const d = await r.json();
      if (!d.ok) { setError(d.error || "Search failed"); return; }
      setQuotes((d.quotes || []) as TransferQuote[]);
    } catch { setError("Network error — please try again."); } finally { setLoading(false); }
  }

  function book(q: TransferQuote) {
    if (!bookingEnabled) return;
    const p = new URLSearchParams({
      searchId: q.searchId, resultId: q.resultId, vehicleClass: q.vehicleClass,
      total: String(q.price), currency: q.currency, pickup, dropoff,
      pickupDateTime: datetime, passengers: String(passengers),
    });
    router.push(`/travel/transfers/booking?${p.toString()}`);
  }

  return (
    <section className="transfers-screen" style={{ maxWidth: 880, margin: "0 auto", padding: "24px 16px" }}>
      <h1>Airport transfers</h1>
      <p className="ota-muted">Private door-to-door rides worldwide — fixed price, free cancellation on most.</p>

      <form data-testid="transfer-search-form" onSubmit={search} className="transfers-form" style={{ display: "grid", gap: 10, margin: "16px 0" }}>
        <input data-testid="transfer-pickup" aria-label="Pickup" placeholder="Pickup (airport or address)" value={pickup} onChange={(e) => setPickup(e.target.value)} required />
        <input data-testid="transfer-dropoff" aria-label="Drop-off" placeholder="Drop-off (hotel or address)" value={dropoff} onChange={(e) => setDropoff(e.target.value)} required />
        <input data-testid="transfer-datetime" aria-label="Pickup date and time" type="datetime-local" value={datetime} onChange={(e) => setDatetime(e.target.value)} required />
        <label>Passengers <input aria-label="Passengers" type="number" min={1} max={16} value={passengers} onChange={(e) => setPassengers(Number(e.target.value) || 1)} /></label>
        <button data-testid="transfer-search-submit" type="submit" disabled={loading}>{loading ? "Searching…" : "Search transfers"}</button>
      </form>

      {error && <p role="alert" className="ota-muted">{error}</p>}

      {quotes && (
        <ul className="transfers-results" style={{ listStyle: "none", padding: 0, display: "grid", gap: 10 }}>
          {quotes.map((q) => (
            <li key={q.resultId} data-testid="transfer-quote" className="transfers-card" style={{ display: "flex", justifyContent: "space-between", gap: 12, border: "1px solid #e5e7eb", borderRadius: 12, padding: 14 }}>
              <div>
                <strong>{q.vehicleClass}</strong> · up to {q.seats} seats · {q.provider}
                {q.cancellationTerms && <div className="ota-muted">{q.cancellationTerms}</div>}
              </div>
              <div style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                <div className="transfers-price" style={{ fontWeight: 700 }}>{q.currency} {q.price}</div>
                <button onClick={() => book(q)} disabled={!bookingEnabled} title={bookingEnabled ? "" : "Booking coming soon"}>
                  {bookingEnabled ? "Book" : "Coming soon"}
                </button>
              </div>
            </li>
          ))}
          {quotes.length === 0 && <li className="ota-muted">No transfers found for this route.</li>}
        </ul>
      )}
    </section>
  );
}
