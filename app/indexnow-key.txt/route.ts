/* Serves the IndexNow verification key at /indexnow-key.txt (referenced as
   `keyLocation` in submissions). Empty until INDEXNOW_KEY is set. */
export const dynamic = "force-dynamic";

export async function GET() {
  return new Response(process.env.INDEXNOW_KEY || "", {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
