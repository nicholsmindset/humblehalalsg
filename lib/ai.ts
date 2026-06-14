import "server-only";
// Thin AI helper over the Vercel AI Gateway (AI SDK). Provider-agnostic plain
// model strings; graceful by design — when no gateway key/OIDC is present, the
// helpers return null and callers fall back (matching the project's mock-mode
// convention). Never let an AI call throw into a route.
import { generateText, generateObject } from "ai";
import type { z } from "zod";

// Auth: AI Gateway API key, or Vercel OIDC at runtime. Absent → not configured.
export const aiConfigured = !!(process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN);

// Model IDs verified against the gateway (newest available). Overridable by env.
export const AI_MODEL_FAST = process.env.AI_MODEL_FAST || "anthropic/claude-haiku-4.5";
export const AI_MODEL = process.env.AI_MODEL || "anthropic/claude-sonnet-4.6";

/** Structured generation. Returns the validated object, or null on no-config / error. */
export async function aiObject<T>(
  schema: z.ZodSchema<T>,
  opts: { prompt?: string; system?: string; model?: string },
): Promise<T | null> {
  if (!aiConfigured) return null;
  try {
    const { object } = await generateObject({
      model: opts.model || AI_MODEL_FAST,
      schema,
      ...(opts.system ? { system: opts.system } : {}),
      prompt: opts.prompt ?? "",
    });
    return object;
  } catch {
    return null;
  }
}

/** Free-text generation. Returns the text, or null on no-config / error. */
export async function aiText(
  opts: { prompt?: string; system?: string; model?: string },
): Promise<string | null> {
  if (!aiConfigured) return null;
  try {
    const { text } = await generateText({
      model: opts.model || AI_MODEL,
      ...(opts.system ? { system: opts.system } : {}),
      prompt: opts.prompt ?? "",
    });
    return text;
  } catch {
    return null;
  }
}
