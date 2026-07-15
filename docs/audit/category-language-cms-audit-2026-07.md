# Category language and CMS audit — July 2026

## Editorial rule

Use **halal** for food, ingredients, preparation, certification, cuisines,
catering, eateries, and food-by-location pages. For non-food businesses, name
the actual value or trust signal: **Muslim-owned**, **Muslim-friendly**,
**modest**, **Islamic**, or the plain service category.

This rule applies to the `/halal` directory hub, footer, landing-page H1,
metadata title and description, canonical URL, sitemap, internal links, and
area/category variants.

## Canonical category migrations

| Former label and URL | New label and canonical URL |
| --- | --- |
| Halal Beauty — `/halal-beauty-singapore` | Muslim-Friendly Beauty — `/muslim-friendly-beauty-singapore` |
| Halal Health & Medical — `/halal-health-singapore` | Muslim-Friendly Health & Medical — `/muslim-friendly-health-singapore` |
| Halal Modest Fashion — `/halal-fashion-singapore` | Modest Fashion — `/modest-fashion-singapore` |
| Halal Home Services — `/halal-services-singapore` | Muslim-Owned Home Services — `/muslim-owned-home-services-singapore` |
| Halal Automotive — `/halal-automotive-singapore` | Muslim-Owned Automotive Services — `/muslim-owned-automotive-services-singapore` |
| Halal Weddings — `/halal-weddings-singapore` | Malay & Muslim Wedding Vendors — `/muslim-wedding-vendors-singapore` |
| Halal Education — `/halal-education-singapore` | Islamic Education & Tuition — `/islamic-education-singapore` |
| Halal Professional — `/halal-professional-singapore` | Muslim-Owned Professional Services — `/muslim-owned-professional-services-singapore` |
| Halal Travel & Umrah — `/halal-travel-singapore` | Umrah & Muslim-Friendly Travel — `/muslim-friendly-travel-singapore` |

All former top-level URLs, former `/halal/...-singapore` URLs, and former
area/category slugs return a direct HTTP 301 to their new canonical equivalent.
Food categories retain Halal Restaurants, Halal Cafés, Halal Groceries, halal
cuisines, and halal food location/mall terminology.

## CMS implementation

Keystatic is available at `/keystatic` with a Blog posts collection. Local
development writes files to `content/posts`; production uses GitHub mode for
`nicholsmindset/humblehalalsg`. Published entries are merged with the legacy
typed posts, with a CMS entry overriding a legacy post that has the same slug.

Published CMS posts flow into:

- the blog index and article routes;
- blog category pages and related-post recommendations;
- metadata and BlogPosting/FAQ structured data;
- segmented blog sitemap;
- `llms.txt`; and
- the weekly digest's latest-guide selection.

The deployed dashboard requires the four Keystatic GitHub App variables listed
in `.env.example`. Only GitHub users with write access to the repository can
edit in GitHub mode.
