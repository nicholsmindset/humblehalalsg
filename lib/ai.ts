import "server-only";
// Thin AI helper over the Vercel AI Gateway (AI SDK). Provider-agnostic plain
// model strings; graceful by design — when no gateway key/OIDC is present, the
// helpers return null and callers fall back (matching the project's mock-mode
// convention). Never let an AI call throw into a route.
import { generateText, generateObject, NoObjectGeneratedError } from "ai";
import type { ProviderOptions } from "@ai-sdk/provider-utils";
import type { z } from "zod";

// Auth: AI Gateway API key, or Vercel OIDC at runtime. Absent → not configured.
export const aiConfigured = !!(process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN);

// Model IDs verified against the gateway (newest available). Overridable by env.
export const AI_MODEL_FAST = process.env.AI_MODEL_FAST || "anthropic/claude-haiku-4.5";
export const AI_MODEL = process.env.AI_MODEL || "anthropic/claude-sonnet-4.6";

type AiFeature =
  | "admin-enrichment"
  | "concierge"
  | "review-triage"
  | "tiktok-draft"
  | "travel-chat"
  | "travel-flight-search"
  | "travel-highlights"
  | "travel-hotel-search"
  | "travel-question"
  | "verdict-draft";

/** Non-PII dimensions shown in AI Gateway usage and cost reports. */
export function gatewayProviderOptions(feature: AiFeature): ProviderOptions {
  const environment = process.env.VERCEL_ENV || process.env.NODE_ENV || "unknown";
  return {
    gateway: {
      tags: ["project:humblehalalsg", `environment:${environment}`, `feature:${feature}`],
    },
  };
}

function recoverGeneratedObject<T>(schema: z.ZodSchema<T>, text: string | undefined): T | null {
  if (!text) return null;
  const withoutFence = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const firstBrace = withoutFence.indexOf("{");
  const lastBrace = withoutFence.lastIndexOf("}");
  const candidates = [
    withoutFence,
    firstBrace >= 0 && lastBrace > firstBrace ? withoutFence.slice(firstBrace, lastBrace + 1) : "",
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      const result = schema.safeParse(JSON.parse(candidate));
      if (result.success) return result.data;
    } catch {
      // Try the next bounded JSON candidate, then use the caller's deterministic fallback.
    }
  }
  return null;
}

/** Structured generation. Returns the validated object, or null on no-config / error. */
export async function aiObject<T>(
  schema: z.ZodSchema<T>,
  opts: { feature: AiFeature; prompt?: string; system?: string; model?: string },
): Promise<T | null> {
  if (!aiConfigured) return null;
  try {
    const { object } = await generateObject({
      model: opts.model || AI_MODEL_FAST,
      schema,
      providerOptions: gatewayProviderOptions(opts.feature),
      ...(opts.system ? { system: opts.system } : {}),
      prompt: opts.prompt ?? "",
    });
    return object;
  } catch (error) {
    // Some free-tier models return valid JSON as text but do not advertise native
    // structured-output support. Recover only schema-valid JSON; never trust raw text.
    if (NoObjectGeneratedError.isInstance(error)) {
      return recoverGeneratedObject(schema, error.text);
    }
    return null;
  }
}

/** Free-text generation. Returns the text, or null on no-config / error. */
export async function aiText(
  opts: { feature: AiFeature; prompt?: string; system?: string; model?: string },
): Promise<string | null> {
  if (!aiConfigured) return null;
  try {
    const { text } = await generateText({
      model: opts.model || AI_MODEL,
      providerOptions: gatewayProviderOptions(opts.feature),
      ...(opts.system ? { system: opts.system } : {}),
      prompt: opts.prompt ?? "",
    });
    return text;
  } catch {
    return null;
  }
}
