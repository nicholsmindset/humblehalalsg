import { createAgentUIStreamResponse } from "ai";
import { getServerFlags } from "@/lib/feature-flags";
import { aiConfigured } from "@/lib/ai";
import { buildTravelConcierge } from "@/lib/travel-agent/agent";
import { rateLimit, tooMany } from "@/lib/ratelimit";

/* AI travel concierge — agentic chat (Vercel AI SDK ToolLoopAgent) that searches
   Muslim-friendly hotels + flights and hands off to the secure booking flow.
   Search/advise only — no payment in chat. Flag-gated + rate-limited; graceful
   when AI isn't configured. */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  if (!(await getServerFlags()).aiConcierge) {
    return Response.json({ error: "concierge_disabled" }, { status: 403 });
  }
  // Paid LLM + LiteAPI calls — throttle per IP (unauthenticated public chat).
  const rl = await rateLimit(req, "travel-concierge", 20, 60, { failClosed: true });
  if (!rl.ok) return tooMany(rl.retryAfter);
  if (!aiConfigured) return Response.json({ error: "ai_not_configured" }, { status: 503 });

  let messages: unknown;
  try {
    ({ messages } = (await req.json()) as { messages: unknown });
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }
  if (!Array.isArray(messages) || messages.length === 0) return Response.json({ error: "bad_request" }, { status: 400 });
  // Bound the payload handed to the paid LLM so a single request can't run up
  // token cost or wedge the agent: cap the turn count and the total size
  // (mirrors /api/concierge/chat — audit A6).
  if (messages.length > 40) return Response.json({ error: "too_many_messages" }, { status: 413 });
  if (JSON.stringify(messages).length > 24_000) return Response.json({ error: "payload_too_large" }, { status: 413 });

  const today = new Date().toISOString().slice(0, 10);
  const agent = buildTravelConcierge(today);
  return createAgentUIStreamResponse({ agent, uiMessages: messages });
}
