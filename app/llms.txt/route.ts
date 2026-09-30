import { allBlogPosts } from "@/lib/cms-blog";
import { SITE } from "@/lib/seo";

export const revalidate = 86400;

export async function GET() {
  const posts = await allBlogPosts();
  const body = `# ${SITE.name}

> ${SITE.description}

Humble Halal is an informational publication for readers in Singapore. It does not issue halal certification or maintain a business directory. Restaurant details and certification may change; check current information with the business and the official MUIS HalalSG register.

## Key pages
- [Home](${SITE.url}/)
- [Guides and stories](${SITE.url}/blog)
- [Free Islamic tools](${SITE.url}/tools)
- [Prayer times](${SITE.url}/tools/prayer-times)
- [Quran reader](${SITE.url}/tools/quran)
- [Mosques in Singapore](${SITE.url}/mosques)
- [About](${SITE.url}/about)

## Recent guides
${posts.slice(0, 30).map((post) => `- [${post.title}](${SITE.url}/blog/${post.slug})`).join("\n")}
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
