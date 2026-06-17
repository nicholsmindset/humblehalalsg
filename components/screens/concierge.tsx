"use client";

/* Humble Halal — AI concierge / natural-language halal search.
   Calls /api/concierge (grounded in the directory; never fabricates halal
   status). Degrades to keyword results when no AI key is configured. */
import { useState } from "react";
import type { Listing } from "@/lib/types";
import type { Hotel } from "@/lib/halal-hotels";
import { ListingCard, Icon, SearchBar } from "../ui";
import { RatingBadge } from "../ota";

const EXAMPLES = [
  "MUIS-certified nasi padang near Tampines with prayer space",
  "Halal brunch cafés in Bugis",
  "Muslim-owned salon for a bride in Geylang Serai",
  "Family-friendly biryani with delivery",
];

export function ConciergeScreen() {
  const [q, setQ] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [results, setResults] = useState<Listing[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(false);
  const [asked, setAsked] = useState(false);

  const ask = async (question?: string) => {
    const query = (question ?? q).trim();
    if (query.length < 2) return;
    if (question) setQ(question);
    setLoading(true);
    setAsked(true);
    try {
      const r = await fetch("/api/concierge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const d = await r.json();
      setAnswer(typeof d.answer === "string" ? d.answer : null);
      setResults(Array.isArray(d.results) ? d.results : []);
      setHotels(Array.isArray(d.hotels) ? d.hotels : []);
    } catch {
      setAnswer("Something went wrong — please try again.");
      setResults([]);
      setHotels([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="screen-in hh-page">
      <div className="hh-wrap" style={{ paddingTop: 28, paddingBottom: 16, maxWidth: 760 }}>
        <span className="eyebrow" style={{ color: "var(--emerald)" }}>Halal concierge</span>
        <h1 style={{ fontSize: "2rem", margin: "8px 0 6px" }}>Ask for exactly what you want</h1>
        <p className="faint" style={{ fontSize: ".95rem", marginBottom: 16 }}>
          Describe the place you’re after — area, cuisine, prayer space, halal status — in plain words.
        </p>

        <SearchBar value={q} onChange={setQ} onSubmit={(v: string) => ask(v)} placeholder="e.g. MUIS-certified nasi padang near Tampines with prayer space" />

        {!asked && (
          <div className="flex g8 wrap" style={{ marginTop: 14 }}>
            {EXAMPLES.map((ex) => (
              <button key={ex} className="chip" onClick={() => ask(ex)}>{ex}</button>
            ))}
          </div>
        )}

        {loading && (
          <div className="card" style={{ marginTop: 18, padding: 18, height: 70, opacity: 0.5 }} aria-busy="true" />
        )}

        {!loading && answer && (
          <div className="card" style={{ marginTop: 18, padding: "16px 18px", background: "var(--emerald-50)", display: "flex", gap: 12 }}>
            <Icon name="crescent" size={20} style={{ color: "var(--emerald)", flex: "none", marginTop: 2 }} />
            <p style={{ fontSize: ".95rem", lineHeight: 1.55 }}>{answer}</p>
          </div>
        )}
      </div>

      {!loading && results.length > 0 && (
        <div className="hh-wrap" style={{ paddingBottom: hotels.length ? 24 : 40 }}>
          <div className="grid-cards">
            {results.map((l) => <ListingCard key={l.id} item={l} />)}
          </div>
          <p className="faint" style={{ fontSize: ".78rem", marginTop: 16, textAlign: "center" }}>
            Always confirm halal certification on the official MUIS HalalSG register.
          </p>
        </div>
      )}

      {!loading && hotels.length > 0 && (
        <div className="hh-wrap" style={{ paddingBottom: 40 }}>
          <h2 style={{ fontSize: "1.1rem", margin: "8px 0 4px", display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="moon" size={18} style={{ color: "var(--emerald)" }} /> Muslim-friendly stays
          </h2>
          <p className="faint" style={{ fontSize: ".82rem", marginBottom: 12 }}>
            We surface the facilities each property declares — confirm specifics with the hotel.
          </p>
          <div className="flex col g8">
            {hotels.map((h) => (
              <a key={h.id} href={`/travel/hotel/${h.id}`} className="card" style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 12, justifyContent: "space-between" }}>
                <span style={{ minWidth: 0 }}>
                  <strong style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.name}</strong>
                  <small className="faint">{[h.city, h.country].filter(Boolean).join(", ")}</small>
                </span>
                <span className="flex g8" style={{ alignItems: "center", flex: "none" }}>
                  {h.guestRating ? <RatingBadge score={h.guestRating} count={h.reviewCount} /> : null}
                  {h.priceFrom ? <span className="price" style={{ whiteSpace: "nowrap" }}>{h.priceFrom.currency} {Math.round(h.priceFrom.amount)}<small>/stay</small></span> : null}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {!loading && asked && results.length === 0 && hotels.length === 0 && (
        <div className="hh-wrap" style={{ paddingBottom: 40 }}>
          <p className="faint">No matching places yet — try a different area or cuisine.</p>
        </div>
      )}
    </div>
  );
}
