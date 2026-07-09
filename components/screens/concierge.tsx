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
import { track } from "@/lib/analytics";
import type { Listing } from "@/lib/types";
import type { Hotel } from "@/lib/halal-hotels";
import type { ConciergeUIMessage } from "@/lib/concierge-agent";
import { ListingCard, Icon, ImagePh } from "../ui";
import { RatingBadge } from "../ota";

/* Safety net: the concierge is prompted to write plain prose, but LLMs still
   occasionally emit markdown. Strip the syntax to clean text (the result cards
   already carry names + links) so the bubble never shows raw ###, [](), --- etc.
   Rendered with white-space:pre-wrap so line breaks survive. */
function cleanMarkdown(text: string): string {
  return text
    .replace(/^\s*([-*_])\1{2,}\s*$/gm, "")                       // horizontal rules
    .replace(/^\s*#{1,6}\s+/gm, "")                               // headings
    .replace(/\[([^\]]+)\]\((?:https?:\/\/)?[^\s)]+\)/g, "$1")     // links → their text
    .replace(/\*\*([^*]+)\*\*/g, "$1")                            // bold
    .replace(/(^|\s)\*([^*\s][^*]*?)\*(?=\s|$)/g, "$1$2")          // italics
    .replace(/^\s*[-*]\s+/gm, "• ")                               // bullets
    .replace(/\n{3,}/g, "\n\n")                                    // collapse extra blank lines
    .trim();
}

const EXAMPLES = [
  "MUIS-certified nasi padang near Tampines with prayer space",
  "Halal brunch cafés in Bugis",
  "Muslim-owned salon for a bride in Geylang Serai",
  "Family-friendly biryani with delivery",
];

const TRUST_POINTS = [
  "Grounded in the Humble Halal directory",
  "MUIS, Muslim-owned and prayer-space filters",
  "Follow-up chat for faster narrowing",
];

const CAPABILITIES = [
  {
    icon: "shield-check",
    title: "Halal-aware search",
    text: "Ask for MUIS-certified, Muslim-owned, self-declared, or prayer-friendly places without learning filters first.",
  },
  {
    icon: "pin",
    title: "Area and intent matching",
    text: "Use natural prompts like brunch in Bugis, delivery near Tampines, or wedding services in Geylang Serai.",
  },
  {
    icon: "sparkles",
    title: "Useful follow-ups",
    text: "Refine results by price, family needs, prayer space, distance, cuisine, or business type in the same thread.",
  },
];

const PROMPT_TIPS = [
  "Name the area or MRT station.",
  "Say the halal confidence you need.",
  "Add constraints like delivery, prayer space, family-friendly, or budget.",
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
        <Link key={p.slug} href={p.url} className="cncg-card" onClick={() => { if (p.slug) track.aiResultClick(p.slug, p.category); }}>
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
    track.aiQuery(query);
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
    <div className="ask-fallback">
      <form className="cncg-input" onSubmit={(e) => { e.preventDefault(); ask(); }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. MUIS-certified nasi padang near Tampines" aria-label="Ask the halal concierge" disabled={loading} />
        <button type="submit" className="btn btn-primary" disabled={loading || q.trim().length < 2} aria-label="Search">{loading ? <span className="spinner" /> : <Icon name="search" size={16} />}</button>
      </form>
      {!asked && (
        <div className="ask-fallback-prompts">
          {EXAMPLES.map((ex) => <button key={ex} className="cncg-starter" onClick={() => ask(ex)}>{ex}</button>)}
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
            {results.map((l) => <ListingCard key={l.id} item={l} onOpen={() => track.aiResultClick(l.slug || l.id, l.catId)} />)}
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
    </div>
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
    track.aiQuery(text);
    sendMessage({ text });
    setInput("");
  };
  const ask = (text: string) => { if (!busy) { track.aiQuery(text); sendMessage({ text }); } };

  return (
    <div className="cncg">
      <div className="cncg-stream" aria-live="polite">
        {messages.length === 0 && (
          <div className="cncg-empty">
            <div className="cncg-empty-ico"><Icon name="sparkles" size={22} /></div>
            <h3>Start with a plain-English request</h3>
            <p className="muted">Ask like you would message a local friend. The concierge will search the directory and explain the match.</p>
            <div className="cncg-starters">{EXAMPLES.map((s) => <button key={s} type="button" className="cncg-starter" onClick={() => ask(s)}>{s}</button>)}</div>
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`cncg-msg ${m.role}`}>
            {m.role === "assistant" && <div className="cncg-avatar"><Icon name="crescent" size={14} /></div>}
            <div className="cncg-bubble">
              {m.parts.map((part, i) => {
                if (part.type === "text") return <p key={i} className="cncg-text" style={{ whiteSpace: "pre-wrap" }}>{cleanMarkdown(part.text)}</p>;
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
    <div className="screen-in hh-page ask-page">
      <section className="ask-hero">
        <div className="ask-hero-copy">
          <span className="eyebrow">Humble Halal AI concierge</span>
          <h1>Find halal places by asking like a human.</h1>
          <p>
            Skip the filter hunt. Tell Ask AI the area, cuisine, occasion, halal confidence,
            prayer-space need, or business type, and get grounded matches from the Humble Halal directory.
          </p>
          <div className="ask-hero-actions">
            <a className="btn btn-primary" href="#ask-console">Start asking</a>
            <Link className="btn btn-soft" href="/explore">Browse directory</Link>
          </div>
          <div className="ask-trust-row" aria-label="Ask AI strengths">
            {TRUST_POINTS.map((point) => (
              <span key={point}><Icon name="check" size={14} /> {point}</span>
            ))}
          </div>
        </div>

        <div className="ask-console-card" id="ask-console">
          <div className="ask-console-head">
            <div>
              <span>Live concierge</span>
              <strong>Ask AI</strong>
            </div>
            <span className="ask-live"><span /> Directory grounded</span>
          </div>
          {!probed ? (
            <div className="ask-loading" aria-busy="true">
              <span className="spinner" />
              Preparing the halal concierge...
            </div>
          ) : fallback ? (
            <SingleShotConcierge />
          ) : (
            <ChatConcierge onUnavailable={() => setFallback(true)} />
          )}
        </div>
      </section>

      <section className="ask-capabilities" aria-label="Ask AI features">
        {CAPABILITIES.map((item) => (
          <article key={item.title} className="ask-cap-card">
            <span><Icon name={item.icon} size={20} /></span>
            <h2>{item.title}</h2>
            <p>{item.text}</p>
          </article>
        ))}
      </section>

      <section className="ask-proof">
        <div className="ask-proof-main">
          <span className="eyebrow">Safer answers</span>
          <h2>Promoted as AI, designed as a directory assistant.</h2>
          <p>
            Humble Halal is a discovery platform, not a certifier. Ask AI surfaces facts such as
            MUIS-certified, Muslim-owned and self-declared badges, and should never invent halal status.
          </p>
        </div>
        <div className="ask-prompt-card">
          <h3>Better prompts get better matches</h3>
          <ul>
            {PROMPT_TIPS.map((tip) => <li key={tip}><Icon name="check" size={15} /> {tip}</li>)}
          </ul>
        </div>
      </section>
    </div>
  );
}
