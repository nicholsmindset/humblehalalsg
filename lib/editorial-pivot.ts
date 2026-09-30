import type { BlogPost } from "./blog";

const MUIS_REGISTER = "https://halal.muis.gov.sg/halal/establishments";
const VERIFY_NOTE = "For current certification, check the exact outlet on the MUIS HalalSG register and confirm details directly before visiting.";
const OUTDATED_SENTENCE = /Humble Halal(?:’s|'s)? (?:directory|map|“Open now” filter)|on Humble Halal|our directory|the directory (?!of MUIS)|halal-confidence score|every listing|each listing|browse (?:the|our|halal) directory|filter (?:the|our) directory|filter for them|area and category filters|“Open now” filter|open[- ]now filter|open the map|the map shows|browse them by category on Humble Halal|new certified .* added|sort by (?:rating|halal-confidence)|claim (?:a|the|your) listing/i;

function currentCopy(value: string): string {
  const sentences = value.split(/(?<=[.!?])\s+/);
  if (!sentences.some((sentence) => OUTDATED_SENTENCE.test(sentence))) return value;
  const retained = sentences.filter((sentence) => !OUTDATED_SENTENCE.test(sentence)).join(" ").trim();
  return retained ? `${retained} ${VERIFY_NOTE}` : VERIFY_NOTE;
}

function currentLinks(links: NonNullable<BlogPost["sections"][number]["links"]>) {
  const seen = new Set<string>();
  return links.flatMap((link) => {
    let next = link;
    try {
      const url = new URL(link.href, "https://www.humblehalal.com");
      if (["www.humblehalal.com", "humblehalal.com"].includes(url.hostname)) {
        if (/^\/(?:business|halal|map|explore|hawker|events|deals|pricing|for-business)(?:\/|$)/.test(url.pathname) ||
          /^\/(?:muis-halal-certified-directory|best-halal-restaurants-singapore|new-halal-restaurants-singapore)$/.test(url.pathname)) {
          next = { label: "Check current MUIS certification", href: MUIS_REGISTER };
        }
      }
    } catch { /* Preserve non-URL editorial references. */ }
    if (seen.has(next.href)) return [];
    seen.add(next.href);
    return [next];
  });
}

/** Remove claims and links tied to the retired directory from older articles. */
export function currentEditorialPost(post: BlogPost): BlogPost {
  return {
    ...post,
    dek: post.dek.replace(/halal-confidence score/gi, "halal status checks"),
    answer: currentCopy(post.answer),
    leadVertical: undefined,
    pullQuote: post.pullQuote ? currentCopy(post.pullQuote) : undefined,
    sections: post.sections.map((section) => ({
      ...section,
      h2: /directory|halal-confidence score|(?:plan|find).*with Humble Halal/i.test(section.h2) ? "How to verify current halal status" : section.h2,
      body: section.body?.map(currentCopy),
      bullets: section.bullets?.map(currentCopy),
      links: section.links ? currentLinks(section.links) : undefined,
    })),
    faq: post.faq.map((item) => ({ ...item, a: currentCopy(item.a) })),
  };
}
