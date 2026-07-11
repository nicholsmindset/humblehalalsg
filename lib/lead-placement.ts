/* Placement math for the inline lead-capture teaser inside blog posts.
   Pure + client-safe. SUBTLETY RULE (owner): the lead teaser must never crowd
   the newsletter ribbon (≥2 sections apart) or sit adjacent to the sponsored
   slot — when a post is too short to honour that, we OMIT the teaser rather
   than squeeze it in. Indexes are "render after section i", matching the
   midIndex/adIndex idiom in app/blog/[slug]/page.tsx. */

export function leadInlineIndex(sectionCount: number, midIndex: number, adIndex: number): number {
  if (sectionCount < 3) return -1; // too short for any inline block
  // Preferred slot: right after the opening section — high visibility, and
  // when the newsletter ribbon sits at index ≥2 the required gap holds.
  if (midIndex === -1 || midIndex >= 2) return 0;
  // Ribbon is early (index 0/1): try ≥2 sections after it, but never collide
  // with (or pass) the sponsored slot near the end.
  const candidate = midIndex + 2;
  const limit = adIndex === -1 ? sectionCount - 1 : adIndex;
  if (candidate < limit) return candidate;
  return -1; // no honest slot — omit rather than crowd
}
