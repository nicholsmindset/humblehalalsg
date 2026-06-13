/* Cron auth. Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` when the
   CRON_SECRET env var is set. When it's not set (dev / pre-DB), allow the call
   so the graceful endpoints still respond. */
export function authorizeCron(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}
