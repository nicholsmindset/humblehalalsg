import { httpActionGeneric, httpRouter, makeFunctionReference } from "convex/server";

const ingest = makeFunctionReference<"mutation", {
  eventId: string;
  eventType: "upsert" | "delete";
  aggregateType: "business" | "lead" | "lead_route";
  aggregateId: string;
  occurredAt: string;
  payload: Record<string, unknown>;
}>("crm:ingest");

function sameHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let i = 0; i < a.length; i += 1) difference |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return difference === 0;
}

async function signature(secret: string, timestamp: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const bytes = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${timestamp}.${body}`));
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

const ingestHttp = httpActionGeneric(async (ctx, request) => {
  const secret = process.env.CRM_SYNC_SECRET;
  if (!secret) return new Response("Not configured", { status: 503 });
  const timestamp = request.headers.get("x-hh-timestamp") || "";
  const supplied = request.headers.get("x-hh-signature") || "";
  const timestampNumber = Number(timestamp);
  if (!Number.isFinite(timestampNumber) || Math.abs(Date.now() / 1000 - timestampNumber) > 300) {
    return new Response("Stale request", { status: 401 });
  }
  const body = await request.text();
  if (body.length > 100_000) return new Response("Payload too large", { status: 413 });
  const expected = await signature(secret, timestamp, body);
  if (!sameHex(expected, supplied)) return new Response("Invalid signature", { status: 401 });

  let event: {
    eventId: string;
    eventType: "upsert" | "delete";
    aggregateType: "business" | "lead" | "lead_route";
    aggregateId: string;
    occurredAt: string;
    payload: Record<string, unknown>;
  };
  try {
    event = JSON.parse(body);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }
  const result = await ctx.runMutation(ingest, event);
  return Response.json({ ok: true, result });
});

const http = httpRouter();
http.route({ path: "/ingest/supabase", method: "POST", handler: ingestHttp });
export default http;
