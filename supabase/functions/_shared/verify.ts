// Shared-secret auth for DB-webhook → Edge Function calls. The Database Webhook
// is configured to send `x-webhook-secret: <WEBHOOK_SHARED_SECRET>`; we compare
// in constant time. These functions are NOT user-facing, so there is no Clerk/
// Supabase JWT to verify (verify_jwt=false in config.toml).
export function authorized(req: Request): boolean {
  const got = req.headers.get("x-webhook-secret") ?? "";
  const want = Deno.env.get("WEBHOOK_SHARED_SECRET") ?? "";
  if (!want || got.length !== want.length) return false;
  let diff = 0;
  for (let i = 0; i < want.length; i++) diff |= got.charCodeAt(i) ^ want.charCodeAt(i);
  return diff === 0;
}

// Standard Supabase Database Webhook payload shape.
export type WebhookPayload<T = Record<string, unknown>> = {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  schema: string;
  record: T | null;
  old_record: T | null;
};
