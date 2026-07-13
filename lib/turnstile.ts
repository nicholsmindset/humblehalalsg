import "server-only";

/* Cloudflare Turnstile server-side verification for the highest-abuse public
   forms (leads, contact, subscribe). DARK ROLLOUT: when TURNSTILE_SECRET_KEY is
   unset the check is a no-op (returns true), so nothing changes until the owner
   provisions keys. When set, a missing/invalid token is rejected. `failOpen`
   controls behaviour on a Cloudflare outage — true for low-stakes forms
   (newsletter) so a Cloudflare blip never eats a signup. */
const SECRET = process.env.TURNSTILE_SECRET_KEY;
const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export function turnstileConfigured(): boolean {
  return !!SECRET;
}

export async function verifyTurnstile(
  token: unknown,
  ip?: string | null,
  opts?: { failOpen?: boolean },
): Promise<boolean> {
  if (!SECRET) return true; // not configured → no-op (dark rollout)
  if (typeof token !== "string" || !token) return false;

  try {
    const form = new URLSearchParams();
    form.set("secret", SECRET);
    form.set("response", token);
    if (ip) form.set("remoteip", ip);
    const res = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
    const data = (await res.json()) as { success?: boolean };
    return !!data.success;
  } catch {
    // Cloudflare unreachable — fail open only where the caller allows it.
    return !!opts?.failOpen;
  }
}
