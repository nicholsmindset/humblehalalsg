/* IndexNow — instantly notify Bing/Yandex (and partners) of new/updated URLs so
   they crawl within minutes instead of waiting for a sitemap sweep. Fails soft:
   no INDEXNOW_KEY → simulated no-op. The key is verified via `keyLocation`
   (served by app/indexnow-key.txt/route.ts), so no key-named file is needed. */
import { SITE } from "./seo";

export async function submitIndexNow(
  urls: string[],
): Promise<{ ok: boolean; simulated?: boolean; status?: number; count?: number }> {
  const key = process.env.INDEXNOW_KEY;
  const list = [...new Set(urls.filter(Boolean))].slice(0, 10000);
  if (!key || list.length === 0) return { ok: true, simulated: true, count: list.length };
  const host = new URL(SITE.url).host;
  try {
    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify({ host, key, keyLocation: `${SITE.url}/indexnow-key.txt`, urlList: list }),
    });
    return { ok: res.ok, status: res.status, count: list.length };
  } catch {
    return { ok: false, count: list.length };
  }
}
