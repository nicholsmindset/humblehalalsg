import type { NextRequest } from "next/server";

/* Keystatic's route handler reads its GitHub-app secrets at module init and
   throws when they are absent — which failed `next build` (page-data
   collection) in every environment without KEYSTATIC_* secrets and kept CI
   red on master. Initialize lazily and answer 503 instead: where the secrets
   aren't configured the CMS API is simply unavailable; nothing else is. */

type Handler = (req: NextRequest, ctx: { params: Promise<{ params: string[] }> }) => Promise<Response>;
let handlers: { GET: Handler; POST: Handler } | null | undefined;

async function getHandlers() {
  if (handlers !== undefined) return handlers;
  try {
    const [{ makeRouteHandler }, { default: keystaticConfig }] = await Promise.all([
      import("@keystatic/next/route-handler"),
      import("../../../../keystatic.config"),
    ]);
    handlers = makeRouteHandler({ config: keystaticConfig }) as unknown as { GET: Handler; POST: Handler };
  } catch {
    handlers = null;
  }
  return handlers;
}

const unavailable = () =>
  new Response("Keystatic CMS is not configured in this environment.", { status: 503 });

export async function GET(req: NextRequest, ctx: { params: Promise<{ params: string[] }> }) {
  const h = await getHandlers();
  return h ? h.GET(req, ctx) : unavailable();
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ params: string[] }> }) {
  const h = await getHandlers();
  return h ? h.POST(req, ctx) : unavailable();
}
