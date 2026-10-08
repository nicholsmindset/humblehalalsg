# Humble Halal editorial UX audit — 8 October 2026

Scope: homepage, blog index, category pages and article reading, on desktop and mobile. This is a browser and implementation audit, not user research or a measured conversion experiment.

## Findings and implemented changes

| Finding | Change | Reader benefit |
| --- | --- | --- |
| The index contained 54 guides with no search; the desktop page was about 13,500px long. | Search title, description, tags and category across the full collection; include empty-state recovery. Keep links server-rendered and all guides available. | Readers can find a relevant guide without scanning the entire list. |
| Topic counts used an older post list and omitted newer populated categories. | Count the same merged CMS collection used by the index. | Topic labels and counts reflect available content. |
| The homepage hero occupied most of the opening desktop viewport with broad messaging. | Shorter headline and description, tighter spacing, direct topic links and compact topic cards. | Clearer purpose and faster entry into useful content. |
| Long articles lacked a contents list. | Native expandable contents with section and FAQ links, keyboard-focusable targets and header clearance. | Readers can jump to an answer and navigate with a keyboard. |
| Mobile article headings and metadata consumed excessive opening space. | Left-aligned mobile headings, shorter metadata layout and clearer typography. | Better scanning and more space for the article. |
| A displayed update date could predate publication. | Show an update only when its date is later than publication. | Remove contradictory display metadata without inventing a new date. |
| Three related cards were squeezed into the narrow reading column. | Move related guides into the full page width with responsive card columns. | Useful titles and previews remain readable. |
| Repeated newsletter forms and a timed popup interrupted editorial reading. | Replace the middle form with a link to the end form; suppress the timed popup on home/blog routes. | Keep newsletter discovery with fewer interruptions. |
| Header, prayer strip and bottom navigation competed for mobile reading space. | Let the prayer strip scroll normally on editorial pages; retain header and bottom navigation. | More room for the reading task, while tools remain available. |

## Preserved behavior

- Cream and teal branding, existing article URLs, content, images and structured data.
- Editorial ad planner: homepage 2 placements; normal blog index up to 3; categories up to 2; article count depends on length and sections, up to 5. Vietnamese guide remains 4.
- Search results omit ads while a query is active, avoiding ad recreation on each keystroke.
- Quran routes remain excluded from advertising. No ad loader or ad eligibility logic changed.
- Consent controls remain available through the footer.

## Verification

- Full unit suite: 68 files, 477 tests passed.
- TypeScript: passed. Content validation: passed.
- ESLint: no errors; 132 existing repository warnings.
- Browser: search returns the Vietnamese guide; unmatched search displays an honest empty state; clearing restores the complete collection: one lead, two supporting stories and 51 other guides.
- Browser at 320px and 390px: no horizontal document overflow on checked home/blog views. Mobile menu opens, receives focus and dismisses with Escape.
- Article contents link reaches section 7 at 90px below the viewport top, clear of the header.
- Added unit coverage for search normalization, multiple terms, empty query and compact client data; added E2E coverage for search recovery and article navigation.
- Hosted production-environment preview built successfully with the AdSense publisher guard passing. Blog index has 3 placements; Vietnamese article has 4 on desktop and mobile. Quran has 0 placements and no Google ad loader. Ad fill is not asserted.
- Tablet category gutters were corrected after browser review; the 768px grid now sits between x=20 and x=748.

## Review preview

[Hosted preview](https://humblehalalsg-ifxpcfkw2-nicholsmindset-gmailcoms-projects.vercel.app/blog) · [PR #437](https://github.com/nicholsmindset/humblehalalsg/pull/437). This has not been promoted to humblehalal.com.

Screenshots are saved in the task's `outputs/ux-audit-2026-10-08` folder: homepage before views, finished desktop blog, mobile article and mobile contents.

## Remaining measurement

Actual revenue, click-through rate and reading completion need production traffic data. This audit makes no claim of a measured uplift. Google controls ad fill; available placements do not guarantee an impression on every visit.

The PR dependency security check fails on the unchanged dependency stack: `GHSA-cjq9-62q9-8jv4` (Next.js) and `GHSA-vfj7-8cjw-p6xm` (Keystatic → chokidar → braces). Resolve these before production release; this visual change does not bypass the security check.

## Second layout pass

Following layout feedback, the homepage introduction now spans the top above a compact lead story and two supporting stories. The blog moves topic navigation above that three-story lead; supporting stories are removed from the later list so all 54 guides appear once. Mobile blog/category lists pair square thumbnails with titles and dates to reduce scrolling. The desktop lead image uses a 4:3 crop instead of an oversized hero.

TypeScript, changed-file lint and 14 discovery/ad-plan tests passed. Browser checks confirmed all 54 guide links, search for a supporting story, and no horizontal document overflow at 320px and 390px.
