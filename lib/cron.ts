/* Cron auth. Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` when the
   CRON_SECRET env var is set. When it's not set (dev / pre-DB), allow the call
   so the graceful endpoints still respond.

   IMPORTANT (production): always set CRON_SECRET. The fallback below is dev-only —
   it intentionally fails OPEN so local testing works. In production an unset
   secret would make every cron endpoint publicly triggerable, so treat a missing
   CRON_SECRET in prod as a misconfiguration. */
export function authorizeCron(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      console.warn("[cron] CRON_SECRET is unset in production — cron endpoints are unprotected. Set it in the environment.");
    }
    return true;
  }
  return req.headers.get("authorization") === `Bearer ${secret}`;
}
