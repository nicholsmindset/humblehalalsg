// Browser `process` shim for the DS bundle. The app's lib modules read
// process.env.* (analytics, feature flags, Stripe keys, …) at module scope;
// esbuild's browser platform provides no `process`, so those reads throw
// "process is not defined" and every preview fails to render.
//
// This module has NO imports, so as the FIRST entry in cfg.extraEntries it
// evaluates before any app module in the bundle IIFE (the converter emits
// `export * from <extraEntry>` ahead of the main entry), defining a global
// process whose env returns undefined for every key — matching the
// no-secrets, client-only reality of the claude.ai/design environment.
const proc = {
  env: {} as Record<string, string | undefined>,
  version: "",
  versions: {} as Record<string, string>,
  platform: "browser",
  browser: true,
  argv: [] as string[],
  cwd: () => "/",
  nextTick: (fn: (...args: unknown[]) => void, ...args: unknown[]) =>
    Promise.resolve().then(() => fn(...args)),
};

const g = globalThis as unknown as { process?: typeof proc };
if (!g.process) g.process = proc;

export const __processShim = true;
