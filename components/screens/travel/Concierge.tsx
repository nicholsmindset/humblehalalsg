"use client";

/* Humble Halal — AI travel concierge chat. Streams an agentic conversation
   (Vercel AI SDK useChat) that searches Muslim-friendly hotels + flights via tools
   and renders live result cards inline, each linking into the secure booking flow.
   Search/advise only — payment happens on the booking page, never in chat. */
import { useState, useRef, useEffect, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Icon } from "../../ui";
import type { TravelConciergeUIMessage } from "@/lib/travel-agent/agent";

const STARTERS = [
  "Muslim-friendly hotels in Makkah with a prayer room",
  "Flights from Singapore to Jeddah for Umrah next month",
  "Family stay near a mosque in Istanbul, alcohol-free",
];

const fmtDur = (min?: number) => {
  if (!min) return "";
  const h = Math.floor(min / 60), m = min % 60;
  return `${h}h${m ? ` ${m}m` : ""}`;
};

type Part = TravelConciergeUIMessage["parts"][number];
type HotelOut = Extract<Part, { type: "tool-searchHotels"; state: "output-available" }>["output"];
type FlightOut = Extract<Part, { type: "tool-searchFlights"; state: "output-available" }>["output"];

function HotelResults({ out }: { out: HotelOut }) {
  if (!out || !out.ok) return <p className="cncg-note">{out && "message" in out ? out.message : "No stays found."}</p>;
  if (!out.hotels.length) return <p className="cncg-note">No Muslim-friendly stays found for those dates — try other dates or a nearby city.</p>;
  return (
    <div className="cncg-cards">
      {out.hotels.map((h) => (
        <Link key={h.id} href={h.bookUrl} className="cncg-card">
          {h.image ? <Image src={h.image} alt="" width={84} height={96} className="cncg-card-img" unoptimized /> : <div className="cncg-card-img cncg-ph"><Icon name="bed" size={20} /></div>}
          <div className="cncg-card-body">
            <strong className="cncg-card-name">{h.name}</strong>
            <div className="cncg-card-meta">{[h.city, h.stars ? `${h.stars}★` : null, h.guestRating ? `${h.guestRating}/10` : null].filter(Boolean).join(" · ")}</div>
            {h.flags.length > 0 && <div className="cncg-tags">{h.flags.slice(0, 3).map((f) => <span key={f} className="cncg-tag"><Icon name="check" size={11} /> {f}</span>)}</div>}
            <div className="cncg-card-foot">
              <span className="cncg-score" title="Muslim-friendly score">{h.halalScore}</span>
              <span className="cncg-price">{h.price != null ? <>from <strong>{h.currency} {Math.round(h.price)}</strong></> : "View rates"}</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function FlightResults({ out }: { out: FlightOut }) {
  if (!out || !out.ok) return <p className="cncg-note">{out && "message" in out ? out.message : "No flights found."}</p>;
  if (!out.flights.length) return <p className="cncg-note">No flights found for that date — try another day.</p>;
  return (
    <div className="cncg-flights">
      {out.flights.map((f) => (
        <Link key={f.offerId} href={f.bookUrl} className="cncg-flt">
          <div className="cncg-flt-main">
            <strong>{f.depart} → {f.arrive}</strong>
            <span className="cncg-flt-sub">{f.route} · {f.carrier} · {f.stops === 0 ? "Direct" : `${f.stops} stop${f.stops > 1 ? "s" : ""}`}{f.durationMin ? ` · ${fmtDur(f.durationMin)}` : ""}</span>
          </div>
          <div className="cncg-flt-price">{f.price != null ? <strong>{f.currency} {Math.round(f.price)}</strong> : "—"}<span className="cncg-flt-go">Book <Icon name="arrow" size={13} /></span></div>
        </Link>
      ))}
    </div>
  );
}

export function TravelConcierge() {
  const { messages, sendMessage, status, error } = useChat<TravelConciergeUIMessage>({
    transport: new DefaultChatTransport({ api: "/api/travel/concierge" }),
  });
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const busy = status === "submitted" || status === "streaming";

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages, status]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    sendMessage({ text });
    setInput("");
  };
  const ask = (text: string) => { if (!busy) { sendMessage({ text }); } };

  return (
    <div className="cncg">
      <div className="cncg-stream" aria-live="polite">
        {messages.length === 0 && (
          <div className="cncg-empty">
            <div className="cncg-empty-ico"><Icon name="sparkles" size={22} /></div>
            <h3>Plan your halal trip</h3>
            <p className="muted">Ask me to find Muslim-friendly hotels or prayer-aware flights — I&apos;ll search live and link you straight to booking.</p>
            <div className="cncg-starters">{STARTERS.map((s) => <button key={s} type="button" className="cncg-starter" onClick={() => ask(s)}>{s}</button>)}</div>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={`cncg-msg ${m.role}`}>
            {m.role === "assistant" && <div className="cncg-avatar"><Icon name="sparkles" size={14} /></div>}
            <div className="cncg-bubble">
              {m.parts.map((part, i) => {
                if (part.type === "text") return <p key={i} className="cncg-text">{part.text}</p>;
                if (part.type === "tool-searchHotels") return part.state === "output-available"
                  ? <HotelResults key={i} out={part.output} />
                  : <p key={i} className="cncg-note"><span className="cncg-dot" /> Searching Muslim-friendly stays…</p>;
                if (part.type === "tool-searchFlights") return part.state === "output-available"
                  ? <FlightResults key={i} out={part.output} />
                  : <p key={i} className="cncg-note"><span className="cncg-dot" /> Searching flights…</p>;
                return null;
              })}
            </div>
          </div>
        ))}
        {busy && messages[messages.length - 1]?.role === "user" && (
          <div className="cncg-msg assistant"><div className="cncg-avatar"><Icon name="sparkles" size={14} /></div><div className="cncg-bubble"><p className="cncg-note"><span className="cncg-dot" /> Thinking…</p></div></div>
        )}
        {error && (
          <div className="cncg-msg assistant"><div className="cncg-avatar"><Icon name="alert" size={14} /></div><div className="cncg-bubble"><p className="cncg-note">The concierge is unavailable right now — please try the Search tab, or try again shortly.</p></div></div>
        )}
        <div ref={endRef} />
      </div>

      <form className="cncg-input" onSubmit={submit}>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="e.g. Hotel near the Haram in Makkah, first week of Ramadan" aria-label="Ask the travel concierge" disabled={busy} />
        <button type="submit" className="btn btn-primary" disabled={busy || !input.trim()} aria-label="Send">{busy ? <span className="spinner" /> : <Icon name="arrow" size={16} />}</button>
      </form>
      <p className="cncg-disc">Humble Halal is a discovery platform, not a certifier. Confirm facilities with the hotel/airline and the MUIS HalalSG register. Booking &amp; payment happen on the secure booking page.</p>
    </div>
  );
}
