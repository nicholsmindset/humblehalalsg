// Shared helpers for the agent-browser diagnostic scripts (scripts/ab-*.mjs).
// Thin wrapper over the `agent-browser` CLI: launch a mobile/desktop session,
// navigate, and run the shared probes from e2e/probes.mjs in the page. Sequential
// by design — a sweep is I/O-bound on page loads, not CPU-bound.

import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = resolve(HERE, "..", "..");
export const SEED_SCRIPT = resolve(HERE, "seed.js");
const BIN = "agent-browser";

/** Spawn agent-browser. `args` is the full argument list; `input` is piped to stdin. */
function sh(args, input) {
  const res = spawnSync(BIN, args, {
    input,
    encoding: "utf8",
    maxBuffer: 128 * 1024 * 1024,
    cwd: REPO_ROOT,
  });
  if (res.error) throw res.error;
  return res.stdout || "";
}

/** Pull the last JSON object/array out of mixed CLI output (boundary markers etc.). */
function parseJson(stdout) {
  const lines = stdout.split("\n").map((l) => l.trim()).filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i--) {
    const l = lines[i];
    if (l[0] === "{" || l[0] === "[") {
      try { return JSON.parse(l); } catch { /* keep scanning */ }
    }
  }
  return null;
}

const DEVICES = {
  "mobile-390": "iPhone 14",
  "mobile-320": null, // set via viewport below
  "tablet-768": "iPad Mini",
};

/** Fresh session at a device viewport with consent/onboarding pre-seeded. */
export function launch(session, { device = "mobile-390", reactDevtools = false } = {}) {
  sh(["--session", session, "--json", "close"]); // ensure clean
  const openArgs = ["--session", session, "--json", "--init-script", SEED_SCRIPT];
  if (reactDevtools) openArgs.push("--enable", "react-devtools");
  openArgs.push("open");
  sh(openArgs); // launch about:blank with init script + optional react hook
  const deviceName = DEVICES[device];
  if (deviceName) sh(["--session", session, "--json", "set", "device", deviceName]);
  else if (device === "mobile-320") sh(["--session", session, "--json", "set", "viewport", "320", "693", "2"]);
  return session;
}

/** Navigate + wait for network idle. Returns { title, url }. */
export function goto(session, url) {
  const out = sh(["--session", session, "--json", "open", url]);
  sh(["--session", session, "--json", "wait", "--load", "networkidle"]);
  sh(["--session", session, "--json", "wait", "400"]); // settle
  const p = parseJson(out);
  return { title: p?.data?.title ?? null, url: p?.data?.url ?? url };
}

/** Run a self-contained probe function (from e2e/probes.mjs) in the page. */
export function evalProbe(session, fnSource, ...args) {
  const call = `JSON.stringify((${fnSource})(${args.map((a) => JSON.stringify(a)).join(",")}))`;
  const out = sh(
    ["--session", session, "--json", "--content-boundaries", "false", "eval", "--stdin"],
    call
  );
  const parsed = parseJson(out);
  const result = parsed?.data?.result ?? parsed?.result ?? null;
  if (typeof result === "string") {
    try { return JSON.parse(result); } catch { return result; }
  }
  return result;
}

/** Raw eval of an arbitrary expression, returns parsed JSON value. */
export function evalExpr(session, expr) {
  const out = sh(
    ["--session", session, "--json", "--content-boundaries", "false", "eval", "--stdin"],
    expr
  );
  const parsed = parseJson(out);
  return parsed?.data?.result ?? parsed?.result ?? null;
}

/** Core Web Vitals + hydration for the current page. */
export function vitals(session) {
  const out = sh(["--session", session, "--json", "--content-boundaries", "false", "vitals"]);
  return parseJson(out)?.data ?? null;
}

/** 4xx/5xx network responses tracked since navigation. */
export function badRequests(session) {
  const out = sh(["--session", session, "--json", "network", "requests", "--status", "400-599"]);
  const p = parseJson(out);
  return p?.data?.requests ?? p?.data ?? [];
}

/** Console messages (errors/warnings) for the current page. */
export function consoleMessages(session) {
  const out = sh(["--session", session, "--json", "--content-boundaries", "false", "console", "--json"]);
  const p = parseJson(out);
  return p?.data?.messages ?? p?.data ?? [];
}

/** Uncaught page errors for the current page. */
export function pageErrors(session) {
  const out = sh(["--session", session, "--json", "--content-boundaries", "false", "errors"]);
  const p = parseJson(out);
  return p?.data?.errors ?? p?.data ?? [];
}

export function clearConsole(session) {
  sh(["--session", session, "--json", "console", "--clear"]);
}

export function clearErrors(session) {
  sh(["--session", session, "--json", "errors", "--clear"]);
}

export function screenshot(session, path) {
  sh(["--session", session, "--json", "screenshot", path]);
  return path;
}

export function close(session) {
  sh(["--session", session, "--json", "close"]);
}

/** Read one probe's source text out of e2e/probes.mjs (so scripts stay DRY). */
export async function loadProbes() {
  const mod = await import(resolve(REPO_ROOT, "e2e", "probes.mjs"));
  return {
    overflow: mod.overflowProbe.toString(),
    tap: mod.tapTargetProbe.toString(),
    smallText: mod.smallTextProbe.toString(),
    inputZoom: mod.inputZoomProbe.toString(),
    ALLOW: mod.SCROLLER_ALLOWLIST.join(","),
    PRIMARY_CTA: mod.PRIMARY_CTA_SELECTOR,
  };
}

// Default route seed set — representative surfaces per group. Mirrors the SEO
// sources (lib/seo-pages.ts, lib/directory.ts, lib/blog.ts, lib/events-seo-pages.ts,
// lib/travel-locations.ts); dynamic [slug] pages are sampled, not enumerated.
export const ROUTE_GROUPS = {
  directory: ["/", "/mosques", "/prayer-rooms", "/map", "/is-halal", "/explore", "/guides"],
  seasonal: ["/ramadan", "/hari-raya"],
  tools: ["/tools", "/tools/inheritance", "/tools/zakat", "/tools/prayer-times", "/tools/qibla", "/tools/ingredient-checker", "/tools/quran"],
  travel: ["/travel", "/travel/flights", "/travel/umrah"],
  events: ["/events", "/host-event"],
  blog: ["/blog"],
  info: ["/about", "/faq", "/contact", "/pricing", "/for-business", "/advertise"],
};

export const CORE_ROUTES = [
  ...ROUTE_GROUPS.directory,
  ...ROUTE_GROUPS.tools,
  ...ROUTE_GROUPS.travel,
  ...ROUTE_GROUPS.events,
  ...ROUTE_GROUPS.blog,
];

export const ALL_ROUTES = Object.values(ROUTE_GROUPS).flat();

/** Parse CLI flags: --base=<url> --routes=a,b,c --device=<name> --group=<name>. */
export function parseArgs(argv) {
  const args = { base: process.env.AUDIT_BASE_URL || "https://www.humblehalal.com", device: "mobile-390" };
  for (const a of argv.slice(2)) {
    const m = a.match(/^--([^=]+)=(.*)$/);
    if (!m) continue;
    const [, k, v] = m;
    if (k === "routes") args.routes = v.split(",").map((s) => s.trim()).filter(Boolean);
    else args[k] = v;
  }
  if (!args.routes) {
    args.routes = args.group && ROUTE_GROUPS[args.group] ? ROUTE_GROUPS[args.group] : CORE_ROUTES;
  }
  return args;
}

export function stamp() {
  // Date is fine in a plain node script (unlike workflow scripts).
  return new Date().toISOString().slice(0, 10);
}
