/* Cron auth. Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` when the
   CRON_SECRET env var is set.

   Production fails CLOSED: if CRON_SECRET is unset in production we DENY every
   cron call — an unset secret would otherwise make money-moving/email crons
   (e.g. event-payouts) publicly triggerable. Outside production the fallback
   fails open so local testing and pre-DB demos still respond. */
export function authorizeCron(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      console.error("[cron] CRON_SECRET is unset in production — denying cron call. Set it in the environment.");
      return false; // fail closed in prod
    }
    return true; // dev / demo convenience only
  }
  return req.headers.get("authorization") === `Bearer ${secret}`;
}
