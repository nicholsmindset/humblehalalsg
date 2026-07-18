/* Pure aggregation + derivation helpers for the admin analytics overview.
   Isomorphic (no Supabase / side effects) — takes plain rows, returns plain
   values — so the API routes stay the only place with I/O and every rule here is
   unit-testable (same shape as lib/fees.ts). Consumed by:
     - app/api/admin/analytics/fallback (funnel/device/channel from events)
     - app/api/admin/analytics/platform-health (completeness, alerts)
     - app/admin/analytics/* (insight banner, search opportunities). */

const num = (v: unknown): number => {
  const n = typeof v === "bigint" ? Number(v) : Number(v);
  return Number.isFinite(n) ? n : 0;
};

// ── Acquisition channel ──────────────────────────────────────────────────────
export type Channel = "organic" | "direct" | "social" | "referral";

const SEARCH_HOSTS = ["google.", "bing.", "yahoo.", "duckduckgo.", "ecosia.", "baidu.", "yandex."];
const SOCIAL_HOSTS = [
  "facebook.", "fb.", "instagram.", "l.instagram.", "twitter.", "x.com", "t.co",
  "tiktok.", "linkedin.", "lnkd.in", "youtube.", "youtu.be", "pinterest.",
  "reddit.", "whatsapp.", "wa.me", "telegram.", "t.me",
];

/** Classify a referrer host (or full URL) into a marketing channel. No referrer
 *  → direct. Search engines → organic; known social hosts → social; anything
 *  else with a host → referral. */
export function classifyChannel(referrer: string | null | undefined): Channel {
  const raw = String(referrer || "").trim().toLowerCase();
  if (!raw) return "direct";
  let host = raw;
  try {
    if (raw.includes("://")) host = new URL(raw).hostname;
  } catch {
    /* not a URL — treat the raw string as the host */
  }
  host = host.replace(/^www\./, "");
  if (SEARCH_HOSTS.some((h) => host.includes(h))) return "organic";
  if (SOCIAL_HOSTS.some((h) => host.includes(h))) return "social";
  return "referral";
}

// ── Conversion funnel ────────────────────────────────────────────────────────
export interface FunnelInput { sessions: number; listingViews: number; actions: number; qualified: number }
export interface FunnelStage { key: string; label: string; value: number; pctOfTop: number; pctOfPrev: number }
export interface Funnel {
  stages: FunnelStage[];
  viewRate: number; // listing views / sessions
  actionRate: number; // actions / listing views
  leadRate: number; // qualified / actions
  biggestDropoffStage: string | null; // key of the stage with the largest relative drop from the previous
}

const rate = (num_: number, den: number, dp = 1): number =>
  den > 0 ? Number(((100 * num_) / den).toFixed(dp)) : 0;

/** Build the Sessions → Listing views → Actions → Leads funnel with stage
 *  percentages and the biggest relative drop-off (the largest opportunity). */
export function buildFunnel(input: FunnelInput): Funnel {
  const sessions = num(input.sessions);
  const listingViews = num(input.listingViews);
  const actions = num(input.actions);
  const qualified = num(input.qualified);
  const top = sessions;
  const raw = [
    { key: "sessions", label: "Sessions", value: sessions },
    { key: "listing_views", label: "Listing views", value: listingViews },
    { key: "actions", label: "Lead actions", value: actions },
    { key: "qualified", label: "Qualified leads", value: qualified },
  ];
  let biggestDropoffStage: string | null = null;
  let worstRetention = Infinity;
  const stages: FunnelStage[] = raw.map((s, i) => {
    const prev = i === 0 ? s.value : raw[i - 1].value;
    const pctOfPrev = i === 0 ? 100 : rate(s.value, prev);
    if (i > 0 && prev > 0 && pctOfPrev < worstRetention) {
      worstRetention = pctOfPrev;
      biggestDropoffStage = s.key;
    }
    return { key: s.key, label: s.label, value: s.value, pctOfTop: rate(s.value, top), pctOfPrev };
  });
  return {
    stages,
    viewRate: rate(listingViews, sessions),
    actionRate: rate(actions, listingViews),
    leadRate: rate(qualified, actions),
    biggestDropoffStage,
  };
}

// ── Listing completeness (Listings complete % KPI + drop-off diagnostics) ─────
export interface CompletenessInput {
  hasPhoto?: boolean;
  hasDescription?: boolean;
  hasContact?: boolean; // phone OR whatsapp OR website
  hasHours?: boolean;
  hasCategory?: boolean;
  hasArea?: boolean;
  verified?: boolean; // halal_tier muis|admin
}

// Weights sum to 100 — a photo and a real description matter most for CTR.
const COMPLETENESS_WEIGHTS: Record<keyof CompletenessInput, number> = {
  hasPhoto: 25, hasDescription: 20, hasContact: 20, hasHours: 15,
  hasCategory: 10, hasArea: 5, verified: 5,
};

/** 0–100 profile-completeness score for one listing. */
export function listingCompleteness(input: CompletenessInput): number {
  let score = 0;
  for (const k of Object.keys(COMPLETENESS_WEIGHTS) as (keyof CompletenessInput)[]) {
    if (input[k]) score += COMPLETENESS_WEIGHTS[k];
  }
  return score;
}

/** Average completeness across all listings, rounded to a whole percent. */
export function avgCompleteness(inputs: CompletenessInput[]): number {
  if (inputs.length === 0) return 0;
  const total = inputs.reduce((a, i) => a + listingCompleteness(i), 0);
  return Math.round(total / inputs.length);
}

// ── Search opportunities (high demand, low conversion) ───────────────────────
export interface SearchTermRow {
  query: string;
  searches: number;
  zero_result_searches?: number;
  result_clicks: number;
  searches_that_converted: number;
}
export interface SearchOpportunity {
  query: string;
  searches: number;
  ctr: number; // result_clicks / searches
  convRate: number; // searches_that_converted / searches
  opportunity: "High" | "Medium" | "Low";
}

/** Rank search terms by unmet demand: many searches but weak click-through /
 *  conversion. High = lots of demand converting poorly (the biggest wins). */
export function searchOpportunities(rows: SearchTermRow[], opts: { minSearches?: number; limit?: number } = {}): SearchOpportunity[] {
  const minSearches = opts.minSearches ?? 5;
  const scored = rows
    .map((r) => {
      const searches = num(r.searches);
      const ctr = rate(num(r.result_clicks), searches);
      const convRate = rate(num(r.searches_that_converted), searches);
      // Opportunity grows with demand and shrinks with conversion.
      const score = searches * (100 - convRate);
      let opportunity: SearchOpportunity["opportunity"] = "Low";
      if (searches >= minSearches && convRate < 2 && ctr < 5) opportunity = "High";
      else if (searches >= minSearches && (convRate < 5 || ctr < 8)) opportunity = "Medium";
      return { query: r.query, searches, ctr, convRate, opportunity, score };
    })
    .filter((r) => r.searches >= minSearches)
    .sort((a, b) => b.score - a.score);
  const limited = opts.limit ? scored.slice(0, opts.limit) : scored;
  return limited.map((r) => ({ query: r.query, searches: r.searches, ctr: r.ctr, convRate: r.convRate, opportunity: r.opportunity }));
}

// ── Executive insight ────────────────────────────────────────────────────────
export interface SummaryLike { total_sessions: number; search_conv_rate: number | null }
export interface Insight { headline: string; detail: string; tone: "positive" | "watch" | "neutral" }

/** One-line executive read of the window vs the previous one. The headline
 *  case in the mock: traffic up but search-to-lead conversion down. */
export function deriveInsight(summary: SummaryLike | null, prev: SummaryLike | null): Insight {
  if (!summary || !prev) {
    return { headline: "Not enough history yet.", detail: "Come back once there's a previous period to compare against.", tone: "neutral" };
  }
  const sessΔ = num(summary.total_sessions) - num(prev.total_sessions);
  const convΔ = num(summary.search_conv_rate) - num(prev.search_conv_rate);
  if (sessΔ > 0 && convΔ < 0) {
    return {
      headline: "Traffic is rising, but search-to-lead conversion declined.",
      detail: "Improving high-demand category pages and result-card CTR could recover the lost leads.",
      tone: "watch",
    };
  }
  if (sessΔ > 0 && convΔ >= 0) {
    return { headline: "Traffic and conversion are both up.", detail: "Demand is growing and it's converting — keep feeding the top categories.", tone: "positive" };
  }
  if (sessΔ <= 0 && convΔ > 0) {
    return { headline: "Traffic dipped, but conversion improved.", detail: "Fewer sessions are converting better — a demand (top-of-funnel) push would compound it.", tone: "watch" };
  }
  return { headline: "Traffic and conversion both softened.", detail: "Both demand and conversion fell versus the previous period — worth a closer look.", tone: "watch" };
}

// ── Recent alerts ────────────────────────────────────────────────────────────
export interface AlertInput { expiringCerts?: number; demandSpikePct?: number; moderationPending?: number }
export interface Alert { level: "critical" | "attention" | "info"; title: string; detail?: string }

/** Compose the Recent-alerts list from platform-health counts. Ordered
 *  most-urgent first. */
export function deriveAlerts(input: AlertInput): Alert[] {
  const alerts: Alert[] = [];
  const certs = num(input.expiringCerts);
  if (certs > 0) {
    alerts.push({
      level: certs >= 10 ? "critical" : "attention",
      title: `${certs} certificate${certs === 1 ? "" : "s"} expire within 30 days`,
      detail: "Re-verify affected listings before they drop tier.",
    });
  }
  const spike = num(input.demandSpikePct);
  if (spike >= 25) {
    alerts.push({ level: "info", title: `Search demand spike +${Math.round(spike)}%`, detail: "Consider a content or outreach push on the trending categories." });
  }
  const mod = num(input.moderationPending);
  if (mod > 0) {
    alerts.push({ level: mod >= 10 ? "attention" : "info", title: `${mod} item${mod === 1 ? "" : "s"} need moderation`, detail: "New submissions awaiting review." });
  }
  return alerts;
}

// ── Recommended experiment (journey view) ────────────────────────────────────
export interface Experiment {
  title: string;
  detail: string;
  upliftMin: number; // estimated additional leads / month (heuristic)
  upliftMax: number;
  confidence: "High" | "Medium" | "Low";
}

/** Turn the funnel's biggest drop-off into a concrete, prioritised experiment
 *  with a rough predicted uplift. The uplift is an ESTIMATE — a small conversion
 *  delta applied to the unmet demand surfaced by searchOpportunities — not a
 *  promise. Returns null when there's no funnel or no clear bottleneck. */
export function recommendExperiment(funnel: Funnel | null, searchOps: SearchOpportunity[]): Experiment | null {
  if (!funnel) return null;
  const stage = funnel.biggestDropoffStage;
  const unmetDemand = searchOps.reduce((a, o) => a + num(o.searches), 0);
  const base = unmetDemand * 0.005; // ~0.5% of high-opportunity demand → leads/mo
  const upliftMin = Math.max(1, Math.round(base * 0.6));
  const upliftMax = Math.max(upliftMin + 1, Math.round(base * 1.2));
  const confidence: Experiment["confidence"] = searchOps.length >= 3 ? "High" : searchOps.length >= 1 ? "Medium" : "Low";

  if (stage === "listing_views" || (stage == null && funnel.viewRate > 0 && funnel.viewRate < 10)) {
    return {
      title: "Add images, distance and verification to high-demand result cards",
      detail: "The biggest drop is search → listing views. Richer result cards typically lift click-through on high-demand queries.",
      upliftMin, upliftMax, confidence,
    };
  }
  if (stage === "actions") {
    return {
      title: "Make contact actions (call / WhatsApp / quote) prominent on listing detail",
      detail: "Views aren't converting to actions — surfacing the primary contact CTA above the fold usually recovers some of this.",
      upliftMin, upliftMax, confidence: "Medium",
    };
  }
  if (stage === "qualified") {
    return {
      title: "Streamline the quote form and prefill it from context",
      detail: "Actions aren't becoming qualified leads — a shorter, prefilled quote form reduces abandonment.",
      upliftMin, upliftMax, confidence: "Medium",
    };
  }
  return null;
}
