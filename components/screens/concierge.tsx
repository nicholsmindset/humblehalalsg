"use client";

/* Humble Halal — AI concierge / natural-language halal search (/ask).
   Streams an agentic multi-turn chat (same stack as the travel concierge)
   grounded in the directory via the searchDirectory tool — result cards render
   inline right where the answer cites them. When the chat backend is off
   (flag/AI key), it degrades to the original single-shot /api/concierge
   keyword search so the page always works. */
import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { Listing } from "@/lib/types";
import type { Hotel } from "@/lib/halal-hotels";
import type { ConciergeUIMessage } from "@/lib/concierge-agent";
import { ListingCard, Icon, ImagePh } from "../ui";
import { RatingBadge } from "../ota";

const EXAMPLES = [
  "MUIS-certified nasi padang near Tampines with prayer space",
  "Halal brunch cafés in Bugis",
  "Muslim-owned salon for a bride in Geylang Serai",
  "Family-friendly biryani with delivery",
];

type Part = ConciergeUIMessage["parts"][number];
type DirOut = Extract<Part, { type: "tool-searchDirectory"; state: "output-available" }>["output"];
type HotelOut = Extract<Part, { type: "tool-searchHotels"; state: "output-available" }>["output"];

function DirectoryResults({ out }: { out: DirOut }) {
  if (!out || !out.ok || !out.places.length) {
    return <p className="cncg-note">No matching places yet — try a different area or cuisine.</p>;
  }
  return (
    <div className="cncg-cards">
      {out.places.map((p) => (
        <Link key={p.slug} href={p.url} className="cncg-card">
          <ImagePh label={p.category.toLowerCase()} src={p.image} style={{ width: 84, height: 96, flex: "none" }} icon="utensils" />
          <div className="cncg-card-body">
            <strong className="cncg-card-name">{p.name}</strong>
            <div className="cncg-card-meta">{[p.cuisine, p.area].filter(Boolean).join(" · ")}</div>
            <div className="cncg-tags">
              <span className="cncg-tag"><Icon name="crescent" size={11} /> {p.halalTier}</span>
              {p.prayerSpace && <span className="cncg-tag"><Icon name="mosque" size={11} /> Prayer space</span>}
            </div>
            <div className="cncg-card-foot">
              {p.halalScore != null && <span className="cncg-score" title="Halal confidence">{p.halalScore}</span>}
              <span className="cncg-price">{p.rating != null ? <>{p.rating}★ · {p.reviews} review{p.reviews === 1 ? "" : "s"}</> : "New"}</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function HotelResults({ out }: { out: HotelOut }) {
  if (!out || !out.ok) return <p className="cncg-note">{out && "message" in out ? out.message : "No stays found."}</p>;
  if (!out.hotels.length) return <p className="cncg-note">No Muslim-friendly stays found — try other dates or a nearby city.</p>;
  return (
    <div className="cncg-cards">
      {out.hotels.map((h) => (
        <Link key={h.id} href={h.bookUrl} className="cncg-card">
          <div className="cncg-card-body">
            <strong className="cncg-card-name">{h.name}</strong>
            <div className="cncg-card-meta">{[h.city, h.stars ? `${h.stars}★` : null].filter(Boolean).join(" · ")}</div>
            {h.flags.length > 0 && <div className="cncg-tags">{h.flags.slice(0, 3).map((f: string) => <span key={f} className="cncg-tag"><Icon name="check" size={11} /> {f}</span>)}</div>}
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

/* ---------- Fallback: original single-shot keyword search ---------- */
function SingleShotConcierge() {
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
      if (r.status === 429) {
        const retry = Number(r.headers.get("Retry-After")) || 60;
        setAnswer(`You're asking quickly — please wait ~${retry}s and try again.`);
        setResults([]); setHotels([]);
        return;
      }
      const d = await r.json();
      setAnswer(typeof d.answer === "string" ? d.answer : null);
      setResults(Array.isArray(d.results) ? d.results : []);
      setHotels(Array.isArray(d.hotels) ? d.hotels : []);
    } catch {
      setAnswer("Network hiccup — please check your connection and try again.");
      setResults([]); setHotels([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form className="cncg-input" onSubmit={(e) => { e.preventDefault(); ask(); }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. MUIS-certified nasi padang near Tampines" aria-label="Ask the halal concierge" disabled={loading} />
        <button type="submit" className="btn btn-primary" disabled={loading || q.trim().length < 2} aria-label="Search">{loading ? <span className="spinner" /> : <Icon name="search" size={16} />}</button>
      </form>
      {!asked && (
        <div className="flex g8 wrap" style={{ marginTop: 10 }}>
          {EXAMPLES.map((ex) => <button key={ex} className="chip" onClick={() => ask(ex)}>{ex}</button>)}
        </div>
      )}
      <div aria-live="polite">
        {loading && (
          <div className="grid-cards" style={{ marginTop: 18 }} aria-busy="true">
            {[0, 1, 2].map((i) => <div key={i} className="card" style={{ height: 210, opacity: 0.45 }} />)}
          </div>
        )}
        {!loading && answer && (
          <div className="card" style={{ marginTop: 18, padding: "16px 18px", background: "var(--emerald-50)", display: "flex", gap: 12 }}>
            <Icon name="crescent" size={20} style={{ color: "var(--emerald)", flex: "none", marginTop: 2 }} />
            <p style={{ fontSize: ".95rem", lineHeight: 1.55 }}>{answer}</p>
          </div>
        )}
        {!loading && results.length > 0 && (
          <div className="grid-cards" style={{ marginTop: 16 }}>
            {results.map((l) => <ListingCard key={l.id} item={l} />)}
          </div>
        )}
        {!loading && hotels.length > 0 && (
          <div className="flex col g8" style={{ marginTop: 16 }}>
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
        )}
        {!loading && asked && !answer && results.length === 0 && hotels.length === 0 && (
          <p className="faint" style={{ marginTop: 16 }}>No matching places yet — try a different area or cuisine.</p>
        )}
      </div>
    </>
  );
}

/* ---------- Streaming multi-turn chat (primary) ---------- */
function ChatConcierge({ onUnavailable }: { onUnavailable: () => void }) {
  const { messages, sendMessage, status, error } = useChat<ConciergeUIMessage>({
    transport: new DefaultChatTransport({ api: "/api/concierge/chat" }),
  });
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const busy = status === "submitted" || status === "streaming";

  useEffect(() => { if (messages.length) endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages, status]);
  // Backend off (flag/AI key) before anything streamed → let the parent swap
  // in the single-shot fallback so the page still answers.
  useEffect(() => {
    if (error && messages.every((m) => m.role === "user")) onUnavailable();
  }, [error, messages, onUnavailable]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    sendMessage({ text });
    setInput("");
  };
  const ask = (text: string) => { if (!busy) sendMessage({ text }); };

  return (
    <div className="cncg">
      <div className="cncg-stream" aria-live="polite">
        {messages.length === 0 && (
          <div className="cncg-empty">
            <div className="cncg-empty-ico"><Icon name="sparkles" size={22} /></div>
            <h3>Ask for exactly what you want</h3>
            <p className="muted">Area, cuisine, prayer space, halal status — in plain words. Follow up to narrow it down.</p>
            <div className="cncg-starters">{EXAMPLES.map((s) => <button key={s} type="button" className="cncg-starter" onClick={() => ask(s)}>{s}</button>)}</div>
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`cncg-msg ${m.role}`}>
            {m.role === "assistant" && <div className="cncg-avatar"><Icon name="crescent" size={14} /></div>}
            <div className="cncg-bubble">
              {m.parts.map((part, i) => {
                if (part.type === "text") return <p key={i} className="cncg-text">{part.text}</p>;
                if (part.type === "tool-searchDirectory") return part.state === "output-available"
                  ? <DirectoryResults key={i} out={part.output} />
                  : <p key={i} className="cncg-note"><span className="cncg-dot" /> Searching the halal directory…</p>;
                if (part.type === "tool-searchHotels") return part.state === "output-available"
                  ? <HotelResults key={i} out={part.output} />
                  : <p key={i} className="cncg-note"><span className="cncg-dot" /> Searching Muslim-friendly stays…</p>;
                return null;
              })}
            </div>
          </div>
        ))}
        {busy && messages[messages.length - 1]?.role === "user" && (
          <div className="cncg-msg assistant"><div className="cncg-avatar"><Icon name="crescent" size={14} /></div><div className="cncg-bubble"><p className="cncg-note"><span className="cncg-dot" /> Thinking…</p></div></div>
        )}
        {error && messages.some((m) => m.role === "assistant") && (
          <div className="cncg-msg assistant"><div className="cncg-avatar"><Icon name="alert" size={14} /></div><div className="cncg-bubble"><p className="cncg-note">That didn&apos;t go through — you may be asking quickly (limit ~20/min). Please try again shortly.</p></div></div>
        )}
        <div ref={endRef} />
      </div>
      <form className="cncg-input" onSubmit={submit}>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="e.g. MUIS-certified nasi padang near Tampines" aria-label="Ask the halal concierge" disabled={busy} />
        <button type="submit" className="btn btn-primary" disabled={busy || !input.trim()} aria-label="Send">{busy ? <span className="spinner" /> : <Icon name="arrow" size={16} />}</button>
      </form>
    </div>
  );
}

export function ConciergeScreen() {
  const [fallback, setFallback] = useState(false);
  // Probe whether the streaming chat backend is available (flag + AI key).
  // 400 = "bad request" = route is LIVE (we sent an intentionally invalid body
  // so no LLM call is made); 403/503/network = degrade to single-shot search.
  const [probed, setProbed] = useState(false);
  useEffect(() => {
    let alive = true;
    fetch("/api/concierge/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: null }),
    })
      .then((r) => { if (alive) { setFallback(r.status === 403 || r.status === 503); setProbed(true); } })
      .catch(() => { if (alive) { setFallback(true); setProbed(true); } });
    return () => { alive = false; };
  }, []);
  return (
    <div className="screen-in hh-page">
      <div className="hh-wrap" style={{ paddingTop: 28, paddingBottom: 40, maxWidth: 760 }}>
        <span className="eyebrow" style={{ color: "var(--emerald)" }}>Halal concierge</span>
        <h1 style={{ fontSize: "2rem", margin: "8px 0 6px" }}>Ask for exactly what you want</h1>
        <p className="faint" style={{ fontSize: ".95rem", marginBottom: 16 }}>
          Describe the place you&apos;re after — area, cuisine, prayer space, halal status — in plain words.
        </p>

        {!probed ? (
          <div className="card" style={{ height: 120, opacity: 0.4 }} aria-busy="true" />
        ) : fallback ? (
          <SingleShotConcierge />
        ) : (
          <ChatConcierge onUnavailable={() => setFallback(true)} />
        )}

        <div className="card" style={{ marginTop: 22, padding: "14px 16px", display: "flex", gap: 10, alignItems: "flex-start" }}>
          <Icon name="shield-check" size={18} style={{ color: "var(--emerald)", flex: "none", marginTop: 1 }} />
          <p className="faint" style={{ fontSize: ".85rem", lineHeight: 1.5 }}>
            Humble Halal is a discovery platform, not a certifier. We surface facts — MUIS-certified, Muslim-owned and self-declared badges — and always link to the official HalalSG register. The concierge never invents halal status.
          </p>
        </div>
      </div>
    </div>
  );
}
