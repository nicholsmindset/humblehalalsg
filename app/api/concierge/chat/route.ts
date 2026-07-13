import { createAgentUIStreamResponse } from "ai";
import { getServerFlags } from "@/lib/feature-flags";
import { aiConfigured } from "@/lib/ai";
import { buildConcierge } from "@/lib/concierge-agent";
import { rateLimit, tooMany } from "@/lib/ratelimit";

/* /ask concierge — streaming agentic chat over the halal directory (+ hotel
   search for stay-shaped asks). Mirrors /api/travel/concierge: flag-gated,
   rate-limited, graceful when AI isn't configured (the client falls back to
   the single-shot /api/concierge keyword search). */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/* Lightweight availability probe for the /ask client. Returns 200 with
   { available } — no LLM call, no request body — so the page can pick streaming
   chat vs single-shot fallback WITHOUT firing a 4xx on load (the old client
   probe POSTed an invalid body to read a 400, which polluted the console/network
   tab and error monitoring). `available` mirrors the POST gate below. */
export async function GET() {
  const { aiConcierge } = await getServerFlags();
  return Response.json({ available: aiConcierge && aiConfigured });
}

export async function POST(req: Request) {
  if (!(await getServerFlags()).aiConcierge) {
    return Response.json({ error: "concierge_disabled" }, { status: 403 });
  }
  // Paid LLM call — throttle per IP (unauthenticated public chat).
  const rl = await rateLimit(req, "ask-concierge", 20, 60);
  if (!rl.ok) return tooMany(rl.retryAfter);
  if (!aiConfigured) return Response.json({ error: "ai_not_configured" }, { status: 503 });

  let messages: unknown;
  try {
    ({ messages } = (await req.json()) as { messages: unknown });
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }
  if (!Array.isArray(messages)) return Response.json({ error: "bad_request" }, { status: 400 });

  return createAgentUIStreamResponse({ agent: buildConcierge(), uiMessages: messages });
}
