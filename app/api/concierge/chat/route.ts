import { createAgentUIStreamResponse } from "ai";
import { getServerFlags } from "@/lib/flags";
import { aiConfigured } from "@/lib/ai";
import { buildConcierge } from "@/lib/concierge-agent";
import { rateLimit, tooMany } from "@/lib/ratelimit";

/* /ask concierge — streaming agentic chat over the halal directory (+ hotel
   search for stay-shaped asks). Mirrors /api/travel/concierge: flag-gated,
   rate-limited, graceful when AI isn't configured (the client falls back to
   the single-shot /api/concierge keyword search). */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  if (!getServerFlags().aiConcierge) {
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
