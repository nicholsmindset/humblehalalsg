// Minimal AI call via the Vercel AI Gateway (OpenAI-compatible endpoint) using
// plain fetch — avoids bundling the AI SDK in the Deno function (small cold start).
// Returns parsed JSON or null (graceful when AI_GATEWAY_API_KEY is unset).
const GATEWAY = "https://ai-gateway.vercel.sh/v1/chat/completions";

export async function aiJson(
  system: string,
  user: string,
  model = Deno.env.get("AI_MODEL_FAST") ?? "anthropic/claude-haiku-4.5",
): Promise<Record<string, unknown> | null> {
  const key = Deno.env.get("AI_GATEWAY_API_KEY");
  if (!key) return null;
  try {
    const res = await fetch(GATEWAY, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    return content ? JSON.parse(content) : null;
  } catch {
    return null;
  }
}
