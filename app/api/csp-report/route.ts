import { rateLimit } from "@/lib/ratelimit";

/* CSP violation sink for the Report-Only policy (next.config.ts). Accepts BOTH
   the legacy `application/csp-report` body and the Reporting-API array, drops
   browser-extension noise, and logs a compact line to the Vercel runtime logs so
   we can triage the allowlist before enforcing. Rate-limited so a hostile page
   can't flood it; always answers 204 (a report endpoint returns no content). A
   later PR pipes these into Sentry as sampled messages. */
export const dynamic = "force-dynamic";

const IGNORE = /^(chrome|moz|safari|webkit)-extension:|^about:|^data:|extension/i;
const MAX_REPORT_BYTES = 32_768;

async function readReportBody(req: Request): Promise<string | null> {
  const declaredLength = Number(req.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_REPORT_BYTES) return null;
  if (!req.body) return "";

  const reader = req.body.getReader();
  const decoder = new TextDecoder();
  let total = 0;
  let body = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_REPORT_BYTES) {
        await reader.cancel().catch(() => undefined);
        return null;
      }
      body += decoder.decode(value, { stream: true });
    }
    return body + decoder.decode();
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const rl = await rateLimit(req, "csp-report", 30, 60);
  if (!rl.ok) return new Response(null, { status: 204 });

  const raw = await readReportBody(req);
  if (!raw) return new Response(null, { status: 204 });

  try {
    const json = JSON.parse(raw) as unknown;
    // Reporting-API sends an array of { type, body }; legacy sends { "csp-report": {…} }.
    const reports: Array<Record<string, unknown>> = Array.isArray(json)
      ? json.map((r) => (r as { body?: Record<string, unknown> }).body ?? (r as Record<string, unknown>))
      : [((json as Record<string, unknown>)["csp-report"] as Record<string, unknown>) ?? (json as Record<string, unknown>)];

    for (const r of reports.slice(0, 5)) {
      const blocked = String(r?.["blockedURL"] ?? r?.["blocked-uri"] ?? "");
      if (!blocked || IGNORE.test(blocked)) continue;
      console.warn(
        "[csp-report]",
        JSON.stringify({
          dir: r?.["effectiveDirective"] ?? r?.["violated-directive"] ?? null,
          blocked,
          doc: r?.["documentURL"] ?? r?.["document-uri"] ?? null,
          sample: r?.["sample"] ?? r?.["script-sample"] ?? undefined,
        }),
      );
    }
  } catch {
    /* malformed report — drop silently */
  }
  return new Response(null, { status: 204 });
}
